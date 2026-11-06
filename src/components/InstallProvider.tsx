import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const InstallContext = createContext<{
  available: boolean;
  installed: boolean;
  busy: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable" | "error">;
}>({ available: false, installed: false, busy: false, install: async () => "unavailable" });

export function InstallProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => { setInstalled(true); setPrompt(null); };
    sync();
    standalone.addEventListener("change", sync);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", complete);
    return () => {
      standalone.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);

  const install = async () => {
    if (!prompt || busy) return "unavailable" as const;
    setBusy(true);
    try {
      await prompt.prompt();
      return (await prompt.userChoice).outcome;
    } catch {
      return "error" as const;
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  };

  return <InstallContext.Provider value={{ available: Boolean(prompt), installed, busy, install }}>{children}</InstallContext.Provider>;
}

export const useInstall = () => useContext(InstallContext);