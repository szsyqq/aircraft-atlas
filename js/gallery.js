/* 飞机图鉴 · Aircraft Atlas — 机型图库
 * 每架飞机的真实照片集合（来自 Wikimedia Commons，CC 授权）。
 * 项结构：{ src, cap, kind } — kind: "photo" 实拍 | "sil" 真实矢量线图
 * 新增照片：把图片放进 assets/img/<id>/ 或 assets/img/<id>_xxx.jpg，
 * 然后在此处为该机型追加一条即可；详情页图库会自动渲染。 */
(function () {
  "use strict";
  window.GALLERY = {
    b737: [
      { src: "assets/img/b737.jpg", cap: "波音 737 · 侧视（出厂涂装）", kind: "photo" },
      { src: "assets/img/b737_front.jpg", cap: "波音 737 · 机头 / 前视", kind: "photo" },
      { src: "assets/img/b737_top.jpg", cap: "波音 737 · 腹视 / 顶视", kind: "photo" }
    ],
    b747: [
      { src: "assets/img/b747.jpg", cap: "波音 747 · 侧视（经典 hump 驼峰）", kind: "photo" },
      { src: "assets/img/b747/b747_g1.jpg", cap: "波音 747 · 地面指挥视角（驼峰与四发清晰可见）", kind: "photo" },
      { src: "assets/img/b747/b747_g2.jpg", cap: "波音 747 · 高空飞行（凝结尾迹）", kind: "photo" },
      { src: "assets/img/b747/b747_g3.jpg", cap: "波音 747 · 日蚀剪影", kind: "photo" },
      { src: "assets/sil/b747.svg", cap: "波音 747 · 轮廓线图", kind: "sil" }
    ],
    b777: [
      { src: "assets/img/b777.jpg", cap: "波音 777 · 侧视", kind: "photo" },
      { src: "assets/img/b777_front.jpg", cap: "波音 777 · 机头 / 前视", kind: "photo" },
      { src: "assets/sil/b777.svg", cap: "波音 777 · 轮廓线图", kind: "sil" }
    ],
    b787: [
      { src: "assets/img/b787.jpg", cap: "波音 787 梦想客机 · 侧视", kind: "photo" },
      { src: "assets/img/b787_front.jpg", cap: "波音 787 · 机头 / 前视（遛鸟式鼻锥）", kind: "photo" },
      { src: "assets/sil/b787.svg", cap: "波音 787 · 轮廓线图", kind: "sil" }
    ],
    a320: [
      { src: "assets/img/a320.jpg", cap: "空客 A320 · 侧视", kind: "photo" },
      { src: "assets/img/a320_front.jpg", cap: "空客 A320 · 机头 / 前视", kind: "photo" },
      { src: "assets/img/a320_top.jpg", cap: "空客 A320 · 腹视 / 顶视", kind: "photo" }
    ],
    a330: [
      { src: "assets/img/a330.jpg", cap: "空客 A330 · 侧视", kind: "photo" },
      { src: "assets/img/a330_front.jpg", cap: "空客 A330 · 机头 / 前视", kind: "photo" },
      { src: "assets/img/a330/a330_g1.jpg", cap: "空客 A330 · 机翼舷窗视角（跨大西洋航程）", kind: "photo" },
      { src: "assets/img/a330/a330_g2.jpg", cap: "空客 A330 · 停机坪（香港国际机场）", kind: "photo" },
      { src: "assets/img/a330/a330_g3.jpg", cap: "空客 A330 · 日落剪影（黑白艺术）", kind: "photo" }
    ],
    a350: [
      { src: "assets/img/a350.jpg", cap: "空客 A350 XWB · 侧视", kind: "photo" },
      { src: "assets/img/a350_front.jpg", cap: "空客 A350 · 机头 / 前视（A350 标志性舷窗）", kind: "photo" },
      { src: "assets/img/a350/a350_g1.jpg", cap: "空客 A350 XWB · 试飞涂装（侧视飞行）", kind: "photo" },
      { src: "assets/img/a350/a350_g2.jpg", cap: "空客 A350 XWB · 降落（起落架放下）", kind: "photo" },
      { src: "assets/img/a350/a350_g3.jpg", cap: "空客 A350 XWB · 主起落架特写（三组双轮）", kind: "photo" }
    ],
    a380: [
      { src: "assets/img/a380.jpg", cap: "空客 A380 · 侧视（双层巨无霸）", kind: "photo" },
      { src: "assets/img/a380_top.jpg", cap: "空客 A380 · 腹视 / 顶视", kind: "photo" },
      { src: "assets/sil/a380.svg", cap: "空客 A380 · 轮廓线图", kind: "sil" }
    ],
    c919: [
      { src: "assets/img/c919.jpg", cap: "中国商飞 C919 · 侧视", kind: "photo" },
      { src: "assets/img/c919/c919_g1.jpg", cap: "中国商飞 C919 · 飞越维多利亚港", kind: "photo" },
      { src: "assets/img/c919/c919_g2.jpg", cap: "中国商飞 C919 · 中国东航（新加坡航展静态展示）", kind: "photo" },
      { src: "assets/img/c919/c919_g3.jpg", cap: "中国商飞 C919 · 中国南航 B-919J 起飞", kind: "photo" }
    ],
    arj21: [
      { src: "assets/img/arj21.jpg", cap: "中国商飞 ARJ21 · 侧视", kind: "photo" },
      { src: "assets/img/arj21_front.jpg", cap: "中国商飞 ARJ21 · 机头 / 前视", kind: "photo" },
      { src: "assets/img/arj21/arj21_g3.jpg", cap: "中国商飞 ARJ21 · 客舱内部（南方航空）", kind: "photo" }
    ],
    /* ===== 新增机型（v1.5.0 扩展） ===== */
    b707: [
      { src: "assets/img/b707.jpg", cap: "波音 707 · 经典四发喷气客机（法航涂装）", kind: "photo" },
      { src: "assets/img/b707/b707_g1.jpg", cap: "波音 707 · 飞行中（侧面）", kind: "photo" },
      { src: "assets/img/b707/b707_g2.jpg", cap: "波音 707 · 另一角度实拍", kind: "photo" }
    ],
    b757: [
      { src: "assets/img/b757.jpg", cap: "波音 757 · 修长窄体", kind: "photo" },
      { src: "assets/img/b757/b757_g1.jpg", cap: "波音 757 · 起降实拍", kind: "photo" },
      { src: "assets/img/b757/b757_g2.jpg", cap: "波音 757 · 另一角度", kind: "photo" }
    ],
    b767: [
      { src: "assets/img/b767.jpg", cap: "波音 767 · 双发宽体", kind: "photo" },
      { src: "assets/img/b767/b767_g1.jpg", cap: "波音 767 · 实拍", kind: "photo" },
      { src: "assets/img/b767/b767_g2.jpg", cap: "波音 767 · 另一角度", kind: "photo" }
    ],
    a220: [
      { src: "assets/img/a220.jpg", cap: "空客 A220 · 窄体（新几内亚航空特别涂装）", kind: "photo" },
      { src: "assets/img/a220/a220_g1.jpg", cap: "空客 A220 · 实拍", kind: "photo" },
      { src: "assets/img/a220/a220_g2.jpg", cap: "空客 A220 · 另一角度", kind: "photo" }
    ],
    a340: [
      { src: "assets/img/a340.jpg", cap: "空客 A340 · 四发宽体", kind: "photo" },
      { src: "assets/img/a340/a340_g1.jpg", cap: "空客 A340 · 实拍", kind: "photo" },
      { src: "assets/img/a340/a340_g2.jpg", cap: "空客 A340 · 另一角度", kind: "photo" }
    ],
    ejet: [
      { src: "assets/img/ejet.jpg", cap: "��航 E-Jet · 支线喷气", kind: "photo" },
      { src: "assets/img/ejet/ejet_g1.jpg", cap: "巴航 E-Jet · 实拍", kind: "photo" },
      { src: "assets/img/ejet/ejet_g2.jpg", cap: "巴航 E-Jet · 另一角度", kind: "photo" }
    ],
    erj: [
      { src: "assets/img/erj.jpg", cap: "巴航 ERJ · 细长支线喷气", kind: "photo" },
      { src: "assets/img/erj/erj_g1.jpg", cap: "巴航 ERJ · 实拍", kind: "photo" },
      { src: "assets/img/erj/erj_g2.jpg", cap: "巴航 ERJ · 另一角度", kind: "photo" }
    ],
    crj: [
      { src: "assets/img/crj.jpg", cap: "庞巴迪 CRJ · 支线喷气（汉莎区域航空）", kind: "photo" },
      { src: "assets/img/crj/crj_g1.jpg", cap: "庞巴迪 CRJ · 实拍", kind: "photo" },
      { src: "assets/img/crj/crj_g2.jpg", cap: "庞巴迪 CRJ · 另一角度", kind: "photo" }
    ],
    md80: [
      { src: "assets/img/md80.jpg", cap: "麦道 MD-80 · 尾置双发窄体", kind: "photo" },
      { src: "assets/img/md80/md80_g1.jpg", cap: "麦道 MD-80 · 实拍", kind: "photo" },
      { src: "assets/img/md80/md80_g2.jpg", cap: "麦道 MD-80 · 另一角度", kind: "photo" }
    ],
    md11: [
      { src: "assets/img/md11.jpg", cap: "麦道 MD-11 · 三发宽体", kind: "photo" },
      { src: "assets/img/md11/md11_g1.jpg", cap: "麦道 MD-11 · 实拍", kind: "photo" },
      { src: "assets/img/md11/md11_g2.jpg", cap: "麦道 MD-11 · 另一角度", kind: "photo" }
    ],
    tu154: [
      { src: "assets/img/tu154.jpg", cap: "图波列夫 Tu-154 · 后三发 T 尾窄体（大韩航空）", kind: "photo" },
      { src: "assets/img/tu154/tu154_g1.jpg", cap: "图波列夫 Tu-154 · 实拍", kind: "photo" },
      { src: "assets/img/tu154/tu154_g2.jpg", cap: "图波列夫 Tu-154 · 另一角度", kind: "photo" }
    ],
    tu204: [
      { src: "assets/img/tu204.jpg", cap: "图波列夫 Tu-204 · 双发窄体", kind: "photo" },
      { src: "assets/img/tu204/tu204_g1.jpg", cap: "图波列夫 Tu-204 · 实拍", kind: "photo" },
      { src: "assets/img/tu204/tu204_g2.jpg", cap: "图波列夫 Tu-204 · 另一角度", kind: "photo" }
    ],
    il96: [
      { src: "assets/img/il96.jpg", cap: "伊留申 Il-96 · 四发宽体（俄航涂装）", kind: "photo" },
      { src: "assets/img/il96/il96_g1.jpg", cap: "伊留申 Il-96 · 实拍", kind: "photo" },
      { src: "assets/img/il96/il96_g2.jpg", cap: "伊留申 Il-96 · 另一角度", kind: "photo" }
    ],
    concorde: [
      { src: "assets/img/concorde.jpg", cap: "协和 Concorde · 超音速客机起飞瞬间", kind: "photo" },
      { src: "assets/img/concorde/concorde_g1.jpg", cap: "协和 Concorde · 实拍", kind: "photo" },
      { src: "assets/img/concorde/concorde_g2.jpg", cap: "协和 Concorde · 另一角度", kind: "photo" }
    ],
    an124: [
      { src: "assets/img/an124.jpg", cap: "安东诺夫 An-124 · 巨型运输机编队飞行", kind: "photo" },
      { src: "assets/img/an124/an124_g1.jpg", cap: "安东诺夫 An-124 · 实拍", kind: "photo" },
      { src: "assets/img/an124/an124_g2.jpg", cap: "安东诺夫 An-124 · 另一角度", kind: "photo" }
    ],
    ssj100: [
      { src: "assets/img/ssj100.jpg", cap: "苏霍伊 SSJ100 · 支线喷气（俄航 185 号机）", kind: "photo" },
      { src: "assets/img/ssj100/ssj100_g1.jpg", cap: "苏霍伊 SSJ100 · 实拍", kind: "photo" },
      { src: "assets/img/ssj100/ssj100_g2.jpg", cap: "苏霍��� SSJ100 · 另一角度", kind: "photo" }
    ]
  };
})();
