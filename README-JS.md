# EsSalud Citas y Medicamentos

Sistema de gestión hospitalaria para **EsSalud (Seguro Social de Salud del Perú)** que permite administrar pacientes, médicos, citas médicas, inventario de medicamentos y entregas de medicación en un flujo integrado.

## Contexto

Este sistema reemplaza una versión anterior construida en PHP/Laravel con una arquitectura moderna basada en Node.js y React. Está diseñado para cubrir el flujo completo de atención ambulatoria:

1. **Registro de pacientes** y médicos con sus especialidades
2. **Asignación de citas** evitando doble reserva del mismo médico en el mismo horario
3. **Control de inventario** de medicamentos con alertas de stock mínimo y vencimientos
4. **Entrega de medicamentos** con descuento automático de stock mediante transacciones
5. **Dashboard** con KPIs, gráficos y alertas en tiempo real
6. **Reportes** exportables a PDF y Excel

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Node.js + Express | ^4.21.2 |
| **Frontend** | React 18 + Vite | ^6.0.7 |
| **Base de datos** | MySQL (XAMPP) | — |
| **ORM/Driver** | mysql2 (con pool de conexiones) | ^3.22.5 |
| **Autenticación** | express-session + bcryptjs | — |
| **UI** | Bootstrap 5 + Tabler | ^5.3.3 / ^1.4.0 |
| **Exportación** | jsPDF (PDF), xlsx (Excel) | — |
| **Íconos** | Tabler Icons React | ^3.44.0 |

## Arquitectura

```
essalud-citas-medicamentos/
├── backend/                     # API REST (Express)
│   ├── src/
│   │   ├── config/database.js   # Pool de conexión MySQL
│   │   ├── controllers/         # Lógica de negocio por módulo
│   │   ├── middlewares/         # Auth (sesión) y error handler
│   │   ├── routes/              # Definición de rutas REST
│   │   ├── app.js               # Configuración Express
│   │   └── server.js            # Punto de entrada
│   └── package.json
│
├── frontend/                    # SPA React (Vite)
│   ├── src/
│   │   ├── api/http.js          # Cliente Axios
│   │   ├── components/          # Layout, DataTable reutilizable
│   │   ├── context/AuthContext  # Estado de autenticación
│   │   ├── pages/               # Login, Dashboard y CRUDs
│   │   ├── routes/AppRoutes     # Enrutador con guardias
│   │   └── styles/main.css     # Estilos personalizados
│   └── package.json
│
└── README-JS.md
```

## Base de Datos

El sistema opera sobre una base MySQL con 7 tablas principales:

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | Credenciales del sistema (login) |
| `pacientes` | Datos del paciente (con borrado lógico) |
| `especialidades` | Catálogo de especialidades médicas |
| `medicos` | Médicos vinculados a especialidad (borrado lógico) |
| `citas` | Citas programadas con estado (Pendiente/Atendida/Cancelada) |
| `medicamentos` | Inventario con stock, stock mínimo y fecha de vencimiento |
| `entrega_medicamentos` | Entregas a pacientes (descuenta stock automáticamente) |

## Reglas de Negocio Implementadas

- **Autenticación** por correo y contraseña con sesiones persistentes
- **Protección de rutas**: todas las rutas de API (excepto auth) requieren sesión activa
- **Eliminación lógica** en pacientes, médicos y medicamentos (campo `estado`)
- **Cancelación lógica** de citas mediante estado `Cancelada`
- **Validación de doble cita**: un médico no puede tener dos citas no canceladas en la misma fecha y hora
- **Transacciones**: al registrar una entrega de medicamento, el stock se descuenta dentro de una transacción SQL; si el stock es insuficiente, se revierte la operación
- **Alertas automáticas**: stock por debajo del mínimo y medicamentos próximos a vencer

## API - Endpoints Principales

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | KPIs, gráficos y alertas |

### Pacientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pacientes` | Listar pacientes |
| POST | `/api/pacientes` | Crear paciente |
| GET | `/api/pacientes/:id` | Obtener paciente |
| PUT | `/api/pacientes/:id` | Actualizar paciente |
| DELETE | `/api/pacientes/:id` | Eliminar (lógico) paciente |

### Médicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medicos` | Listar médicos |
| GET | `/api/medicos/especialidades` | Listar especialidades |
| POST | `/api/medicos` | Crear médico |
| GET | `/api/medicos/:id` | Obtener médico |
| PUT | `/api/medicos/:id` | Actualizar médico |
| DELETE | `/api/medicos/:id` | Eliminar (lógico) médico |

### Citas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/citas` | Listar citas |
| POST | `/api/citas` | Crear cita (valida doble reserva) |
| GET | `/api/citas/:id` | Obtener cita |
| PUT | `/api/citas/:id` | Actualizar cita |
| DELETE | `/api/citas/:id` | Cancelar cita |

### Medicamentos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/medicamentos` | Listar medicamentos |
| POST | `/api/medicamentos` | Crear medicamento |
| GET | `/api/medicamentos/:id` | Obtener medicamento |
| PUT | `/api/medicamentos/:id` | Actualizar medicamento |
| DELETE | `/api/medicamentos/:id` | Eliminar (lógico) medicamento |

### Entregas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/entregas` | Listar entregas |
| POST | `/api/entregas` | Registrar entrega (descuenta stock en transacción) |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes` | Datos filtrados para reportes |

## Cómo Iniciar el Proyecto

### Requisitos Previos

- Node.js 18 o superior
- MySQL activo (XAMPP o similar)
- Base de datos `essalud_citas_medicamentos` creada y poblada

### 1. Backend (API)

```bash
cd backend
npm install
cp .env.example .env   # Configurar credenciales de BD
npm run dev            # Inicia con nodemon en http://localhost:3000/api
```

**Variables de entorno (`.env`):**
```env
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="essalud_citas_medicamentos"
PORT=3000
FRONTEND_URL="http://localhost:5173"
SESSION_SECRET="cambiar_esta_clave_en_desarrollo"
```

### 2. Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env   # Configurar URL de API
npm run dev            # Inicia Vite en http://localhost:5173
```

**Variable de entorno (`.env`):**
```env
VITE_API_URL="http://localhost:3000/api"
```

### Modo Producción

```bash
cd frontend
npm run build          # Genera dist/ con los assets estáticos
npm run preview        # Sirve la build localmente
```

## Rutas del Frontend

| Ruta | Módulo |
|------|--------|
| `/login` | Inicio de sesión |
| `/` | Dashboard con KPIs y gráficos |
| `/pacientes` | CRUD de pacientes |
| `/medicos` | CRUD de médicos |
| `/citas` | CRUD de citas |
| `/medicamentos` | CRUD de medicamentos |
| `/entregas` | Registro de entregas |
| `/reportes` | Reportes con exportación PDF/Excel |

## Dashboard

La pantalla principal incluye:

- **Métricas clave**: total de pacientes, médicos, citas y medicamentos
- **Estado de citas**: desglose por estado (Pendiente, Atendida, Cancelada)
- **Alertas**: stock bajo, medicamentos por vencer y vencidos
- **Gráficos**: actividad diaria/semanal/mensual, distribución por especialidad
- **Tablas**: últimas citas, entregas recientes y medicamentos críticos
- **Selector de período**: hoy, esta semana, este mes

## Pendientes

- Agregar validaciones visuales en formularios frontend
- Convertir contraseñas existentes a hash bcrypt
- Revisar coherencia de nombres de columnas entre consultas SQL y esquema real
