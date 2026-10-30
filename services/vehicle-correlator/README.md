# Correlador del Flujo B

Componente independiente que consume los resultados de patente y titularidad
del Flujo B y los correlaciona en MySQL usando `vehiculoExternoId`.

## Comportamiento

- Si recibe un resultado `RECHAZADO`, marca la solicitud como terminalmente
  rechazada y no publica `vehiculos.externos.validacion.completada`.
- Si recibe `VALIDADO` para patente y titularidad, publica:

```json
{
  "vehiculoExternoId": 50
}
```

en `vehiculos.externos.validacion.completada`.

- Si recibe solo uno de los resultados, conserva el estado en la tabla de
  correlación.
- Si recibe mensajes repetidos después de una decisión terminal, los confirma
  sin volver a publicar el evento final.

El estado se conserva si se reinicia el proceso, porque la correlación se
guarda en MySQL. La tabla se crea ejecutando
`Proyecto/BD/Hito3_FlujoB.sql`.

## Ejecución

Desde la raíz del repositorio:

```powershell
python -m pip install -r services\vehicle-correlator\requirements.txt
Copy-Item services\vehicle-correlator\.env.example services\vehicle-correlator\.env
python services\vehicle-correlator\app\correlator.py
```

Configurar en `.env` las credenciales de MySQL (`DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER` y `DB_PASSWORD`) antes de iniciar el proceso.

La cola consumida es:

```text
rentar.correlador.externos
```

La topología se declara automáticamente al iniciar el componente.
