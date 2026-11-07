import { Link, useLocation } from "@tanstack/react-router";
import { Home, Radio, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
export function BottomNavigation() {
  const {pathname}=useLocation();
  const items=[{to:"/",label:"Home",icon:Home},{to:"/live",label:"Live",icon:Radio},{to:"/akaunti",label:"Akaunti",icon:UserRound}] as const;
  return <nav aria-label="Menyu ya chini" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid max-w-6xl grid-cols-3">{items.map(item=><Button key={item.to} asChild variant="ghost" className={`h-16 flex-col gap-1 rounded-none text-[11px] ${pathname===item.to?"text-primary":"text-muted-foreground"}`}><Link to={item.to} aria-current={pathname===item.to?"page":undefined}><item.icon className="h-5 w-5"/>{item.label}</Link></Button>)}</div></nav>;
}