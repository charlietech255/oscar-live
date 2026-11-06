import { Link, useLocation } from "@tanstack/react-router";
import { Download, ArrowRight, Smartphone, UserPlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useInstall } from "./InstallProvider";
import { canViewServices } from "@/lib/install-access";
import stadium from "@/assets/install-stadium.jpg";
import insidePreview from "@/assets/app-inside-preview.jpg";
import mobileData from "@/assets/mobile-data.jpg";
import { dataBundles } from "@/lib/data-bundles";
import { useQuery } from "@tanstack/react-query";
import { appearanceOptions, defaultAppearance } from "@/lib/site-appearance";
import { useAuth } from "@/hooks/useAuth";

export function InstallGate({ children }: { children: ReactNode }) {
  const { ready, standalone } = useInstall();
  const location = useLocation();
  const { isAdmin } = useAuth();
  if (isAdmin && location.pathname === "/admin") return children;
  if (ready && canViewServices(standalone)) return children;
  if (location.pathname === "/sakinisha" || location.pathname === "/auth") return children;
  return <InstallIntroduction />;
}

function InstallIntroduction() {
  const { available, installed, busy, install } = useInstall();
  const [message, setMessage] = useState("");
  const { data: appearance = defaultAppearance } = useQuery(appearanceOptions);
  async function startInstall() {
    const outcome = await install();
    setMessage(outcome === "accepted"
      ? "Subiri usakinishaji ukamilike, kisha fungua Kasigara TV kupitia ikoni ya simu yako."
      : "Fungua ukurasa wa Sakinisha app kwa hatua za kuweka app kwenye simu yako.");
  }
  return (
    <main className={`install-theme-${appearance.theme}`}>
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-background sm:min-h-[620px]">
        <img src={appearance.image_url || stadium} alt="Picha ya Kasigara TV" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] sm:object-center" />
        <div className="absolute inset-0 -z-10 bg-background/50" />
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-24 sm:pb-16">
          <div className="mb-8 flex items-center gap-3">
            <img src={appearance.logo_url || "/icon-192.png"} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg object-contain" />
            <span className="min-w-0 break-words font-display text-2xl">{appearance.title}</span>
          </div>
          <p className="mb-3 break-words text-sm font-semibold uppercase text-accent">{appearance.tagline}</p>
          <h1 className="max-w-xl break-words font-display text-5xl sm:text-7xl">{appearance.title}</h1>
          <p className="mt-4 max-w-md break-words text-lg text-foreground">{appearance.description}</p>
          <div className="mt-7 flex flex-col items-start gap-3">
            {installed ? <p role="status" className="font-semibold text-primary">App imesakinishwa. Ifungue kupitia ikoni kwenye simu yako.</p>
              : available ? <Button className="h-auto min-h-11 max-w-full whitespace-normal py-3" size="lg" disabled={busy} onClick={startInstall}><Download className="mr-2 h-5 w-5 shrink-0" /> {busy ? "Inasakinisha…" : appearance.button_label}</Button>
              : <Button className="h-auto min-h-11 max-w-full whitespace-normal py-3" size="lg" asChild><Link to="/sakinisha"><Download className="mr-2 h-5 w-5 shrink-0" /> {appearance.button_label}</Link></Button>}
            <Button asChild variant="link" className="h-auto px-0 text-foreground"><Link to="/sakinisha">Hatua za Android na iPhone <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link to="/auth"><UserPlus className="mr-2 h-4 w-4" /> Jisajili / Ingia</Link></Button>
            {message && <p role="status" className="max-w-md text-sm text-primary">{message}</p>}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-8">
        <Smartphone className="h-8 w-8 shrink-0 text-primary" />
        <div><h2 className="font-display text-2xl">APP KWENYE SIMU YAKO</h2><p className="text-sm text-muted-foreground">Android au iPhone. Hakuna APK inayohitajika; kutazama kunahitaji intaneti.</p></div>
      </section>
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="relative isolate overflow-hidden rounded-lg bg-background px-6 py-8 sm:px-8">
            <img src={mobileData} alt="Simu na laini za intaneti" width={1200} height={800} loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
            <div className="absolute inset-0 -z-10 bg-background/60" />
            <p className="text-sm font-semibold uppercase text-accent">Vifurushi vya intaneti</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">TUNAUZA PIA GB</h2>
            <p className="mt-2 text-sm text-foreground">Chagua kiasi cha MB au GB unachohitaji.</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
            {dataBundles.map(bundle => <div key={bundle.label} className="border-b border-border py-5">
              <dt className="font-display text-3xl">{bundle.label}</dt>
              <dd className="mt-1 font-semibold text-primary">TSh {bundle.price.toLocaleString("en-US")}</dd>
            </div>)}
          </dl>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="font-display text-3xl">NDANI YA KASIGARA TV</h2>
        <figure className="mt-4 max-w-md">
          <img src={insidePreview} alt="Muonekano wa ndani wa Kasigara TV: utafutaji, makundi na picha za chaneli" width={395} height={310} loading="lazy" className="h-auto w-full rounded-lg border border-border" />
        </figure>
      </section>
    </main>
  );
}