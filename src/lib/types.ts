// Hub protocol types — mirrors src/protocol/messages.ts and src/meeting/types.ts in the hub

/** Phase is now a free-form string — methodology defines the valid phases. */
export type Phase = string;
export type MeetingStatus = "active" | "completed" | "cancelled";
export type RelevanceLevel = "must_speak" | "could_add" | "pass";
export type AgentStatus = "active" | "deactivated";
export type VoteChoice = "approve" | "reject" | "abstain";

/** Default phase order for the built-in "general" methodology. */
export const DEFAULT_PHASES = ["present", "discuss", "decide", "assign"];

// --- Inbound (client → hub) ---

export interface AuthMessage {
  type: "auth";
  agentId: string;
  token: string;
}

export interface AgentCreateMessage {
  type: "agent.create";
  name: string;
  displayName: string;
  departments?: Array<{ departmentId: string; roleId: string }>;
  role?: string;
  modelConfig?: Record<string, unknown>;
}

export interface AgentUpdateMessage {
  type: "agent.update";
  agentId: string;
  displayName?: string;
  departments?: Array<{ departmentId: string; roleId: string }>;
  modelConfig?: Record<string, unknown>;
}

export interface AgentDeleteMessage {
  type: "agent.delete";
  agentId: string;
}

export interface DepartmentListMessage {
  type: "department.list";
}

export interface DepartmentCreateMessage {
  type: "department.create";
  name: string;
  description?: string;
}

export interface DepartmentUpdateMessage {
  type: "department.update";
  departmentId: string;
  name?: string;
  description?: string;
}

export interface DepartmentDeleteMessage {
  type: "department.delete";
  departmentId: string;
}

export interface RoleListMessage {
  type: "role.list";
  departmentId?: string;
}

export interface RoleCreateMessage {
  type: "role.create";
  departmentId: string;
  name: string;
  permissions?: string[];
}

export interface RoleUpdateMessage {
  type: "role.update";
  roleId: string;
  name?: string;
  permissions?: string[];
}

export interface RoleDeleteMessage {
  type: "role.delete";
  roleId: string;
}

