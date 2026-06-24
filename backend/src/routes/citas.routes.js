import { Router } from 'express';
import {
  actualizarCita,
  cancelarCita,
  crearCita,
  listarCitas,
  obtenerCita
} from '../controllers/citas.controller.js';

export const citasRoutes = Router();

citasRoutes.get('/', listarCitas);
citasRoutes.post('/', crearCita);
citasRoutes.get('/:id', obtenerCita);
citasRoutes.put('/:id', actualizarCita);
citasRoutes.delete('/:id', cancelarCita);
