/* 飞机图鉴 · 各机型「在役数量」（仍在飞行的架数，近似值，截至 2025/2026 年）
 * 数据来源：planespotters.net / ch-aviation / Cirium / 制造商与行业公开报道，均为约数，仅供学习参考。
 * 口径说明：n 为近似值文本（客机为主，部分含货机/军机时会标注）；
 *           tag 用于状态着色：active=现役主力 / legacy=老将仍飞 / rare=稀少 / retired=已退役。
 * 新增或修改某机型在役数据时，在此处改对应一行即可；首页卡片与详情页会自动读取。 */
(function () {
  "use strict";
  window.INFLEET = {
    /* 波音 Boeing */
    b707:     { n: "基本退役（仅军用改型在役）", tag: "retired" },
    b727:     { n: "基本退役（少数货机）",       tag: "retired" },
    b737:     { n: "约 10,500 架",               tag: "active" },
    b747:     { n: "约 420 架（多为货机/军机）", tag: "legacy" },
    b757:     { n: "约 550 架（客机为主）",      tag: "legacy" },
    b767:     { n: "约 700 架（含货机/加油机）", tag: "legacy" },
    b777:     { n: "约 1,100 架",               tag: "active" },
    b787:     { n: "约 1,230 架",               tag: "active" },
    /* 空客 Airbus */
    a320:     { n: "约 11,300 架",              tag: "active" },
    a330:     { n: "约 1,120 架",               tag: "active" },
    a340:     { n: "约 65 架（濒临退役）",       tag: "rare" },
    a350:     { n: "约 690 架",                 tag: "active" },
    a380:     { n: "约 190 架",                 tag: "legacy" },
    a220:     { n: "约 360 架",                 tag: "active" },
    /* 中国商飞 COMAC */
    c919:     { n: "约 32 架（均现役）",         tag: "active" },
    arj21:    { n: "约 160 架（均现役）",        tag: "active" },
    /* 巴航工业 Embraer */
    ejet:     { n: "约 1,500 架",               tag: "active" },
    erj:      { n: "约 700 架（部分退役）",      tag: "legacy" },
    /* 庞巴迪 Bombardier */
    crj:      { n: "约 600 架（部分退役）",      tag: "legacy" },
    /* 麦道 McDonnell Douglas */
    md80:     { n: "极少（接近退役）",           tag: "rare" },
    md11:     { n: "客机退役，货机约 50 架",     tag: "rare" },
    /* 图波列夫 Tupolev */
    tu154:    { n: "少数（俄/独联体）",          tag: "rare" },
    tu204:    { n: "约 50 架（俄国内）",         tag: "rare" },
    /* 伊留申 Ilyushin */
    il96:     { n: "极少（俄国内）",             tag: "rare" },
    /* 协和 Concorde */
    concorde: { n: "0 架（2003 年退役）",        tag: "retired" },
    /* 安东诺夫 Antonov */
    an124:    { n: "约 26 架（军用/货运）",      tag: "rare" },
    /* 苏霍伊 Sukhoi */
    ssj100:   { n: "约 150 架（俄国内）",        tag: "legacy" }
  };
})();
