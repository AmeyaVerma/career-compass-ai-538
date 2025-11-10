import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, resumeId } = await req.json();
    
    if (!resumeText || !resumeId) {
      throw new Error("Resume text and resumeId are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client with user's auth token
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Analyzing resume for user:", user.id);

    // Call Lovable AI to extract skills
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are an expert career advisor and resume analyzer. Extract technical skills, soft skills, and professional competencies from resumes. Categorize skills and assess proficiency levels based on context (years of experience, job titles, projects). Return structured JSON.",
            },
            {
              role: "user",
              content: `Analyze this resume and extract all skills. Categorize them as: Technical, Soft Skills, Tools, Languages, Certifications. For each skill, estimate proficiency (Beginner, Intermediate, Advanced, Expert) based on context.\n\nResume:\n${resumeText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_skills",
                description: "Extract and categorize skills from a resume",
                parameters: {
                  type: "object",
                  properties: {
                    skills: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          skill_name: { type: "string" },
                          category: {
                            type: "string",
                            enum: [
                              "Technical",
                              "Soft Skills",
                              "Tools",
                              "Languages",
                              "Certifications",
                            ],
                          },
                          proficiency_level: {
                            type: "string",
                            enum: [
                              "Beginner",
                              "Intermediate",
                              "Advanced",
                              "Expert",
                            ],
                          },
                        },
                        required: [
                          "skill_name",
                          "category",
                          "proficiency_level",
                        ],
                      },
                    },
                  },
                  required: ["skills"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_skills" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Parse the extracted skills
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No skills extracted from resume");
    }

    const extractedSkills = JSON.parse(toolCall.function.arguments);

    // Insert skills into database
    const skillsToInsert = extractedSkills.skills.map((skill: any) => ({
      user_id: user.id,
      resume_id: resumeId,
      skill_name: skill.skill_name,
      category: skill.category,
      proficiency_level: skill.proficiency_level,
    }));

    const { error: insertError } = await supabaseClient
      .from("skills")
      .insert(skillsToInsert);

    if (insertError) {
      console.error("Error inserting skills:", insertError);
      throw insertError;
    }

    // Update resume analyzed status
    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({ analyzed: true })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Error updating resume:", updateError);
    }

    console.log(`Extracted ${skillsToInsert.length} skills successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        skills: extractedSkills.skills,
        count: skillsToInsert.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
