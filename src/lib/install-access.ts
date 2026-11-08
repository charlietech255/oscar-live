// Services (channels, packages, player) are shown only to signed-in customers.
// Installation alone no longer opens them; visitors see the outside introduction.
export function canViewServices(_standalone: boolean, signedIn = false): boolean {
  return signedIn;
}
