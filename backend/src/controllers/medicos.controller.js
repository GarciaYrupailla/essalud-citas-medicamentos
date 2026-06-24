import { pool } from '../config/database.js';

export async function listarMedicos(req, res, next) {
  try {
    const [medicos] = await pool.query(`
      SELECT
        m.id_medico AS idMedico,
        m.id_especialidad AS idEspecialidad,
        m.nombres,
        m.apellidos,
        m.cmp,
        m.telefono,
        m.correo,
        m.estado,
        e.id_especialidad AS especialidadId,
        e.nombre AS especialidadNombre
      FROM medicos m
      INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
      WHERE m.estado = 1
      ORDER BY m.id_medico DESC
    `);
    medicos.forEach((medico) => {
      medico.especialidad = { idEspecialidad: medico.especialidadId, nombre: medico.especialidadNombre };
      delete medico.especialidadId;
      delete medico.especialidadNombre;
    });
    res.json(medicos);
  } catch (error) {
    next(error);
  }
}

export async function listarEspecialidades(req, res, next) {
  try {
    const [especialidades] = await pool.query(`
      SELECT id_especialidad AS idEspecialidad, nombre
      FROM especialidades
      ORDER BY nombre ASC
    `);
    res.json(especialidades);
  } catch (error) {
    next(error);
  }
}

export async function obtenerMedico(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.id_medico AS idMedico,
        m.id_especialidad AS idEspecialidad,
        m.nombres,
        m.apellidos,
        m.cmp,
        m.telefono,
        m.correo,
        m.estado,
        e.id_especialidad AS especialidadId,
        e.nombre AS especialidadNombre
      FROM medicos m
      INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
      WHERE m.id_medico = ?
      LIMIT 1
    `, [req.params.id]);
    const medico = rows[0];
    if (!medico) return res.status(404).json({ message: 'Medico no encontrado' });
    medico.especialidad = { idEspecialidad: medico.especialidadId, nombre: medico.especialidadNombre };
    delete medico.especialidadId;
    delete medico.especialidadNombre;
    res.json(medico);
  } catch (error) {
    next(error);
  }
}

export async function crearMedico(req, res, next) {
  try {
    const data = normalizarMedico(req.body);
    const [result] = await pool.query(`
      INSERT INTO medicos (id_especialidad, nombres, apellidos, cmp, telefono, correo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.idEspecialidad, data.nombres, data.apellidos, data.cmp, data.telefono, data.correo]);
    res.status(201).json({ idMedico: result.insertId, ...data });
  } catch (error) {
    next(error);
  }
}

export async function actualizarMedico(req, res, next) {
  try {
    const data = normalizarMedico(req.body);
    await pool.query(`
      UPDATE medicos
      SET id_especialidad = ?, nombres = ?, apellidos = ?, cmp = ?, telefono = ?, correo = ?
      WHERE id_medico = ?
    `, [data.idEspecialidad, data.nombres, data.apellidos, data.cmp, data.telefono, data.correo, req.params.id]);
    res.json({ idMedico: Number(req.params.id), ...data });
  } catch (error) {
    next(error);
  }
}

export async function eliminarMedico(req, res, next) {
  try {
    await pool.query('UPDATE medicos SET estado = 0 WHERE id_medico = ?', [req.params.id]);
    res.json({ message: 'Medico eliminado' });
  } catch (error) {
    next(error);
  }
}

function normalizarMedico(data) {
  return {
    idEspecialidad: Number(data.idEspecialidad),
    nombres: data.nombres,
    apellidos: data.apellidos,
    cmp: data.cmp || null,
    telefono: data.telefono || null,
    correo: data.correo || null
  };
}
