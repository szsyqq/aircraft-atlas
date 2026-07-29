/* 飞机图鉴 · Aircraft Atlas — 交互逻辑（原生 JS，无构建）
 * 路由：#/ 机队 | #/a/<id> 详情 | #/quiz 识别练习 | #/compare 机型对比
 */
(function () {
  "use strict";
  var A = window.AIRCRAFT || [];
  var BYID = (function () { var m = {}; A.forEach(function (x) { m[x.id] = x; }); return m; })();
  var BRANDS = window.BRANDS || {};
  var TYPE_LABEL = { narrow: "窄体", wide: "宽体", jumbo: "巨型", regional: "支线", supersonic: "超音速" };
  var TYPES = ["narrow", "wide", "jumbo", "regional", "supersonic"];

  var state = {
    mfr: "all",
    type: "all",
    compare: loadCompare(),
    quiz: null,
    quizSetup: { len: 30, mode: "photo" },
    tz: loadTz()
  };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(id) { for (var i = 0; i < A.length; i++) if (A[i].id === id) return A[i]; return null; }
  function brand(a) { return BRANDS[a.mfr] || { name: a.mfr, hex: "#888", accent: "#888" }; }
  function loadTz() {
    try {
      var t = localStorage.getItem("atlas.tz");
      if (t === "utc" || t === "bj" || t === "local") return t;
    } catch (e) {}
    return "bj";
  }
  function mediaHtml(a, cls) {
    return '<div class="media ' + (cls || '') + '" style="--bc:' + brand(a).accent + '">' +
      '<img src="assets/img/' + a.id + '.jpg" alt="' + esc(a.name) + '" loading="lazy" ' +
      'onerror="window.__mediaFail(this,\'' + a.id + '\',\'' + a.mfr + '\')">' +
      '<div class="media-fallback" style="display:none"></div></div>';
  }
  window.__mediaFail = function (img, id, mfr) {
    var fb = img.parentElement.querySelector(".media-fallback");
    if (fb && window.Silhouettes && window.Silhouettes.side) {
      fb.innerHTML = window.Silhouettes.side(id, mfr);
      fb.style.display = "flex";
    } else if (fb) {
      fb.innerHTML = placeholderHtml(id);
      fb.style.display = "flex";
    }
    img.style.display = "none";
  };
  // 无实拍/无矢量线图时，渲染带品牌色的占位卡
  function placeholderHtml(id) {
    var a = byId(id);
    var b = a ? brand(a) : { name: id, accent: "#888" };
    var nm = a ? a.name : id;
    return '<div class="ph" style="--bc:' + b.accent + '">' +
      '<span class="ph-glyph">✈</span>' +
      '<span class="ph-name">' + esc(nm) + '</span>' +
      '<span class="ph-sub">' + esc(b.name.split(" ")[0]) + '</span>' +
      '<span class="ph-tip">实拍图加载中 / 暂缺</span>' +
    '</div>';
  }
  // 真实线图加载失败：先回退到真实照片，再不行才用程序生成的三视图
  window.__outlineFail = function (img, id, mfr) {
    if (!img.dataset.triedPhoto) {
      img.dataset.triedPhoto = "1";
      var probe = new Image();
      probe.onload = function () { img.src = "assets/img/" + id + ".jpg"; img.classList.add("photo-fallback"); };
      probe.onerror = function () { window.__showGen(img); };
      probe.src = "assets/img/" + id + ".jpg";
    } else {
      window.__showGen(img);
    }
  };
  // 练习「轮廓」模式：真实线图缺失时回退到真实照片，再不行才用生成图
  window.__quizSilFail = function (img, id) { img.src = "assets/img/" + id + ".jpg"; };
  window.__showGen = function (img) {
    var g = img.parentNode.querySelector(".outline-gen");
    if (g) { img.style.display = "none"; g.style.display = "grid"; }
  };

  /* ---------- 三视图（真实照片）+ 各自识别特点 ---------- */
  /* VIEW_NOTES 和 VIEWS 清单见 js/views.js */
  function threeViews(a) {
    var base = "assets/img/" + a.id;
    var V = (window.VIEWS && window.VIEWS[a.id]) || { side: true, top: false, front: false };
    var VN = (window.VIEW_NOTES && window.VIEW_NOTES[a.id]) || {};
    var defs = [
      { key: "side", label: "侧视 SIDE", file: base + ".jpg" },
      { key: "top", label: "顶视 TOP", file: base + "_top.jpg" },
      { key: "front", label: "前视 FRONT", file: base + "_front.jpg" }
    ];
    return '<div class="three-views">' + defs.map(function (v) {
      var hasPhoto = v.key === "side" || (V[v.key] === true);
      var notes = (VN[v.key] || []);
      var notesHtml = notes.length ? '<ul class="tv-notes">' + notes.map(function (t, i) {
        return '<li><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>';
      }).join("") + '</ul>' : '';
      if (hasPhoto) {
        return '<div class="tv tv-has-photo">' +
          '<div class="tv-img"><img src="' + v.file + '" alt="' + esc(a.name) + ' ' + v.label + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'' + base + '.jpg\'"></div>' +
          '<div class="tv-cap">' + v.label + '</div>' + notesHtml +
          '</div>';
      } else {
        // 缺失该角度照片时，展示文字识别要点
        var desc = notes.length ? notesHtml : '<p class="tv-missing">暂无此角度照片</p>';
        return '<div class="tv tv-no-photo">' +
          '<div class="tv-cap">' + v.label + '</div>' +
          '<div class="tv-missing-box"><p>📷 该角度暂无可用照片</p>' + desc + '</div>' +
          '</div>';
      }
    }).join("") + '</div>';
  }

  /* ---------- 系谱树：从哪来到哪去 ---------- */
  function lnNode(n) {
    var label = typeof n === "string" ? n : n.label;
    var id = typeof n === "string" ? null : n.id;
    if (id && byId(id)) return '<a class="ln" href="#/a/' + id + '">' + esc(label) + ' ↗</a>';
    return '<span class="ln">' + esc(label) + '</span>';
  }
  function renderLineage(a) {
    var from = (a.lineage && a.lineage.from) || [];
    var to = a.derivatives || [];
    var left = from.length ? from.map(lnNode).join("") : '<span class="ln">—</span>';
    var right = to.length ? to.map(lnNode).join("") : '<span class="ln">—</span>';
    return '<div class="lineage">' +
      '<div class="ln-col"><div class="ln-h">前身 / 技术渊源</div>' + left + '</div>' +
      '<div class="ln-arrow">→</div>' +
      '<div class="ln-col"><div class="ln-h">本机</div><span class="ln current">' + esc(a.name) + '</span></div>' +
      '<div class="ln-arrow">→</div>' +
      '<div class="ln-col"><div class="ln-h">衍生 / 家族</div>' + right + '</div>' +
      '</div>';
  }

  /* ---------- 对比持久化 ---------- */
  function loadCompare() {
    try { return JSON.parse(localStorage.getItem("aa_compare") || "[]"); } catch (e) { return []; }
  }
  function saveCompare() {
    try { localStorage.setItem("aa_compare", JSON.stringify(state.compare)); } catch (e) {}
  }
  function toggleCompare(id) {
    var i = state.compare.indexOf(id);
    if (i >= 0) state.compare.splice(i, 1);
    else { if (state.compare.length >= 4) state.compare.shift(); state.compare.push(id); }
    saveCompare();
    render();
  }
  function inCompare(id) { return state.compare.indexOf(id) >= 0; }

  /* ---------- 状态条 ---------- */
  function renderStatusStrip() {
    var counts = {}; TYPES.forEach(function (t) { counts[t] = 0; });
    A.forEach(function (a) { if (counts[a.type] != null) counts[a.type]++; });
    var stats = [
      ["机型", A.length, "AC"],
      ["制造商", Object.keys(BRANDS).length, "MFR"],
      ["家族", Object.keys(window.FAMILIES || {}).length, "FAM"],
      ["窄体", counts.narrow, "NB"],
      ["宽体", counts.wide, "WB"],
      ["支线", counts.regional, "REG"]
    ];
    document.getElementById("statusstrip").innerHTML = stats.map(function (s) {
      return '<div class="stat"><span class="k">' + s[2] + '</span><b>' + s[1] + '</b><span>' + s[0] + '</span></div>';
    }).join("");
  }

  /* ---------- 系列树 HTML（家族卡片 / 详情页共用） ---------- */
  function seriesTreeHtml(fam) {
    var series = (fam && fam.series) || [];
    if (!series.length) return "";
    return '<div class="series-tree">' + series.map(function (s) {
      var vs = (s.variants || []).map(function (v) {
        return '<span class="vchip">' + esc(v) + '</span>';
      }).join("");
      return '<div class="series-row">' +
        '<div class="series-h"><span class="series-name">' + esc(s.name) + '</span>' +
        '<span class="series-yr">' + esc(s.years) + '</span></div>' +
        '<div class="variants">' + vs + '</div>' +
        '<p class="series-note">' + esc(s.note) + '</p>' +
      '</div>';
    }).join("") + '</div>';
  }

  /* 首图（hero）来源：优先图库第一张，回退到 assets/img/<id>.jpg */
  function heroSrc(id) {
    var g = (window.GALLERY && window.GALLERY[id]) || [];
    if (g.length) return g[0].src;
    return "assets/img/" + id + ".jpg";
  }
  function parseStartYear(years) {
    if (!years) return 9999;
    var m = String(years).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : 9999;
  }

  /* 演进时间轴：把「系列 / 改型」按年代排成带图的时间线（演进图） */
  function evolutionTimelineHtml(fam) {
    var series = (fam && fam.series) || [];
    if (!series.length) return "";
    var sorted = series.slice().sort(function (x, y) { return parseStartYear(x.years) - parseStartYear(y.years); });
    var rep = fam.rep, ph = heroSrc(rep);
    var items = sorted.map(function (s, i) {
      var vs = (s.variants || []).map(function (v) { return '<span class="vchip">' + esc(v) + '</span>'; }).join("");
      return '<li class="evo-node' + (i === sorted.length - 1 ? " last" : "") + '">' +
        '<div class="evo-rail"><span class="evo-dot"></span></div>' +
        '<div class="evo-card">' +
          '<div class="evo-ph"><img src="' + ph + '" alt="' + esc(s.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'assets/img/' + rep + '.jpg\'"></div>' +
          '<div class="evo-body">' +
            '<div class="evo-yr">' + esc(s.years || "") + '</div>' +
            '<div class="evo-name">' + esc(s.name) + '</div>' +
            (s.note ? '<p class="evo-note">' + esc(s.note) + '</p>' : '') +
            (vs ? '<div class="variants">' + vs + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</li>';
    }).join("");
    return '<ol class="evo-timeline">' + items + '</ol>';
  }

  /* 系谱（视觉版）：前身 → 本机 → 衍生，带照片、可点进其他机型 */
  function lnPhoto(id) {
    if (!id || !byId(id)) return "";
    var src = heroSrc(id);
    return '<span class="ln-ph"><img src="' + src + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'assets/img/' + id + '.jpg\'"></span>';
  }
  function renderLineageVisual(a) {
    var from = (a.lineage && a.lineage.from) || [];
    var to = a.derivatives || [];
    function col(nodes, heading) {
      if (!nodes.length) return '<div class="ln-col"><div class="ln-h">' + esc(heading) + '</div><div class="ln-empty">—</div></div>';
      return '<div class="ln-col"><div class="ln-h">' + esc(heading) + '</div>' + nodes.map(function (n) {
        var label = typeof n === "string" ? n : n.label;
        var id = typeof n === "string" ? null : n.id;
        var ph = lnPhoto(id);
        if (id && byId(id)) {
          return '<a class="ln-item" href="#/a/' + id + '">' + ph + '<span class="ln-cap">' + esc(label) + ' ↗</span></a>';
        }
        return '<span class="ln-item">' + esc(label) + '</span>';
      }).join("") + '</div>';
    }
    return '<div class="lineage-vis">' +
      col(from, "前身 / 技术渊源") +
      '<div class="ln-arrow">→</div>' +
      '<div class="ln-col"><div class="ln-h">本机</div><a class="ln-item current" href="#/a/' + a.id + '">' + lnPhoto(a.id) + '<span class="ln-cap">' + esc(a.name) + '</span></a></div>' +
      '<div class="ln-arrow">→</div>' +
      col(to, "衍生 / 家族") +
    '</div>';
  }

  /* ---------- 图库查看器（可前后翻看真实照片） ---------- */
  function galleryViewerHtml(a) {
    var items = (window.GALLERY && window.GALLERY[a.id]) || [];
    var b = brand(a);
    if (!items.length) return mediaHtml(a);
    var first = items[0];
    var dots = items.map(function (_, i) {
      return '<span class="gv-dot' + (i === 0 ? " on" : "") + '" data-gv-dot="' + i + '"></span>';
    }).join("");
    return '<div class="gv" data-gv="' + a.id + '" style="--bc:' + b.accent + '">' +
      '<div class="gv-stage">' +
        '<img class="gv-img" src="' + first.src + '" alt="' + esc(a.name) + '" data-idx="0" ' +
          'onerror="this.onerror=null;this.src=\'assets/img/' + a.id + '.jpg\'">' +
        '<button class="gv-arrow gv-prev" type="button" data-gv-dir="-1" aria-label="上一张">‹</button>' +
        '<button class="gv-arrow gv-next" type="button" data-gv-dir="1" aria-label="下一张">›</button>' +
        '<span class="gv-badge">图库 ' + items.length + '</span>' +
        '<div class="gv-cap"><span class="gv-cap-txt">' + esc(first.cap || a.name) + '</span>' +
          '<span class="gv-count">1 / ' + items.length + '</span></div>' +
      '</div>' +
      '<div class="gv-dots">' + dots + '</div>' +
    '</div>';
  }
  function aircraftCard(a) {
    var b = brand(a);
    var prod = (window.PROD && window.PROD[a.id]) || "—";
    var firstFlight = a.specs["首飞"] || "—";
    var seats = a.specs["典型载客"] || "—";
    var famName = (window.FAMILIES[a.family] && window.FAMILIES[a.family].name) || a.family || "";
    return '<article class="ac-card" style="--bc:' + b.accent + '">' +
      galleryViewerHtml(a) +
      '<div class="ac-body">' +
        '<div class="ac-tags">' +
          '<span class="tag mfr">' + esc(b.short) + '</span>' +
          '<span class="tag">' + TYPE_LABEL[a.type] + '</span>' +
          (famName ? '<span class="tag fam">' + esc(famName) + '</span>' : '') +
        '</div>' +
        '<h3>' + esc(a.name) + '</h3>' +
        '<p class="ac-tl">' + esc(a.tagline) + '</p>' +
        '<div class="ac-stats">' +
          '<div class="ac-stat"><span class="k">首飞</span><b>' + esc(firstFlight) + '</b></div>' +
          '<div class="ac-stat"><span class="k">产销</span><b>' + esc(prod) + '</b></div>' +
          '<div class="ac-stat"><span class="k">载客</span><b>' + esc(seats) + '</b></div>' +
        '</div>' +
        '<div class="ac-actions">' +
          '<a class="btn primary full" href="#/a/' + a.id + '">查看详情</a>' +
          '<button class="btn full" data-cmp="' + a.id + '" aria-pressed="' + inCompare(a.id) + '">' +
            (inCompare(a.id) ? "✓ 已加入" : "＋ 对比") + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* 在役数量（仍在飞的架数）+ 状态着色 */
  function infleetStat(a) {
    var d = (window.INFLEET && window.INFLEET[a.id]) || null;
    if (!d) return '<div class="ac-stat"><span class="k">在役</span><b>—</b></div>';
    return '<div class="ac-stat"><span class="k">在役</span>' +
      '<b class="if if-' + d.tag + '"><i class="ifdot"></i>' + esc(d.n) + '</b></div>';
  }
  function infleetLine(a) {
    var d = (window.INFLEET && window.INFLEET[a.id]) || null;
    if (!d) return "";
    var tip = { active: "现役主力", legacy: "老将仍飞", rare: "稀少", retired: "已退役" }[d.tag] || "";
    return '<div class="infleet-line">在役情况：<b class="if if-' + d.tag + '"><i class="ifdot"></i>' +
      esc(d.n) + '</b><span class="if-tip">' + tip + '</span></div>';
  }

  /* ---------- 具体型号（variant）专属助手 ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9一-龥]/g, ""); }
  /* 该型号专属照片：优先每款独立实拍图库（VGAL，彻底消除同家族重复），
     其次 VARIANT_PHOTO，再次家族图库轮换，最后家族 hero */
  function variantHero(v, idx) {
    var gal = (window.VGAL && window.VGAL[v.id]) || [];
    if (gal.length) return gal[idx % gal.length];
    if (window.VARIANT_PHOTO && window.VARIANT_PHOTO[v.id]) return window.VARIANT_PHOTO[v.id];
    var g = (window.GALLERY && window.GALLERY[v.fam]) || [];
    if (g.length) return g[idx % g.length].src;
    return "assets/img/" + v.fam + ".jpg";
  }
  /* 匹配该型号在 VARIANTS 里的在役数据（按名称模糊匹配） */
  function matchVariantInfleet(v) {
    var list = (window.VARIANTS && window.VARIANTS[String(v.fam).toLowerCase()]) || [];
    if (!list.length) return null;
    var vn = norm(v.name);
    for (var i = 0; i < list.length; i++) { if (norm(list[i].name) === vn) return list[i]; }
    for (var j = 0; j < list.length; j++) {
      var nm = norm(list[j].name);
      if (nm && (nm.indexOf(vn) >= 0 || vn.indexOf(nm) >= 0)) return list[j];
    }
    return null;
  }
  function infleetTagFromVariant(n) {
    if (n <= 0) return "retired";
    if (n < 50) return "rare";
    if (n < 300) return "legacy";
    return "active";
  }
  function variantProd(v, a) {
    if (window.VARIANT_PROD && window.VARIANT_PROD[v.id] != null) return window.VARIANT_PROD[v.id];
    return (window.PROD && window.PROD[a.id]) || "—";
  }

  /* 具体型号在役数据（制造商 → 家族 → 具体飞行型号 三层） */
  function variantFleetHtml(famId, compact) {
    var vs = (window.VARIANTS && window.VARIANTS[String(famId).toLowerCase()]) || null;
    if (!vs || !vs.length) return "";
    // 按在役数降序排列
    var sorted = vs.slice().sort(function (x, y) { return (y.n || 0) - (x.n || 0); });
    if (compact) {
      // 首页：最多显示 4 个
      var top = sorted.slice(0, 4);
      var rest = sorted.length - 4;
      var chips = top.map(function (v) {
        var noteClass = (v.role && v.role.indexOf("待核实") >= 0) ? ' vf-uncertain' : '';
        return '<span class="vf-chip' + noteClass + '"><b>' + esc(v.name) + '</b><i>≈' + esc(v.n) + ' 架</i></span>';
      }).join("");
      if (rest > 0) chips += '<span class="vf-chip vf-more">+ ' + rest + ' 型号 见详情</span>';
      return '<div class="vf-compact"><div class="vf-label">主力在役型号</div><div class="vf-row">' + chips + '</div></div>';
    }
    // 详情页：完整列表
    var rows = sorted.map(function (v) {
      var pct = Math.min(100, ((v.n || 0) / sorted[0].n) * 100);
      var note = v.role ? '<span class="vf-role">' + esc(v.role) + '</span>' : '';
      var noteClass = (v.role && v.role.indexOf("待核实") >= 0) ? ' vf-uncertain' : '';
      if (v.n <= 0) {
        return '<li class="vf-row' + noteClass + '"><span class="vf-n">' + esc(v.name) + '</span>' +
          '<span class="vf-num"><b>0</b> 架</span><span class="vf-bar"><span class="vf-fill zero"></span></span>' + note + '</li>';
      }
      return '<li class="vf-row' + noteClass + '"><span class="vf-n">' + esc(v.name) + '</span>' +
        '<span class="vf-num"><b>≈' + esc(v.n) + '</b> 架</span>' +
        '<span class="vf-bar"><span class="vf-fill" style="width:' + pct + '%"></span></span>' +
        note + '</li>';
    }).join("");
    return '<div class="vf-full"><h4>各型号在役一览</h4>' +
      '<p class="vf-disclaimer">以下为近似值（≈），来源：planespotters / ch-aviation / 行业报道；部分数据标记"待核实"。</p>' +
      '<ul class="vf-list">' + rows + '</ul></div>';
  }

  /* 家族卡片：一个家族 = 一张卡片；卡片内把「系列 / 改型」连成一行（同排）展示 */
  function familyCard(f) {
    var a = BYID[f.rep];
    if (!a) return "";
    var b = BRANDS[a.mfr];
    var prod = (window.PROD && window.PROD[a.id]) || "—";
    var firstFlight = a.specs["首飞"] || "—";
    var seats = a.specs["典型载客"] || "—";
    var series = (f.series || []).map(function (s) {
      var vs = (s.variants || []).map(function (v) {
        return '<span class="sv">' + esc(v) + '</span>';
      }).join("");
      return '<div class="ser" title="' + esc(s.note || "") + '">' +
        '<div class="ser-n">' + esc(s.name) + '</div>' +
        '<div class="ser-y">' + esc(s.years || "") + '</div>' +
        '<div class="ser-v">' + vs + '</div>' +
      '</div>';
    }).join('<span class="ser-conn" aria-hidden="true">›</span>');
    var famName = f.name || a.name;
    return '<article class="fam-card" style="--bc:' + b.accent + '">' +
      galleryViewerHtml(a) +
      '<div class="ac-body">' +
        '<div class="ac-tags">' +
          '<span class="tag mfr">' + esc(b.short) + '</span>' +
          '<span class="tag">' + TYPE_LABEL[a.type] + '</span>' +
        '</div>' +
        '<h3><a href="#/a/' + a.id + '">' + esc(famName) + '</a></h3>' +
        '<p class="ac-tl">' + esc(a.tagline) + '</p>' +
        (f.overview ? '<p class="fam-ov">' + esc(f.overview) + '</p>' : '') +
        '<div class="series-label">改型 / 系列</div>' +
        '<div class="series-strip">' + series + '</div>' +
        '<div class="ac-stats">' +
          '<div class="ac-stat"><span class="k">首飞</span><b>' + esc(firstFlight) + '</b></div>' +
          '<div class="ac-stat"><span class="k">产销</span><b>' + esc(prod) + '</b></div>' +
          '<div class="ac-stat"><span class="k">载客</span><b>' + esc(seats) + '</b></div>' +
          infleetStat(a) +
        '</div>' +
        variantFleetHtml(a.id, true) +
        '<div class="ac-actions">' +
          '<a class="btn primary full" href="#/a/' + a.id + '">查看详情</a>' +
          '<button class="btn full" data-cmp="' + a.id + '" aria-pressed="' + inCompare(a.id) + '">' +
            (inCompare(a.id) ? "✓ 已加入" : "＋ 对比") + '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- 机队首页（制造商 → 家族 → 具体型号卡片） ---------- */
  /* idx = 该型号在家族内的序号，用于在家族图库里轮换出不同照片 */
  function variantCardHtml(v, a, idx) {
    var ph = variantHero(v, idx);
    var inf = matchVariantInfleet(v);
    var infHtml = inf
      ? '<span class="vc-stat"><i>在役</i><b class="if if-' + infleetTagFromVariant(inf.n) + '">' + esc(inf.n) + '</b></span>'
      : '<span class="vc-stat"><i>在役</i><b>—</b></span>';
    var prod = variantProd(v, a);
    var prodHtml = '<span class="vc-stat"><i>产销</i><b>' + (prod === "—" ? "—" : esc(prod)) + '</b></span>';
    var yearHtml = '<span class="vc-stat"><i>首飞</i><b>' + esc(v.year) + '</b></span>';
    return '<article class="vc-card">' +
      '<a class="vc-ph" href="#/v/' + v.id + '">' +
        '<img src="' + ph + '" alt="' + esc(v.name) + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'assets/img/' + a.id + '.jpg\'">' +
      '</a>' +
      '<div class="vc-body">' +
        '<div class="vc-name"><a href="#/v/' + v.id + '">' + esc(v.name) + '</a></div>' +
        '<div class="vc-era">' + esc(v.era) + (v.year ? ' · ' + esc(v.year) : '') + '</div>' +
        (v.spec ? '<div class="vc-spec">' + esc(v.spec) + '</div>' : '') +
        '<div class="vc-stats">' + yearHtml + infHtml + prodHtml + '</div>' +
        '<p class="vc-note">' + esc(v.note) + '</p>' +
      '</div>' +
    '</article>';
  }
  function renderHome() {
    var VC = window.VARIANT_CARDS || [];
    var FAM = window.FAMILIES || {};
    var typeMatch = function (a) { return state.type === "all" || a.type === state.type; };
    var mfrList = state.mfr === "all" ? Object.keys(BRANDS) : [state.mfr];

    // 按 family id 分组
    var byFam = {};
    VC.forEach(function (v) {
      if (!byFam[v.fam]) byFam[v.fam] = [];
      byFam[v.fam].push(v);
    });

    var blocks = mfrList.map(function (m) {
      var b = BRANDS[m];
      if (!b) return "";
      var famIds = Object.keys(byFam).filter(function (fid) {
        var a = BYID[fid];
        return a && a.mfr === m && typeMatch(a);
      });
      if (!famIds.length) return "";
      var famBlocks = famIds.map(function (fid) {
        var a = BYID[fid];
        var fam = FAM[fid];
        var vs = byFam[fid];
        var cards = vs.map(function (v, i) { return variantCardHtml(v, a, i); }).join("");
        return '<div class="fam-block" style="--bc:' + b.accent + '">' +
          '<div class="fam-head">' +
            '<div class="fam-head-main">' +
              '<span class="fam-kicker">家族 / FAMILY</span>' +
              '<h3><a href="#/a/' + a.id + '">' + esc((fam && fam.name) || a.name) + '</a></h3>' +
              (fam && fam.overview ? '<p class="fam-ov-vc">' + esc(fam.overview) + '</p>' : '') +
            '</div>' +
            '<a class="btn ghost fam-entry" href="#/a/' + a.id + '">查看家族 →</a>' +
          '</div>' +
          '<div class="vc-grid">' + cards + '</div>' +
        '</div>';
      }).join("");
      return '<section class="mfr-block" style="--bc:' + b.accent + '">' +
        '<header class="mfr-head">' +
          '<span class="mfr-bar"></span>' +
          '<div class="mfr-meta"><h2>' + esc(b.name) + '</h2>' +
          '<span class="mfr-count">' + famIds.length + ' 个系列</span></div>' +
        '</header>' +
        famBlocks +
      '</section>';
    }).join("");

    var mfrChips = ["all"].concat(Object.keys(BRANDS)).map(function (m) {
      var lab = m === "all" ? "全部" : (BRANDS[m] ? BRANDS[m].short : m);
      return '<span class="chip ' + (state.mfr === m ? "on" : "") + '" data-mfr="' + m + '" data-filter="mfr">' + esc(lab) + '</span>';
    }).join("");
    var typeChips = ["all"].concat(TYPES).map(function (t) {
      var lab = t === "all" ? "全部" : TYPE_LABEL[t];
      return '<span class="chip ' + (state.type === t ? "on" : "") + '" data-type="' + t + '" data-filter="type">' + esc(lab) + '</span>';
    }).join("");

    return '' +
      '<section class="hero">' +
        '<h1>认出每一架你抬头看见的飞机</h1>' +
        '<p>波音 · 空客 · 中国商飞 · 巴航 · 庞巴迪 · 麦道 · 图波列夫 … 主力机型的真实照片图鉴。按制造商与「系列」梳理，每款都配图库大图（点图可左右翻看）、首飞年份、产销数量与载客量；到了机场照着快速识别要点就能叫出名字。</p>' +
        '<div class="kpis">' +
          '<div class="kpi"><b>' + (window.VARIANT_CARDS ? window.VARIANT_CARDS.length : A.length) + '</b><span>具体型号 VARIANTS</span></div>' +
          '<div class="kpi"><b>' + Object.keys(BRANDS).length + '</b><span>MANUFACTURERS 制造商</span></div>' +
          '<div class="kpi"><b>' + Object.keys(FAM).length + '</b><span>FAMILIES 家族</span></div>' +
          '<div class="kpi"><b>∞</b><span>OFFLINE 可离线</span></div>' +
        '</div>' +
      '</section>' +
      '<div class="filters">' +
        '<div class="fgroup"><span class="lab">MFR</span>' + mfrChips + '</div>' +
        '<div class="fgroup"><span class="lab">CLASS</span>' + typeChips + '</div>' +
      '</div>' +
      (blocks ? blocks : '<div class="empty">没有符合条件的机型，换个筛选试试。</div>') +
      '<p class="home-note">每张卡片为该家族下的一个具体飞行型号，均标注「首飞 · 在役 · 产销」：在役为截至 2025/2026 年仍在飞的近似架数（来源 planespotters / ch-aviation / 行业公开报道，部分标注"待核实"），产销量取型号级近似值（缺则家族级兜底）。点卡片或照片进入该型号专属详情页。同一家族内不同改型分配家族图库里不同角度的照片（跨代差异大的型号如 737 Original/NG/MAX、747-400/8 仍在补充各自专属实拍图）。照片来自 Wikimedia Commons（CC 授权），仅供学习交流。</p>';
  }

  /* ---------- 机型图库（真实照片网格 + 灯箱） ---------- */
  function renderGallery(a) {
    var items = (window.GALLERY && window.GALLERY[a.id]) || [];
    if (!items.length) return '<p class="empty">本机型暂无图库照片，欢迎补充。</p>';
    var tiles = items.map(function (it) {
      var inner = it.kind === "sil"
        ? '<div class="gal-sil"><img src="' + esc(it.src) + '" alt="' + esc(it.cap) + '" loading="lazy"></div>'
        : '<img src="' + esc(it.src) + '" alt="' + esc(it.cap) + '" loading="lazy">';
      return '<button class="gal-tile" data-kind="' + esc(it.kind) + '" type="button">' +
        inner +
        (it.kind === "sil" ? '<span class="gal-tag">线图</span>' : '') +
        '<span class="gal-cap">' + esc(it.cap) + '</span>' +
        '</button>';
    }).join("");
    return '<div class="gal-grid">' + tiles + '</div>' +
      '<p class="gal-foot">照片来自 Wikimedia Commons（CC 授权），仅供学习交流。点击任意照片可放大查看。</p>';
  }

  /* ---------- 详情 ---------- */
  function renderDetail(id) {
    var a = byId(id);
    if (!a) return '<div class="empty">找不到该机型。<a href="#/">返回机队</a></div>';
    var b = brand(a);

    var inlineSpec = Object.keys(a.specs).slice(0, 6).map(function (k) {
      return '<div class="row"><span class="k">' + esc(k) + '</span><span class="v">' + esc(a.specs[k]) + '</span></div>';
    }).join("");

    var quick = a.quickId.map(function (t, i) {
      return '<li><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>';
    }).join("");

    var specRows = Object.keys(a.specs).map(function (k) {
      return '<tr><th>' + esc(k) + '</th><td>' + esc(a.specs[k]) + '</td></tr>';
    }).join("");

    var outline = threeViews(a);

    return '' +
      '<div class="detail-back"><a class="btn ghost" href="#/">← 返回机队</a></div>' +
      '<div class="detail-head">' +
        '<div>' + galleryViewerHtml(a) + '</div>' +
        '<div class="detail-meta" style="--bc:' + b.accent + '">' +
          '<h1>' + esc(a.name) + '</h1>' +
          '<p class="sub"><span class="mfr">' + esc(b.name) + '</span> · ' + TYPE_LABEL[a.type] + '客机</p>' +
          '<div class="inline-spec">' + inlineSpec + '</div>' +
          infleetLine(a) +
        '</div>' +
      '</div>' +
      '<div class="detail-tools">' +
        '<button class="btn ' + (inCompare(a.id) ? "" : "primary") + '" data-cmp="' + a.id + '" aria-pressed="' + inCompare(a.id) + '">' +
          (inCompare(a.id) ? "✓ 已在对比中" : "＋ 加入对比") + '</button>' +
        '<a class="btn" href="#/compare">前往机型对比 →</a>' +
        '<a class="btn ghost" href="#/quiz">去识别练习</a>' +
      '</div>' +
      '<div class="tabs" id="dtabs">' +
        '<button data-tab="hist" class="on">介绍与历史</button>' +
        '<button data-tab="id">快速识别</button>' +
        '<button data-tab="gallery">图库</button>' +
        '<button data-tab="spec">规格</button>' +
        '<button data-tab="outline">三视图</button>' +
      '</div>' +
      '<div id="dpanel">' +
        '<div class="panel hidden" data-panel="id"><ul class="checklist">' + quick + '</ul></div>' +
        '<div class="panel hidden" data-panel="gallery">' + renderGallery(a) + '</div>' +
        '<div class="panel hidden" data-panel="spec"><table class="spec-table"><tbody>' + specRows + '</tbody></table></div>' +
        '<div class="panel" data-panel="hist">' +
          (a.intro ? '<p class="hist-lead">' + esc(a.intro) + '</p>' : '') +
          (a.history ? '<div class="v-block v-hist"><h4>发展脉络</h4><p>' + esc(a.history) + '</p></div>' : '') +
          '<h4>演进时间轴 · 这型是怎么一代代改进的</h4>' +
          (function () {
            var FAM = window.FAMILIES || {};
            var fam = FAM[a.family];
            if (!fam) return '<p class="empty">本机型暂无系列划分数据。</p>';
            return '<p class="fam-ov-inline">' + esc(fam.overview) + '</p>' + evolutionTimelineHtml(fam);
          })() +
          variantFleetHtml(a.id, false) +
          '<h4>系谱 · 从哪来到哪去（点图可进其他机型）</h4>' + renderLineageVisual(a) +
        '</div>' +
        '<div class="panel hidden" data-panel="outline">' + outline + '</div>' +
      '</div>';
  }

  /* ---------- 具体型号独立详情页（#/v/<id>） ---------- */
  /* v1.14 重写：恢复与旧家族详情页一样丰富的 6 标签页。
   * 每个标签页都「优先用该型号专属内容（window.VDETAIL），缺失才回退家族级（a.*）」，
   * 所以 737-200 点进去只讲 737-200 自己的故事/引擎/识别要点，家族时间轴/在役/系谱作为背景保留。 */
  function renderVariantDetail(vId) {
    var v = (window.VARIANT_BY_ID && window.VARIANT_BY_ID[vId]) || null;
    if (!v) return '<div class="empty">找不到该型号。<a href="#/">返回机队</a></div>';
    var a = BYID[v.fam];
    if (!a) return '<div class="empty">找不到所属家族。<a href="#/">返回机队</a></div>';
    var b = brand(a);
    var FAM = window.FAMILIES[v.fam];
    var rich = (window.VDETAIL && window.VDETAIL[v.id]) || {};
    // 事故数量统计（用于详情页展示）
    var accCount = (rich.accidents && rich.accidents.length) ? rich.accidents.length : 0;

    // 该型号专属图库：优先用 VGAL（每款机型独立抓取的 10 张实拍图），否则回退家族图库轮换
    var famGal = (window.GALLERY && window.GALLERY[v.fam]) || [];
    var vgPaths = (window.VGAL && window.VGAL[v.id]) || [];
    var vphoto = vgPaths.length ? vgPaths[0] : variantHero(v, 0);
    var vg = [];
    if (vgPaths.length) {
      vg = vgPaths.map(function (p, i) { return { src: p, cap: v.name + " · 实拍 " + (i + 1) + " / " + vgPaths.length, kind: "photo" }; });
    } else if (window.VARIANT_PHOTO && window.VARIANT_PHOTO[v.id]) {
      vg.push({ src: vphoto, cap: v.name + " · 实拍", kind: "photo" });
      famGal.forEach(function (it) { if (it.src !== vphoto) vg.push(it); });
    } else if (famGal.length) {
      var start = 0;
      for (var s = 0; s < famGal.length; s++) { if (famGal[s].src === vphoto) { start = s; break; } }
      for (var k = 0; k < famGal.length; k++) vg.push(famGal[(start + k) % famGal.length]);
    }
    window.GALLERY[v.id] = vg; // 供图库查看器导航

    var inf = matchVariantInfleet(v);
    var infHtml = inf
      ? '<tr><th>在役</th><td><b class="if if-' + infleetTagFromVariant(inf.n) + '">' + esc(inf.n) + '</b> 架' +
        (inf.role ? ' <span class="if-tip">' + esc(inf.role) + '</span>' : '') + '</td></tr>'
      : '<tr><th>在役</th><td>—</td></tr>';
    var prod = variantProd(v, a);
    var prodHtml = '<tr><th>产销</th><td>' + (prod === "—" ? "—" : esc(prod) + ' 架（≈）') + '</td></tr>';

    // 介绍：优先该型号专属故事，否则家族 intro
    var introText = rich.story || a.intro;
    // 规格：优先该型号专属 specs，否则家族 specs
    var specObj = rich.specs || a.specs;
    var specRows = Object.keys(specObj).map(function (kk) {
      return '<tr><th>' + esc(kk) + '</th><td>' + esc(specObj[kk]) + '</td></tr>';
    }).join("");
    // 快速识别：优先该型号专属 quick，否则家族 quickId
    var quick = (rich.quick && rich.quick.length) ? rich.quick : a.quickId;
    var quickHtml = quick.map(function (t, i) {
      return '<li><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>';
    }).join("");
    // 识别术语小词典（通用，覆盖全机型；解决「分叉小翼/发动机」等术语不懂的问题）
    var ID_GLOSSARY = [
      { key: "cockpit", term: "驾驶舱舷窗", en: "Cockpit Window", desc: "驾驶舱侧窗最下沿：波音呈 V 形向下斜，空客近乎平直。白天最可靠的判据之一。" },
      { key: "engine", term: "发动机短舱", en: "Nacelle", desc: "包裹发动机的外壳。737 因起落架矮，短舱下缘扁平贴地；多数空客为圆短舱自然垂于翼下。" },
      { key: "winglet", term: "翼梢小翼", en: "Winglet", desc: "翼尖减阻装置。737NG 为融合式、MAX 为分叉式（上下分叉的「小叉子」）；A320neo 为垂直上翘的「鲨鳍小翼」；787/777 无直立小翼、翼尖斜削如刀（斜削翼尖）。" },
      { key: "door", term: "客舱门", en: "Cabin Door", desc: "机身侧面登机门。门的数量与位置可辅助判断机型大小（如 737 每侧 2 门、777 每侧 4 门）。" },
      { key: "tail", term: "尾翼 / APU", en: "Tail / APU", desc: "机尾辅助动力装置（APU）排气口：波音圆润饱满，空客截平如被削方。绕到机尾一眼可分。" },
      { key: "strobe", term: "频闪灯", en: "Strobe", desc: "翼尖发光信号灯。波音闪一下、停顿循环；空客连闪两下、停顿循环（夜间/大雾最有效）。" }
    ];
    var ID_GLOSSARY_MAP = {}; ID_GLOSSARY.forEach(function (g) { ID_GLOSSARY_MAP[g.key] = g; });
    function annoHotspot(label, key, x, y) {
      var g = ID_GLOSSARY_MAP[key] || { desc: label };
      return '<button class="anno-dot" type="button" style="left:' + x + ';top:' + y + '" data-anno="' + key + '" aria-label="' + label + '">' +
        '<span class="anno-ring"></span>' +
        '<span class="anno-pop"><b>' + label + '</b><span>' + esc(g.desc) + '</span></span></button>';
    }
    function glossaryHtml() {
      return ID_GLOSSARY.map(function (g) {
        return '<div class="gloss-item"><div class="g-term">' + g.term + ' <span class="g-en">' + g.en + '</span></div><div class="g-desc">' + esc(g.desc) + '</div></div>';
      }).join("");
    }
    // 引擎迭代：该型号专属（用户明确要求）
    var engineHtml = rich.engine
      ? '<div class="v-engine"><h4>引擎型号迭代</h4><p>' + esc(rich.engine) + '</p></div>'
      : '';
    // 新增：相比上一代升级 / 标志性特点 / 著名事件 / 重大事故（用户明确要求精确到机型）
    var listHtml = function (arr) {
      if (!arr || !arr.length) return '';
      return arr.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");
    };
    // 可展开组件：每条事件/事故渲染为 <details>，summary 为标题 t，展开为详情 d
    var expandListHtml = function (arr) {
      if (!arr || !arr.length) return '';
      return '<ul class="v-list v-expand-list">' + arr.map(function (it) {
        if (typeof it === 'string') {
          return '<li><details class="vexpand"><summary>事件详情</summary><div class="vexpand-d">' + esc(it) + '</div></details></li>';
        }
        var t = it.t || '详情', d = it.d || '';
        return '<li><details class="vexpand"><summary>' + esc(t) + '</summary><div class="vexpand-d">' + esc(d) + '</div></details></li>';
      }).join('') + '</ul>';
    };
    var upgradeHtml = rich.upgrade
      ? '<div class="v-block v-upgrade"><h4>相比上一代升级了什么</h4><ul class="v-list">' + listHtml(rich.upgrade) + '</ul></div>'
      : '';
    // ===== 特点分层：通俗的重点特点前置到首屏信息表，较专业的并入「深入了解」 =====
    var TERM_NOTES = {
      "涵道比": "发动机外圈风扇气流与内芯气流之比，数值越高越省油、越安静",
      "电传": "用电信号代替钢索传递操纵指令，由计算机辅助飞行员操纵",
      "ETOPS": "双发客机远离备降机场飞行的安全认证，数值越大越能自由飞越洋航线",
      "翼梢小翼": "翼尖上翘的小翼片，用来减小阻力、节省燃油",
      "整流罩": "包在部件外面减小风阻的流线型外壳",
      "APU": "装在机尾的辅助小发动机，供地面用电和启动主发动机",
      "复合材料": "碳纤维等又轻又结实的新型材料",
      "短舱": "包裹发动机的外壳",
      "MTOW": "最大起飞重量"
    };
    var JARGON_RE = /涵道比|电传|ETOPS|整流罩|APU|复合材料|短舱|MTOW|构型|气动|展弦比|翼载|涡扇|配平|增压|静稳定/;
    // 给文本中首次出现的术语补一句白话解释（最多 2 处，避免啰嗦）
    function explainTech(text) {
      if (!text) return text;
      var out = text, added = 0;
      Object.keys(TERM_NOTES).forEach(function (term) {
        if (added >= 2) return;
        var i = out.indexOf(term);
        if (i < 0) return;
        var after = out.slice(i + term.length);
        if (after.charAt(0) === "（" || after.charAt(0) === "(") return; // 已有括注
        out = out.slice(0, i + term.length) + "（" + TERM_NOTES[term] + "）" + after;
        added++;
      });
      return out;
    }
    var allFeats = rich.features || [];
    var keyFeats = [], deepFeats = [];
    allFeats.forEach(function (f) {
      if (keyFeats.length < 3 && !JARGON_RE.test(f) && f.length <= 30) keyFeats.push(f);
      else deepFeats.push(f);
    });
    if (!keyFeats.length && allFeats.length) { keyFeats = allFeats.slice(0, 2); deepFeats = allFeats.slice(2); }
    var keyFeatRow = keyFeats.length
      ? '<tr><th>标志特点</th><td><ul class="kf-list">' + keyFeats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul></td></tr>'
      : '';
    // 合并章节：较专业的特点（附白话注释）+ 历史事件/趣闻，统一放一个框
    var deepFeatHtml = deepFeats.length
      ? '<ul class="v-list v-deepfeat">' + deepFeats.map(function (f) { return '<li>' + esc(explainTech(f)) + '</li>'; }).join("") + '</ul>'
      : '';
    var eventsExpand = rich.events ? expandListHtml(rich.events.map(function (it) {
      if (typeof it === 'string') return explainTech(it);
      return { t: it.t, d: explainTech(it.d) };
    })) : '';
    var deepHtml = (deepFeatHtml || eventsExpand)
      ? '<div class="v-block v-deep"><h4>深入了解 · 特点详解与历史趣闻</h4>' +
        (deepFeatHtml ? '<p class="v-deep-sub">这些特点略偏专业，已附上白话解释：</p>' + deepFeatHtml : '') +
        (eventsExpand ? (deepFeatHtml ? '<p class="v-deep-sub">相关历史事件与趣闻（点开看详情）：</p>' : '') + eventsExpand : '') +
        '</div>'
      : '';
    var accidentsHtml = (rich.accidents && rich.accidents.length)
      ? '<div class="v-block v-acc"><h4>重大事故记录（' + rich.accidents.length + ' 起）</h4>' + expandListHtml(rich.accidents) + '</div>'
      : '';

    // 系谱选项卡：技术演进脉络叙述（前身 → 本机 → 后续衍生）
    var fromNames = ((a.lineage && a.lineage.from) || []).map(function (n) { return typeof n === "string" ? n : n.label; });
    var toNames = (a.derivatives || []).map(function (n) { return typeof n === "string" ? n : n.label; });
    var lineageNarr = "";
    if (fromNames.length) {
      lineageNarr += '<p class="ln-narr">本机的技术渊源来自 <b>' + esc(fromNames.join("、")) + '</b>。相较前代，本机重点升级了上方「相比上一代升级了什么」所列内容。</p>';
    }
    if (toNames.length) {
      lineageNarr += '<p class="ln-narr">以此为基础，后续又衍生发展出 <b>' + esc(toNames.join("、")) + '</b>，构成 ' + esc((FAM && FAM.name) || a.name) + ' 家族的持续演进序列。</p>';
    }

    return '' +
      '<div class="detail-back"><a class="btn ghost" href="#/">← 返回机队</a></div>' +
      '<div class="detail-head">' +
        '<div>' + galleryViewerHtml({ id: v.id, name: v.name, mfr: a.mfr }) + '</div>' +
        '<div class="detail-meta" style="--bc:' + b.accent + '">' +
          '<div class="ac-tags">' +
            '<span class="tag mfr">' + esc(b.short) + '</span>' +
            '<span class="tag">' + TYPE_LABEL[a.type] + '</span>' +
            (FAM ? '<span class="tag fam"><a href="#/a/' + a.id + '">' + esc(FAM.name) + ' 家族 →</a></span>' : '') +
            (accCount ? '<span class="tag acc">事故 ' + accCount + ' 起</span>' : '') +
          '</div>' +
          '<h1>' + esc(v.name) + '</h1>' +
          '<p class="sub">' + esc(v.era) + (v.year ? ' · 首飞 ' + esc(v.year) : '') + '</p>' +
          '<table class="spec-table"><tbody>' +
            '<tr><th>首飞</th><td>' + esc(v.year) + '</td></tr>' +
            prodHtml + infHtml +
            '<tr><th>事故记录</th><td>' + (accCount ? '<b class="acc-n">' + accCount + ' 起</b>（详情见「介绍与历史」）' : '无公开重大记录') + '</td></tr>' +
            keyFeatRow +
          '</tbody></table>' +
          '<div class="detail-tools">' +
            '<button class="btn ' + (inCompare(a.id) ? "" : "primary") + '" data-cmp="' + a.id + '" aria-pressed="' + inCompare(a.id) + '">' +
              (inCompare(a.id) ? "✓ 已在对比中" : "＋ 加入对比") + '</button>' +
            '<a class="btn ghost" href="#/a/' + a.id + '">查看 ' + esc((FAM && FAM.name) || a.name) + ' 家族 →</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tabs" id="vtabs">' +
        '<button data-tab="hist" class="on">介绍与历史</button>' +
        '<button data-tab="id">快速识别</button>' +
        '<button data-tab="gal">图库</button>' +
        '<button data-tab="spec">规格</button>' +
        '<button data-tab="outline">三视图</button>' +
        '<button data-tab="lineage">系谱</button>' +
      '</div>' +
      '<div id="vpanel">' +
        '<div class="panel hidden" data-panel="id">' +
          '<div class="v-idcard">' +
            '<div class="idphoto-wrap">' +
              '<img class="v-idphoto" src="' + vphoto + '" alt="' + esc(v.name) + ' 识别图" loading="lazy">' +
              '<button class="id-anno-toggle" type="button" data-anno-toggle>🔍 显示特征标注</button>' +
              '<div class="id-anno-layer">' +
                annoHotspot("驾驶舱舷窗", "cockpit", "20%", "30%") +
                annoHotspot("发动机短舱", "engine", "44%", "62%") +
                annoHotspot("翼梢小翼", "winglet", "89%", "40%") +
                annoHotspot("客舱门", "door", "58%", "50%") +
                annoHotspot("尾翼 / APU", "tail", "91%", "19%") +
              '</div>' +
            '</div>' +
            '<div class="v-idmeta"><span class="v-idtag">机型识别图</span><p>' + esc(v.name) + ' · ' + esc(v.era || '') + '</p></div>' +
          '</div>' +
          '<ul class="checklist">' + quickHtml + '</ul>' +
          '<div class="glossary"><h4>识别术语小词典</h4><p class="gloss-tip">点开上方「显示特征标注」可在图上查看各部位；下方解释常见术语。</p><div class="gloss-grid">' + glossaryHtml() + '</div></div>' +
        '</div>' +
        '<div class="panel hidden" data-panel="gal">' + renderGallery({ id: v.id }) + '</div>' +
        '<div class="panel hidden" data-panel="spec"><table class="spec-table"><tbody>' + specRows + '</tbody></table>' +
          (prod !== "—" ? '<p class="v-note">产销为型号级近似值（≈），来源行业公开报道；标注"待核实"者以家族级兜底。</p>' : '') +
        '</div>' +
        '<div class="panel" data-panel="hist">' +
          (introText ? '<p class="hist-lead">' + esc(explainTech(introText)) + '</p>' : '') +
          deepHtml +
          accidentsHtml +
          (FAM ? '<h4>所属家族演进 · ' + esc(FAM.name) + ' 是怎么一代代改进的</h4>' +
            '<p class="fam-ov-inline">' + esc(FAM.overview) + '</p>' + evolutionTimelineHtml(FAM) : '') +
        '</div>' +
        '<div class="panel hidden" data-panel="lineage">' +
          engineHtml +
          upgradeHtml +
          lineageNarr +
          '<h4>系谱 · 从哪来到哪去（点图可进其他机型）</h4>' + renderLineageVisual(a) +
        '</div>' +
        '<div class="panel hidden" data-panel="outline">' + threeViews(a) + '</div>' +
      '</div>';
  }

  var SIL_IDS = ["b737", "b747", "b777", "b787", "a380", "a320"];
  function silExists(id) { return SIL_IDS.indexOf(id) >= 0; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  // 每题从图库随机抽一张真实照片（轮廓模式优先矢量线图）
  function pickQuizImage(a, mode) {
    if (mode === "silhouette") {
      return { type: "sil", src: silExists(a.id) ? ("assets/sil/" + a.id + ".svg") : ("assets/img/" + a.id + ".jpg") };
    }
    var g = (window.GALLERY && window.GALLERY[a.id]) || [];
    var photos = g.filter(function (x) { return x.kind === "photo"; });
    if (!photos.length) photos = g;
    if (photos.length) {
      var p = photos[Math.floor(Math.random() * photos.length)];
      return { type: "photo", src: p.src, cap: p.cap };
    }
    return { type: "photo", src: "assets/img/" + a.id + ".jpg", cap: "" };
  }
  // 干扰项：优先同厂 + 同级（易混），再补随机
  function buildDistractors(correct) {
    var pool = A.filter(function (x) { return x.id !== correct.id; });
    var sameMfr = pool.filter(function (x) { return x.mfr === correct.mfr; });
    var sameCls = pool.filter(function (x) { return x.type === correct.type && sameMfr.indexOf(x) < 0; });
    var pref = sameMfr.concat(sameCls);
    shuffle(pref);
    var opts = pref.slice(0, 3);
    if (opts.length < 3) {
      var rest = pool.filter(function (x) { return opts.indexOf(x) < 0; });
      shuffle(rest);
      opts = opts.concat(rest.slice(0, 3 - opts.length));
    }
    return opts;
  }
  function startQuizSession(opts) {
    var len = opts.length || 30;
    var mode = opts.mode || "photo";
    var pool = A.slice();
    shuffle(pool);
    var questions = [];
    for (var i = 0; i < len; i++) {
      // 前 26 题尽量覆盖全部机型，之后随机抽取
      var correct = (i < pool.length) ? pool[i] : pool[Math.floor(Math.random() * pool.length)];
      var distract = buildDistractors(correct);
      var allOpts = [correct].concat(distract);
      shuffle(allOpts);
      questions.push({
        correctId: correct.id,
        options: allOpts.map(function (x) { return x.id; }),
        img: pickQuizImage(correct, mode),
        answered: false,
        picked: null
      });
    }
    state.quiz = { mode: mode, length: len, questions: questions, idx: 0, score: { c: 0, t: 0 }, phase: "play", setup: opts };
  }
  function renderQuizSetup() {
    var s = state.quizSetup || { len: 30, mode: "photo" };
    return '<div class="quiz-setup"><div class="quiz-card">' +
      '<h2>识别练习</h2>' +
      '<p class="qset-desc">用真实机场照片练「抬头认机」。每题 4 选 1，答完会告诉你为什么是它、错在哪。覆盖全部 ' + A.length + ' 款机型。</p>' +
      '<div class="qset-row"><span class="qset-lab">题量</span>' +
        '<div class="seg" data-set="len">' +
          '<button data-len="10" class="' + (s.len === 10 ? "on" : "") + '">10 题</button>' +
          '<button data-len="20" class="' + (s.len === 20 ? "on" : "") + '">20 题</button>' +
          '<button data-len="30" class="' + (s.len === 30 ? "on" : "") + '">30 题</button>' +
        '</div></div>' +
      '<div class="qset-row"><span class="qset-lab">看图</span>' +
        '<div class="seg" data-set="mode">' +
          '<button data-mode="photo" class="' + (s.mode === "photo" ? "on" : "") + '">实拍照片</button>' +
          '<button data-mode="silhouette" class="' + (s.mode === "silhouette" ? "on" : "") + '">纯轮廓</button>' +
        '</div></div>' +
      '<button class="btn primary qset-start" data-start>开始练习 →</button>' +
      '<p class="qset-note">提示：纯轮廓模式仅 ' + SIL_IDS.length + ' 款机型有矢量线图，其余回退为实拍照片。</p>' +
      '</div></div>';
  }
  function quizMediaHtml(item, a) {
    if (item.img.type === "sil") {
      return '<div class="media" style="display:flex;align-items:center;justify-content:center;background:#060a12">' +
        '<img class="quiz-sil" src="' + item.img.src + '" alt="" ' +
        'onerror="window.__quizSilFail(this,\'' + a.id + '\',\'' + a.mfr + '\')"></div>';
    }
    return '<div class="media">' +
      '<img class="quiz-photo" src="' + item.img.src + '" alt="" ' +
      'onerror="this.onerror=null;this.src=\'assets/img/' + a.id + '.jpg\'"></div>';
  }
  function renderQuiz() {
    if (!state.quiz) return renderQuizSetup();
    if (state.quiz.phase === "result") return renderQuizResult();
    var q = state.quiz;
    var item = q.questions[q.idx];
    var a = byId(item.correctId);
    var media = quizMediaHtml(item, a);
    var opts = item.options.map(function (oid) {
      var o = byId(oid);
      var cls = "qopt";
      if (item.answered) {
        if (oid === item.correctId) cls += " correct";
        else if (oid === item.picked) cls += " wrong";
      }
      return '<button class="' + cls + '" data-pick="' + oid + '" ' + (item.answered ? "disabled" : "") + '>' + esc(o.name) + '</button>';
    }).join("");

    var fb = "";
    if (item.answered) {
      var ok = item.picked === item.correctId;
      var picked = byId(item.picked);
      var clues = (a.quickId || []).map(function (t, i) {
        return '<li><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>';
      }).join("");
      var wrongLine = (!ok && picked)
        ? '<p class="fb-wrong">你刚才选的是 <b>' + esc(picked.name) + '</b>——它' +
          (picked.quickId && picked.quickId[0] ? '：' + esc(picked.quickId[0]) : '。') + '</p>'
        : "";
      fb = '<div class="quiz-feedback show">' +
        '<div class="fb-title" style="color:' + (ok ? "var(--ok)" : "var(--bad)") + '">' +
          (ok ? "✓ 答对了！" + esc(a.name) : "✗ 正确答案是 " + esc(a.name)) + '</div>' +
        '<p>这是 <b>' + esc(brand(a).name) + '</b> 的' + TYPE_LABEL[a.type] + '客机。' + esc(a.tagline) + '</p>' +
        wrongLine +
        '<div class="fb-clues-h">在机场怎么认出它：</div>' +
        '<ul class="checklist fb-clues">' + clues + '</ul>' +
        '<p class="fb-foot">还拿不准？看 <a href="#/guide">识别导读（决策路线 + 动态演示）→</a> 或 <a href="#/a/' + a.id + '">查看完整图鉴 →</a></p>' +
      '</div>';
    }

    var pct = Math.round((q.idx / q.length) * 100);
    var isLast = q.idx >= q.length - 1;
    var nextLabel = (item.answered && isLast) ? "查看结果 →" : "下一题 →";

    return '<div class="quiz-wrap">' +
      '<div class="quiz-card">' +
        '<div class="quiz-progress">' +
          '<div class="qp-track"><div class="qp-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="qp-num">第 ' + (q.idx + 1) + ' / ' + q.length + ' 题</span>' +
        '</div>' +
        '<div class="quiz-media">' + media +
          '<span class="qmode">' + (q.mode === "silhouette" ? "轮廓模式 SILHOUETTE" : "实拍模式 PHOTO") + '</span>' +
          '<span class="qnum">识别练习</span>' +
          '<div class="scrim"></div>' +
        '</div>' +
        '<div class="quiz-body">' +
          '<p class="quiz-q">这是哪一型飞机？</p>' +
          '<div class="quiz-opts">' + opts + '</div>' +
          fb +
          '<div class="quiz-bar">' +
            '<span class="quiz-score">得分 <b>' + q.score.c + '</b> / ' + q.score.t + '</span>' +
            '<button class="btn primary" data-qnext ' + (item.answered ? "" : "disabled style=\"opacity:.5;cursor:not-allowed\"") + '>' + nextLabel + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="empty" style="padding:18px">提示：每题从图库随机抽一张真实照片，干扰项优先用同厂 / 同级别的「易混机型」，专治脸盲。</p>' +
    '</div>';
  }
  function renderQuizResult() {
    var q = state.quiz;
    var pctAll = q.length ? Math.round((q.score.c / q.length) * 100) : 0;
    var wrongs = [];
    q.questions.forEach(function (item) {
      if (item.picked !== item.correctId) wrongs.push(item);
    });
    var wrongHtml = wrongs.map(function (item) {
      var a = byId(item.correctId);
      var picked = byId(item.picked);
      var clues = (a.quickId || []).slice(0, 2).map(function (t) { return esc(t); }).join("；");
      return '<div class="wrong-pill">' +
        '<img src="' + item.img.src + '" onerror="this.style.display=\'none\'">' +
        '<div class="wp-txt"><b>' + esc(a.name) + '</b>' +
        (picked ? '<span class="wp-pick">你选了 ' + esc(picked.name) + '</span>' : '') +
        '<span class="wp-clue">认机要点：' + clues + '</span></div>' +
      '</div>';
    }).join("");
    return '<div class="quiz-setup"><div class="quiz-card">' +
      '<h2>练习完成</h2>' +
      '<div class="score-big"><b>' + q.score.c + '</b><span>/ ' + q.length + '</span></div>' +
      '<p class="qset-desc">准确率 <b>' + pctAll + '%</b>' +
        (pctAll >= 80 ? ' · 老飞友了 🛫' : pctAll >= 50 ? ' · 渐入佳境' : ' · 多刷两遍图库就熟了') + '</p>' +
      (wrongs.length ? '<div class="wp-h">错过的机型 · 回顾</div><div class="wrong-list">' + wrongHtml + '</div>'
        : '<p class="qset-desc">全部答对，认机大神！</p>') +
      '<div class="quiz-bar" style="margin-top:18px">' +
        '<button class="btn" data-restart-setup>重新设置</button>' +
        '<button class="btn primary" data-start-again>再来一组 →</button>' +
      '</div>' +
    '</div></div>';
  }

  /* ---------- 机型对比 ---------- */
  var CMP_SPECS = [
    ["typeLabel", "类型"],
    ["首飞", "首飞"],
    ["机身长度", "机身长度"],
    ["翼展", "翼展"],
    ["典型载客", "典型载客"],
    ["航程", "航程"],
    ["发动机", "发动机"]
  ];
  // 用于高亮“最优”的数值型规格
  var BEST = { "典型载客": "max", "航程": "max", "翼展": "max", "机身长度": "max" };
  function numOf(v) { var m = String(v).match(/[\d\.]+/g); if (!m) return null; return parseFloat(m[0]); }

  function renderCompare() {
    if (!state.compare.length) {
      return '<div class="section-h"><h2>机型对比</h2><span class="en">COMPARE</span></div>' +
        '<div class="cmp-empty">还没有选择机型。<br>回到<a href="#/" style="color:var(--accent)"> 机队 </a>页，点击卡片上的「＋ 对比」即可加入（最多 4 架）。</div>';
    }
    var sel = state.compare.map(byId).filter(Boolean);
    var head = '<tr><th class="spec-name">机型</th>' + sel.map(function (a) {
      var b = brand(a);
      return '<th><div class="cmp-col-head" style="--bc:' + b.accent + '">' +
        mediaHtml(a) +
        '<div class="nm">' + esc(a.name) + '</div>' +
        '<div class="mf">' + esc(b.name.split(" ")[0].toUpperCase()) + '</div>' +
        '</div></th>';
    }).join("") + '</tr>';

    var rows = CMP_SPECS.map(function (sp) {
      var key = sp[0], label = sp[1];
      var vals = sel.map(function (a) { return a.specs[key] != null ? a.specs[key] : (a[key] != null ? a[key] : "—"); });
      var bestIdx = -1;
      if (BEST[key]) {
        var nums = vals.map(numOf);
        var valid = nums.map(function (n, i) { return n != null ? i : -1; }).filter(function (i) { return i >= 0; });
        if (valid.length > 1) {
          var bestVal = BEST[key] === "max" ? -Infinity : Infinity;
          valid.forEach(function (i) {
            if (BEST[key] === "max" ? nums[i] > bestVal : nums[i] < bestVal) { bestVal = nums[i]; bestIdx = i; }
          });
        }
      }
      var cells = vals.map(function (v, i) {
        return '<td class="' + (i === bestIdx ? "best" : "") + '"><span class="val">' + esc(v) +
          (i === bestIdx ? '<span class="note">▲ 最优</span>' : '') + '</span></td>';
      }).join("");
      return '<tr><th class="spec-name">' + label + '</th>' + cells + '</tr>';
    }).join("");

    var tray = state.compare.map(function (id) {
      var a = byId(id); if (!a) return "";
      var b = brand(a);
      return '<span class="tray-pill" style="--bc:' + b.accent + '">' + esc(a.name) +
        '<span class="x" data-cmp="' + id + '" title="移除">✕</span></span>';
    }).join("");

    return '<div class="section-h"><h2>机型对比</h2><span class="en">COMPARE</span>' +
        '<span class="meta">已选 ' + sel.length + ' / 4</span></div>' +
      '<div class="compare-tray">' + tray +
        '<a class="btn ghost" href="#/">＋ 添加机型</a></div>' +
      '<div class="cmp-table-wrap"><table class="cmp-table"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ---------- 路由 ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, "") || "/";
    var mv = h.match(/^\/v\/(.+)$/);
    if (mv) return { route: "vdetail", id: mv[1] };
    var m = h.match(/^\/a\/(.+)$/);
    if (m) return { route: "detail", id: m[1] };
    if (h.indexOf("/quiz") === 0) return { route: "quiz" };
    if (h.indexOf("/compare") === 0) return { route: "compare" };
    if (h.indexOf("/guide") === 0) return { route: "guide" };
    return { route: "home" };
  }

  function render() {
    var r = parseHash();
    var view = document.getElementById("view");
    var html;
    if (r.route === "vdetail") html = renderVariantDetail(r.id);
    else if (r.route === "detail") html = renderDetail(r.id);
    else if (r.route === "quiz") html = renderQuiz();
    else if (r.route === "compare") html = renderCompare();
    else if (r.route === "guide") html = window.Guide.html(A);
    else html = renderHome();
    view.innerHTML = html;
    // 导航高亮
    document.querySelectorAll("#mainnav a").forEach(function (el) {
      el.classList.toggle("active", el.dataset.route === r.route);
    });
    bindViewEvents();
    if (r.route === "guide" && window.Guide && window.Guide.bind) window.Guide.bind();
    window.scrollTo(0, 0);
  }

  /* ---------- 图库查看器交互（前后翻看） ---------- */
  function setupGalleryViewers() {
    document.querySelectorAll(".gv").forEach(function (gv) {
      var id = gv.dataset.gv;
      var arr = (window.GALLERY && window.GALLERY[id]) || [];
      if (!arr.length) return;
      var img = gv.querySelector(".gv-img");
      var cap = gv.querySelector(".gv-cap-txt");
      var cnt = gv.querySelector(".gv-count");
      function go(dir) {
        var idx = parseInt(img.getAttribute("data-idx") || "0", 10);
        idx = (idx + dir + arr.length) % arr.length;
        img.setAttribute("data-idx", idx);
        img.src = arr[idx].src;
        if (cap) cap.textContent = arr[idx].cap || "";
        if (cnt) cnt.textContent = (idx + 1) + " / " + arr.length;
        gv.querySelectorAll(".gv-dot").forEach(function (d, i) { d.classList.toggle("on", i === idx); });
      }
      gv.querySelectorAll("[data-gv-dir]").forEach(function (btn) {
        btn.addEventListener("click", function (e) { e.stopPropagation(); go(parseInt(btn.getAttribute("data-gv-dir"), 10)); });
      });
      gv.querySelectorAll(".gv-dot").forEach(function (d) {
        d.addEventListener("click", function (e) {
          e.stopPropagation();
          var i = parseInt(d.getAttribute("data-gv-dot"), 10);
          img.setAttribute("data-idx", i); img.src = arr[i].src;
          if (cap) cap.textContent = arr[i].cap || "";
          if (cnt) cnt.textContent = (i + 1) + " / " + arr.length;
          gv.querySelectorAll(".gv-dot").forEach(function (x, j) { x.classList.toggle("on", j === i); });
        });
      });
      img.addEventListener("click", function () { go(1); });
    });
  }

  /* ---------- 事件绑定 ---------- */
  function bindViewEvents() {
    setupGalleryViewers();
    // 筛选
    document.querySelectorAll("[data-filter]").forEach(function (el) {
      el.addEventListener("click", function () {
        if (el.dataset.filter === "mfr") state.mfr = el.dataset.mfr;
        else state.type = el.dataset.type;
        render();
      });
    });
    // 对比切换
    document.querySelectorAll("[data-cmp]").forEach(function (el) {
      el.addEventListener("click", function () { toggleCompare(el.dataset.cmp); });
    });
    // 详情 tab（家族详情 #dtabs/#dpanel 与 型号详情 #vtabs/#vpanel 通用）
    [["dtabs", "dpanel"], ["vtabs", "vpanel"]].forEach(function (pair) {
      var tabs = document.getElementById(pair[0]);
      if (!tabs) return;
      var panelBox = document.getElementById(pair[1]);
      if (!panelBox) return;
      tabs.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          tabs.querySelectorAll("button").forEach(function (b) { b.classList.remove("on"); });
          btn.classList.add("on");
          panelBox.querySelectorAll(".panel").forEach(function (p) {
            p.classList.toggle("hidden", p.dataset.panel !== btn.dataset.tab);
          });
        });
      });
    });
    // 识别图特征标注：开关 + 热点弹窗
    var annoToggle = document.querySelector("[data-anno-toggle]");
    if (annoToggle) {
      annoToggle.addEventListener("click", function () {
        var layer = document.querySelector(".id-anno-layer");
        if (!layer) return;
        var on = layer.classList.toggle("show");
        annoToggle.classList.toggle("on", on);
        annoToggle.textContent = on ? "✕ 隐藏特征标注" : "🔍 显示特征标注";
      });
    }
    document.querySelectorAll(".anno-dot").forEach(function (dot) {
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        var wasOpen = dot.classList.contains("open");
        document.querySelectorAll(".anno-dot.open").forEach(function (d) { d.classList.remove("open"); });
        if (!wasOpen) dot.classList.add("open");
      });
    });
    // 测验选项
    document.querySelectorAll("[data-pick]").forEach(function (el) {
      el.addEventListener("click", function () {
        var q = state.quiz; if (!q || q.phase !== "play") return;
        var item = q.questions[q.idx];
        if (!item || item.answered) return;
        item.answered = true; item.picked = el.dataset.pick;
        q.score.t += 1;
        if (el.dataset.pick === item.correctId) q.score.c += 1;
        render();
      });
    });
    // 设置：题量 / 模式
    document.querySelectorAll("[data-len]").forEach(function (el) {
      el.addEventListener("click", function () {
        (state.quizSetup = state.quizSetup || { len: 30, mode: "photo" }).len = parseInt(el.dataset.len, 10);
        render();
      });
    });
    document.querySelectorAll("[data-mode]").forEach(function (el) {
      el.addEventListener("click", function () {
        (state.quizSetup = state.quizSetup || { len: 30, mode: "photo" }).mode = el.dataset.mode;
        render();
      });
    });
    var sb = document.querySelector("[data-start]");
    if (sb) sb.addEventListener("click", function () {
      startQuizSession(state.quizSetup || { len: 30, mode: "photo" }); render();
    });
    var rs = document.querySelector("[data-restart-setup]");
    if (rs) rs.addEventListener("click", function () { state.quiz = null; render(); });
    var sa = document.querySelector("[data-start-again]");
    if (sa) sa.addEventListener("click", function () {
      startQuizSession((state.quiz && state.quiz.setup) || { len: 30, mode: "photo" }); render();
    });
    // 下一题 / 查看结果
    var nx = document.querySelector("[data-qnext]");
    if (nx) nx.addEventListener("click", function () {
      var q = state.quiz; if (!q) return;
      var item = q.questions[q.idx];
      if (!item || !item.answered) return;
      if (q.idx >= q.length - 1) q.phase = "result";
      else q.idx += 1;
      render();
    });
  }

  /* ---------- 时钟（可切换时区） ---------- */
  var TZ_LABEL = { utc: "UTC", bj: "北京", local: "本地" };
  function zonedParts(d, tz) {
    var offsetMin = d.getTimezoneOffset();          // 浏览器本地相对 UTC（分钟，西为正）
    var utcMs = d.getTime() + offsetMin * 60000;
    var offHours;
    if (tz === "bj") offHours = 8;
    else if (tz === "local") offHours = -offsetMin / 60;
    else offHours = 0;                              // utc
    var t = new Date(utcMs + offHours * 3600000);
    return { h: t.getHours(), m: t.getMinutes(), s: t.getSeconds() };
  }
  function tick() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    var z = zonedParts(d, state.tz);
    var clk = document.getElementById("clk");
    if (clk) clk.textContent = p(z.h) + ":" + p(z.m) + ":" + p(z.s);
    var zone = document.getElementById("clkZone");
    if (zone) {
      var lbl = TZ_LABEL[state.tz] || "UTC";
      if (state.tz === "local") {
        var o = -d.getTimezoneOffset() / 60;
        lbl = "本地 " + (o >= 0 ? "+" : "") + o;
      }
      zone.textContent = lbl;
    }
  }

  /* ---------- 时区切换下拉 ---------- */
  function setupClock() {
    var clock = document.getElementById("opsClock");
    var menu = document.getElementById("tzMenu");
    if (!clock || !menu) return;
    function paintActive() {
      menu.querySelectorAll("li").forEach(function (li) {
        li.classList.toggle("active", li.dataset.tz === state.tz);
      });
    }
    function openMenu(open) {
      clock.classList.toggle("open", open);
      clock.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) paintActive();
    }
    clock.addEventListener("click", function (e) {
      if (e.target.closest(".tz-menu")) return;     // 点菜单项不在这里处理
      openMenu(!clock.classList.contains("open"));
    });
    // 键盘可达性
    clock.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMenu(!clock.classList.contains("open")); }
      if (e.key === "Escape") openMenu(false);
    });
    menu.querySelectorAll("li").forEach(function (li) {
      li.addEventListener("click", function () {
        state.tz = li.dataset.tz;
        try { localStorage.setItem("atlas.tz", state.tz); } catch (e) {}
        tick();
        openMenu(false);
      });
    });
    // 点击空白处关闭
    document.addEventListener("click", function (e) {
      if (!clock.contains(e.target)) openMenu(false);
    });
  }

  /* ---------- 版本号 + 升级日志面板 ---------- */
  function setupVersion() {
    var verTag = document.getElementById("verTag");
    var latest = (window.CHANGELOG && window.CHANGELOG[0] && window.CHANGELOG[0].version) || "v1.0.0";
    if (verTag) verTag.textContent = latest;

    var btn = document.getElementById("opsVer");
    var modal = document.getElementById("changelogModal");
    if (!btn || !modal) return;

    function renderChangelog() {
      var body = document.getElementById("changelogBody");
      if (!body || !window.CHANGELOG) return;
      body.innerHTML = window.CHANGELOG.map(function (v, i) {
        var clItems = v.changes || v.items || [];
        var items = clItems.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
        return '<article class="cl-entry' + (i === 0 ? " is-current" : "") + '">' +
          '<div class="cl-head"><span class="cl-ver">' + esc(v.version) + '</span>' +
          '<span class="cl-date">' + esc(v.date) + '</span>' +
          (i === 0 ? '<span class="cl-badge">当前</span>' : "") + '</div>' +
          '<h3 class="cl-title">' + esc(v.title) + '</h3>' +
          '<ul class="cl-changes">' + items + '</ul></article>';
      }).join("");
    }
    function openModal(open) {
      modal.classList.toggle("open", open);
      modal.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) renderChangelog();
    }
    btn.addEventListener("click", function () { openModal(true); });
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", function () { openModal(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") openModal(false);
    });
  }

  /* ---------- 图库灯箱（点击放大 / 上一张 / 下一张） ---------- */
  var galCurrent = null, galIdx = 0;
  function renderLightbox() {
    var wrap = document.getElementById("lbImgWrap");
    var cap = document.getElementById("lbCap");
    if (!galCurrent || !wrap) return;
    var it = galCurrent[galIdx];
    wrap.innerHTML = it.kind === "sil"
      ? '<div class="lb-sil"><img src="' + esc(it.src) + '" alt=""></div>'
      : '<img src="' + esc(it.src) + '" alt="">';
    cap.textContent = it.cap + "  （" + (galIdx + 1) + "/" + galCurrent.length + "）";
    var cnt = galCurrent.length;
    var prev = document.querySelector("[data-lb-prev]"), next = document.querySelector("[data-lb-next]");
    if (prev) prev.style.display = cnt > 1 ? "" : "none";
    if (next) next.style.display = cnt > 1 ? "" : "none";
  }
  function openLightbox(items, idx) {
    galCurrent = items; galIdx = idx;
    renderLightbox();
    var lb = document.getElementById("lightbox");
    if (lb) { lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); }
  }
  function closeLightbox() {
    var lb = document.getElementById("lightbox");
    if (lb) { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); }
  }
  function setupGallery() {
    document.addEventListener("click", function (e) {
      var tile = e.target.closest(".gal-tile");
      if (tile) {
        var panel = tile.closest('[data-panel="gallery"]');
        if (!panel) return;
        var tiles = [].slice.call(panel.querySelectorAll(".gal-tile"));
        var items = tiles.map(function (t) {
          return {
            src: t.querySelector("img").getAttribute("src"),
            cap: t.querySelector(".gal-cap").textContent,
            kind: t.dataset.kind
          };
        });
        openLightbox(items, tiles.indexOf(tile));
        return;
      }
      if (e.target.closest("[data-lb-close]")) { closeLightbox(); return; }
      if (!galCurrent) return;
      if (e.target.closest("[data-lb-prev]")) { galIdx = (galIdx - 1 + galCurrent.length) % galCurrent.length; renderLightbox(); }
      else if (e.target.closest("[data-lb-next]")) { galIdx = (galIdx + 1) % galCurrent.length; renderLightbox(); }
    });
    document.addEventListener("keydown", function (e) {
      if (!galCurrent) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") { galIdx = (galIdx - 1 + galCurrent.length) % galCurrent.length; renderLightbox(); }
      else if (e.key === "ArrowRight") { galIdx = (galIdx + 1) % galCurrent.length; renderLightbox(); }
    });
  }

  /* ---------- 启动 ---------- */
  window.addEventListener("hashchange", render);
  function boot() {
    renderStatusStrip();
    if (!location.hash) location.hash = "#/";
    render();
    setupClock();
    setupVersion();
    setupGallery();
    tick(); setInterval(tick, 1000);
  }
  document.addEventListener("DOMContentLoaded", boot);
  // 若脚本在 DOMContentLoaded 之后才执行
  if (document.readyState !== "loading") boot();
})();
