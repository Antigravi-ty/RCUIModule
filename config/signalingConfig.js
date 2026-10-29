/**
 * signalingConfig.js
 * Centralized configuration and LocalStorage persistence for Multi-Relay E2EE Signaling and Host Offers.
 */

import { safeStorage, STORAGE_KEYS } from './storageHelpers.ts';

export const PRIVATE_EMQX_SIGNALING_URL = 'wss://pa4e2fe9.ala.asia-southeast1.emqxsl.com:8084/mqtt';
export const CLOUDFLARE_SIGNALING_URL = 'wss://signalling.test.sarpbc.fans/ws';
export const PUBLIC_EMQX_SIGNALING_URL = 'wss://broker.emqx.io:8084/mqtt';

export const DEFAULT_SIGNALING_URL = PRIVATE_EMQX_SIGNALING_URL;
export const SIGNALING_ROOM_PREFIX = 'WEBRLROOM09211744-';
export const SIGNALING_TOPIC_NAMESPACE = 'rc/sig';

export const DEFAULT_SIGNALING_RELAYS = Object.freeze([
  Object.freeze({
    id: 'private_emqx',
    label: 'Private EMQX (Asia-SE1)',
    protocol: 'mqtt',
    url: PRIVATE_EMQX_SIGNALING_URL,
    username: 'rc_signaling',
    password: 'rUpjek-xivfen-byhpi6',
    staggerDelayMs: 0,
    connectTimeoutMs: 4500,
    keepAliveSeconds: 30,
  }),
  Object.freeze({
    id: 'cloudflare_worker',
    label: 'Cloudflare Worker',
    protocol: 'ws',
    url: CLOUDFLARE_SIGNALING_URL,
    username: '',
    password: '',
    staggerDelayMs: 250,
    connectTimeoutMs: 5000,
    keepAliveSeconds: 25,
  }),
  Object.freeze({
    id: 'public_emqx',
    label: 'Public EMQX Broker',
    protocol: 'mqtt',
    url: PUBLIC_EMQX_SIGNALING_URL,
    username: '',
    password: '',
    staggerDelayMs: 500,
    connectTimeoutMs: 5000,
    keepAliveSeconds: 30,
  }),
]);

let _memorySignalingUrl = null;
let _memoryManualPairing = null;
let _memoryAllowDaisyChain = null;

export function detectSignalingProtocol(url) {
  const clean = String(url || '').trim().toLowerCase();
  if (
    clean.endsWith('/mqtt') ||
    clean.includes('/mqtt?') ||
    clean.includes(':8084') ||
    clean.includes(':8083') ||
    clean.includes('emqx')
  ) {
    return 'mqtt';
  }
  return 'ws';
}

export function getSignalingUrl() {
  const custom = safeStorage.get(STORAGE_KEYS.SIGNALING_URL);
  if (custom && custom.trim()) {
    return custom.trim();
  }
  return _memorySignalingUrl || DEFAULT_SIGNALING_URL;
}

export function setSignalingUrl(url) {
  const clean = url && typeof url === 'string' && url.trim() ? url.trim() : null;
  _memorySignalingUrl = clean;
  if (clean) {
    safeStorage.set(STORAGE_KEYS.SIGNALING_URL, clean);
  } else {
    safeStorage.remove(STORAGE_KEYS.SIGNALING_URL);
  }
}

