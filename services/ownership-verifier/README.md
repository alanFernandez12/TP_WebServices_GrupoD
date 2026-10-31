# Ownership Verifier — Validador de titularidad

## Propósito

`ownership-verifier` es un servicio REST que verifica si el número de documento informado corresponde al titular registrado para una patente.

La validación REST consulta `lk_registro_titularidad` directamente. Para la incorporación asíncrona de vehículos externos, el consumer RabbitMQ de este servicio recibe `vehiculos.externos.registrados` y publica `vehiculos.externos.validacion.titularidad`. No consulta Customer Service ni Vehicle Service.

## Funcionamiento

1. El cliente envía una patente y un número de documento.
2. El servicio valida y normaliza ambos datos.
3. Busca la patente en `lk_registro_titularidad`.
4. Compara el documento recibido con el documento asociado a esa patente.
5. Responde si la titularidad fue validada o informa por qué no pudo validarse.

La validación de titularidad no acredita otros aspectos del vehículo, como patente, robo o estado de incorporación.

## Endpoint

`POST /api/titularidad/validar`

### Solicitud

```json
{
  "patente": "AA-123-BB",
  "numero_documento": "30.111.222"
}
```

### Respuestas

#### 1) Titularidad validada

`HTTP 200 OK`

```json
{
  "valido": true,
  "codigo": "TITULARIDAD_VALIDADA",
  "mensaje": "La patente y el documento coinciden con el registro"
}
```

#### 2) Patente no registrada

`HTTP 200 OK`

```json
{
  "valido": false,
  "codigo": "PATENTE_NO_REGISTRADA",
  "mensaje": "La patente no figura en el registro de titularidad"
}
```

#### 3) Documento diferente

`HTTP 200 OK`

```json
{
  "valido": false,
  "codigo": "DOCUMENTO_NO_COINCIDE",
  "mensaje": "El documento no coincide con el titular registrado"
}
```

Los dos últimos casos son resultados de negocio: la solicitud pudo procesarse, pero los datos no validan la titularidad.

### Errores de solicitud o infraestructura

| HTTP | Situación |
| --- | --- |
| 422 | La solicitud no cumple las validaciones de formato. |
| 503 | No se pudo consultar la base del registro automotor. |

## Validaciones y normalización

- La patente admite entre 6 y 7 caracteres alfanuméricos. Se convierten las letras a mayúsculas y se quitan espacios y guiones. Por ejemplo, `AA-123-BB` se compara como `AA123BB`.
- El documento debe quedar compuesto por entre 7 y 11 dígitos. Se quitan los caracteres que no son numéricos. Por ejemplo, `30.111.222` se compara como `30111222`.
- El servicio no incluye el documento registrado en la respuesta.

## Base de datos

La aplicación usa las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. El registro externo del Hito 3 vive en la base independiente `rentar_titularidad`; si no se define `DB_NAME`, ese es el valor predeterminado.

La tabla consultada tiene esta estructura esperada:

```sql
CREATE DATABASE rentar_titularidad;
USE rentar_titularidad;
CREATE TABLE IF NOT EXISTS lk_registro_titularidad (
    id_registro BIGINT NOT NULL AUTO_INCREMENT,
    cod_patente VARCHAR(20) NOT NULL,
    cod_documento_titular VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_registro),
    UNIQUE KEY uk_registro_patente (cod_patente)
);
```

La patente debe almacenarse normalizada, sin espacios ni guiones, y el documento sin separadores.

Ejemplo de registro de prueba:

```sql
INSERT INTO lk_registro_titularidad
    (cod_patente, cod_documento_titular)
VALUES
    ('AA123BB', '30111222')
ON DUPLICATE KEY UPDATE
    cod_documento_titular = '30111222';
```

La tabla debe existir en la base indicada por `DB_NAME`. El servicio no crea bases ni tablas automáticamente.

## Configuración local

Crear `services\ownership-verifier\.env` con la conexión a MySQL y RabbitMQ. Para Docker Desktop con ambos servicios publicados en el host, se puede copiar `.env.example` y completar la contraseña de MySQL:

```env
DB_HOST=host.docker.internal
DB_PORT=3306
DB_NAME=rentar_titularidad
DB_USER=root
DB_PASSWORD=colocar-la-clave-local
RABBITMQ_HOST=host.docker.internal
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VIRTUAL_HOST=/
```

No subir el archivo `.env` ni contraseñas reales al repositorio.

## Instalación y ejecución en PowerShell

Desde la raíz del repositorio:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "rentar_titularidad"
$env:DB_USER = "root"
$env:DB_PASSWORD = "Tu_password_local"
python -m venv .\services\ownership-verifier\.venv
& .\services\ownership-verifier\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\services\ownership-verifier\.venv\Scripts\python.exe -m pip install -r .\services\ownership-verifier\requirements.txt
```

Iniciar el servicio:

```powershell
Set-Location .\services\ownership-verifier
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --reload --port 8094
```

El servicio queda disponible en `http://localhost:8094`. La documentación interactiva de FastAPI está en `http://localhost:8094/docs`.
`GET /health` devuelve el estado de la API sin consultar MySQL.

