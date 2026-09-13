import { useCallback, useEffect, useMemo, useState } from 'react';
import { LS_PREFIX } from '../config';

/** Checklist 条目频率：每日 / 每周日执行 / 发品前（参考，不进日历打卡） */
export type SopFreq = 'daily' | 'weekly' | 'pre-publish';

export interface SopItem {
  id: string;
  group: string;       // 组 key：A/B/C/D/WEEK/WEIGHT/FABU
  title: string;       // 条目标题
  how: string;         // 怎么做
  why: string;         // 📊 数据影响
  freq: SopFreq;
}

export interface SopGroup {
  key: string;
  label: string;
  sub: string;
  freq: SopFreq;
  items: Omit<SopItem, 'group' | 'freq'>[];
}

/** 某人某天的SOP执行记录（保存后即为历史记录，按 日期+人员 唯一） */
export interface SopRecord {
  date: string;          // YYYY-MM-DD
  personId: string;
  done: string[];        // 已完成条目 id
  extra: string[];       // 额外完成的自定义任务
  note: string;
  updatedAt: string;
}

/* ================= 每日时段总表 ================= */
export const TIME_TABLE = [
  { slot: '早班 09:30', duration: '20 min', check: 'A 组（消息与客服）全过 + B 组 1/9', standard: '无超 2 小时未回复；订单零积压' },
  { slot: '午班 12:30', duration: '15 min', check: 'B 组（流量）部分 + C 组（商品与选品）', standard: '擦亮/上新/降价的当日份额完成' },
  { slot: '晚班 19:30', duration: '30 min', check: 'B 组剩余 + 高峰客服值守', standard: '询单 5 分钟内响应；未成交询单跟进率 100%' },
  { slot: '日结 21:30', duration: '15 min', check: 'D 组（数据日结）', standard: '日表 7 字段填写完整；有 1 条优化判断' },
];

