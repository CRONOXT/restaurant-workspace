# Resumen del Proyecto: Sistema de Pedidos Multi-Usuario y Sesiones

Este documento resume las funcionalidades implementadas para permitir que múltiples usuarios compartan una mesa, gestionen sus propias cuentas y realicen pedidos individuales o compartidos con supervisión del personal.

## 🚀 Funcionalidades Implementadas

### 1. Gestión de Sesiones y Comensales
- **Sesiones de Mesa**: Cada mesa ocupada tiene una sesión activa con un código único de 6 dígitos.
- **Identificación de Comensales**: Los usuarios se identifican por nombre al entrar. El primer usuario es el **Líder** de la mesa.
- **Invitación**: El líder puede ver el código de invitación y compartirlo para que otros se unan a la misma mesa.
- **Persistencia**: Se utiliza un token (UUID) almacenado en `localStorage` para que los usuarios no pierdan su sesión al recargar la página.

### 2. Sistema de Pedidos Inteligente
- **Pedidos Individuales**: Por defecto, los pedidos se cargan a la cuenta del comensal que los realiza.
- **Pedidos Compartidos**: Existe un selector en el carrito para marcar un pedido como compartido. El costo se divide automáticamente entre todos los miembros de la sesión.
- **Estados de Pedido**:
  - `PENDIENTE`: El pedido ha sido enviado pero no aceptado.
  - `ACEPTADO`: El camarero ha visto el pedido y está en preparación.
  - `ENTREGADO`: El pedido ha sido servido al cliente.

### 3. Cuentas y Desglose (Lado Cliente)
- **Mi Cuenta**: Cada usuario puede ver su desglose en tiempo real:
  - Subtotal de pedidos personales.
  - Parte proporcional de los pedidos compartidos.
  - Total general a pagar.

### 4. Backoffice y Gestión (Lado Camarero)
- **Vista de Mesas**: Indica cuántos comensales hay y el código de sesión.
- **Agrupación de Pedidos**: En el panel de gestión, los pedidos se agrupan por comensal para facilitar la lectura.
- **Acciones Masivas**: Botones para "Aceptar Todo" o "Entregar Todo" por cada comensal.
- **Ver Cuentas**: Panel detallado que muestra cuánto debe pagar cada persona de la mesa, incluyendo el desglose de compartidos.

### 5. Seguridad y Cierre de Mesa
- **Solicitud de Cierre**: El líder solicita el cierre de la mesa desde su dispositivo.
- **Aprobación del Camarero**: El camarero recibe una notificación en tiempo real (WebSocket) y debe aprobar o rechazar el cierre.
- **Control de Pago**: Esto evita que los clientes cierren la mesa sin que el camarero verifique el pago.

## 🛠️ Detalles Técnicos
- **Backend**: NestJS + Prisma (PostgreSQL).
- **Frontend**: Angular (Backoffice y Menú Público integrados).
- **Comunicación**: Socket.io para actualizaciones en tiempo real (pedidos, nuevos comensales, solicitudes de cierre).
- **Configuración**: Centralizada en archivo `.env`.

---
*Este documento sirve como contexto para futuras sesiones de desarrollo.*
