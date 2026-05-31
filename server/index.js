import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import WordExtractor from "word-extractor";

const CLOUD_NAME = "dqp4xuy5j";
const UPLOAD_PRESET = "observation_uploads";
const FOLDER_NAME = "Summit-Curriculum-Instruction";
const PORT = Number(process.env.PORT || 5174);
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const requiredFields = [
  "teacherName",
  "school",
  "observationType",
  "observationRound",
  "observerName",
];

const optionalFields = ["gradeSubject", "observationDate"];

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE },
});

app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"] }));
app.use(express.json());

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanMetadataValue(value) {
  return String(value || "")
    .trim()
    .replace(/[|=]/g, " ");
}

function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function isSupportedFile(file) {
  return [".pdf", ".doc", ".docx"].includes(getExtension(file.originalname));
}

function buildContext(details) {
  return [
    `teacher_name=${cleanMetadataValue(details.teacherName)}`,
    `school=${cleanMetadataValue(details.school)}`,
    `grade_subject=${cleanMetadataValue(details.gradeSubject)}`,
    `observation_type=${cleanMetadataValue(details.observationType)}`,
    `observation_round=${cleanMetadataValue(details.observationRound)}`,
    `observer_name=${cleanMetadataValue(details.observerName)}`,
    `observation_date=${cleanMetadataValue(details.observationDate)}`,
  ].join("|");
}

async function uploadRawToCloudinary({ buffer, filename, contentType, publicId, tags, context }) {
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: contentType }), filename);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", FOLDER_NAME);
  formData.append("resource_type", "raw");
  formData.append("public_id", publicId);
  formData.append("tags", tags.join(","));
  formData.append("context", context);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed.");
  }

  return data;
}

async function extractText(file) {
  const extension = getExtension(file.originalname);

  if (extension === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text;
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (extension === ".doc") {
    const extractor = new WordExtractor();
    const document = await extractor.extract(file.buffer);
    return document.getBody();
  }

  throw new Error("Unsupported file type.");
}

function cleanExtractedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function buildMarkdown(details, originalFileName, originalUpload, extractedText) {
  const cleanedText = cleanExtractedText(extractedText);
  const tokenEstimate = Math.ceil(cleanedText.length / 4);

  return {
    tokenEstimate,
    markdown: `# Observation: ${details.teacherName}

## Data Collection

- Teacher Name: ${details.teacherName}
- School: ${details.school}
- Grade/Subject: ${details.gradeSubject || "N/A"}
- Observation Type: ${details.observationType}
- Observation Round: ${details.observationRound}
- Observer Name: ${details.observerName}
- Observation Date: ${details.observationDate || "N/A"}
- Original File: ${originalFileName}
- Original Cloudinary URL: ${originalUpload.secure_url}

## Extracted Observation Text

${cleanedText || "_No extractable text was found in this document._"}
`,
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/observations", upload.single("file"), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "Please choose a file." });
    }

    if (!isSupportedFile(request.file)) {
      return response.status(400).json({ error: "Only PDF, DOC, and DOCX files are supported." });
    }

    const details = {
      ...Object.fromEntries(
        requiredFields.map((field) => [field, cleanMetadataValue(request.body[field])])
      ),
      ...Object.fromEntries(
        optionalFields.map((field) => [field, cleanMetadataValue(request.body[field] || "")])
      ),
    };

    const missingField = requiredFields.find((field) => !details[field]);

    if (missingField) {
      return response.status(400).json({ error: `Missing required field: ${missingField}` });
    }

    const basePublicId = [
      slugify(details.teacherName),
      slugify(details.observationRound),
      Date.now(),
    ]
      .filter(Boolean)
      .join("-");
    const context = buildContext(details);
    const tags = [
      slugify(details.observationType),
      slugify(details.observationRound),
      slugify(details.school),
      slugify(details.gradeSubject),
      "original",
    ].filter(Boolean);

    const originalUpload = await uploadRawToCloudinary({
      buffer: request.file.buffer,
      filename: request.file.originalname,
      contentType: request.file.mimetype || "application/octet-stream",
      publicId: `${basePublicId}-original`,
      tags,
      context,
    });

    const extractedText = await extractText(request.file);
    const { markdown, tokenEstimate } = buildMarkdown(
      details,
      request.file.originalname,
      originalUpload,
      extractedText
    );
    const markdownFilename = `${basePublicId}.md`;
    const markdownUpload = await uploadRawToCloudinary({
      buffer: Buffer.from(markdown, "utf8"),
      filename: markdownFilename,
      contentType: "text/markdown; charset=utf-8",
      publicId: `${basePublicId}-markdown`,
      tags: tags.filter((tag) => tag !== "original").concat("markdown", "ai-ready"),
      context,
    });

    response.json({
      message: "Original file and Markdown version uploaded successfully.",
      original: {
        filename: request.file.originalname,
        url: originalUpload.secure_url,
        publicId: originalUpload.public_id,
      },
      markdown: {
        filename: markdownFilename,
        url: markdownUpload.secure_url,
        publicId: markdownUpload.public_id,
        tokenEstimate,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: error.message || "Upload workflow failed.",
    });
  }
});

app.use(express.static(path.join(projectRoot, "dist")));

app.get("*", (_request, response) => {
  response.sendFile(path.join(projectRoot, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Observation workflow server running at http://127.0.0.1:${PORT}`);
});
