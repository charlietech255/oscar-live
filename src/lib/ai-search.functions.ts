import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AiSearchResult = { ids: string[]; message: string; error?: string };

export const aiFindChannels = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    const query = String(input?.query ?? "").trim().slice(0, 300);
    if (query.length < 2) throw new Error("Andika unachotafuta");
    return { query };
  })
  .handler(async ({ data }): Promise<AiSearchResult> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: channels } = await sb.from("channels").select("id, name, category, description, is_live").limit(500);
    if (!channels?.length) return { ids: [], message: "Hakuna chaneli kwa sasa." };

    const list = channels.map((c) => `${c.id} | ${c.name} | ${c.category} | ${c.is_live ? "LIVE" : ""} | ${c.description ?? ""}`).join("\n");
    try {
      const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
      try {
        const res = await generateResponse({
          model: "openai/gpt-6-astra",
          instructions:
            "Wewe ni msaidizi wa Kasigara TV. Kutoka kwenye orodha ya chaneli, chagua zile zinazolingana na ombi la mtazamaji (mechi, timu, ligi, aina ya kipindi). Tumia id kamili tu kutoka kwenye orodha. Jibu kwa JSON: {\"ids\": [...], \"message\": \"sentensi fupi kwa Kiswahili\"}. Kama hakuna inayolingana, ids iwe tupu na eleza kwa ufupi.",
          input: [{ role: "user", content: `Chaneli:\n${list}\n\nOmbi: ${data.query}\n\nReturn JSON.` }],
          text: { format: { type: "json_object" } },
        });
        const text = extractText(res);
        const parsed = JSON.parse(text || "{}") as { ids?: unknown; message?: unknown };
        const valid = new Set(channels.map((c) => c.id));
        const ids = Array.isArray(parsed.ids) ? parsed.ids.filter((i): i is string => typeof i === "string" && valid.has(i)) : [];
        return { ids, message: typeof parsed.message === "string" ? parsed.message : "" };
      } catch (e) {
        console.error("AI search failed", e);
        const busy = e instanceof GatewayError && (e.code as string)?.includes?.("rate");
        return { ids: [], message: "", error: busy ? "Huduma ina watu wengi, jaribu tena baadaye." : "Imeshindikana kutafuta kwa AI kwa sasa." };
      }
    } catch (e) {
      console.error(e);
      return { ids: [], message: "", error: "Imeshindikana kutafuta kwa AI kwa sasa." };
    }
  });

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
  if (typeof r.output_text === "string") return r.output_text;
  return (r.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
}
