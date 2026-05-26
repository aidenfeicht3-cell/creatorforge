/** Shared workshop helpers — URL/avatar building and validation. */

/** Normalize any YouTube handle input → "@handle". */
export function normalizeHandle(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Already a handle
  const at = raw.replace(/^@/, "").trim();
  // Or maybe they pasted a URL
  const fromUrl = raw.match(
    /youtube\.com\/(?:@|c\/|user\/)([A-Za-z0-9_.-]+)/i,
  );
  const handle = fromUrl ? fromUrl[1] : at;

  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(handle)) return null;
  return `@${handle}`;
}

export function channelUrlFor(handle: string): string {
  return `https://www.youtube.com/${handle}`;
}

export function avatarUrlFor(handle: string): string {
  const clean = handle.replace(/^@/, "");
  return `https://unavatar.io/youtube/${clean}`;
}
