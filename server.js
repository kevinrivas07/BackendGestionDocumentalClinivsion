const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// 🚀 Rutas
const registerUserRoutes = require('./routes/registerUserRoutes');
const loginRoutes = require('./routes/loginRoutes');
const adminRegistrationRoutes = require('./routes/adminRegistrationRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const asistenciaRoutes = require("./routes/asistenciaRoutes");
const adminRoutes = require('./routes/adminRoutes');
const infoUserRoutes = require("./routes/infoUserRoutes");
const dotacionRoutes = require("./routes/dotacionRoutes");
const authRoutes = require("./routes/authRoutes");


// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // aumento por si envías firmas grandes

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Ruta raíz
app.get("/", (req, res) => {
  res.send(`
    <h1>Bienvenido al Backend</h1>
    <p>La API está funcionando correctamente.</p>
  `);
});

// ✅ Rutas principales
app.use('/api/register', registerUserRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/register-admin', adminRegistrationRoutes);
app.use("/api/info-user", infoUserRoutes);
app.use("/api/asistencia", asistenciaRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/dotaciones", dotacionRoutes);
app.use("/api/auth", authRoutes);


// ✅ Carpeta estática para PDFs
app.use('/uploads/pdfs', express.static(path.join(__dirname, 'uploads/pdfs')));

// ✅ 404
app.use((req, res) => {
  res.status(404).send("<h2>❌ Ruta no encontrada en la API</h2>");
});

// ✅ Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("<h2>⚠️ Error interno del servidor</h2>");
});

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
