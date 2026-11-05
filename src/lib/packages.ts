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

export function hasAccess(p: { trial_ends_at: string; subscription_ends_at: string | null } | null, now = new Date()) {
  if (!p) return false;
  if (new Date(p.trial_ends_at) > now) return true;
  return !!p.subscription_ends_at && new Date(p.subscription_ends_at) > now;
}
