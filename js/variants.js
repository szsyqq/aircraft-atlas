/*
 * variants.js — 具体飞行型号级「在役数量」近似数据
 *
 * 层级：制造商(manufacturer) → 家族(family) → 具体型号(variant)
 *
 * 注意：
 * - n = 在役（仍在飞的）近似架数，截自 2024–2025 年公开报道。
 * - 来源口径：planespotters.net / ch-aviation / Cirium / 制造商年报 / 行业公开报道。
 * - role 字段注明了运营状态或备注（货机/稀少/待核实等）。
 * - 凡数据不确定的，已标注"≈"或"待核实"；不标注的也属近似值，
 *   以 planespotters / ch-aviation 实时数据为准。
 */
window.VARIANTS = {};

// Helper: 添加一组型号
function ADD__VARIANT(famId, list) {
  window.VARIANTS[famId] = list;
}

// ============== 波音 ==============
ADD__VARIANT("b737", [
  { name: "737-200",        n: 40,   role: "货机/稀少" },
  { name: "737-300/400/500 (Classic)", n: 400, role: "加速退役" },
  { name: "737-600 (NG)",   n: 60,  role: "稀少" },
  { name: "737-700 (NG)",   n: 1100, role: "现役主力" },
  { name: "737-800 (NG)",   n: 4700, role: "现役主流" },
  { name: "737-900 (NG)",   n: 200, role: "" },
  { name: "737 MAX 8",      n: 1500, role: "现役主力" },
  { name: "737 MAX 9",      n: 250, role: "" },
  { name: "737 MAX 200/BCF", n: 80, role: "货机" }
]);

ADD__VARIANT("b747", [
  { name: "747-100/200",    n: 10,  role: "货机/稀少，≈待核实" },
  { name: "747-400 (客)",   n: 40,  role: "客运稀少" },
  { name: "747-400 (货)",   n: 210, role: "货机主力" },
  { name: "747-8",          n: 110, role: "货机+专机" },
  { name: "747 SP",         n: 5,   role: "稀少，≈待核实" }
]);

ADD__VARIANT("b777", [
  { name: "777-200",        n: 90,  role: "部分转货机" },
  { name: "777-200ER",      n: 420, role: "远程主力之一" },
  { name: "777-200LR",      n: 60,  role: "超远程" },
  { name: "777-300",        n: 60,  role: "早期型" },
  { name: "777-300ER",      n: 760, role: "现役远程主力" },
  { name: "777F",           n: 250, role: "货机主力" },
  { name: "777-9 (777X)",   n: 0,   role: "尚未大规模交付" }
]);

ADD__VARIANT("b787", [
  { name: "787-8",          n: 380, role: "" },
  { name: "787-9",          n: 560, role: "现役主力" },
  { name: "787-10",         n: 100, role: "" }
]);

ADD__VARIANT("b707", [
  { name: "707 (含军机)",    n: 10,  role: "军机/稀少，≈待核实" }
]);

ADD__VARIANT("b727", [
  { name: "727 (货机)",     n: 10,  role: "货机/稀少，≈待核实" }
]);

ADD__VARIANT("b757", [
  { name: "757-200",        n: 600, role: "多为货机" },
  { name: "757-300",        n: 80,  role: "" }
]);

ADD__VARIANT("b767", [
  { name: "767-200",        n: 60,  role: "" },
  { name: "767-300",        n: 550, role: "含客/货" },
  { name: "767-400",        n: 40,  role: "" },
  { name: "767-300F",       n: 250, role: "货机" }
]);

// ============== 空客 ==============
ADD__VARIANT("a320", [
  { name: "A318",           n: 70,  role: "稀少" },
  { name: "A319ceo",        n: 1100, role: "" },
  { name: "A319neo",        n: 150, role: "" },
  { name: "A320ceo",        n: 4700, role: "现役主力" },
  { name: "A320neo",        n: 3500, role: "现役主力" },
  { name: "A321ceo",        n: 950, role: "" },
  { name: "A321neo",        n: 1600, role: "现役主力" },
  { name: "A321XLR",        n: 10,  role: "刚进入服役" }
]);

