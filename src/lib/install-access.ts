export function canViewServices(standalone: boolean, signedIn = false): boolean {
  return standalone || signedIn;
}