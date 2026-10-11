# Customer Service (gRPC)

Servicio independiente del Hito 2 de Rentar. Expone por gRPC las consultas sobre clientes que necesita el API Gateway.

```text
Frontend → API Gateway (Node/TS, :8085) → gRPC → Customer Service (Java, :9092) → MySQL "rentar"
```

- **Lenguaje:** Java 21, con Spring Boot 4.1.1.
- **Comunicación:** gRPC. El contrato es `proto/customer.proto`, en la raíz del repo, compartido con el gateway.
- **Base de datos:** la base `rentar` compartida. El servicio solo lee sus propias tablas: `lk_clientes` y `lk_usuarios`.

## Estructura

```text
services/customer-service/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/rentar/customer/
    │   │   ├── CustomerServiceApplication.java
    │   │   └── CustomerGrpcService.java
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/rentar/customer/
            └── CustomerGrpcServiceTest.java
```

---

## `pom.xml`

Configuración de Maven: dependencias y cómo se compila el módulo.

**Padre:** `spring-boot-starter-parent:4.1.1`. Desde ahí se heredan las versiones de todas las librerías, incluidas gRPC (`grpc-java`) y protobuf. Por eso ninguna dependencia lleva versión explícita.

**Dependencias:**

| Dependencia | Alcance | Para qué se usa |
|---|---|---|
| `spring-boot-starter-grpc-server` | compile | Levanta un servidor gRPC (Netty) y registra automáticamente las clases `@Service` que extienden un `*ImplBase` generado. También suma los servicios de *reflection* y *health*. |
| `spring-boot-starter-jdbc` | compile | Crea el `DataSource` (pool HikariCP) y el `JdbcTemplate` que se usan para consultar la base. |
| `mysql-connector-j` | runtime | Driver JDBC de MySQL. |
| `spring-boot-starter-test` | test | JUnit 5, aserciones y utilidades de testing. |
| `h2` | test | Base de datos en memoria para los tests, así no hace falta MySQL. |

**Plugins:**

- `spring-boot-maven-plugin`: permite correr el servicio con `spring-boot:run` y empaquetarlo como un jar ejecutable.
- `protobuf-maven-plugin` (`io.github.ascopes`): en la fase `generate-sources` compila el `.proto` a clases Java. Boot ya trae configurados `protoc` y el generador `protoc-gen-grpc-java`; este módulo solo agrega dos cosas:
  - `sourceDirectories` → `${project.basedir}/../../proto`: lee el proto de la raíz del repo, así hay una sola copia compartida con el gateway.
  - `includes` → `customer.proto`: compila solo este archivo e ignora `vehicle.proto` y `rental.proto`.

**Clases generadas** (en `target/generated-sources/protobuf/customer/`, no se versionan):

- `CustomerOuterClass`: los mensajes del proto (`Customer`, `GetCustomerRequest`, `CustomerResponse`, etc.) como clases inmutables con *builders*. El nombre lleva el sufijo `OuterClass` porque el archivo y el mensaje se llaman igual (`customer`/`Customer`).
- `CustomerServiceGrpc`: la base del servidor (`CustomerServiceImplBase`) y los *stubs* de cliente.

---

## `src/main/resources/application.properties`

Configuración que lee Spring al arrancar. Cada valor se puede sobrescribir con una variable de entorno, usando la sintaxis `${VARIABLE:valor_por_defecto}`.

| Propiedad | Variable de entorno | Valor por defecto | Descripción |
|---|---|---|---|
| `spring.application.name` | — | `customer-service` | Nombre del servicio en los logs. |
| `spring.grpc.server.port` | `CUSTOMER_GRPC_PORT` | `9092` | Puerto del servidor gRPC. El gateway espera `localhost:9092` (`CUSTOMER_SERVICE_URL`). |
| `spring.datasource.url` | `DB_URL` | `jdbc:mysql://localhost:3306/rentar` | URL JDBC de la base. |
| `spring.datasource.username` | `DB_USER` | `root` | Usuario de MySQL. |
| `spring.datasource.password` | `DB_PASSWORD` | *(vacío)* | Contraseña. Se pasa solo por variable de entorno y no se commitea. |

