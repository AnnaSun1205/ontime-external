import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { roleTitle, companyName, location } = await req.json();
    if (!roleTitle || !companyName) {
      return new Response(JSON.stringify({ error: "roleTitle and companyName are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a career advisor helping students prepare for job applications. Given a job title and company, return the key skills and qualifications typically required. Be specific to the company and role. Return JSON only.`,
          },
          {
            role: "user",
            content: `Job: "${roleTitle}" at "${companyName}"${location ? ` in ${location}` : ""}. Return a JSON object with these fields:
- "technical_skills": array of 4-6 specific technical skills (e.g. "Python", "System Design", "SQL")
- "soft_skills": array of 2-3 soft skills
- "tips": one short sentence of advice for this specific role
Keep it concise and actionable.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_skills",
              description: "Return the key skills for a job listing",
              parameters: {
                type: "object",
                properties: {
                  technical_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-6 specific technical skills",
                  },
                  soft_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 soft skills",
                  },
                  tips: {
                    type: "string",
                    description: "One short sentence of advice",
                  },
                },
                required: ["technical_skills", "soft_skills", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_skills" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No skills generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const skills = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(skills), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-job-skills error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
