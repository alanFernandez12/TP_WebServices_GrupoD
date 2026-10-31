# Mensajería de Rentar

Este paquete declara el exchange `rentar.events` y las colas durables que usan
los consumidores. Para la verificación de titularidad de vehículos externos:

```text
vehiculos.externos.registrados
    -> rentar.verificador.titularidad
ownership-verifier
    -> vehiculos.externos.validacion.titularidad
```

La cola `rentar.verificador.titularidad` recibe la solicitud de alta. El
validador publica el resultado en el exchange compartido; Rentar es responsable
de enlazar su cola a `vehiculos.externos.validacion.titularidad`.

El evento de entrada debe incluir `vehiculoExternoId`, `clienteId`, `patente` y
`documento`. El consumer devuelve los mismos datos con `resultado` igual a
`VALIDADO` o `RECHAZADO`.

## Iniciar RabbitMQ

Desde Docker Desktop, iniciar `rabbitmq:3-management` exponiendo los puertos
`5672` y `15672`. También se puede iniciar desde PowerShell:

```powershell
docker run -d --name rentar-rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  rabbitmq:3-management
```

La consola de administración queda disponible en
<http://localhost:15672>, con usuario `guest` y contraseña `guest`.

## Declarar topología

Instalar `pika` y declarar las colas desde la raíz del repositorio:

```powershell
python -m pip install -r services\messaging\requirements.txt
python -m services.messaging.topology
```

La conexión se configura con `RABBITMQ_HOST`, `RABBITMQ_PORT`,
`RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` y `RABBITMQ_VIRTUAL_HOST`.
