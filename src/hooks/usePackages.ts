import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePackages(all = false) {
  return useQuery({
    queryKey: ["packages", all],
    queryFn: async () => {
      let q = supabase.from("packages").select("*").order("sort_order");
      if (!all) q = q.eq("active", true);
      return (await q).data ?? [];
    },
  });
}
