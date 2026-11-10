import { useAppSettings } from "@/components/AppSettingsProvider";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, CreditCard, Download, LogOut, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export function SiteHeader() {
  const { t, visible, image } = useAppSettings();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label={t("Fungua menyu")}><Menu className="h-5 w-5"/></Button></SheetTrigger><SheetContent side="left"><SheetTitle>{t("KASIGARA TV")}</SheetTitle><SheetDescription>{t("Menyu")}</SheetDescription><nav className="mt-6 flex flex-col gap-3"><SheetClose asChild><Button variant="ghost" asChild className="justify-start"><Link to="/vifurushi"><CreditCard className="h-4 w-4"/>{" " + t("Vifurushi")}</Link></Button></SheetClose><SheetClose asChild><Button variant="ghost" asChild className="justify-start"><Link to="/sakinisha"><Download className="h-4 w-4"/>{" " + t("Sakinisha App")}</Link></Button></SheetClose>{isAdmin&&<SheetClose asChild><Button variant="ghost" asChild className="justify-start"><Link to="/admin"><Shield className="h-4 w-4"/>{" " + t("Usimamizi")}</Link></Button></SheetClose>}{user&&<Button variant="ghost" className="justify-start" onClick={async()=>{await supabase.auth.signOut();setOpen(false);navigate({to:"/"});}}><LogOut className="h-4 w-4"/>{" " + t("Toka")}</Button>}</nav></SheetContent></Sheet>
        <Link to="/" className="flex items-center gap-2">
          <img src={image("appLogo", "/icon-192.png")} alt="" width={32} height={32} className="rounded-md" />
          {visible("headerName") && <span className="font-display text-lg tracking-wide">{t("KASIGARA") + " "}<span className="text-primary">{t("TV")}</span></span>}
        </Link>
        {!user && (
          <Button size="sm" asChild><Link to="/auth">{t("Ingia / Jisajili")}</Link></Button>
        )}
      </div>
    </header>
  );
}
