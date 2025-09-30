const express = require("express");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // 📌 Usar PDF base
    const templatePath = path.join(__dirname, "../templates/F-GH-010.pdf");
    const pdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

// Datos principales (subidos 1 punto respecto al último ajuste)
page.drawText(` ${data.fecha}`, { x: 170, y: 651, size: 12, font });
page.drawText(` ${data.tema}`, { x: 170, y: 633, size: 12, font });
page.drawText(` ${data.responsable}`, { x: 170, y: 615, size: 12, font });
page.drawText(` ${data.cargo}`, { x: 170, y: 597, size: 12, font });
page.drawText(` ${data.modalidad}`, { x: 170, y: 579, size: 12, font });
page.drawText(` ${data.sede}`, { x: 440, y: 579, size: 12, font });
page.drawText(` ${data.horaInicio}`, { x: 170, y: 561, size: 12, font });
page.drawText(` ${data.horaFin}`, { x: 440, y: 561, size: 12, font });





// Asistentes (menos espacio entre filas)
if (Array.isArray(data.asistentes)) {
  data.asistentes.forEach((a, i) => {
    const baseY = 490; // punto de inicio de la tabla
    const step = 18;   // 🔽 antes era 25 → ahora más compacto
    const y = baseY - i * step;

    page.drawText(`${i + 1}`, { x: 80, y, size: 10, font });
    page.drawText(a.nombre, { x: 140, y, size: 10, font });
    page.drawText(a.cargo, { x: 340, y, size: 10, font });
    page.drawText("_____________", { x: 490, y, size: 10, font });
  });
}





    const finalPdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Lista_Asistencia.pdf");
    res.send(Buffer.from(finalPdfBytes));
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

module.exports = router;
