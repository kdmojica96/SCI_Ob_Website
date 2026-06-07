import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  ListChecks,
  RotateCcw,
  UploadCloud,
  Mail,
  Settings,
  Zap,
  Globe,
} from "lucide-react";
import "./styles.css";

const FOLDER_NAME = "Summit-Curriculum-Instruction";
const API_URL =
  import.meta.env.VITE_API_URL || "/api/observations";

const observationTypes = ["Announced", "Unannounced"];
const observationRounds = ["Round 1", "Round 2", "Round 3"];

const initialObservationDetails = {
  teacherName: "",
  school: "",
  grade: "",
  subject: "",
  observerName: "",
  observationDate: "",
};

const detailFields = [
  { id: "teacherName", label: "Teacher Name", autoComplete: "name" },
  { id: "school", label: "School" },
  { id: "grade", label: "Grade" },
  { id: "subject", label: "Subject" },
  { id: "observerName", label: "Observer Name", autoComplete: "name" },
  { id: "observationDate", label: "Observation Date", type: "date" },
];

const acceptedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isSupportedFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtension = ["pdf", "doc", "docx"].includes(extension);
  return acceptedTypes.includes(file.type) || validExtension;
}

function SummitCurriculumInstruction() {
  return (
    <main className="app-shell">
      <section className="upload-panel" aria-labelledby="page-title">
        <header className="brand-header">
          <img
            src="https://res.cloudinary.com/dqp4xuy5j/image/upload/v1778354945/Logo_kyhlvq.png"
            alt="Summit Curriculum Instruction Logo"
            className="brand-logo"
          />
          <div>
            <h1 id="page-title">Summit Curriculum Instruction</h1>
            <p>
              Upload classroom observations in PDF, Google Docs export, Word, or
              DOCX format.
            </p>
          </div>
        </header>

        <UploadCard />

        <WorkflowDocs />
      </section>
    </main>
  );
}

