// Adaptador aislado de datos. No envía órdenes ni utiliza credenciales.
const PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

export class MarketDataClient {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.socket = null;
    this.selectedSymbol = null;
    this.retry = null;
    this.closedByUser = false;
  }
  connect() {
    this.closedByUser = false;
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.handlers.onStatus?.({ connected: false, label: "CONECTANDO" });
    try {
      this.socket = new WebSocket(PUBLIC_WS);
      this.socket.addEventListener("open", () => {
        this.handlers.onStatus?.({ connected: true, label: "CONECTADO" });
        this.send({ active_symbols: "brief", product_type: "basic" });
        if (this.selectedSymbol) this.subscribe(this.selectedSymbol);
      });
      this.socket.addEventListener("message", event => this.handleMessage(event.data));
      this.socket.addEventListener("error", () => this.handlers.onError?.("No se pudo establecer conexión con Deriv."));
      this.socket.addEventListener("close", () => {
        this.handlers.onStatus?.({ connected: false, label: "DESCONECTADO" });
        if (!this.closedByUser) this.retry = setTimeout(() => this.connect(), 4000);
      });
    } catch {
      this.handlers.onStatus?.({ connected: false, label: "SIN CONEXIÓN" });
    }
  }
  send(payload) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(payload));
  }
  subscribe(symbol) {
    this.selectedSymbol = symbol;
    this.send({ ticks: symbol, subscribe: 1 });
  }
  handleMessage(raw) {
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    if (message.error) {
      this.handlers.onError?.(message.error.message || "Error del proveedor de datos.");
      return;
    }
    if (Array.isArray(message.active_symbols)) {
      const list = message.active_symbols
        .filter(item => /volatility/i.test(item.display_name || item.symbol || ""))
        .map(item => ({ symbol: item.symbol, display_name: item.display_name }))
        .filter(item => item.symbol);
      this.handlers.onSymbols?.(list);
    }
    if (message.tick) {
      this.handlers.onTick?.({
        symbol: message.tick.symbol,
        quote: message.tick.quote,
        epoch: message.tick.epoch
      });
    }
  }
  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.retry);
    this.socket?.close();
    this.socket = null;
  }
}