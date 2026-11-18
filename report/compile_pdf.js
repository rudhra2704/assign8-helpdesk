import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const baseDir = "/Users/rudra_yadav777/ASS8AI/campus-helpdesk-agent/report";
const outputFile = path.join(baseDir, "report.pdf");

const doc = new PDFDocument({
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  size: "A4",
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputFile);
doc.pipe(writeStream);

// Helper for title
function addTitle(text, subtitle) {
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a365d").text(text, { align: "center" });
  if (subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica-Oblique").fillColor("#4a5568").text(subtitle, { align: "center" });
  }
  doc.moveDown(0.8);
  doc.strokeColor("#cbd5e0").lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);
}

function addHeading1(text) {
  doc.moveDown(0.8);
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#2b6cb0").text(text);
  doc.moveDown(0.3);
  doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.4);
}

function addHeading2(text) {
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#2d3748").text(text);
  doc.moveDown(0.2);
}

function addParagraph(text) {
  doc.fontSize(9).font("Helvetica").fillColor("#2d3748").text(text, { lineGap: 2.5, paragraphGap: 4 });
}

function addBullet(text) {
  doc.fontSize(8.5).font("Helvetica").fillColor("#2d3748").text(`•  ${text}`, { indent: 10, lineGap: 2 });
}

function addCodeBlock(text) {
  doc.moveDown(0.3);
  const codeLines = text.split("\n");
  const blockHeight = codeLines.length * 11 + 10;
  if (doc.y + blockHeight > doc.page.height - 50) {
    doc.addPage();
  }
  const startY = doc.y;
  doc.rect(45, startY, 505, blockHeight).fillAndStroke("#f7fafc", "#e2e8f0");
  doc.fontSize(8).font("Courier").fillColor("#1a202c");
  codeLines.forEach((line, idx) => {
    doc.text(line, 55, startY + 6 + idx * 11, { width: 485 });
  });
  doc.y = startY + blockHeight + 6;
}

// COVER / HEADER
addTitle("Building and Auditing an AI-Agent Toolchain", "Comprehensive Academic Audit Report | Date: 18 Nov 2026\nRepository: campus-helpdesk-agent");

// READ PARTS A - F
const parts = [
  { id: "Part A", file: "partA.md", title: "Part A: CTO Briefing Audit" },
  { id: "Part B", file: "partB.md", title: "Part B: Agent Skill Engineering (timetable-helper)" },
  { id: "Part C", file: "partC.md", title: "Part C: Plugin Architecture, Threat Modeling & Prompt Injection" },
  { id: "Part D", file: "partD.md", title: "Part D: Model Context Protocol (MCP) Server Audit" },
  { id: "Part E", file: "partE.md", title: "Part E: Git Worktrees Simulation & Conflict Resolution" },
  { id: "Part F", file: "partF.md", title: "Part F: Self-Audit, Reflection & Final Assembly" },
  { id: "Sources", file: "sources.md", title: "Official Source Verification List" }
];

parts.forEach((p, idx) => {
  if (idx > 0) {
    doc.addPage();
  }
  addHeading1(p.title);
  const filePath = path.join(baseDir, p.file);
  if (!fs.existsSync(filePath)) {
    addParagraph(`[File not found: ${p.file}]`);
    return;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");
  let inCode = false;
  let codeBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("```")) {
      if (inCode) {
        addCodeBlock(codeBuffer.join("\n"));
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(l);
      continue;
    }

    if (l.startsWith("# ")) {
      // already printed title
      continue;
    } else if (l.startsWith("## ")) {
      addHeading2(l.replace(/^##\s+/, ""));
    } else if (l.startsWith("### ")) {
      addHeading2(l.replace(/^###\s+/, ""));
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      addBullet(l.replace(/^[-*]\s+/, ""));
    } else if (l.trim() === "---") {
      doc.moveDown(0.3);
      doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
    } else if (l.trim().length > 0) {
      addParagraph(l);
    }
  }
  if (inCode && codeBuffer.length > 0) {
    addCodeBlock(codeBuffer.join("\n"));
  }
});

// Add page numbers
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).font("Helvetica").fillColor("#a0aec0").text(
    `Campus Helpdesk Agent Toolchain Audit | Page ${i + 1} of ${range.count}`,
    45,
    doc.page.height - 30,
    { align: "center", width: 505 }
  );
}

doc.end();

writeStream.on("finish", () => {
  console.log("SUCCESS: Created compiled PDF at " + outputFile);
});
