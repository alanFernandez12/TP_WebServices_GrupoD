# Mensajería de Rentar

Este paquete contiene la topología compartida de RabbitMQ. La primera versión
declara únicamente el Flujo A de verificación de vehículos:

```text
rentar.events (topic)
├── vehiculos.verificacion.solicitada
│   └── rentar.verificador.vehiculos
└── vehiculos.verificacion.resultado
    └── rentar.vehiculos.verificacion.resultado
```

Las colas son durables y cada consumidor tiene su propia cola. La topología no
publica ni consume mensajes todavía.

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
