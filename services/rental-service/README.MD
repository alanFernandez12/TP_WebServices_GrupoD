# Rental Service

Servicio gRPC de reservas y alquileres de Rentar, desarrollado con Python.

Implementa el contrato compartido:

```text
../../proto/rental.proto
```

Utiliza la base MySQL `Rentar`:

- `ft_reservas` para crear, consultar y cancelar reservas, y consultar el historial.
- `lk_clientes` y `lk_vehiculos` para validar cliente, vehículo, estado y disponibilidad.
- `lk_tiempo` para relacionar la reserva con su fecha.

## Estructura

```text
services/rental-service/
├── app/
│   ├── database.py
│   ├── errors.py
│   ├── rental_repository.py
│   └── server.py
├── .env
└── requirements.txt
```

- `app/server.py`: implementa `RentalService` e inicia el servidor gRPC.
- `app/database.py`: administra el pool de conexiones a MySQL.
- `app/rental_repository.py`: contiene las consultas y operaciones sobre la base.
- `app/errors.py`: define errores de validación y de negocio.
- `app/rental_pb2.py` y `app/rental_pb2_grpc.py`: archivos generados desde `rental.proto`.
- `.env`: configura el puerto y la conexión local a MySQL.

## Operaciones gRPC

| Operación | Descripción |
|---|---|
| `CreateRental` | Crea una reserva si las fechas y los IDs son válidos, el cliente y el vehículo están activos y el vehículo está disponible. |
| `GetRentals` | Devuelve todas las reservas. |
| `GetRental` | Devuelve una reserva por ID. |
| `CancelRental` | Cancela una reserva antes de su fecha de inicio. |
| `GetRentalHistory` | Devuelve las reservas terminadas o canceladas de un cliente. |

Al crear una reserva, el servicio calcula la duración en días, conserva el precio diario histórico y calcula el importe total. La reserva se crea con estado `CONFIRMADA`.

Las fechas se envían en formato ISO 8601, sin zona horaria. Ejemplo:

```text
2026-12-10T10:00:00
```


## Instalación

Desde la raíz del repositorio, crear el entorno virtual e instalar las dependencias:

```powershell
python -m venv services\rental-service\.venv
.\services\rental-service\.venv\Scripts\python.exe -m pip install -r services\rental-service\requirements.txt
```


Si el entorno virtual ya existe, se puede omitir el primer comando.

## Generar las clases gRPC

Desde la raíz del repositorio:

```powershell
.\services\rental-service\.venv\Scripts\python.exe -m grpc_tools.protoc -I=proto --python_out=services/rental-service/app --grpc_python_out=services/rental-service/app proto/rental.proto
```

Esto genera `rental_pb2.py` y `rental_pb2_grpc.py` dentro de `services/rental-service/app`.

Hay que repetir este paso si se modifica `proto/rental.proto`.

## Ejecutar

Antes de iniciar el servicio, verificar que MySQL esté ejecutándose y que `services/rental-service/.env` tenga la configuración correcta.

Desde la raíz del repositorio:

```powershell
cd services\rental-service
.\.venv\Scripts\python.exe app\server.py
```

El servicio queda escuchando por defecto en:

```text
localhost:9093
```

Dejar la terminal abierta mientras se utiliza el servicio.

## Integración con el API Gateway

El API Gateway se comunica con Rental Service mediante gRPC. Su cliente utiliza por defecto:

```text
localhost:9093
```

Para probar el recorrido a través del Gateway, iniciar en terminales separadas:

1. MySQL.
2. Customer Service en `9092`.
3. Vehicle Service en `9091`.
4. Rental Service en `9093`.
5. API Gateway en `8085`.

Desde la raíz del repositorio, iniciar el Gateway con:

```powershell
cd api-gateway
npm run dev
```

No iniciar `npm run mock:rental` al mismo tiempo que Rental Service, ya que ambos usan el puerto `9093`.

## Probar desde PowerShell

Con los servicios y el Gateway iniciados, crear una reserva enviando la solicitud al Gateway:

```powershell
$body = @{
    clienteId = 1
    vehiculoId = 1
    fechaInicio = "2026-12-10T10:00:00"
    fechaFin = "2026-12-12T10:00:00"
} | ConvertTo-Json

$alta = Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8085/api/reservas" `
    -ContentType "application/json" `
    -Body $body

$alta | ConvertTo-Json -Depth 8
```

El Gateway valida al cliente y al vehículo antes de solicitar la creación a Rental Service. Las fechas elegidas deben ser futuras y no superponerse con otra reserva activa del vehículo.

Consultar todas las reservas:

```powershell
Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8085/api/reservas" |
    ConvertTo-Json -Depth 8
```

Consultar una reserva por ID:

```powershell
$id = $alta.rental.id

Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8085/api/reservas/$id" |
    ConvertTo-Json -Depth 8
```

Cancelar una reserva futura:

```powershell
Invoke-RestMethod `
    -Method Patch `
    -Uri "http://localhost:8085/api/reservas/$id/cancelar" |
    ConvertTo-Json -Depth 8
```

Consultar el historial del cliente:

```powershell
Invoke-RestMethod `
    -Method Get `
    -Uri "http://localhost:8085/api/reservas/historial/1" |
    ConvertTo-Json -Depth 8
```

## Base de datos y arquitectura

La interfaz web debe enviar sus solicitudes al API Gateway; no debe conectarse directamente a Rental Service. El Gateway recibe HTTP y se comunica con este servicio por gRPC.

En la implementación actual, Rental Service utiliza la base MySQL `Rentar`, compartida con otros componentes del proyecto. El diagrama de la consigna muestra una base por servicio; esta implementación todavía no separa físicamente la base de Rental Service.

