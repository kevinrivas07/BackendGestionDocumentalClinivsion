const User = require('../models/User');
const Asistencia = require('../models/Asistencia');
const bcrypt = require('bcryptjs');

// ✅ Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username email role createdAt');
    res.json(users);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// ✅ Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ msg: 'Faltan datos obligatorios' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ msg: 'Usuario o correo ya registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ msg: 'Usuario creado con éxito', user: newUser });
  } catch (err) {
    console.error('❌ Error al crear usuario:', err);
    res.status(500).json({ msg: 'Error al crear usuario' });
  }
};

// ✅ Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar usuario:', err);
    res.status(500).json({ msg: 'Error al eliminar usuario' });
  }
};

// ✅ Obtener todas las asistencias (solo admin)
const getAllAsistencias = async (req, res) => {
  try {
    const asistencias = await Asistencia.find().populate('userId', 'username email');

    if (!Array.isArray(asistencias)) {
      return res.status(500).json({ msg: 'Formato inválido de asistencias' });
    }

    res.json(asistencias);
  } catch (error) {
    console.error("❌ Error al obtener asistencias:", error);
    res.status(500).json({ msg: "Error al obtener asistencias", error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  deleteUser,
  getAllAsistencias,
};
