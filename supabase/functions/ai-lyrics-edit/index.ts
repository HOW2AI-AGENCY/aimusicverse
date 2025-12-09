import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  rewrite: `Ты профессиональный автор текстов песен. Полностью перепиши текст секции песни, 
сохраняя общую тему но с новыми образами, рифмами и метафорами.
Отвечай ТОЛЬКО текстом новой лирики, без комментариев и пояснений.
Сохраняй примерную длину оригинала.`,

  improve: `Ты профессиональный редактор текстов песен. Улучши текст секции:
- Сохрани основной смысл и тему
- Улучши рифмы и ритм  
- Сделай образы более яркими
- Исправь грамматические ошибки
Отвечай ТОЛЬКО улучшенным текстом, без комментариев.`,

  translate: `Ты профессиональный переводчик текстов песен. 
Переведи текст на английский язык, сохраняя:
- Поэтический стиль и рифмы где возможно
- Смысл и эмоциональный посыл
- Ритмическую структуру
Отвечай ТОЛЬКО переводом, без комментариев и оригинала.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, mode, context } = await req.json();

    if (!lyrics || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing lyrics or mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[mode];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Invalid mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = context 
      ? `Секция: ${context}\n\nТекст:\n${lyrics}`
      : lyrics;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const editedLyrics = data.choices?.[0]?.message?.content?.trim();

    if (!editedLyrics) {
      throw new Error("No content in AI response");
    }

    return new Response(
      JSON.stringify({ lyrics: editedLyrics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-lyrics-edit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
