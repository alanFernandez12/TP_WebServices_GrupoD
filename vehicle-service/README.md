# Vehicle Service

Servicio gRPC de vehículos para Rentar, desarrollado con Node.js y TypeScript.

El servicio implementa el contrato compartido:

```text
../proto/vehicle.proto
```

Utiliza la misma base de datos MySQL `Rentar` que utiliza el servidor Java.
Lee y actualiza la tabla `lk_vehiculos`, y consulta `ft_reservas` para calcular
la disponibilidad.

## Estructura

```text
vehicle-service/
├── src/
│   ├── database.ts
│   ├── server.ts
│   └── vehicleRepository.ts
├── .env
├── package.json
└── tsconfig.json
```

- `src/database.ts`: crea el pool y verifica la conexión a MySQL.
- `src/server.ts`: carga el contrato, implementa `VehicleService` y levanta el servidor gRPC.
- `src/vehicleRepository.ts`: contiene las consultas a `lk_vehiculos` y `ft_reservas`.
- `.env`: configura el puerto gRPC y la conexión a la base.
- `package.json`: contiene los comandos y dependencias del proyecto.

## Operaciones gRPC

El servidor implementa las cuatro operaciones de `vehicle.proto`:

| Operación | Descripción |
|---|---|
| `GetVehicles` | Devuelve todos los vehículos activos de `lk_vehiculos`. |
| `GetVehicle` | Devuelve un vehículo activo por ID. |
| `GetAvailableVehicles` | Devuelve vehículos disponibles sin reservas superpuestas. |
| `UpdateVehicleStatus` | Actualiza `desc_estado_vehiculo`. |

Una reserva se considera ocupante cuando su estado es distinto de
`CANCELADA` y sus horarios se superponen con el rango solicitado.

## Configuración

El archivo `.env` contiene:

```env
VEHICLE_GRPC_PORT=9091
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Rentar
DB_USER=root
DB_PASSWORD=tu contraseña de MySQL
```

El API Gateway ya apunta por defecto a:

```env
VEHICLE_SERVICE_URL=localhost:9091
```

Si se cambia el puerto del servidor, también hay que actualizar
`VEHICLE_SERVICE_URL` en `api-gateway/.env`.

`DB_PASSWORD` debe tener el mismo valor que `spring.datasource.password` del
servidor Java. No se debe guardar una contraseña real en el repositorio.

La base debe existir y tener las tablas creadas. Los scripts se encuentran en:

```text
Proyecto/BD/RentarBD.sql
Proyecto/BD/DatosPrueba.sql
```

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

La respuesta debería contener los vehículos que existan actualmente en
`lk_vehiculos`.

Para consultar disponibilidad:

```powershell
Invoke-RestMethod "http://localhost:8085/api/vehiculos/disponibles?fechaInicio=2026-10-05&fechaFin=2026-10-10"
```

El contrato usa los nombres `fechaInicio` y `fechaFin`, y el cliente del
Gateway ya los envía con esos nombres. Las consultas `GetVehicles` y
`GetVehicle` no requieren parámetros adicionales.

## Errores gRPC implementados

- `NOT_FOUND`: el ID solicitado no existe entre los vehículos activos.
- `INVALID_ARGUMENT`: el rango de fechas no es válido o el estado no es válido.
- `INTERNAL`: error de consulta o de conexión con MySQL.

El API Gateway convierte esos estados gRPC en respuestas HTTP.
