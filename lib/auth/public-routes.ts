/** Path prefixes accessible without a session. */
const PUBLIC_PREFIXES = ["/login", "/auth/"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}
