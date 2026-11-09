import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Smartphone, Apple, Download, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstall } from "@/components/InstallProvider";

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

function Install() {
  const { t } = useAppSettings();
  const { available, installed, busy, install } = useInstall();
  const [message, setMessage] = useState("");
  const instructions = useRef<HTMLDivElement>(null);

  const handleInstall = async () => {
    if (!available) {
      setMessage("Android: fungua kwa Chrome, gusa ⋮ kisha Install app au Add to Home screen. iPhone: fungua kwa Safari, gusa Share kisha Add to Home Screen.");
      instructions.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const result = await install();
    setMessage(result === "accepted"
      ? "Umeshaitikia usakinishaji. Subiri simu ikamilishe, kisha angalia ikoni ya Kasigara TV kwenye skrini yako."
      : result === "dismissed" ? "Usakinishaji umeghairiwa. Unaweza kuweka app kupitia menyu ya kivinjari."
      : "Usakinishaji haukukamilika. Tumia hatua za Android au iPhone hapa chini.");
  };

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <img src="/icon-192.png" alt={t("Kasigara TV")} width={72} height={72} className="shrink-0 rounded-lg" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl">{t("Kasigara TV")}</h1>
          <p className="text-muted-foreground">{t("Weka app kwenye simu yako.")}</p>
        </div>
      </div>
      {installed ? (
        <p role="status" className="mt-6 flex items-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" />{" " + t("App tayari ipo kwenye simu yako.")}</p>
      ) : (
        <Button className="mt-6 w-full sm:w-auto" size="lg" disabled={busy} onClick={handleInstall}>
          <Download className="mr-2 h-5 w-5" /> {busy ? "Inasakinisha…" : t("Sakinisha kwenye simu (MB 18 tu)")}
        </Button>
      )}
      <p className="mt-3 text-sm text-muted-foreground">{t("Hakuna faili la APK linalohitajika. App itaonekana kama ikoni kwenye skrini ya simu; kutazama video kunahitaji intaneti.")}</p>
      {message && <p role="status" className="mt-4 text-sm text-primary">{message}</p>}
      <Button asChild variant="outline" className="mt-4 h-auto whitespace-normal text-left">
        <a href="https://oscar-live-sports.lovable.app/sakinisha" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4 shrink-0" />{" " + t("Fungua tovuti ya app kusakinisha")}</a>
      </Button>
      <div ref={instructions} className="mt-8 grid scroll-mt-6 gap-6 md:grid-cols-2">
        <section className="border-t border-border py-6">
          <h2 className="flex items-center gap-2 font-display text-xl"><Smartphone className="h-5 w-5 text-primary" />{" " + t("Android")}</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <Step n={1}>{t("Fungua tovuti hii kwa kivinjari cha") + " "}<b>{t("Chrome")}</b>.</Step>
            <Step n={2}>{t("Gusa vitone vitatu") + " "}<b>⋮</b>{" " + t("juu kulia.")}</Step>
            <Step n={3}>{t("Chagua") + " "}<b>{t("Install app")}</b>{" " + t("au") + " "}<b>{t("Add to Home screen")}</b>.</Step>
            <Step n={4}>{t("Gusa") + " "}<b>{t("Install")}</b>{" " + t("— ikoni itaonekana kwenye skrini yako.")}</Step>
          </ol>
        </section>
        <section className="border-t border-border py-6">
          <h2 className="flex items-center gap-2 font-display text-xl"><Apple className="h-5 w-5 text-primary" />{" " + t("iPhone")}</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <Step n={1}>{t("Fungua tovuti hii kwa") + " "}<b>{t("Safari")}</b>.</Step>
            <Step n={2}>{t("Gusa kitufe cha") + " "}<b>{t("Share")}</b>{" " + t("(kisanduku chenye mshale juu) chini.")}</Step>
            <Step n={3}>{t("Shuka chini uchague") + " "}<b>{t("Add to Home Screen")}</b>.</Step>
            <Step n={4}>{t("Gusa") + " "}<b>{t("Add")}</b>{" " + t("juu kulia — tayari!")}</Step>
          </ol>
        </section>
      </div>
    </main>
  );
}
