# Flujo A: verificación de vehículos

## Objetivo

El Flujo A verifica de forma asíncrona si un vehículo registrado en Rentar
figura como robado en un registro policial externo simulado.

Cuando el resultado es `ROBADO`, el vehículo se desactiva en Rentar para que no
continúe disponible para alquiler. Cuando el resultado es `VALIDADO`, se
registra la verificación sin modificar la activación manual del vehículo.

## Recorrido completo

```text
Frontend
  -> API Gateway
    -> vehicle-service (gRPC)
      -> INSERT en Rentar.lk_vehiculos
      -> publica vehiculos.verificacion.solicitada
        -> RabbitMQ
          -> vehicle-verifier
            -> consulta rentar_policial.lk_registro_policial
            -> publica vehiculos.verificacion.resultado
              -> RabbitMQ
                -> vehicle-service
                  -> actualiza Rentar.lk_vehiculos
```

RabbitMQ se utiliza como intermediario. El `vehicle-verifier` no modifica
directamente la base principal `Rentar`.

## Topología RabbitMQ

La topología se define en `services/messaging/topology.py`.

| Elemento | Valor |
|---|---|
| Exchange | `rentar.events` |
| Tipo | `topic` |
| Solicitud | `vehiculos.verificacion.solicitada` |
| Cola del verificador | `rentar.verificador.vehiculos` |
| Resultado | `vehiculos.verificacion.resultado` |
| Cola de Rentar | `rentar.vehiculos.verificacion.resultado` |

Los exchanges, colas y bindings son durables y la declaración es idempotente.
Los componentes publican al exchange, no directamente a las colas.

La topología puede declararse desde la raíz del proyecto:

```powershell
.\services\vehicle-service\.venv\Scripts\python.exe `
  -m services.messaging.topology
```

## Archivos agregados

### Mensajería compartida

- `services/messaging/__init__.py`
  - Define el paquete común de mensajería.
- `services/messaging/topology.py`
  - Centraliza nombres del exchange, routing keys, colas y configuración de
    RabbitMQ.
- `services/messaging/requirements.txt`
  - Dependencia `pika`.
- `services/messaging/README.md`
  - Descripción de la topología.

### Publicación desde Rentar

- `services/vehicle-service/app/vehicle_verification_publisher.py`
  - Publica `vehiculos.verificacion.solicitada` después de insertar el
    vehículo.
  - El mensaje contiene `vehiculoId` y `patente`.
  - El vehículo se guarda antes de publicar el evento.

Ejemplo:

```json
{
  "vehiculoId": 15,
  "patente": "ROBO123"
}
```

### Verificador policial

- `services/vehicle-verifier/app/verifier.py`
  - Consume `rentar.verificador.vehiculos`.
  - Consulta la base `rentar_policial`.
  - Publica el resultado en el exchange.
  - Confirma la solicitud solo después de publicar el resultado.
- `services/vehicle-verifier/app/police_registry.py`
  - Consulta `lk_registro_policial`.
- `services/vehicle-verifier/sql/schema.sql`
  - Crea la tabla policial y carga datos de prueba.
- `services/vehicle-verifier/requirements.txt`
  - Dependencias de MySQL, dotenv y RabbitMQ.
- `services/vehicle-verifier/.env.example`
  - Variables de entorno del verificador.
- `services/vehicle-verifier/README.md`
  - Instrucciones de instalación y ejecución.

El registro policial utiliza:

```sql
lk_registro_policial (
    cod_patente,
    flag_robada
)
```

Datos de prueba incluidos:

| Patente | Resultado |
|---|---|
| `AA123BB` | `VALIDADO` |
| `ROBO123` | `ROBADO` |

### Consumidor final en Rentar

- `services/vehicle-service/app/vehicle_verification_result_consumer.py`
  - Consume `rentar.vehiculos.verificacion.resultado`.
  - Valida el payload.
  - Actualiza la base principal.
  - Usa `ACK` después de confirmar la actualización.
  - Usa `NACK` sin reintento para mensajes inválidos.
  - Usa `NACK` con reintento para errores inesperados.

El consumidor se inicia automáticamente dentro de `vehicle-service`, en un hilo
separado del servidor gRPC.

## Cambios en la base de datos

### Nueva columna

Se agregó `desc_verificacion` a `Rentar.lk_vehiculos`:

```sql
desc_verificacion VARCHAR(20) NULL DEFAULT 'PENDIENTE'
```

El esquema actualizado está en:

```text
Proyecto/BD/RentarBD.sql
```

Para una base ya creada, los registros existentes no agregan la columna por sí
solos. La columna debe existir antes de iniciar el consumidor. Se puede aplicar
la migración:

```sql
USE Rentar;

ALTER TABLE lk_vehiculos
ADD COLUMN desc_verificacion VARCHAR(20) NULL DEFAULT 'PENDIENTE';
```

La misma sentencia está en:

```text
Proyecto/BD/Hito3_FlujoA.sql
```

Este script modifica la estructura, pero no elimina ni recrea los vehículos
existentes.

### Método de persistencia

En `services/vehicle-service/app/vehicle_repository.py` se agregó
`update_verification(...)`.

La operación:

1. Verifica que coincidan `id_vehiculo` y `cod_patente`.
2. Guarda `VALIDADO` o `ROBADO` en `desc_verificacion`.
3. Establece `flag_activo = 0` únicamente para `ROBADO`.
4. Conserva el valor actual de `flag_activo` para `VALIDADO`.
5. Es idempotente para mensajes repetidos.

Para un resultado `ROBADO`, el efecto es equivalente a:

```sql
UPDATE lk_vehiculos
SET desc_verificacion = 'ROBADO',
    flag_activo = 0
