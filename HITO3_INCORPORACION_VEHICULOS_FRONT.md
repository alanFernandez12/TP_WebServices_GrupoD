# Frontend Hito 3 — Incorporación de vehículos propios de cliente

## Implementado
- Menú `Mis vehículos` para usuarios CLIENTE.
- Formulario de solicitud que reutiliza el registration modal que usa el administrador
- Consulta de solicitudes con estados independientes de validación de patente y titularidad, y estado global.
- Actualización manual de estados (sin simular que RabbitMQ ha completado nada).
- La solicitud no envía `clienteId`: el Gateway DEBE determinarlo desde la sesión del usuario autenticado.

## Dependencia de backend (
Se utilizaron unas rutas tentativas, modificarlas de ser necesario o usar las especificadas aca
- `POST /api/vehiculos/externos` (Vite: `/gateway/vehiculos/externos`)
  Body: `{patente, marca, modelo, anio, color, tipoVehiculo, precio_diario}`.
  Respuesta: solicitud de incorporación con estado inicial `PENDIENTE`.
- `GET /api/vehiculos/externos/mis-solicitudes` (Vite: `/gateway/vehiculos/externos/mis-solicitudes`)
  Respuesta: array `{id,patente,marca,modelo,estado,validacionPatente,validacionTitularidad}`.

El Gateway debe autenticar CLIENTE, tomar `clienteId` de su sesión, verificar los datos, persistir la solicitud, publicar eventos RabbitMQ y devolver respuestas reales. El GET debe devolver exclusivamente las solicitudes del cliente autenticado.

## Comprobación
Abrir sesión CLIENTE → Mis vehículos → Incorporar vehículo → completar formulario → Enviar. Confirmar que el backend devuelve una solicitud PENDIENTE, que se registra y que aparece en Mis vehículos. Comprobar los dos validadores RabbitMQ y que la solicitud solo pasa a DISPONIBLE cuando ambos están validados; si cualquiera rechaza, queda RECHAZADO.

