# Flujo B: incorporación de vehículos de clientes

## Alcance implementado

El Flujo B permite que un cliente registre un vehículo de su propiedad para
incorporarlo posteriormente al sistema. La incorporación comienza de forma
asíncrona y el vehículo se crea inicialmente en estado `PENDIENTE`.

Hasta el momento se implementaron:

- relación entre vehículos y clientes;
- alta externa separada del alta administrativa;
- evento inicial `vehiculos.externos.registrados`;
- topología RabbitMQ propia del Flujo B;
- verificador independiente de patentes;
- evento `vehiculos.externos.validacion.patente`;
- verificador independiente de titularidad;
- correlación persistente de los resultados de patente y titularidad;
- evento `vehiculos.externos.validacion.completada`;
- actualización del estado del vehículo al finalizar la correlación;
- conversión de resultados rechazados a estado final `RECHAZADO`.

El Flujo A continúa utilizando sus propios endpoints, eventos, colas y
consumidores.

## Diferencia con el Flujo A

| Tipo de alta | Quién la ejecuta | Endpoint | Estado inicial | Flujo |
|---|---|---|---|---|
| Alta administrativa | Administrador | `POST /api/vehiculos` | `DISPONIBLE` | Flujo A |
| Alta externa | Cliente autenticado | `POST /api/vehiculos-externos` | `PENDIENTE` | Flujo B |

El cliente puede consultar sus solicitudes mediante `GET /api/vehiculos-externos/mis-solicitudes`.
La identidad se obtiene de la sesión autenticada; no se acepta un `clienteId` enviado por el frontend.

El endpoint administrativo no fue reemplazado ni modificado para disparar el
Flujo B.

## Modelo de datos

Se reutiliza la tabla existente `Rentar.lk_vehiculos`. Se agregó una relación
opcional con `Rentar.lk_clientes`:

```text
lk_clientes 1 ─────── N lk_vehiculos
```

La columna agregada es:

```sql
id_cliente BIGINT NULL
```

También se agregaron:

- índice `idx_vehiculos_cliente`;
- clave foránea `fk_vehiculo_cliente`.

La correlación de las validaciones se persiste en la tabla
`Rentar.ft_incorporacion_correlacion`. La tabla conserva los resultados
independientes de patente y titularidad asociados mediante
`vehiculo_externo_id`, junto con el resultado final, las fechas del proceso y
la marca de publicación del evento de completada.

Interpretación:

- `id_cliente = NULL`: vehículo registrado por un administrador;
- `id_cliente = <id>`: vehículo registrado por un cliente.

El identificador generado en `lk_vehiculos.id_vehiculo` se utiliza como
`vehiculoExternoId` en los eventos del Flujo B. No se creó un identificador
adicional.

### Estado inicial y resultado de rechazo

Un vehículo externo se crea con:

```text
desc_estado_vehiculo = PENDIENTE
flag_activo = 1
id_cliente = cliente autenticado
```

Los vehículos `PENDIENTE` no aparecen como disponibles para reservar, porque
la consulta de disponibilidad exige:

```text
flag_activo = 1
desc_estado_vehiculo = DISPONIBLE
```

Cuando una validación de patente detecta que el vehículo fue robado, el
verificador publica `resultado: RECHAZADO`. El correlador espera ambos
resultados, marca la correlación como `RECHAZADO` si alguno fue rechazado y
mantiene el vehículo en estado `PENDIENTE` e inactivo. Solo cuando ambos
resultados son `VALIDADO`, el vehículo pasa a estado `DISPONIBLE` y activo.

## Endpoint de alta externa

### Ruta

```http
POST /api/vehiculos-externos
```

La ruta está protegida para usuarios con rol `CLIENTE`. El `clienteId` no se
acepta desde el body: se obtiene desde la sesión autenticada creada por el
middleware del API Gateway.

Antes de invocar al servicio de vehículos, el Gateway valida que el cliente
exista en la sesión y que se encuentre activo.

### Body esperado

```json
{
  "patente": "DEF456",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2020,
  "tipoVehiculo": "SEDAN",
  "color": "Negro",
  "precio_diario": 25000
}
```

