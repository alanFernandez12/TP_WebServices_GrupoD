# Integración híbrida de vehículos

## Objetivo

La funcionalidad de vehículos utiliza dos caminos de comunicación:

- **Escrituras:** el frontend llama al servidor Spring Boot en `http://localhost:8080`.
- **Lecturas:** el frontend llama al API Gateway en `http://localhost:8085`; el gateway consulta el `vehicle-service` mediante gRPC usando `../proto/vehicle.proto`.

De esta forma, las altas, modificaciones, bajas y reactivaciones continúan utilizando los endpoints REST existentes de Spring, mientras que el listado de vehículos se obtiene a través del contrato gRPC.

## Cambios realizados

### 1. Separación de destinos en Vite

Se mantuvo `/api` apuntando a Spring Boot y se agregó `/gateway` apuntando al API Gateway:

```text
/api/*      -> http://localhost:8080
/gateway/*  -> http://localhost:8085
```

Esto evita que una misma ruta sea resuelta por servidores diferentes.

### 2. Lectura del frontend por el gateway

`obtenerVehiculos()` ahora utiliza:

```text
GET /gateway/vehiculos
```

Las funciones de alta, modificación, baja y reactivación siguen usando:

```text
POST  /api/vehiculos
PUT   /api/vehiculos/:id
DELETE /api/vehiculos/:id
PATCH /api/vehiculos/:id/reactivar
```

Esas rutas son atendidas por Spring Boot.

### 3. Ampliación del contrato gRPC

El mensaje `Vehicle` fue ampliado para transportar todos los datos que el frontend necesita:

```text
id, patente, marca, modelo, anio, tipoVehiculo,
estado, color, precio_diario, activo
```

También se actualizaron el repositorio Python y las clases gRPC generadas del `vehicle-service` para leer esos campos desde `lk_vehiculos`.

### 4. Normalización en el API Gateway

El gateway transforma la respuesta protobuf antes de enviarla al frontend:

- `{ vehicles: [...] }` se convierte en un array.
- `{ vehicle: {...} }` se convierte en un objeto.
- Los tipos numéricos se convierten a `number`.
- Los nombres se conservan con el formato usado por el frontend, incluyendo `tipoVehiculo` y `precio_diario`.

No se modificaron los nombres de las propiedades del frontend.

## Puesta en marcha

### Vehicle service

Desde la raíz del repositorio, regenerar los archivos Python después de modificar el `.proto`:

```powershell
python -m grpc_tools.protoc -I=proto --python_out=services/vehicle-service/app --grpc_python_out=services/vehicle-service/app proto/vehicle.proto
```

Luego iniciar el servicio en el puerto `9091`.

### API Gateway

Crear `../api-gateway/.env`:

```env
PORT=8085
VEHICLE_SERVICE_URL=localhost:9091
```

Ejecutar:

```powershell
cd api-gateway
npm run dev
```

### Spring Boot

Iniciar Spring Boot en `8080`, ya que el frontend utiliza ese servidor para las operaciones de escritura.

### Frontend

Ejecutar:

```powershell
cd frontend
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Flujo resultante

```text
Frontend
  ├─ POST/PUT/DELETE/PATCH /api/vehiculos
  │      └─ Spring Boot :8080 ──> MySQL
  │
  └─ GET /gateway/vehiculos
         └─ API Gateway :8085
                └─ gRPC VehicleService :9091
                       └─ MySQL
```

Para que una escritura aparezca luego en el listado, Spring Boot y `vehicle-service` deben consultar la misma base de datos `rentar`.
