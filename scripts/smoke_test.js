// 无浏览器烟雾测试：用桩对象模拟 DOM，真实执行各路由的渲染函数，捕获运行时错误。
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/panyp/WorkBuddy/飞机探索";

function makeEl() {
  return {
    _html: "",
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
    textContent: "",
    style: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild() {},
  };
}

const els = {};
function getEl(id) { if (!els[id]) els[id] = makeEl(); return els[id]; }

global.window = global;
global.document = {
  readyState: "complete",
  getElementById: (id) => getEl(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
global.location = { hash: "#/" };
global.localStorage = (() => {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } };
})();
global.setInterval = () => 0;
global.window.addEventListener = () => {};
global.window.scrollTo = () => {};

function evalsrc(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }

// 加载数据与剪影生成器（只一次）
eval(evalsrc("js/data.js"));
eval(evalsrc("js/silhouettes.js"));
eval(evalsrc("js/guide.js"));

const appCode = evalsrc("js/app.js");
const routes = [
  ["#/", ["hero", "grid", "filters"]],
  ["#/a/b737", ["detail-head", "checklist", "spec-table", "dtabs", "three-views", "lineage"]],
  ["#/a/c919", ["detail-head", "COMAC", "lineage", "a/arj21"]],
  ["#/guide", ["stepper", "demo-section", "guide-table", "g-grid", "light boeing", "light airbus"]],
  ["#/quiz", ["quiz-card", "quiz-opts"]],
  ["#/compare", ["compare-tray", "cmp-table", "cmp-empty"]], // 无选择 -> 空态
];

let fail = 0;
for (const [hash, markers] of routes) {
  // 清空视图缓存，设定 hash，重新执行 app（其 init 会渲染当前路由）
  els["view"] = makeEl();
  global.location.hash = hash;
  try {
    eval(appCode);
    const html = getEl("view")._html || "";
    const missing = markers.filter((m) => html.indexOf(m) < 0);
    if (!html) { console.log("FAIL", hash, "(empty html)"); fail++; }
    else if (missing.length) { console.log("WARN", hash, "missing:", missing.join(",")); }
    else console.log("OK  ", hash, "(" + html.length + " chars)");
  } catch (e) {
    console.log("ERROR", hash, "->", e.message);
    console.log(e.stack.split("\n").slice(0, 4).join("\n"));
    fail++;
  }
}

// 额外：模拟已选对比项后再渲染对比页
els["view"] = makeEl();
global.localStorage.setItem("aa_compare", JSON.stringify(["b737", "a320", "c919"]));
global.location.hash = "#/compare";
try {
  eval(appCode);
  const html = getEl("view")._html || "";
  const ok = html.indexOf("cmp-table") >= 0 && html.indexOf("best") >= 0;
  console.log(ok ? "OK   compare(with 3 selected) shows table+best" : "WARN compare table not fully rendered");
  if (!ok) fail++;
} catch (e) { console.log("ERROR compare-selected ->", e.message); fail++; }

console.log(fail ? ("\nSMOKE FAIL (" + fail + ")") : "\nSMOKE PASS");
process.exit(fail ? 1 : 0);
