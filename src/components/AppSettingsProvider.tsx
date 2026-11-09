import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { appSettingsOptions, emptySettings, sectionVisible, translateWord, type AppSettings, type SectionKey } from "@/lib/app-settings";

const SettingsContext = createContext<AppSettings>(emptySettings);
export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(appSettingsOptions);
  return <SettingsContext.Provider value={data ?? emptySettings}>{children}</SettingsContext.Provider>;
}
export function useAppSettings() {
  const settings = useContext(SettingsContext);
  return { settings, t: (original: string) => translateWord(settings, original),
    visible: (key: SectionKey) => sectionVisible(settings, key),
    image: (key: string, fallback: string) => Object.hasOwn(settings.images, key) ? settings.images[key] : fallback };
}
export function ExtraContent({ page }: { page: string }) {
  const { settings } = useAppSettings();
  return <>{settings.blocks.filter(b => b.active && b.page === page).map(b => <section key={b.id} className="mx-auto max-w-6xl border-t border-border px-4 py-6">
    {b.image && <img src={b.image} alt={b.title} className="mb-4 max-h-80 w-full object-contain" loading="lazy" />}
    {b.title && <h2 className="font-display text-xl break-words">{b.title}</h2>}
    {b.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{b.body}</p>}
  </section>)}</>;
}