// Netlify Serverless Function — Observation Write-Up Submission
// Receives the teacher form data, calls the Claude API, and triggers the write-up workflow.
//
// Required environment variables (set in Netlify → Site → Environment Variables):
//   ANTHROPIC_API_KEY   — your Claude API key from console.anthropic.com

const Anthropic = require("@anthropic-ai/sdk");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse multipart form data
  let fields = {};
  let fileContent = "";
  let fileName = "";

  try {
    // Netlify passes form fields as JSON when using netlify forms + functions together
    // For direct fetch submissions, parse the body
    const contentType = event.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      fields = JSON.parse(event.body);
    } else {
      // Parse URL-encoded or multipart — use busboy for multipart in production
      // For simplicity here we parse URL-encoded fields
      const params = new URLSearchParams(event.body);
      for (const [key, value] of params.entries()) {
        fields[key] = value;
      }
    }
  } catch (err) {
    return { statusCode: 400, body: "Could not parse form data." };
  }

  const {
    teacher_name,
    building,
    subject,
    grade,
    round,
    obs_date,
    gdoc_link,
    recipient_email,
  } = fields;

  // Validate required fields
  if (!teacher_name || !recipient_email || !round) {
    return { statusCode: 400, body: "Missing required fields." };
  }

  // Build the prompt for Claude
  const prompt = `You are completing a Danielson APPR observation write-up for a Peekskill City School District teacher.

TEACHER METADATA:
- Teacher: ${teacher_name}
- Building: ${building || "Not specified"}
- Subject: ${subject || "Not specified"}
- Grade: ${grade || "Not specified"}
- Observation Round: ${round}
- Observation Date: ${obs_date || "Not specified"}
- Recipient Email: ${recipient_email}
${gdoc_link ? `- Google Doc with observation notes: ${gdoc_link}` : ""}

${fileContent ? `OBSERVATION NOTES:\n${fileContent}` : "Please read the observation notes from the Google Doc link provided above."}

Complete the full Danielson APPR write-up following the appr-observation-writeup skill instructions:
1. Organize the transcript as a clean narrative (Part A)
2. Rate and provide evidence for Domain 2 (2b, 2d)
3. Rate and provide evidence for Domain 3 (3a, 3b, 3c, 3d)
4. Assess all 5 Engagement Norms
5. Write the overall Summary of Strengths and Growth Potential
6. Save the completed write-up as a new Google Doc titled "${teacher_name.split(" ").pop()} Round ${round} 25-26 Observation Write-up — Completed"
7. Draft the email from summitcurriculumlinstruction@gmail.com to ${recipient_email} with the Google Doc link and summary.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    console.log("Claude response received for:", teacher_name);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        teacher: teacher_name,
        recipient: recipient_email,
      }),
    };
  } catch (err) {
    console.error("Claude API error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process observation." }),
    };
  }
};
