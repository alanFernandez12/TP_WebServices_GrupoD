# Integración híbrida de reservas

## Objetivo

Las reservas fueron migradas al flujo gRPC porque el contrato `proto/rental.proto` ya define las operaciones necesarias:

- `CreateRental`: alta de una reserva.
- `GetRentals`: listado de reservas.
- `GetRental`: consulta individual.
- `CancelRental`: cancelación.
- `GetRentalHistory`: historial por cliente.

El frontend ahora consume esas operaciones a través del API Gateway, que se comunica con `rental-service` usando gRPC.

## Flujo implementado

```text
Frontend
  ├─ POST  /gateway/reservas
  ├─ GET   /gateway/reservas
  └─ PATCH /gateway/reservas/:id/cancelar
          └─ API Gateway :8085
                 └─ gRPC RentalService :9093
                        └─ MySQL
```

En esta etapa las reservas no utilizan los endpoints REST de Spring. El alta y la cancelación pasan por el contrato gRPC para mantener las validaciones y transacciones implementadas en `rental-service`.

## Cambios realizados

### API Gateway

El gateway ya contaba con las rutas y clientes gRPC de reservas. Se agregó una normalización de respuestas para que el frontend conserve sus nombres:

| Campo gRPC | Campo frontend |
|---|---|
| `cliente_id` | `idCliente` |
| `vehiculo_id` | `idVehiculo` |
| `fecha_inicio` | `horaInicio` |
| `fecha_fin` | `horaFin` |
| `estado` | `estadoReserva` |
| `importe_total` | `importeTotal` |

Además, los wrappers protobuf `{ rentals: [...] }` y `{ rental: {...} }` se convierten en arrays y objetos JSON directos.

### Frontend

Se modificaron las funciones de reservas:

```text
crearReserva       -> POST  /gateway/reservas
obtenerReservas    -> GET   /gateway/reservas
cancelarReserva    -> PATCH /gateway/reservas/:id/cancelar
```

La consulta GraphQL anterior no se elimina: se conserva como `obtenerReservasGraphQL()` en
`frontend/src/services/api.ts` para poder comparar contratos o volver a utilizarla.
La función activa del dashboard es `obtenerReservas()`, que consume la nueva ruta gRPC
mediante el gateway.

### Servicio gRPC

`rental-service` ya implementaba el contrato completo y usa la base compartida `Rentar`. No fue necesario agregar nuevos RPCs. El servicio valida fechas futuras, clientes y vehículos activos, disponibilidad y conflictos de reservas.

## Configuración

El archivo `services/rental-service/.env` debe contener:

```env
RENTAL_GRPC_PORT=9093
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Rentar
DB_USER=root
DB_PASSWORD=tu_password
```

El gateway debe tener en `api-gateway/.env`:

```env
PORT=8085
RENTAL_SERVICE_URL=localhost:9093
CUSTOMER_SERVICE_URL=localhost:9092
VEHICLE_SERVICE_URL=localhost:9091
```

## Puesta en marcha

Desde la raíz del repositorio:

```powershell
.\services\vehicle-service\.venv\Scripts\python.exe services\rental-service\app\server.py
```

Luego iniciar el gateway:

```powershell
cd api-gateway
npm.cmd run dev
```

Y el frontend:

```powershell
cd frontend
npm.cmd run dev
```

También se puede utilizar el lanzador:

```powershell
python start_services_sin_spring.py
```

Este lanzador inicia frontend, gateway, vehicle-service, customer-service y rental-service, pero no inicia el Spring Boot principal.
