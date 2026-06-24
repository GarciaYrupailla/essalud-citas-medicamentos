import { pool } from '../config/database.js';

export async function obtenerDashboard(req, res, next) {
  try {
    const [
      [pacientes],
      [medicos],
      [medicamentos],
      [citasHoy],
      [citasPendientes],
      [citasAtendidas],
      [citasCanceladas],
      [entregasHoy],
      [entregasMes],
      [stockBajo],
      [medicamentosVencen],
      [medicamentosVencidos],
      [medicamentosCriticos],
      [ultimasCitasRows],
      [proximasCitasRows],
      [ultimasEntregasRows],
      [medicosPorEspecialidad],
      [citasPorDia]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM pacientes WHERE estado = 1'),
      pool.query('SELECT COUNT(*) AS total FROM medicos WHERE estado = 1'),
      pool.query('SELECT COUNT(*) AS total FROM medicamentos WHERE estado = 1'),
      pool.query("SELECT COUNT(*) AS total FROM citas WHERE fecha = CURDATE() AND estado = 'Pendiente'"),
      pool.query("SELECT COUNT(*) AS total FROM citas WHERE estado = 'Pendiente'"),
      pool.query("SELECT COUNT(*) AS total FROM citas WHERE estado = 'Atendida'"),
      pool.query("SELECT COUNT(*) AS total FROM citas WHERE estado = 'Cancelada'"),
      pool.query('SELECT COUNT(*) AS total FROM entrega_medicamentos WHERE DATE(fecha_entrega) = CURDATE()'),
      pool.query(`
        SELECT COALESCE(SUM(cantidad), 0) AS total
        FROM entrega_medicamentos
        WHERE YEAR(fecha_entrega) = YEAR(CURDATE())
          AND MONTH(fecha_entrega) = MONTH(CURDATE())
      `),
      pool.query('SELECT COUNT(*) AS total FROM medicamentos WHERE estado = 1 AND stock <= stock_minimo'),
      pool.query(`
        SELECT COUNT(*) AS total
        FROM medicamentos
        WHERE estado = 1
          AND fecha_vencimiento IS NOT NULL
          AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      `),
      pool.query(`
        SELECT COUNT(*) AS total
        FROM medicamentos
        WHERE estado = 1
          AND fecha_vencimiento IS NOT NULL
          AND fecha_vencimiento < CURDATE()
      `),
      pool.query(`
        SELECT
          id_medicamento AS idMedicamento,
          nombre,
          descripcion,
          stock,
          stock_minimo AS stockMinimo,
          fecha_vencimiento AS fechaVencimiento
        FROM medicamentos
        WHERE estado = 1 AND stock <= stock_minimo
        ORDER BY stock ASC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          c.id_cita AS idCita,
          c.fecha,
          c.hora,
          c.estado,
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
        LIMIT 8
      `),
      pool.query(`
        SELECT
          c.id_cita AS idCita,
          c.fecha,
          c.hora,
          c.estado,
          p.nombres AS pacienteNombres,
          p.apellidos AS pacienteApellidos,
          m.nombres AS medicoNombres,
          m.apellidos AS medicoApellidos,
          e.nombre AS especialidadNombre
        FROM citas c
        INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
        INNER JOIN medicos m ON c.id_medico = m.id_medico
        INNER JOIN especialidades e ON m.id_especialidad = e.id_especialidad
        WHERE c.fecha >= CURDATE()
          AND c.estado = 'Pendiente'
        ORDER BY c.fecha ASC, c.hora ASC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          em.id_entrega AS idEntrega,
          em.fecha_entrega AS fechaEntrega,
          em.cantidad,
          em.responsable,
          p.nombres AS pacienteNombres,
          p.apellidos AS pacienteApellidos,
          p.dni,
          m.nombre AS medicamentoNombre
        FROM entrega_medicamentos em
        INNER JOIN pacientes p ON em.id_paciente = p.id_paciente
        INNER JOIN medicamentos m ON em.id_medicamento = m.id_medicamento
        ORDER BY em.fecha_entrega DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT e.nombre, COUNT(m.id_medico) AS total
        FROM especialidades e
        LEFT JOIN medicos m ON e.id_especialidad = m.id_especialidad AND m.estado = 1
        GROUP BY e.id_especialidad, e.nombre
        ORDER BY total DESC, e.nombre ASC
      `),
      pool.query(`
        SELECT fecha, COUNT(*) AS total
        FROM citas
        WHERE fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
        GROUP BY fecha
        ORDER BY fecha ASC
      `)
    ]);

    const mapCita = (cita) => ({
      idCita: cita.idCita,
      fecha: cita.fecha,
      hora: cita.hora,
      estado: cita.estado,
      paciente: { nombres: cita.pacienteNombres, apellidos: cita.pacienteApellidos },
      medico: {
        nombres: cita.medicoNombres,
        apellidos: cita.medicoApellidos,
        especialidad: { nombre: cita.especialidadNombre }
      }
    });

    const ultimasCitas = ultimasCitasRows.map(mapCita);
    const proximasCitas = proximasCitasRows.map(mapCita);
    const ultimasEntregas = ultimasEntregasRows.map((entrega) => ({
      idEntrega: entrega.idEntrega,
      fechaEntrega: entrega.fechaEntrega,
      cantidad: entrega.cantidad,
      responsable: entrega.responsable,
      paciente: {
        dni: entrega.dni,
        nombres: entrega.pacienteNombres,
        apellidos: entrega.pacienteApellidos
      },
      medicamento: { nombre: entrega.medicamentoNombre }
    }));

    res.json({
      totalPacientes: pacientes[0].total,
      totalMedicos: medicos[0].total,
      totalMedicamentos: medicamentos[0].total,
      citasHoy: citasHoy[0].total,
      citasPendientes: citasPendientes[0].total,
      citasAtendidas: citasAtendidas[0].total,
      citasCanceladas: citasCanceladas[0].total,
      entregasHoy: entregasHoy[0].total,
      unidadesEntregadasMes: Number(entregasMes[0].total),
      stockBajo: stockBajo[0].total,
      medicamentosPorVencer: medicamentosVencen[0].total,
      medicamentosVencidos: medicamentosVencidos[0].total,
      medicamentosCriticos,
      ultimasCitas,
      proximasCitas,
      ultimasEntregas,
      citasPorEstado: [
        { estado: 'Pendiente', total: citasPendientes[0].total },
        { estado: 'Atendida', total: citasAtendidas[0].total },
        { estado: 'Cancelada', total: citasCanceladas[0].total }
      ],
      medicosPorEspecialidad,
      citasPorDia
    });
  } catch (error) {
    next(error);
  }
}