export function getSignalingRelays() {
  const customUrl = safeStorage.get(STORAGE_KEYS.SIGNALING_URL)?.trim() || _memorySignalingUrl;
  if (!customUrl) {
    return DEFAULT_SIGNALING_RELAYS.map((relay) => ({ ...relay }));
  }

  const normalizedCustom = customUrl.trim();
  const matchingDefault = DEFAULT_SIGNALING_RELAYS.find((relay) => relay.url === normalizedCustom);
  if (matchingDefault) {
    const remaining = DEFAULT_SIGNALING_RELAYS.filter((relay) => relay.id !== matchingDefault.id);
    return [
      { ...matchingDefault, staggerDelayMs: 0 },
      ...remaining.map((relay, index) => ({ ...relay, staggerDelayMs: (index + 1) * 250 })),
    ];
  }

  const protocol = detectSignalingProtocol(normalizedCustom);
  const isPrivateEmqxHost = normalizedCustom.includes('pa4e2fe9.ala.asia-southeast1.emqxsl.com');
  return [
    {
      id: 'custom_primary',
      label: 'Custom Primary Relay',
      protocol,
      url: normalizedCustom,
      username: isPrivateEmqxHost ? 'rc_signaling' : '',
      password: isPrivateEmqxHost ? 'rUpjek-xivfen-byhpi6' : '',
      staggerDelayMs: 0,
      connectTimeoutMs: 4500,
      keepAliveSeconds: 30,
    },
    ...DEFAULT_SIGNALING_RELAYS.map((relay, index) => ({
      ...relay,
      staggerDelayMs: (index + 1) * 250,
    })),
  ];
}

export function getManualPairingConfirmationEnabled() {
  if (_memoryManualPairing !== null) return _memoryManualPairing;
  const stored = safeStorage.get(STORAGE_KEYS.SIGNALING_MANUAL_PAIRING);
  return stored === 'true' || stored === '1';
}

export function setManualPairingConfirmationEnabled(enabled) {
  const normalized = Boolean(enabled);
  _memoryManualPairing = normalized;
  safeStorage.set(STORAGE_KEYS.SIGNALING_MANUAL_PAIRING, normalized ? 'true' : 'false');
}

export function getAllowSpectatorDaisyChain() {
  if (_memoryAllowDaisyChain !== null) return _memoryAllowDaisyChain;
  const stored = safeStorage.get(STORAGE_KEYS.ALLOW_SPECTATOR_DAISY_CHAIN);
  if (stored === null || stored === undefined) return true;
  return stored !== 'false' && stored !== '0';
}

export function setAllowSpectatorDaisyChain(enabled) {
  const normalized = Boolean(enabled);
  _memoryAllowDaisyChain = normalized;
  safeStorage.set(STORAGE_KEYS.ALLOW_SPECTATOR_DAISY_CHAIN, normalized ? 'true' : 'false');
}

export function saveActiveHostOffer(offerInfo) {
  safeStorage.set(
    STORAGE_KEYS.ACTIVE_HOST,
    JSON.stringify({
      ...offerInfo,
      timestamp: offerInfo.timestamp ?? Date.now(),
    })
  );
}

export function loadActiveHostOffer() {
  const raw = safeStorage.get(STORAGE_KEYS.ACTIVE_HOST);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[SignalingConfig] Failed to parse active host offer:', err);
    return null;
  }
}

export function clearActiveHostOffer() {
  safeStorage.remove(STORAGE_KEYS.ACTIVE_HOST);
}

export const ConnectionStatus = Object.freeze({
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ERROR: 'error',
});

export const HOST_CONNECTION_STEPS = Object.freeze([
  { id: 'worker_init', name: 'Initializing 120Hz Authoritative Worker' },
  { id: 'physics_ready', name: 'Configuring Arena & Physics Engine' },
  { id: 'signaling_connect', name: 'Binding Multi-Relay E2EE Signaling' },
  { id: 'room_register', name: 'Verifying Encrypted Topic & Loopback' },
  { id: 'ready_for_players', name: 'Room Active. Ready for Players (Up to 6)' },
]);

export const JOIN_CONNECTION_STEPS = Object.freeze([
  { id: 'signaling_connect', name: 'Connecting to Multi-Relay Signaling' },
  { id: 'find_room', name: 'Performing 3-Way E2EE Rendezvous Handshake' },
  { id: 'webrtc_offer', name: 'Decrypting Host Offer & Creating Answer' },
  { id: 'ice_exchange', name: 'Exchanging Encrypted ICE & Establishing P2P' },
  { id: 'state_sync', name: 'Synchronizing Game Timeline & State' },
  { id: 'joined_complete', name: 'Connected. Entering Arena' },
]);

