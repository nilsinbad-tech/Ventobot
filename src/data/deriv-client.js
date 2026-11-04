// Datos públicos de Deriv. Solo consulta mercado; nunca envía órdenes.
const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";

export class MarketDataClient {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.socket = null;
    this.selectedSymbol = null;
    this.retryTimer = null;
    this.requestId = 0;
    this.pendingHistory = null;
    this.closedByUser = false;
    this.connecting = false;
  }
  connect() {
    this.closedByUser = false;
    if (this.connecting || (this.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState))) return;
    this.connecting = true;
    this.handlers.onStatus?.({ connected: false, label: "CONECTANDO" });
    try {
      const ws = new WebSocket(WS_URL);
      this.socket = ws;
      ws.addEventListener("open", () => {
        this.connecting = false;
        this.handlers.onStatus?.({ connected: true, label: "CONECTADO" });
        this.send({ active_symbols: "brief", product_type: "basic" });
        if (this.selectedSymbol) this.loadCandles(this.selectedSymbol);
      });
      ws.addEventListener("message", event => this.handleMessage(event.data));
      ws.addEventListener("error", () => this.handlers.onError?.("Deriv no respondió. Comprueba la conexión a internet."));
      ws.addEventListener("close", () => {
        this.connecting = false;
        this.handlers.onStatus?.({ connected: false, label: "DESCONECTADO" });
        if (!this.closedByUser) this.retryTimer = setTimeout(() => this.connect(), 5000);
      });
    } catch {
      this.connecting = false;
      this.handlers.onStatus?.({ connected: false, label: "SIN CONEXIÓN" });
    }
  }
  send(payload) {
    if (this.socket?.readyState !== WebSocket.OPEN) return null;
    const req_id = ++this.requestId;
    this.socket.send(JSON.stringify({ ...payload, req_id }));
    return req_id;
  }
  loadCandles(symbol) {
    this.selectedSymbol = symbol;
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.send({ forget_all: "candles" });
    this.pendingHistory = symbol;
    this.handlers.onHistoryLoading?.(symbol);
    this.send({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: 1440,
      end: "latest",
      granularity: 60,
      style: "candles",
      subscribe: 1
    });
  }
  subscribe(symbol) { this.loadCandles(symbol); }
  handleMessage(raw) {
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    if (message.error) {
      this.handlers.onError?.(message.error.message || "Deriv devolvió un error.");
      return;
    }
    if (Array.isArray(message.active_symbols)) {
      const list = message.active_symbols
        .filter(x => /volatility/i.test(x.display_name || ""))
        .map(x => ({ symbol: x.symbol, display_name: x.display_name, market: x.market, submarket: x.submarket }))
        .filter(x => x.symbol && x.display_name)
        .sort((a,b) => a.display_name.localeCompare(b.display_name, "es"));
      this.handlers.onSymbols?.(list);
    }
    if (message.candles && this.pendingHistory) {
      const symbol = this.pendingHistory;
      this.pendingHistory = null;
      const candles = message.candles.map(c => ({
        epoch: Number(c.epoch), open: Number(c.open), high: Number(c.high),
        low: Number(c.low), close: Number(c.close)
      })).filter(validCandle);
      this.handlers.onCandles?.({ symbol, candles });
    }
    if (message.ohlc) {
      const c = message.ohlc;
      const candle = { epoch: Number(c.open_time), open: Number(c.open), high: Number(c.high), low: Number(c.low), close: Number(c.close) };
      if (validCandle(candle)) this.handlers.onCandle?.({ symbol: c.symbol, candle });
    }
    if (message.tick) this.handlers.onTick?.({ symbol: message.tick.symbol, quote: Number(message.tick.quote), epoch: Number(message.tick.epoch) });
  }
  disconnect() {
    this.closedByUser = true;
    clearTimeout(this.retryTimer);
    this.socket?.close();
    this.socket = null;
    this.connecting = false;
  }
}
function validCandle(c) {
  return Number.isFinite(c.epoch) && [c.open,c.high,c.low,c.close].every(Number.isFinite) && c.high >= c.low;
}
