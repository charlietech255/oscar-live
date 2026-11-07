export const PAY_NUMBER = "0769564254";
export const PAY_NAME = "JULIAS";

export const CATEGORIES = ["Michezo", "Habari", "Burudani", "Filamu"] as const;

export function formatTsh(n: number) {
  return `TSh ${n.toLocaleString("en-US")}`;
}

/** Phone numbers become a private login address so people can register with a phone. */
export function toLoginEmail(input: string) {
  const v = input.trim().toLowerCase();
  if (v.includes("@")) return v;
  let digits = v.replace(/\D/g, "");
  if (digits.startsWith("255")) digits = "0" + digits.slice(3);
  return `${digits}@simu.tv`;
}

export function hasAccess(p: { trial_ends_at: string; subscription_ends_at: string | null; is_suspended?: boolean } | null, now = new Date()) {
  if (!p || p.is_suspended) return false;
  if (new Date(p.trial_ends_at) > now) return true;
  return !!p.subscription_ends_at && new Date(p.subscription_ends_at) > now;
}

/** Returns a Swahili error message, or null when the service is valid. */
export function validatePackage(p: { label: string; price: number; days: number }): string | null {
  const name = p.label.trim();
  if (name.length < 2) return "Jina la huduma linahitajika (angalau herufi 2).";
  if (name.length > 50) return "Jina la huduma lisizidi herufi 50.";
  if (!Number.isInteger(p.price) || p.price < 100) return "Bei iwe namba kamili isiyopungua TSh 100.";
  if (p.price > 1_000_000) return "Bei isizidi TSh 1,000,000.";
  if (!Number.isInteger(p.days) || p.days < 1 || p.days > 365) return "Idadi ya siku iwe kati ya 1 na 365.";
  return null;
}
