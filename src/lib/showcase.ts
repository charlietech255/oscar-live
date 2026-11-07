import barcelona from "@/assets/barcelona.jpg.asset.json";
import atletico from "@/assets/atletico.jpg.asset.json";
import osman from "@/assets/osman.jpg.asset.json";
import derby from "@/assets/install-stadium.jpg";
import inside from "@/assets/app-inside-preview.jpg";
export type ShowcaseSlide = { image: string; title: string };
export const defaultSlides: ShowcaseSlide[] = [{image:barcelona.url,title:"FC Barcelona"},{image:atletico.url,title:"Michezo ya kimataifa"},{image:osman.url,title:"Kuruluş Osman"},{image:derby,title:"Simba na Yanga"},{image:inside,title:"Chaneli za Kasigara TV"}];
export function readSlides(value: unknown): ShowcaseSlide[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(v => v && typeof v === "object" && "image" in v && typeof v.image === "string" && "title" in v && typeof v.title === "string" ? [{image:v.image,title:v.title}] : []);
}