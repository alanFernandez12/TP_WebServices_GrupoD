# Vehicle Verifier

Servicio independiente del Flujo A. Consume solicitudes de verificación desde
RabbitMQ, consulta la base externa simulada `rentar_policial` y publica el
resultado. No accede ni modifica directamente la base principal `Rentar`.

## Flujo

```text
rentar.verificador.vehiculos
  -> VehicleVerifier
     -> rentar_policial.lk_registro_policial
        -> vehiculos.verificacion.resultado
           -> rentar.vehiculos.verificacion.resultado
```

Resultados posibles:

- `VALIDADO`: la patente no está marcada como robada.
- `ROBADO`: la patente existe y `flag_robada = TRUE`.

## Preparación

Crear la base policial ejecutando `sql\schema.sql` en MySQL. El seed incluye:

- `AA123BB`: `VALIDADO`.
- `ROBO123`: `ROBADO`.

Copiar `.env.example` como `.env` y completar `POLICE_DB_PASSWORD` si
corresponde. Instalar dependencias:

```powershell
cd services\vehicle-verifier
python -m pip install -r requirements.txt
```

## Ejecución

Con RabbitMQ iniciado y la topología declarada:

```powershell
cd services\vehicle-verifier
python app\verifier.py
```

El proceso queda esperando mensajes en
`rentar.verificador.vehiculos`. Al procesar una solicitud, confirma el mensaje
solo después de publicar el resultado. Los mensajes inválidos no se reintentan;
los errores inesperados se vuelven a poner en la cola.

Para iniciar el verificador de patentes del Flujo B:

```powershell
cd services\vehicle-verifier
python app\external_verifier.py
```

Este proceso consume `rentar.verificador.externos.patente` y publica
`vehiculos.externos.validacion.patente`. No modifica la base principal ni
interfiere con el verificador del Flujo A.

Ambos verificadores incluyen una demora simulada antes de consultar el registro
externo. Se configura en `.env` con `VEHICLE_VERIFIER_DELAY_SECONDS` para el
Flujo A y `EXTERNAL_PATENT_VERIFIER_DELAY_SECONDS` para el Flujo B; el valor
predeterminado es `30`. Para pruebas se puede usar `0`.
