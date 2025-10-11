// models/Dotacion.js
const mongoose = require("mongoose");

const DotacionSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  nombre: { type: String, required: true },
  cedula: { type: String, required: true },
  cargo: { type: String },
  elementos: [
    {
      nombre: String,
      cantidad: Number,
    },
  ],
  firma: { type: String },
  pdf: {
    data: Buffer,
    contentType: String,
  },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Dotacion", DotacionSchema);
