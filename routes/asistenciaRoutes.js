const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const Asistencia = require("../models/Asistencia");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Crear una asistencia y guardar PDF
router.post("/", authMiddleware, async (req, res) => {
  try {
    const data = req.body || {};

    // Plantilla PDF base
    const templatePath = path.join(__dirname, "../templates/F-GH-010.pdf");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Plantilla PDF no encontrada" });
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // -------------------- CABECERA --------------------
    page.drawText(`${data.fecha || ""}`, { x: 170, y: 651, size: 12, font });
    page.drawText(`${data.tema || ""}`, { x: 170, y: 633, size: 12, font });
    page.drawText(`${data.responsable || ""}`, { x: 170, y: 615, size: 12, font });
    page.drawText(`${data.cargo || ""}`, { x: 170, y: 597, size: 12, font });
    page.drawText(`${data.modalidad || ""}`, { x: 170, y: 579, size: 12, font });
    page.drawText(`${data.sede || ""}`, { x: 440, y: 579, size: 12, font });
    page.drawText(`${data.horaInicio || ""}`, { x: 170, y: 561, size: 12, font });
    page.drawText(`${data.horaFin || ""}`, { x: 440, y: 561, size: 12, font });

    // -------------------- ASISTENTES --------------------
    if (Array.isArray(data.asistentes)) {
      const baseY = 505;
      const step = 18;

      for (let i = 0; i < data.asistentes.length; i++) {
        const a = data.asistentes[i] || {};
        const y = baseY - i * step;

        page.drawText(a.nombre || "", { x: 120, y, size: 10, font });
        page.drawText(a.cargo || "", { x: 300, y, size: 10, font });

        // Firma
        if (a.firma && typeof a.firma === "string" && a.firma.startsWith("data:image")) {
          try {
            const match = a.firma.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!match) throw new Error("Formato de firma inválido");

            const mime = match[1];
            const base64 = match[2];
            const imgBytes = Buffer.from(base64, "base64");

            let embeddedImage;
            if (mime === "image/png") {
              embeddedImage = await pdfDoc.embedPng(imgBytes);
            } else {
              embeddedImage = await pdfDoc.embedJpg(imgBytes);
            }

            const sigWidth = 90;
            const sigHeight = (embeddedImage.height / embeddedImage.width) * sigWidth || 30;

            page.drawImage(embeddedImage, {
              x: 450,
              y: y - sigHeight / 2 + 5,
              width: sigWidth,
              height: sigHeight,
            });
          } catch (err) {
            console.error(`⚠️ Error incrustando firma en fila ${i + 1}:`, err);
          }
        } else {
          page.drawLine({ start: { x: 450, y: y - 2 }, end: { x: 550, y: y - 2 }, thickness: 1 });
        }
      }
    }

    // Generar PDF final
    const finalPdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(finalPdfBytes);

    // Guardar asistencia en Mongo
    const nuevaAsistencia = new Asistencia({
      fecha: data.fecha || new Date(),
      tema: data.tema,
      responsable: data.responsable,
      cargo: data.cargo,
      modalidad: data.modalidad,
      sede: data.sede,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
      asistentes: data.asistentes,
      pdf: {
        data: pdfBuffer,
        contentType: "application/pdf",
      },
      creadoPor: req.user?.id || null, // ✅ se guarda el usuario correctamente
    });

    await nuevaAsistencia.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Lista_Asistencia.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

// 📌 Obtener todas las asistencias (con nombre del creador)
router.get("/", async (req, res) => {
  try {
    const asistencias = await Asistencia.find()
      .populate("creadoPor", "username email role")
      .select("fecha tema responsable sede creadoPor");

    res.json(asistencias);
  } catch (err) {
    console.error("❌ Error obteniendo asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
});

// 📌 Descargar PDF por ID
router.get("/:id/pdf", async (req, res) => {
  try {
    const asistencia = await Asistencia.findById(req.params.id);
    if (!asistencia || !asistencia.pdf || !asistencia.pdf.data) {
      return res.status(404).json({ error: "PDF no encontrado" });
    }

    res.setHeader("Content-Type", asistencia.pdf.contentType);
    res.setHeader("Content-Disposition", `attachment; filename=Asistencia_${asistencia._id}.pdf`);
    res.send(asistencia.pdf.data);
  } catch (err) {
    console.error("❌ Error descargando PDF:", err);
    res.status(500).json({ error: "Error al descargar PDF" });
  }
});

module.exports = router;