export class RoomConnectionProgressManager {
  constructor(options = {}) {
    this.options = options;
    this.status = ConnectionStatus.IDLE;
    this.mode = null;
    this.steps = [];
    this.currentStepIndex = 0;
    this.currentStepName = '';
    this.error = null;
    this.isError = false;
    this.isPairingHold = false;
    this.pairingCode = null;
    this.activeRelayLabel = null;
    this.observers = new Set();
    this.startTime = 0;
    this.endTime = 0;
  }

  get totalSteps() {
    return this.steps.length;
  }

  get currentStep() {
    return this.currentStepIndex;
  }

  get progressRatio() {
    if (this.totalSteps === 0) return 0;
    if (this.status === ConnectionStatus.COMPLETED) return 1.0;
    return Math.max(0, Math.min(1.0, this.currentStepIndex / this.totalSteps));
  }

  get percentage() {
    return Math.round(this.progressRatio * 100);
  }

  subscribe(observer) {
    if (observer) {
      this.observers.add(observer);
      this._notifyObserver(observer);
    }
    return () => {
      this.observers.delete(observer);
    };
  }

  startHost() {
    this.start('host', HOST_CONNECTION_STEPS);
  }

  startJoin() {
    this.start('join', JOIN_CONNECTION_STEPS);
  }

  start(mode, steps = []) {
    this.mode = mode;
    this.steps = [...steps];
    this.status = ConnectionStatus.IN_PROGRESS;
    this.currentStepIndex = 0;
    this.isError = false;
    this.error = null;
    this.isPairingHold = false;
    this.pairingCode = null;
    this.activeRelayLabel = null;
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.endTime = 0;

    if (this.steps.length > 0) {
      this.currentStepIndex = 1;
      this.currentStepName = this.steps[0].name;
    } else {
      this.currentStepName = '';
    }

    this._emitChange();
  }

  setPairingHold(isHeld, pairingCode = null, customLabel = null) {
    this.isPairingHold = Boolean(isHeld);
    if (pairingCode !== null) {
      this.pairingCode = pairingCode;
    }
    if (customLabel) {
      this.currentStepName = customLabel;
    }
    this._emitChange();
  }

  setActiveRelay(relayLabel, pairingCode = null) {
    if (relayLabel) this.activeRelayLabel = relayLabel;
    if (pairingCode) this.pairingCode = pairingCode;
    this._emitChange();
  }

  advance(stepOrName, customLabel) {
    if (this.status === ConnectionStatus.ERROR) return;

    if (typeof stepOrName === 'number') {
      this.currentStepIndex = Math.max(1, Math.min(this.totalSteps, stepOrName));
      if (customLabel) {
        this.currentStepName = customLabel;
      } else if (this.steps[this.currentStepIndex - 1]) {
        this.currentStepName = this.steps[this.currentStepIndex - 1].name;
      }
    } else if (typeof stepOrName === 'string') {
      const idx = this.steps.findIndex((s) => s.id === stepOrName);
      if (idx !== -1) {
        this.currentStepIndex = idx + 1;
        this.currentStepName = customLabel || this.steps[idx].name;
      } else {
        this.currentStepIndex = Math.min(this.totalSteps, this.currentStepIndex + 1);
        this.currentStepName = stepOrName;
      }
    } else {
      this.currentStepIndex = Math.min(this.totalSteps, this.currentStepIndex + 1);
      if (this.steps[this.currentStepIndex - 1]) {
        this.currentStepName = this.steps[this.currentStepIndex - 1].name;
      }
    }

    if (this.currentStepIndex >= this.totalSteps) {
      this.status = ConnectionStatus.COMPLETED;
      this.isPairingHold = false;
      this.endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }

    this._emitChange();
  }

  fail(error, stepName) {
    this.status = ConnectionStatus.ERROR;
    this.isError = true;
    this.isPairingHold = false;
    this.error = typeof error === 'string' ? new Error(error) : error;
    if (stepName) {
      this.currentStepName = stepName;
    } else if (this.error?.message) {
      this.currentStepName = `Failed: ${this.error.message}`;
    }
    this.endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this._emitChange();
  }

