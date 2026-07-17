// Excludes visually-ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const PEER_ID_PREFIX = '8bitpp-'

export function generateRoomCode(length = 4): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function roomCodeToPeerId(code: string): string {
  return `${PEER_ID_PREFIX}${normalizeRoomCode(code)}`
}

const CODE_PARAM = 'code'

/** Reads a room code off `?code=` in the current URL, if present. */
export function getCodeFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get(CODE_PARAM)
  if (!raw) return null
  const code = normalizeRoomCode(raw)
  return code || null
}

/** Removes `?code=` from the visible URL without adding a history entry. */
export function clearCodeFromUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete(CODE_PARAM)
  window.history.replaceState({}, '', url)
}

/** A shareable link that pre-fills the Join form with this room's code. */
export function buildInviteLink(code: string): string {
  const url = new URL(window.location.href)
  url.search = `?${CODE_PARAM}=${normalizeRoomCode(code)}`
  url.hash = ''
  return url.toString()
}
