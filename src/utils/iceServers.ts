// WebRTC ICE servers used for every Peer connection, layered so the browser
// has several ways to establish a route:
//  1. STUN — works for the common case (most home/office NAT).
//  2. PeerJS's own TURN relay (UDP 3478) — PeerJS's default, kept explicit
//     here since passing a custom `config` to Peer() replaces rather than
//     merges with it.
//  3. Open Relay Project's free TURN relay, including a TCP-on-443 option —
//     this is the one that matters on strict corporate networks that block
//     outbound UDP outright, since TURN-over-TCP-443 looks like ordinary
//     HTTPS traffic to a firewall/proxy. It's a shared, best-effort public
//     service (20GB/mo, no uptime guarantee) — good enough as a fallback,
//     not a substitute for a dedicated TURN server if this app ever needs
//     guaranteed connectivity.
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
    username: 'peerjs',
    credential: 'peerjsp',
  },
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

export const PEER_ICE_CONFIG = { config: { iceServers: ICE_SERVERS } }
