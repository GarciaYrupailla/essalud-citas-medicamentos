import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { citasRoutes } from './citas.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { entregasRoutes } from './entregas.routes.js';
import { medicamentosRoutes } from './medicamentos.routes.js';
import { medicosRoutes } from './medicos.routes.js';
import { pacientesRoutes } from './pacientes.routes.js';
import { reportesRoutes } from './reportes.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/dashboard', authMiddleware, dashboardRoutes);
apiRoutes.use('/pacientes', authMiddleware, pacientesRoutes);
apiRoutes.use('/medicos', authMiddleware, medicosRoutes);
apiRoutes.use('/citas', authMiddleware, citasRoutes);
apiRoutes.use('/medicamentos', authMiddleware, medicamentosRoutes);
apiRoutes.use('/entregas', authMiddleware, entregasRoutes);
apiRoutes.use('/reportes', authMiddleware, reportesRoutes);
