import { Router } from 'express';
import { obtenerDashboard } from '../controllers/dashboard.controller.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', obtenerDashboard);