function WorkflowDocs() {
  return (
    <div className="workflow-docs">

      {/* HOW THE SKILL WORKS */}
      <section className="docs-section" aria-labelledby="skill-title">
        <h2 id="skill-title">
          <ListChecks aria-hidden="true" />
          Observation Write-Up Skill
        </h2>
        <p className="docs-intro">
          The <code>appr-observation-writeup</code> skill handles the full pipeline automatically. Here's exactly what it does when triggered:
        </p>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span>1</span>
            <div>
              <strong>Input</strong>
              <p>User submits a Google Doc link, uploaded PDF, or Word doc with raw observation notes.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>2</span>
            <div>
              <strong>Process</strong>
              <p>Claude reads the file, identifies the round (1, 2, or 3), pulls the matching template from Google Drive, and completes every section: Narrative, Domain 2, Domain 3, Engagement Norms, Strengths &amp; Growth.</p>
            </div>
          </div>
          <div className="workflow-step">
            <span>3</span>
            <div>
              <strong>Output</strong>
              <p>Saves a completed write-up as a new Google Doc in Drive, then drafts an email with the Doc link and a summary of strengths and growth areas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO TRIGGER */}
      <section className="docs-section" aria-labelledby="trigger-title">
        <h2 id="trigger-title">
          <Zap aria-hidden="true" />
          How to Trigger It
        </h2>
        <div className="trigger-callout">
          <p>Paste a Google Doc link or upload a file and say <strong>"complete the write-up."</strong></p>
          <p>That's all it takes. Building a write-up manually into a DOCX is the long path — the skill handles every section automatically and the result lands in Drive with a draft email ready.</p>
        </div>
      </section>

      {/* EMAIL CONFIGURATION */}
      <section className="docs-section" aria-labelledby="email-title">
        <h2 id="email-title">
          <Mail aria-hidden="true" />
          Email Configuration
        </h2>
        <p className="docs-intro">
          The skill collects the recipient email at the start of every job. It never defaults to a hardcoded address.
        </p>
        <div className="email-config">
          <div className="email-row">
            <span className="email-label">From</span>
            <span className="email-value">summitcurriculumlinstruction@gmail.com</span>
          </div>
          <div className="email-row">
            <span className="email-label">To</span>
            <span className="email-value">Collected from you at Step 0 of each job</span>
          </div>
        </div>
        <p className="docs-note">
          Make sure the <code>summitcurriculumlinstruction@gmail.com</code> account is connected to your Gmail MCP so drafts land in the right inbox when you're ready to send.
        </p>
      </section>

      {/* SKILL CONFIGURATION */}
      <section className="docs-section" aria-labelledby="config-title">
        <h2 id="config-title">
          <Settings aria-hidden="true" />
          Skill Configuration
        </h2>
        <p className="docs-intro">
          To update the skill, go to <strong>Settings → Capabilities</strong> in the Claude desktop app. Three spots to change:
        </p>
        <ul className="skill-update-list">
          <li>
            <div>
              <strong>Add Step 0</strong> — Before reading any file, ask for the recipient email. Store it as <code>RECIPIENT_EMAIL</code>. Do not proceed until both the email and file are confirmed.
            </div>
          </li>
          <li>
            <div>
              <strong>Update Step 6 — To line</strong> — Replace any hardcoded address with:<br />
              <code>To: [RECIPIENT_EMAIL collected in Step 0]</code>
            </div>
          </li>
          <li>
            <div>
              <strong>Update Step 6 — From line</strong> — Add directly under the To line:<br />
              <code>From: summitcurriculumlinstruction@gmail.com</code>
            </div>
          </li>
        </ul>
        <p className="docs-note">
          Once saved, the skill asks for the recipient email every time before it starts processing. The email draft always goes to the address collected in Step 0.
        </p>
      </section>

      {/* NETLIFY DEPLOYMENT */}
      <section className="docs-section" aria-labelledby="deploy-title">
        <h2 id="deploy-title">
          <Globe aria-hidden="true" />
          Deployment Setup
        </h2>
        <p className="docs-intro">
          Netlify pulls directly from GitHub — no file uploads needed. Configure three things in the Netlify UI:
        </p>

        <h3 className="docs-sub">1. Build settings</h3>
        <table className="config-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Base directory</td><td><code>observation-writeup-site</code></td></tr>
            <tr><td>Build command</td><td><code>(leave blank)</code></td></tr>
            <tr><td>Publish directory</td><td><code>public</code></td></tr>
          </tbody>
        </table>

        <h3 className="docs-sub">2. Functions directory</h3>
        <p className="docs-intro">In <strong>Site settings → Functions</strong>, set the directory to <code>netlify/functions</code>.</p>

        <h3 className="docs-sub">3. Environment variable</h3>
        <p className="docs-intro">In <strong>Site settings → Environment variables</strong>, add:</p>
        <div className="code-block">ANTHROPIC_API_KEY = [your key from console.anthropic.com]</div>
        <p className="docs-note">
          Netlify reads everything else from the <code>netlify.toml</code> already in the repo.
        </p>
      </section>

    </div>
  );
}