  complete(label) {
    this.currentStepIndex = this.totalSteps;
    this.status = ConnectionStatus.COMPLETED;
    this.isError = false;
    this.isPairingHold = false;
    this.error = null;
    this.endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (label) this.currentStepName = label;
    this._emitChange();
  }

  reset() {
    this.status = ConnectionStatus.IDLE;
    this.mode = null;
    this.steps = [];
    this.currentStepIndex = 0;
    this.currentStepName = '';
    this.isError = false;
    this.isPairingHold = false;
    this.pairingCode = null;
    this.activeRelayLabel = null;
    this.error = null;
    this.startTime = 0;
    this.endTime = 0;
    this._emitChange();
  }

  getState() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      status: this.status,
      mode: this.mode,
      currentStep: this.currentStepIndex,
      totalSteps: this.totalSteps,
      stepName: this.currentStepName,
      progressRatio: this.progressRatio,
      percentage: this.percentage,
      isError: this.isError,
      isPairingHold: this.isPairingHold,
      pairingCode: this.pairingCode,
      activeRelayLabel: this.activeRelayLabel,
      error: this.error,
      durationMs: (this.endTime || now) - this.startTime,
    };
  }

  _emitChange() {
    const state = this.getState();
    for (const obs of this.observers) {
      this._notifyObserver(obs, state);
    }
  }

  _notifyObserver(obs, state = this.getState()) {
    try {
      if (typeof obs === 'function') {
        obs(state);
      } else if (typeof obs.onProgress === 'function') {
        obs.onProgress(state);
      }
      if (state.isError && typeof obs?.onError === 'function') {
        obs.onError(state.error, state);
      }
      if (state.status === ConnectionStatus.COMPLETED && typeof obs?.onComplete === 'function') {
        obs.onComplete(state);
      }
    } catch (e) {
      console.warn('[RoomConnectionProgressManager] Observer error:', e);
    }
  }
}

export const roomConnectionProgress = new RoomConnectionProgressManager();

function encodeMqttUtf8Field(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str || '');
  const out = new Uint8Array(2 + bytes.length);
  out[0] = (bytes.length >> 8) & 0xff;
  out[1] = bytes.length & 0xff;
  out.set(bytes, 2);
  return out;
}

function buildMqttDiagnosticConnectPacket(clientId, username = '', password = '') {
  const protoHeader = new Uint8Array([0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04]);
  let connectFlags = 0x02;
  const chunks = [encodeMqttUtf8Field(clientId)];
  if (username) {
    connectFlags |= 0x80;
    chunks.push(encodeMqttUtf8Field(username));
    if (password) {
      connectFlags |= 0x40;
      chunks.push(encodeMqttUtf8Field(password));
    }
  }
  const keepAliveHeader = new Uint8Array([connectFlags, 0x00, 0x1e]);
  let payloadLength = protoHeader.length + keepAliveHeader.length;
  for (const chunk of chunks) payloadLength += chunk.length;

  const lengthBytes = [];
  let rem = payloadLength;
  do {
    let encodedByte = rem % 128;
    rem = Math.floor(rem / 128);
    if (rem > 0) encodedByte |= 128;
    lengthBytes.push(encodedByte);
  } while (rem > 0);

  const packet = new Uint8Array(1 + lengthBytes.length + payloadLength);
  let offset = 0;
  packet[offset++] = 0x10;
  for (const b of lengthBytes) packet[offset++] = b;
  packet.set(protoHeader, offset);
  offset += protoHeader.length;
  packet.set(keepAliveHeader, offset);
  offset += keepAliveHeader.length;
  for (const chunk of chunks) {
    packet.set(chunk, offset);
    offset += chunk.length;
  }
  return packet;
}

