import busboy from "busboy";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import path from "node:path";
import { Buffer } from "node:buffer";

const CLOUD_NAME = "dqp4xuy5j";
const UPLOAD_PRESET = "observation_uploads";
const FOLDER_NAME = "Summit-Curriculum-Instruction";
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

const requiredFields = [
  "teacherName",
  "school",
  "grade",
  "subject",
  "observationType",
  "observationRound",
  "observerName",
  "observationDate",
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanMetadataValue(value) {
  return String(value || "").trim().replace(/[|=]/g, " ");
}

function buildContext(details) {
  return [
    `teacher_name=${cleanMetadataValue(details.teacherName)}`,
    `school=${cleanMetadataValue(details.school)}`,
    `grade=${cleanMetadataValue(details.grade)}`,
    `subject=${cleanMetadataValue(details.subject)}`,
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

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
    { method: "POST", body: formData }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Cloudinary upload failed.");
  return data;
}

async function extractText(buffer, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Use PDF or DOCX.");
}

function cleanExtractedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function buildMarkdown(details, originalFileName, originalUrl, extractedText) {
  const cleanedText = cleanExtractedText(extractedText);
  const tokenEstimate = Math.ceil(cleanedText.length / 4);

  return {
    tokenEstimate,
    markdown: `# Observation: ${details.teacherName}

## Data Collection

- Teacher Name: ${details.teacherName}
- School: ${details.school}
- Grade: ${details.grade}
- Subject: ${details.subject}
- Observation Type: ${details.observationType}
- Observation Round: ${details.observationRound}
- Observer Name: ${details.observerName}
- Observation Date: ${details.observationDate}
- Original File: ${originalFileName}
- Original Cloudinary URL: ${originalUrl}

## Extracted Observation Text

${cleanedText || "_No extractable text was found in this document._"}
`,
  };
}

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let file = null;

    const bb = busboy({
      headers: { "content-type": event.headers["content-type"] },
      limits: { fileSize: MAX_UPLOAD_SIZE },
    });

    bb.on("file", (name, stream, info) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        file = {
          buffer: Buffer.concat(chunks),
          originalname: info.filename,
          mimetype: info.mimeType,
        };
      });
    });

    bb.on("field", (name, val) => {
      fields[name] = val;
    });

    bb.on("finish", () => resolve({ fields, file }));
    bb.on("error", reject);

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "");

    bb.write(body);
    bb.end();
  });
}

export const handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method not allowed." }) };
  }

  try {
    const { fields, file } = await parseMultipart(event);

    if (!file) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Please choose a file." }) };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (![".pdf", ".docx"].includes(ext)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Only PDF and DOCX files are supported." }) };
    }

    const details = Object.fromEntries(
      requiredFields.map((f) => [f, cleanMetadataValue(fields[f])])
    );

    const missingField = requiredFields.find((f) => !details[f]);
    if (missingField) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: `Missing required field: ${missingField}` }) };
    }

    const basePublicId = [
      slugify(details.teacherName),
      slugify(details.observationRound),
      Date.now(),
    ].filter(Boolean).join("-");

    const context = buildContext(details);
    const tags = [
      slugify(details.observationType),
      slugify(details.observationRound),
      slugify(details.school),
      slugify(details.subject),
      "original",
    ].filter(Boolean);

    const originalUpload = await uploadRawToCloudinary({
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype || "application/octet-stream",
      publicId: `${basePublicId}-original`,
      tags,
      context,
    });

    const extractedText = await extractText(file.buffer, file.originalname);
    const { markdown, tokenEstimate } = buildMarkdown(
      details,
      file.originalname,
      originalUpload.secure_url,
      extractedText
    );

    const markdownFilename = `${basePublicId}.md`;
    const markdownUpload = await uploadRawToCloudinary({
      buffer: Buffer.from(markdown, "utf8"),
      filename: markdownFilename,
      contentType: "text/markdown; charset=utf-8",
      publicId: `${basePublicId}-markdown`,
      tags: tags.filter((t) => t !== "original").concat("markdown", "ai-ready"),
      context,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Original file and Markdown version uploaded successfully.",
        original: {
          filename: file.originalname,
          url: originalUpload.secure_url,
          publicId: originalUpload.public_id,
        },
        markdown: {
          filename: markdownFilename,
          url: markdownUpload.secure_url,
          publicId: markdownUpload.public_id,
          tokenEstimate,
        },
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message || "Upload workflow failed." }),
    };
  }
};