Se validan:

- patente;
- marca;
- modelo;
- tipo de vehículo;
- color;
- año positivo;
- precio no negativo con hasta dos decimales.

### Comportamiento

El endpoint:

1. identifica al cliente autenticado;
2. valida los datos básicos;
3. crea el vehículo con estado `PENDIENTE`;
4. asocia el vehículo al cliente mediante `id_cliente`;
5. publica `vehiculos.externos.registrados`;
6. responde con el vehículo pendiente sin esperar las validaciones.

El RPC utilizado internamente es:

```text
VehicleService.CreateExternalVehicle
```

## Eventos del Flujo B

Todos los eventos utilizan el exchange compartido:

```text
rentar.events
```

El Flujo B tiene routing keys y colas propias para no interferir con el
Flujo A.

### Registro del vehículo externo

Routing key:

```text
vehiculos.externos.registrados
```

Payload:

```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "patente": "DEF456",
  "documento": "30123456"
}
```

El documento se obtiene del cliente autenticado mediante Customer Service; no
se acepta desde el body del frontend. Este evento se publica después de
insertar correctamente el vehículo.

### Resultado de validación de patente

Routing key:

```text
vehiculos.externos.validacion.patente
```

Payload:

```json
{
  "vehiculoExternoId": 50,
  "patente": "DEF456",
  "resultado": "VALIDADO"
}
```

Si la patente figura como robada en el registro policial simulado:

```json
{
  "vehiculoExternoId": 50,
  "patente": "ROBO123",
  "resultado": "RECHAZADO"
}
```

Los resultados del Flujo B utilizan `VALIDADO` y `RECHAZADO`, de acuerdo con
el requerimiento. El Flujo A conserva su comportamiento actual y continúa
utilizando sus propios resultados.

## Topología RabbitMQ

La topología se define en:

```text
services/messaging/topology.py
```

### Colas

| Cola | Recibe |
|---|---|
| `rentar.verificador.externos.patente` | `vehiculos.externos.registrados` |
| `rentar.verificador.externos.titularidad` | `vehiculos.externos.registrados` |
| `rentar.correlador.externos` | resultados de patente y titularidad |
| `rentar.incorporacion.externos` | `vehiculos.externos.validacion.completada` |

Las colas son durables y se declaran de forma idempotente junto con las colas
del Flujo A.

## Verificador de patente

Archivo:

```text
services/vehicle-verifier/app/external_verifier.py
```

Responsabilidades:

- consumir altas externas;
- consultar `rentar_policial.lk_registro_policial`;
- publicar únicamente el resultado de patente del Flujo B;
- confirmar el mensaje solo después de publicar el resultado;
- rechazar mensajes inválidos sin reintento;
- volver a poner en cola errores inesperados.

El verificador no modifica directamente la base principal `Rentar`.

### Ejecución

Con RabbitMQ y la base policial disponibles:

```powershell
cd services\vehicle-verifier
python app\external_verifier.py
```

La configuración se obtiene desde:

```text
services/vehicle-verifier/.env
```

El registro policial de prueba contiene, entre otras, estas patentes:

| Patente | Resultado Flujo B |
|---|---|
| `AA123BB` | `VALIDADO` |
| `ROBO123` | `RECHAZADO` |

La validación de patente simula una demora de consulta externa antes de
consultar el registro policial. Se configura con
`EXTERNAL_PATENT_VERIFIER_DELAY_SECONDS`, utiliza 30 segundos por defecto y
puede establecerse en `0` para pruebas. La validación de titularidad mantiene
su demora configurable mediante `OWNERSHIP_VERIFIER_DELAY_SECONDS`.

## Correlador de validaciones

Archivo:

```text
services/vehicle-correlator/app/correlator.py
```

El correlador consume los resultados de patente y titularidad desde
`rentar.correlador.externos` y los persiste de forma transaccional en
`ft_incorporacion_correlacion`. Los resultados pueden llegar en cualquier
orden y se conservan hasta completar la correlación:

- ambos resultados `VALIDADO`: marca el vehículo como `DISPONIBLE`, activa el
  registro y publica `vehiculos.externos.validacion.completada`;
