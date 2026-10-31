# Customer Service

Servicio gRPC de clientes y usuarios de Rentar, desarrollado con Java 21 y Spring Boot.

Implementa el contrato compartido:

```text
../../proto/customer.proto
```

Es el único servicio que accede a `lk_clientes` y `lk_usuarios` de la base MySQL `Rentar`. Los demás servicios y el API Gateway consultan clientes y autentican usuarios a través de este servicio.

## Estructura

```text
customer-service/
├── pom.xml
└── src/main/java/com/rentar/customer/
    ├── CustomerServiceApplication.java
    ├── CustomerGrpcService.java
    └── CustomerRepository.java
```

- `CustomerServiceApplication`: punto de entrada de Spring Boot.
- `CustomerGrpcService`: implementa `CustomerService` (validaciones, errores gRPC y autenticación).
- `CustomerRepository`: consultas SQL con `JdbcTemplate` sobre `lk_clientes` y `lk_usuarios`.

El código Java del contrato se genera desde `proto/customer.proto` durante el build (`protobuf-maven-plugin`).

## Tecnologías

- Java 21
- Spring Boot 4.1.1 con `spring-boot-starter-grpc-server`
- Spring JDBC (`JdbcTemplate`) y MySQL Connector/J
- `spring-security-crypto` (BCrypt para las contraseñas)

## Operaciones gRPC

| Operación | Descripción |
|---|---|
| `GetCustomers` | Lista todos los clientes (activos e inactivos). |
| `GetCustomer` | Devuelve un cliente por ID. |
| `CustomerExists` | Indica si existe un cliente con ese ID. |
| `IsCustomerActive` | Indica si el cliente está activo. |
| `Login` | Valida email y contraseña; devuelve rol, `cliente_id` y nombre. |
| `CreateCustomer` | Crea el usuario y el cliente asociado. |
| `UpdateCustomer` | Modifica los datos del cliente y el email del usuario. |
| `DeleteCustomer` | Baja lógica del cliente y de su usuario. |
| `ReactivateCustomer` | Reactiva un cliente dado de baja. |

## Reglas y errores

| Situación | Código gRPC |
|---|---|
| ID menor o igual a 0 | `INVALID_ARGUMENT` |
| Cliente inexistente | `NOT_FOUND` ("Cliente no encontrado") |
| Email o documento ya registrado (alta o modificación) | `ALREADY_EXISTS` |

- `Login` no devuelve error por credenciales incorrectas: responde `valido = false`. Solo autentica usuarios activos.
- Las contraseñas se guardan con BCrypt en `lk_usuarios.desc_password_hash`; nunca se devuelven.
- Si el usuario no es cliente (administrador), `cliente_id` es `0` y el nombre es "Administrador".
- La baja es lógica: desactiva `flag_activo` en `lk_clientes` y en `lk_usuarios`.
- Los campos opcionales (teléfono, fecha de nacimiento) llegan como `""` porque protobuf no tiene `null`; se guardan como `NULL`.
- `CreateCustomer` y `UpdateCustomer` se ejecutan en transacción.

## Base de datos

Utiliza la base `Rentar`:

- `lk_clientes`: datos personales, documento y `flag_activo`.
- `lk_usuarios`: email, hash de la contraseña, rol y `flag_activo`.

Cada cliente tiene un usuario asociado (`lk_clientes.id_usuario`).

## Configuración

El servicio no incluye `application.properties`: la conexión a MySQL y el puerto se pasan por variables de entorno de Spring.

| Variable | Descripción |
|---|---|
| `SPRING_DATASOURCE_URL` | Por ejemplo `jdbc:mysql://localhost:3306/rentar`. |
| `SPRING_DATASOURCE_USERNAME` | Usuario de MySQL. |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de MySQL. |
| `SPRING_GRPC_SERVER_PORT` | Puerto gRPC. Debe ser **9092**, el que usa el API Gateway (`CUSTOMER_SERVICE_URL=localhost:9092`). |

## Ejecución

Requiere MySQL iniciado con la base `Rentar` creada (`Proyecto/BD/RentarBD.sql` y `Proyecto/BD/DatosPrueba.sql`).

Desde la raíz del repositorio (macOS / Linux):

```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/rentar
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=<contraseña>
export SPRING_GRPC_SERVER_PORT=9092
./mvnw -f services/customer-service/pom.xml spring-boot:run
```

En Windows (PowerShell):

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/rentar"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="<contraseña>"
$env:SPRING_GRPC_SERVER_PORT="9092"
.\mvnw.cmd -f services\customer-service\pom.xml spring-boot:run
```

También se inicia junto con el resto de los servicios con `start_services.py`.

## Cómo probarlo

1. Con el servicio iniciado, iniciar el API Gateway y el frontend.
2. Ingresar con el administrador de los datos de prueba (`admin@rentar.com`): el login pasa por `Login`.
3. Desde la pantalla de clientes, crear, modificar, dar de baja y reactivar un cliente.
4. Si el login responde 503 ("El servicio no está disponible"), el Customer Service no está iniciado o no conecta con MySQL.
