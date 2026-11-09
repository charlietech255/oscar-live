import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAY_NAME, PAY_NUMBER, formatTsh } from "@/lib/packages";
import { usePackages } from "@/hooks/usePackages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vifurushi")({
  head: () => ({
    meta: [
      { title: "Vifurushi vya TV — Kasigara TV" },
      { name: "description", content: "Siku 1 TSh 500, Wiki 1 TSh 2,500, Mwezi 1 TSh 7,000. Lipia kwa M-Pesa au Tigo Pesa." },
      { property: "og:title", content: "Vifurushi — Kasigara TV" },
      { property: "og:description", content: "Lipia kwa M-Pesa au Tigo Pesa na uwashe kifurushi chako." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Packages,
});

const statusLabel: Record<string, string> = { pending: "Inasubiri uthibitisho", approved: "Imethibitishwa", rejected: "Imekataliwa" };

function Packages() {
  const { t } = useAppSettings();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: PACKAGES = [] } = usePackages();
  const [pkgSel, setPkg] = useState<string | null>(null);
  const [network, setNetwork] = useState("M-Pesa");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen = PACKAGES.find((p) => p.id === pkgSel) ?? PACKAGES[PACKAGES.length - 1];
  const pkg = chosen?.id;

  const { data: history = [] } = useQuery({
    queryKey: ["myPayments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("payments").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    setBusy(true);
    const { error } = await supabase.from("payments").insert({
      package: chosen.id, amount: chosen.price, network, sender_phone: phone.trim(), reference: reference.trim(),
    });
    setBusy(false);
    if (error) { toast.error("Imeshindikana kutuma. Jaribu tena."); return; }
    toast.success("Tumepokea! Kifurushi kitawashwa baada ya kuthibitishwa.");
    setReference("");
    qc.invalidateQueries({ queryKey: ["myPayments"] });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-wide">{t("Vifurushi")}</h1>
      <p className="text-muted-foreground">{t("Chagua kifurushi, lipia, kisha tuma namba ya muamala.")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPkg(p.id)}
            className={cn("rounded-2xl border bg-card p-5 text-left transition-all", pkg === p.id ? "border-primary ring-2 ring-primary" : "border-border hover:border-muted-foreground")}
          >
            {p.image_url && <img src={p.image_url} alt={p.label} loading="lazy" className="mb-3 h-16 w-16 rounded-lg object-cover" />}
            <div className="font-display text-xl">{p.label}</div>
            <div className="mt-2 text-lg font-bold text-primary">{formatTsh(p.price)}</div>
            <div className="mt-2 text-sm text-muted-foreground">{p.description || `Chaneli zote · Siku ${p.days}`}</div>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("Jinsi ya kulipia")}</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              <>{t("Piga") + " "}<b>*150*00#</b>{" " + t("(M-Pesa) au") + " "}<b>*150*01#</b>{" " + t("(Tigo Pesa / Mixx)")}</>,
              <>{t("Chagua") + " "}<b>{t("Tuma Pesa")}</b></>,
              <>{t("Weka namba") + " "}<b>{PAY_NUMBER}</b>{" " + t("— jina litaonekana") + " "}<b>{PAY_NAME}</b></>,
              <>{t("Kiasi:") + " "}<b>{chosen ? formatTsh(chosen.price) : "—"}</b> ({chosen?.label})</>,
              <>{t("Weka namba yako ya siri na thibitisha")}</>,
              <>{t("Nakili") + " "}<b>{t("kumbukumbu ya muamala")}</b>{" " + t("kutoka kwenye SMS na uitume hapa")}</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <Button variant="secondary" className="mt-5" onClick={() => { navigator.clipboard.writeText(PAY_NUMBER); toast.success("Namba imenakiliwa"); }}>
            <Copy className="mr-2 h-4 w-4" />{" " + t("Nakili") + " "}{PAY_NUMBER}
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">{t("Washa kifurushi")}</h2>
          {!user ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">{t("Ingia kwanza ili kutuma namba ya muamala.")}</p>
              <Button asChild><Link to="/auth">{t("Ingia / Jisajili")}</Link></Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <Label>{t("Mtandao")}</Label>
                <div className="flex gap-2">
                  {["M-Pesa", "Tigo Pesa"].map((n) => (
                    <Button key={n} type="button" variant={network === n ? "default" : "secondary"} onClick={() => setNetwork(n)}>{n}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">{t("Namba uliyolipia nayo")}</Label>
                <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ref">{t("Kumbukumbu / Namba ya muamala")}</Label>
                <Input id="ref" required value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t("mf. QK12AB34CD")} />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !chosen}>
                {busy ? "Inatuma…" : chosen ? `Tuma — ${chosen.label} (${formatTsh(chosen.price)})` : t("Tuma")}
              </Button>
            </form>
          )}
          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">{t("Malipo yako")}</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
                    <span>{PACKAGES.find((p) => p.id === h.package)?.label ?? h.package} · {h.reference}</span>
                    <span className={cn(h.status === "approved" ? "text-primary" : h.status === "rejected" ? "text-destructive" : "text-accent")}>
                      {h.status === "approved" && <Check className="mr-1 inline h-3 w-3" />}{statusLabel[h.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