Para ejecutar el consumer en una terminal independiente, desde la raíz:

```powershell
Set-Location .\services\ownership-verifier
& .\.venv\Scripts\python.exe -m app.ownership_consumer
```

El consumer procesa mensajes de `rentar.verificador.titularidad`. El evento de
entrada debe tener esta estructura (el `documento` se obtiene del cliente
autenticado y es necesario para verificar la titularidad):

```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "patente": "DEF456",
  "documento": "30123456"
}
```

El resultado publicado en `vehiculos.externos.validacion.titularidad` conserva
los identificadores y datos de correlación, e incluye `resultado`:

```json
{
  "vehiculoExternoId": 50,
  "clienteId": 89,
  "documento": "30123456",
  "patente": "DEF456",
  "resultado": "VALIDADO"
}
```

Si la patente no existe en el registro o el documento no coincide, el
resultado es `RECHAZADO`. El consumer confirma la solicitud después de
publicar el resultado; los errores de infraestructura vuelven a poner el
mensaje en la cola y los mensajes con formato inválido se rechazan.

## Docker

Construir la imagen desde la raíz del repositorio:

```powershell
docker build -t ownership-verifier:local -f services\ownership-verifier\Dockerfile .
```

Iniciarla en la misma red Docker que MySQL:

```powershell
docker run --rm --name ownership-verifier --env-file services\ownership-verifier\.env -p 8094:8094 ownership-verifier:local
```

En otra terminal, iniciar el consumer con la misma imagen y variables:

```powershell
docker run -d --name ownership-verifier-consumer --no-healthcheck --env-file services\ownership-verifier\.env ownership-verifier:local python -m app.ownership_consumer
```

Configurar `DB_HOST=host.docker.internal`, `DB_NAME=rentar_titularidad` y
`RABBITMQ_HOST=host.docker.internal` en el `.env` cuando MySQL y RabbitMQ corren
en el host y publican sus puertos. Si el consumer y el broker están en una
misma red Docker, usar el nombre DNS del contenedor RabbitMQ en `RABBITMQ_HOST`.
El servicio REST responde en `http://localhost:8094`; `GET /health` comprueba
la API, no la conectividad con MySQL o RabbitMQ.

> Si `python` no está disponible en el PATH, usar `py -3.11` en lugar de `python`.

## Prueba desde PowerShell

Con RabbitMQ, MySQL y el registro de prueba de `sql\schema.sql` disponibles,
primero inicia el consumer en una terminal:

```powershell
docker run --rm --name ownership-verifier-test `
  --no-healthcheck `
  --env-file services\ownership-verifier\.env `
  -e DB_NAME=rentar_titularidad `
  -e RABBITMQ_HOST=host.docker.internal `
  -e OWNERSHIP_VERIFIER_DELAY_SECONDS=0 `
  ownership-verifier:local python -m app.ownership_consumer
```

En otra terminal, desde la raíz del repositorio, ejecuta la prueba dentro de la
imagen:

```powershell
docker run --rm `
  --env-file services\ownership-verifier\.env `
  -e RABBITMQ_HOST=host.docker.internal `
  -e OWNERSHIP_TEST_TIMEOUT_SECONDS=90 `
  ownership-verifier:local python probar_rabbitmq.py
```

El script publica dos solicitudes, comprueba los resultados en una cola
temporal y la elimina al finalizar. Usa el fixture `AA123BB` /
`30111222`: un caso debe resultar `VALIDADO` y otro `RECHAZADO`. Si no hay un
consumer activo, si no se recibe respuesta dentro del tiempo límite o si el
resultado no coincide, termina con error. El tiempo límite puede cambiarse
con `--timeout 120` o `OWNERSHIP_TEST_TIMEOUT_SECONDS`.

Con el servicio iniciado y la tabla cargada con un registro de prueba:

```powershell
$body = @{
    patente = "AA-123-BB"
    numero_documento = "30.111.222"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:8094/api/titularidad/validar" `
    -ContentType "application/json" `
    -Body $body
```

## Componentes principales

- `app\main.py`: define el endpoint REST, las validaciones de entrada y la consulta a MySQL.
- `app\ownership_consumer.py`: consume solicitudes de incorporación y publica la validación de titularidad.
- `Dockerfile` y `.dockerignore`: construyen la imagen de ejecución del servicio.
- `requirements.txt`: dependencias de FastAPI, Uvicorn, MySQL Connector y python-dotenv.
- `.env`: configuración local de conexión a la base; no debe versionarse. `.env.example` documenta las variables requeridas.
