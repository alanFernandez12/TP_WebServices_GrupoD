# Hito 3 – Rentar: Comunicación asíncrona basada en eventos (Kafka / RabbitMQ)

> Archivo de contexto para agentes de IDE. Resume el enunciado del TP del Hito 3 de la materia
> **Desarrollo de Software en Sistemas Distribuidos** (Universidad Nacional de Lanús).
> Leer completo antes de modificar código. Las secciones marcadas como **[Obligatorio]** vienen del enunciado;
> las marcadas como **[Sugerencia]** son decisiones de diseño recomendadas, no impuestas.

---

## 1. Objetivo

Evolucionar el sistema **Rentar** (resultado del Hito 2) incorporando **comunicación asíncrona basada en eventos**
mediante un broker de mensajes: **Apache Kafka _o_ RabbitMQ** (elegir uno).

**[Obligatorio]**
- Conservar TODO lo hecho en hitos anteriores: interfaz web, API Gateway, servicios internos y comunicación **gRPC**.
- La solución es **híbrida**: gRPC (síncrono) para lo que requiere respuesta inmediata, eventos (asíncrono) para procesos desacoplables.
- Configurar el broker, definir los eventos, implementar productores y consumidores, y **documentar** eventos y estructuras de datos.
- Cada evento debe poder identificarse y contener la información suficiente para que el consumidor lo procese.

> **No romper** lo existente: antes de agregar código, inspeccionar la estructura actual del proyecto (servicios, protos, gateway, modelo de datos) y respetar sus convenciones.

---

## 2. Estados del dominio (importante)

### Estados operativos del vehículo (existentes, NO se amplían con ROBADO)
- `DISPONIBLE`
- `EN_ALQUILER`

### Estado de incorporación de vehículos externos (solo en la tabla temporal `ft_vehiculo_externo`)
- `PENDIENTE` (inicio del proceso de incorporación; vive **únicamente** en `ft_vehiculo_externo.desc_estado_incorporacion`, NO en `lk_vehiculos`)
- `INCORPORADO` (todas las validaciones `VALIDADO`; recién ahí se inserta el vehículo en `lk_vehiculos` con estado `DISPONIBLE`)
- `RECHAZADO` (alguna validación `RECHAZADO`; el vehículo nunca llega a `lk_vehiculos`)

> Los valores `INCORPORADO` / `RECHAZADO` son una convención sugerida; el enunciado solo exige `PENDIENTE` al inicio. Ver sección 7 (modelo de datos).

### Resultados de procesos (no son estados del vehículo)
| Proceso | Resultados posibles |
|---|---|
| Verificación de patente (vehículo propio) | `VALIDADO`, `ROBADO` |
| Validación de patente / titularidad (vehículo externo) | `VALIDADO`, `RECHAZADO` |
| Mantenimiento preventivo | `REALIZADO`, `NO_REALIZADO` |

> **Regla clave:** `ROBADO` **no** es un estado operativo nuevo del vehículo. Si el resultado es `ROBADO`, el vehículo
> queda **inhabilitado para nuevas operaciones**, manteniendo su estado operativo en `DISPONIBLE`/`EN_ALQUILER`.
> En el modelo de datos, el resultado se guarda en `lk_vehiculos.desc_verificacion` (columna nueva, separada de `desc_estado_vehiculo`)
> y la inhabilitación se refleja con `flag_activo = false`. Ver sección 7.

---

## 3. Flujo A – Verificación de vehículos (al registrar un vehículo)

**[Obligatorio]** Pasos:
1. El vehículo se registra en el sistema.
2. Se publica un evento solicitando la verificación.
3. Un componente verificador consume el evento.
4. El verificador consulta un **registro propio que simula la información policial** (patentes denunciadas como robadas).
5. Publica un evento con el resultado.
6. Rentar consume el resultado y actualiza el vehículo (si `ROBADO` → inhabilitado para nuevas operaciones).

**Eventos**

`vehiculos.verificacion.solicitada`
```json
{
  "vehiculoId": 15,
  "patente": "ABC123"
}
```

`vehiculos.verificacion.resultado`
```json
{
  "vehiculoId": 15,
  "patente": "ABC123",
  "resultado": "VALIDADO"
}
```
(`resultado`: `VALIDADO` | `ROBADO`)

