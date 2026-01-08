import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user's token and get their ID
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete user data from all tables (in order to respect foreign keys)
    // Note: RLS is bypassed with service role, so we need to filter by user_id
    
    const deletionPromises = [
      supabaseAdmin.from("exercise_sessions")
        .delete()
        .in("workout_session_id", 
          supabaseAdmin
            .from("workout_sessions")
            .select("id")
            .eq("user_id", userId)
        ),
      supabaseAdmin.from("workout_sessions").delete().eq("user_id", userId),
      supabaseAdmin.from("meal_logs").delete().eq("user_id", userId),
      supabaseAdmin.from("progress_photos").delete().eq("user_id", userId),
      supabaseAdmin.from("body_measurements").delete().eq("user_id", userId),
      supabaseAdmin.from("user_achievements").delete().eq("user_id", userId),
      supabaseAdmin.from("user_challenges").delete().eq("user_id", userId),
      supabaseAdmin.from("user_goals").delete().eq("user_id", userId),
      supabaseAdmin.from("user_terms_acceptance").delete().eq("user_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("api_rate_limits").delete().eq("user_id", userId),
      supabaseAdmin.from("personal_students").delete().eq("student_id", userId),
      supabaseAdmin.from("personal_students").delete().eq("personal_id", userId),
      supabaseAdmin.from("pending_personal_signups").delete().eq("user_id", userId),
    ];

    await Promise.all(deletionPromises);

    // Delete workout plans and exercises (need to handle separately due to FK)
    const { data: workoutPlans } = await supabaseAdmin
      .from("workout_plans")
      .select("id")
      .eq("user_id", userId);

    if (workoutPlans && workoutPlans.length > 0) {
      const planIds = workoutPlans.map((p) => p.id);
      
      // Delete exercises first
      await supabaseAdmin.from("exercises").delete().in("workout_plan_id", planIds);
      
      // Delete workout schedule
      await supabaseAdmin.from("workout_schedule").delete().in("workout_plan_id", planIds);
      
      // Delete workout shares and invites
      const { data: shares } = await supabaseAdmin
        .from("workout_shares")
        .select("id")
        .in("workout_plan_id", planIds);
      
      if (shares && shares.length > 0) {
        await supabaseAdmin
          .from("workout_share_invites")
          .delete()
          .in("share_id", shares.map((s) => s.id));
        await supabaseAdmin
          .from("workout_shares")
          .delete()
          .in("workout_plan_id", planIds);
      }
      
      // Delete workout plan revisions
      await supabaseAdmin.from("workout_plan_revisions").delete().in("workout_plan_id", planIds);
      
      // Delete workout plans
      await supabaseAdmin.from("workout_plans").delete().eq("user_id", userId);
    }

    // Delete nutrition plans and related data
    const { data: nutritionPlans } = await supabaseAdmin
      .from("nutrition_plans")
      .select("id")
      .eq("user_id", userId);

    if (nutritionPlans && nutritionPlans.length > 0) {
      const planIds = nutritionPlans.map((p) => p.id);
      await supabaseAdmin.from("meals").delete().in("nutrition_plan_id", planIds);
      await supabaseAdmin.from("nutrition_plan_revisions").delete().in("nutrition_plan_id", planIds);
      await supabaseAdmin.from("nutrition_plans").delete().eq("user_id", userId);
    }

    // Delete profile last (after all user data)
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete authentication account",
          details: deleteError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
