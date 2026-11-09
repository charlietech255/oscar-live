import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLoginEmail } from "@/lib/packages";
import { useInstall } from "@/components/InstallProvider";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingia au Jisajili — Kasigara TV" },
      { name: "description", content: "Jisajili kwa simu au email upate majaribio ya bure ya Kasigara TV." },
      { property: "og:title", content: "Ingia — Kasigara TV" },
      { property: "og:description", content: "Jisajili kwa simu au email na uanze majaribio ya bure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useAppSettings();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { standalone } = useInstall();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Neno la siri liwe na herufi 6 au zaidi"); return; }
    setBusy(true);
    const email = toLoginEmail(contact);
    const { data, error } =
      mode === "up"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin, data: { display_name: name || contact, contact } },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "Simu/email au neno la siri si sahihi" : error.message.includes("weak") ? "Neno la siri ni rahisi mno, chagua jingine gumu zaidi" : error.message);
      return;
    }
    if (!data.session) {
      toast.success("Akaunti imetengenezwa. Angalia ujumbe wa kuthibitisha email yako, kisha ingia.");
      return;
    }
    toast.success(mode === "up" ? "Karibu! Majaribio yako ya bure yameanza." : "Umeingia");
    navigate({ to: "/" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl tracking-wide">{mode === "up" ? t("Jisajili") : t("Ingia")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "up" ? t("Pata dakika 12 za kutazama bure.") : t("Karibu tena!")}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "up" && (
            <div className="space-y-1">
              <Label htmlFor="name">{t("Jina")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Jina lako")} />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="contact">{t("Namba ya simu au Email")}</Label>
            <Input id="contact" required value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("07XXXXXXXX au jina@mfano.com")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pw">{t("Neno la siri")}</Label>
            <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t("Subiri…") : mode === "up" ? t("Jisajili na anza bure") : t("Ingia")}
          </Button>
        </form>
        <Button variant="ghost" className="mt-4 w-full text-sm text-muted-foreground" onClick={() => setMode(mode === "up" ? "in" : "up")}>
          {mode === "up" ? t("Una akaunti tayari? Ingia") : t("Huna akaunti? Jisajili")}
        </Button>
        {!standalone && <Button asChild variant="link" className="mt-2 w-full"><Link to="/sakinisha">{t("Sakinisha app kwenye simu")}</Link></Button>}
      </div>
    </main>
  );
}