```
Rentar --(solicitada)--> [Broker] --> Verificador (registro policial simulado)
Rentar <--(resultado)--- [Broker] <-- Verificador
```

---

## 4. Flujo B – Incorporación de vehículos de propietarios externos

Un **cliente** registra un vehículo propio para incorporarlo a Rentar. El proceso es **asíncrono**.

**[Obligatorio]**
- El vehículo arranca en estado `PENDIENTE`.
- Validaciones mínimas, **independientes** entre sí (cada una procesada por su propio componente):
  1. **Patente**: que no esté denunciada como robada.
  2. **Titularidad**: que el cliente solicitante sea el titular, usando un **registro externo de titularidad simulado**.
- Cada validación emite un evento con su resultado: `VALIDADO` | `RECHAZADO`.
- El sistema debe **correlacionar** los resultados del mismo proceso (por `vehiculoExternoId`).
- Si **alguna** validación es `RECHAZADO` → el vehículo **no** se incorpora.
- Si **todas** son `VALIDADO` → se emite un evento de validación completada que permite finalizar la incorporación; el vehículo pasa a `DISPONIBLE` y participa de las operaciones habituales.

**Eventos**

`vehiculos.externos.registrados`
```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "patente": "DEF456"
}
```

`vehiculos.externos.validacion.patente`
```json
{
  "vehiculoExternoId": 50,
  "patente": "DEF456",
  "resultado": "VALIDADO"
}
```

`vehiculos.externos.validacion.titularidad`
```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "documento": "30123456",
  "patente": "DEF456",
  "resultado": "VALIDADO"
}
```

`vehiculos.externos.validacion.completada`
```json
{
  "vehiculoExternoId": 50
}
```
(`resultado` en validaciones: `VALIDADO` | `RECHAZADO`)

```
Rentar --(registrados)--> [Broker] --> Validador de patente      --(validacion.patente)-----+
                                   --> Validador de titularidad  --(validacion.titularidad)-+--> Correlacionador
                                                                                              |
                                      si ambas VALIDADO --> (validacion.completada) --> Rentar: vehículo DISPONIBLE
                                      si alguna RECHAZADO --> no se incorpora
```

**[Sugerencia]** Persistir el estado de cada proceso de incorporación (p. ej. `patenteResultado`, `titularidadResultado`) para
poder correlacionar aunque los eventos lleguen en distinto orden o en distintos momentos. El correlacionador debe ser **idempotente**.
Para la titularidad se necesita el `documento` del cliente (dato que viaja en el evento).

---

## 5. Flujo C – Mantenimiento preventivo asociado a una reserva

**Objetivo didáctico:** demostrar que el flujo principal **no se bloquea** esperando a otro componente.

**[Obligatorio]** Pasos:
1. Se confirma la reserva.
2. Se publica el evento de reserva confirmada.
3. El componente de mantenimiento consume el evento.
4. Genera y registra una **solicitud de mantenimiento preventivo**.
5. Procesa el mantenimiento.
6. Publica un evento con el resultado.
7. Rentar registra el resultado **asociado a la reserva**.

**Consideración importante:** la confirmación de la reserva **NO debe quedar bloqueada** esperando el resultado del mantenimiento
(la respuesta al usuario sale antes de que el mantenimiento termine).

**Eventos**

`reserva.confirmada`
```json
{
  "reservaId": 150,
  "vehiculoId": 15,
  "fechaInicio": "2026-10-10T10:00:00",
  "fechaFin": "2026-10-15T10:00:00"
}
```

`mantenimiento.resultado`
```json
{
  "reservaId": 150,
  "vehiculoId": 15,
  "resultado": "REALIZADO"
}
```
(`resultado`: `REALIZADO` | `NO_REALIZADO`)

> Nota: el enunciado solo define el evento de entrada (`reserva.confirmada`) y el de salida (`mantenimiento.resultado`).
> El "registro de la solicitud" del paso 4 es una persistencia interna del componente de mantenimiento, no un tópico adicional obligatorio.

---

## 6. Catálogo de eventos / tópicos

