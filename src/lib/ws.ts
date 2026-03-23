import type { HubMessage, MeetingState, ChatMessage, Proposal, VoteChoice, RelevanceLevel } from "./types";

type Listener = (msg: HubMessage) => void;

export class HubConnection {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private _connected = false;
  private _agentId: string;
  private _url: string;

  // Meeting state
  meetings = new Map<string, MeetingState>();

  constructor(url = "ws://localhost:9500", agentId = "ceo") {
    this._url = url;
    this._agentId = agentId;
  }

  get connected() { return this._connected; }
  get agentId() { return this._agentId; }
  get url() { return this._url; }

  /** Reconfigure and reconnect with new identity / URL */
  reconnect(agentId: string, url?: string): void {
    this.disconnect();
    this.meetings.clear();
    this._agentId = agentId;
    if (url) this._url = url;
    this.connect();
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    let ws: WebSocket;
    try {
      ws = new WebSocket(this._url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", agentId: this._agentId, token: this._agentId }));
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30_000);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as HubMessage;
      this.handleMessage(msg);
      for (const fn of this.listeners) fn(msg);
    };

    ws.onclose = () => {
      // Ignore close events from stale sockets (e.g. after reconnect())
      if (this.ws !== ws) return;

      this._connected = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.scheduleReconnect();
      this.notify({ type: "auth.error", code: "DISCONNECTED", message: "Connection lost" });
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    const ws = this.ws;
    this.ws = null;         // null out first so onclose sees it as stale
    this._connected = false;
    ws?.close();
  }

  send(msg: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  createMeeting(title: string, invitees: string[], agenda?: string, tokenBudget?: number, methodology?: string, summaryMode?: "off" | "structured" | "llm"): void {
    this.send({
      type: "meeting.create",
      title,
      invitees,
      agenda,
      tokenBudget,
      ...(methodology ? { methodology } : {}),
      ...(summaryMode && summaryMode !== "off" ? { summaryMode } : {}),
    });
  }

  joinMeeting(meetingId: string): void {
    this.send({ type: "meeting.join", meetingId });
  }

  speakInMeeting(meetingId: string, content: string): void {
    this.send({ type: "meeting.speak", meetingId, content });
    // Clear turn state after speaking
    const m = this.meetings.get(meetingId);
    if (m) m.isMyTurn = false;
  }

  advanceMeeting(meetingId: string): void {
    this.send({ type: "meeting.advance", meetingId });
    // Clear approval state
    const m = this.meetings.get(meetingId);
    if (m) m.awaitingApproval = undefined;
  }

  cancelMeeting(meetingId: string, reason?: string): void {
    this.send({ type: "meeting.cancel", meetingId, reason });
  }

  // --- Agent CRUD ---

  createAgent(name: string, displayName: string, opts?: {
    departments?: Array<{ departmentId: string; roleId: string }>;
    role?: string;
    modelConfig?: Record<string, unknown>;
  }): void {
    this.send({ type: "agent.create", name, displayName, ...opts });
  }

  updateAgent(agentId: string, opts: {
    displayName?: string;
    departments?: Array<{ departmentId: string; roleId: string }>;
    modelConfig?: Record<string, unknown>;
  }): void {
    this.send({ type: "agent.update", agentId, ...opts });
  }

  deleteAgent(agentId: string): void {
    this.send({ type: "agent.delete", agentId });
  }

  reactivateAgent(agentId: string): void {
    this.send({ type: "agent.reactivate", agentId });
  }

  // --- Department CRUD ---

  listDepartments(): void {
    this.send({ type: "department.list" });
  }

  createDepartment(name: string, description?: string): void {
    this.send({ type: "department.create", name, description });
  }

  updateDepartment(departmentId: string, opts: { name?: string; description?: string }): void {
    this.send({ type: "department.update", departmentId, ...opts });
  }

  deleteDepartment(departmentId: string): void {
    this.send({ type: "department.delete", departmentId });
  }

  // --- Role CRUD ---

  listRoles(departmentId?: string): void {
    this.send({ type: "role.list", departmentId });
  }

  createRole(departmentId: string, name: string, permissions?: string[]): void {
    this.send({ type: "role.create", departmentId, name, permissions });
  }

  updateRole(roleId: string, opts: { name?: string; permissions?: string[] }): void {
    this.send({ type: "role.update", roleId, ...opts });
  }

  deleteRole(roleId: string): void {
    this.send({ type: "role.delete", roleId });
  }

  // --- Meeting participation ---

  proposeInMeeting(meetingId: string, proposal: string): void {
    this.send({ type: "meeting.propose", meetingId, proposal });
  }

  voteInMeeting(meetingId: string, proposalIndex: number, vote: VoteChoice, reason?: string): void {
    this.send({ type: "meeting.vote", meetingId, proposalIndex, vote, reason });
  }

  assignInMeeting(meetingId: string, task: string, assigneeId: string, deadline?: string): void {
    this.send({ type: "meeting.assign", meetingId, task, assigneeId, deadline });
  }

  acknowledgeInMeeting(meetingId: string, taskIndex: number): void {
    this.send({ type: "meeting.acknowledge", meetingId, taskIndex });
  }

  sendRelevance(meetingId: string, level: RelevanceLevel): void {
    this.send({ type: "meeting.relevance", meetingId, level });
    // Clear relevance check state
    const m = this.meetings.get(meetingId);
    if (m) m.relevanceCheck = undefined;
  }

  approveMeeting(meetingId: string): void {
    this.send({ type: "meeting.approve", meetingId });
  }

  leaveMeeting(meetingId: string): void {
    this.send({ type: "meeting.leave", meetingId });
  }

  // --- Hub config ---

  getConfig(): void {
    this.send({ type: "config.get" });
  }

  setConfig(key: string, value: unknown): void {
    this.send({ type: "config.set", key, value });
  }

  // --- Active meetings ---

  listActiveMeetings(): void {
    this.send({ type: "meeting.active_list" });
  }

  // --- Meeting history ---

  listMeetingHistory(opts?: { status?: string; cursor?: string; limit?: number }): void {
    this.send({ type: "meeting.history", ...opts });
  }

  getMeetingTranscript(meetingId: string): void {
    this.send({ type: "meeting.transcript", meetingId });
  }

  // --- Directory ---

  listAgents(): void {
    this.send({ type: "directory.list" });
  }

  private handleMessage(msg: HubMessage): void {
    switch (msg.type) {
      case "auth.ok":
        this._connected = true;
        // Request agent list, departments, and config on connect
        this.listAgents();
        this.listDepartments();
        this.listRoles();
        this.getConfig();
        // Restore active meetings on reconnect
        if (msg.activeMeetings) {
          for (const m of msg.activeMeetings) {
            if (!this.meetings.has(m.meetingId)) {
              this.meetings.set(m.meetingId, {
                id: m.meetingId,
                title: m.title,
                initiator: m.initiator,
                phase: m.phase,
                status: "active",
                budgetRemaining: m.budgetRemaining ?? 0,
                messages: [],
                participants: m.participants ?? [],
                proposals: [],
                actionItems: [],
                phases: [m.phase],
                capabilities: [],
              });
            }
          }
        }
        break;

      case "directory.updated":
        // Refresh agent list when directory changes
        this.listAgents();
        break;

      case "meeting.created": {
        const state: MeetingState = {
          id: msg.meetingId,
          title: msg.title,
          initiator: this._agentId,
          phase: "present",
          status: "active",
          budgetRemaining: 0,
          messages: [],
          participants: msg.participants,
          proposals: [],
          actionItems: [],
          phases: [],
          capabilities: [],
        };
        this.meetings.set(msg.meetingId, state);
        break;
      }

      case "meeting.invite": {
        const state: MeetingState = {
          id: msg.meetingId,
          title: msg.title,
          initiator: msg.initiator,
          agenda: msg.agenda,
          phase: "present",
          status: "active",
          budgetRemaining: 0,
          messages: [],
          participants: [],
          proposals: [],
          actionItems: [],
          phases: [],
          capabilities: [],
        };
        this.meetings.set(msg.meetingId, state);
        // Auto-join as observer
        this.joinMeeting(msg.meetingId);
        break;
      }

      case "meeting.phase_change": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.phase = msg.phase;
          m.budgetRemaining = msg.budgetRemaining;
          m.phaseDescription = msg.phaseDescription;
          m.capabilities = msg.capabilities ?? [];

          // Build up phases list as we see new phases
          if (!m.phases.includes(msg.phase)) {
            m.phases.push(msg.phase);
          }
        }
        break;
      }

      case "meeting.message": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          const chatMsg: ChatMessage = {
            id: `${msg.meetingId}-${m.messages.length}`,
            agentId: msg.agentId,
            content: msg.content,
            phase: msg.phase,
            tokenCount: msg.tokenCount,
            timestamp: new Date(),
          };
          m.messages.push(chatMsg);
          m.budgetRemaining = msg.budgetRemaining;
        }
        break;
      }

