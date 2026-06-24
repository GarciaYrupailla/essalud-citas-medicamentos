import { pool } from '../config/database.js';

export async function listarCitas(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_cita AS idCita,
        c.id_paciente AS idPaciente,
        c.id_medico AS idMedico,
        c.fecha,
        c.hora,
        c.motivo,
        c.estado,
        p.dni AS pacienteDni,
        p.nombres AS pacienteNombres,
        p.apellidos AS pacienteApellidos,
        m.nombres AS medicoNombres,
        m.apellidos AS medicoApellidos,
        e.nombre AS especialidadNombre
      FROM citas c
      INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
      INNER JOIN medicos m ON c.id_medico = m.id_medico
      INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
      ORDER BY c.fecha DESC, c.hora DESC
    `);
    const citas = rows.map(mapCita);
    res.json(citas);
  } catch (error) {
    next(error);
  }
}

export async function obtenerCita(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_cita AS idCita,
        c.id_paciente AS idPaciente,
        c.id_medico AS idMedico,
        c.fecha,
        c.hora,
        c.motivo,
        c.estado,
        p.dni AS pacienteDni,
        p.nombres AS pacienteNombres,
        p.apellidos AS pacienteApellidos,
        m.nombres AS medicoNombres,
        m.apellidos AS medicoApellidos,
        e.nombre AS especialidadNombre
      FROM citas c
      INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
      INNER JOIN medicos m ON c.id_medico = m.id_medico
      INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
      WHERE c.id_cita = ?
      LIMIT 1
    `, [req.params.id]);
    const cita = rows[0] ? mapCita(rows[0]) : null;
    if (!cita) return res.status(404).json({ message: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    next(error);
  }
}

export async function crearCita(req, res, next) {
  try {
    const ocupada = await medicoTieneCita(req.body.idMedico, req.body.fecha, req.body.hora);
    if (ocupada) {
      return res.status(409).json({ message: 'El medico ya tiene una cita registrada en esa fecha y hora' });
    }

    const data = normalizarCita(req.body);
    const [result] = await pool.query(`
      INSERT INTO citas (id_paciente, id_medico, fecha, hora, motivo, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.idPaciente, data.idMedico, data.fecha, data.hora, data.motivo, data.estado]);
    res.status(201).json({ idCita: result.insertId, ...data });
  } catch (error) {
    next(error);
  }
}

export async function actualizarCita(req, res, next) {
  try {
    const ocupada = await medicoTieneCita(req.body.idMedico, req.body.fecha, req.body.hora, Number(req.params.id));
    if (ocupada) {
      return res.status(409).json({ message: 'El medico ya tiene una cita registrada en esa fecha y hora' });
    }

    const data = normalizarCita(req.body);
    await pool.query(`
      UPDATE citas
      SET id_paciente = ?, id_medico = ?, fecha = ?, hora = ?, motivo = ?, estado = ?
      WHERE id_cita = ?
    `, [data.idPaciente, data.idMedico, data.fecha, data.hora, data.motivo, data.estado, req.params.id]);
    res.json({ idCita: Number(req.params.id), ...data });
  } catch (error) {
    next(error);
  }
}

export async function cancelarCita(req, res, next) {
  try {
    await pool.query('UPDATE citas SET estado = ? WHERE id_cita = ?', ['Cancelada', req.params.id]);
    res.json({ message: 'Cita cancelada' });
  } catch (error) {
    next(error);
  }
}

async function medicoTieneCita(idMedico, fecha, hora, idCitaActual = null) {
  const params = [idMedico, fecha, hora];
  let sql = `
    SELECT id_cita
    FROM citas
    WHERE id_medico = ?
      AND fecha = ?
      AND hora = ?
      AND estado != 'Cancelada'
  `;

  if (idCitaActual) {
    sql += ' AND id_cita != ?';
    params.push(idCitaActual);
  }

  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

function normalizarCita(data) {
  return {
    idPaciente: Number(data.idPaciente),
    idMedico: Number(data.idMedico),
    fecha: data.fecha,
    hora: data.hora,
    motivo: data.motivo || null,
    estado: data.estado || 'Pendiente'
  };
}

function mapCita(row) {
  return {
    idCita: row.idCita,
    idPaciente: row.idPaciente,
    idMedico: row.idMedico,
    fecha: row.fecha,
    hora: row.hora,
    motivo: row.motivo,
    estado: row.estado,
    paciente: {
      dni: row.pacienteDni,
      nombres: row.pacienteNombres,
      apellidos: row.pacienteApellidos
    },
    medico: {
      nombres: row.medicoNombres,
      apellidos: row.medicoApellidos,
      especialidad: { nombre: row.especialidadNombre }
    }
  };
}
