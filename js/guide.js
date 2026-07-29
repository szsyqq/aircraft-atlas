/* 识别导读 · 从“思考路径”出发的识别决策树 + 动态演示 + 真实照片
 * 决策顺序：发动机数 → 驾驶舱舷窗底沿 → 翼尖频闪灯(夜间) → 翼梢/机头/姿态/尾椎(白天) → 起落架/舱门(精分)
 * 所有演示优先用真实照片（assets/img），仅频闪灯用内联 SVG 动画。
 */
window.Guide = (function () {
  "use strict";

  var BOEING = "#4C7DF0", AIRBUS = "#FF4D6D", COMAC = "#2BD4C0", NEUTRAL = "#94a3b8";

  /* 真实照片卡片：失败回退到家族线图 */
  function photoCard(title, id, c, caption, sub) {
    return '<div class="demo-card">' +
      '<div class="ec-img"><img src="assets/img/' + id + '.jpg" alt="' + title + '" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=\'assets/sil/' + id + '.svg\'">' +
        '<span class="ec-fallback">' + title + '</span></div>' +
      (caption ? '<div class="ec-cap">' + caption + '</div>' : '') +
      (sub ? '<div class="ec-sub">' + sub + '</div>' : '') +
      '</div>';
  }

  /* ---------- 演示 1：发动机数量（真实照片） ---------- */
  function engineDemo() {
    return '' +
      '<div class="demo-grid">' +
        photoCard("四发（4 台）", "b747", AIRBUS, "巨型机专属", "波音 747（驼峰机背）· 空客 A380（全双层）") +
        photoCard("双发（2 台）", "b737", BOEING, "绝大多数现代客机", "737 / 777 / 787 · A320 / A330 / A350 · C919 / ARJ21") +
      '</div>' +
      '<p class="demo-note">先看发动机：<b>4 台</b> 直接锁定「巨型机」分支（747 / A380）；<b>2 台</b> 则进入下面的波音/空客判别。注意 A380 也是 4 发但双层机身，和 747 的驼峰一眼可分。</p>';
  }

  /* ---------- 演示 2：驾驶舱舷窗底沿（真实照片） ---------- */
  function cockpitDemo() {
    return '' +
      '<div class="demo-grid">' +
        photoCard("波音 · 底沿 V 形", "b737", BOEING, "侧窗底沿向下斜，呈「歪眼角 / V 字」", "737、777 尤为明显（747、787 例外）") +
        photoCard("空客 · 底沿平直", "a320", AIRBUS, "侧窗底沿近乎水平，最侧窗常带斜切角", "A320 / A330 家族（A380 例外）") +
      '</div>' +
      '<p class="demo-note">白天最可靠的判据之一：盯住驾驶舱侧窗最下沿——<b>向下斜成 V 字 = 波音</b>，<b>接近水平 = 空客</b>。<br>例外：747、787、A380 的舷窗造型特殊，需结合驼峰 / 墨镜黑框 / 全双层判断。</p>';
  }

  /* ---------- 演示 3：翼尖频闪灯（发光点 一点/两点，保留好评动画） ---------- */
  function strobeDemo() {
    return '' +
      '<div class="demo-grid">' +
        strobeCard("波音 Boeing", "boeing", BOEING, "闪<b>一</b>下 · 停顿",
          "夜间或大雾看不清机身时，盯机翼末端的频闪灯：<b>闪一下、停一下</b>循环。") +
        strobeCard("空客 Airbus", "airbus", AIRBUS, "闪<b>两</b>下 · 停顿",
          "同样看翼尖频闪灯：<b>连闪两下、停一下</b>循环——这就是「发光点 一点 vs 两点」。") +
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

  /* ---------- 演示 4：翼梢小翼 / 特殊特征（真实照片替代框线） ---------- */
  function wingletDemo() {
    var items = [
      ["a320", AIRBUS, "鲨鳍小翼 Sharklet", "空客 A320neo 家族：垂直上翘、末端微后掠，干净利落"],
      ["b737", BOEING, "分叉小翼 Split", "波音 737NG/MAX：上下分叉的「小叉子」（NG 为融合式，MAX 为分叉式）"],
      ["b787", BOEING, "斜削翼尖 Raked", "波音 787 / 777：翼尖后掠如刀，无直立小翼，复合材料机翼飞行中上弯"],
      ["a330", NEUTRAL, "翼尖帆 Fence", "老空客宽体 A330/A340：三角形翼刀（A320 老款为小三角翼梢）"]
    ];
    return '<div class="demo-grid demo-grid-4">' +
      items.map(function (it) {
        return photoCard(it[2], it[0], it[1], it[2], it[3]);
      }).join("") + '</div>' +
      '<p class="demo-note">翼尖装置既能减阻又是强识别点：<b>上下分叉</b> → 737NG/MAX；<b>单根高耸后掠</b> → A320neo 鲨鳍；<b>无直立小翼、翼尖像被削尖</b> → 787/777 斜削翼尖。<br>注：并非所有 A320 都有鲨鳍（老款 CEO 可能无小翼或仅小三角翼梢），并非所有 737 都分叉（NG 为融合式）。</p>';
  }

  /* ---------- 演示 5：机头 / 姿态 / 发动机短舱（真实照片） ---------- */
  function shapeDemo() {
    return '<div class="demo-grid">' +
      photoCard("波音 · 机头更尖", "b737", BOEING, "机头偏尖、机身贴地、常略抬头", "737 因起落架矮，发动机短舱<b>下缘扁平</b>、整体「矮圆」") +
      photoCard("空客 · 机头更圆", "a320", AIRBUS, "机头圆润鼓出、姿态更高更平", "A320 起落架更高，发动机<b>圆短舱</b>自然垂于翼下") +
      '</div>' +
      '<p class="demo-note">737 与 A320 是机场最常见的一对冤家：<b>尖机头 + 低姿态 + 平底发动机 = 737</b>；<b>圆机头 + 高姿态 + 圆发动机 = A320</b>。机头形状是两者最快的区分点（但 A220 机头也偏尖，属例外）。</p>';
  }

  /* ---------- 演示 6：尾椎 / APU（真实照片） ---------- */
  function apuDemo() {
    return '<div class="demo-grid">' +
      photoCard("波音 · 尾椎圆润", "b777", BOEING, "APU 排气口浑圆，尾椎较饱满", "777 主起落架 6 轮（3×2）、尾橇扁") +
      photoCard("空客 · 尾椎截平", "a330", AIRBUS, "APU 排气口像被「削平」", "A330 主起落架 4 轮、起落架后倾") +
      '</div>' +
      '<p class="demo-note">绕到机尾看 APU（辅助动力装置）排气口：<b>圆润 = 波音</b>，<b>截平/方块感 = 空客</b>。再配合主起落架轮数（777 六轮 vs A330 四轮）可进一步确认宽体型号。</p>';
  }

  /* ---------- 树状决策图（SVG） ---------- */
  function treeSvg() {
    var box = function (x, y, w, h, fill, text1, text2, tc) {
      return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + fill + '" stroke="rgba(255,255,255,.25)"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + (text2 ? 22 : 28)) + '" fill="' + (tc || '#e8eefc') + '" font-size="13" font-weight="700" text-anchor="middle">' + text1 + '</text>' +
        (text2 ? '<text x="' + (x + w / 2) + '" y="' + (y + 40) + '" fill="rgba(232,238,252,.7)" font-size="11" text-anchor="middle">' + text2 + '</text>' : '') +
        '</g>';
    };
    return '<div class="tree-wrap"><svg viewBox="0 0 760 470" class="tree-svg">' +
      // 连线
      '<g stroke="#475569" stroke-width="2" fill="none">' +
        '<path d="M150,52 L150,150"/><path d="M150,150 L60,210"/><path d="M150,150 L240,210"/>' +
        '<path d="M240,210 L240,290"/><path d="M240,290 L110,350"/><path d="M240,290 L370,350"/>' +
      '</g>' +
      // 节点
      box(70, 20, 160, 64, "#1e293b", "① 发动机数？", "4 台 vs 2 台", "#e8eefc") +
      box(10, 210, 100, 52, AIRBUS, "4 台", "巨型机", "#fff") +
      box(190, 210, 100, 52, BOEING, "2 台", "进入判别", "#fff") +
      box(190, 290, 100, 52, "#1e293b", "② 看舷窗/频闪", "波音 vs 空客") +
      box(60, 350, 100, 64, BOEING, "波音", "舷窗 V / 闪1下", "#fff") +
      box(320, 350, 100, 64, AIRBUS, "空客", "舷窗平 / 闪2下", "#fff") +
      // 右侧具体机型
      '<g stroke="#475569" stroke-width="2" fill="none"><path d="M110,414 L110,450"/><path d="M370,414 L370,450"/></g>' +
      '<text x="110" y="466" fill="rgba(232,238,252,.85)" font-size="11" text-anchor="middle">737·777·787·757 → 看翼梢/机头/尾椎</text>' +
      '<text x="370" y="466" fill="rgba(232,238,252,.85)" font-size="11" text-anchor="middle">A320·A330·A350·A380 → 看鲨鳍/双层/墨镜</text>' +
      '</svg></div>';
  }

  /* ---------- 对照表（扩充） ---------- */
  function compareTable() {
    var rows = [
      ["机头轮廓", "更尖、更「经典喷气机」感", "更圆润鼓出"],
      ["驾驶舱侧窗底沿", "V 形折线（向下斜）", "平直 / 带斜切角"],
      ["翼尖频闪灯（夜间）", "闪一下·停顿", "连闪两下·停顿"],
      ["发动机短舱", "737 下缘扁平（贴地）", "多为圆短舱、垂于翼下"],
      ["翼梢小翼", "737NG 融合 / MAX 分叉；787·777 斜削", "A320neo 鲨鳍（垂直上翘）"],
      ["甚高频天线位置", "机身中部机顶", "靠近驾驶舱（前部）"],
      ["尾椎 / APU 排气", "圆润饱满", "截平 / 方块感"],
      ["垂尾前缘", "较平缓的折角", "较陡、曲线平滑"],
      ["主起落架轮数（宽体）", "777 六轮(3×2)", "A330 四轮"],
      ["舷窗规律例外", "747、787", "A380"]
    ];
    return '<table class="cmp-table guide-table"><thead><tr><th>判据</th>' +
      '<th style="--bc:' + BOEING + '">波音 Boeing</th><th style="--bc:' + AIRBUS + '">空客 Airbus</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th class="spec-name">' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  /* ---------- 机型特写（接入真实照片 → 家族页） ---------- */
  function galleryHtml(A) {
    return A.map(function (a) {
      var c = a.mfr === "Boeing" ? BOEING : (a.mfr === "Airbus" ? AIRBUS : COMAC);
      var clue = (a.quickId && a.quickId[0]) || "";
      return '<a class="g-card" href="#/a/' + a.id + '" style="--bc:' + c + '">' +
        '<div class="g-img"><img src="assets/img/' + a.id + '.jpg" alt="' + a.name + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'assets/sil/' + a.id + '.svg\'">' +
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
        '<p class="guide-intro">不要从「网站栏目」出发，要从<strong>「观察飞机的思考路径」</strong>出发：到了停机坪，先看发动机，再看舷窗，必要时看频闪灯，最后用翼梢 / 机头 / 尾椎锁定具体机型。下面每一步都可以<strong>用真实照片对照</strong>，学完直接去底部测试。</p>' +
      '</div>' +

      '<ol class="stepper">' +
        stepCard("1", "看发动机数量", "2 发 vs 4 发 —— 先粗分「巨型机」", "#engine") +
        stepCard("2", "看驾驶舱舷窗底沿", "波音 V 形 · 空客平直 —— 判波音/空客", "#cockpit") +
        stepCard("3", "看翼尖频闪灯（发光点）", "闪一下=波音 · 闪两下=空客（夜间）", "#strobe") +
        stepCard("4", "看翼梢小翼 / 机头 / 姿态", "分叉·鲨鳍·斜削 · 尖头·低姿态", "#winglet") +
        stepCard("5", "看尾椎 APU / 起落架", "圆润=波音 · 截平=空客（精分宽体）", "#apu") +
        stepCard("6", "树状决策图实战", "一步步锁定具体机型 → 去测试", "#tree") +
      '</ol>' +

      '<section class="demo-section" id="engine">' +
        '<h3 class="demo-h">① 发动机数量 <span class="tag">ENGINES</span></h3>' + engineDemo() + '</section>' +
      '<section class="demo-section" id="cockpit">' +
        '<h3 class="demo-h">② 驾驶舱舷窗底沿 <span class="tag">COCKPIT WINDOW</span></h3>' + cockpitDemo() + '</section>' +
      '<section class="demo-section" id="strobe">' +
        '<h3 class="demo-h">③ 翼尖频闪灯（发光点） <span class="tag">STROBE</span></h3>' + strobeDemo() + '</section>' +
      '<section class="demo-section" id="winglet">' +
        '<h3 class="demo-h">④ 翼梢小翼 / 机头 / 姿态 <span class="tag">WINGTIP & SHAPE</span></h3>' + wingletDemo() + shapeDemo() + '</section>' +
      '<section class="demo-section" id="apu">' +
        '<h3 class="demo-h">⑤ 尾椎 APU / 起落架 <span class="tag">APU & GEAR</span></h3>' + apuDemo() + '</section>' +
      '<section class="demo-section" id="tree">' +
        '<h3 class="demo-h">⑥ 树状决策图 · 一步步锁定机型 <span class="tag">DECISION TREE</span></h3>' + treeSvg() + '</section>' +

      '<section class="demo-section"><h3 class="demo-h">波音 vs 空客 · 对照速查表</h3>' + compareTable() + '</section>' +

      '<section class="demo-section"><h3 class="demo-h">机型特写 · 点开看完整图鉴</h3>' +
        '<div class="g-grid">' + galleryHtml(A) + '</div></section>' +

      '<section class="quiz-cta">' +
        '<div class="qc-inner">' +
          '<div class="qc-t">学会了吗？立刻去实战 ↓</div>' +
          '<p class="qc-d">用真实照片考考自己：看发动机、舷窗、翼尖，说出它是波音还是空客、哪一款。</p>' +
          '<a class="btn primary lg" href="#/quiz">开始识别练习 →</a>' +
          '<div class="qc-sub"><a href="#/compare">或先去机型对比 →</a></div>' +
        '</div>' +
      '</section>';
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
