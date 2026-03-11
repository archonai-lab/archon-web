import type { HubMessage, MeetingState, ChatMessage, Phase } from "./types";

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

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this._url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ type: "auth", agentId: this._agentId, token: this._agentId }));
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30_000);
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as HubMessage;
      this.handleMessage(msg);
      for (const fn of this.listeners) fn(msg);
    };

    this.ws.onclose = () => {
      this._connected = false;
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.scheduleReconnect();
      this.notify({ type: "auth.error", code: "DISCONNECTED", message: "Connection lost" });
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = null;
    this._connected = false;
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

  createMeeting(title: string, invitees: string[], agenda?: string, tokenBudget?: number): void {
    this.send({ type: "meeting.create", title, invitees, agenda, tokenBudget });
  }

  joinMeeting(meetingId: string): void {
    this.send({ type: "meeting.join", meetingId });
  }

  advanceMeeting(meetingId: string): void {
    this.send({ type: "meeting.advance", meetingId });
  }

  listAgents(): void {
    this.send({ type: "directory.list" });
  }

  private handleMessage(msg: HubMessage): void {
    switch (msg.type) {
      case "auth.ok":
        this._connected = true;
        // Request agent list on connect
        this.listAgents();
        break;

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
            phase: msg.phase as Phase,
            tokenCount: msg.tokenCount,
            timestamp: new Date(),
          };
          m.messages.push(chatMsg);
          m.budgetRemaining = msg.budgetRemaining;
        }
        break;
      }

      case "meeting.completed": {
        const m = this.meetings.get(msg.meetingId);
        if (m) m.status = "completed";
        break;
      }

      case "meeting.cancelled": {
        const m = this.meetings.get(msg.meetingId);
        if (m) m.status = "cancelled";
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