/* ============ 来源：《闲鱼自运营手册_3C数码与本地生活》④ 单账号全维SOP·Checklist ============ */
export const SOP_GROUPS: SopGroup[] = [
  {
    key: 'A', label: 'A 组 · 消息与客服', sub: '客服是转化率的后半段——曝光再高，消息回不好单子照样飞', freq: 'daily',
    items: [
      { id: 'A1', title: '清空隔夜消息（09:30 前全部回复完毕）', how: '按「询单 > 订单咨询 > 一般闲聊」优先级处理；隔夜询单开场白：「还在吗，机器还在的，今天拍我给你优先安排」', why: '响应速度分直接参与搜索排序；隔夜询单转化率只有 2 小时内响应的 1/3 左右' },
      { id: 'A2', title: '主动触达所有新点「想要」的用户', how: '打开「我发布的 → 想要」列表，对每个新增想要的人发钩子话术：「看到你想要这台，今天还有货，需要细节图/视频吗？」', why: '「想要」是最高意向流量，主动触达可把想要→询单转化拉高 20% 以上，绝大多数卖家根本不做这步' },
      { id: 'A3', title: '未成交询单 24 小时内二次跟进', how: '话术模板：「同学，昨天你问的那台还在哈，今天给你留到最后一天，需要的话现在拍马上发」', why: '二次触达平均回收 10–15% 的流失订单，等于免费捡单' },
      { id: 'A4', title: '订单状态全链路巡检（待发货 / 在途 / 待收货）', how: '待发货 24h 内必须发（3C 发货录像同步存档）；在途发物流进度；签收后第 2 天提醒确认收货 + 引导好评', why: '发货时效影响履约分（搜索权重），确认收货速度影响资金回款和好评积累' },
      { id: 'A5', title: '快捷短语迭代：被问 2 次以上的问题当晚写进快捷回复', how: '闲鱼「设置 → 快捷回复」新增一条；让自动回复和快捷短语覆盖 80% 高频问题', why: '人工打字平均 40 秒、快捷短语 5 秒发出——响应速度分和晚高峰接待量都靠它撑' },
      { id: 'A6', title: '好评引导 + 评价 100% 回复', how: '收货 48h 内引导：「满意的话帮我点个赞和好评，回头有需要给你老客价」；已收到的评价（含差评）24h 内逐条回复', why: '好评率与带图评价数影响搜索权重和进店信任转化；评价回复是给后续浏览者的免费信任背书' },
      { id: 'A7', title: '纠纷/退款消息当天响应不隔夜', how: '先安抚给方案，证据（打包视频/聊天记录）随整理随存；处理过程全程站内留痕', why: '纠纷率超阈值会触发账号降权；拖着不回会被平台判「商家责任」' },
    ],
  },
  {
    key: 'B', label: 'B 组 · 流量动作', sub: '每一条都是免费流量入口，漏掉一条就少一条曝光', freq: 'daily',
    items: [
      { id: 'B1', title: '晚 19:00–22:00 窗口擦亮全部在售商品', how: '「我的 → 我发布的」逐个擦亮；不要在凌晨或早上擦（错过浏览高峰）', why: '擦亮 = 免费把商品重排到关注者时间线前端，是单人可操作的最大免费回流动作' },
      { id: 'B2', title: '上新 1–3 个（变体错发规则）', how: '同款用不同标题关键词、不同主图顺序、价格带错开 ±10%；新发商品卡工作日 19–22:30 / 周末 10–12 点', why: '新发商品有时间线加权；同款变体多链接 = 多个搜索入口，覆盖不同搜索词' },
      { id: 'B3', title: '手动降价 1–2 个商品（降 1–3%）', how: '优先降「曝光高但想要率低」的商品；降价幅度小步走，别一次降穿底价', why: '降价触发平台「降价提醒」推送给所有收藏/想要的用户，等于一次免费定向推送' },
      { id: 'B4', title: '关键词排名自检（每天 3 个核心词）', how: '用核心搜索词（如「Sony XM4」「滨江开荒保洁」）搜索，记录自己商品排位（第几屏第几个）进日表', why: '排名是流量晴雨表：连续 3 天下滑 = 标题词或账号权重出了问题，早发现早干预' },
      { id: 'B5', title: '鱼塘动作：签到 / 发帖 / 回复 ≥1 次', how: '加入品类鱼塘 + 同城鱼塘；发帖用「晒货 + 干净实拍」内容，不发硬广', why: '鱼塘是同城和兴趣标签流量入口，鱼塘活跃度会给主页和商品加曝光' },
      { id: 'B6', title: '账号活跃互动：给同品类商品点 3–5 个「想要」/点赞', how: '顺手对同类目商品互动，也能顺便观察竞品定价和话术', why: '平台会给活跃账号（登录、浏览、互动行为完整）更高初始权重' },
      { id: 'B7', title: '分享 1 个重点商品（微信好友/朋友圈，走站内分享按钮）', how: '挑最想推的爆品分享，分享文案自己写卖点', why: '站外分享回流会给商品记录行为权重；分享动作本身参与商品热度计算' },
      { id: 'B8', title: '曝光曲线巡检：今日曝光 vs 昨日 vs 7 日均值', how: '进入商品数据分析页逐个看；发现单品腰斩或全店腰斩，立即按风控应急表处置', why: '曝光是一切的前置，腰斩 24h 内处置和 7 天后才发现，恢复周期差 3 倍以上' },
      { id: 'B9', title: '付费工具检查（有投放才做）', how: '超强擦亮/线索通投放中的商品看当日 ROI；ROI <1 连续 3 天的停投换品', why: '付费流量放大的是自然流量模型——投错了品是把钱烧给平台' },
    ],
  },
  {
    key: 'C', label: 'C 组 · 选品与商品维护', sub: '保持在售商品池高动销浓度', freq: 'daily',
    items: [
      { id: 'C1', title: '记录搜索下拉词：今日新词进词库', how: '搜核心品类词，把下拉框出现的词（尤其新出现的）记进选品表词库列，明天上新用', why: '搜索下拉词 = 实时买家需求词库，标题命中下拉词 = 免费精准流量' },
      { id: 'C2', title: '核心竞品监控：3 个对标品记录想要数增量', how: '固定 3 个卖得最好的竞品，每天记「想要数」，日增 >5 的品重点研究（标题/图/价/话术）', why: '竞品想要数增量 = 市场需求温度计，也是发现新爆品的最早信号' },
      { id: 'C3', title: '死链处理：连续 7 天零曝光的商品今日内处理', how: '下架 → 换主图换标题（换关键词）→ 隔 3 天重发；重发仍死 = 选品问题，淘汰并记录', why: '死链占着「在售数量」但贡献零曝光，还会拉低店铺整体动销表现' },
      { id: 'C4', title: '库存盘点（3C）/ 服务档期确认（本地生活）', how: '现货/在途/已售三本账对齐，超卖=纠纷；本地生活核对服务商本周可约时段', why: '超卖引发的取消单直接打击履约分；档期错乱导致接单后服务不了=差评' },
      { id: 'C5', title: '拍 1 组素材进案例库', how: '新货开箱视频、服务前后对比、细节特写，随手拍随手归档（按品名建文件夹）', why: '素材库是上新速度的弹药——没素材的上新会降标准，降标准就掉转化' },
      { id: 'C6', title: '季节/节点选品预警（日常记录灵感）', how: '提前 2–4 周备节点品：开学季（平板/耳机）、入夏（空调清洗/风扇）、入冬（取暖器）、毕业季（搬家）、节假日（宠物寄养）', why: '节点品的搜索量是平日 3–10 倍，提前上架 = 提前吃流量爬坡期' },
    ],
  },
  {
    key: 'D', label: 'D 组 · 数据日结（21:30）', sub: '没有完整数据就没有诊断——断一天就断一周对比', freq: 'daily',
    items: [
      { id: 'D1', title: '填写日表 7 字段', how: '曝光 / 浏览 / 想要 / 询单数 / 成交单数 / 成交额 / 净毛利，一个都不能空（可直接在本系统「数据分析」页录入）', why: '没有 7 字段完整数据，漏斗诊断根本没法做——断一天就断一周对比' },
      { id: 'D2', title: '漏斗分层诊断：今天掉的是哪一层', how: '曝光低→标题/擦亮问题；浏览率<8%→主图问题；想要率<3%→详情/价格问题；询单成交率<25%→话术/响应问题', why: '只修掉层的那一环，其他动作保持——全链路乱调会让你失去归因能力（可用「投流诊断器」页）' },
      { id: 'D3', title: '今日异常标记：爆了的 / 崩了的 / 新出现的问题', how: '单品曝光异动、异常买家、平台规则变化，都记一行进日表备注列', why: '周报和月度复盘的数据线索全靠每天的异常标记积累' },
      { id: 'D4', title: '明日待办 3 条（写死，不写等于没日结）', how: '格式：「品/事 + 动作 + 标准」，例：「XM4 白色版——补拍电池效率截图——发到 B 链接详情」', why: '自营和带教并行最怕「想起来了才做」，待办是 SOP 的个人补丁' },
    ],
  },
  {
    key: 'WEEK', label: '每周 Checklist（周日 40 分钟 · 8 项）', sub: '周是运营的最小复盘周期', freq: 'weekly',
    items: [
      { id: 'W1', title: '周数据汇总 + 漏斗诊断（出周报）', how: '7 日曝光/浏览/想要/询单/成交汇总，环比上周，锁定本周掉的层', why: '周是运营的最小复盘周期，日数据噪音大、月数据反馈太慢' },
      { id: 'W2', title: '商品结构调整：死链淘汰 + 爆品复制', how: '零曝光零询单的下架；两周 ≥3 单的爆品铺 2–3 个变体链接覆盖更多关键词', why: '让在售商品池永远保持「高动销浓度」，拉高店铺整体权重' },
      { id: 'W3', title: '竞品巡检：3 个核心词的 TOP20 新玩法', how: '看竞品新标题词、新主图风格、新价格带、话术变化，能抄的抄进 SOP', why: '竞品在帮你试错——他们验证有效的打法你跟进，省掉自己的试错流量' },
      { id: 'W4', title: '评价复盘：差评原因归类，好评话术沉淀', how: '差评按「物流/成色/服务/沟通」归类，同一原因 ≥2 次必须改 SOP', why: '差评是免费的用户调研，不归类就会重复踩同一个坑' },
      { id: 'W5', title: '财务对账', how: '3C：库存/在途/回款/售后预留核对；本地生活：商家分佣对账，结算周期固定', why: '毛利是唯一真实指标——不看账的运营会在低毛利品上越陷越深' },
      { id: 'W6', title: '词库整理：新增搜索词入库、无效词淘汰', how: '结合排名自检数据：带来过曝光的词留，一周零贡献的词换', why: '标题词库是搜索流量的弹药库，脏了就打不中' },
      { id: 'W7', title: '下周上新清单 ≥7 个标题（提前写好）', how: '结合词库、竞品、季节节点，写好 7 个标题+对应的图和价格', why: '上新断档 = 流量断档；前置准备保证每天上新动作不卡壳' },
      { id: 'W8', title: '沉淀反哺带教：跑通的话术/素材/坑更新进学员 SOP', how: '自营号是打样账号，验证过的内容第一时间同步给学员', why: '这是自营业务对带教业务的核心价值输出点' },
    ],
  },
  {
    key: 'WEIGHT', label: '账号权重养护（每周自查 · 7 项）', sub: '账号分是所有流量的乘数——它掉了，前面所有努力都打折', freq: 'weekly',
    items: [
      { id: 'WT1', title: '违规检查：消息中心 + 商品状态逐条过', how: '有任何违规提示当天整改并记录触发原因，同类错误不犯第二次', why: '单次违规降权可持续 1–4 周，是曝光腰斩最常见的原因' },
      { id: 'WT2', title: '回复率 >90%、响应时长达标', how: '查看账号数据页的客服指标；不达标说明自动回复/值守时段要调整', why: '回复率是官方明示的排序因子' },
      { id: 'WT3', title: '履约指标：发货时效 48h 内、无超时单、无假发货', how: '3C 发货必录打包视频（也当售后证据）；本地生活确认服务按约完成', why: '履约分和纠纷率挂钩账号整体信任等级' },
      { id: 'WT4', title: '纠纷/退款单复盘：本周每单退款写一行原因', how: '按「买家原因/商品描述/物流/服务」归类，可预防的写进话术或详情', why: '退款率超阈值触发平台降权；归类后至少能砍掉一半可预防退款' },
      { id: 'WT5', title: '敏感词自查：本周新发商品标题/详情过红线表', how: '对照违规词表逐条扫（最低/第一/加V/批发/高仿等）', why: '敏感词不一定立刻下架，可能只默默限流——自查是唯一发现手段' },
      { id: 'WT6', title: '设备与环境纪律：一机一号未混用、无频繁切换', how: '手机/账号/网络环境固定绑定；换手机及时在团队台账更新', why: '设备关联是多号矩阵被判「营销号」的最主要触发条件' },
      { id: 'WT7', title: '芝麻信用/账号分核对：分数变动记录进周报', how: '芝麻信用授权状态正常、分数无异常波动', why: '信用分是买家下单前的信任信号，也参与平台排序' },
    ],
  },
  {
    key: 'FABU', label: '发品前验收 Checklist（每个商品发布前逐项过 · 12 项）', sub: '少一项就可能浪费一次免费上新流量——新品首发权重只有一次', freq: 'pre-publish',
    items: [
      { id: 'F1', title: '标题：品牌+型号+成色/服务+场景+钩子，20–30 字，至少命中 1 个下拉词', how: '对照标题公式逐段检查；本地生活必须含「城市+区域」词', why: '标题决定搜索曝光的上限，发出去之后改标题会重置部分权重' },
      { id: 'F2', title: '类目与属性选择正确', how: '品类、成色、品牌属性如实选，不「蹭类目」', why: '错放类目会被限流，且搜索类目筛选下你根本不出现' },
      { id: 'F3', title: '主图实拍：主体占画面 >60%，光线明亮，无牛皮癣/水印/拼贴', how: '桌面/白墙背景，擦干净镜头再拍', why: '主图决定点击率（浏览/曝光比），是漏斗第一道闸门' },
      { id: 'F4', title: '次图 ≥4 张：配件全家福 / 成色细节 / 购买凭证（打码）/ 包装', how: '3C：边角、屏幕、接口特写必拍；本地生活：前后对比图必放', why: '次图解决信任问题，直接作用于想要率' },
      { id: 'F5', title: '视频 15–30s 实拍（有条件必拍）', how: '开机运行/服务过程；手机横屏拍，光线充足', why: '带视频商品在推荐流和搜索中都获加权，想要率显著更高' },
      { id: 'F6', title: '详情三段式：成色配置（客观）→ 来源与质保（信任）→ 价格锚+急出理由（促单）', how: '对照模板填，不裸发', why: '详情决定想要率和询单质量，缺信任段的品询单砍价更狠' },
      { id: 'F7', title: '定价：竞品中位价 ×0.95–0.98；净毛利 ≥8%（3C）/ 分佣 ≥20%（本地生活）', how: '挂价、心理底价、运费+售后预留 5% 都算清再发', why: '定价错误是「有曝光没转化」的第一原因，发出去再大改会触发权重波动' },
      { id: 'F8', title: '划线原价已设置（制造价差感）', how: '划线价 = 官方新机价 / 市场常规价', why: '价差感直接影响点击率和「觉得占了便宜」的下单冲动' },
      { id: 'F9', title: '运费设置正确：小件标包邮（运费摊进价格）', how: '包邮标签提升点击；大件写清运费规则避免纠纷', why: '「包邮」筛选是买家高频筛选项，不包邮 = 从筛选结果里消失' },
      { id: 'F10', title: '发布时间卡高峰：工作日 19–22:30 / 周末 10–12；本地生活加 12–13:30 午高峰', how: '提前编辑好草稿，卡点发布', why: '新品首发 2 小时的行为数据（浏览/想要）决定它后续分到的流量池大小' },
      { id: 'F11', title: '定位：本地生活精确到区；同服务变体发不同区覆盖', how: '3C 商品定位不影响流量，可忽略；本地生活定位是命门', why: '同城流量按距离排序，定位错区 = 对目标客群隐形' },
      { id: 'F12', title: '发布后 10 分钟自搜关键词确认可见 + 30 分钟后回看首波曝光', how: '搜不到 = 触发敏感词或审核延迟，当天处理不留过夜', why: '新品前 30 分钟数据是流量分配的关键窗口，发布即放手浪费首发权重' },
    ],
  },
];

