# 🍽️ Savor - Restaurant Management System (Multi-tenant SaaS)

[English](#english) | [Español](#español)

---

## English

### 🚀 Overview
**Savor** is a high-performance, full-stack restaurant management solution built on a multi-tenant SaaS architecture. It enables multiple companies to manage their branches, menus, and real-time operations through a unified platform.

### 🏗️ Architecture
- **Monorepo**: Managed with [Nx](https://nx.dev) for seamless full-stack development.
- **Frontend**: Built with **Angular**, featuring a premium "Glassmorphism" UI and responsive design for mobile customers.
- **Backend**: **NestJS** (Node.js framework) providing a robust and scalable REST API.
- **Database**: **PostgreSQL** with **Prisma ORM** for type-safe data management.
- **Real-time**: **Socket.io** for instant synchronization between customers and staff.

### ✨ Key Features
- **Multi-tenant SaaS**: Global Super Admin dashboard and isolated company management.
- **Role-Based Access (RBAC)**: 
  - `SUPER_ADMIN`: Platform metrics and global management.
  - `ADMIN_EMPRESA`: Business-wide settings and branch control.
  - `GERENTE/CAMARERO`: Daily operations, table management, and orders.
- **QR Ordering System**: Customers scan table-specific QRs to access the menu and order without an app.
- **Order Lifecycle**: Automated flow from `PENDIENTE` (Pending) to `PAGADO` (Paid).
- **Special Notes**: Customers can add custom instructions (e.g., "No onions") per item.
- **Live Sync**: Instant notifications for new orders, table requests, and status changes.

---

## Español

### 🚀 Descripción General
**Savor** es una solución integral de gestión de restaurantes de alto rendimiento basada en una arquitectura SaaS multi-empresa. Permite que múltiples negocios gestionen sus sucursales, menús y operaciones en tiempo real a través de una plataforma unificada.

### 🏗️ Arquitectura
- **Monorepo**: Gestionado con [Nx](https://nx.dev) para un desarrollo full-stack fluido.
- **Frontend**: Desarrollado en **Angular**, con una interfaz premium tipo "Glassmorphism" y diseño responsivo para comensales.
- **Backend**: **NestJS** (Node.js framework) que ofrece una API REST robusta y escalable.
- **Base de Datos**: **PostgreSQL** con **Prisma ORM** para una gestión de datos segura y tipada.
- **Tiempo Real**: **Socket.io** para sincronización instantánea entre clientes y personal.

### ✨ Funcionalidades Clave
- **SaaS Multi-empresa**: Panel de Súper Admin global y gestión aislada por empresa.
- **Control de Acceso (RBAC)**: 
  - `SUPER_ADMIN`: Métricas de plataforma y gestión global.
  - `ADMIN_EMPRESA`: Configuración de negocio y control de sucursales.
  - `GERENTE/CAMARERO`: Operaciones diarias, gestión de mesas y pedidos.
- **Sistema de Pedidos por QR**: Los clientes escanean QRs específicos por mesa para pedir directamente desde su móvil.
- **Ciclo de Vida del Pedido**: Flujo automatizado desde `PENDIENTE` hasta `PAGADO`.
- **Notas Especiales**: Los clientes pueden añadir instrucciones personalizadas (ej: "Sin cebolla") por plato.
- **Sincronización en Vivo**: Notificaciones instantáneas de nuevos pedidos, solicitudes de cierre y cambios de estado.

---

### 🛠️ Installation / Instalación

```bash
# Install dependencies / Instalar dependencias
npm install

# Database Setup / Configuración de BD
npx prisma generate
npx prisma db push

# Run Backend / Ejecutar API
npx nx serve api

# Run Backoffice / Ejecutar Panel
npx nx serve backoffice --host 0.0.0.0
```

---
*Developed by Google Deepmind Team with Savor Framework.*
