import { Router } from 'express';
import { obtenerReportes } from '../controllers/reportes.controller.js';

export const reportesRoutes = Router();

reportesRoutes.get('/', obtenerReportes);
