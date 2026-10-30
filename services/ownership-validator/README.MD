# Ownership Validator — Validador de titularidad

## Propósito

`ownership-validator` es un servicio REST que verifica si el número de documento informado corresponde al titular registrado para una patente.

Para realizar la comprobación, consulta directamente la tabla `lk_registro_titularidad` de la base configurada para el registro automotor. No consulta Customer Service, Vehicle Service ni otros servicios, ni utiliza RabbitMQ.

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

La aplicación usa las variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Si no se define `DB_NAME`, el valor por defecto configurado actualmente en `app/main.py` es `Rentar_RegistroAutomotor`.

La tabla consultada tiene esta estructura esperada:

```sql
Create Database Rentar_RegistroAutomotor;
USE Rentar_RegistroAutomotor;
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

La tabla debe existir en la base indicada por `DB_NAME`. El servicio no crea bases ni tablas automáticamente. El script `Proyecto\BD\RentarBD.sql` debe actualizarse si también se espera que cree este esquema y esta tabla.

## Configuración local

Crear `services\ownership-validator\.env` con los datos de conexión del entorno local:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Rentar_RegistroAutomotor
DB_USER=root
DB_PASSWORD=colocar-la-clave-local
```

No subir el archivo `.env` ni contraseñas reales al repositorio.

## Instalación y ejecución en PowerShell

Desde la raíz del repositorio:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "Rentar_RegistroAutomotor"
$env:DB_USER = "root"
$env:DB_PASSWORD = "Tu_password_local"
python -m venv .\services\ownership-validator\.venv
& .\services\ownership-validator\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\services\ownership-validator\.venv\Scripts\python.exe -m pip install -r .\services\ownership-validator\requirements.txt
```

Iniciar el servicio:

```powershell
Set-Location .\services\ownership-validator
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --reload --port 8094
```

El servicio queda disponible en `http://localhost:8094`. La documentación interactiva de FastAPI está en `http://localhost:8094/docs`.

> Si `python` no está disponible en el PATH, usar `py -3.11` en lugar de `python`.

## Prueba desde PowerShell

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
- `requirements.txt`: dependencias de FastAPI, Uvicorn, MySQL Connector y python-dotenv.
- `.env`: configuración local de conexión a la base; no debe versionarse.