---

## `CustomerServiceApplication.java`

Punto de entrada de la aplicación.

- `@SpringBootApplication` activa la autoconfiguración y el escaneo de componentes del paquete `com.rentar.customer`. Con eso Spring detecta `CustomerGrpcService` y la registra en el servidor gRPC.
- `main(String[] args)` llama a `SpringApplication.run(...)`, que levanta el contexto de Spring, el pool de conexiones y el servidor gRPC en el puerto configurado.

---

## `CustomerGrpcService.java`

Implementación de los 4 RPC de `customer.CustomerService`. Es la única clase con lógica.

```java
@Service
public class CustomerGrpcService extends CustomerServiceGrpc.CustomerServiceImplBase
```

- Extiende la clase base generada desde el proto y sobrescribe un método por cada RPC.
- Por ser `@Service`, Spring la crea como *bean* y el starter de gRPC la publica automáticamente en el servidor.
- Recibe un `JdbcTemplate` por constructor (inyección de dependencias).

### Constante `SELECT_CLIENTES`

Consulta base que comparten `getCustomers` y `getCustomer`:

```sql
SELECT c.id_cliente, c.nom_nombre, c.desc_apellido, u.desc_email
FROM lk_clientes c
JOIN lk_usuarios u ON u.id_usuario = c.id_usuario
```

El email está en `lk_usuarios`, así que hace falta el `JOIN`. Está permitido porque las dos tablas son de este servicio: no se consultan tablas de otro dominio.

### Modelo de respuesta gRPC

Todos los métodos reciben un `request` y un `StreamObserver<Respuesta>` y terminan de una de estas dos formas:

- **Éxito:** `response.onNext(mensaje)` seguido de `response.onCompleted()`.
- **Error:** `response.onError(Status.X.withDescription("...").asRuntimeException())`. El gateway recibe ese código y lo traduce a HTTP en `api-gateway/src/middleware/errorHandler.ts`.

### RPC

| Método | Request → Response | Qué hace | Errores |
|---|---|---|---|
| `getCustomers` | `GetCustomersRequest` → `CustomerListResponse` | Ejecuta `SELECT_CLIENTES` y devuelve la lista completa de clientes. | — |
| `getCustomer` | `GetCustomerRequest{id}` → `CustomerResponse` | Ejecuta `SELECT_CLIENTES WHERE c.id_cliente = ?` y devuelve el cliente. | `INVALID_ARGUMENT` si `id <= 0`; `NOT_FOUND "Cliente no encontrado"` si no existe. |
| `customerExists` | `CustomerExistsRequest{id}` → `CustomerExistsResponse{exists}` | Hace `SELECT COUNT(*)` sobre `lk_clientes` y devuelve `true` o `false`. Que el cliente no exista **no** es un error. | `INVALID_ARGUMENT` si `id <= 0`. |
| `isCustomerActive` | `IsCustomerActiveRequest{id}` → `CustomerActiveResponse{active}` | Lee `flag_activo` de `lk_clientes`. Es lo que consulta el gateway antes de aceptar una reserva. | `INVALID_ARGUMENT` si `id <= 0`; `NOT_FOUND` si no existe. |

Las consultas usan parámetros `?` (sentencias preparadas), lo que evita inyección SQL.

### Métodos privados

| Método | Descripción |
|---|---|
| `mapearCliente(ResultSet rs, int fila)` | `RowMapper`: convierte una fila del resultado en un mensaje `Customer` (`id`, `nombre`, `apellido`, `email`). |
| `idValido(long id, StreamObserver<?> response)` | Si `id <= 0`, responde `INVALID_ARGUMENT` y devuelve `false` para que el RPC termine; si no, devuelve `true`. |
| `clienteNoEncontrado()` | Arma la excepción `NOT_FOUND` con el mensaje `"Cliente no encontrado"`. |

### Correspondencia con el HTTP del gateway

