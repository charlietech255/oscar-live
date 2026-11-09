import { useAppSettings } from "@/components/AppSettingsProvider";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { appearanceOptions } from "@/lib/site-appearance";
import { defaultSlides, readSlides, type ShowcaseSlide } from "@/lib/showcase";
import { Button } from "@/components/ui/button";

export function RotatingPictures({ slides, background = false }: { slides: ShowcaseSlide[]; background?: boolean }) {
  const { t } = useAppSettings();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);
  const current = index % Math.max(1, slides.length);
  if (!slides.length) return null;
  return <div className={background ? "absolute inset-0 -z-20" : "relative mb-5 aspect-[16/7] overflow-hidden rounded-lg bg-card"}>
    {slides.map((s,i) => <img key={`${s.image}-${i}`} src={s.image} alt={s.title} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${i===current ? "opacity-100" : "opacity-0"}`} />)}
    {!background && <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/80 p-2"><p className="truncate text-xs font-semibold">{t(slides[current]?.title ?? "")}</p><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Picha iliyotangulia" onClick={()=>setIndex(i=>(i+slides.length-1)%slides.length)}><ChevronLeft className="h-4 w-4"/></Button><Button size="icon" variant="ghost" className="h-7 w-7" aria-label={paused?"Endelea picha":"Simamisha picha"} onClick={()=>setPaused(!paused)}>{paused?<Play className="h-3 w-3"/>:<Pause className="h-3 w-3"/>}</Button><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Picha inayofuata" onClick={()=>setIndex(i=>(i+1)%slides.length)}><ChevronRight className="h-4 w-4"/></Button></div></div>}
  </div>;
}
export function Showcase() {
  const { settings } = useAppSettings();
  const { data } = useQuery(appearanceOptions);
  const slides = readSlides(data?.slides);
  return <RotatingPictures slides={settings.slides ?? (slides.length?slides:defaultSlides)}/>;
}