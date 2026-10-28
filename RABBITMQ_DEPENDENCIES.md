# Dependencias de RabbitMQ

## Java

- `org.springframework.boot:spring-boot-starter-amqp`: integra la aplicación Spring Boot con RabbitMQ y proporciona la infraestructura AMQP para futuras operaciones de mensajería.

## Python

- `pika==1.3.2`: cliente Python para conectarse a RabbitMQ mediante AMQP. Se declara para `rental-service` y se instala en el entorno virtual compartido usado por los scripts de arranque.

La configuración inicial de conexión utiliza `localhost:5672` y las credenciales locales `guest`/`guest`. En esta etapa no se implementan productores, consumidores ni lógica de negocio.

## Requisito y puesta en marcha

Es necesario tener Docker Desktop instalado y ejecutándose para levantar el contenedor de RabbitMQ.

Desde PowerShell, ejecutar:

```powershell
docker run -d --name rentar-rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  rabbitmq:3-management
```

El puerto `5672` se utiliza para las conexiones AMQP de la aplicación y el puerto `15672` permite acceder a la interfaz de administración web en <http://localhost:15672>. Las credenciales predeterminadas son:

- Usuario: `guest`
- Contraseña: `guest`

Para comprobar que el contenedor está ejecutándose:

```powershell
docker ps
```

Para detenerlo:

```powershell
docker stop rentar-rabbitmq
```

Para volver a iniciarlo después de detenerlo:

```powershell
docker start rentar-rabbitmq
```

Si el contenedor ya existe, no se debe ejecutar nuevamente `docker run`; utilizar `docker start rentar-rabbitmq`.
