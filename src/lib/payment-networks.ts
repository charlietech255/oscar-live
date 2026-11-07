import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const suggestedNetworks = ["M-Pesa", "Tigo Pesa / Mixx", "Airtel Money", "Halopesa"];
export const networkOptions = queryOptions({queryKey:["paymentNetworks"],queryFn:async()=>{const {data,error}=await supabase.from("payment_networks").select("*").order("sort_order");if(error)throw error;return data;}});