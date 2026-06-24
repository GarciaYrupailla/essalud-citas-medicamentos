import { pool } from '../config/database.js';

export async function listarMedicamentos(req, res, next) {
  try {
    const [medicamentos] = await pool.query(`
      SELECT
        id_medicamento AS idMedicamento,
        nombre,
        descripcion,
        stock,
        stock_minimo AS stockMinimo,
        fecha_vencimiento AS fechaVencimiento,
        estado
      FROM medicamentos
      WHERE estado = 1
      ORDER BY id_medicamento DESC
    `);
    res.json(medicamentos);
  } catch (error) {
    next(error);
  }
}

export async function obtenerMedicamento(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_medicamento AS idMedicamento,
        nombre,
        descripcion,
        stock,
        stock_minimo AS stockMinimo,
        fecha_vencimiento AS fechaVencimiento,
        estado
      FROM medicamentos
      WHERE id_medicamento = ?
      LIMIT 1
    `, [req.params.id]);
    const medicamento = rows[0];
    if (!medicamento) return res.status(404).json({ message: 'Medicamento no encontrado' });
    res.json(medicamento);
  } catch (error) {
    next(error);
  }
}

export async function crearMedicamento(req, res, next) {
  try {
    const data = normalizarMedicamento(req.body);
    const [result] = await pool.query(`
      INSERT INTO medicamentos (nombre, descripcion, stock, stock_minimo, fecha_vencimiento)
      VALUES (?, ?, ?, ?, ?)
    `, [data.nombre, data.descripcion, data.stock, data.stockMinimo, data.fechaVencimiento]);
    res.status(201).json({ idMedicamento: result.insertId, ...data });
  } catch (error) {
    next(error);
  }
}

export async function actualizarMedicamento(req, res, next) {
  try {
    const data = normalizarMedicamento(req.body);
    await pool.query(`
      UPDATE medicamentos
      SET nombre = ?, descripcion = ?, stock = ?, stock_minimo = ?, fecha_vencimiento = ?
      WHERE id_medicamento = ?
    `, [data.nombre, data.descripcion, data.stock, data.stockMinimo, data.fechaVencimiento, req.params.id]);
    res.json({ idMedicamento: Number(req.params.id), ...data });
  } catch (error) {
    next(error);
  }
}

export async function eliminarMedicamento(req, res, next) {
  try {
    await pool.query('UPDATE medicamentos SET estado = 0 WHERE id_medicamento = ?', [req.params.id]);
    res.json({ message: 'Medicamento eliminado' });
  } catch (error) {
    next(error);
  }
}

function normalizarMedicamento(data) {
  return {
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    stock: Number(data.stock),
    stockMinimo: Number(data.stockMinimo),
    fechaVencimiento: data.fechaVencimiento || null
  };
}
