const mongoose = require("mongoose");

const asistenciaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 👈 referencia al modelo de usuarios
  },
  fecha: String,
  tema: String,
  responsable: String,
  cargo: String,
  modalidad: String,
  sede: String,
  horaInicio: String,
  horaFin: String,
  asistentes: [
    {
      nombre: String,
      cargo: String,
      firma: String, // Base64
    },
  ],
  pdf: {
    data: Buffer,
    contentType: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Asistencia", asistenciaSchema);
