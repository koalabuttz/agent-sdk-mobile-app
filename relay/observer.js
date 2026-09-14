import WebSocket from 'ws';
import { observerSubscription } from './subscription.js';
import { protocolNotification } from './protocol-events.js';

// Only list/sync commands are permitted. Never sends tool responses or user input.
export class Observer {
  constructor({ url, token, agentId, onEvent, onHealth = () => {} }) {
    Object.assign(this, { url, token, agentId, onEvent, onHealth });
    this.stopped = false; this.backoff = 1000; this.scopes = new Map(); this.approvals = new Map();
  }
  start() {
    if (this.stopped) return;
    const ws = this.ws = new WebSocket(this.url, { headers: { Authorization: `Bearer ${this.token}` }, handshakeTimeout: 15000, maxPayload: 8*1024*1024 });
    let alive = true;
    const interval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (!alive) { ws.terminate(); return; }
      alive = false; ws.ping(); this.discover();
    }, 30000);
    ws.on('pong', () => { alive = true; });
    ws.on('open', () => { this.backoff = 1000; this.scopes.clear(); this.onHealth(true); this.discover(); });
    ws.on('message', raw => {
      try { this.receive(JSON.parse(raw.toString())); }
      catch { this.onHealth(false); ws.terminate(); }
    });
    ws.on('error', () => this.onHealth(false));
    ws.on('close', () => {
      clearInterval(interval); this.approvals.clear(); this.onHealth(false);
      if (!this.stopped) { this.timer = setTimeout(() => this.start(), this.backoff); this.backoff = Math.min(this.backoff * 2, 60000); }
    });
  }
  send(command) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(command)); }
  discover(after) {
    this.send({ type: 'conversation_list', request_id: 'relay-list', query: { agent_id: this.agentId, limit: 100, ...(after ? { after } : {}) } });
  }
  receive(message) {
    if (message.type === 'conversation_list_response' && message.request_id === 'relay-list') {
      if (!message.success || !Array.isArray(message.conversations)) return;
      for (const conversation of message.conversations) {
        if (typeof conversation.id !== 'string' || !conversation.id) continue;
        if (conversation.agent_id && conversation.agent_id !== this.agentId) continue;
        const scope = { agent_id: this.agentId, conversation_id: conversation.id };
        this.scopes.set(conversation.id, scope);
        this.send(observerSubscription(this.agentId, conversation.id, `relay-sync-${conversation.id}`));
      }
      // The v0.32.3 protocol returns an array, not a continuation token.
      // Newest 100 are monitored; do not silently guess a pagination field.
      return;
    }
    const scope = this.scopes.get(message.runtime?.conversation_id);
    if (!scope || message.runtime?.agent_id !== this.agentId) return;
    if (message.type === 'update_device_status' && Array.isArray(message.device_status?.pending_control_requests)) {
      this.approvals.set(scope.conversation_id, {
        at: Date.now(), ids: new Set(message.device_status.pending_control_requests.map(r => r.request_id)),
      });
    }
    const event = protocolNotification(message, scope);
    if (event) this.onEvent(event);
  }
  approvalPending(event, now = Date.now()) {
    const state = this.approvals.get(event.conversationId);
    if (!state || now - state.at > 45000) return null;
    return state.ids.has(event.requestId);
  }
  close() { this.stopped = true; clearTimeout(this.timer); this.ws?.close(); }
}
