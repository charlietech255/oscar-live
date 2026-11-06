import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const InstallContext = createContext<{
  available: boolean;
  installed: boolean;
  standalone: boolean;
  ready: boolean;
  busy: boolean;
  install: () => Promise<"accepted" | "dismissed" | "unavailable" | "error">;
}>({ available: false, installed: false, standalone: false, ready: false, busy: false, install: async () => "unavailable" });

export function InstallProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [standaloneMode, setStandaloneMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const sync = () => {
      const inApp = standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      setStandaloneMode(inApp);
      setInstalled(inApp);
      setReady(true);
    };
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

  return <InstallContext.Provider value={{ available: Boolean(prompt), installed, standalone: standaloneMode, ready, busy, install }}>{children}</InstallContext.Provider>;
}

export const useInstall = () => useContext(InstallContext);