      case "meeting.proposal": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          // Ensure array is long enough for this index
          while (m.proposals.length <= msg.proposalIndex) {
            m.proposals.push({ agentId: "", proposal: "", votes: [] });
          }
          const p: Proposal = {
            agentId: msg.agentId,
            proposal: msg.proposal,
            votes: [],
          };
          m.proposals[msg.proposalIndex] = p;
        }
        break;
      }

      case "meeting.vote_result": {
        const m = this.meetings.get(msg.meetingId);
        if (m && m.proposals[msg.proposalIndex]) {
          m.proposals[msg.proposalIndex].votes.push({
            agentId: msg.agentId,
            vote: msg.vote,
            reason: msg.reason,
          });
        }
        break;
      }

      case "meeting.action_item": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.actionItems.push({
            taskIndex: msg.taskIndex,
            task: msg.task,
            assigneeId: msg.assigneeId,
            assignedBy: msg.assignedBy,
            deadline: msg.deadline,
          });
        }
        break;
      }

      case "meeting.completed": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.status = "completed";
          if (msg.summary) m.summary = msg.summary;
        }
        break;
      }

      case "meeting.cancelled": {
        const m = this.meetings.get(msg.meetingId);
        if (m) m.status = "cancelled";
        break;
      }

      case "meeting.relevance_check": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.relevanceCheck = {
            lastMessage: msg.lastMessage,
            phase: msg.phase,
          };
          // Clear previous turn state
          m.isMyTurn = false;
        }
        break;
      }

      case "meeting.your_turn": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.isMyTurn = true;
          m.budgetRemaining = msg.budgetRemaining;
          // Clear relevance check (we already responded)
          m.relevanceCheck = undefined;
        }
        break;
      }

      case "meeting.awaiting_approval": {
        const m = this.meetings.get(msg.meetingId);
        if (m) {
          m.awaitingApproval = {
            currentPhase: msg.currentPhase,
            nextPhase: msg.nextPhase,
          };
        }
        break;
      }
    }
  }

  private notify(msg: HubMessage): void {
    for (const fn of this.listeners) fn(msg);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}
