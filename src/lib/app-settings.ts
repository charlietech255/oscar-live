import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const sectionDefaults = {
  headerName: false, insideShowcase: true, aiSearch: true, trialNotice: true,
  scoreboard: false, matchStats: false, liveBadges: false, cardBadges: false,
  channelDetails: true, comments: true, bottomNavigation: true, community: true,
  outsideLikes: true, phoneIntroduction: true, dataOffers: true, insidePreview: true,
  installInstructions: true,
};
export type SectionKey = keyof typeof sectionDefaults;
export type ContentBlock = { id: string; title: string; body: string; image: string; page: string; active: boolean };
export type AppSettings = {
  words: Record<string, string>;
  images: Record<string, string>;
  sections: Partial<Record<SectionKey, boolean>>;
  slides: { image: string; title: string }[] | null;
  blocks: ContentBlock[];
  dataOffers: { label: string; price: number }[] | null;
};
export const emptySettings: AppSettings = { words: {}, images: {}, sections: {}, slides: null, blocks: [], dataOffers: null };
export function readSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptySettings;
  const v = value as Record<string, unknown>;
  const strings = (x: unknown): Record<string, string> => x && typeof x === "object" && !Array.isArray(x)
    ? Object.fromEntries(Object.entries(x).filter(([, val]) => typeof val === "string")) : {};
  const sections: AppSettings["sections"] = {};
  if (v["sections"] && typeof v["sections"] === "object") for (const k of Object.keys(sectionDefaults) as SectionKey[]) {
    const val = (v["sections"] as Record<string, unknown>)[k]; if (typeof val === "boolean") sections[k] = val;
  }
  return { words: strings(v["words"]), images: strings(v["images"]), sections,
    slides: Array.isArray(v["slides"]) ? v["slides"].filter((x): x is {image:string;title:string} => !!x && typeof x.image === "string" && typeof x.title === "string") : null,
    blocks: Array.isArray(v["blocks"]) ? v["blocks"].filter((x): x is ContentBlock => !!x && typeof x.id === "string" && typeof x.title === "string" && typeof x.body === "string" && typeof x.image === "string" && ["/", "/outside", "/vifurushi", "/sakinisha", "/akaunti"].includes(x.page) && typeof x.active === "boolean") : [],
    dataOffers: Array.isArray(v["dataOffers"]) ? v["dataOffers"].filter((x): x is {label:string;price:number} => !!x && typeof x.label === "string" && typeof x.price === "number" && Number.isFinite(x.price) && x.price >= 0) : null,
  };
}
export function translateWord(settings: AppSettings, original: string) {
  return Object.hasOwn(settings.words, original) ? settings.words[original] ?? "" : original;
}
export function sectionVisible(settings: AppSettings, key: SectionKey) { return settings.sections[key] ?? sectionDefaults[key]; }
export function settingsProblem(settings: AppSettings): string | null {
  if (Object.values(settings.images).some(url => url !== "" && !/^https:\/\//i.test(url) && !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(url))) return "Picha iwe imepakiwa au iwe na linki ya HTTPS.";
  if (settings.slides?.some(x => !x.image || (!/^https:\/\//i.test(x.image) && !/^data:image\//.test(x.image) && !x.image.startsWith("/")))) return "Weka picha sahihi kwenye kila bango.";
  if (settings.dataOffers?.some(x => !x.label.trim() || !Number.isFinite(x.price) || x.price < 0)) return "Jaza jina na bei sahihi ya kila ofa ya GB.";
  if (JSON.stringify(settings).length > 8_000_000) return "Picha zimekuwa nyingi sana. Punguza baadhi kisha hifadhi.";
  return null;
}
export const appSettingsOptions = queryOptions({
  queryKey: ["appSettings"], refetchInterval: 30000,
  queryFn: async () => {
    const { data, error } = await supabase.from("app_settings").select("content").eq("id", "main").maybeSingle();
    if (error) throw error;
    return readSettings(data?.content);
  },
});