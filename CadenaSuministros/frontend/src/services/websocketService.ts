import { Client } from '@stomp/stompjs';

type Handler = (body: any) => void;

class WsService {
  private client: Client | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private stompSubs = new Map<string, any>();

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client({
        webSocketFactory: () => new WebSocket('/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      this.client.onConnect = () => {
        for (const [topic] of this.handlers) {
          if (!this.stompSubs.has(topic)) {
            this.doSubscribe(topic);
          }
        }
      };
    }
    return this.client;
  }

  private doSubscribe(topic: string) {
    const client = this.getClient();
    if (!client.connected) return;

    const handlers = this.handlers.get(topic);
    if (!handlers || handlers.size === 0) return;

    const sub = client.subscribe(topic, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        handlers.forEach((h) => h(body));
      } catch {
        /* ignore parse errors */
      }
    });
    this.stompSubs.set(topic, sub);
  }

  subscribe(topic: string, handler: Handler): () => void {
    const client = this.getClient();

    let handlers = this.handlers.get(topic);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(topic, handlers);
    }
    handlers.add(handler);

    if (client.connected && !this.stompSubs.has(topic)) {
      this.doSubscribe(topic);
    } else if (!client.connected) {
      client.activate();
    }

    return () => {
      handlers?.delete(handler);
      if (handlers && handlers.size === 0) {
        this.handlers.delete(topic);
        const sub = this.stompSubs.get(topic);
        if (sub) {
          sub.unsubscribe();
          this.stompSubs.delete(topic);
        }
      }
    };
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.stompSubs.clear();
    this.handlers.clear();
  }
}

export const wsService = new WsService();
