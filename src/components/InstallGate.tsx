import { Link, useLocation } from "@tanstack/react-router";
import { Download, ArrowRight, Smartphone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useInstall } from "./InstallProvider";
import { canViewServices } from "@/lib/install-access";
import stadium from "@/assets/install-stadium.jpg";

export function InstallGate({ children }: { children: ReactNode }) {
  const { ready, standalone } = useInstall();
  const location = useLocation();
  if (ready && canViewServices(standalone)) return children;
  if (location.pathname === "/sakinisha") return children;
  return <InstallIntroduction />;
}

function InstallIntroduction() {
  const { available, installed, busy, install } = useInstall();
  const [message, setMessage] = useState("");
  async function startInstall() {
    const outcome = await install();
    setMessage(outcome === "accepted"
      ? "Subiri usakinishaji ukamilike, kisha fungua Kasigara TV kupitia ikoni ya simu yako."
      : "Fungua ukurasa wa Sakinisha app kwa hatua za kuweka app kwenye simu yako.");
  }
  return (
    <main>
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-background sm:min-h-[620px]">
        <img src={stadium} alt="Wachezaji wa mpira uwanjani" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] sm:object-center" />
        <div className="absolute inset-0 -z-10 bg-background/50" />
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-24 sm:pb-16">
          <div className="mb-8 flex items-center gap-3">
            <img src="/icon-192.png" alt="" width={48} height={48} className="rounded-lg" />
            <span className="font-display text-2xl">KASIGARA <span className="text-primary">TV</span></span>
          </div>
          <p className="mb-3 text-sm font-semibold uppercase text-accent">Mpira · TV · Burudani</p>
          <h1 className="max-w-xl font-display text-6xl sm:text-8xl">KASIGARA TV</h1>
          <p className="mt-4 max-w-md text-lg text-foreground">Mechi na burudani kwenye simu yako. Sakinisha app kwanza, kisha fungua kupitia ikoni yake kuona chaneli na kuingia kwenye akaunti.</p>
          <div className="mt-7 flex flex-col items-start gap-3">
            {installed ? <p role="status" className="font-semibold text-primary">App imesakinishwa. Ifungue kupitia ikoni kwenye simu yako.</p>
              : available ? <Button size="lg" disabled={busy} onClick={startInstall}><Download className="mr-2 h-5 w-5" /> {busy ? "Inasakinisha…" : "Sakinisha app"}</Button>
              : <Button size="lg" asChild><Link to="/sakinisha"><Download className="mr-2 h-5 w-5" /> Sakinisha app</Link></Button>}
            <Button asChild variant="link" className="h-auto px-0 text-foreground"><Link to="/sakinisha">Hatua za Android na iPhone <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            {message && <p role="status" className="max-w-md text-sm text-primary">{message}</p>}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-8">
        <Smartphone className="h-8 w-8 shrink-0 text-primary" />
        <div><h2 className="font-display text-2xl">APP KWENYE SIMU YAKO</h2><p className="text-sm text-muted-foreground">Android au iPhone. Hakuna APK inayohitajika; kutazama kunahitaji intaneti.</p></div>
      </section>
    </main>
  );
}