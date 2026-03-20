# Simple CRUD Social Platform

Una plataforma social moderna construida con React, Express y MySQL que implementa funcionalidades avanzadas de red social en tiempo real.

## 🚀 Características Principales

- **Gestión de Usuarios**: Registro, inicio de sesión y control de acceso basado en roles (Admin, Super Admin, User, Guest).
- **Feed Social**: Publicaciones, saltos de línea y actualización en tiempo real mediante Sockets.
- **Interacciones**: Sistema de Likes y Comentarios dinámicos en cada publicación.
- **Amistades**: Envío de solicitudes, aceptación/rechazo y lista de amigos con estado de conexión (Online/Offline) en vivo.
- **Mensajería Privada**: Chat en tiempo real con ventanas múltiples, sistema de notificaciones persistentes y modo minimizado.
- **Almacenamiento Optimizado**: Subida de fotos de perfil con conversión automática a WebP y técnica de *Directory Sharding* para escalabilidad.
- **Borrado Lógico**: Implementación en todas las tablas para integridad de datos.
- **Internacionalización**: Soporte multilingüe (Español/Inglés) con i18next.

## 🛠️ Stack Tecnológico

- **Frontend**: React 19, Tailwind CSS, DaisyUI, Socket.io-client, i18next.
- **Backend**: Node.js, Express, Socket.io, Multer, Sharp.
- **Base de Datos**: MySQL / MariaDB.

## 📂 Estructura del Proyecto

```text
├── server/                 # Backend Node.js
│   ├── config/             # Configuración de base de datos
│   ├── controllers/        # Lógica de negocio (MVC)
│   ├── routes/             # Definición de endpoints API
│   ├── utils/              # Funciones de ayuda (helpers)
│   └── index.js            # Punto de entrada del servidor y Sockets
├── src/                    # Frontend React
│   ├── components/         # Componentes modulares
│   │   ├── dashboard/      # Vistas y tarjetas específicas
│   │   ├── layout/         # Estructura visual común
│   │   └── shared/         # Componentes reutilizables
│   ├── hooks/              # Hooks personalizados (Lógica social)
│   └── App.jsx             # Enrutador principal
└── storage/                # Almacenamiento de medios (Sharding)
```

## ⚙️ Configuración e Instalación

### 1. Requisitos Previos
- Node.js (v18 o superior)
- Servidor MySQL activo.

### 2. Base de Datos
Crea una base de datos llamada `simple_crud` y asegura la existencia de las tablas (`users`, `roles`, `posts`, `posts_likes`, `posts_comments`, `friendships`, `private_messages`).

### 3. Instalación de dependencias
```bash
npm install
```

### 4. Ejecución
En terminales separadas:

**Servidor:**
```bash
node server/index.js
```

**Cliente:**
```bash
npm run dev
```

## 📐 Base de Datos (Estructura de Almacenamiento)
El proyecto utiliza **Directory Sharding** para las imágenes de perfil. La ruta física se calcula como:
`storage/profiles/[ceil(user_id / 1000)]/[UUID].webp`

Esto permite manejar millones de archivos sin degradar el rendimiento del sistema de archivos.
