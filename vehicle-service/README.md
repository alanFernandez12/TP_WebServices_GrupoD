# Vehicle Service

Servicio gRPC de vehículos para Rentar, desarrollado con Node.js y TypeScript.

El servicio implementa el contrato compartido:

```text
../proto/vehicle.proto
```

Actualmente utiliza una lista en memoria para simplificar las pruebas. Los
datos se reinician cada vez que se detiene el proceso; no reemplaza todavía a
una base de datos.

## Estructura

```text
vehicle-service/
├── src/
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json
```

- `src/server.ts`: carga el contrato, implementa `VehicleService` y levanta el servidor gRPC.
- `.env`: configura el puerto del servicio.
- `package.json`: contiene los comandos y dependencias del proyecto.

## Operaciones gRPC

El servidor implementa las cuatro operaciones de `vehicle.proto`:

| Operación | Descripción |
|---|---|
| `GetVehicles` | Devuelve todos los vehículos en memoria. |
| `GetVehicle` | Devuelve un vehículo por ID. |
| `GetAvailableVehicles` | Devuelve los vehículos cuyo estado es `DISPONIBLE`. |
| `UpdateVehicleStatus` | Actualiza el estado de un vehículo por ID. |

`GetAvailableVehicles` valida que `fechaInicio` y `fechaFin` estén presentes,
pero en esta versión simple no calcula reservas por fecha. Solamente filtra
por estado.

## Configuración

El archivo `.env` contiene:

```env
VEHICLE_GRPC_PORT=9091
```

El API Gateway ya apunta por defecto a:

```env
VEHICLE_SERVICE_URL=localhost:9091
```

Si se cambia el puerto del servidor, también hay que actualizar
`VEHICLE_SERVICE_URL` en `api-gateway/.env`.

## Instalación

Desde la raíz del repositorio:

```powershell
cd vehicle-service
npm install
```

## Ejecución en desarrollo

```powershell
npm run dev
```

El servidor quedará escuchando en:

```text
localhost:9091
```

Para compilar:

```powershell
npm run build
```

Para ejecutar la versión compilada:

```powershell
npm start
```

## Probarlo junto con el API Gateway

Abrir dos terminales.

En la primera:

```powershell
cd vehicle-service
npm run dev
```

En la segunda:

```powershell
cd api-gateway
npm run dev
```

Después consultar el Gateway:

```powershell
Invoke-RestMethod http://localhost:8085/api/vehiculos
Invoke-RestMethod http://localhost:8085/api/vehiculos/1
```

La respuesta debería contener los vehículos definidos en `src/server.ts`.

Para consultar disponibilidad:

```powershell
Invoke-RestMethod "http://localhost:8085/api/vehiculos/disponibles?fechaInicio=2026-10-05&fechaFin=2026-10-10"
```

El contrato usa los nombres `fechaInicio` y `fechaFin`. El cliente actual del
Gateway envía esos campos como `fecha_inicio` y `fecha_fin`, por lo que esa
parte debe alinearse antes de probar el endpoint de disponibilidad a través
del Gateway. Las consultas `GetVehicles` y `GetVehicle` no tienen esa
inconsistencia.

## Errores gRPC implementados

- `NOT_FOUND`: el ID solicitado no existe.
- `INVALID_ARGUMENT`: faltan fechas para disponibilidad o falta el estado.

El API Gateway convierte esos estados gRPC en respuestas HTTP.
