// Image generation providers: Lovable AI (primary) + Replicate FLUX (fallback).
// Behavior preserved from index.ts.

export interface GeneratedImage {
  binaryData: Uint8Array;
  provider: "lovable" | "replicate";
  model: string;
  promptUsed: string;
}

/** Attempts Lovable AI first; on 402/429 falls back to Replicate FLUX. */
export async function generateCoverImage(
  imagePrompt: string,
  simpleFallbackPrompt: string,
): Promise<GeneratedImage> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

  console.log("🖼️ Generating cover with Lovable AI...");
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Lovable AI error:", response.status, errorText);
      if (response.status === 402 || response.status === 429) {
        throw new Error(`Lovable AI unavailable: ${response.status}`);
      }
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    const imageData: string | undefined = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("❌ No image in Lovable response:", JSON.stringify(result).substring(0, 500));
      throw new Error("No image generated from Lovable AI");
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    return {
      binaryData,
      provider: "lovable",
      model: "google/gemini-3-pro-image-preview",
      promptUsed: imagePrompt,
    };
  } catch (lovableError: any) {
    console.warn("⚠️ Lovable AI failed, trying Replicate fallback...", lovableError.message);

    const replicateApiKey = Deno.env.get("REPLICATE_API_KEY");
    if (!replicateApiKey) {
      throw new Error("Both Lovable AI and Replicate are unavailable");
    }

    console.log("🎨 Generating with Replicate FLUX...");

    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateApiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-schnell",
        input: {
          prompt: simpleFallbackPrompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90,
          num_inference_steps: 4,
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error("❌ Replicate error:", replicateResponse.status, errorText);
      throw new Error(`Replicate generation failed: ${replicateResponse.status}`);
    }

    let prediction = await replicateResponse.json();
    let attempts = 0;
    const maxAttempts = 30;

    while (prediction.status === "starting" || prediction.status === "processing") {
      if (attempts >= maxAttempts) {
        throw new Error("Replicate generation timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${replicateApiKey}` },
      });
      prediction = await statusResponse.json();
      attempts++;
    }

    if (prediction.status === "failed") {
      console.error("❌ Replicate prediction failed:", prediction.error);
      throw new Error(`Replicate failed: ${prediction.error}`);
    }

    const replicateImageUrl: string | undefined = prediction.output?.[0];
    if (!replicateImageUrl) {
      throw new Error("No image from Replicate");
    }

    console.log("✅ Replicate generated image, downloading...");
    const imageResponse = await fetch(replicateImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    return {
      binaryData: new Uint8Array(imageBuffer),
      provider: "replicate",
      model: "replicate/flux-schnell",
      promptUsed: simpleFallbackPrompt,
    };
  }
}
