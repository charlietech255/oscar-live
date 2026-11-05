export type M3UChannel = { name: string; stream_url: string; logo_url: string | null; group: string | null };

/** Parses an IPTV M3U playlist into channels (name, link, logo, group). */
export function parseM3U(text: string): M3UChannel[] {
  const out: M3UChannel[] = [];
  let pending: Omit<M3UChannel, "stream_url"> | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF")) {
      const attr = (k: string) => line.match(new RegExp(`${k}="([^"]*)"`, "i"))?.[1]?.trim() || null;
      const comma = line.lastIndexOf(",");
      const name = (comma >= 0 ? line.slice(comma + 1).trim() : "") || attr("tvg-name") || "Chaneli";
      pending = { name, logo_url: attr("tvg-logo"), group: attr("group-title") };
    } else if (!line.startsWith("#") && /^https?:\/\//i.test(line)) {
      out.push({ name: pending?.name ?? line.split("/").pop() ?? "Chaneli", logo_url: pending?.logo_url ?? null, group: pending?.group ?? null, stream_url: line });
      pending = null;
    }
  }
  return out;
}

/** Maps an M3U group-title to one of the app's categories. */
export function guessCategory(group: string | null): string {
  const g = (group ?? "").toLowerCase();
  if (/sport|michezo|football|soccer|ligi/.test(g)) return "Michezo";
  if (/news|habari/.test(g)) return "Habari";
  if (/movie|film|cinema/.test(g)) return "Filamu";
  return "Burudani";
}
