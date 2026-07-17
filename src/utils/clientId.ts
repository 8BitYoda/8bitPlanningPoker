const CLIENT_ID_KEY = '8bitpp-client-id'

/** A stable per-browser identity that survives a dropped WebRTC connection,
 * so a reconnecting player is recognized as the same player rather than a
 * duplicate join. */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}
