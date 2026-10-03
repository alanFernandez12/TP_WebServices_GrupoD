## API Gateway

El proyecto incluye un **API Gateway desarrollado con Node.js y TypeScript**, que recibe solicitudes HTTP y se comunica con los servicios internos mediante gRPC.

### Configuración

Crear un archivo `.env` en `api-gateway/`:

```env
PORT=8085
VEHICLE_SERVICE_URL=localhost:9091
CUSTOMER_SERVICE_URL=localhost:9092
RENTAL_SERVICE_URL=localhost:9093
```

Instalar las dependencias:

```bash
npm install
```

### Ejecución

Para probar el Gateway sin levantar todavía los servicios Java, se incluyen mocks gRPC para cada servicio.

Abrir cuatro terminales:

**Gateway:**

```bash
npm run dev
```

**Vehicle Mock:**

```bash
npm run mock:vehicle
```

**Customer Mock:**

```bash
npm run mock:customer
```

**Rental Mock:**

```bash
npm run mock:rental
```

El Gateway estará disponible en:

```text
http://localhost:8085
```

y los mocks utilizarán los puertos:

```text
Vehicle  → 9091
Customer → 9092
Rental   → 9093
```

Una vez iniciados, se pueden probar los endpoints del Gateway mediante Postman, Thunder Client o el frontend.

> Los mocks se utilizan únicamente para probar el funcionamiento del Gateway. En la implementación final serán reemplazados por los servicios gRPC correspondientes.
