# Dependencias de RabbitMQ

## Java

- `org.springframework.boot:spring-boot-starter-amqp`: integra la aplicación Spring Boot con RabbitMQ y proporciona la infraestructura AMQP para futuras operaciones de mensajería.

## Python

- `pika==1.3.2`: cliente Python para conectarse a RabbitMQ mediante AMQP. La topología compartida del Flujo A se encuentra en `services/messaging`.

La configuración inicial de conexión utiliza `localhost:5672` y las credenciales
locales `guest`/`guest`. `vehicle-service` publica las solicitudes y consume
los resultados; `vehicle-verifier` consume solicitudes y publica resultados.

## Topología configurada del Flujo A

La topología utiliza un exchange durable de tipo `topic`:

```text
Exchange: rentar.events
Tipo:     topic
Durable:  true
```

Los eventos se enrutan mediante routing keys iguales a los nombres definidos
por el Hito 3:

| Routing key | Cola durable | Consumidor previsto |
|---|---|---|
| `vehiculos.verificacion.solicitada` | `rentar.verificador.vehiculos` | Verificador de vehículos |
| `vehiculos.verificacion.resultado` | `rentar.vehiculos.verificacion.resultado` | Rentar |

El recorrido configurado es:

```text
Rentar
  -> rentar.events
     -> vehiculos.verificacion.solicitada
        -> rentar.verificador.vehiculos
           -> Verificador

Verificador
  -> rentar.events
     -> vehiculos.verificacion.resultado
        -> rentar.vehiculos.verificacion.resultado
           -> Rentar
```

Cada consumidor tiene su propia cola para evitar que el mensaje de resultado
sea distribuido entre componentes que no corresponden. La declaración se
realiza con:

```powershell
python -m services.messaging.topology
```

## Requisito y puesta en marcha

Es necesario tener Docker Desktop instalado y ejecutándose para levantar el contenedor de RabbitMQ.

RabbitMQ puede iniciarse directamente desde Docker Desktop creando un
contenedor con la imagen `rabbitmq:3-management`. Como alternativa,
desde PowerShell se puede ejecutar:

```powershell
docker run -d --name rentar-rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  rabbitmq:3-management
```

El puerto `5672` se utiliza para las conexiones AMQP de la aplicación y el puerto `15672` permite acceder a la interfaz de administración web en <http://localhost:15672>. Las credenciales predeterminadas son:

- Usuario: `guest`
- Contraseña: `guest`

Para comprobar que el contenedor está ejecutándose:

```powershell
docker ps
```

Para declarar el exchange, las colas y los bindings del Flujo A:

```powershell
python -m pip install -r services\messaging\requirements.txt
python -m services.messaging.topology
```

Para detenerlo:

```powershell
docker stop rentar-rabbitmq
```

Para volver a iniciarlo después de detenerlo:

```powershell
docker start rentar-rabbitmq
```

## Guía de prueba del Flujo A completo

1. **Preparar MySQL.** Verificar que la base `Rentar` y la tabla
   `lk_vehiculos` existan y que las credenciales de
   `services\vehicle-service\.env` sean correctas.

2. **Levantar RabbitMQ.** Desde la raíz del repositorio ejecutar:

   Desde Docker Desktop, iniciar el contenedor `rentar-rabbitmq`. También se
   puede ejecutar:

   ```powershell
   docker start rentar-rabbitmq
   ```

3. **Declarar la topología.** Ejecutar:

   ```powershell
   .\services\vehicle-service\.venv\Scripts\python.exe -m pip install -r services\vehicle-service\requirements.txt
   .\services\vehicle-service\.venv\Scripts\python.exe -m services.messaging.topology
   ```

   Deben existir el exchange `rentar.events` y la cola
   `rentar.verificador.vehiculos` en
   <http://localhost:15672>, usando `guest`/`guest`.

4. **Regenerar los stubs gRPC** si todavía no se hizo en el entorno:

   ```powershell
   .\services\vehicle-service\.venv\Scripts\python.exe -m grpc_tools.protoc `
     -I=proto `
     --python_out=services\vehicle-service\app `
     --grpc_python_out=services\vehicle-service\app `
     proto\vehicle.proto
   ```

5. **Iniciar `vehicle-service`.** Desde la raíz:

   ```powershell
   cd services\vehicle-service
   .\.venv\Scripts\python.exe app\server.py
   ```

   El servicio debe indicar que escucha en `localhost:9091`.

6. **Iniciar el API Gateway** en otra terminal:

   ```powershell
   cd api-gateway
   npm.cmd run dev
   ```

7. **Crear un vehículo por el Gateway.** El siguiente ejemplo usa una patente
   de prueba única:

   ```powershell
   $body = @{
       patente = "ZZ999ZZ"
       marca = "Toyota"
       modelo = "Corolla"
       anio = 2022
       tipoVehiculo = "SEDAN"
       color = "Blanco"
       precio_diario = "35000.00"
   } | ConvertTo-Json

   Invoke-RestMethod `
     -Method Post `
     -Uri "http://localhost:8085/api/vehiculos" `
     -ContentType "application/json" `
     -Body $body
   ```

8. **Verificar el resultado parcial.** Confirmar que:
   - el vehículo fue insertado en `Rentar.lk_vehiculos`;
   - la respuesta del Gateway contiene el `id`;
   - RabbitMQ muestra un mensaje en
     `rentar.verificador.vehiculos`;
   - el mensaje contiene exactamente `vehiculoId` y `patente`.

   El mensaje puede inspeccionarse desde la pestaña **Queues** de la consola
   de RabbitMQ usando **Get messages**. Si el verificador ya está ejecutándose,
   la cola puede quedar en cero porque el mensaje fue consumido.

11. **Configurar e iniciar el verificador.**

    ```powershell
    Copy-Item services\vehicle-verifier\.env.example services\vehicle-verifier\.env
    cd services\vehicle-verifier
    python -m pip install -r requirements.txt
    python app\verifier.py
    ```

    El servicio debe indicar que espera mensajes en
    `rentar.verificador.vehiculos`.

12. **Crear una patente no robada.** Registrar un vehículo con `AA123BB`.
    El verificador debe publicar en
    `rentar.vehiculos.verificacion.resultado`:

    ```json
    {
      "vehiculoId": 15,
      "patente": "AA123BB",
      "resultado": "VALIDADO"
    }
    ```

13. **Crear una patente robada.** Registrar un vehículo con `ROBO123`.
    El verificador debe publicar el mismo evento con:

    ```json
    {
      "vehiculoId": 16,
      "patente": "ROBO123",
      "resultado": "ROBADO"
    }
    ```

    El `vehicle-service` consume automáticamente esa cola. Para `ROBADO`,
    establece `lk_vehiculos.flag_activo = 0`; para `VALIDADO`, no modifica la
    base principal.

14. **Verificar la actualización en MySQL.** Ejecutar:

    ```sql
    SELECT id_vehiculo, cod_patente, flag_activo
    FROM lk_vehiculos
    WHERE cod_patente IN ('AA123BB', 'ROBO123');
    ```

    `AA123BB` debe conservar `flag_activo = 1`.
    `ROBO123` debe quedar con `flag_activo = 0`.

15. **Probar errores básicos.** Repetir el alta con la misma patente y
   verificar una respuesta `ALREADY_EXISTS` traducida por el Gateway. Probar
   también un precio inválido o un campo obligatorio vacío y verificar una
   respuesta `INVALID_ARGUMENT`.