| Tópico / Evento | Productor | Consumidor | Flujo |
|---|---|---|---|
| `vehiculos.verificacion.solicitada` | Rentar | Verificador (registro policial simulado) | A |
| `vehiculos.verificacion.resultado` | Verificador | Rentar | A |
| `vehiculos.externos.registrados` | Rentar | Validador de patente, Validador de titularidad | B |
| `vehiculos.externos.validacion.patente` | Validador de patente | Correlacionador (Rentar) | B |
| `vehiculos.externos.validacion.titularidad` | Validador de titularidad | Correlacionador (Rentar) | B |
| `vehiculos.externos.validacion.completada` | Correlacionador | Rentar (finaliza incorporación) | B |
| `reserva.confirmada` | Rentar | Servicio de mantenimiento | C |
| `mantenimiento.resultado` | Servicio de mantenimiento | Rentar | C |

> La asignación de componentes productor/consumidor es una **[Sugerencia]** de arquitectura; ajustar a los servicios que ya existan.
> Los nombres de tópicos y los campos JSON del enunciado deben respetarse **tal cual** (no renombrar).

---

## 7. Modelo de datos (DER del Hito 3)

El DER del Hito 2 se **extiende** (no se rehace). Convención de nombres del proyecto: prefijos `lk_` (tablas de lookup/maestras),
`ft_` (tablas de hechos), `id_`, `cod_`, `desc_`, `num_`, `flag_`, `f_val_`, `nom_`, `fecha_`, `hora_`.

### 7.1 Tablas existentes (Hito 2)
`lk_tiempo`, `lk_usuarios`, `lk_clientes`, `lk_vehiculos`, `ft_reservas`.
Relaciones: `lk_tiempo 1—N ft_reservas`, `lk_clientes 1—N ft_reservas`, `lk_vehiculos 1—N ft_reservas`, `lk_usuarios 1—N lk_clientes`.

### 7.2 Cambios y tablas nuevas (Hito 3)

**Columna nueva en `lk_vehiculos`:**
| Columna | Descripción |
|---|---|
| `desc_verificacion` | Resultado de la verificación policial asíncrona (Flujo A). Valores: `VALIDADO` / `ROBADO` (y, **[Sugerencia]**, un valor inicial tipo `PENDIENTE` hasta recibir el resultado). Es independiente de `desc_estado_vehiculo` (`DISPONIBLE` / `EN_ALQUILER`). |

**`ft_vehiculo_externo`** — tabla **temporal/de staging** del Flujo B. El vehículo del cliente permanece acá hasta que termina la validación.
| Columna | Tipo / Nota |
|---|---|
| `id_vehiculo_externo` | PK. Es el `vehiculoExternoId` de los eventos. |
| `id_cliente` | FK → `lk_clientes` (relación 1—N: un cliente puede registrar varios vehículos externos). |
| `cod_patente` | Patente declarada por el cliente. |
| `desc_estado_incorporacion` | `PENDIENTE` al crear; luego `INCORPORADO` o `RECHAZADO`. |
| `desc_resultado_patente` | Resultado de la validación de patente (`VALIDADO` / `RECHAZADO`); vacío/pendiente hasta recibir el evento. |
| `desc_resultado_titularidad` | Resultado de la validación de titularidad (`VALIDADO` / `RECHAZADO`); vacío/pendiente hasta recibir el evento. |
| `id_vehiculo` | FK → `lk_vehiculos`. **NULL hasta que el estado sea `INCORPORADO`.** Relación `lk_vehiculos 1 — 0..1 ft_vehiculo_externo`. |

Las columnas `desc_resultado_patente` y `desc_resultado_titularidad` son las que permiten **correlacionar** las dos validaciones del mismo `vehiculoExternoId`.

**Regla de incorporación:**
1. El cliente registra el vehículo → se inserta en `ft_vehiculo_externo` con `PENDIENTE` y `id_vehiculo = NULL` → se publica `vehiculos.externos.registrados`.
2. Llegan los dos resultados y se actualizan las columnas `desc_resultado_*`.
3. Si ambos son `VALIDADO` → se **inserta** el vehículo en `lk_vehiculos` con `desc_estado_vehiculo = DISPONIBLE`, se completa `id_vehiculo` en `ft_vehiculo_externo`, se marca `INCORPORADO` y se publica `vehiculos.externos.validacion.completada`.
4. Si alguno es `RECHAZADO` → se marca `RECHAZADO`; **no** se inserta nada en `lk_vehiculos`.

