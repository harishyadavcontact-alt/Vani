export function buildListenReturnTo(publicSource: string) {
  const trimmed = publicSource.trim()
  if (!trimmed) {
    return '/listen'
  }

  return `/listen?publicSource=${encodeURIComponent(trimmed)}`
}

export function buildLoginUpgradeHref(publicSource: string) {
  return `/api/auth/login?returnTo=${encodeURIComponent(buildListenReturnTo(publicSource))}`
}
