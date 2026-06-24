import { Router } from 'express';
import {
  actualizarMedicamento,
  crearMedicamento,
  eliminarMedicamento,
  listarMedicamentos,
  obtenerMedicamento
} from '../controllers/medicamentos.controller.js';

export const medicamentosRoutes = Router();

medicamentosRoutes.get('/', listarMedicamentos);
medicamentosRoutes.post('/', crearMedicamento);
medicamentosRoutes.get('/:id', obtenerMedicamento);
medicamentosRoutes.put('/:id', actualizarMedicamento);
medicamentosRoutes.delete('/:id', eliminarMedicamento);
