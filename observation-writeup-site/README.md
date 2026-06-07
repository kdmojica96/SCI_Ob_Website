# Peekskill CSD — Observation Write-Up Site

Teacher-facing submission form + automated Danielson APPR write-up workflow.

## How it works

1. Teacher opens the Netlify site and submits their observation notes (PDF, Word doc, or Google Doc link) along with their email address.
2. Netlify receives the form and triggers a serverless function.
3. The function calls the Claude API with the observation content.
4. Claude completes the full Danielson write-up (Domain 2, Domain 3, Engagement Norms, Strengths & Growth).
5. The completed write-up is saved as a new Google Doc.
6. An email draft is created from summitcurriculumlinstruction@gmail.com to the teacher's submitted email with the Google Doc link.

## Folder structure

```
observation-writeup-site/
├── public/
│   └── index.html                  # Teacher submission form (hosted by Netlify)
├── netlify/
│   └── functions/
│       ├── submit-observation.js   # Serverless function — calls Claude API
│       └── package.json            # Dependencies (@anthropic-ai/sdk)
├── skills/
│   └── SKILL.md                    # APPR write-up skill (copy this into Claude Settings → Capabilities)
├── netlify.toml                    # Netlify build + functions config
└── README.md
```

## Setup

### 1. Push to GitHub
Create a new GitHub repo and push this folder:
```bash
git init
git add .
git commit -m "Initial commit — observation write-up site"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Netlify
- Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
- Select your repo
- Build settings are already in `netlify.toml` — no changes needed
- Click **Deploy**

### 3. Add your API key
In Netlify → Site → **Environment Variables**, add:
```
ANTHROPIC_API_KEY = your_key_from_console.anthropic.com
```

### 4. Install function dependencies
In Netlify → Site → **Build settings**, set the functions directory to `netlify/functions`.
Netlify will automatically run `npm install` in that directory using the `package.json` there.

### 5. Update the skill in Claude
Copy the contents of `skills/SKILL.md` into **Claude Desktop → Settings → Capabilities → appr-observation-writeup**.

## Customization

- **Add/remove buildings**: Edit the `<select id="building">` options in `public/index.html`
- **Change sender email**: Update `summitcurriculumlinstruction@gmail.com` in `skills/SKILL.md` Step 6
- **Change Claude model**: Edit `model:` in `netlify/functions/submit-observation.js`
