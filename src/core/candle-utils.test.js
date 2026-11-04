import test from "node:test";
import assert from "node:assert/strict";
import { mergeCandle, formatPrice } from "./candle-utils.js";
test("actualiza la vela del mismo minuto sin duplicarla",()=>{
  const a={epoch:60,open:10,high:12,low:9,close:11};
  const b={epoch:60,open:10,high:14,low:8,close:13};
  const out=mergeCandle([a],b);
  assert.equal(out.length,1);
  assert.equal(out[0].high,14);
  assert.equal(out[0].low,8);
});
test("ordena y limita historial",()=>{
  const out=mergeCandle([{epoch:120,open:1,high:1,low:1,close:1}],{epoch:60,open:1,high:1,low:1,close:1});
  assert.deepEqual(out.map(x=>x.epoch),[60,120]);
});
test("formatea precio inválido y válido",()=>{
  assert.equal(formatPrice(NaN),"—");
  assert.equal(formatPrice(1.25),"1.25");
});
