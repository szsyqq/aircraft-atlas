/* 识别导读 · 从“思考路径”出发的识别决策树 + 动态演示
 * 决策顺序：发动机数 → 驾驶舱舷窗底沿 → 翼尖频闪灯(发光点) → 翼梢小翼/特殊特征
 * 所有演示为内联 SVG + CSS 动画，不依赖外部资源。
 */
window.Guide = (function () {
  "use strict";

  var BOEING = "#4C7DF0", AIRBUS = "#FF4D6D", COMAC = "#2BD4C0";

  /* ---------- 演示 1：发动机数量 ---------- */
  function engineDemo() {
    return '' +
      '<div class="demo-grid">' +
        engineCard("双发（2 台）", "b737", ["绝大多数现代客机", "波音 737 / 777 / 787", "空客 A320 / A330 / A350", "商飞 C919 / ARJ21"], BOEING) +
        engineCard("四发（4 台）", "b747", ["巨型机专属", "波音 747（驼峰）", "空客 A380（全双层）"], AIRBUS) +
      '</div>' +
      '<p class="demo-note">先看发动机：<b>4 台</b> 直接锁定「巨型机」分支（747 / A380）；<b>2 台</b> 则进入下面的波音/空客判别。</p>';
  }
  function engineCard(title, id, list, c) {
    return '<div class="demo-card">' +
      '<div class="ec-title" style="color:' + c + '">' + title + '</div>' +
      '<div class="ec-img"><img src="assets/sil/' + id + '.svg" alt="' + title + '" ' +
        'onerror="this.style.display=\'none\'">' +
        '<span class="ec-fallback">' + (id === "b747" ? "4" : "2") + ' 发</span></div>' +
      '<ul>' + list.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ul>' +
      '</div>';
  }

  /* ---------- 演示 2：驾驶舱舷窗底沿（V / 平） ---------- */
  function cockpitWindow(brand) {
    var c = brand === "Boeing" ? BOEING : AIRBUS;
    // 侧窗：波音底沿向下斜(V)，空客底沿平直
    var d = brand === "Boeing"
      ? "M28,26 L150,26 L150,70 L42,94 L30,60 Z"
      : "M28,26 L150,26 L150,70 L96,90 L52,70 L30,50 Z";
    var bottom = brand === "Boeing" ? "M150,70 L42,94" : "M150,70 L96,90 L52,70";
    return '<svg viewBox="0 0 178 120" class="demo-svg">' +
      '<rect x="6" y="10" width="166" height="100" rx="10" fill="rgba(255,255,255,.03)" stroke="#1e293b"/>' +
      '<path d="' + d + '" fill="rgba(255,255,255,.06)" stroke="' + c + '" stroke-width="2.5"/>' +
      '<path d="' + bottom + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" class="trace"/>' +
      '<circle cx="150" cy="70" r="3.5" fill="' + c + '"/>' +
      '</svg>';
  }
  function cockpitDemo() {
    return '' +
      '<div class="demo-grid">' +
        '<div class="demo-card">' + cockpitWindow("Boeing") +
          '<div class="ec-title" style="color:' + BOEING + '">波音 · 底沿 V 形</div>' +
          '<p class="demo-note">侧窗底沿向下斜，呈「歪眼角 / V 字」。737、777 尤为明显。<br>（747、787 例外）</p></div>' +
        '<div class="demo-card">' + cockpitWindow("Airbus") +
          '<div class="ec-title" style="color:' + AIRBUS + '">空客 · 底沿平直</div>' +
          '<p class="demo-note">侧窗底沿近乎水平，呈「尖/平眼角」。<br>（A380 例外）</p></div>' +
      '</div>';
  }

  /* ---------- 演示 3：翼尖频闪灯（发光点 一点/两点） ---------- */
  function strobeDemo() {
    return '' +
      '<div class="demo-grid">' +
        strobeCard("波音 Boeing", "boeing", BOEING, "闪<b>一</b>下 · 停顿",
          "夜间或大雾看不清机身时，盯机翼末端的频闪灯：<b>闪一下、停一下</b>循环。") +
        strobeCard("空客 Airbus", "airbus", AIRBUS, "闪<b>两</b>下 · 停顿",
          "同样看翼尖频闪灯：<b>连闪两下、停一下</b>循环——这就是你说的「发光点 一点 vs 两点」。") +
      '</div>' +
      '<div class="demo-bar"><button class="btn" data-strobe-toggle>⏸ 暂停</button>' +
        '<span class="demo-hint">提示：把手机亮度调高、盯着翼尖红点看节奏。</span></div>';
  }
  function strobeCard(title, kind, c, beat, desc) {
    return '<div class="demo-card">' +
      '<div class="wingtip">' +
        '<svg viewBox="0 0 160 90" class="demo-svg">' +
          '<path d="M0,70 L120,40 L160,30 L150,55 L150,90 L0,90 Z" fill="rgba(255,255,255,.05)" stroke="#334155" stroke-width="2"/>' +
          '<circle class="light ' + kind + '" cx="150" cy="42" r="9" fill="' + c + '"/>' +
        '</svg>' +
      '</div>' +
      '<div class="ec-title" style="color:' + c + '">' + title + '</div>' +
      '<div class="beat">' + beat + '</div>' +
      '<p class="demo-note">' + desc + '</p></div>';
  }

  /* ---------- 演示 4：翼梢小翼 / 特殊特征 ---------- */
  function winglet(shape) {
    if (shape === "sharklet")
      return '<svg viewBox="0 0 120 110" class="demo-svg"><path d="M10,100 L110,100 L110,60 L70,18 L46,40 L10,100 Z" fill="rgba(255,255,255,.05)" stroke="' + AIRBUS + '" stroke-width="2.5"/><path d="M70,18 L88,30" stroke="' + AIRBUS + '" stroke-width="3"/></svg>';
    if (shape === "split")
      return '<svg viewBox="0 0 120 120" class="demo-svg"><path d="M10,60 L110,60 L110,20 L78,4 L60,30 L10,60 Z" fill="rgba(255,255,255,.05)" stroke="' + BOEING + '" stroke-width="2.5"/><path d="M60,30 L52,70" stroke="' + BOEING + '" stroke-width="3"/><path d="M78,4 L70,44" stroke="' + BOEING + '" stroke-width="3"/></svg>';
    if (shape === "raked")
      return '<svg viewBox="0 0 140 90" class="demo-svg"><path d="M10,80 L120,80 L120,40 L138,18 L120,30 L10,80 Z" fill="rgba(255,255,255,.05)" stroke="' + BOEING + '" stroke-width="2.5"/></svg>';
    // wing fence
    return '<svg viewBox="0 0 120 90" class="demo-svg"><path d="M10,80 L110,80 L110,46 L84,40 L70,54 L10,80 Z" fill="rgba(255,255,255,.05)" stroke="#94a3b8" stroke-width="2.5"/><path d="M84,40 L96,56" stroke="#94a3b8" stroke-width="3"/></svg>';
  }
  function wingletDemo() {
    var items = [
      ["sharklet", AIRBUS, "鲨鳍小翼", "空客 A320 家族：垂直上翘、末端微后掠"],
      ["split", BOEING, "分叉小翼", "波音 737NG/MAX：上下分叉的「小叉子」"],
      ["raked", BOEING, "斜削翼尖", "波音 787 / 777：翼尖后掠如刀，无直立小翼"],
      ["fence", "#94a3b8", "翼尖帆", "老空客宽体 A330/A340：三角形翼刀"]
    ];
    return '<div class="demo-grid demo-grid-4">' +
      items.map(function (it) {
        return '<div class="demo-card">' + winglet(it[0]) +
          '<div class="ec-title" style="color:' + it[1] + '">' + it[2] + '</div>' +
          '<p class="demo-note">' + it[3] + '</p></div>';
      }).join("") + '</div>';
  }

  /* ---------- 对照表 ---------- */
  function compareTable() {
    var rows = [
      ["驾驶舱侧窗底沿", "V 形折线（向下斜）", "平直"],
      ["翼尖频闪灯", "闪一下·停顿", "连闪两下·停顿"],
      ["甚高频天线位置", "机身中部机顶", "靠近驾驶舱（前部）"],
      ["翼梢小翼", "737NG 直立 / MAX 分叉", "A320 鲨鳍小翼（垂直上翘）"],
      ["发动机后缘", "787/747-8/777X/MAX 有锯齿(chevron)", "多为圆滑短舱"],
      ["墨镜黑框驾驶舱", "787 / 777X 有", "A350 / A330neo / A320neo 有"],
      ["舷窗规律例外", "747、787", "A380"]
    ];
    return '<table class="cmp-table guide-table"><thead><tr><th>判据</th>' +
      '<th style="--bc:' + BOEING + '">波音 Boeing</th><th style="--bc:' + AIRBUS + '">空客 Airbus</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th class="spec-name">' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  /* ---------- 机型特写（接入真实线图/照片） ---------- */
  function galleryHtml(A) {
    return A.map(function (a) {
      var c = a.mfr === "Boeing" ? BOEING : (a.mfr === "Airbus" ? AIRBUS : COMAC);
      var clue = (a.quickId && a.quickId[0]) || "";
      return '<a class="g-card" href="#/a/' + a.id + '" style="--bc:' + c + '">' +
        '<div class="g-img"><img src="assets/sil/' + a.id + '.svg" alt="' + a.name + '" ' +
          'onerror="this.onerror=null;this.src=\'assets/img/' + a.id + '.jpg\'">' +
          '<span class="g-fb">' + a.name.split(" ")[0] + '</span></div>' +
        '<div class="g-name">' + a.name + '</div>' +
        '<div class="g-clue">' + clue + '</div></a>';
    }).join("");
  }

  /* ---------- 组装 ---------- */
  function html(A) {
    return '' +
      '<div class="guide-head">' +
        '<div class="section-h"><h2>识别导读</h2><span class="en">IDENTIFICATION FIELD GUIDE</span></div>' +
        '<p class="guide-intro">不要从「网站栏目」出发，要从<strong>「观察飞机的思考路径」</strong>出发：到了停机坪，先看发动机，再看舷窗，必要时看频闪灯，最后用翼尖特征锁定具体机型。下面每一步都可以<strong>动态演示</strong>。</p>' +
      '</div>' +

      '<ol class="stepper">' +
        stepCard("1", "看发动机数量", "2 发 vs 4 发 —— 先粗分「巨型机」", "#engine") +
        stepCard("2", "看驾驶舱舷窗底沿", "波音 V 形 · 空客平直 —— 判波音/空客", "#cockpit") +
        stepCard("3", "看翼尖频闪灯（发光点）", "闪一下=波音 · 闪两下=空客（夜间）", "#strobe") +
        stepCard("4", "看翼梢小翼 / 特殊特征", "鲨鳍·分叉·斜削·驼峰·双层·涂装", "#winglet") +
      '</ol>' +

      '<section class="demo-section" id="engine">' +
        '<h3 class="demo-h">① 发动机数量 <span class="tag">ENGINES</span></h3>' + engineDemo() + '</section>' +
      '<section class="demo-section" id="cockpit">' +
        '<h3 class="demo-h">② 驾驶舱舷窗底沿 <span class="tag">COCKPIT WINDOW</span></h3>' + cockpitDemo() + '</section>' +
      '<section class="demo-section" id="strobe">' +
        '<h3 class="demo-h">③ 翼尖频闪灯（发光点） <span class="tag">STROBE</span></h3>' + strobeDemo() + '</section>' +
      '<section class="demo-section" id="winglet">' +
        '<h3 class="demo-h">④ 翼梢小翼 / 特殊特征 <span class="tag">WINGTIP</span></h3>' + wingletDemo() + '</section>' +

      '<section class="demo-section"><h3 class="demo-h">波音 vs 空客 · 对照速查表</h3>' + compareTable() + '</section>' +

      '<section class="demo-section"><h3 class="demo-h">机型特写 · 点开看完整图鉴</h3>' +
        '<div class="g-grid">' + galleryHtml(A) + '</div></section>';
  }
  function stepCard(n, t, d, anchor) {
    return '<li><a class="step" href="' + anchor + '">' +
      '<span class="step-n">' + n + '</span>' +
      '<span class="step-t">' + t + '</span>' +
      '<span class="step-d">' + d + '</span></a></li>';
  }

  /* ---------- 交互绑定 ---------- */
  function bind() {
    var toggle = document.querySelector("[data-strobe-toggle]");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var sec = document.getElementById("strobe");
        if (!sec) return;
        var paused = sec.classList.toggle("paused");
        toggle.textContent = paused ? "▶ 播放" : "⏸ 暂停";
      });
    }
    // 平滑滚动到锚点
    document.querySelectorAll('.stepper a.step').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        var el = document.querySelector(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });
  }

  return { html: html, bind: bind };
})();
