class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isManualDisconnect = false;
    this.url = (import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws");
  }

  connect() {
    this.isManualDisconnect = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch {
          // ignore non-json messages
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        if (!this.isManualDisconnect && this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
            this.socket.close();
          } catch {}
        }
      };
    } catch {
      if (!this.isManualDisconnect) {
        this.scheduleReconnect();
      }
    }
  }

  scheduleReconnect() {
    if (this.isManualDisconnect) return;
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        if (!this.isManualDisconnect) {
          this.connect();
        }
      }, 5000);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error("Listener error:", err);
      }
    });
  }

  disconnect() {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      const sock = this.socket;
      this.socket = null;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onclose = null;
      sock.onerror = null;
      if (sock.readyState === WebSocket.OPEN) {
        try {
          sock.close();
        } catch {}
      } else if (sock.readyState === WebSocket.CONNECTING) {
        sock.onopen = () => {
          try {
            sock.close();
          } catch {}
        };
      }
    }
    this.isConnected = false;
  }
}

export const wsService = new WebSocketService();
