const bcrypt = require('bcryptjs');
const User = require('../models/User');
const InfoUser = require('../models/InfoUser');

const adminRegistration = async (req, res) => {
  try {
    const { username, email, password, phone, nombre, ciudad, cedula, fecha } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Faltan datos obligatorios' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ msg: 'Correo ya registrado' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: 'Nombre de usuario ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin', // 👈 Asignar rol administrador
    });
    await user.save();

    const userInfo = new InfoUser({
      nombre,
      ciudad,
      cedula,
      fecha,
      email,
      phone,
      userId: user._id,
    });
    await userInfo.save();

    res.status(201).json({
      msg: 'Administrador registrado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('❌ Error al registrar el administrador:', error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = { adminRegistration }; // 👈 Exportación correcta
