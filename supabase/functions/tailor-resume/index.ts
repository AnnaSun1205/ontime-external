import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { resumeId, roleTitle, companyName, location, skills } =
      await req.json();
    if (!resumeId || !roleTitle || !companyName)
      throw new Error("Missing required fields");

    // Fetch resume metadata
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("file_name, file_path, category")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) throw new Error("Resume not found");

    // Download the resume file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(resume.file_path);

    if (downloadError || !fileData) throw new Error("Failed to download resume");

    // Extract text from the file (simplified - works for .txt, best-effort for PDFs)
    let resumeText = "";
    const fileName = resume.file_name.toLowerCase();
    
    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      resumeText = await fileData.text();
    } else {
      // For PDF/DOCX, we'll extract what we can and send to AI
      // The AI can work with partial text extraction
      try {
        resumeText = await fileData.text();
      } catch {
        resumeText = "[Binary resume file - unable to extract full text]";
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const skillsList = skills
      ? `Required skills: ${skills.technical_skills?.join(", ")}, ${skills.soft_skills?.join(", ")}`
      : "";

    const prompt = `You are an expert career coach and resume reviewer. A student is applying for a specific role and wants to tailor their resume.

**Target Role:** ${roleTitle} at ${companyName}
**Location:** ${location || "Not specified"}
${skillsList}

**Current Resume:**
${resumeText.substring(0, 4000)}

Analyze the resume against this specific role and provide tailored suggestions. Return a JSON object with this exact structure:
{
  "overall_match": number (0-100, how well the resume matches),
  "summary": "One sentence summary of the main gap",
  "suggestions": [
    {
      "section": "Which resume section to change (e.g., 'Experience', 'Skills', 'Projects', 'Summary')",
      "current": "What's currently there (quote or summarize)",
      "suggested": "What it should say instead (rewritten text)",
      "reason": "Why this change helps for this specific role"
    }
  ]
}

Provide 3-5 specific, actionable suggestions. Each suggestion should have concrete rewritten text, not vague advice. Focus on:
1. Skills alignment with the role
2. Experience bullet points that could be reframed
3. Missing keywords or technologies
4. Project descriptions that could be strengthened`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a career coach. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "provide_resume_suggestions",
                description: "Return structured resume tailoring suggestions",
                parameters: {
                  type: "object",
                  properties: {
                    overall_match: { type: "number", description: "Match score 0-100" },
                    summary: { type: "string", description: "One sentence gap summary" },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          section: { type: "string" },
                          current: { type: "string" },
                          suggested: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: ["section", "current", "suggested", "reason"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["overall_match", "summary", "suggestions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "provide_resume_suggestions" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI service error");
    }

    const aiData = await aiResponse.json();

    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content || "";
      result = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tailor-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
