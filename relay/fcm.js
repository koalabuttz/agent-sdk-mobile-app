import { createHash } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';

export function fcmMessage(token, event) {
  if (typeof token !== 'string' || !token || token.length > 4096) throw new Error('Invalid push token');
  if (!['completion', 'approval'].includes(event.kind)) throw new Error('Invalid notification kind');
  const tag = createHash('sha256').update(event.key).digest('hex');
  return {
    token,
    notification: { title: event.title, body: event.body },
    data: {
      kind: event.kind, agentId: event.agentId, conversationId: event.conversationId,
      eventKey: tag,
    },
    android: {
      priority: 'HIGH', ttl: '3600s',
      notification: { channel_id: 'anna-activity', tag },
    },
  };
}

export class FcmSender {
  constructor({ projectId, keyFilename, fetchImpl = fetch }) {
    if (!/^[a-z][a-z0-9-]+$/.test(projectId)) throw new Error('Invalid Firebase project');
    this.projectId = projectId;
    this.fetch = fetchImpl;
    this.auth = new GoogleAuth({ keyFilename, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
  }
  async send(token, event) {
    const accessToken = await this.auth.getAccessToken();
    if (!accessToken) throw new Error('FCM authentication unavailable');
    const response = await this.fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: fcmMessage(token, event) }), signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return { accepted: true };
    // Never expose upstream response text, which can include token or payload data.
    const body = await response.json().catch(() => ({}));
    const unregistered = body.error?.details?.some(d => d.errorCode === 'UNREGISTERED');
    return { accepted: false, unregister: Boolean(unregistered), retryable: response.status === 429 || response.status >= 500, status: response.status };
  }
}
