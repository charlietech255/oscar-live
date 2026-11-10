import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: owner, error } = await context.supabase.rpc("is_app_owner");
    if (error || !owner || data.userId === context.userId) throw new Error("Mmiliki pekee anaweza kufuta mteja mwingine.");
    const { data: roles, error: roleError } = await context.supabase.from("user_roles").select("role").eq("user_id", data.userId);
    if (roleError || roles?.some(r => r.role === "admin")) throw new Error("Ondoa usimamizi kwanza kabla ya kufuta akaunti.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (deleteError) throw new Error("Akaunti haijafutwa. Jaribu tena.");
    await supabaseAdmin.from("admin_audit").insert({ actor: context.userId, target: data.userId, action: "delete_customer" });
    return { success: true };
  });