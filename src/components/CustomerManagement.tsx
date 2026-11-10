import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deleteCustomer } from "@/lib/customer-admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateBonusMinutes } from "@/lib/customer-controls";

export function CustomerManagement({ administrators = false }: { administrators?: boolean }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const remove = useServerFn(deleteCustomer);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [offerFor, setOfferFor] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("5");

  const users = useQuery({
    queryKey: ["allUsers"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const roles = useQuery({
    queryKey: ["allRoles"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });
  const owner = useQuery({
    queryKey: ["isOwner"], enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_app_owner");
      if (error) throw error;
      return data;
    },
  });

  async function act(action: () => Promise<unknown>, message = "Mabadiliko yamehifadhiwa") {
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["allUsers"] }),
        qc.invalidateQueries({ queryKey: ["allRoles"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Haijakamilika");
    } finally {
      setBusy(false);
    }
  }

  function grantMinutes(userId: string) {
    const amount = Number(minutes);
    const problem = validateBonusMinutes(amount);
    if (problem) { toast.error(problem); return; }
    void act(async () => {
      const { data, error } = await supabase.rpc("grant_customer_minutes", { _user_id: userId, _minutes: amount });
      if (error) throw error;
      setOfferFor(null);
      return data;
    }, `Dakika ${amount} zimeongezwa kwa mteja`);
  }

  const filtered = users.data?.filter(user => `${user.display_name} ${user.contact}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section>
      <h2 className="font-display text-xl">{administrators ? "Wasimamizi" : "Wateja na ofa za muda"}</h2>
      <p className="mt-1 text-xs text-muted-foreground">Ongeza ofa hata ya dakika 5, simamisha mteja, au mruhusu kuendelea.</p>
      <Input className="my-4" placeholder="Tafuta jina au simu…" value={q} onChange={event => setQ(event.target.value)} />
      {(users.isError || roles.isError) && <p className="text-destructive">Orodha haijapakiwa.</p>}
      <ul className="space-y-3">
        {filtered?.map(user => {
          const admin = roles.data?.some(role => role.user_id === user.id && role.role === "admin");
          return (
            <li key={user.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{user.display_name} {admin && "· Msimamizi"}</p>
                  <p className="break-words text-xs text-muted-foreground">{user.contact}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.subscription_ends_at ? `Kifurushi hadi ${new Date(user.subscription_ends_at).toLocaleString("sw-TZ")}` : "Hakuna kifurushi kilicholipwa"}
                  </p>
                  {user.is_suspended && <p className="text-xs text-destructive">Imesimamishwa</p>}
                </div>
                {administrators ? owner.data && (
                  <Button size="sm" variant={admin ? "secondary" : "default"} disabled={busy} onClick={() => {
                    if (!confirm(admin ? "Ondoa usimamizi wa akaunti hii?" : "Mpe uwezo wa usimamizi?")) return;
                    void act(async () => {
                      const { error } = await supabase.rpc("manage_admin", { _user_id: user.id, _promote: !admin });
                      if (error) throw error;
                    });
                  }}>{admin ? "Ondoa usimamizi" : "Mpe usimamizi"}</Button>
                ) : !admin && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => { setOfferFor(offerFor === user.id ? null : user.id); setMinutes("5"); }}>
                      <Clock3 className="h-4 w-4" /> Ofa ya dakika
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(async () => {
                      const { error } = await supabase.rpc("suspend_customer", { _user_id: user.id, _suspended: !user.is_suspended });
                      if (error) throw error;
                    }, user.is_suspended ? "Mteja ameruhusiwa tena" : "Mteja amesimamishwa")}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{user.is_suspended ? "Ruhusu" : "Simamisha"}
                    </Button>
                    {owner.data && <Button size="sm" variant="destructive" disabled={busy} onClick={() => {
                      if (confirm(`Futa akaunti ya ${user.display_name}? Haiwezi kurudishwa.`)) void act(() => remove({ data: { userId: user.id } }));
                    }}>Futa</Button>}
                  </div>
                )}
              </div>
              {!administrators && offerFor === user.id && (
                <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-4">
                  <div>
                    <Label htmlFor={`minutes-${user.id}`}>Dakika za kuongeza</Label>
                    <Input id={`minutes-${user.id}`} className="mt-1 w-32" type="number" min={1} max={43200} step={1} value={minutes} onChange={event => setMinutes(event.target.value)} />
                  </div>
                  <Button size="sm" disabled={busy} onClick={() => grantMinutes(user.id)}>Ongeza muda</Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOfferFor(null)}>Ghairi</Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {administrators && !owner.data && <p className="mt-4 text-muted-foreground">Mmiliki pekee anaweza kuongeza au kuondoa wasimamizi.</p>}
    </section>
  );
}
