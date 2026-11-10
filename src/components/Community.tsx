import { useAppSettings } from "@/components/AppSettingsProvider";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appearanceOptions } from "@/lib/site-appearance";
import { DEFAULT_GROUP_URL } from "@/lib/customer-controls";
import { Button } from "@/components/ui/button";
export function CommunityButton() {
  const { t } = useAppSettings();
  const { data } = useQuery(appearanceOptions);
  const url = data?.group_url || DEFAULT_GROUP_URL;
  if (!/^https:\/\/chat\.whatsapp\.com\//.test(url)) return null;
  return <Button asChild size="icon" className="h-12 w-12 shrink-0 rounded-full"><a href={url} target="_blank" rel="noopener noreferrer" aria-label={t("Group la wateja")} title={t("Group la wateja")}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.87 11.87 0 0 0 12.04 0C5.46 0 .1 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.24-1.64a11.94 11.94 0 0 0 5.8 1.48h.01c6.58 0 11.94-5.35 11.95-11.93a11.85 11.85 0 0 0-3.48-8.43ZM12.05 21.82a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.87 9.87 0 0 1-1.52-5.28c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.44 9.89-9.91 9.89Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.78-1.48-1.75-1.65-2.05-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.11.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg></a></Button>;
}
export function OutsideLikes() {
  const { t } = useAppSettings();
  const [id,setId] = useState<string>();
  const [liked,setLiked] = useState(false);
  const [count,setCount] = useState(0);
  const [busy,setBusy] = useState(false);
  useEffect(()=>{
    const old=localStorage.getItem("outside-visitor");
    const visitor=old && /^[0-9a-f-]{36}$/i.test(old)?old:crypto.randomUUID();
    localStorage.setItem("outside-visitor",visitor); setId(visitor); setLiked(localStorage.getItem("outside-liked")==="true");
    void supabase.rpc("outside_likes",{}).then(({data})=>setCount(Number(data??0)));
  },[]);
  return <Button variant="outline" aria-pressed={liked} disabled={busy||!id} onClick={async()=>{
    if (!id) return; setBusy(true);
    const {data,error}=await supabase.rpc("outside_likes",{_visitor:id,_like:!liked});
    if(!error){setCount(Number(data));setLiked(!liked);localStorage.setItem("outside-liked",String(!liked));} setBusy(false);
  }}><Heart className={liked?"h-4 w-4 fill-current text-destructive":"h-4 w-4"}/>{" " + t("Like ·") + " "}{count.toLocaleString()}</Button>;
}