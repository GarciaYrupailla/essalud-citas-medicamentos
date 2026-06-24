import { Router } from 'express';
import {
  actualizarMedico,
  crearMedico,
  eliminarMedico,
  listarEspecialidades,
  listarMedicos,
  obtenerMedico
} from '../controllers/medicos.controller.js';

export const medicosRoutes = Router();

medicosRoutes.get('/especialidades', listarEspecialidades);
medicosRoutes.get('/', listarMedicos);
medicosRoutes.post('/', crearMedico);
medicosRoutes.get('/:id', obtenerMedico);
medicosRoutes.put('/:id', actualizarMedico);
medicosRoutes.delete('/:id', eliminarMedico);
