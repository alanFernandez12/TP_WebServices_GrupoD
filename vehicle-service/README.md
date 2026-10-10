# Vehicle Service

Servicio gRPC de vehículos para Rentar, desarrollado con Python.

Implementa el contrato compartido:

```text
../proto/vehicle.proto
```

Utiliza la misma base MySQL `Rentar` que el servidor Java:

- `lk_vehiculos` para consultar y actualizar vehículos.
- `ft_reservas` para calcular disponibilidad.

## Estructura

```text
vehicle-service/
├── app/
│   ├── __init__.py
│   ├── database.py
│   ├── server.py
│   └── vehicle_repository.py
├── .env
└── requirements.txt
```

- `app/server.py`: implementa `VehicleService` y levanta el servidor gRPC.
- `app/database.py`: administra el pool de conexiones MySQL.
- `app/vehicle_repository.py`: contiene las consultas a la base.
- `app/vehicle_pb2*.py`: archivos generados desde `vehicle.proto`.
- `.env`: configura el puerto y la conexión a MySQL.

## Operaciones gRPC

| Operación | Descripción |
|---|---|
| `GetVehicles` | Devuelve vehículos activos de `lk_vehiculos`. |
| `GetVehicle` | Devuelve un vehículo activo por ID. |
| `GetAvailableVehicles` | Excluye reservas no canceladas que se superpongan. |
| `UpdateVehicleStatus` | Actualiza `desc_estado_vehiculo`. |

Los estados permitidos son `DISPONIBLE`, `RESERVADO` y `EN_ALQUILER`.

## Configuración

Editar `vehicle-service/.env`:

```env
VEHICLE_GRPC_PORT=9091
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Rentar
DB_USER=root
DB_PASSWORD=tu contraseña de MySQL
```

La contraseña debe coincidir con `spring.datasource.password` del servidor
Java. No se debe guardar una contraseña real en el repositorio.

La base y las tablas deben existir. Los scripts están en:

```text
Proyecto/BD/RentarBD.sql
Proyecto/BD/DatosPrueba.sql
```

## Instalación

Desde la raíz del repositorio:

```powershell
cd vehicle-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Si PowerShell bloquea la activación, se puede instalar sin activar el entorno:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Generar las clases gRPC

Después de instalar las dependencias, ejecutar desde la raíz:

```powershell
python -m grpc_tools.protoc -I=proto --python_out=vehicle-service/app --grpc_python_out=vehicle-service/app proto/vehicle.proto
```

Esto crea `vehicle_pb2.py` y `vehicle_pb2_grpc.py` dentro de `app`.

## Ejecutar

Desde `vehicle-service`:

```powershell
python app/server.py
```

El servicio queda escuchando en:

```text
localhost:9091
```

## Probar con el API Gateway

Abrir dos terminales.

En la primera:

```powershell
cd vehicle-service
python app/server.py
```

En la segunda:

```powershell
cd api-gateway
npm.cmd run dev
```

No iniciar `npm.cmd run mock:vehicle`, porque el servicio Python ya utiliza el
puerto `9091`.

Probar desde PowerShell, Postman o Thunder Client:

```powershell
Invoke-RestMethod http://localhost:8085/api/vehiculos
Invoke-RestMethod http://localhost:8085/api/vehiculos/1
Invoke-RestMethod "http://localhost:8085/api/vehiculos/disponibles?fechaInicio=2026-10-05&fechaFin=2026-10-10"
```

El cliente del Gateway traduce esos parámetros HTTP a los campos gRPC
`fecha_inicio` y `fecha_fin`, que son los nombres utilizados por el código
Python generado desde el contrato.

El API Gateway sigue funcionando como cliente gRPC y no necesita saber que el
servidor está implementado en Python.
