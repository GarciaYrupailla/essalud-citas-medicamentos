import { pool } from '../config/database.js';

export async function listarEntregas(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        em.id_entrega AS idEntrega,
        em.id_paciente AS idPaciente,
        em.id_medicamento AS idMedicamento,
        em.cantidad,
        em.responsable,
        em.observacion,
        em.fecha_entrega AS fechaEntrega,
        p.dni AS pacienteDni,
        p.nombres AS pacienteNombres,
        p.apellidos AS pacienteApellidos,
        m.nombre AS medicamentoNombre
      FROM entrega_medicamentos em
      INNER JOIN pacientes p ON em.id_paciente = p.id_paciente
      INNER JOIN medicamentos m ON em.id_medicamento = m.id_medicamento
      ORDER BY em.fecha_entrega DESC
    `);
    const entregas = rows.map(mapEntrega);
    res.json(entregas);
  } catch (error) {
    next(error);
  }
}

export async function crearEntrega(req, res, next) {
  try {
    const cantidad = Number(req.body.cantidad);
    if (cantidad <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a cero' });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [medicamentos] = await connection.query(
        'SELECT id_medicamento, stock FROM medicamentos WHERE id_medicamento = ? LIMIT 1',
        [req.body.idMedicamento]
      );
      const medicamento = medicamentos[0];

      if (!medicamento) {
        const error = new Error('Medicamento no encontrado');
        error.status = 404;
        throw error;
      }

      if (medicamento.stock < cantidad) {
        const error = new Error(`Stock insuficiente. Stock disponible: ${medicamento.stock}`);
        error.status = 409;
        throw error;
      }

      const [result] = await connection.query(`
        INSERT INTO entrega_medicamentos (id_paciente, id_medicamento, cantidad, responsable, observacion)
        VALUES (?, ?, ?, ?, ?)
      `, [req.body.idPaciente, req.body.idMedicamento, cantidad, req.body.responsable, req.body.observacion || null]);

      await connection.query(
        'UPDATE medicamentos SET stock = stock - ? WHERE id_medicamento = ?',
        [cantidad, req.body.idMedicamento]
      );

      await connection.commit();

      res.status(201).json({
        idEntrega: result.insertId,
        idPaciente: Number(req.body.idPaciente),
        idMedicamento: Number(req.body.idMedicamento),
        cantidad,
        responsable: req.body.responsable,
        observacion: req.body.observacion || null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
}

function mapEntrega(row) {
  return {
    idEntrega: row.idEntrega,
    idPaciente: row.idPaciente,
    idMedicamento: row.idMedicamento,
    cantidad: row.cantidad,
    responsable: row.responsable,
    observacion: row.observacion,
    fechaEntrega: row.fechaEntrega,
    paciente: {
      dni: row.pacienteDni,
      nombres: row.pacienteNombres,
      apellidos: row.pacienteApellidos
    },
    medicamento: {
      nombre: row.medicamentoNombre
    }
  };
}
