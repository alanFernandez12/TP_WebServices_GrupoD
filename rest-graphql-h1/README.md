# REST + GraphQL - H1

Esta carpeta contiene la implementación de la fase anterior del proyecto
`Rentar`, basada en Spring Boot, con una API REST y una API GraphQL para la
gestión de clientes, usuarios, vehículos y reservas.

## Estructura

```text
rest-graphql-h1/
├── README.md
└── src/
    ├── main/
    │   ├── java/com/grupo_d_c2_2026_unla/rentar/
    │   │   ├── controller/       # Controladores REST y resolvers GraphQL
    │   │   ├── dto/              # Objetos de entrada y salida
    │   │   ├── entity/           # Entidades JPA
    │   │   ├── enums/             # Estados y tipos del dominio
    │   │   ├── exception/         # Excepciones y manejador global
    │   │   ├── repository/        # Repositorios Spring Data JPA
    │   │   ├── security/          # HTTP Basic, roles y usuarios
    │   │   └── service/           # Lógica de negocio
    │   └── resources/
    │       ├── application.properties
    │       └── graphql/schema.graphqls
    └── test/
        └── java/                  # Pruebas de Spring Boot
```

## Tecnologías y dependencias

La configuración Maven se encuentra actualmente en `..\pom.xml` e incluye:

- Java 21 y Spring Boot.
- Spring Web MVC para REST.
- Spring GraphQL para GraphQL.
- Spring Data JPA y MySQL Connector/J para persistencia.
- Spring Security para autenticación y autorización.
- Bean Validation para validar los DTO.
- SpringDoc OpenAPI para Swagger.
- Lombok para reducir código repetitivo.

La clase de arranque es
`src/main/java/com/grupo_d_c2_2026_unla/rentar/RentarApplication.java`.

## Base de datos

`src/main/resources/application.properties` configura:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/rentar
spring.datasource.username=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

La contraseña se configura localmente en `application.properties` y no debe
publicarse ni agregarse al repositorio. La base de datos `rentar` debe existir
en MySQL y su esquema debe coincidir con las entidades, porque
`ddl-auto=validate` solamente valida las tablas y no las crea.

## API REST

Los controladores REST están bajo `/api`:

| Recurso | Operaciones |
|---|---|
| `/api/auth/me` | `GET` para consultar la sesión autenticada |
| `/api/usuarios` | `POST`, `GET`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/activar` |
| `/api/clientes` | `POST`, `GET`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/reactivar` |
| `/api/vehiculos` | Alta, consulta, modificación, baja lógica y reactivación |
| `/api/reservas` | `POST` para crear y `PATCH /{id}/cancelar` para cancelar |

Las respuestas utilizan DTO y las entradas se validan con Jakarta Validation.
Los errores de negocio y de recursos se centralizan mediante
`GlobalExceptionHandler`.

La documentación OpenAPI queda disponible en:

```text
http://localhost:8080/swagger-ui/index.html
http://localhost:8080/v3/api-docs
```

## API GraphQL

El endpoint es:

```text
POST http://localhost:8080/graphql
```

También se habilita GraphiQL en:

```text
http://localhost:8080/graphiql
```

Las consultas definidas en `src/main/resources/graphql/schema.graphqls` son:

- `vehiculosDisponibles(filtro)`: busca vehículos activos sin reservas
  superpuestas en un período, con filtros opcionales por tipo, marca, modelo y
  precio.
- `historialAlquileres(clienteId)`: consulta el historial de alquileres. El
  administrador indica el cliente; el cliente puede omitir el identificador
  para consultar su propio historial.
- `reservas(filtro)`: consulta reservas aplicando filtros opcionales de
  cliente, vehículo, tipo, estado y rango de fechas.

Ejemplo de consulta:

```graphql
query {
  vehiculosDisponibles(
    filtro: {
      fechaInicio: "2026-10-01T10:00:00"
      fechaFin: "2026-10-05T10:00:00"
      tipoVehiculo: SUV
    }
  ) {
    patente
    marca
    modelo
    precioDiario
  }
}
```

Los errores de negocio y de permisos de GraphQL se convierten en errores
GraphQL con tipos `BAD_REQUEST` o `FORBIDDEN`, según corresponda.

## Seguridad

La aplicación utiliza HTTP Basic sin estado:

- Las contraseñas se validan con BCrypt.
- El usuario se busca por email en la tabla de usuarios.
- `ADMIN` tiene acceso a usuarios, clientes, vehículos y reservas.
- `CLIENTE` puede consultar su sesión, crear/cancelar sus reservas y utilizar
  las consultas GraphQL permitidas.
- `/swagger-ui/**`, `/swagger-ui.html`, `/v3/api-docs/**` y `/graphiql/**` son
  públicos.
- REST y GraphQL requieren autenticación en los demás casos.

Para probar una operación protegida se debe enviar el encabezado:

```text
Authorization: Basic <credenciales_codificadas_en_base64>
```

## Ejecución y ubicación del build

El archivo `pom.xml` permanece en la raíz del repositorio (`..\pom.xml`) y el
código fuente fue separado intencionalmente dentro de esta carpeta. Por eso,
la compilación Maven estándar desde la raíz no detectará automáticamente
`rest-graphql-h1/src` como el directorio `src` convencional.

Para volver a ejecutar esta fase de forma independiente hay que crear una
configuración Maven para esta carpeta (por ejemplo, un `pom.xml` dentro de
`rest-graphql-h1`) o configurar explícitamente los directorios
`sourceDirectory` y `testSourceDirectory` del build existente. No se debe
duplicar la contraseña de la base de datos en documentación ni en archivos
versionados.
