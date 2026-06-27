import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { isSunoSuccessCode } from "../_shared/suno.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("suno-credits");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get("SUNO_API_KEY");

    if (!sunoApiKey) {
      throw new Error("SUNO_API_KEY not configured");
    }

    logger.info("Fetching SunoAPI credits");

    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate/credit", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sunoApiKey}`,
      },
    });

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text();
      logger.error("SunoAPI error:", sunoResponse.status, errorText);
      throw new Error(`SunoAPI error: ${sunoResponse.status} - ${errorText}`);
    }

    const sunoData = await sunoResponse.json();

    if (!isSunoSuccessCode(sunoData.code)) {
      throw new Error(sunoData.msg || `Failed to fetch credits (code ${sunoData.code ?? "unknown"})`);
    }

    const credits = sunoData.data;
    logger.info("SunoAPI credits:", credits);

    return new Response(
      JSON.stringify({
        success: true,
        credits,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    logger.error("Error in suno-credits:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
