export const TRIAL_MINUTES = 12;
export const DEFAULT_GROUP_URL = "https://chat.whatsapp.com/KxKzfO4MsaY2YmAjQD526L?s=cl&p=a&iam=2";
export function trialSeconds(endsAt: string | undefined, now = Date.now()) {
  return endsAt ? Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000)) : 0;
}
export function validateCorrection(amount: number, price: number, note: string) {
  if (!Number.isInteger(amount) || amount !== price) return "Kiasi lazima kilingane na bei ya kifurushi.";
  return note.trim().length >= 3 ? null : "Andika sababu ya marekebisho.";
}