export async function testSignalingConnectivity(
  endpointUrl,
  timeoutMs = 5000,
  credentials = null
) {
  const rawUrl = (endpointUrl || getSignalingUrl() || DEFAULT_SIGNALING_URL).trim();
  const protocol = detectSignalingProtocol(rawUrl);
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const matchedDefault = DEFAULT_SIGNALING_RELAYS.find((relay) => relay.url === rawUrl);
  const username = credentials?.username ?? (matchedDefault?.username || (rawUrl.includes('pa4e2fe9.ala.asia-southeast1.emqxsl.com') ? 'rc_signaling' : ''));
  const password = credentials?.password ?? (matchedDefault?.password || (rawUrl.includes('pa4e2fe9.ala.asia-southeast1.emqxsl.com') ? 'rUpjek-xivfen-byhpi6' : ''));

  return new Promise((resolve) => {
    let resolved = false;
    let timer = null;
    let sock = null;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      if (sock) {
        try {
          if (sock.readyState === 0) {
            const pendingSock = sock;
            pendingSock.onopen = () => {
              try {
                pendingSock.close(1000, 'Diagnostic probe finished');
              } catch (_) {}
            };
            pendingSock.onerror = null;
            pendingSock.onclose = null;
            pendingSock.onmessage = null;
          } else if (sock.readyState === 1) {
            if (protocol === 'mqtt') {
              try {
                sock.send(new Uint8Array([0xe0, 0x00]));
              } catch (_) {}
            }
            sock.close(1000, 'Diagnostic probe finished');
          }
        } catch (_) {}
      }
      resolve(result);
    };

    timer = setTimeout(() => {
      const elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
      finish({
        ok: false,
        rttMs: elapsed,
        error: `Connection timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);

    try {
      const WebSocketConstructor = typeof WebSocket !== 'undefined' ? WebSocket : null;
      if (!WebSocketConstructor) {
        return finish({ ok: false, rttMs: 0, error: 'WebSocket is not supported in this environment' });
      }

      if (protocol === 'mqtt') {
        sock = new WebSocketConstructor(rawUrl, 'mqtt');
        sock.binaryType = 'arraybuffer';
        sock.onopen = () => {
          try {
            const diagClientId = `rc_diag_${Math.random().toString(36).slice(2, 10)}`;
            sock.send(buildMqttDiagnosticConnectPacket(diagClientId, username, password));
          } catch (err) {
            const elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
            finish({ ok: false, rttMs: elapsed, error: err?.message || 'MQTT CONNECT send failed' });
          }
        };
        sock.onmessage = (ev) => {
          const bytes = new Uint8Array(ev.data);
          if (bytes.length >= 4 && (bytes[0] & 0xf0) === 0x20) {
            const returnCode = bytes[3];
            const rttMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
            if (returnCode === 0) {
              finish({ ok: true, rttMs, error: null });
            } else {
              finish({ ok: false, rttMs, error: `MQTT broker rejected auth (CONNACK code ${returnCode})` });
            }
          }
        };
      } else {
        const separator = rawUrl.includes('?') ? '&' : '?';
        const testUrl = `${rawUrl}${separator}ping_test=1&t=${Date.now()}`;
        sock = new WebSocketConstructor(testUrl);
        sock.onopen = () => {
          const rttMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
          finish({ ok: true, rttMs, error: null });
        };
      }

      sock.onerror = () => {
        const rttMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
        finish({ ok: false, rttMs, error: 'WebSocket connection failed (network unreachable or TLS error)' });
      };
      sock.onclose = (ev) => {
        if (!resolved) {
          const rttMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
          finish({ ok: false, rttMs, error: `Connection closed by server (code ${ev.code})` });
        }
      };
    } catch (err) {
      finish({ ok: false, rttMs: 0, error: err?.message || String(err) });
    }
  });
}

export async function testAllSignalingRelays(timeoutMs = 5000) {
  const relays = getSignalingRelays();
  const results = await Promise.all(
    relays.map(async (relay) => {
      const res = await testSignalingConnectivity(relay.url, timeoutMs, {
        username: relay.username,
        password: relay.password,
      });
      return {
        id: relay.id,
        label: relay.label,
        url: relay.url,
        protocol: relay.protocol,
        ok: res.ok,
        rttMs: res.rttMs,
        error: res.error,
      };
    })
  );
  return results;
}
