# Mensajería de Rentar

Este paquete contiene la topología compartida de RabbitMQ. La topología declara el Flujo A y los canales independientes del Flujo B:

```text
rentar.events (topic)
├── vehiculos.verificacion.solicitada
│   └── rentar.verificador.vehiculos
└── vehiculos.verificacion.resultado
    └── rentar.vehiculos.verificacion.resultado

vehiculos.externos.registrados
├── rentar.verificador.externos.patente
└── rentar.verificador.externos.titularidad

vehiculos.externos.validacion.patente
└── rentar.correlador.externos

vehiculos.externos.validacion.titularidad
└── rentar.correlador.externos

vehiculos.externos.validacion.completada
└── rentar.incorporacion.externos
```

Las colas son durables y cada consumidor tiene su propia cola. El Flujo A conserva sus routing keys y colas. El Flujo B reutiliza el mismo
exchange, pero tiene contratos y colas propias.

## Iniciar RabbitMQ

Desde Docker Desktop, iniciar un contenedor con la imagen
`rabbitmq:3-management`, exponiendo los puertos `5672` y `15672`.
Como alternativa, desde PowerShell:

```powershell
docker run -d --name rentar-rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  rabbitmq:3-management
```

La consola de administración queda disponible en
<http://localhost:15672>, con usuario `guest` y contraseña `guest`.

## Declarar el exchange, las colas y los bindings

El paquete utiliza `pika`, que debe instalarse en el entorno Python desde la
raíz del repositorio:

```powershell
python -m pip install -r services\messaging\requirements.txt
python -m services.messaging.topology
```

También se pueden cambiar los valores de conexión mediante `RABBITMQ_HOST`,
`RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` y
`RABBITMQ_VIRTUAL_HOST`.