**`ft_mantenimientos`** — solicitud y resultado del mantenimiento preventivo (Flujo C).
| Columna | Tipo / Nota |
|---|---|
| `id_mantenimiento` | PK. |
| `id_reserva` | FK → `ft_reservas` (relación 1—N: una reserva puede tener mantenimientos asociados). |
| `id_vehiculo` | FK → `lk_vehiculos` (relación 1—N). |
| `desc_estado` | Estado de la solicitud; al finalizar, `REALIZADO` / `NO_REALIZADO` (**[Sugerencia]** un valor inicial como `SOLICITADO`/`PENDIENTE`). |
| `fecha_solicitud` | Cuándo se generó la solicitud (al consumir `reserva.confirmada`). |
| `fecha_resultado` | Cuándo se registró el resultado (NULL hasta que termina). |

**`lk_registro_policial`** — registro **simulado** de información policial.
| Columna | Tipo / Nota |
|---|---|
| `cod_patente` | PK. |
| `flag_robada` | `true` si la patente está denunciada como robada. |

**`lk_registro_titularidad`** — registro **simulado** de titularidad (registro externo).
| Columna | Tipo / Nota |
|---|---|
| `cod_patente` | PK. |
| `cod_documento_titular` | Documento del titular de esa patente. Se compara con `lk_clientes.cod_documento` del solicitante. |

### 7.3 Bases de datos separadas

Los dos registros simulados **no viven en la base principal de Rentar**: cada uno es una **base de datos propia**, para reflejar que son sistemas externos independientes.

| Base de datos | Contiene | La usa |
|---|---|---|
| `rentar_policial` | `lk_registro_policial` | Verificador (Flujo A) y Validador de patente (Flujo B) |
| `rentar_titularidad` | `lk_registro_titularidad` | Validador de titularidad (Flujo B) |

- Rentar **no** debe leer estas bases directamente: solo los componentes verificadores/validadores las consultan, y responden por eventos.
- La relación con los vehículos es **lógica, por patente (`cod_patente`)**, **sin FK**.
- Cargar datos de prueba (seeds): algunas patentes con `flag_robada = true` y algunas patentes con su documento de titular, para poder demostrar `VALIDADO`, `ROBADO` y `RECHAZADO`.
- Validación de titularidad: `VALIDADO` si el `cod_documento_titular` de la patente coincide con el `documento` del cliente (campo `documento` del evento `vehiculos.externos.validacion.titularidad`); caso contrario (o si la patente no existe en el registro) `RECHAZADO`.
- Validación de patente (Flujo B): `RECHAZADO` si `flag_robada = true`; `VALIDADO` en caso contrario.

### 7.4 Resumen de relaciones nuevas
```
lk_clientes   1 ── N  ft_vehiculo_externo
lk_vehiculos  1 ── 0..1 ft_vehiculo_externo   (id_vehiculo NULL hasta INCORPORADO)
ft_reservas   1 ── N  ft_mantenimientos
lk_vehiculos  1 ── N  ft_mantenimientos
lk_registro_policial / lk_registro_titularidad: sin FK, se consultan por cod_patente (bases rentar_policial y rentar_titularidad)
```

> Si el proyecto ya tiene nombres/tipos de columna definidos en código (entidades JPA, modelos, migraciones), **prevalece el código existente**
> y este DER se usa como guía semántica. Ante diferencias, preguntar al usuario.

---

## 8. Qué va por gRPC y qué por eventos

- **gRPC (síncrono):** operaciones que necesitan respuesta inmediata (lo ya implementado en Hito 2: CRUD, consultas, confirmación de reserva hacia el cliente, etc.).
- **Eventos (asíncrono):** verificación de patentes, validaciones de incorporación, mantenimiento preventivo y la propagación de sus resultados.

Regla práctica: si el usuario no necesita esperar el resultado para continuar, es candidato a evento.

---

## 9. Lineamientos técnicos sugeridos

