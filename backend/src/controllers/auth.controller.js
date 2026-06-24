import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';

export async function login(req, res, next) {
  try {
    const { correo, password } = req.body;

    const [usuarios] = await pool.query(
      'SELECT id_usuario, nombre, correo, password FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );
    const usuario = usuarios[0];
    if (!usuario) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const passwordValido = usuario.password.startsWith('$2')
      ? await bcrypt.compare(password, usuario.password)
      : password === usuario.password;

    if (!passwordValido) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    req.session.usuario = {
      idUsuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo
    };

    res.json({ usuario: req.session.usuario });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesion cerrada' });
  });
}

export function me(req, res) {
  res.json({ usuario: req.session.usuario || null });
}
