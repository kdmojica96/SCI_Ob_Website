---
name: appr-observation-writeup
description: Complete a Danielson APPR observation write-up for a Peekskill teacher. Converts raw observation notes (uploaded PDF, Google Doc link, or Word doc) into a fully completed write-up with Domain 2, Domain 3, strengths, growth potential, and engagement norms analysis. Then saves the result as a new Google Doc and emails a link + summary to the person who shared the file. Use when someone uploads or shares raw observation notes and asks to "complete the write-up", "finish the observation", or "run the observation through the template."
---

# APPR Observation Write-Up

## Quick start

User provides raw observation notes (uploaded PDF, Word doc, or Google Doc link). Run this skill to produce a fully completed Danielson write-up and email the result.

---

## Step 0 — Collect submitter information

Before reading any file, ask the user for the following. Do not proceed until both are confirmed:

1. **Recipient email** — "What email address should the completed write-up be sent to?"
2. **Confirm the file** — "Please confirm the file or Google Doc link for the observation notes."

Store the email as `RECIPIENT_EMAIL`. Use it in Step 6 instead of any hardcoded address.

If the user already provided the file in their message, still ask for the email before proceeding.

---

## Step 1 — Read the input file

Determine the file type and read its content:

- **Google Doc link**: Use `mcp__99dac68f__read_file_content` with the file ID extracted from the URL (the long alphanumeric string between `/d/` and `/edit`)
- **PDF upload**: Use the `pdf` skill or `Read` tool on the uploaded file path
- **Word doc (.docx)**: Use `mcp__workspace__bash` with `python3 -c "import docx; doc=docx.Document('PATH'); [print(p.text) for p in doc.paragraphs]"` (install python-docx if needed)

Convert the content to plain text and treat it as the **OBSERVATION TRANSCRIPT**.

---

## Step 2 — Identify the round

Look at the transcript for these signals:

| Signal | Round |
|--------|-------|
| "Pre-observation", "pre-obs conference", "announced" | Round 1 or 3 |
| "Unannounced", no pre-observation section | Round 2 |
| "Round 3", "3rd", "third round", or it is May/June | Round 3 |
| "Round 1", "1st", "first round", or it is Oct/Nov | Round 1 |

**Template Google Doc IDs** (read with `mcp__99dac68f__read_file_content`):

| Round | Doc ID |
|-------|--------|
| Round 1 (Announced) | `1vUzr5jFuLk33Q7gaMyVFrijF9Mb-js_3KlgZyR2JSjg` |
| Round 2 (Unannounced) | `1fLD3t7EcgPACkh9hIByFmESZCPwVuo3A24ddAZyOEPk` |
| Round 3 (Announced) | `1uPalrsRMCxZwJnbo5rHZ_mU3khTgyUopOE926FfKfic` |

**Completed sample Google Doc IDs** (use as reference for output format):

| Round | Sample Doc ID |
|-------|---------------|
| Round 1 | `1zNv0-xY4KsNbxMV9NTEGYa04a4ddGfqIGdXfOqkzOj4` |
| Round 2 | `1IuN99xZz1mZDW25QmGURe35aI_O9AYSTjuWUZFCj2eE` |
| Round 3 | `1UBgqVFRLJ5cwZglv6oYVnz8arFYjyeAAOc7pzQbSRGM` |

Read the template AND one completed sample to calibrate tone and format before writing.

---

## Step 3 — Extract teacher name and metadata

From the transcript, identify:
- Teacher name (full)
- Subject and grade level
- Building (PKMS, PHS, EBA, etc.)
- Room number
- Observation date and time
- Round number

---

## Step 4 — Complete each section

Work through all parts in order. Use ONLY evidence from the transcript — never invent quotes or events.

### Part A: Narrative transcript
Reorganize the raw notes into a clean, chronological narrative. Use bullets.
- **T:** = teacher action or quote
- **S:** = student response or action
- **Q:** = observer question or note

Then list all questions the teacher asked students (verbatim where possible).

### Part B/C: Summary of strengths and growth potential (Domain 1, 2, 3)
Summarize strengths and growth areas across:
- **Domain 1: Planning and Preparation** (inferred from pre-observation notes and lesson structure)
- **Domain 2: Classroom Environment** (from observed behavior management and culture)
- **Domain 3: Instruction** (from observed instructional moves)