| Código gRPC | HTTP en el gateway |
|---|---|
| `OK` | 200 |
| `INVALID_ARGUMENT` | 400 |
| `NOT_FOUND` | 404 |
| `UNAVAILABLE` (servicio caído) | 503 |
| Error inesperado (por ejemplo, base caída) | 500 |

---

## `CustomerGrpcServiceTest.java`

Tests unitarios con JUnit 5. No levantan Spring ni un servidor gRPC: instancian `CustomerGrpcService` directamente y llaman a sus métodos.

### `prepararBase()` (`@BeforeEach`)

Corre antes de cada test, así cada uno parte de datos limpios:

1. Crea un `JdbcTemplate` sobre H2 en memoria (`jdbc:h2:mem:test;MODE=MySQL`).
2. Borra todo (`DROP ALL OBJECTS`) y crea `lk_usuarios` y `lk_clientes` con las mismas columnas que `Proyecto/BD/RentarBD.sql`.
3. Inserta dos clientes: **1 – Juan**, activo, y **2 – María**, inactivo.
4. Crea el servicio con ese `JdbcTemplate`.

Como se ejecutan las consultas SQL reales, los tests prueban también los `SELECT` y el `JOIN`, no solo la lógica de Java.

### Casos

| Test | Qué verifica |
|---|---|
| `listaTodosLosClientes` | `getCustomers` devuelve los 2 clientes. |
| `devuelveUnClienteConSuEmail` | `getCustomer(1)` devuelve a Juan con el email traído de `lk_usuarios` por el `JOIN`. |
| `clienteInexistenteDevuelveNotFound` | `getCustomer(99)` responde `NOT_FOUND` con `"Cliente no encontrado"`. |
| `verificaExistencia` | `customerExists(1)` devuelve `true` y `customerExists(99)` devuelve `false`, sin error. |
| `clienteActivoEInactivo` | `isCustomerActive(1)` devuelve `true` e `isCustomerActive(2)` devuelve `false`. |
| `activoDeClienteInexistenteDevuelveNotFound` | `isCustomerActive(99)` responde `NOT_FOUND`. |
| `idInvalidoDevuelveInvalidArgument` | `getCustomer(0)` responde `INVALID_ARGUMENT`. |

### Clase auxiliar `Resultado<T>`

Implementa `StreamObserver<T>` y guarda lo que responde el servicio, para poder hacer las aserciones:

- `onNext` guarda la respuesta en `valor`.
- `onError` guarda la excepción en `error`.
- `codigoError()` y `descripcionError()` extraen el `Status` gRPC de la excepción.

---

## Cómo usarlo

Todos los comandos se ejecutan desde la **raíz del repo**, porque usan el `mvnw` de ahí.

**Correr los tests:**
```bash
./mvnw -f services/customer-service/pom.xml test
```

**Levantar el servicio** (requiere MySQL con la base `rentar` creada con `Proyecto/BD/RentarBD.sql`):
```bash
DB_PASSWORD=tu_password ./mvnw -f services/customer-service/pom.xml spring-boot:run
```

**Probar con `grpcurl`** (`brew install grpcurl`). El servicio tiene la *reflection* activada, así que no hace falta pasar el `.proto`:
```bash
grpcurl -plaintext localhost:9092 list
grpcurl -plaintext localhost:9092 customer.CustomerService/GetCustomers
grpcurl -plaintext -d '{"id": 1}' localhost:9092 customer.CustomerService/GetCustomer
grpcurl -plaintext -d '{"id": 1}' localhost:9092 customer.CustomerService/CustomerExists
grpcurl -plaintext -d '{"id": 1}' localhost:9092 customer.CustomerService/IsCustomerActive
```

**Usarlo desde el gateway:** con el servicio levantado, el gateway lo encuentra en `localhost:9092`. En ese caso no hay que correr `npm run mock:customer`.
```bash
cd api-gateway && npm run dev
```

## Limitaciones actuales

- Solo están los 4 RPC del proto: no hay alta, modificación, baja ni reactivación.
- El mensaje `Customer` solo trae `id`, `nombre`, `apellido` y `email`.
- "Activo" se toma solo del `flag_activo` de `lk_clientes`.
