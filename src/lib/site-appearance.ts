import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const defaultAppearance = {
  id: "main", title: "KASIGARA TV", tagline: "Mpira · TV · Burudani",
  description: "Mechi na burudani kwenye simu yako. Jisajili, chagua chaneli na uguse picha yake kuanza kutazama. Unaweza pia kusakinisha app kwenye simu.",
  button_label: "Sakinisha app", image_url: null as string | null, logo_url: null as string | null, theme: "green",
};
export type Appearance = typeof defaultAppearance;
export const appearanceOptions = queryOptions({
  queryKey: ["siteAppearance"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_appearance").select("*").eq("id", "main").maybeSingle();
    if (error) throw error;
    return data ?? defaultAppearance;
  },
});
export function validateAppearance(form: Appearance): string | null {
  if (form.title.trim().length < 2 || form.title.trim().length > 50) return "Jina liwe na herufi 2 hadi 50.";
  if (!form.tagline.trim() || form.tagline.trim().length > 100) return "Kionjo kifupi kiwe na herufi 1 hadi 100.";
  if (!form.description.trim() || form.description.trim().length > 500) return "Maelezo yawe na herufi 1 hadi 500.";
  if (form.button_label.trim().length < 2 || form.button_label.trim().length > 40) return "Jina la kitufe liwe na herufi 2 hadi 40.";
  if (!["green", "red", "cyan"].includes(form.theme)) return "Chagua rangi iliyopo.";
  return null;
}