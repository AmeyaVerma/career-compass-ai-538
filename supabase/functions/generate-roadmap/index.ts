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
    const { skills, targetRole, currentLevel } = await req.json();

    if (!skills || !targetRole) {
      throw new Error("Skills and target role are required");
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

    console.log("Generating roadmap for user:", user.id);

    // Format skills for AI
    const skillsList = skills
      .map((s: any) => `${s.skill_name} (${s.proficiency_level})`)
      .join(", ");

    // Call Lovable AI to generate roadmap
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
                "You are an expert career coach specializing in creating personalized learning roadmaps. Create detailed, actionable learning paths with specific steps, resources, and time estimates. Each step should be concrete and achievable.",
            },
            {
              role: "user",
              content: `Create a detailed learning roadmap for someone who wants to become a ${targetRole}. Current experience level: ${currentLevel || "Entry"}. Current skills: ${skillsList}. 
              
              Generate a comprehensive roadmap with 8-12 sequential steps. Each step should build on previous steps and include:
              - Clear learning objectives
              - Estimated time to complete (in hours)
              - Recommended courses and resources from Coursera and Udemy
              - Additional resources like documentation, tutorials, and practical projects
              
              IMPORTANT: For resources, prioritize actual Coursera and Udemy courses. Use real course names and provide proper URLs in the format:
              - Coursera: https://www.coursera.org/learn/[course-slug]
              - Udemy: https://www.udemy.com/course/[course-slug]
              
              Include a mix of resource types: courses (Coursera/Udemy), documentation, tutorials, videos, and hands-on projects.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_roadmap",
                description:
                  "Create a structured learning roadmap with sequential steps",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    duration_weeks: { type: "number" },
                    steps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          step_number: { type: "number" },
                          title: { type: "string" },
                          description: { type: "string" },
                          estimated_hours: { type: "number" },
                          resources: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                url: { type: "string" },
                                type: {
                                  type: "string",
                                  enum: [
                                    "course",
                                    "documentation",
                                    "tutorial",
                                    "book",
                                    "video",
                                    "project",
                                  ],
                                },
                              },
                            },
                          },
                        },
                        required: [
                          "step_number",
                          "title",
                          "description",
                          "estimated_hours",
                          "resources",
                        ],
                      },
                    },
                  },
                  required: ["title", "description", "duration_weeks", "steps"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "create_roadmap" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI roadmap generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI roadmap generated");

    // Parse the generated roadmap
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("Failed to generate roadmap");
    }

    const roadmapData = JSON.parse(toolCall.function.arguments);

    // Insert roadmap into database
    const { data: roadmap, error: roadmapError } = await supabaseClient
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: roadmapData.title,
        description: roadmapData.description,
        target_role: targetRole,
        duration_weeks: roadmapData.duration_weeks,
      })
      .select()
      .single();

    if (roadmapError) {
      console.error("Error inserting roadmap:", roadmapError);
      throw roadmapError;
    }

    // Insert roadmap steps
    const stepsToInsert = roadmapData.steps.map((step: any) => ({
      roadmap_id: roadmap.id,
      step_number: step.step_number,
      title: step.title,
      description: step.description,
      estimated_hours: step.estimated_hours,
      resources: step.resources,
    }));

    const { error: stepsError } = await supabaseClient
      .from("roadmap_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error inserting roadmap steps:", stepsError);
      throw stepsError;
    }

    console.log(
      `Created roadmap with ${stepsToInsert.length} steps successfully`
    );

    return new Response(
      JSON.stringify({
        success: true,
        roadmap: {
          ...roadmap,
          steps: roadmapData.steps,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
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
