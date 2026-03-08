export function buildPublicListenHref(rawInput: string) {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    return '/listen'
  }

  return `/listen?publicSource=${encodeURIComponent(trimmed)}`
}
