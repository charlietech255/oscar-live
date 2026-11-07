import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appearanceOptions } from "@/lib/site-appearance";
import { DEFAULT_GROUP_URL } from "@/lib/customer-controls";
import { Button } from "@/components/ui/button";
export function CommunityButton({ floating = true }: { floating?: boolean }) {
  const { data } = useQuery(appearanceOptions);
  const url = data?.group_url || DEFAULT_GROUP_URL;
  if (!/^https:\/\/chat\.whatsapp\.com\//.test(url)) return null;
  return <Button asChild size="icon" className={`h-12 w-12 rounded-full ${floating?"fixed bottom-24 right-4 z-30":""}`}><a href={url} target="_blank" rel="noopener noreferrer" aria-label="Jiunge group la wateja" title="Group la wateja"><MessageCircle className="h-6 w-6"/></a></Button>;
}
export function OutsideLikes() {
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
  }}><Heart className={liked?"h-4 w-4 fill-current text-destructive":"h-4 w-4"}/> Like · {count.toLocaleString()}</Button>;
}