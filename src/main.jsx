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
  gradeSubject: "",
  observerName: "",
  observationDate: "",
};

const detailFields = [
  { id: "teacherName", label: "Teacher Name", autoComplete: "name" },
  { id: "school", label: "School" },
  { id: "gradeSubject", label: "Grade/Subject", optional: true },
  { id: "observerName", label: "Observer Name", autoComplete: "name" },
  { id: "observationDate", label: "Observation Date", type: "date", optional: true },
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

        <section className="ai-workflow" aria-labelledby="workflow-title">
          <h2 id="workflow-title">
            <ListChecks aria-hidden="true" />
            Observation Workflow
          </h2>
          <div className="workflow-steps">
            <div className="workflow-step">
              <span>1</span>
              <p>Select or drop the observation file.</p>
            </div>
            <div className="workflow-step">
              <span>2</span>
              <p>Enter the teacher, school, observer, and observation details.</p>
            </div>
            <div className="workflow-step">
              <span>3</span>
              <p>Store the original and AI-ready Markdown copy in Cloudinary.</p>
            </div>
          </div>
        </section>

        <section className="connection-panel" aria-labelledby="cloudinary-title">
          <h2 id="cloudinary-title">Markdown Workflow Connected</h2>
          <p>
            This portal sends files through a backend that stores the original,
            extracts text, creates a Markdown copy, and uploads both files to
            Cloudinary.
          </p>
          <dl>
            <div>
              <dt>Folder</dt>
              <dd>{FOLDER_NAME}</dd>
            </div>
            <div>
              <dt>Backend API</dt>
              <dd>{API_URL}</dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
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
      setStatus({
        type: "error",
        message: "Only PDF, DOC, and DOCX files are supported.",
      });
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

    if (file && !isSupportedFile(file)) {
      event.target.value = "";
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!uploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    if (!uploading) {
      selectFile(event.dataTransfer.files?.[0]);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setObservationType("");
    setObservationRound("");
    setObservationDetails(initialObservationDetails);
    setStatus(null);
    setUploadResult(null);
    setProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateObservationDetail = (field, value) => {
    setObservationDetails((currentDetails) => ({
      ...currentDetails,
      [field]: value,
    }));
  };

  const uploadObservation = async () => {
    if (!selectedFile) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    const missingDetail = detailFields.find(
      (field) => !field.optional && !observationDetails[field.id].trim()
    );

    if (missingDetail) {
      setStatus({
        type: "error",
        message: `Please enter ${missingDetail.label.toLowerCase()}.`,
      });
      return;
    }

    if (!observationType) {
      setStatus({
        type: "error",
        message: "Please select whether the observation is announced or unannounced.",
      });
      return;
    }

    if (!observationRound) {
      setStatus({
        type: "error",
        message: "Please select an observation round.",
      });
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
      formData.append("gradeSubject", observationDetails.gradeSubject.trim());
      formData.append("observationType", observationType);
      formData.append("observationRound", observationRound);
      formData.append("observerName", observationDetails.observerName.trim());
      formData.append("observationDate", observationDetails.observationDate);

      setProgress(45);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      setProgress(80);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setProgress(100);
      setUploadResult(data);
      setStatus({
        type: "success",
        message: data.message || "Original and Markdown files uploaded.",
      });
      setSelectedFile(null);
      setObservationType("");
      setObservationRound("");
      setObservationDetails(initialObservationDetails);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Something went wrong.",
      });
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
        <button
          type="button"
          className="button button-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <UploadCloud aria-hidden="true" />
          Choose File
        </button>
        {selectedFile && (
          <button
            type="button"
            className="button button-secondary"
            onClick={resetForm}
            disabled={uploading}
            aria-label="Clear selected file"
          >
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
            optional={field.optional}
            value={observationDetails[field.id]}
            onChange={(value) => updateObservationDetail(field.id, value)}
          />
        ))}
        <ChoiceGroup
          label="Observation Type"
          options={observationTypes}
          value={observationType}
          onChange={setObservationType}
        />
        <ChoiceGroup
          label="Observation Round"
          options={observationRounds}
          value={observationRound}
          onChange={setObservationRound}
        />
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
            className={
              uploading ? "button button-primary is-loading" : "button button-primary"
            }
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
          {status.type === "success" ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <AlertCircle aria-hidden="true" />
          )}
          <p>{status.message}</p>
        </div>
      )}

      {uploadResult && <UploadResult result={uploadResult} />}

      {status?.type === "success" && (
        <div className="toast show" role="status">
          {status.message}
        </div>
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
        <strong>{result.markdown.tokenEstimate.toLocaleString()}</strong> tokens
        for future AI analysis.
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

function TextField({ id, label, type, autoComplete, value, onChange, optional }) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}{" "}
        {optional
          ? <em aria-label="optional" style={{ fontStyle: "normal", fontWeight: "normal", opacity: 0.6 }}>(optional)</em>
          : <strong aria-hidden="true">*</strong>
        }
      </span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={!optional}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ChoiceGroup({ label, options, value, onChange }) {
  return (
    <fieldset className="choice-group">
      <legend>
        {label} <strong aria-hidden="true">*</strong>
      </legend>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "choice is-selected" : "choice"}
            onClick={() => onChange(option)}
          >
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