For growth, include three specific, actionable suggestions tied to the lesson's learning objective.

### Part — Domain 2 rating and evidence
Rate the teacher on each subdomain using the Danielson scale:
`Unsatisfactory | Basic | Proficient | Distinguished`

Required subdomains:
- **2a** Creating an Environment of Respect and Rapport
- **2b** Establishing a Culture for Learning
- **2d** Managing Student Behavior

Format for each subdomain:
```
2a Creating an Environment of Respect and Rapport: [Rating]
- [Quote or evidence from transcript]
- [Quote or evidence from transcript]
- [Quote or evidence from transcript]
[Two-sentence rationale for the rating]
```

Then list:
- Three strengths in Classroom Environment
- Two growth potentials to reach Distinguished

### Part D: Domain 3 rating and evidence
Rate and provide evidence for:
- **3a** Communicating with Students
- **3b** Questioning and Discussion Techniques
- **3c** Engaging Students in Learning
- **3d** Using Assessment in Instruction
- **3e** Demonstrating Flexibility and Responsiveness

Same format as Domain 2. Up to three transcript quotes per subdomain. Two-sentence rationale.

Then list:
- Three strengths in Instruction
- Two growth potentials to reach Distinguished

### Engagement Norms section
Assess evidence (or absence of evidence) for each of the five norms:
1. Active Participation for All Students (every 2-3 minutes, no passive listening)
2. Think-Pair-Share and Collaborative Discussions
3. Non-Volunteer Participation (popsicle sticks, randomizer, structured call)
4. Visual and Kinesthetic Engagement
5. Academic Language and Justification

For each norm: state what was observed, and if the norm was absent, name one specific enhancement tied to the lesson.

### Part E: Overall summary
List all strengths and growth areas, organized by domain. This is the consolidated final section that pulls from Domains 2, 3, and Engagement Norms.

---

## Step 5 — Save to Google Drive

Create a new Google Doc using `mcp__99dac68f__create_file`:
```
title: "[Teacher Last Name] Round [X] [25-26] Observation Write-up — Completed"
contentMimeType: "text/plain"
textContent: [full completed write-up]
```

Note the returned Google Doc URL.

---

## Step 6 — Email the result

Use `mcp__02066cd2__create_draft` to draft the email.

**From:** summitcurriculumlinstruction@gmail.com
**To:** [RECIPIENT_EMAIL collected in Step 0]
**Subject options** (always provide three):
- Urgent: `ACTION NEEDED: [Teacher] Round [X] Observation Write-Up — Review Before [Date]`
- Informational: `[Teacher] Round [X] Observation Write-Up — Completed`
- Newsletter style: `Your APPR Write-Up for [Teacher] Is Ready`

**Body:**

```
[Teacher full name] — Round [X] Observation Write-Up

The completed write-up is ready for your review:
[Google Doc link]

Summary of strengths:
- [Bullet 1 from Part E]
- [Bullet 2]
- [Bullet 3]
- [Bullet 4 if relevant]

Growth areas for post-observation conversation:
- [Bullet 1 from Part E]
- [Bullet 2]
- [Bullet 3 if relevant]

Round: [X] | Subject: [Subject] | Grade: [Grade] | Building: [Building]
Obs Date: [Date]
```

Save as a draft — do not send automatically.

---

## Notes

- Never fabricate quotes. If evidence is thin for a subdomain, rate Basic and state that insufficient evidence was observed.
- The Danielson framework descriptions (proficient/distinguished critical attributes and examples) are embedded in the template docs. Read the template before writing to calibrate.
- Ratings default to Proficient unless evidence clearly indicates otherwise. To reach Distinguished, students must initiate, self-monitor, or extend learning independently.
- For pre-observation sections (Rounds 1 and 3), use the conference notes to answer the pre-obs questions. Do not leave blanks.
- The email draft always goes to RECIPIENT_EMAIL collected in Step 0. Never default to a hardcoded address.
- Email is always sent FROM summitcurriculumlinstruction@gmail.com.