function UploadCard() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [observationType, setObservationType] = useState("");
  const [observationRound, setObservationRound] = useState("");
  const [observationDetails, setObservationDetails] = useState(initialObservationDetails);
  const [dragActive, setDragActive] = useState(false);

  const selectFile = (file) => {
    if (!file) return;
    if (!isSupportedFile(file)) {
      setStatus({ type: "error", message: "Only PDF, DOC, and DOCX files are supported." });
      return;
    }
    setSelectedFile(file);
    setStatus(null);
    setUploadResult(null);
    setProgress(0);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    selectFile(file);
    if (file && !isSupportedFile(file)) event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!uploading) setDragActive(true);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    if (!uploading) selectFile(event.dataTransfer.files?.[0]);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setObservationType("");
    setObservationRound("");
    setObservationDetails(initialObservationDetails);
    setStatus(null);
    setUploadResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateObservationDetail = (field, value) => {
    setObservationDetails((currentDetails) => ({ ...currentDetails, [field]: value }));
  };

  const uploadObservation = async () => {
    if (!selectedFile) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }
    const missingDetail = detailFields.find((field) => !observationDetails[field.id].trim());
    if (missingDetail) {
      setStatus({ type: "error", message: `Please enter ${missingDetail.label.toLowerCase()}.` });
      return;
    }
    if (!observationType) {
      setStatus({ type: "error", message: "Please select whether the observation is announced or unannounced." });
      return;
    }
    if (!observationRound) {
      setStatus({ type: "error", message: "Please select an observation round." });
      return;
    }

    setUploading(true);
    setProgress(10);
    setStatus(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("teacherName", observationDetails.teacherName.trim());
      formData.append("school", observationDetails.school.trim());
      formData.append("grade", observationDetails.grade.trim());
      formData.append("subject", observationDetails.subject.trim());
      formData.append("observationType", observationType);
      formData.append("observationRound", observationRound);
      formData.append("observerName", observationDetails.observerName.trim());
      formData.append("observationDate", observationDetails.observationDate);

      setProgress(45);
      const response = await fetch(API_URL, { method: "POST", body: formData });
      setProgress(80);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || "Upload failed");

      setProgress(100);
      setUploadResult(data);
      setStatus({ type: "success", message: data.message || "Original and Markdown files uploaded." });
      setSelectedFile(null);
      setObservationType("");
      setObservationRound("");
      setObservationDetails(initialObservationDetails);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Something went wrong." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      className={dragActive ? "upload-card is-dragover" : "upload-card"}
      aria-labelledby="upload-title"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="file-input"
        tabIndex={-1}
        onChange={handleFileChange}
      />
      <div className="upload-icon">
        <UploadCloud aria-hidden="true" />
      </div>
      <h2 id="upload-title">Upload Observation File</h2>
      <p>Supported formats: PDF, DOC, DOCX</p>
      <div className="primary-actions">
        <button type="button" className="button button-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <UploadCloud aria-hidden="true" />
          Choose File
        </button>
        {selectedFile && (
          <button type="button" className="button button-secondary" onClick={resetForm} disabled={uploading} aria-label="Clear selected file">
            <RotateCcw aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
      <div className="details-form" aria-label="Observation details">
        {detailFields.map((field) => (
          <TextField
            key={field.id}
            id={field.id}
            label={field.label}
            type={field.type || "text"}
            autoComplete={field.autoComplete}
            value={observationDetails[field.id]}
            onChange={(value) => updateObservationDetail(field.id, value)}
          />
        ))}
        <ChoiceGroup label="Observation Type" options={observationTypes} value={observationType} onChange={setObservationType} />
        <ChoiceGroup label="Observation Round" options={observationRounds} value={observationRound} onChange={setObservationRound} />
      </div>
      {selectedFile && (
        <div className="file-row">
          <div className="file-summary">
            <FileText aria-hidden="true" />
            <div>
              <p>{selectedFile.name}</p>
              <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
          <button
            type="button"
            onClick={uploadObservation}
            disabled={uploading}
            className={uploading ? "button button-primary is-loading" : "button button-primary"}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}
      {uploading && (
        <div className="progress-wrap" aria-live="polite">
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}% complete</span>
        </div>
      )}
      {status && (
        <div className={`status status-${status.type}`} role="status">
          {status.type === "success" ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
          <p>{status.message}</p>
        </div>
      )}
      {uploadResult && <UploadResult result={uploadResult} />}
      {status?.type === "success" && (
        <div className="toast show" role="status">{status.message}</div>
      )}
    </section>
  );
}

function UploadResult({ result }) {
  return (
    <section className="result-panel" aria-labelledby="result-title">
      <h3 id="result-title">Saved Files</h3>
      <div className="result-grid">
        <ResultLink label="Original file" file={result.original} />
        <ResultLink label="Markdown file" file={result.markdown} />
      </div>
      <p>
        Estimated Markdown size: about{" "}
        <strong>{result.markdown.tokenEstimate.toLocaleString()}</strong> tokens for future AI analysis.
      </p>
    </section>
  );
}

function ResultLink({ label, file }) {
  return (
    <a className="result-link" href={file.url} target="_blank" rel="noreferrer">
      <span>
        <strong>{label}</strong>
        <small>{file.filename}</small>
      </span>
      <ExternalLink aria-hidden="true" />
    </a>
  );
}

function TextField({ id, label, type, autoComplete, value, onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label} <strong aria-hidden="true">*</strong></span>
      <input id={id} type={type} value={value} autoComplete={autoComplete} required onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ChoiceGroup({ label, options, value, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend>{label} <strong aria-hidden="true">*</strong></legend>
      <div>
        {options.map((option) => (
          <button key={option} type="button" className={value === option ? "choice is-selected" : "choice"} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SummitCurriculumInstruction />
  </React.StrictMode>
);
