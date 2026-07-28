/* 机型系列划分（首页「系列」分组 + 详情页「系列划分」共用）
 * 每个家族：overview 一句话定位；series 数组按时间/代际展开，
 * 每条含 名称、年份、variants（主要型号）、note（这个系列怎么划分/区别）。
 * rep 指向该家族在 AIRCRAFT 中的代表机型 id（点卡片进详情）。
 */
window.FAMILIES = {
  /* ===== 波音 ===== */
  "707": { name: "波音 707 家族", mfr: "Boeing", rep: "b707", type: "窄体", overview: "波音第一款大获成功的喷气客机，开启喷气时代，是后续 727/737/747 的技术源头。",
    series: [
      { name: "707-120（原始型）", years: "1958", variants: ["707-120", "707-120B"], note: "最初洲际型，JT3C 发动机，机身较短。" },
      { name: "707-320（洲际加长型）", years: "1959", variants: ["707-320", "707-320B", "707-320C"], note: "加长机身 + 增加航程，C 型可客货转换，是量产主力。" },
      { name: "720（短程型）", years: "1960", variants: ["720", "720B"], note: "为短跑道机场优化的减重版，产量较少。" },
      { name: "军用衍生", years: "1960s+", variants: ["KC-135", "E-3 预警机", "E-8"], note: "以 707 平台发展出大量军用作战/预警/加油机。" }
    ] },
  "737": { name: "波音 737 家族", mfr: "Boeing", rep: "b737", type: "窄体", overview: "史上最畅销的客机，半个多世纪四代演进，按「代际 + 机身长度 + 发动机」划分。",
    series: [
      { name: "Original 原始型", years: "1967–1988", variants: ["-100", "-200"], note: "鼻祖代，低涵道比 JT8D 发动机，无小翼，数量已很少。" },
      { name: "Classic 经典型", years: "1984–2000", variants: ["-300", "-400", "-500"], note: "换 CFM56 高涵道比发动机；-300/-400 加长、-500 缩短，仍无小翼。" },
      { name: "NG 新一代 (Next Generation)", years: "1997–", variants: ["-600", "-700", "-800", "-900"], note: "全新机翼 + 翼梢小翼 + 玻璃座舱；-700/-800 是全球最常见窄体，-900 更长。" },
      { name: "MAX 当代型", years: "2017–", variants: ["MAX 7", "MAX 8", "MAX 9", "MAX 10"], note: "换 LEAP-1B 大涵道比发动机 + 分叉小翼，省油 14%；MAX 8 为主力。" }
    ] },
  "747": { name: "波音 747 家族", mfr: "Boeing", rep: "b747", type: "巨型", overview: "“珍宝机”，以机头驼峰闻名，按「机身长度 + 发动机代际 + 上层舱大小」划分。",
    series: [
      { name: "747-100 / -200", years: "1969–1990", variants: ["-100", "-200", "-200F（货）", "-200B"], note: "初代与早期加长，上层舱较短（仅休息舱）。" },
      { name: "747SP（特殊性能型）", years: "1976", variants: ["-SP"], note: "大幅缩短机身换超远航程，产量很少，用于瘦长航线。" },
      { name: "747-300", years: "1983", variants: ["-300"], note: "上层舱加长（更明显的驼峰），提升载客。" },
      { name: "747-400", years: "1989–2009", variants: ["-400", "-400F", "-400ER"], note: "带翼梢小翼 + 双人制玻璃座舱，是最常见的一代。" },
      { name: "747-8", years: "2011–2023", variants: ["-8I（客）", "-8F（货）"], note: "最新也是最后一型，加长机身 + GEnx 发动机，客机量少、货机为主。" }
    ] },
  "757": { name: "波音 757 家族", mfr: "Boeing", rep: "b757", type: "窄体", overview: "修长窄体、动力强劲，按「机身长度」划分两代。",
    series: [
      { name: "757-200", years: "1982–2004", variants: ["-200", "-200PF（货）", "-200SF"], note: "标准型，产量主力，爬升性能极佳。" },
      { name: "757-300", years: "1999", variants: ["-300"], note: "在 -200 基础上加长约 7.1 m，是世上最长的窄体客机。" }
    ] },
  "767": { name: "波音 767 家族", mfr: "Boeing", rep: "b767", type: "宽体", overview: "与 757 同平台的双发宽体，按「机身长度 + 用途」划分。",
    series: [
      { name: "767-200", years: "1981", variants: ["-200", "-200ER"], note: "标准型，ER 为增程。" },
      { name: "767-300", years: "1986", variants: ["-300", "-300ER", "-300F（货）"], note: "加长型，ER 与货机是量产主力。" },
      { name: "767-400ER", years: "2000", variants: ["-400ER"], note: "进一步加长并改用 777 风格翼尖，数量较少（美航/达美）。" },
      { name: "KC-46 加油机", years: "2019", variants: ["KC-46A"], note: "以 767 平台发展的军用空中加油/运输机。" }
    ] },
  "777": { name: "波音 777 家族", mfr: "Boeing", rep: "b777", type: "宽体", overview: "双发巨无霸，按「机身长度 + 航程 + 发动机」划分，是最大双发客机。",
    series: [
      { name: "777-200 系列", years: "1994", variants: ["-200", "-200ER"], note: "初始型，-200ER 增程，奠定双发远程标准。" },
      { name: "777-300 系列", years: "1997", variants: ["-300", "-300ER"], note: "加长型，-300ER 是最畅销的远程双发宽体。" },
      { name: "777-200LR / 货机", years: "2006", variants: ["-200LR（世界飞机）", "777F（货）"], note: "LR 为超远程（近乎全球不经停），F 为货机。" },
      { name: "777X", years: "2020s（在研/交付中）", variants: ["777-8", "777-9"], note: "全新复合材料折叠翼尖 + GE9X 发动机，777-9 更长，是 747 的接班人。" }
    ] },
  "787": { name: "波音 787 家族", mfr: "Boeing", rep: "b787", type: "宽体", overview: "“梦想客机”，按「机身长度」划分三个主要型号。",
    series: [
      { name: "787-8", years: "2009", variants: ["-8"], note: "初始型，机身最短、航程最长。" },
      { name: "787-9", years: "2014", variants: ["-9"], note: "加长约 6 m，是当前最主流的 787。" },
      { name: "787-10", years: "2018", variants: ["-10"], note: "最长型（约 68 m），载客最多但航程略短，适合高密度航线。" }
    ] },

  /* ===== 空客 ===== */
  "A220": { name: "空客 A220 家族", mfr: "Airbus", rep: "a220", type: "窄体", overview: "原庞巴迪 C 系列，按「机身长度」划分两型，主攻 100–150 座。",
    series: [
      { name: "A220-100", years: "2013（CS100）", variants: ["-100", "-100 货机（规划）"], note: "原 CS100，机身较短，约 100–120 座。" },
      { name: "A220-300", years: "2015（CS300）", variants: ["-300"], note: "原 CS300，加长约 3.4 m，是绝对主力，约 130–150 座。" }
    ] },
  "A320": { name: "空客 A320 家族", mfr: "Airbus", rep: "a320", type: "窄体", overview: "电传操纵窄体标杆，按「机身长度」分四型，再按「是否换发」分 neo。",
    series: [
      { name: "A318（最小）", years: "2002", variants: ["A318"], note: "机身最短，约 100–120 座，俗称“小胖”。" },
      { name: "A319", years: "1995", variants: ["A319", "A319neo"], note: "略短于 A320，约 124–140 座，商务/高原航线常用。" },
      { name: "A320", years: "1987", variants: ["A320", "A320neo"], note: "标准型，约 150–180 座，是家族核心。" },
      { name: "A321（最长）", years: "1993", variants: ["A321", "A321neo", "A321XLR（超远程）"], note: "加长型，约 185–244 座，XLR 主打跨洋瘦长航线。" },
      { name: "neo 换发计划", years: "2015–", variants: ["-neo 系列"], note: "换 LEAP/V2500 发动机 + 鲨鳍小翼，省油约 15–20%，覆盖上述各型。" }
    ] },
  "A330": { name: "空客 A330 家族", mfr: "Airbus", rep: "a330", type: "宽体", overview: "与 A340 同平台的双发宽体，按「机身长度 + 用途」划分，并有 neo 换代。",
    series: [
      { name: "A330-300", years: "1992", variants: ["-300"], note: "标准/加长型，主攻中高密度航线。" },
      { name: "A330-200", years: "1998", variants: ["-200", "-200F（货）"], note: "缩短机身换更长航程，是远程主力与货机基础。" },
      { name: "A330 MRTT", years: "2007", variants: ["MRTT（加油机）"], note: "以 -200 改装的空中加油/运输机，多国空军采用。" },
      { name: "A330neo", years: "2018", variants: ["-800", "-900"], note: "换 Trent 7000 发动机 + 新鲨鳍小翼的换代型，省油约 14%。" }
    ] },
  "A340": { name: "空客 A340 家族", mfr: "Airbus", rep: "a340", type: "宽体", overview: "A330 的四发双胞胎，按「机身长度 + 航程」划分，专为 ETOPS 限制时代的超长航线。",
    series: [
      { name: "A340-200 / -300", years: "1991–1993", variants: ["-200", "-300"], note: "早期型，-200 较短、-300 为主力中远程。" },
      { name: "A340-500", years: "2002", variants: ["-500"], note: "超远程型（曾执飞最长不经停航线），机身略短。" },
      { name: "A340-600", years: "2001", variants: ["-600"], note: "家族最长型（比 747 还长），四发旗舰，已停产。" }
    ] },
  "A350": { name: "空客 A350 家族", mfr: "Airbus", rep: "a350", type: "宽体", overview: "戴“墨镜”的现代复合材料宽体，按「机身长度 + 用途」划分。",
    series: [
      { name: "A350-900", years: "2013", variants: ["-900", "-900ULR（超远程）"], note: "标准型，ULR 为超远程（新加坡—纽约级）。" },
      { name: "A350-1000", years: "2016", variants: ["-1000"], note: "加长约 7 m，载客更多，对标 777-300ER/777X。" },
      { name: "A350F", years: "2020s", variants: ["F（货机）"], note: "货机改型，基于 -1000 机身。" }
    ] },
  "A380": { name: "空客 A380 家族", mfr: "Airbus", rep: "a380", type: "巨型", overview: "全球最大客机，从头到尾双层，量产几乎只有一种客机型。",
    series: [
      { name: "A380-800", years: "2005–2021", variants: ["-800（客）", "-800F（货，已取消）"], note: "唯一量产客机型，三层可选布局、载客 525–853 人。" }
    ] },

  /* ===== 中国商飞 ===== */
  "ARJ21": { name: "COMAC ARJ21（C909）家族", mfr: "COMAC", rep: "arj21", type: "支线", overview: "国产支线 jet，按「用途改型」划分，未来纳入 C909 序列。",
    series: [
      { name: "客运基本型", years: "2008–", variants: ["标准客运型"], note: "两舱约 78–90 座，支线航线主力。" },
      { name: "货运型", years: "2020s", variants: ["ARJ21F"], note: "客改货，拓展货运市场。" },
      { name: "特种改型", years: "2020s", variants: ["公务机", "医疗机", "灭火机"], note: "衍生出多种任务改型。" }
    ] },
  "C919": { name: "COMAC C919 家族", mfr: "COMAC", rep: "c919", type: "窄体", overview: "国产干线窄体，按「机身长度/航程」规划衍生，对标 737/A320。",
    series: [
      { name: "C919 基本型", years: "2017（首飞）", variants: ["标准型（约 168 座）"], note: "当前交付主力，LEAP-1C 发动机。" },
      { name: "加长 / 增程型（规划）", years: "在研", variants: ["加长型", "-ER 增程型"], note: "规划中，将覆盖更多航线。" },
      { name: "同家族宽体 C929", years: "研制中", variants: ["C929"], note: "商飞下一代双发宽体，与 C919/ARJ21 组成 ABC 格局。" }
    ] },

  /* ===== 巴航工业 ===== */
  "E-Jet": { name: "巴航 E-Jet 家族", mfr: "Embraer", rep: "ejet", type: "窄体", overview: "70–124 座支线喷气，按「机身长度」分四型，再推 E2 换发代。",
    series: [
      { name: "E170 / E175", years: "2002–2005", variants: ["E170", "E175"], note: "较小型，约 70–88 座，主攻美国支线（受合同座级限制）。" },
      { name: "E190 / E195", years: "2004–2006", variants: ["E190", "E195"], note: "较大型，约 100–124 座，跨支线与低成本市场。" },
      { name: "E2 第二代", years: "2016–", variants: ["E175-E2", "E190-E2", "E195-E2"], note: "换 PW1000G 齿轮传动发动机 + 新翼，省油对标 A220。" }
    ] },
  "ERJ": { name: "巴航 ERJ 支线家族", mfr: "Embraer", rep: "erj", type: "支线", overview: "30–50 座小支线喷气，按「机身长度」划分，与 CRJ 双雄并立。",
    series: [
      { name: "ERJ-135 / -140", years: "1999", variants: ["ERJ-135", "ERJ-140"], note: "最短两种，约 37–44 座。" },
      { name: "ERJ-145", years: "1995", variants: ["ERJ-145", "ERJ-145XR（远程）"], note: "家族代表，约 50 座，也是多国预警/侦察平台基础。" }
    ] },

  /* ===== 庞巴迪 ===== */
  "CRJ": { name: "庞巴迪 CRJ 家族", mfr: "Bombardier", rep: "crj", type: "支线", overview: "由 Challenger 公务机衍生的支线喷气，按「机身长度」划分五代。",
    series: [
      { name: "CRJ100 / 200", years: "1991", variants: ["CRJ100", "CRJ200"], note: "初始短型，约 50 座。" },
      { name: "CRJ440", years: "2002", variants: ["CRJ440"], note: "为某航司座级限制定制的 -200 变体。" },
      { name: "CRJ700", years: "1999", variants: ["CRJ700"], note: "加长，约 70 座，机身与机翼升级。" },
      { name: "CRJ900", years: "2001", variants: ["CRJ900"], note: "进一步加长，约 90 座，主力型。" },
      { name: "CRJ1000", years: "2009", variants: ["CRJ1000"], note: "最长型，约 100 座（原称 CRJ900X）。" }
    ] },

  /* ===== 麦道 ===== */
  "MD-80": { name: "麦道 MD-80 / DC-9 家族", mfr: "McDonnellDouglas", rep: "md80", type: "窄体", overview: "尾置双发、T 尾的经典窄体，按「机身长度/发动机」从 DC-9 演进到 MD-90/717。",
    series: [
      { name: "DC-9（前身）", years: "1965", variants: ["DC-9-10/-30/-50"], note: "家族源头，较短，JT8D 尾置发动机。" },
      { name: "MD-80 系列", years: "1979", variants: ["MD-81", "MD-82", "MD-83", "MD-87", "MD-88"], note: "DC-9 加长节能版，细分按长度/航程/航电区分。" },
      { name: "MD-90", years: "1993", variants: ["MD-90-30"], note: "换 V2500 大涵道比发动机，-30 为主。" },
      { name: "MD-95（→ 波音 717）", years: "1998", variants: ["MD-95"], note: "最短型，麦道被兼并后由波音以 717 名义续产。" }
    ] },
  "MD-11": { name: "麦道 MD-11 / DC-10 家族", mfr: "McDonnellDouglas", rep: "md11", type: "宽体", overview: "三发宽体，由 DC-10 现代化而来，如今多为货机。",
    series: [
      { name: "DC-10（前身）", years: "1970", variants: ["DC-10-10", "DC-10-30", "DC-10-40"], note: "三发宽体源头，-30 为洲际型。" },
      { name: "MD-11", years: "1990", variants: ["MD-11（客）", "MD-11F（货）", "MD-11 公务/特种"], note: "缩短机身 + 新翼 + 翼梢小翼 + 双人制，客机受冷后转货机。" }
    ] },

  /* ===== 图波列夫 ===== */
  "Tu-154": { name: "图波列夫 Tu-154 家族", mfr: "Tupolev", rep: "tu154", type: "窄体", overview: "苏制“空中巴士”，后三发、T 尾，按「发动机/航电改进」划分。",
    series: [
      { name: "Tu-154A / B", years: "1970", variants: ["Tu-154", "Tu-154A", "Tu-154B"], note: "早期生产型，逐步提升载重与航电。" },
      { name: "Tu-154M", years: "1984", variants: ["Tu-154M", "Tu-154M 货运/特种"], note: "换 D-30KU 发动机的主力改进型，产量最大。" }
    ] },
  "Tu-204": { name: "图波列夫 Tu-204 家族", mfr: "Tupolev", rep: "tu204", type: "窄体", overview: "对标 757 的俄制双发窄体，按「机身长度/用途」划分。",
    series: [
      { name: "Tu-204-100", years: "1989", variants: ["Tu-204-100", "Tu-204-100V（俄制航电）"], note: "标准型，客货两用。" },
      { name: "Tu-204C（货机）", years: "1990s", variants: ["Tu-204C", "Tu-204-100C"], note: "全货型，用于货运包机。" },
      { name: "Tu-214", years: "1990s", variants: ["Tu-214", "Tu-214 特种/专机"], note: "加长型，多用于专机与政府特种任务。" }
    ] },

  /* ===== 伊留申 ===== */
  "Il-96": { name: "伊留申 Il-96 家族", mfr: "Ilyushin", rep: "il96", type: "宽体", overview: "俄制四发宽体旗舰，按「机身长度/用途」划分，多用于专机与货运。",
    series: [
      { name: "Il-96-300", years: "1988", variants: ["Il-96-300"], note: "标准型，俄航与专机队主力。" },
      { name: "Il-96-400", years: "2000s", variants: ["Il-96-400T（货）", "Il-96-400（客，少量）"], note: "加长型，侧重货机与专机。" },
      { name: "Il-96-300PU", years: "专机", variants: ["PU（总统专机）"], note: "俄罗斯总统专机平台。" }
    ] },

  /* ===== 超音速 / 重吊 ===== */
  "Concorde": { name: "协和 Concorde 家族", mfr: "Concorde", rep: "concorde", type: "超音速", overview: "唯一投入商业运营的超音速客机，英法联合，仅量产一型。",
    series: [
      { name: "Concorde 量产型", years: "1969（首飞）/1976（运营）", variants: ["Concorde 001/002（原型）", "Concorde（量产）"], note: "仅英法各约 7 架共 14 架，英航与法航运营，2003 退役。" }
    ] },
  "An-124": { name: "安东诺夫 An-124 家族", mfr: "Antonov", rep: "an124", type: "货机", overview: "世界第二大运输机，机头机尾可掀盖，按「民用/军用改型」划分。",
    series: [
      { name: "An-124-100", years: "1982", variants: ["An-124-100", "An-124-100M"], note: "民用型，广泛用于超重货运。" },
      { name: "An-225“哥萨克人”", years: "1988", variants: ["An-225（仅 1 架，已损毁）"], note: "为背负航天飞机放大的六发巨型，曾是最大飞机，2022 年损毁。" }
    ] },

  /* ===== 苏霍伊 ===== */
  "SSJ100": { name: "苏霍伊 SSJ100 家族", mfr: "Sukhoi", rep: "ssj100", type: "支线", overview: "俄制现代支线 jet，按「航程」划分，并对国产化改型。",
    series: [
      { name: "SSJ100（基本型）", years: "2008", variants: ["SSJ100/95B（基本）"], note: "约 98 座，配 SaM146 发动机。" },
      { name: "SSJ100LR", years: "2010s", variants: ["SSJ100LR（远程）"], note: "增程型，航程更长。" },
      { name: "“国产替代”改型", years: "2020s", variants: ["SJ-100（国产航电/发动机版）"], note: "推进核心部件国产化，降低对西方供应链依赖。" }
    ] }
};
