# Integración híbrida de clientes

## Objetivo

La funcionalidad de clientes utiliza dos caminos de comunicación:

- **Escrituras:** el frontend llama al servidor Spring Boot en `http://localhost:8080`.
- **Lecturas:** el frontend llama al API Gateway en `http://localhost:8085`; el gateway consulta `customer-service` mediante gRPC usando `../proto/customer.proto`.

Las altas, modificaciones, bajas y reactivaciones continúan utilizando los endpoints REST existentes de Spring, mientras que el listado de clientes se obtiene a través del contrato gRPC.

## Cambios realizados

### 1. Separación de destinos en Vite

Se mantiene `/api` apuntando a Spring Boot y `/gateway` apuntando al API Gateway. Vite reescribe internamente el prefijo `/gateway`:

```text
/api/*      -> http://localhost:8080
/gateway/*  -> http://localhost:8085/api/*
```

Esto permite que las rutas de escritura y lectura no sean ambiguas.

### 2. Lectura del frontend por el gateway

`obtenerClientes()` ahora utiliza:

```text
GET /gateway/clientes
```

Las funciones de escritura de clientes siguen usando Spring Boot:

```text
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
PATCH  /api/clientes/:id/reactivar
```

### 3. Ampliación del contrato gRPC

El mensaje `Customer` fue ampliado para transportar todos los datos que el frontend necesita:

```text
id, documento, nombre, apellido, email, telefono, activo
```

El repositorio JDBC de `customer-service` ahora obtiene esos campos desde `lk_clientes` y `lk_usuarios`, que comparten la base de datos con Spring Boot.

### 4. Normalización en el API Gateway

El gateway transforma la respuesta protobuf antes de enviarla al frontend:

- `{ customers: [...] }` se convierte en un array.
- `{ customer: {...} }` se convierte en un objeto.
- Los identificadores se convierten a `number`.
- Los campos opcionales nulos se entregan como cadena vacía.
- Los nombres quedan alineados con el modelo del frontend: `documento`, `nombre`, `apellido`, `email`, `telefono` y `activo`.

## Puesta en marcha

### Customer service

Desde la raíz del repositorio, iniciar el servicio Java:

```powershell
.\mvnw.cmd -f services\customer-service\pom.xml spring-boot:run
```

Si la base requiere contraseña:

```powershell
$env:DB_PASSWORD="tu_password"
.\mvnw.cmd -f services\customer-service\pom.xml spring-boot:run
```

El servicio gRPC debe escuchar en `localhost:9092`.

### API Gateway

Crear `../api-gateway/.env`:

```env
PORT=8085
CUSTOMER_SERVICE_URL=localhost:9092
```

Ejecutar:

```powershell
cd api-gateway
npm.cmd run dev
```

### Spring Boot principal

Iniciar el servidor principal en `localhost:8080`, ya que el frontend utiliza ese servidor para las operaciones de escritura.

### Frontend

Ejecutar:

```powershell
cd frontend
npm.cmd run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Flujo resultante

```text
Frontend
  ├─ POST/PUT/DELETE/PATCH /api/clientes
  │      └─ Spring Boot :8080 ──> MySQL
  │
  └─ GET /gateway/clientes
         └─ API Gateway :8085
                └─ gRPC CustomerService :9092
                       └─ MySQL
```

Para que una escritura aparezca luego en el listado, Spring Boot y `customer-service` deben consultar la misma base de datos `rentar`.
