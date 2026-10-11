# Rental Service — gRPC

Microservicio de reservas y alquileres de **Rentar**, implementado en Python. Expone operaciones gRPC definidas en el contrato compartido `proto/rental.proto` y se comunica con el API Gateway, que ofrece los endpoints HTTP para la interfaz.

Este README cubre el punto **4. Rental Service gRPC** de la consigna: crear reservas, consultar reservas, cancelarlas y consultar el historial.

## Alcance y responsabilidades

Rental Service es responsable de las reglas de negocio y persistencia de las reservas:

- Crear reservas y calcular duración, precio histórico e importe total.
- Consultar todas las reservas o una reserva por ID.
- Cancelar una reserva antes de su fecha de inicio.
- Consultar el historial de un cliente, incluyendo reservas terminadas o canceladas.
- Validar que el cliente y el vehículo existan y estén activos, y que el vehículo no tenga otra reserva superpuesta.

La interfaz web debe comunicarse con el API Gateway, no directamente con este microservicio. El Gateway se comunica con Rental Service mediante gRPC.

### Coordinación para crear una reserva

Según el flujo de la consigna, el Gateway debe coordinar las validaciones con Customer Service y Vehicle Service y, si son satisfactorias, invocar `CreateRental` en Rental Service. Rental Service aplica además sus propias validaciones antes de persistir la reserva.

> **Nota sobre la implementación actual:** el Gateway existente ya invoca `CreateRental`, pero su controlador de alta no coordina todavía las consultas a Customer Service y Vehicle Service. Por eso, este servicio no debe documentarse como si esa coordinación del Gateway ya estuviera implementada. La validación de cliente, vehículo y disponibilidad dentro de Rental Service protege la operación de todas formas.

## Arquitectura

```text
Interfaz web
    │ HTTP/REST
    ▼
API Gateway (Node.js / TypeScript)
    │ gRPC
    ▼
Rental Service (Python)
    │ MySQL
    ▼
Base Rentar