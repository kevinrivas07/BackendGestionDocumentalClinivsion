// routes/asistenciaRoutes.js
const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const data = req.body || {};

    // Plantilla PDF (asegúrate de tener /templates/F-GH-010.pdf)
    const templatePath = path.join(__dirname, "../templates/F-GH-010.pdf");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: "Plantilla PDF no encontrada en /templates/F-GH-010.pdf" });
    }
    const pdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // -------------------- CABECERA --------------------
    // Ajusta X/Y si quieres mover finamente
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
      const baseY = 505; // punto de inicio (ajústalo si hace falta)
      const step = 18;   // separación vertical entre filas

      for (let i = 0; i < data.asistentes.length; i++) {
        const a = data.asistentes[i] || {};
        const y = baseY - i * step;

        // columnas: número | nombre | cargo | firma
        page.drawText(a.nombre || "", { x: 120, y, size: 10, font });
        page.drawText(a.cargo || "", { x: 300, y, size: 10, font });

        // Firma: si viene base64 la incrustamos; si no, dibujamos línea
        if (a.firma && typeof a.firma === "string" && a.firma.startsWith("data:image")) {
          try {
            // extraer tipo y base64
            const match = a.firma.match(/^data:(image\/\w+);base64,(.+)$/);
            if (!match) throw new Error("Formato de firma inválido");

            const mime = match[1]; // ejemplo 'image/png'
            const base64 = match[2];
            const imgBytes = Buffer.from(base64, "base64");

            let embeddedImage;
            if (mime === "image/png") {
              embeddedImage = await pdfDoc.embedPng(imgBytes);
            } else if (mime === "image/jpeg" || mime === "image/jpg") {
              embeddedImage = await pdfDoc.embedJpg(imgBytes);
            } else {
              // intentar png por si acaso
              embeddedImage = await pdfDoc.embedPng(imgBytes);
            }

            // mantén la relación de aspecto
            const sigWidth = 90; // ancho de la firma en PDF (ajustable)
            const sigHeight = (embeddedImage.height / embeddedImage.width) * sigWidth || 30;

            // dibujar imagen: centramos verticalmente en la fila
            page.drawImage(embeddedImage, {
              x: 450,
              y: y - sigHeight / 2 + 5,
              width: sigWidth,
              height: sigHeight,
            });
          } catch (err) {
            console.error(`Error incrustando firma en fila ${i + 1}:`, err);
            // fallback: dibujar línea si falla incrustar
            page.drawLine({ start: { x: 450, y: y - 2 }, end: { x: 550, y: y - 2 }, thickness: 1 });
          }
        } else {
          // sin firma → dibujar línea
          page.drawLine({ start: { x: 450, y: y - 2 }, end: { x: 550, y: y - 2 }, thickness: 1 });
        }
      }
    }

    const finalPdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Lista_Asistencia.pdf");
    return res.send(Buffer.from(finalPdfBytes));
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    return res.status(500).json({ error: "Error generando PDF" });
  }
});

module.exports = router;
