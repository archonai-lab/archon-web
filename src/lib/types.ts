// Hub protocol types — mirrors src/protocol/messages.ts and src/meeting/types.ts in the hub

export type Phase = "present" | "discuss" | "decide" | "assign";
export type MeetingStatus = "active" | "completed" | "cancelled";
export type RelevanceLevel = "must_speak" | "could_add" | "pass";
export type AgentStatus = "online" | "offline" | "busy";

// --- Inbound (client → hub) ---

export interface AuthMessage {
  type: "auth";
  agentId: string;
  token: string;
}

export interface MeetingCreateMessage {
  type: "meeting.create";
  title: string;
  invitees: string[];
  tokenBudget?: number;
  agenda?: string;
}

export interface MeetingJoinMessage {
  type: "meeting.join";
  meetingId: string;
}

export interface MeetingSpeakMessage {
  type: "meeting.speak";
  meetingId: string;
  content: string;
}

export interface MeetingAdvanceMessage {
  type: "meeting.advance";
  meetingId: string;
}

export interface PingMessage {
  type: "ping";
}

// --- Outbound (hub → client) ---

export interface AuthOkMessage {
  type: "auth.ok";
  agentCard: unknown;
  pendingInvites?: string[];
}

export interface AuthErrorMessage {
  type: "auth.error";
  code: string;
  message: string;
}

export interface MeetingInviteMessage {
  type: "meeting.invite";
  meetingId: string;
  title: string;
  initiator: string;
  agenda?: string;
}

export interface MeetingPhaseChangeMessage {
  type: "meeting.phase_change";
  meetingId: string;
  phase: Phase;
  budgetRemaining: number;
}

export interface MeetingMessageMessage {
  type: "meeting.message";
  meetingId: string;
  agentId: string;
  content: string;
  phase: Phase;
  tokenCount: number;
  budgetRemaining: number;
}

export interface MeetingCompletedMessage {
  type: "meeting.completed";
  meetingId: string;
  decisions: unknown[];
  actionItems: unknown[];
}

export interface MeetingCancelledMessage {
  type: "meeting.cancelled";
  meetingId: string;
  reason: string;
}

export interface DirectoryResultMessage {
  type: "directory.result";
  agents: AgentCard[];
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export interface AgentCard {
  id: string;
  displayName: string;
  description?: string;
  status: AgentStatus;
  departments?: Array<{ id: string; name: string; role: { name: string } }>;
}

// Union of all hub → client messages
export type HubMessage =
  | AuthOkMessage
  | AuthErrorMessage
  | MeetingInviteMessage
  | MeetingPhaseChangeMessage
  | MeetingMessageMessage
  | MeetingCompletedMessage
  | MeetingCancelledMessage
  | DirectoryResultMessage
  | ErrorMessage
  | { type: "pong" };

// Meeting message for display
export interface ChatMessage {
  id: string;
  agentId: string;
  content: string;
  phase: Phase;
  tokenCount: number;
  timestamp: Date;
}

// Meeting state
export interface MeetingState {
  id: string;
  title: string;
  initiator: string;
  agenda?: string;
  phase: Phase;
  status: MeetingStatus;
  budgetRemaining: number;
  messages: ChatMessage[];
  participants: string[];
}
