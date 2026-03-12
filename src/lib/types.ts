// Hub protocol types — mirrors src/protocol/messages.ts and src/meeting/types.ts in the hub

/** Phase is now a free-form string — methodology defines the valid phases. */
export type Phase = string;
export type MeetingStatus = "active" | "completed" | "cancelled";
export type RelevanceLevel = "must_speak" | "could_add" | "pass";
export type AgentStatus = "online" | "offline" | "busy";
export type VoteChoice = "approve" | "reject" | "abstain";

/** Default phase order for the built-in "general" methodology. */
export const DEFAULT_PHASES = ["present", "discuss", "decide", "assign"];

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
  methodology?: string;
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

export interface MeetingProposeMessage {
  type: "meeting.propose";
  meetingId: string;
  proposal: string;
}

export interface MeetingVoteMessage {
  type: "meeting.vote";
  meetingId: string;
  proposalIndex: number;
  vote: VoteChoice;
  reason?: string;
}

export interface MeetingAssignMessage {
  type: "meeting.assign";
  meetingId: string;
  task: string;
  assigneeId: string;
  deadline?: string;
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

export interface MeetingCreatedMessage {
  type: "meeting.created";
  meetingId: string;
  title: string;
  participants: string[];
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
  phase: string;
  budgetRemaining: number;
  phaseDescription?: string;
  capabilities?: string[];
}

export interface MeetingMessageMessage {
  type: "meeting.message";
  meetingId: string;
  agentId: string;
  content: string;
  phase: string;
  tokenCount: number;
  budgetRemaining: number;
}

export interface MeetingProposalMessage {
  type: "meeting.proposal";
  meetingId: string;
  proposalIndex: number;
  agentId: string;
  proposal: string;
}

export interface MeetingVoteResultMessage {
  type: "meeting.vote_result";
  meetingId: string;
  proposalIndex: number;
  agentId: string;
  vote: VoteChoice;
  reason?: string;
}

export interface MeetingActionItemMessage {
  type: "meeting.action_item";
  meetingId: string;
  taskIndex: number;
  task: string;
  assigneeId: string;
  assignedBy: string;
  deadline?: string;
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
  | MeetingCreatedMessage
  | MeetingInviteMessage
  | MeetingPhaseChangeMessage
  | MeetingMessageMessage
  | MeetingProposalMessage
  | MeetingVoteResultMessage
  | MeetingActionItemMessage
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
  phase: string;
  tokenCount: number;
  timestamp: Date;
}

// Proposal with accumulated votes
export interface Proposal {
  agentId: string;
  proposal: string;
  votes: Vote[];
}

export interface Vote {
  agentId: string;
  vote: VoteChoice;
  reason?: string;
}

// Action item assigned during ASSIGN phase
export interface ActionItem {
  taskIndex: number;
  task: string;
  assigneeId: string;
  assignedBy: string;
  deadline?: string;
}

// Meeting state
export interface MeetingState {
  id: string;
  title: string;
  initiator: string;
  agenda?: string;
  phase: string;
  status: MeetingStatus;
  budgetRemaining: number;
  messages: ChatMessage[];
  participants: string[];
  proposals: Proposal[];
  actionItems: ActionItem[];
  /** Ordered phase names from the methodology (populated on first phase_change). */
  phases: string[];
  /** Current phase capabilities (updated on each phase_change). */
  capabilities: string[];
  /** Current phase description (updated on each phase_change). */
  phaseDescription?: string;
}

// Toast notification
export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
}
