import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const link = "text-sm font-medium text-muted-foreground hover:text-foreground";
  const active = { className: "text-sm font-medium text-primary" };
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={32} height={32} className="rounded-md" />
          <span className="font-display text-2xl tracking-wide">KASIGARA <span className="text-primary">TV</span></span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-4">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Tazama</Link>
          <Link to="/vifurushi" className={link} activeProps={active}>Vifurushi</Link>
          <Link to="/sakinisha" className={link} activeProps={active}>Sakinisha App</Link>
          {isAdmin && <Link to="/admin" className={link} activeProps={active}>Usimamizi</Link>}
        </nav>
        {user ? (
          <Button size="sm" variant="secondary" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
            Toka
          </Button>
        ) : (
          <Button size="sm" asChild><Link to="/auth">Ingia / Jisajili</Link></Button>
        )}
      </div>
    </header>
  );
}
