# Migracion JavaScript - EsSalud Citas y Medicamentos

Esta carpeta contiene la nueva version en JavaScript:

- `backend/`: API con Node.js, Express y conexion directa a MySQL de XAMPP.
- `frontend/`: aplicacion React con Vite, React Router, Axios y Bootstrap.

## Estructura

```txt
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── app.js
│   └── server.js
└── package.json

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Requisitos

- Node.js 18 o superior.
- MySQL activo en XAMPP.
- Base de datos `essalud_citas_medicamentos` existente.

## Backend

Entrar a la carpeta:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear archivo `.env` copiando `.env.example`:

```env
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="essalud_citas_medicamentos"
PORT=3000
FRONTEND_URL="http://localhost:5173"
SESSION_SECRET="cambiar_esta_clave_en_desarrollo"
```

Ejecutar backend:

```bash
npm run dev
```

API disponible en:

```txt
http://localhost:3000/api
```

## Frontend

Entrar a la carpeta:

```bash
cd frontend
```

Instalar dependencias:

```bash
npm install
```

Crear archivo `.env` copiando `.env.example`:

```env
VITE_API_URL="http://localhost:3000/api"
```

Ejecutar frontend:

```bash
npm run dev
```

Aplicacion disponible en:

```txt
http://localhost:5173
```

## Endpoints Principales

```txt
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/dashboard

GET    /api/pacientes
POST   /api/pacientes
GET    /api/pacientes/:id
PUT    /api/pacientes/:id
DELETE /api/pacientes/:id

GET    /api/medicos
GET    /api/medicos/especialidades
POST   /api/medicos
GET    /api/medicos/:id
PUT    /api/medicos/:id
DELETE /api/medicos/:id

GET    /api/citas
POST   /api/citas
GET    /api/citas/:id
PUT    /api/citas/:id
DELETE /api/citas/:id

GET    /api/medicamentos
POST   /api/medicamentos
GET    /api/medicamentos/:id
PUT    /api/medicamentos/:id
DELETE /api/medicamentos/:id

GET    /api/entregas
POST   /api/entregas

GET    /api/reportes
```

## Reglas Migradas

- Autenticacion por correo y contrasena.
- Proteccion de rutas con sesion.
- Eliminacion logica de pacientes, medicos y medicamentos.
- Cancelacion logica de citas usando estado `Cancelada`.
- Validacion para evitar doble cita del mismo medico en la misma fecha y hora.
- Registro de entrega de medicamento con transaccion.
- Descuento automatico de stock al registrar entrega.
- Validacion de stock insuficiente.
- Dashboard y reportes conectados a la base de datos.

## Pendiente Para Completar La Migracion

- Agregar formularios de crear/editar en React.
- Agregar botones de editar, eliminar y cancelar.
- Agregar validaciones visuales en formularios.
- Agregar graficos en dashboard/reportes.
- Convertir passwords existentes a hash con bcrypt.
- Revisar que los nombres de columnas reales coincidan con las consultas SQL de `backend/src/controllers/`.
