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
