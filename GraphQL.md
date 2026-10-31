# Documentación GraphQL — Rentar

## 1. Ubicación e implementación

- **Esquema:** `src/main/resources/graphql/schema.graphqls`.
- **Resolvers:** `controller/DisponibilidadResolver.java`, `controller/ReservaGraphQLController.java` y `controller/HistorialAlquilerResolver.java` (bajo `src/main/java/com/grupo_d_c2_2026_unla/rentar/`).
- **Servicios de negocio:** `VehiculoServiceImpl` y `ReservaServiceImpl`.
- **Tecnología:** Spring Boot y Spring GraphQL; persistencia por Spring Data JPA/MySQL.
- **URL de consultas:** `POST http://localhost:8080/graphql` (puerto predeterminado de la fase original).
- **Interfaz de prueba:** `http://localhost:8080/graphiql` (habilitada en `application.properties`).
- **Seguridad:** HTTP Basic; `/graphql` requiere rol `ADMIN` o `CLIENTE`. La autorización por registro también se verifica en los servicios.

Se utilizan **consultas (`Query`)** para las tres funcionalidades aquí detalladas, no se usan mutations porque no se solicitaron operaciones de GraphQL para modificar campos.

## 2. Consulta de disponibilidad — `vehiculosDisponibles`

**Propósito.** Devolver vehículos activos disponibles durante **todo** el período solicitado; las reservas canceladas no impiden la disponibilidad.

**Firma definida en el esquema:**

```graphql
vehiculosDisponibles(filtro: DisponibilidadFiltroInput!): [VehiculoDisponible!]!
```

**Entrada `DisponibilidadFiltroInput`:**

| Campo | Tipo GraphQL | Obligatorio | Descripción |
|---|---|---|---|
| `fechaInicio` | `String!` | Sí | Fecha y hora inicial, formato ISO-8601 sin zona, p. ej. `2026-11-10T10:00:00`. |
| `fechaFin` | `String!` | Sí | Fecha y hora final, posterior a la inicial. |
| `tipoVehiculo` | `TipoVehiculo` | No | `SEDAN`, `SUV`, `PICKUP`, `COUPE` o `HATCHBACK`. |
| `marca` | `String` | No | Marca del vehículo. |
| `modelo` | `String` | No | Modelo del vehículo. |
| `precioMinimo` | `Float` | No | Precio diario mínimo. |
| `precioMaximo` | `Float` | No | Precio diario máximo. |

**Salida `VehiculoDisponible`:** `patente: String!`, `marca: String!`, `modelo: String!`, `anio: Int!`, `color: String`, `tipoVehiculo: TipoVehiculo!` y `precioDiario: Float!`.

**Ejemplo:**

```graphql
query {
  vehiculosDisponibles(filtro: {
    fechaInicio: "2026-11-10T10:00:00"
    fechaFin: "2026-11-15T10:00:00"
    tipoVehiculo: SUV
    precioMaximo: 70000
  }) {
    patente
    marca
    modelo
    anio
    color
    tipoVehiculo
    precioDiario
  }
}
```

**Flujo:** `DisponibilidadResolver` recibe el filtro, lo deriva a `VehiculoService.consultarDisponibilidad`; la implementación valida el filtro y consulta `vehiculoRepository.buscarDisponibles`. 

## 3. Consulta de reservas — `reservas`

**Propósito.** Consultar las reservas registradas con filtros opcionales. El administrador puede consultar todas; un cliente solamente puede acceder a las suyas.

**Firma:**

```graphql
reservas(filtro: ReservaFilterInput): [Reserva!]!
```

**Entrada `ReservaFilterInput` (todos opcionales):**

| Campo | Tipo | Descripción |
|---|---|---|
| `clienteId` | `ID` | Cliente. Para CLIENTE se restringe a su identidad autenticada. |
| `vehiculoId` | `ID` | Vehículo. |
| `tipoVehiculo` | `TipoVehiculo` | Tipo del vehículo. |
| `estadoReserva` | `EstadoReserva` | Estado de la reserva. |
| `fechaDesde` | `String` | Inicio del rango temporal ISO-8601. |
| `fechaHasta` | `String` | Fin del rango temporal ISO-8601. |

Los filtros se combinan mediante **AND**. La implementación selecciona reservas **contenidas** en el período: inicio mayor o igual a `fechaDesde` y fin menor o igual a `fechaHasta`.

**Salida `Reserva`:** `id: ID!`, `cliente: Cliente!`, `vehiculo: Vehiculo!`, `patente: String!`, `horaInicio: String!`, `horaFin: String!`, `duracionDias: Int!`, `precioDiarioHistorico: Float!`, `importeTotal: Float!`, `estadoReserva: EstadoReserva!`.

