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
├── database/               # Scripts SQL de la base de datos
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
- Servidor MySQL activo (XAMPP, WAMP o instalación independiente).

### 2. Base de Datos
Para inicializar la base de datos, sigue estos pasos:
1. Crea una base de datos vacía llamada `simple_crud`.
2. Importa el archivo de esquema ubicado en `/database/database_schema.sql` en tu servidor MySQL. 
3. Asegúrate de insertar los roles necesarios en la tabla `roles` (ej. `admin`, `super_admin`, `user`, `guest`) para que el sistema funcione correctamente.

### 3. Variables de Entorno (.env)
Crea un archivo llamado `.env` en la **raíz del proyecto** basándote en el siguiente formato:
```env
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=simple_crud
PORT=3000
```
*Nota: El backend utiliza estas variables para establecer la conexión con la base de datos y definir el puerto del servidor.*

### 4. Instalación de dependencias
```bash
npm install
```

### 5. Ejecución
En terminales separadas:

**Servidor (Backend):**
```bash
node server/index.js
```

**Cliente (Frontend):**
```bash
npm run dev
```

## 📐 Base de Datos (Estructura de Almacenamiento)
El proyecto utiliza **Directory Sharding** para las imágenes de perfil. La ruta física se calcula como:
`storage/profiles/[ceil(user_id / 1000)]/[UUID].webp`

Esto permite manejar millones de archivos sin degradar el rendimiento del sistema de archivos.
