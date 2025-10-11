const mongoose = require("mongoose");

const asistenciaSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
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
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 👈 referencia al usuario creador
  },
}, { timestamps: true });

module.exports = mongoose.model("Asistencia", asistenciaSchema);