**Ejemplo (cliente autenticado):**

```graphql
query {
  reservas(filtro: { estadoReserva: CONFIRMADA }) {
    id
    cliente { id nombre apellido documento }
    vehiculo { id patente marca modelo tipoVehiculo }
    patente
    horaInicio
    horaFin
    duracionDias
    precioDiarioHistorico
    importeTotal
    estadoReserva
  }
}
```

**Flujo:** `ReservaGraphQLController` invoca `ReservaService.buscarReservas`. El servicio usa `UsuarioActual.clientePermitido` para limitar el acceso y aplica los filtros; luego convierte las entidades a `ReservaResponseDTO`.

## 4. Historial de alquileres — `historialAlquileres`

**Propósito.** Consultar las reservas históricas **TERMINADA** y **CANCELADA** de un cliente.

**Firma:**

```graphql
historialAlquileres(clienteId: ID): [HistorialAlquiler!]!
```

- `clienteId` es opcional en el esquema.
- Un **CLIENTE** puede omitirlo: la lógica utiliza su cliente autenticado y no permite consultar el historial de otro.
- Un **ADMIN** debe indicar a qué cliente consultar, según `ReservaServiceImpl.consultarHistorial`.

**Salida `HistorialAlquiler`:** `vehiculo: VehiculoHistorial!` (`marca: String!`, `modelo: String!`), `patente: String!`, `fechaInicio: String!`, `fechaFin: String!`, `cantidadDias: Int!`, `importeTotal: Float!`, `estado: EstadoReserva!`.

**Ejemplo (cliente autenticado):**

```graphql
query {
  historialAlquileres {
    vehiculo { marca modelo }
    patente
    fechaInicio
    fechaFin
    cantidadDias
    importeTotal
    estado
  }
}
```

**Ejemplo (administrador):**

```graphql
query {
  historialAlquileres(clienteId: 5) {
    patente
    estado
    importeTotal
  }
}
```

**Flujo:** `HistorialAlquilerResolver` llama a `ReservaService.consultarHistorial`, donde se verifica el acceso al cliente y se consultan únicamente los estados `TERMINADA` y `CANCELADA`.

## 5. Tipos y enumeraciones comunes

| Tipo | Campos o valores |
|---|---|
| `TipoVehiculo` (enum) | `SEDAN`, `SUV`, `PICKUP`, `COUPE`, `HATCHBACK` |
| `EstadoReserva` (enum) | `PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `TERMINADA` |
| `Cliente` | `id: ID!`, `nombre: String!`, `apellido: String!`, `documento: String!` |
| `Vehiculo` | `id: ID!`, `patente: String!`, `marca: String!`, `modelo: String!`, `tipoVehiculo: TipoVehiculo!` |

En GraphQL, `!` indica que el campo no admite `null` y `[Tipo!]!` representa una lista no nula de elementos no nulos.

## 6. Ejecución y pruebas

1. Ejecutar la aplicación con su configuración Java/Spring y base de datos correspondiente. El `pom.xml` está en la raíz del proyecto. Para las base de datos, estas estan provistas en la carpeta `Proyecto/BD`
2. Usar GraphiQL en `http://localhost:8080/graphiql` o Postman con `POST http://localhost:8080/graphql`, `Content-Type: application/json` y HTTP Basic con una cuenta habilitada. En la base de datos de prueba se provee el admin `admin@rentar.com` y cliente `juan.perez@mail.com`. Para ambos la contraseña es `admin123`

**Ejemplo de cuerpo JSON en Postman:**

```json
{
  "query": "query { historialAlquileres { patente estado importeTotal } }"
}
```

Los controladores `ReservaGraphQLController` e `HistorialAlquilerResolver` convierten ciertas excepciones de negocio y acceso denegado en errores GraphQL `BAD_REQUEST` o `FORBIDDEN`. La autenticación HTTP puede además devolver `401` si faltan credenciales válidas.

## 7. Distribución del código

- `src/main/resources/graphql/schema.graphqls`: nombres, firmas, tipos, filtros y documentación embebida.
- `controller/DisponibilidadResolver.java`: consulta de disponibilidad.
- `controller/ReservaGraphQLController.java`: consulta de reservas y manejo de errores.
- `controller/HistorialAlquilerResolver.java`: historial y manejo de permisos.
- `service/implementation/VehiculoServiceImpl.java`: lógica de disponibilidad.
- `service/implementation/ReservaServiceImpl.java`: filtrado de reservas e historial.