ADD__VARIANT("a330", [
  { name: "A330-200",       n: 600, role: "" },
  { name: "A330-300",       n: 780, role: "现役主力" },
  { name: "A330-200F",      n: 40,  role: "货机" },
  { name: "A330-800neo",    n: 10,  role: "稀少" },
  { name: "A330-900neo",    n: 140, role: "" }
]);

ADD__VARIANT("a350", [
  { name: "A350-900",       n: 560, role: "现役远程主力" },
  { name: "A350-1000",      n: 100, role: "" },
  { name: "A350-900ULR",    n: 10,  role: "仅新加坡航空运营" }
]);

ADD__VARIANT("a380", [
  { name: "A380-800",       n: 189, role: "逐渐退役，Emirates 占 116 架" }
]);

ADD__VARIANT("a220", [
  { name: "A220-100",       n: 110, role: "" },
  { name: "A220-300",       n: 330, role: "现役主力" }
]);

ADD__VARIANT("a340", [
  { name: "A340-200",       n: 10,  role: "稀少" },
  { name: "A340-300",       n: 120, role: "逐渐退役" },
  { name: "A340-500",       n: 5,   role: "极稀少" },
  { name: "A340-600",       n: 60,  role: "" }
]);

// ============== 商飞 ==============
ADD__VARIANT("c919", [
  { name: "C919 (标准型)",  n: 32,  role: "续交付中" }
]);

ADD__VARIANT("arj21", [
  { name: "ARJ21-700",      n: 160, role: "现全部在役" }
]);

// ============== 巴西航空工业 ==============
ADD__VARIANT("ejet", [
  { name: "E170",           n: 380, role: "" },
  { name: "E175",           n: 640, role: "支线主力" },
  { name: "E190",           n: 550, role: "" },
  { name: "E195",           n: 130, role: "" },
  { name: "E190-E2",        n: 90,  role: "" },
  { name: "E195-E2",        n: 90,  role: "" }
]);

ADD__VARIANT("erj", [
  { name: "ERJ-135/140",    n: 100, role: "≈待核实" },
  { name: "ERJ-145",        n: 350, role: "逐渐退役" }
]);

// ============== 庞巴迪 CRJ ==============
ADD__VARIANT("crj", [
  { name: "CRJ100/200",     n: 400, role: "" },
  { name: "CRJ700",         n: 330, role: "" },
  { name: "CRJ900",         n: 440, role: "支线主力" },
  { name: "CRJ1000",        n: 80,  role: "" }
]);

// ============== 麦道 ==============
ADD__VARIANT("md80", [
  { name: "MD-80 系 (82/83/88)", n: 120, role: "多为货机" },
  { name: "MD-87",          n: 30,  role: "货机/稀少" },
  { name: "MD-90",          n: 40,  role: "稀少" }
]);

ADD__VARIANT("md11", [
  { name: "MD-11 (含货机)", n: 200, role: "货机主力" }
]);

// ============== 俄系 ==============
ADD__VARIANT("tu154", [
  { name: "Tu-154M/M2",     n: 30,  role: "俄/中亚，≈待核实" }
]);

ADD__VARIANT("tu204", [
  { name: "Tu-204/214",     n: 40,  role: "含货机，≈待核实" }
]);

ADD__VARIANT("il96", [
  { name: "Il-96-300/400",  n: 25,  role: "俄政府/古巴，≈待核实" }
]);

ADD__VARIANT("concorde", [
  { name: "协和号",         n: 0,   role: "2003 年全部退役" }
]);

ADD__VARIANT("an124", [
  { name: "An-124 Ruslan",  n: 25,  role: "俄/乌，战损减少，≈待核实" }
]);

ADD__VARIANT("ssj100", [
  { name: "SSJ100-95",      n: 150, role: "俄国内为主，≈待核实" }
]);

// 清理辅助函数
delete ADD__VARIANT;
