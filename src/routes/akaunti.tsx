import { useAppSettings } from "@/components/AppSettingsProvider";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasAccess } from "@/lib/packages";
import { Button } from "@/components/ui/button";
import { CommunityButton } from "@/components/Community";
export const Route=createFileRoute("/akaunti")({head:()=>({meta:[{title:"Akaunti yangu — Kasigara TV"},{name:"description",content:"Akaunti yako na hali ya kifurushi cha Kasigara TV."},{property:"og:title",content:"Akaunti yangu — Kasigara TV"},{property:"og:description",content:"Tazama taarifa za akaunti na kifurushi chako."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:Account});
function Account(){
  const { t, visible } = useAppSettings();
  const {user,profile,ready}=useAuth();
  return <main className="mx-auto max-w-xl px-4 py-8"><UserRound className="mb-4 h-9 w-9 text-primary"/><h1 className="font-display text-2xl">{t("Akaunti yangu")}</h1>{!ready?<p>{t("Inapakia…")}</p>:!user?<Button asChild className="mt-4"><Link to="/auth">{t("Jisajili / Ingia")}</Link></Button>:<><dl className="mt-6 divide-y divide-border text-sm"><div className="py-4"><dt className="text-muted-foreground">{t("Jina")}</dt><dd>{profile?.display_name||"—"}</dd></div><div className="py-4"><dt className="text-muted-foreground">{t("Simu / Email")}</dt><dd className="break-words">{profile?.contact||user.email}</dd></div><div className="py-4"><dt className="text-muted-foreground">{t("Hali")}</dt><dd>{profile?.is_suspended?t("Akaunti imesimamishwa"):hasAccess(profile)?t("Unaweza kutazama"):t("Lipia kifurushi uendelee")}</dd></div><div className="py-4"><dt className="text-muted-foreground">{t("Kifurushi hadi")}</dt><dd>{profile?.subscription_ends_at?new Date(profile.subscription_ends_at).toLocaleString("sw-TZ"):t("Hakuna kifurushi")}</dd></div></dl><Button asChild className="mt-4"><Link to="/vifurushi">{t("Vifurushi")}</Link></Button>{visible("community") && <div className="mt-6 flex items-center gap-3 border-t border-border pt-6"><CommunityButton/><span className="text-sm font-medium">{t("Group la wateja")}</span></div>}</>}</main>;
}