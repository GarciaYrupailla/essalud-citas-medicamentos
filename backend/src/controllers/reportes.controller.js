import { pool } from '../config/database.js';

export async function obtenerReportes(req, res, next) {
  try {
    const { desde, hasta, estado = '', especialidad = '', busqueda = '' } = req.query;
    const rango = buildDateFilter(desde, hasta);
    const estadoCita = estado ? ' AND c.estado = ?' : '';
    const especialidadCita = especialidad ? ' AND e.id_especialidad = ?' : '';
    const busquedaCita = busqueda ? ' AND (p.dni LIKE ? OR p.nombres LIKE ? OR p.apellidos LIKE ? OR m.nombres LIKE ? OR m.apellidos LIKE ?)' : '';
    const citaParams = [...rango.params];

    if (estado) citaParams.push(estado);
    if (especialidad) citaParams.push(especialidad);
    if (busqueda) citaParams.push(...buildLikeParams(busqueda, 5));

    const entregaBusqueda = busqueda ? ' AND (p.dni LIKE ? OR p.nombres LIKE ? OR p.apellidos LIKE ? OR med.nombre LIKE ? OR em.responsable LIKE ?)' : '';
    const entregaParams = [...rango.params];
    if (busqueda) entregaParams.push(...buildLikeParams(busqueda, 5));

    const medicamentoBusqueda = busqueda ? ' AND (nombre LIKE ? OR descripcion LIKE ?)' : '';
    const medicamentoParams = busqueda ? buildLikeParams(busqueda, 2) : [];

    const [
      [citas],
      [entregas],
      [medicamentos],
      [especialidades],
      [resumenPacientes],
      [resumenMedicos]
    ] = await Promise.all([
      pool.query(`
        SELECT
          c.id_cita AS idCita,
          c.fecha,
          c.hora,
          c.estado,
          c.motivo,
          p.dni,
          p.nombres AS pacienteNombres,
          p.apellidos AS pacienteApellidos,
          m.nombres AS medicoNombres,
          m.apellidos AS medicoApellidos,
          e.nombre AS especialidad
        FROM citas c
        INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
        INNER JOIN medicos m ON c.id_medico = m.id_medico
        INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
        WHERE 1 = 1 ${rango.sql.replaceAll('fecha', 'c.fecha')}${estadoCita}${especialidadCita}${busquedaCita}
        ORDER BY c.fecha DESC, c.hora DESC
      `, citaParams),
      pool.query(`
        SELECT
          em.id_entrega AS idEntrega,
          em.fecha_entrega AS fechaEntrega,
          em.cantidad,
          em.responsable,
          em.observacion,
          p.dni,
          p.nombres AS pacienteNombres,
          p.apellidos AS pacienteApellidos,
          med.nombre AS medicamento
        FROM entrega_medicamentos em
        INNER JOIN pacientes p ON em.id_paciente = p.id_paciente
        INNER JOIN medicamentos med ON em.id_medicamento = med.id_medicamento
        WHERE 1 = 1 ${rango.sql.replaceAll('fecha', 'DATE(em.fecha_entrega)')}${entregaBusqueda}
        ORDER BY em.fecha_entrega DESC
      `, entregaParams),
      pool.query(`
        SELECT
          id_medicamento AS idMedicamento,
          nombre,
          descripcion,
          stock,
          stock_minimo AS stockMinimo,
          fecha_vencimiento AS fechaVencimiento,
          CASE
            WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento < CURDATE() THEN 'Vencido'
            WHEN fecha_vencimiento IS NOT NULL AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Por vencer'
            WHEN stock <= stock_minimo THEN 'Stock bajo'
            ELSE 'Normal'
          END AS condicion
        FROM medicamentos
        WHERE estado = 1${medicamentoBusqueda}
        ORDER BY condicion DESC, stock ASC, nombre ASC
      `, medicamentoParams),
      pool.query(`
        SELECT
          e.id_especialidad AS idEspecialidad,
          e.nombre,
          COUNT(DISTINCT m.id_medico) AS medicos,
          SUM(CASE WHEN c.estado = 'Pendiente' THEN 1 ELSE 0 END) AS citasPendientes,
          SUM(CASE WHEN c.estado = 'Atendida' THEN 1 ELSE 0 END) AS citasAtendidas,
          SUM(CASE WHEN c.estado = 'Cancelada' THEN 1 ELSE 0 END) AS citasCanceladas
        FROM especialidades e
        LEFT JOIN medicos m ON e.id_especialidad = m.id_especialidad AND m.estado = 1
        LEFT JOIN citas c ON m.id_medico = c.id_medico ${rango.sql ? `AND ${rango.sql.replace(/^ AND /, '').replaceAll('fecha', 'c.fecha')}` : ''}
        GROUP BY e.id_especialidad, e.nombre
        ORDER BY e.nombre ASC
      `, rango.params),
      pool.query('SELECT COUNT(*) AS total FROM pacientes WHERE estado = 1'),
      pool.query('SELECT COUNT(*) AS total FROM medicos WHERE estado = 1')
    ]);

    const resumen = buildResumen({ citas, entregas, medicamentos, pacientes: resumenPacientes[0].total, medicos: resumenMedicos[0].total });

    res.json({
      filtros: { desde: desde || '', hasta: hasta || '', estado, especialidad, busqueda },
      resumen,
      citas,
      entregas,
      medicamentos,
      especialidades
    });
  } catch (error) {
    next(error);
  }
}

function buildDateFilter(desde, hasta) {
  const params = [];
  let sql = '';

  if (desde) {
    sql += ' AND fecha >= ?';
    params.push(desde);
  }

  if (hasta) {
    sql += ' AND fecha <= ?';
    params.push(hasta);
  }

  return { sql, params };
}

function buildLikeParams(value, count) {
  return Array.from({ length: count }, () => `%${value}%`);
}

function buildResumen({ citas, entregas, medicamentos, pacientes, medicos }) {
  const citasPendientes = citas.filter((cita) => cita.estado === 'Pendiente').length;
  const citasAtendidas = citas.filter((cita) => cita.estado === 'Atendida').length;
  const citasCanceladas = citas.filter((cita) => cita.estado === 'Cancelada').length;
  const pacientesAtendidos = new Set(citas.map((cita) => cita.dni)).size;
  const unidadesEntregadas = entregas.reduce((total, entrega) => total + Number(entrega.cantidad || 0), 0);
  const medicamentosStockBajo = medicamentos.filter((medicamento) => medicamento.stock <= medicamento.stockMinimo).length;
  const medicamentosPorVencer = medicamentos.filter((medicamento) => medicamento.condicion === 'Por vencer').length;
  const medicamentosVencidos = medicamentos.filter((medicamento) => medicamento.condicion === 'Vencido').length;

  return {
    pacientesActivos: pacientes,
    medicosActivos: medicos,
    totalCitas: citas.length,
    citasPendientes,
    citasAtendidas,
    citasCanceladas,
    pacientesAtendidos,
    totalEntregas: entregas.length,
    unidadesEntregadas,
    medicamentosStockBajo,
    medicamentosPorVencer,
    medicamentosVencidos
  };
}