- al menos un resultado `RECHAZADO`: marca la correlación como `RECHAZADO`,
  mantiene el vehículo `PENDIENTE` e inactivo y no publica el evento final;
- mensajes repetidos después de una decisión terminal: se confirman sin
  volver a publicar el evento final.

La marca `evento_completada_publicado` evita publicaciones duplicadas cuando
se reintenta el procesamiento del mensaje.

### Ejecución

```powershell
cd services\vehicle-correlator
python app\correlator.py
```

El componente utiliza las variables `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER` y `DB_PASSWORD` para conectarse a la base `Rentar`.

## Archivos principales modificados o agregados

### Base de datos

- `Proyecto/BD/RentarBD.sql`
- `Proyecto/BD/Hito3_FlujoB.sql`
- `services/vehicle-correlator/app/correlation_repository.py`
- `services/vehicle-correlator/README.md`

### Contrato y Gateway

- `proto/vehicle.proto`
- `api-gateway/src/app.ts`
- `api-gateway/src/middleware/auth.ts`
- `api-gateway/src/routes/externalVehicleRoutes.ts`
- `api-gateway/src/controllers/externalVehicleController.ts`
- `api-gateway/src/services/vehicleService.ts`

### Servicio de vehículos

- `services/vehicle-service/app/server.py`
- `services/vehicle-service/app/vehicle_repository.py`
- `services/vehicle-service/app/external_vehicle_publisher.py`
- `services/vehicle-service/app/vehicle_pb2.py`
- `services/vehicle-service/app/vehicle_pb2_grpc.py`

### Mensajería y verificación

- `services/messaging/topology.py`
- `services/messaging/README.md`
- `services/vehicle-correlator/app/correlator.py`
- `services/vehicle-verifier/app/external_verifier.py`
- `services/vehicle-verifier/README.md`

## Migración de la base de datos

Para una base nueva, ejecutar:

```powershell
mysql -u root -p Rentar < .\Proyecto\BD\RentarBD.sql
```

Para una base existente que todavía utiliza el nombre anterior, realizar un
respaldo y ejecutar una sola vez:

```sql
RENAME TABLE incorporacion_correlacion
TO ft_incorporacion_correlacion;
```

El script `Hito3_FlujoB.sql` agrega `id_cliente`, su índice, la clave foránea
y crea `ft_incorporacion_correlacion` cuando todavía no existe. No se debe
ejecutar el `RENAME TABLE` si la tabla ya tiene el nombre nuevo.

## Estado actual del recorrido

Actualmente el recorrido implementado es:

```text
Cliente autenticado
  -> POST /api/vehiculos-externos
  -> lk_vehiculos en estado PENDIENTE
  -> vehiculos.externos.registrados
  -> verificador de patente (demora simulada)
  -> vehiculos.externos.validacion.patente
  -> validador de titularidad (demora simulada)
  -> vehiculos.externos.validacion.titularidad
  -> correlador
  -> vehiculos.externos.validacion.completada
```

También se implementó el correlador independiente con persistencia en MySQL:

```text
services/vehicle-correlator/app/correlator.py
```

El correlador consume `rentar.correlador.externos`, conserva los resultados en
`ft_incorporacion_correlacion` y publica
`vehiculos.externos.validacion.completada` cuando recibe `VALIDADO` para
patente y titularidad. Un `RECHAZADO` cierra la correlación sin publicar el
evento de completada.

El evento de alta incluye el documento del cliente autenticado, obtenido por el
API Gateway desde Customer Service. El validador de titularidad recibe y
publica el siguiente contrato:

```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "documento": "30123456",
  "patente": "DEF456",
  "resultado": "VALIDADO"
}
```

El evento final solo debe publicarse cuando patente y titularidad sean
`VALIDADO`:

```json
{
  "vehiculoExternoId": 50
}
```

## Validación realizada

Se verificó:

- compilación TypeScript del API Gateway;
- compilación sintáctica de los servicios Python, incluido el correlador;
- regeneración de los bindings Python desde `proto/vehicle.proto`;
- ausencia de referencias al nombre anterior de la tabla;
- ausencia de errores de whitespace en el diff.