export const SOP_ITEMS: SopItem[] = SOP_GROUPS.flatMap((g) =>
  g.items.map((it) => ({ ...it, group: g.key, freq: g.freq })),
);

const RECORDS_KEY = `${LS_PREFIX}sop_records_v2`;

function loadRecords(): Record<string, SopRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, SopRecord>;
  } catch { /* ignore */ }
  return {};
}

export const recordKey = (date: string, personId: string) => `${date}__${personId}`;

/** 某日期应打卡的条目：每日组固定，每周组仅周日（getDay()===0）计入 */
export function applicableItems(date: string): SopItem[] {
  const d = new Date(`${date}T00:00:00`);
  const isSunday = d.getDay() === 0;
  return SOP_ITEMS.filter((i) => i.freq === 'daily' || (i.freq === 'weekly' && isSunday));
}

/** 按记录算完成率（0–100） */
export function recordPct(date: string, record: SopRecord | undefined): number {
  if (!record) return 0;
  const items = applicableItems(date);
  if (!items.length) return 0;
  return Math.round((items.filter((i) => record.done.includes(i.id)).length / items.length) * 100);
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function useSop() {
  const [records, setRecords] = useState<Record<string, SopRecord>>(loadRecords);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  const getRecord = useCallback(
    (date: string, personId: string): SopRecord | undefined => records[recordKey(date, personId)],
    [records],
  );

  /** 保存（新增或覆盖）某天某人的执行记录 —— 即落一条历史记录 */
  const saveRecord = useCallback(
    (date: string, personId: string, patch: Partial<Omit<SopRecord, 'date' | 'personId'>>) => {
      setRecords((prev) => {
        const key = recordKey(date, personId);
        const base: SopRecord = prev[key] || { date, personId, done: [], extra: [], note: '', updatedAt: '' };
        return { ...prev, [key]: { ...base, ...patch, date, personId, updatedAt: new Date().toISOString() } };
      });
    },
    [],
  );

  const removeRecord = useCallback((date: string, personId: string) => {
    setRecords((prev) => {
      const next = { ...prev };
      delete next[recordKey(date, personId)];
      return next;
    });
  }, []);

  return { records, getRecord, saveRecord, removeRecord };
}

/** 月份工具：日历格子（含前后空位） */
export function useMonthGrid(year: number, month: number) {
  return useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startWeek = first.getDay(); // 0=周日
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);
}
