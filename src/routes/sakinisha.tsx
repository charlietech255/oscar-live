import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Apple, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sakinisha")({
  head: () => ({
    meta: [
      { title: "Sakinisha App — Kasigara TV" },
      { name: "description", content: "Jinsi ya kuweka Kasigara TV kwenye simu yako ya Android au iPhone." },
      { property: "og:title", content: "Sakinisha Kasigara TV kwenye simu" },
      { property: "og:description", content: "Maelekezo ya kuweka app kwenye Android na iPhone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Install,
});

type PromptEvent = Event & { prompt: () => Promise<void> };

function Install() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <img src="/icon-192.png" alt="Kasigara TV" width={72} height={72} className="rounded-2xl" />
        <div>
          <h1 className="font-display text-5xl tracking-wide">Sakinisha App</h1>
          <p className="text-muted-foreground">Weka Kasigara TV kwenye skrini ya simu yako — hufunguka kama app ya kawaida.</p>
        </div>
      </div>
      {prompt && (
        <Button className="mt-6" size="lg" onClick={() => prompt.prompt()}>
          <Download className="mr-2 h-5 w-5" /> Sakinisha sasa
        </Button>
      )}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-display text-3xl"><Smartphone className="h-6 w-6 text-primary" /> Android</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <Step n={1}>Fungua tovuti hii kwa kivinjari cha <b>Chrome</b>.</Step>
            <Step n={2}>Gusa vitone vitatu <b>⋮</b> juu kulia.</Step>
            <Step n={3}>Chagua <b>Install app</b> au <b>Add to Home screen</b>.</Step>
            <Step n={4}>Gusa <b>Install</b> — ikoni itaonekana kwenye skrini yako.</Step>
          </ol>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-display text-3xl"><Apple className="h-6 w-6 text-primary" /> iPhone</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <Step n={1}>Fungua tovuti hii kwa <b>Safari</b>.</Step>
            <Step n={2}>Gusa kitufe cha <b>Share</b> (kisanduku chenye mshale juu) chini.</Step>
            <Step n={3}>Shuka chini uchague <b>Add to Home Screen</b>.</Step>
            <Step n={4}>Gusa <b>Add</b> juu kulia — tayari!</Step>
          </ol>
        </section>
      </div>
    </main>
  );
}
