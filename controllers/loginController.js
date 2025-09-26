const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Usa la SECRET KEY de Google (la segunda clave)
const SECRET_KEY = "6LeW0LErAAAAAEEDLIMOx9T52icsTf4juvsQ2quH"; 
const JWT_SECRET = "secretkey"; // cámbiala por una segura

const login = async (req, res) => {
  const { username, password } = req.body;

  try {

    // 🔹 Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    // 🔹 Validar contraseña
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciales incorrectas" });
    }

    // 🔹 Crear token JWT
    const payload = {
      userId: user._id.toString(),
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    // 🔹 Responder incluyendo el username como nombre
    res.json({
      token,
      role: user.role,
      user: {
        nombre: user.username,   // 👈 mandamos el username como "nombre"
        username: user.username,
      },
    });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

module.exports = login;