**[Sugerencia]**
- Elegir **un** broker. Levantarlo con Docker/Docker Compose junto al resto del sistema.
  - Kafka: un tópico por evento del catálogo; usar `vehiculoId` / `vehiculoExternoId` / `reservaId` como key para ordenar por entidad; consumer groups por componente.
  - RabbitMQ: un exchange (topic) con routing keys iguales a los nombres de evento y una cola por consumidor.
- Incluir en cada mensaje un identificador/versión del evento si no rompe la estructura pedida (p. ej. en headers o metadata) para facilitar trazabilidad.
- Consumidores **idempotentes** y con manejo de errores/reintentos (y opcionalmente dead-letter).
- Registros simulados (policial y de titularidad): tablas/archivos/seeds propios con algunos casos de patentes robadas y titulares conocidos, para poder demostrar tanto `VALIDADO` como `ROBADO`/`RECHAZADO`.
- Mantenimiento: permitir simular `NO_REALIZADO` (p. ej. aleatorio o por regla) para demostrar ambos resultados.
- No agregar lógica bloqueante en el camino de la reserva: publicar el evento y responder.
- Mantener el código de propia autoría (ver normas de entrega).

---

## 10. Criterios de aceptación (checklist)

- [ ] Broker configurado y corriendo (Docker Compose recomendado).
- [ ] Hitos 1 y 2 siguen funcionando (web, API Gateway, gRPC).
- [ ] Flujo A: registrar vehículo → evento → verificación → evento resultado → Rentar actualiza; `ROBADO` inhabilita al vehículo sin crear un estado nuevo.
- [ ] Flujo B: vehículo externo en `PENDIENTE` → dos validaciones independientes → correlación → `DISPONIBLE` si todo `VALIDADO`; no se incorpora si hay algún `RECHAZADO`.
- [ ] Flujo C: confirmar reserva no se bloquea; mantenimiento procesa async y su resultado queda asociado a la reserva.
- [ ] Nombres de tópicos y estructuras JSON idénticos al enunciado.
- [ ] Eventos y estructuras documentados.
- [ ] Estados del vehículo en `lk_vehiculos` siguen siendo solo `DISPONIBLE` / `EN_ALQUILER`; `PENDIENTE` existe solo en `ft_vehiculo_externo`.
- [ ] Tablas nuevas creadas según la sección 7: `ft_vehiculo_externo`, `ft_mantenimientos`, columna `lk_vehiculos.desc_verificacion`.
- [ ] Bases `rentar_policial` y `rentar_titularidad` creadas, con datos de prueba, y consultadas solo por los verificadores/validadores.
- [ ] Vehículo externo validado se inserta en `lk_vehiculos` como `DISPONIBLE` y recién ahí se completa `ft_vehiculo_externo.id_vehiculo`.

---

## 11. Entregables (normas de entrega)

El incumplimiento de **cualquiera** implica desaprobación del TP.

1. **Documento** con:
   - Estrategia de resolución (diagrama del modelo de datos, arquitectura del sistema, etc.).
   - Pruebas realizadas con **capturas de pantalla**.
   - Integrantes del grupo y tareas realizadas por cada uno.
2. **Código fuente de propia autoría** en un **repositorio público de GitHub**.

> Al implementar, conviene ir dejando evidencia (logs de productores/consumidores, capturas de la consola del broker, requests de prueba)
> para armar la sección de pruebas del documento.

---

## 12. Instrucciones para el agente

1. Explorar primero el repositorio (servicios existentes, `.proto`, gateway, entidades/DB, docker-compose) antes de proponer cambios.
2. Reutilizar convenciones, lenguaje y frameworks ya usados en el proyecto.
3. Implementar flujo por flujo (A → B → C), verificando cada uno de punta a punta.
4. No renombrar tópicos ni campos definidos en este documento.
5. No introducir `ROBADO` como estado operativo del vehículo (usar `desc_verificacion` + `flag_activo`).
6. Respetar el modelo de datos de la sección 7: los vehículos externos esperan en `ft_vehiculo_externo` y solo se insertan en `lk_vehiculos` al validarse; los registros simulados están en las bases `rentar_policial` y `rentar_titularidad`.
7. Ante ambigüedad, preguntar al usuario en lugar de asumir.
