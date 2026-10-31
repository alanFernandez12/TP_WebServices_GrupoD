# Maintenance Service

Servicio independiente del Flujo B (mantenimiento preventivo asociado a una
reserva). Consume la confirmación de una reserva desde RabbitMQ, simula el
mantenimiento con una demora y publica el resultado. No usa base de datos y no
accede a la base principal `Rentar`: el resultado lo guarda el Rental Service.

## Flujo

```text
Rental Service (confirma la reserva y responde al cliente)
  -> reserva.confirmada
     -> rentar.mantenimiento.reservas
        -> Maintenance Service (registra la solicitud, espera y decide el resultado)
           -> mantenimiento.resultado
              -> rentar.reservas.mantenimiento.resultado
                 -> Rental Service
                    -> ft_reservas.desc_mantenimiento
```

La reserva se confirma y se responde al cliente **sin esperar** el
mantenimiento. Es informativo: no bloquea la reserva ni cambia el estado del
vehículo. Si este servicio está apagado, la reserva igual se confirma y queda
pendiente; al iniciarlo procesa los mensajes que quedaron en la cola.

## Eventos

Ambos se publican en el exchange `rentar.events` y usan `reservaId` como dato
principal.

| Evento (routing key) | Publica | Consume | Estructura |
|---|---|---|---|
| `reserva.confirmada` | Rental Service | Maintenance Service | `{ "reservaId": 150, "vehiculoId": 15, "fechaInicio": "2026-10-10T10:00:00", "fechaFin": "2026-10-15T10:00:00" }` |
| `mantenimiento.resultado` | Maintenance Service | Rental Service | `{ "reservaId": 150, "vehiculoId": 15, "resultado": "REALIZADO" }` |

Resultados posibles:

- `REALIZADO`
- `NO_REALIZADO`

En la tabla `ft_reservas`, la columna `desc_mantenimiento` queda en `NULL`
mientras no hay resultado (se muestra como "Pendiente" en el frontend).

## Configuración

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `MAINTENANCE_DELAY_SECONDS` | `30` | Demora simulada del mantenimiento, en segundos. |
| `MAINTENANCE_FORCE_RESULT` | vacío | Vacío = aleatorio (80 % `REALIZADO`, 20 % `NO_REALIZADO`). También acepta `REALIZADO` o `NO_REALIZADO` para forzar el resultado. |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VIRTUAL_HOST` | `localhost`, `5672`, `guest`, `guest`, `/` | Conexión con RabbitMQ. |

Las variables se leen una sola vez al iniciar: hay que reiniciar el servicio
para que un cambio tenga efecto.

## Preparación

1. Tener RabbitMQ iniciado (ver `services/messaging/README.md`).
2. Agregar la columna a la base `Rentar` ejecutando una sola vez:

   ```text
   Proyecto/BD/Hito3_FlujoB_mantenimiento.sql
   ```

3. Declarar las colas del Flujo B (desde la raíz del repositorio):

   ```bash
   python -m services.messaging.topology
   ```

4. Generar los archivos gRPC del Rental Service si cambió el `.proto`, ya que no
   se versionan:

   ```bash
   python -m grpc_tools.protoc -I=proto --python_out=services/rental-service/app --grpc_python_out=services/rental-service/app proto/rental.proto
   ```

El servicio utiliza `pika`, que ya se instala con las dependencias del
`vehicle-service` y del `rental-service`.

## Ejecución

Con el mismo entorno de Python del `vehicle-service`:

```bash
cd services/maintenance-service
../vehicle-service/.venv/bin/python app/maintenance.py
```

En Windows:

```powershell
cd services\maintenance-service
..\vehicle-service\.venv\Scripts\python.exe app\maintenance.py
```

El proceso queda esperando mensajes en `rentar.mantenimiento.reservas`. Por cada
solicitud registra `[SOLICITUD]`, espera la demora y registra `[RESULTADO]`. Los
mensajes inválidos no se reintentan; los errores inesperados se vuelven a poner
en la cola. Procesa un mensaje por vez.

## Cómo probarlo

1. Con el Rental Service y este servicio iniciados, crear una reserva desde la
   aplicación.
2. Consultar el resultado (`NULL` hasta que termina la demora):

   ```sql
   SELECT id_reserva, desc_estado_reserva, desc_mantenimiento
   FROM ft_reservas
   ORDER BY id_reserva DESC
   LIMIT 5;
   ```

3. Para ver el caso `NO_REALIZADO` sin esperar al azar:

   ```bash
   MAINTENANCE_FORCE_RESULT=NO_REALIZADO ../vehicle-service/.venv/bin/python app/maintenance.py
   ```

4. Para comprobar que no bloquea la reserva: detener este servicio, crear una
   reserva (se confirma igual y la columna queda en `NULL`) y volver a iniciarlo:
   la reserva pendiente se procesa sola.

Un `INSERT` directo en `ft_reservas` no dispara el flujo: el evento lo publica el
Rental Service al crear la reserva.
