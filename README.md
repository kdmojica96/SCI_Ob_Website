# Summit Curriculum Instruction

This project is a React upload portal for classroom observation files. It accepts PDF, DOC, and DOCX files, collects required teacher, school, grade, subject, observer, date, observation type, and observation round details, uploads the original file to Cloudinary, extracts the document text, creates an AI-ready Markdown file, and uploads that Markdown file to Cloudinary too.

The interface includes click-to-select and drag-and-drop upload selection, keyboard focus states, progress feedback, success/error notifications, print-safe styling, and reduced-motion support.

## Workflow

1. The user uploads a PDF, DOC, or DOCX file.
2. The frontend sends the file and required observation details to the backend.
3. The backend uploads the original file to Cloudinary.
4. The backend extracts text from the file.
5. The backend cleans the text and wraps it in a Markdown observation record.
6. The backend uploads the `.md` file to Cloudinary.
7. The frontend shows links to both the original file and the Markdown file.

## Cloudinary Settings

The current settings live at the top of `src/main.jsx`:

- `CLOUD_NAME`: `dqp4xuy5j`
- `UPLOAD_PRESET`: `observation_uploads`
- `FOLDER_NAME`: `Summit-Curriculum-Instruction`

The Cloudinary upload preset must be unsigned and must allow raw file uploads for browser uploads to work.

## Run Locally

Open two terminal tabs from this project folder:

```bash
npm install
npm run server
```

```bash
npm run dev
```

Then open the local URL shown by Vite, usually `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

The production files will be created in `dist/`.
