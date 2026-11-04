import test from "node:test";
import assert from "node:assert/strict";
import { OperationBook } from "./operation-book.js";

function storageMock() {
  const data = new Map();
  globalThis.localStorage = {
    getItem:key=>data.get(key) ?? null,
    setItem:(key,value)=>data.set(key,String(value))
  };
}
test("registra y persiste una compra válida",()=>{
  storageMock();
  const book=new OperationBook();
  const item=book.enter({symbol:"R_25",side:"COMPRAR",entry:100,stopLoss:95,takeProfit1:105,takeProfit2:110});
  assert.equal(item.status,"ACTIVA");
  assert.equal(new OperationBook().all().length,1);
});
test("rechaza niveles de compra en orden incorrecto",()=>{
  storageMock();
  const book=new OperationBook();
  assert.throws(()=>book.enter({symbol:"R_25",side:"COMPRAR",entry:100,stopLoss:105,takeProfit1:110,takeProfit2:115}),/SL < entrada/);
});
test("cierra operación manual una sola vez",()=>{
  storageMock();
  const book=new OperationBook();
  const item=book.enter({symbol:"R_25",side:"VENDER",entry:100,stopLoss:105,takeProfit1:95,takeProfit2:90});
  assert.equal(book.close(item.id,"GANADA","TP2"),true);
  assert.equal(book.close(item.id,"PERDIDA"),false);
  assert.equal(book.all()[0].status,"GANADA");
});
test("cierra por stop o TP2 al recibir precio",()=>{
  storageMock();
  const book=new OperationBook();
  book.enter({symbol:"R_25",side:"COMPRAR",entry:100,stopLoss:95,takeProfit1:105,takeProfit2:110});
  assert.equal(book.evaluatePrice("R_25",110),true);
  assert.equal(book.all()[0].status,"GANADA");
});
