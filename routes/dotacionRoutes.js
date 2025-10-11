// routes/dotacionRoutes.js
const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const Dotacion = require("../models/Dotacion");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Crear dotación y generar PDF
router.post("/", authMiddleware, async (req, res) => {
    try {
        const data = req.body || {};

        // 📄 Ruta del formato base
        const templatePath = path.join(__dirname, "../templates/F-GH-018 ENTREGA DE DOTACION v3.pdf");
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({ error: "Plantilla PDF no encontrada" });
        }

        const pdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

// 🗓️ Fecha y datos del colaborador
if (data.fecha) {
  const fecha = new Date(data.fecha);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const año = fecha.getFullYear();

  // Dibuja cada parte de la fecha con más separación
  page.drawText(dia, { x: 170, y: 725, size: 12, font });
  page.drawText(mes, { x: 225, y: 725, size: 12, font });
  page.drawText(String(año), { x: 290, y: 725, size: 12, font });
} else {
  page.drawText(`${data.fecha || ""}`, { x: 170, y: 725, size: 12, font });
}

page.drawText(`${data.nombre || ""}`, { x: 170, y: 710, size: 12, font });
page.drawText(`${data.cedula || ""}`, { x: 450, y: 710, size: 12, font });
page.drawText(`${data.cargo || ""}`, { x: 170, y: 695, size: 12, font }); // 👈 un poco más arriba







// 🧍‍♀️ Elementos entregados
if (Array.isArray(data.elementos)) {
  const baseY = 624; // 🔼 subido un poco
  const step = 11;   // separación mínima entre filas

  for (let i = 0; i < data.elementos.length; i++) {
    const e = data.elementos[i];
    const y = baseY - i * step;

    // 🔹 Nombre del elemento
    page.drawText(e.nombre || "", { x: 200, y, size: 9, font });

    // 🔹 Cantidad
    page.drawText(e.cantidad ? String(e.cantidad) : "", { x: 320, y, size: 9, font });
  }
}








        // ✍️ Firma
        if (data.firma && data.firma.startsWith("data:image")) {
            const match = data.firma.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
                const mime = match[1];
                const base64 = match[2];
                const imgBytes = Buffer.from(base64, "base64");
                const embeddedImage =
                    mime === "image/png"
                        ? await pdfDoc.embedPng(imgBytes)
                        : await pdfDoc.embedJpg(imgBytes);
                page.drawImage(embeddedImage, { x: 400, y: 535, width: 150, height: 60 });


            }
        }

        // Guardar PDF
        const finalPdf = await pdfDoc.save();
        const pdfBuffer = Buffer.from(finalPdf);

        const nuevaDotacion = new Dotacion({
            fecha: data.fecha || new Date(),
            nombre: data.nombre,
            cedula: data.cedula,
            cargo: data.cargo,
            elementos: data.elementos,
            firma: data.firma,
            pdf: {
                data: pdfBuffer,
                contentType: "application/pdf",
            },
            creadoPor: req.user?.id || null,
        });

        await nuevaDotacion.save();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=Entrega_Dotacion.pdf");
        res.send(pdfBuffer);
    } catch (err) {
        console.error("❌ Error generando PDF de dotación:", err);
        res.status(500).json({ error: "Error generando PDF de dotación" });
    }
});

// 📂 Obtener todas las dotaciones
router.get("/", async (req, res) => {
    try {
        const dotaciones = await Dotacion.find()
            .populate("creadoPor", "username email")
            .select("fecha nombre cedula cargo elementos creadoPor");
        res.json(dotaciones);
    } catch (err) {
        console.error("❌ Error al obtener dotaciones:", err);
        res.status(500).json({ error: "Error al obtener dotaciones" });
    }
});

// 📄 Descargar PDF
router.get("/:id/pdf", async (req, res) => {
    try {
        const dotacion = await Dotacion.findById(req.params.id);
        if (!dotacion || !dotacion.pdf?.data) {
            return res.status(404).json({ error: "PDF no encontrado" });
        }

        res.setHeader("Content-Type", dotacion.pdf.contentType);
        res.setHeader("Content-Disposition", `attachment; filename=Dotacion_${dotacion._id}.pdf`);
        res.send(dotacion.pdf.data);
    } catch (err) {
        console.error("❌ Error al descargar PDF:", err);
        res.status(500).json({ error: "Error al descargar PDF" });
    }
});

module.exports = router;
