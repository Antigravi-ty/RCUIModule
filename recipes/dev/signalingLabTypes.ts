import type { PanelSizingConfig } from '../../tokens/menuLayoutTokens';

export type SignalingLabScenarioId =
  | 'emqx-direct'
  | 'supabase-direct'
  | 'bridge-sb-to-emqx'
  | 'bridge-emqx-to-sb'
  | 'bridge-bidirectional'
  | 'anti-loop-torture';

export interface SignalingLabEndpointViewConfig {
  emqx1Url: string;
  emqx1Username: string;
  supabase1Url: string;
  edgeFunctionBridgeUrl: string;
  topicNamespace: string;
}

export interface SignalingLabPacketTraceItem {
  id: string;
  ts: number;
  direction: 'TX' | 'RX' | 'BRG' | 'GUARD' | 'SYS';
  channel: 'dir' | 'brg' | 'edge' | 'crypto';
  relayId: string;
  topic: string;
  hop: number;
  summary: string;
  latencyMs?: number;
  ok: boolean;
}

export interface SignalingLabCloudAuditLogItem {
  id: string;
  ts: number;
  event: string;
  topicHash: string;
  comingFrom: string;
  targets: string[];
  hop: number;
  msgId: string;
  status: string;
  detail?: string;
  latencyMs?: number;
}

export interface SignalingLabCloudStatsView {
  ok: boolean;
  totalForwardedCount: number;
  totalDroppedLoopCount: number;
  totalRateLimitedCount: number;
  dedupCacheSize: number;
  warmMqttConnections: number;
  logs: SignalingLabCloudAuditLogItem[];
}

export interface SignalingLabProbeSummaryView {
  emqx1Ok: boolean;
  emqx1RttMs: number;
  emqx1Error: string | null;
  supabase1Ok: boolean;
  supabase1RttMs: number;
  supabase1Error: string | null;
  computedMask: number;
  sampleRandomCode: string;
  sampleCustomCode: string;
  cloudStats: SignalingLabCloudStatsView | null;
}

export interface Layer4DevSignalingLabRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  sizing?: PanelSizingConfig;
  endpointConfig?: SignalingLabEndpointViewConfig;
  probeSummary?: SignalingLabProbeSummaryView | null;
  traces?: SignalingLabPacketTraceItem[];
  roomCode?: string;
  onRoomCodeChange?: (next: string) => void;
  roomPassword?: string;
  onRoomPasswordChange?: (next: string) => void;
  isBusy?: boolean;
  activeActionLabel?: string | null;
  lastResultBanner?: { ok: boolean; text: string } | null;
  onProbeAll?: () => void;
  onCloudSelfTest?: () => void;
  onRunScenario?: (scenario: SignalingLabScenarioId, label: string) => void;
  onClearTraces?: () => void;
}

export const DEFAULT_PLACEHOLDER_ENDPOINT_CONFIG: SignalingLabEndpointViewConfig = {
  emqx1Url: 'wss://relay.carsoccer.dev:8084/mqtt',
  emqx1Username: 'rc_client_placeholder',
  supabase1Url: 'https://relay-sb.carsoccer.dev',
  edgeFunctionBridgeUrl: 'https://relay-sb.carsoccer.dev/functions/v1/signaling-bridge',
  topicNamespace: 'rc_sig_v2',
};

export function buildEmqxBridgeRuleSql(topicNamespace: string): string {
  const cleanNs = (topicNamespace || 'rc_sig_v2').replace(/\/+$/, '');
  return `SELECT
  topic,
  payload,
  username,
  clientid,
  timestamp
FROM
  "${cleanNs}/brg/+"
WHERE
  username <> 'CNRCEdgeBridgeV2'`;
}