WHERE id_vehiculo = <vehiculoId>
  AND cod_patente = <patente>;
```

La base policial solo se consulta; nunca se modifica.

## Cambios en `vehicle-service`

En `services/vehicle-service/app/server.py`:

- Se crea el repositorio de vehículos.
- Se inicia `VehicleVerificationResultConsumer` en un hilo daemon.
- Se mantiene el servidor gRPC para las operaciones normales.

El proceso debe mostrar un mensaje similar a:

```text
Esperando resultados en rentar.vehiculos.verificacion.resultado
```

También se agregó `pika==1.3.2` a:

```text
services/vehicle-service/requirements.txt
```

## Configuración

### `vehicle-service`

Archivo:

```text
services/vehicle-service/.env
```

Variables principales:

```env
VEHICLE_GRPC_PORT=9091
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Rentar
DB_USER=root
DB_PASSWORD=<contraseña>
```

### `vehicle-verifier`

Crear el archivo:

```powershell
Copy-Item `
  .\services\vehicle-verifier\.env.example `
  .\services\vehicle-verifier\.env
```

Configurar en `services/vehicle-verifier/.env` las credenciales de la base
policial:

```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest

POLICE_DB_HOST=localhost
POLICE_DB_PORT=3306
POLICE_DB_NAME=rentar_policial
POLICE_DB_USER=root
POLICE_DB_PASSWORD=<contraseña>
```

## Inicio de dependencias y procesos

Antes de iniciar la aplicación deben estar disponibles:

- RabbitMQ en Docker Desktop, con los puertos `5672` y `15672`.
- MySQL con las bases `Rentar` y `rentar_policial`.
- La columna `desc_verificacion` en `Rentar.lk_vehiculos`.

Los scripts:

```text
start_services.py
start_services_sin_spring.py
```

fueron actualizados para iniciar también `vehicle-verifier` en una consola
separada, utilizando el entorno virtual de `vehicle-service`.

Para iniciar el conjunto sin Spring Boot:

```powershell
python .\start_services_sin_spring.py
```

Para iniciar el conjunto completo:

```powershell
python .\start_services.py
```

El lanzador inicia el verificador con un comando equivalente a:

```powershell
.\services\vehicle-service\.venv\Scripts\python.exe `
  .\services\vehicle-verifier\app\verifier.py
```

## Prueba de extremo a extremo

1. Iniciar RabbitMQ desde Docker Desktop.
2. Confirmar que MySQL está ejecutándose.
3. Verificar que existe `desc_verificacion`.
4. Confirmar que `ROBO123` está marcada como robada:

   ```sql
   SELECT *
   FROM rentar_policial.lk_registro_policial
   WHERE cod_patente = 'ROBO123';
   ```

5. Iniciar los servicios con uno de los scripts.
6. Confirmar que aparecen estos mensajes:

   ```text
   Esperando solicitudes en rentar.verificador.vehiculos
   Esperando resultados en rentar.vehiculos.verificacion.resultado
   ```

7. Registrar un vehículo con patente `ROBO123`.
8. Verificar el resultado en Rentar:

   ```sql
   SELECT id_vehiculo,
          cod_patente,
          desc_verificacion,
          flag_activo
   FROM Rentar.lk_vehiculos
   WHERE cod_patente = 'ROBO123'
   ORDER BY id_vehiculo DESC;
   ```

Resultado esperado:

```text
desc_verificacion = ROBADO
flag_activo       = 0
```

Para una patente como `AA123BB`, el resultado esperado es:

```text
desc_verificacion = VALIDADO
```

y `flag_activo` conserva el valor que tenía antes de la verificación.

## Estado de las colas

En RabbitMQ:

- `Ready` indica mensajes pendientes de ser entregados.
- `Unacked` indica mensajes entregados a un consumidor pero todavía no
  confirmados.
- `Total` es la suma de mensajes listos y no confirmados.

Es normal que una cola quede en `Ready = 0` después de iniciar el consumidor:
el mensaje puede haber sido procesado y confirmado inmediatamente. Si los
mensajes permanecen en `Ready`, el proceso correspondiente no está conectado
o se cerró por un error de configuración.

## Corrección del callback del verificador

El callback de Pika recibe cuatro argumentos:

```text
channel, method, properties, body
```

Se corrigió `VehicleVerifier.handle_message` para utilizar esa firma y obtener
el `delivery_tag` desde `method.delivery_tag`. Sin esta corrección, el proceso
podía conectarse a RabbitMQ pero cerrarse al recibir el primer mensaje.

## Documentación relacionada

- `HITO3_CONTEXT_DER.md`
- `RABBITMQ_DEPENDENCIES.md`
- `services/messaging/README.md`
- `services/vehicle-service/README.md`
- `services/vehicle-verifier/README.md`
