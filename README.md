# SEMS UI — Scientific Event Management System

Frontend React + TypeScript + Vite para el **II Simposio Internacional de Ciencia Abierta 2026**.

## Requisitos

- Node.js >= 18
- npm
- Backend `sems_api` corriendo en `http://localhost:3000`

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

El archivo `.env` ya está configurado:

```env
VITE_API_URL=http://localhost:3000/api
```

Ajusta la URL si el backend corre en otro puerto o host.

### 3. Arrancar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compilar para producción |
| `npm run preview` | Vista previa del build de producción |

## Estructura del proyecto

```
src/
├── api/                  # Clientes HTTP (axios)
│   ├── axios.ts          # Instancia base con interceptores JWT
│   ├── auth.api.ts
│   ├── events.api.ts
│   ├── submissions.api.ts
│   ├── agenda.api.ts
│   └── index.ts          # Resto de APIs (countries, organizers, etc.)
├── components/
│   ├── public/           # Layout, Navbar, Footer del sitio público
│   └── dashboard/        # DashboardLayout, Sidebar
├── pages/
│   ├── public/           # Home, Submit, Guidelines, Organizers, Agenda, CheckStatus
│   └── dashboard/        # Login, Home, Submissions, AgendaBuilder, CRUDs admin
├── store/
│   └── auth.store.ts     # Zustand store con persistencia JWT
├── types/
│   └── index.ts          # Interfaces TypeScript completas
├── utils/
│   └── index.ts          # STATUS_CONFIG, labels, cn() helper
├── App.tsx               # Router con rutas públicas y privadas
├── index.css             # Clases utilitarias Tailwind personalizadas
└── main.tsx
```

## Rutas del sitio

### Públicas

| Ruta | Página |
|---|---|
| `/` | Inicio — secciones dinámicas del evento |
| `/pautas` | Pautas de publicación |
| `/organizadores` | Organizadores e instituciones |
| `/postular` | Formulario de postulación (4 pasos) |
| `/agenda` | Agenda del evento (cuando esté publicada) |
| `/verificar` | Verificar estado de postulación por email |

### Dashboard (requieren autenticación)

| Ruta | Página | Acceso |
|---|---|---|
| `/dashboard/login` | Inicio de sesión | Público |
| `/dashboard` | Panel principal con estadísticas | Admin / Evaluador |
| `/dashboard/submissions` | Lista de postulaciones | Admin / Evaluador |
| `/dashboard/submissions/:id` | Detalle y gestión de postulación | Admin / Evaluador |
| `/dashboard/agenda` | Constructor de agenda (drag-and-drop) | Admin / Evaluador |
| `/dashboard/countries` | Gestión de países | Solo Admin |
| `/dashboard/users` | Gestión de usuarios | Solo Admin |
| `/dashboard/events` | Gestión de eventos | Solo Admin |
| `/dashboard/organizers` | Gestión de organizadores | Solo Admin |
| `/dashboard/guidelines` | Gestión de pautas | Solo Admin |
| `/dashboard/axes` | Gestión de ejes temáticos | Solo Admin |
| `/dashboard/product-types` | Tipos de producto científico | Solo Admin |
| `/dashboard/page-sections` | CMS contenido del sitio | Solo Admin |

## Credenciales de prueba

Después de ejecutar el seed del backend:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@sems.edu` | `Admin2026!` |
| Evaluador | `evaluador@sems.edu` | `Eval2026!` |

## Diseño

- **Colores**: Verde UMAYOR `#007F3A` (primario) + Rojo `#E60553` (acento)
- **Tipografía**: Montserrat (headings) + Roboto (body)
- **Framework CSS**: Tailwind CSS 3 con clases utilitarias personalizadas (`.btn-primary`, `.form-input`, `.card`, `.badge`, etc.)
- **Componentes**: Lucide React para iconos, react-hot-toast para notificaciones

## Tecnologías principales

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | Framework UI |
| TypeScript | 5 | Tipado estático |
| Vite | 5 | Build tool y dev server |
| TanStack Query | 5 | Server state management |
| React Hook Form | 7 | Formularios con validación |
| Zod | 3 | Schemas de validación |
| Zustand | 4 | Estado global (auth) |
| @dnd-kit | 6 | Drag-and-drop agenda builder |
| Tailwind CSS | 3 | Estilos utilitarios |
| Axios | 1 | Cliente HTTP |
| React Router DOM | 6 | Enrutamiento |
