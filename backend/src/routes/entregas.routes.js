import { Router } from 'express';
import { crearEntrega, listarEntregas } from '../controllers/entregas.controller.js';

export const entregasRoutes = Router();

entregasRoutes.get('/', listarEntregas);
entregasRoutes.post('/', crearEntrega);
