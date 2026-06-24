import { pool } from '../config/database.js';

export async function listarPacientes(req, res, next) {
  try {
    const [pacientes] = await pool.query(`
      SELECT
        id_paciente AS idPaciente,
        dni,
        nombres,
        apellidos,
        fecha_nacimiento AS fechaNacimiento,
        telefono,
        correo,
        direccion,
        estado
      FROM pacientes
      WHERE estado = 1
      ORDER BY id_paciente DESC
    `);
    res.json(pacientes);
  } catch (error) {
    next(error);
  }
}

export async function obtenerPaciente(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_paciente AS idPaciente,
        dni,
        nombres,
        apellidos,
        fecha_nacimiento AS fechaNacimiento,
        telefono,
        correo,
        direccion,
        estado
      FROM pacientes
      WHERE id_paciente = ?
      LIMIT 1
    `, [req.params.id]);
    const paciente = rows[0];
    if (!paciente) return res.status(404).json({ message: 'Paciente no encontrado' });
    res.json(paciente);
  } catch (error) {
    next(error);
  }
}

export async function crearPaciente(req, res, next) {
  try {
    const data = normalizarPaciente(req.body);
    const [result] = await pool.query(`
      INSERT INTO pacientes (dni, nombres, apellidos, fecha_nacimiento, telefono, correo, direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.dni, data.nombres, data.apellidos, data.fechaNacimiento, data.telefono, data.correo, data.direccion]);
    res.status(201).json({ idPaciente: result.insertId, ...data });
  } catch (error) {
    next(error);
  }
}

export async function actualizarPaciente(req, res, next) {
  try {
    const data = normalizarPaciente(req.body);
    await pool.query(`
      UPDATE pacientes
      SET dni = ?, nombres = ?, apellidos = ?, fecha_nacimiento = ?, telefono = ?, correo = ?, direccion = ?
      WHERE id_paciente = ?
    `, [data.dni, data.nombres, data.apellidos, data.fechaNacimiento, data.telefono, data.correo, data.direccion, req.params.id]);
    res.json({ idPaciente: Number(req.params.id), ...data });
  } catch (error) {
    next(error);
  }
}

export async function eliminarPaciente(req, res, next) {
  try {
    await pool.query('UPDATE pacientes SET estado = 0 WHERE id_paciente = ?', [req.params.id]);
    res.json({ message: 'Paciente eliminado' });
  } catch (error) {
    next(error);
  }
}

function normalizarPaciente(data) {
  return {
    dni: data.dni,
    nombres: data.nombres,
    apellidos: data.apellidos,
    fechaNacimiento: data.fechaNacimiento || null,
    telefono: data.telefono || null,
    correo: data.correo || null,
    direccion: data.direccion || null
  };
}
