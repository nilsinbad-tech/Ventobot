// Seguimiento manual persistente. No ejecuta órdenes ni recomienda entrar.
const STORAGE_KEY = "ventobot.operations.v1";
export class OperationBook {
  constructor() {
    this.items = [];
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) this.items = saved.filter(validItem);
    } catch { this.items = []; }
  }
  persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); }
    catch { /* La app sigue funcionando durante esta sesión si el almacenamiento está lleno. */ }
  }
  enter({ symbol, side, entry, stopLoss, takeProfit1, takeProfit2 }) {
    const values = [entry, stopLoss, takeProfit1, takeProfit2].map(Number);
    if (!symbol || !["COMPRAR","VENDER"].includes(side) || !values.every(Number.isFinite)) {
      throw new Error("Completa instrumento, dirección, entrada, SL, TP1 y TP2 con precios válidos.");
    }
    const [e, sl, tp1, tp2] = values;
    if (e <= 0 || sl <= 0 || tp1 <= 0 || tp2 <= 0) throw new Error("Los niveles deben ser mayores que cero.");
    if (side === "COMPRAR" && !(sl < e && tp1 > e && tp2 > tp1)) throw new Error("En COMPRAR: SL < entrada < TP1 < TP2.");
    if (side === "VENDER" && !(sl > e && tp1 < e && tp2 < tp1)) throw new Error("En VENDER: SL > entrada > TP1 > TP2.");
    const item = {
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(36).slice(2),
      symbol, side, entry:e, stopLoss:sl, takeProfit1:tp1, takeProfit2:tp2,
      status:"ACTIVA", openedAt:Date.now(), closedAt:null, exitReason:null
    };
    this.items.unshift(item);
    this.persist();
    return { ...item };
  }
  close(id, result, reason = "Cierre manual") {
    const item = this.items.find(x => x.id === id && x.status === "ACTIVA");
    if (!item || !["GANADA","PERDIDA","CERRADA"].includes(result)) return false;
    item.status = result; item.closedAt = Date.now(); item.exitReason = reason;
    this.persist(); return true;
  }
  evaluatePrice(symbol, price) {
    let changed = false;
    for (const item of this.items) {
      if (item.status !== "ACTIVA" || item.symbol !== symbol) continue;
      if (item.side === "COMPRAR") {
        if (price <= item.stopLoss) changed = this.close(item.id,"PERDIDA","Stop Loss") || changed;
        else if (price >= item.takeProfit2) changed = this.close(item.id,"GANADA","Take Profit 2") || changed;
      } else {
        if (price >= item.stopLoss) changed = this.close(item.id,"PERDIDA","Stop Loss") || changed;
        else if (price <= item.takeProfit2) changed = this.close(item.id,"GANADA","Take Profit 2") || changed;
      }
    }
    return changed;
  }
  all() { return this.items.map(x => ({ ...x })); }
}
function validItem(x) {
  return x && typeof x.id === "string" && typeof x.symbol === "string" &&
    ["COMPRAR","VENDER"].includes(x.side) &&
    ["ACTIVA","GANADA","PERDIDA","CERRADA"].includes(x.status);
}