export interface MeetingCreateMessage {
  type: "meeting.create";
  title: string;
  invitees: string[];
  tokenBudget?: number;
  agenda?: string;
  methodology?: string;
  summaryMode?: "off" | "structured" | "llm";
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

export interface MeetingAcknowledgeMessage {
  type: "meeting.acknowledge";
  meetingId: string;
  taskIndex: number;
}

export interface MeetingHistoryRequestMessage {
  type: "meeting.history";
  status?: MeetingStatus;
  cursor?: string;
  limit?: number;
}

export interface MeetingTranscriptRequestMessage {
  type: "meeting.transcript";
  meetingId: string;
}

export interface TaskListRequestMessage {
  type: "task.list";
}

export interface PingMessage {
  type: "ping";
}

// --- Outbound (hub → client) ---

export interface AuthOkMessage {
  type: "auth.ok";
  agentCard: unknown;
  pendingInvites?: string[];
  activeMeetings?: Array<{
    meetingId: string;
    title: string;
    phase: string;
    initiator: string;
    participants?: string[];
    budgetRemaining?: number;
  }>;
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
  summary?: string;
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

export interface DirectoryUpdatedMessage {
  type: "directory.updated";
}

export interface AgentCreatedMessage {
  type: "agent.created";
  agentId: string;
  displayName: string;
}

export interface AgentUpdatedMessage {
  type: "agent.updated";
  agentId: string;
}

export interface AgentDeletedMessage {
  type: "agent.deleted";
  agentId: string;
}

export interface DepartmentResultMessage {
  type: "department.result";
  departments: Department[];
}

export interface DepartmentCreatedMessage {
  type: "department.created";
  departmentId: string;
  name: string;
}

export interface DepartmentUpdatedMessage {
  type: "department.updated";
  departmentId: string;
}

export interface DepartmentDeletedMessage {
  type: "department.deleted";
  departmentId: string;
}

export interface RoleResultMessage {
  type: "role.result";
  roles: Role[];
}

export interface RoleCreatedMessage {
  type: "role.created";
  roleId: string;
  name: string;
  departmentId: string;
}

export interface RoleUpdatedMessage {
  type: "role.updated";
  roleId: string;
}

export interface RoleDeletedMessage {
  type: "role.deleted";
  roleId: string;
}

export interface MeetingHistoryResultMessage {
  type: "meeting.history.result";
  meetings: MeetingSummary[];
}

export interface MeetingTranscriptResultMessage {
  type: "meeting.transcript.result";
  meeting: {
    id: string;
    title: string;
    status: string;
    methodology: string;
    initiatorId: string;
    agenda: unknown;
    decisions: unknown[];
    actionItems: unknown[];
    summary: string | null;
    createdAt: string;
    completedAt: string | null;
  };
  messages: TranscriptEntry[];
  participants: string[];
}

export interface MeetingActiveListResultMessage {
  type: "meeting.active_list.result";
  meetings: Array<{
    meetingId: string;
    title: string;
    phase: string;
    initiator: string;
    participants: string[];
    status: string;
  }>;
}

export interface AgentsSpawnedMessage {
  type: "agents.spawned";
  meetingId: string;
  agentIds: string[];
}

export interface AgentsSpawnFailedMessage {
  type: "agents.spawn_failed";
  meetingId: string;
  failures: Array<{ agentId: string; reason: string }>;
}

export interface AgentProcessErrorMessage {
  type: "agent.process_error";
  agentId: string;
  reason: string;
}

export interface AgentsDespawnedMessage {
  type: "agents.despawned";
  meetingId: string;
  agentIds: string[];
}

export type TaskStatus = "pending" | "in_progress" | "done" | "failed";

export interface WorkflowTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignedTo: string | null;
  assignedBy: string | null;
  meetingId: string | null;
  repoScope: unknown;
  projectTag?: string | null;
  workflowName?: string | null;
  execId?: string | null;
  codexSessionId?: string | null;
  model?: string | null;
  durationMs?: number | null;
  exitCode?: number | null;
  worktree?: string | null;
  gitSha?: string | null;
  result: string | null;
  version: number;
  changedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreatedMessage {
  type: "task.created";
  task: WorkflowTask;
}

export interface TaskUpdatedMessage {
  type: "task.updated";
  task: WorkflowTask;
}

export interface TaskListResultMessage {
  type: "task.list.result";
  tasks: WorkflowTask[];
  total: number;
}

export interface TaskGetResultMessage {
  type: "task.get.result";
  task: WorkflowTask;
}

export interface ConfigResultMessage {
  type: "config.result";
  config: HubConfig;
}

export interface HubConfig {
  llmAvailable: boolean;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
}

export interface MeetingRelevanceCheckMessage {
  type: "meeting.relevance_check";
  meetingId: string;
  lastMessage: { agentId: string; content: string };
  phase: string;
  contextSummary: string;
}

export interface MeetingYourTurnMessage {
  type: "meeting.your_turn";
  meetingId: string;
  phase: string;
  budgetRemaining: number;
}

export interface MeetingAwaitingApprovalMessage {
  type: "meeting.awaiting_approval";
  meetingId: string;
  currentPhase: string;
  nextPhase: string;
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
  activity?: string; // "idle", "connected", "spawning", "in_meeting:<title>"
  departments?: Array<{ id: string; name: string; role: { name: string } }>;
  model?: { provider: string; backend: string } | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  departmentId: string;
  name: string;
  permissions: string[];
  createdAt: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  status: string;
  phase: string;
  methodology: string;
  initiatorId: string;
  tokensUsed: number;
  tokenBudget: number;
  createdAt: string;
  completedAt: string | null;
  participantCount: number;
  messageCount: number;
}

export interface TranscriptEntry {
  id: number;
  agentId: string;
  displayName: string;
  phase: string;
  content: string;
  tokenCount: number;
  relevance: string | null;
  createdAt: string;
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
  | DirectoryUpdatedMessage
  | AgentCreatedMessage
  | AgentUpdatedMessage
  | AgentDeletedMessage
  | DepartmentResultMessage
  | DepartmentCreatedMessage
  | DepartmentUpdatedMessage
  | DepartmentDeletedMessage
  | RoleResultMessage
  | RoleCreatedMessage
  | RoleUpdatedMessage
  | RoleDeletedMessage
  | MeetingActiveListResultMessage
  | MeetingHistoryResultMessage
  | MeetingTranscriptResultMessage
  | TaskCreatedMessage
  | TaskUpdatedMessage
  | TaskListResultMessage
  | TaskGetResultMessage
  | AgentsSpawnedMessage
  | AgentsSpawnFailedMessage
  | AgentProcessErrorMessage
  | AgentsDespawnedMessage
  | MeetingRelevanceCheckMessage
  | MeetingYourTurnMessage
  | MeetingAwaitingApprovalMessage
  | ConfigResultMessage
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
  /** Generated summary after meeting completion. */
  summary?: string;
  /** Active relevance check awaiting human response. */
  relevanceCheck?: { lastMessage: { agentId: string; content: string }; phase: string };
  /** True when it's the human's turn to speak. */
  isMyTurn?: boolean;
  /** Phase transition awaiting approval. */
  awaitingApproval?: { currentPhase: string; nextPhase: string };
}

// Toast notification
export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
}
