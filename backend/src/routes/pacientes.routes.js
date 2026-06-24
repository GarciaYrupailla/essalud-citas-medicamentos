import { Router } from 'express';
import {
  actualizarPaciente,
  crearPaciente,
  eliminarPaciente,
  listarPacientes,
  obtenerPaciente
} from '../controllers/pacientes.controller.js';

export const pacientesRoutes = Router();

pacientesRoutes.get('/', listarPacientes);
pacientesRoutes.post('/', crearPaciente);
pacientesRoutes.get('/:id', obtenerPaciente);
pacientesRoutes.put('/:id', actualizarPaciente);
pacientesRoutes.delete('/:id', eliminarPaciente);
