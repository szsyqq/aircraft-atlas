/* 飞机三视图 SVG 剪影生成器
 * 用参数化图元拼出侧视/顶视/前视剪影，突出可识别特征。
 * 暴露 window.Silhouettes = { side(id,mfr), top(id,mfr), front(id,mfr) }
 */
(function () {
  "use strict";

  var MFR_COLOR = { Boeing: "#2563eb", Airbus: "#dc2626", COMAC: "#d97706" };

  var VB_W = 520, VB_H = 260, MID_Y = 140, NOSE_TIP = 30, FUSE_FRONT = 55;

  function rect(x, y, w, h, rx, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="' + rx + '" fill="' + fill + '"/>';
  }
  function ell(cx, cy, rx, ry, fill) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + fill + '"/>';
  }
  function poly(pts, fill) {
    var p = pts.map(function (q) { return q[0] + "," + q[1]; }).join(" ");
    return '<polygon points="' + p + '" fill="' + fill + '"/>';
  }
  function line(x1, y1, x2, y2, stroke, w) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + stroke + '" stroke-width="' + w + '"/>';
  }

  var DEFAULTS = {
    bodyLen: 340, bodyH: 32, deck: "single",
    engines: 2, enginePos: "underwing", winglets: "none",
    tail: "standard", bogie: 4, cockpitMask: false, raked: false
  };

  var CFG = {
    b737:  { bodyLen: 300, bodyH: 30, winglets: "blended" },
    b747:  { bodyLen: 410, bodyH: 40, deck: "hump", engines: 4 },
    b777:  { bodyLen: 415, bodyH: 38, bogie: 6 },
    b787:  { bodyLen: 375, bodyH: 34, winglets: "raked", raked: true },
    a320:  { bodyLen: 300, bodyH: 32, winglets: "sharklet" },
    a330:  { bodyLen: 380, bodyH: 42, winglets: "sharklet" },
    a350:  { bodyLen: 390, bodyH: 40, winglets: "sharklet", cockpitMask: true },
    a380:  { bodyLen: 430, bodyH: 62, deck: "double", engines: 4, winglets: "sharklet" },
    c919:  { bodyLen: 305, bodyH: 32, winglets: "sharklet" },
    arj21: { bodyLen: 250, bodyH: 30, enginePos: "rear", tail: "T" }
  };

  function cfg(id) {
    var c = {};
    for (var k in DEFAULTS) c[k] = DEFAULTS[k];
    var o = CFG[id] || {};
    for (var j in o) c[j] = o[j];
    return c;
  }

  function wrap(s) {
    return '<svg viewBox="0 0 ' + VB_W + " " + VB_H +
      '" class="svgi" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
      s + "</svg>";
  }

  function side(id, mfr) {
    var c = cfg(id);
    var fill = MFR_COLOR[mfr] || "#334155";
    var midY = MID_Y;
    var x0 = FUSE_FRONT;
    var x1 = x0 + c.bodyLen;
    var h = c.bodyH;
    var top = midY - h / 2;
    var bot = midY + h / 2;
    var s = "";

    // 机身主体 + 机头 + 机尾锥
    s += rect(x0, top, c.bodyLen, h, 16, fill);
    s += poly([[NOSE_TIP, midY], [x0, top + 2], [x0, bot - 2]], fill);
    s += poly([[x1, top + 2], [x1 + 20, midY], [x1, bot - 2]], fill);

    // 上层客舱（747 驼峰 / 380 双层）
    if (c.deck === "hump") {
      var hh = h * 0.55;
      s += rect(x0 + 25, top - hh, 132, hh, 10, fill);
    }
    if (c.deck === "double") {
      s += line(x0 + 12, top + 11, x1 - 12, top + 11, "rgba(255,255,255,0.35)", 3);
    }

    // 主翼（近侧，后掠）
    var xw = x0 + c.bodyLen * 0.40;
    var wingTipX = xw + c.bodyLen * 0.50;
    s += poly([
      [xw, bot - 2], [xw + 18, bot + 10], [wingTipX, midY + 40],
      [wingTipX - 22, midY + 40], [xw - 4, bot - 2]
    ], fill);

    // 翼梢小翼
    if (c.winglets === "sharklet") {
      s += poly([[wingTipX - 22, midY + 40], [wingTipX, midY + 40],
        [wingTipX - 4, midY + 62], [wingTipX - 26, midY + 62]], fill);
    } else if (c.winglets === "blended") {
      s += poly([[wingTipX - 22, midY + 40], [wingTipX, midY + 40],
        [wingTipX - 10, midY + 58], [wingTipX - 28, midY + 54]], fill);
    } else if (c.winglets === "raked") {
      s += poly([[wingTipX - 22, midY + 40], [wingTipX, midY + 40],
        [wingTipX + 18, midY + 30], [wingTipX - 6, midY + 50]], fill);
    }

    // 发动机
    var engY = midY + 26;
    if (c.enginePos === "underwing") {
      var ex = xw + 30;
      s += rect(ex - 6, bot - 2, 12, 14, 2, fill);
      s += ell(ex, engY, 24, 12, fill);
      if (c.raked) {
        s += poly([[ex - 24, engY + 10], [ex - 18, engY + 16], [ex - 12, engY + 10]], "#fff");
      }
      if (c.engines === 4) {
        var ex2 = xw + 112;
        s += rect(ex2 - 6, bot - 2, 12, 14, 2, fill);
        s += ell(ex2, engY, 24, 12, fill);
      }
    } else if (c.enginePos === "rear") {
      var rex = x1 - 70;
      s += rect(rex - 5, bot - 8, 10, 12, 2, fill);
      s += ell(rex, midY + 1, 22, 11, fill);
    }

    // 垂直尾翼
    var tx = x1 - 30;
    if (c.tail === "T") {
      s += poly([[tx, top - 2], [tx + 14, top - 2], [tx + 7, top - 46]], fill);
      s += poly([[tx - 4, top - 46], [tx + 18, top - 46], [tx + 11, top - 54], [tx - 11, top - 54]], fill);
    } else {
      s += poly([[tx, top - 2], [tx + 16, top - 2], [tx + 6, top - 50]], fill);
    }

    // A350 黑色"墨镜"驾驶舱
    if (c.cockpitMask) {
      s += rect(x0 + 6, top + 4, 26, 8, 3, "rgba(18,20,30,0.92)");
    }

    // 起落架小车（轮）
    var wheelY = bot + 16;
    if (c.bogie === 6) {
      s += ell(x0 + c.bodyLen * 0.55, wheelY, 17, 5, "#1e293b");
    } else {
      s += ell(x0 + c.bodyLen * 0.6, wheelY, 10, 4, "#1e293b");
    }

    return wrap(s);
  }

  function top(id, mfr) {
    // 顶视（平面图）：机头朝上，机翼向左右展开
    var c = cfg(id);
    var fill = MFR_COLOR[mfr] || "#334155";
    var cx = VB_W / 2, cy = 135;
    var vertLen = c.bodyLen * 0.5;
    var fwh = c.bodyH * 0.5 + 5;
    var s = "";

    s += ell(cx, cy, fwh, vertLen / 2, fill);
    s += poly([[cx, cy - vertLen / 2 - 14], [cx - 7, cy - vertLen / 2], [cx + 7, cy - vertLen / 2]], fill);
    s += poly([[cx, cy + vertLen / 2 + 12], [cx - 6, cy + vertLen / 2], [cx + 6, cy + vertLen / 2]], fill);

    var wy = cy - vertLen * 0.06;
    var span = 150, tipY = wy + 46;
    s += poly([[cx - fwh, wy - 4], [cx - span, tipY], [cx - span + 22, tipY + 4], [cx - fwh - 4, wy + 4]], fill);
    s += poly([[cx + fwh, wy - 4], [cx + span, tipY], [cx + span - 22, tipY + 4], [cx + fwh + 4, wy + 4]], fill);

    var engX = span * 0.5, engY = wy + 18;
    s += ell(cx - engX, engY, 9, 18, fill);
    s += ell(cx + engX, engY, 9, 18, fill);
    if (c.engines === 4) {
      var engX2 = span * 0.82, engY2 = wy + 14;
      s += ell(cx - engX2, engY2, 8, 16, fill);
      s += ell(cx + engX2, engY2, 8, 16, fill);
    }

    var stY = cy + vertLen * 0.30, stSpan = 56;
    s += poly([[cx - fwh, stY - 2], [cx - fwh - 4, stY + 2], [cx - stSpan, stY + 14], [cx - stSpan + 16, stY + 14]], fill);
    s += poly([[cx + fwh, stY - 2], [cx + fwh + 4, stY + 2], [cx + stSpan, stY + 14], [cx + stSpan - 16, stY + 14]], fill);

    s += poly([[cx - 5, cy + vertLen / 2], [cx + 5, cy + vertLen / 2], [cx, cy + vertLen / 2 + 14]], fill);

    if (c.winglets === "sharklet" || c.winglets === "blended") {
      s += rect(cx - span - 2, tipY - 14, 10, 6, 2, fill);
      s += rect(cx + span - 8, tipY - 14, 10, 6, 2, fill);
    }
    return wrap(s);
  }

  function front(id, mfr) {
    var c = cfg(id);
    var fill = MFR_COLOR[mfr] || "#334155";
    var cx = VB_W / 2, cy = VB_H / 2;
    var fh = c.bodyH * 1.15;
    var s = "";

    s += ell(cx, cy, fh / 2 + 4, fh / 2 + 10, fill);
    s += ell(cx, cy - fh / 2 - 2, 4, 6, "rgba(255,255,255,0.30)");

    var span = 172;
    var wy = cy + 6;
    s += poly([[cx - fh / 2, wy], [cx - fh / 2 - 6, wy], [cx - span, wy + 10], [cx - span + 30, wy + 10]], fill);
    s += poly([[cx + fh / 2, wy], [cx + fh / 2 + 6, wy], [cx + span, wy + 10], [cx + span - 30, wy + 10]], fill);

    var engY = wy + 22;
    s += ell(cx - span * 0.5, engY, 12, 16, fill);
    s += ell(cx + span * 0.5, engY, 12, 16, fill);
    if (c.engines === 4) {
      s += ell(cx - span * 0.78, engY, 12, 16, fill);
      s += ell(cx + span * 0.78, engY, 12, 16, fill);
    }

    s += poly([[cx - 5, cy - fh / 2 - 6], [cx + 5, cy - fh / 2 - 6],
      [cx + 3, cy - fh / 2 - 40], [cx - 3, cy - fh / 2 - 40]], fill);
    return wrap(s);
  }

  window.Silhouettes = { side: side, top: top, front: front };
})();
