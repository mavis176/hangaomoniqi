import { GameStats } from '../types';

export interface ClubSuddenIncident {
  id: string;
  clubId: string; // 'dance' | 'band' | 'council' | 'sports' | 'any'
  title: string;
  tag: string;
  sceneDesc: string;
  options: {
    text: string;
    outcomeText: string;
    effect: Partial<GameStats>;
    npcId?: string;
    favDelta?: number;
  }[];
}

export interface ClubTournamentTier {
  id: string;
  name: string;
  levelLabel: string;
  requiredSkill: number;
  staminaCost: number;
  championPrize: number;
  runnerUpPrize: number;
  trophyName: string;
  rivalSchool: string;
  stage1Prompt: string;
  stage1Options: {
    text: string;
    bonusScore: number;
    feedback: string;
    effect: Partial<GameStats>;
  }[];
  stage2CrisisByClub: Record<
    string,
    {
      crisisTitle: string;
      crisisDesc: string;
      choices: {
        text: string;
        bonusScore: number;
        feedback: string;
        effect: Partial<GameStats>;
      }[];
    }
  >;
}

export interface AgencyInfo {
  id: string;
  name: string;
  koreanName: string;
  styleTag: string;
  desc: string;
  weeklyStipend: number;
  specialty: string;
  badgeColor: string;
}

export interface TraineeSuddenIncident {
  id: string;
  title: string;
  tag: string;
  sceneDesc: string;
  options: {
    text: string;
    outcomeText: string;
    effect: Partial<GameStats>;
  }[];
}

export interface TraineeEvaluationStage {
  id: string;
  title: string;
  subtitle: string;
  staminaCost: number;
  minScoreForA: number;
  rewardCoins: number;
  rewardFollowers: number;
  stage1Concepts: {
    name: string;
    desc: string;
    statKey: 'vocalSkill' | 'danceSkill' | 'rapSkill' | 'cameraSkill';
    bonusScore: number;
  }[];
  stage2Crises: {
    crisisTitle: string;
    crisisDesc: string;
    choices: {
      text: string;
      bonusScore: number;
      feedback: string;
      effect: Partial<GameStats>;
    }[];
  }[];
}

// ==================== 1. 四大核心社团配置 ====================
export const CLUBS_INFO = [
  {
    id: 'dance',
    name: 'K-Pop 街舞社 (Luminous)',
    npcId: 'npc_6',
    leader: '千宥娜 (前四大社C位练习生)',
    slogan: '用刀群舞与定点直拍统治每一个校庆舞台！',
    desc: '首尔女高人气最高的明星社团。日常进行女团主打曲Cover、原创编舞与走位排练，可出战首尔市街舞大赛。',
  },
  {
    id: 'band',
    name: '校园独立乐队 & 广播社 (Echo)',
    npcId: 'npc_4',
    leader: '李恩宇 (高二广播社长)',
    slogan: '午休电台的温柔声波，放学天台的摇滚回响。',
    desc: '负责全校午间广播点歌台与校园乐队演出。可培养器乐、声乐与编曲默契，参加全国高中乐队音乐节。',
  },
  {
    id: 'council',
    name: '首尔女高学生会 (白玉兰议会)',
    npcId: 'npc_8',
    leader: '尹在民 (学生会会长)',
    slogan: '执掌校园秩序、策划玫瑰学园祭的权力中枢。',
    desc: '负责全校社团经费审批、晨间风纪执勤与大型校庆统筹。出战全国高中生模拟国会与企划辩论大赛。',
  },
  {
    id: 'sports',
    name: '女子排球运动部 (Valkyrie)',
    npcId: 'npc_5',
    leader: '姜海仁 (女排王牌主攻手)',
    slogan: '只要球还没落地，我们就绝不认输！',
    desc: '热血沸腾的室内体育馆战队！通过高强度扣球、拦网与鱼跃救球集训，冲击全国高中体育联赛大赏。',
  },
];

// ==================== 2. 社团日常突发事件库 (专属弹窗触发) ====================
export const CLUB_SUDDEN_INCIDENTS: ClubSuddenIncident[] = [
  // 街舞社专属突发
  {
    id: 'ci_dance_1',
    clubId: 'dance',
    title: '排练室功放音箱突然冒烟短路！',
    tag: '⚡ 街舞社突发状况',
    sceneDesc: '距离周五的校内联合公演只剩三天，地下排练室的老旧功放音箱在放伴奏时突然“啪”地一声冒起白烟，整个房间陷入死寂，低年级部员们慌作一团。',
    options: [
      {
        text: '立刻拿自己的手机连接便携蓝牙音箱，带着大家数拍子清跳！',
        outcomeText: '你冷静沉着的控场让全队迅速安定下来！哪怕没有重低音伴奏，大家整齐划一的脚步声反而练出了前所未有的刀群舞默契！',
        effect: { clubSkill: 6, clubTeamwork: 10, clubStagePower: 5, mood: 4 },
        npcId: 'npc_6',
        favDelta: 8,
      },
      {
        text: '和千宥娜一起去学生会找尹在民紧急申请备用专业音响',
        outcomeText: '凭借你们出色的口才，尹在民当场批下了礼堂级JBL移动音箱的使用权，排练效果比之前还要震撼！',
        effect: { clubSkill: 5, social: 6, clubTeamwork: 6 },
        npcId: 'npc_8',
        favDelta: 7,
      },
      {
        text: '改为一对一镜前表情管理与Wave基本功纠错课',
        outcomeText: '因祸得福，每个人的眼神定点与肢体细节都得到了精雕细琢！',
        effect: { clubStagePower: 9, appearance: 3, danceSkill: 5 },
        npcId: 'npc_6',
        favDelta: 6,
      },
    ],
  },
  {
    id: 'ci_dance_2',
    clubId: 'dance',
    title: '隔壁汉城男高街舞社上门Battle挑衅！',
    tag: '🔥 街舞社突发状况',
    sceneDesc: '放学后排练室大门被推开，隔壁汉城高中的街舞社长带着几名主力来借场地，言语间暗讽女高舞蹈社“只会跳软绵绵的爱豆广播体操”。千宥娜眼神瞬间冷了下来。',
    options: [
      {
        text: '直接站到场地中央示意放歌，用一段高难度Popping+地板动作正面迎战！',
        outcomeText: '你干净利落的卡点与极具爆发力的Freestyle直接把对方看傻了眼，汉城男高全员心服口服地鼓掌道歉！',
        effect: { clubSkill: 8, clubStagePower: 12, social: 8, snsFollowers: 1200 },
        npcId: 'npc_6',
        favDelta: 12,
      },
      {
        text: '与千宥娜联手展示双人刀群舞同步率，用实力说话',
        outcomeText: '你们两人连发丝扬起的弧度都分毫不差，被围观同学拍下视频发到竹林墙，全校轰动！',
        effect: { clubTeamwork: 12, clubStagePower: 8, snsFollowers: 1500, mood: 8 },
        npcId: 'npc_6',
        favDelta: 10,
      },
    ],
  },

  // 乐队与广播社专属突发
  {
    id: 'ci_band_1',
    clubId: 'band',
    title: '午休全校广播麦克风忘关推子事故！',
    tag: '🎙️ 广播社突发状况',
    sceneDesc: '午休点歌节目刚放完第一首曲子，李恩宇学长正小声夸你今天的声音很好听，结果你们突然发现导播台主麦克风的推子根本没拉下来——全校三个年级36个教室全都听见了！',
    options: [
      {
        text: '顺势拿起话筒自然接梗，开启一期《学长与学妹的午间漫谈》即兴节目！',
        outcomeText: '你的机智救场让全校同学笑声一片，这期即兴广播甚至被评为本学期最受欢迎的午间栏目！',
        effect: { clubStagePower: 10, social: 8, mood: 8, vocalSkill: 4 },
        npcId: 'npc_4',
        favDelta: 12,
      },
      {
        text: '红着脸迅速切入下一首轻快摇滚乐，和学长在广播室相视憋笑',
        outcomeText: '虽然走廊里大家都在讨论刚才的“广播室粉红泡泡”，但你和恩宇学长之间的气氛变得格外微妙甜蜜。',
        effect: { clubTeamwork: 8, mood: 10 },
        npcId: 'npc_4',
        favDelta: 10,
      },
    ],
  },
  {
    id: 'ci_band_2',
    clubId: 'band',
    title: '暴雨夜地下乐队室积水抢救行动！',
    tag: '🌧️ 乐队突发状况',
    sceneDesc: '傍晚突降特大暴雨，社团大楼半地下排练室的排水口倒灌，眼看雨水就要漫过地面上的电子琴踏板、效果器与绝版黑胶唱片箱！',
    options: [
      {
        text: '果断拉下总电闸防止触电，指挥部员分工把乐器架高到桌面上！',
        outcomeText: '你教科书级的应急指挥保住了价值数百万韩元的乐队设备，学长与指导老师对你刮目相看！',
        effect: { clubTeamwork: 12, clubSkill: 7, social: 6, stamina: -6 },
        npcId: 'npc_4',
        favDelta: 10,
      },
      {
        text: '抢救完设备后，大家点着蜡烛用木吉他来一场雨夜不插电合奏',
        outcomeText: '伴着窗外的雨声，木吉他与清唱在烛光下回荡，成了整个高中最浪漫的社团记忆。',
        effect: { clubStagePower: 8, vocalSkill: 6, mood: 12 },
        npcId: 'npc_4',
        favDelta: 11,
      },
    ],
  },

  // 学生会专属突发
  {
    id: 'ci_council_1',
    clubId: 'council',
    title: '玫瑰学园祭社团预算听证会危机！',
    tag: '📋 学生会突发状况',
    sceneDesc: '在全校社团代表大会上，教务处主任以“保障升学率”为由，企图将今年玫瑰学园祭的舞台与摊位预算大幅削减50%，各社团社长情绪激动，会场乱成一锅粥。',
    options: [
      {
        text: '拿出连夜整理的《历届校园祭对高三减压及升学率正面影响数据报告》据理力争！',
        outcomeText: '详实的数据与无懈可击的逻辑彻底说服了教务主任，全额预算成功保住！全场社长起立为你鼓掌！',
        effect: { clubSkill: 10, academics: 5, social: 10, clubTeamwork: 8 },
        npcId: 'npc_8',
        favDelta: 12,
      },
      {
        text: '提议引入校外文创与餐饮品牌冠名赞助，自己解决经费缺口 (+₩30,000奖金)',
        outcomeText: '你出色的商业外联头脑不仅补上了预算，还为学生会赢取了额外活动基金！',
        effect: { clubStagePower: 8, social: 8, coins: 30000 },
        npcId: 'npc_8',
        favDelta: 9,
      },
    ],
  },

  // 排球运动部专属突发
  {
    id: 'ci_sports_1',
    clubId: 'sports',
    title: '主力二传手赛前扭伤！战术体系重组危机',
    tag: '🏐 排球部突发状况',
    sceneDesc: '距离市级联赛只剩一周，队里的首发二传手在跳发球落地时不小心踩到球扭伤了脚踝。看着场边焦急的姜海仁，球队面临无人组织进攻的困境。',
    options: [
      {
        text: '主动请缨改打二传位置，每天放学留下来和姜海仁苦练快攻配合！',
        outcomeText: '你的手指都磨出了水泡，但终于练出了与姜海仁闭着眼都能心意相通的背飞快攻！',
        effect: { clubSkill: 10, clubTeamwork: 14, stamina: -10, mood: 6 },
        npcId: 'npc_5',
        favDelta: 14,
      },
      {
        text: '陪受伤队友去宋恩静老师的校医室冰敷理疗，并重新设计防守反击阵型',
        outcomeText: '在你的悉心照料与战术调整下，全队凝聚力空前高涨！',
        effect: { clubTeamwork: 10, clubStagePower: 6, social: 6 },
        npcId: 'npc_5',
        favDelta: 10,
      },
    ],
  },
];

// ==================== 3. 社团大赛三阶段互动剧场配置 ====================
export const CLUB_TOURNAMENTS: ClubTournamentTier[] = [
  {
    id: 'tour_school',
    name: '首尔女高「白玉兰杯」校内社团竞演赛',
    levelLabel: '校级选拔赛 (初级)',
    requiredSkill: 25,
    staminaCost: 14,
    championPrize: 40000,
    runnerUpPrize: 15000,
    trophyName: '🏅 白玉兰校内竞演优胜奖牌',
    rivalSchool: '高二王牌前辈联队',
    stage1Prompt: '【第一阶段 · 赛前候场】礼堂后台人声鼎沸，高二前辈联队刚刚完成彩排，气场十足。上场前最后五分钟，你决定如何带动社团成员？',
    stage1Options: [
      {
        text: '召集全员围成圆阵击掌呐喊，点燃斗志！ (+默契与爆发)',
        bonusScore: 15,
        feedback: '大家的手掌重重叠在一起高喊口号，紧张感瞬间转化为滚烫的战意！',
        effect: { clubTeamwork: 5, mood: 5 },
      },
      {
        text: '冷静核对每一个走位与衔接细节，稳中求胜 (+精准度)',
        bonusScore: 14,
        feedback: '在你的细致叮嘱下，全员对每个卡点都胸有成竹，零失误登台！',
        effect: { clubSkill: 5 },
      },
    ],
    stage2CrisisByClub: {
      dance: {
        crisisTitle: '【赛中突发危机】副歌高潮前舞台右侧追光灯突然熄灭！',
        crisisDesc: '跳到最关键的Bridge衔接段时，礼堂右侧的追光灯突然故障熄灭，半边舞台陷入暗影，台下观众发出惊呼！',
        choices: [
          {
            text: '临危不乱！顺势做出帅气的手势引导全队向中央主光区聚拢变阵！',
            bonusScore: 22,
            feedback: '神级临场改位！紧密聚拢的队形在中央顶光下极具视觉冲击力，评委席连连点头！',
            effect: { clubStagePower: 8, danceSkill: 5 },
          },
          {
            text: '与千宥娜在明暗交界处完成高难度双人卡点Solo，化缺陷为艺术感！',
            bonusScore: 25,
            feedback: '光影交错间的双人领舞美得像MV电影镜头，全场爆发雷鸣般的尖叫！',
            effect: { clubStagePower: 10, snsFollowers: 1000 },
          },
        ],
      },
      band: {
        crisisTitle: '【赛中突发危机】主唱麦克风信号受到无线干扰出现杂音！',
        crisisDesc: '进入副歌第一句时，无线麦突然传出刺耳的电流声，节奏眼看就要被打乱！',
        choices: [
          {
            text: '立刻与李恩宇学长共用意大利立式有线麦，双人贴近和声演唱！',
            bonusScore: 24,
            feedback: '两人共用一支立麦对视合唱的画面张力拉满，台下女生尖叫声差点掀翻屋顶！',
            effect: { clubStagePower: 9, vocalSkill: 5 },
          },
          {
            text: '果断切入一段长达15秒的绚丽器乐Solo，为后台切换备用频道争取时间！',
            bonusScore: 20,
            feedback: '行云流水的器乐炫技完美掩盖了设备故障，专业度满分！',
            effect: { clubSkill: 8 },
          },
        ],
      },
      council: {
        crisisTitle: '【赛中突发危机】答辩现场投影仪PPT突然蓝屏无法播放！',
        crisisDesc: '轮到你们展示年度企划方案时，礼堂大屏幕突然蓝屏重启，评委老师皱起了眉头。',
        choices: [
          {
            text: '直接关掉投影，走下讲台用脱稿演说+手绘板书征服全场！',
            bonusScore: 24,
            feedback: '你从容自信的脱稿演讲比任何PPT都更具感染力，校长带头起立鼓掌！',
            effect: { clubStagePower: 9, academics: 4 },
          },
          {
            text: '请尹在民会长分发纸质精简手册，两人一唱一和完成双人答辩！',
            bonusScore: 22,
            feedback: '天衣无缝的双人配合展现了学生会极高的危机处理水准！',
            effect: { clubTeamwork: 9 },
          },
        ],
      },
      sports: {
        crisisTitle: '【赛中突发危机】决胜局13:14落后，对手发球擦网急坠！',
        crisisDesc: '对方发出的球擦过球网上沿垂直下落，距离前排还有两米远，眼看就要直接丢掉赛点！',
        choices: [
          {
            text: '毫不犹豫鱼跃扑救把球垫起，高喊“海仁，交给你了”！',
            bonusScore: 25,
            feedback: '你奋不顾身的鱼跃救球奇迹般将球托起，姜海仁暴扣得分追平并连得3分逆转夺冠！',
            effect: { clubTeamwork: 10, clubStagePower: 8 },
          },
          {
            text: '冷静预判手腕轻挑，打对方前排空档二次球直接得分！',
            bonusScore: 22,
            feedback: '极具灵气的二次吊球直接骗过对方所有拦网手，聪明绝顶！',
            effect: { clubSkill: 9 },
          },
        ],
      },
    },
  },
  {
    id: 'tour_seoul',
    name: '首尔市高中社团对抗联赛 (서울시 대항전)',
    levelLabel: '市级联赛 (中级)',
    requiredSkill: 50,
    staminaCost: 18,
    championPrize: 85000,
    runnerUpPrize: 35000,
    trophyName: '🏆 首尔市高中社团联赛金奖奖杯',
    rivalSchool: '江南清潭艺术高中代表队',
    stage1Prompt: '【第一阶段 · 首尔市政厅赛场】来自江南清潭高中的卫冕冠军队装备奢华，在候场区用挑剔的目光打量着你们。你将如何应对？',
    stage1Options: [
      {
        text: '微笑着与对方礼貌致意，用绝对松弛的大将之风震慑对手',
        bonusScore: 18,
        feedback: '你们毫无惧色的从容气度反而让清潭高中的选手心里没了底！',
        effect: { clubStagePower: 6, social: 5 },
      },
      {
        text: '针对清潭高中的弱点临时微调出场顺序与杀手锏段落',
        bonusScore: 20,
        feedback: '精准的田忌赛马策略让你们从开场第一秒就牢牢占据主动权！',
        effect: { clubSkill: 7 },
      },
    ],
    stage2CrisisByClub: {
      dance: {
        crisisTitle: '【赛中突发危机】地板残留上一队的亮片水渍，重心险些打滑！',
        crisisDesc: '进入最高难度的连续旋转动作时，你踩到了舞台中央一块湿滑的亮片区域！',
        choices: [
          {
            text: '借着滑势顺势化作单膝滑跪定点Ending动作，眼神杀直视镜头！',
            bonusScore: 28,
            feedback: '全场导播直接把特写切给了你！这个神来之笔的滑跪镜头当晚在Stargram破了十万赞！',
            effect: { clubStagePower: 12, cameraSkill: 8, snsFollowers: 2200 },
          },
          {
            text: '核心力量瞬间收紧稳住下盘，并用眼神提醒后排队友绕开湿滑区！',
            bonusScore: 25,
            feedback: '超强的核心控制力不仅救了自己，还保护了全队零失误完赛！',
            effect: { clubTeamwork: 10, danceSkill: 6 },
          },
        ],
      },
      band: {
        crisisTitle: '【赛中突发危机】吉他一弦在最高潮Solo前崩断！',
        crisisDesc: '全曲最燃的间奏即将来临，“铮”的一声脆响，高音弦突然断了一根！',
        choices: [
          {
            text: '立即把位置下移五个品格在二弦完成高把位改指法Solo + 高音清唱顶上！',
            bonusScore: 28,
            feedback: '极其扎实的乐理功底与穿透力十足的高音吟唱震撼了所有专业评委！',
            effect: { clubStagePower: 12, vocalSkill: 8 },
          },
          {
            text: '全员默契切入鼓点与贝斯律动，带动台下千名观众大合唱！',
            bonusScore: 25,
            feedback: '万人空巷的合唱氛围直接拉满，感染力获得了全场最高分！',
            effect: { clubTeamwork: 10, social: 8 },
          },
        ],
      },
      council: {
        crisisTitle: '【赛中突发危机】对方辩手抛出未公开的刁钻统计数据发难！',
        crisisDesc: '自由辩论环节，清潭高中一辩突然拿出一份冷门英文调研报告试图打乱你们的立论。',
        choices: [
          {
            text: '当场用流利英语指出该报告的样本偏差漏洞，并反将一军！',
            bonusScore: 28,
            feedback: '你流利的口语与犀利的逻辑反击引来评委席掌声雷动，对方哑口无言！',
            effect: { academics: 8, clubStagePower: 10 },
          },
          {
            text: '与尹在民会长配合，从民生与校园实操角度温和拆解对方论点',
            bonusScore: 25,
            feedback: '有理有据又充满人文关怀的论述赢得了全场最高票数！',
            effect: { clubTeamwork: 10, social: 6 },
          },
        ],
      },
      sports: {
        crisisTitle: '【赛中突发危机】对方针对姜海仁布置了严密的三人拦网！',
        crisisDesc: '比赛进入白热化，对手放弃边路专门三人死盯姜海仁的强攻路线！',
        choices: [
          {
            text: '假传真扣！做出传给海仁的假动作后由你自己在后排起跳暴扣！',
            bonusScore: 28,
            feedback: '精彩绝伦的后排奇袭得分！彻底撕裂了对方的三人拦网防线！',
            effect: { clubStagePower: 12, clubSkill: 8 },
          },
          {
            text: '暗号手势切换“双快一游动”战术，全员多点开花得分！',
            bonusScore: 26,
            feedback: '行云流水的团队战术配合让对手顾此失彼，强势拿下胜利！',
            effect: { clubTeamwork: 12 },
          },
        ],
      },
    },
  },
  {
    id: 'tour_national',
    name: '全韩国高中生全国总决赛 (전국 고교 총결승)',
    levelLabel: '全国总决赛 (终极荣耀)',
    requiredSkill: 72,
    staminaCost: 22,
    championPrize: 180000,
    runnerUpPrize: 75000,
    trophyName: '👑 全国高中生大赛最高总统大赏金杯',
    rivalSchool: '釜山与首尔全国四强联队',
    stage1Prompt: '【第一阶段 · 奥林匹克公园全国总决赛】KBS电视台正在全国同步直播！聚光灯下座无虚席，名门大学招生官与各大娱乐公司总监都在第一排就座。',
    stage1Options: [
      {
        text: '深吸一口气，将三年来与伙伴们流下的每一滴汗水化作享受舞台的笑容！',
        bonusScore: 24,
        feedback: '你们眼中闪烁的自信光芒透过直播镜头传遍全国，开场即封神！',
        effect: { clubStagePower: 10, mood: 10, snsFollowers: 3000 },
      },
      {
        text: '以社团最高核心的身份发表燃魂赛前宣言，全员状态突破极限！',
        bonusScore: 24,
        feedback: '全队凝聚成一个不可战胜的整体，气势直接压倒全国群雄！',
        effect: { clubTeamwork: 10, clubSkill: 8 },
      },
    ],
    stage2CrisisByClub: {
      dance: {
        crisisTitle: '【全国总决赛终极考验】高潮段临时加试 30 秒无伴奏刀群舞与个人C位Killing Part！',
        crisisDesc: '总决赛特别规则：在曲目最后30秒伴奏将全部静音，考核全团绝对节拍感与C位的终极镜头统治力！',
        choices: [
          {
            text: '以呼吸与脚步声为节拍，在静音中跳出分秒不差的神级齐舞，并在最后一秒定格绝美飞吻！',
            bonusScore: 35,
            feedback: '当音乐重新炸响时你们与节拍完美重合！全场一万名观众全体起立欢呼，创下全国大赛历史最高分纪录！',
            effect: { clubStagePower: 15, danceSkill: 10, cameraSkill: 10, snsFollowers: 6000 },
          },
        ],
      },
      band: {
        crisisTitle: '【全国总决赛终极考验】暴雨突袭露天主舞台，主办方询问是否中止演出！',
        crisisDesc: '总决赛压轴登场时天空突然飘落大雨，雨水打在舞台灯光上化作漫天光雾。',
        choices: [
          {
            text: '拒绝中止！在漫天雨幕与霓虹光束中倾情献唱原创压轴曲《十七岁的季风》！',
            bonusScore: 35,
            feedback: '雨夜神级Live现场直接封神！视频在YouTube与Naver突破百万播放，斩获全国最高金奖！',
            effect: { clubStagePower: 15, vocalSkill: 10, snsFollowers: 6000 },
          },
        ],
      },
      council: {
        crisisTitle: '【全国总决赛终极考验】最高评委临时抽签命题：如何在升学高压下守护高中生的幸福感？',
        crisisDesc: '没有准备时间，面对全国直播镜头，评委要求你在3分钟内给出直击人心的方案。',
        choices: [
          {
            text: '结合首尔女高真实经历与白玉兰互助精神，发表感人肺腑又极具可行性的演讲！',
            bonusScore: 35,
            feedback: '你的演讲让现场无数高中生与家长热泪盈眶，全票斩获全国总冠军金杯！',
            effect: { clubStagePower: 15, academics: 8, social: 12 },
          },
        ],
      },
      sports: {
        crisisTitle: '【全国总决赛终极考验】五局三胜决胜局 18:18 延长赛，全员体力接近极限！',
        crisisDesc: '经历了两个半小时的鏖战，汗水浸透了球衣，最后一球将决定全国总冠军的归属！',
        choices: [
          {
            text: '与姜海仁使出秘密演练百次的“双子星交叉闪电快攻”，一锤定音！',
            bonusScore: 35,
            feedback: '排球重重砸在对方界内地板上！哨声吹响，首尔女高时隔十年再度捧起全国制霸金杯！',
            effect: { clubStagePower: 15, clubTeamwork: 15, social: 10 },
          },
        ],
      },
    },
  },
];

// ==================== 4. 四大娱乐企划社配置 ====================
export const AGENCIES_DATA: AgencyInfo[] = [
  {
    id: 'hybe',
    name: 'HYBE 星耀娱乐 (ADOR/Source系)',
    koreanName: '하이브 스타 엔터',
    styleTag: '✨ 概念叙事 & 极致刀群舞',
    desc: '首尔龙山区地标大厂！主打清透少年感、Y2K前沿审美与高强度刀群舞同步率，出道即享全球级音源曝光。',
    weeklyStipend: 15000,
    specialty: '舞蹈(Dance)与直拍魅力成长加成 +25%',
    badgeColor: 'from-indigo-600 to-blue-500',
  },
  {
    id: 'sm',
    name: 'SM 旷野娱乐 (Kwangya Ent.)',
    koreanName: '에스엠 광야 엔터',
    styleTag: '👑 顶级高音Vocal & 神颜圣地',
    desc: '圣水洞传统豪门企划社！拥有全韩最严苛的声乐高音体系与镜头骨相美学培训，是实力派主唱与门面C位的摇篮。',
    weeklyStipend: 15000,
    specialty: '声乐(Vocal)与外形气质成长加成 +25%',
    badgeColor: 'from-pink-500 to-rose-500',
  },
  {
    id: 'yg',
    name: 'YG 黑曜娱乐 (Black Label系)',
    koreanName: '와이지 블랙 엔터',
    styleTag: '🔥 顶级Swag台风 & 唱作女王',
    desc: '合井洞潮流殿堂！不看死板套路，只看独一无二的舞台掌控力、Rap气场与时尚高级感，时尚大牌资源极佳。',
    weeklyStipend: 18000,
    specialty: '说唱台风(Rap)与练习生津贴加成 +25%',
    badgeColor: 'from-zinc-800 to-neutral-600',
  },
  {
    id: 'jyp',
    name: 'JYP 元气娱乐 (One-Top系)',
    koreanName: '제이와이피 원탑 엔터',
    styleTag: '💖 国民女团 & 满分表情管理',
    desc: '江东区有机食堂大厂！极其看重练习生的人品、健康体魄与极具感染力的舞台笑容，全韩路人盘与国民度第一。',
    weeklyStipend: 14000,
    specialty: '镜头表情管理(Camera)与体力消耗减免 +25%',
    badgeColor: 'from-emerald-500 to-teal-600',
  },
];

// ==================== 5. 练习生专属突发事件库 (专属弹窗触发) ====================
export const TRAINEE_SUDDEN_INCIDENTS: TraineeSuddenIncident[] = [
  {
    id: 'ti_weight_check',
    title: '地下练习室 · 周一突击体重秤与夜宵危机！',
    tag: '🥗 练习生突发状况',
    sceneDesc: '高强度练舞到晚上十一点，肚子饿得咕咕叫。同期练习生偷偷点了一份香喷喷的芝士辣炒年糕和炸鸡邀请你一起吃，但你突然想起明天一早室长要进行每周突击体重与体脂抽检！',
    options: [
      {
        text: '咬牙忍住诱惑！只喝一杯无糖美式配鸡胸肉沙拉，加练半小时核心普拉提！',
        outcomeText: '第二天晨检你的体脂率与马甲线状态完美过关！管理室长当众夸你是全A班最自律的标杆！',
        effect: { appearance: 5, danceSkill: 5, traineeProgress: 6, mood: -2 },
      },
      {
        text: '只吃两块年糕解馋，随后拉着同期生一起狂跳三遍倍速舞蹈消耗掉热量！',
        outcomeText: '既满足了味蕾又靠两倍速刀群舞把卡路里彻底燃尽，还顺便提升了舞蹈熟练度！',
        effect: { danceSkill: 7, mood: 6, traineeProgress: 5, stamina: -6 },
      },
    ],
  },
  {
    id: 'ti_earmonitor_sabotage',
    title: '心机暗流 · 彩排前消失的定制耳返与舞鞋！',
    tag: '⚡ 练习生突发状况',
    sceneDesc: '距离内部C位选拔彩排只剩15分钟，你回到更衣室却发现自己的白色舞鞋鞋带被人剪断，定制耳返也被塞进了杂物柜最底层——显然是有竞争对手想看你出丑。',
    options: [
      {
        text: '用备用发带死死绑紧鞋帮，盲听现场音响伴奏直接拿下一等评级！',
        outcomeText: '你在没有耳返的情况下凭借肌肉记忆与绝对音准完美控场！那个搞小动作的练习生在台下脸色煞白！',
        effect: { vocalSkill: 8, danceSkill: 6, traineeProgress: 10, mood: 6 },
      },
      {
        text: '找千宥娜借用她的专业备用耳返，并调出走廊监控让室长严肃处理违规者！',
        outcomeText: '千宥娜二话不说把自己的高定耳返借给你，违规练习生被降入C班反省，你的声望大幅提升！',
        effect: { cameraSkill: 6, social: 8, traineeProgress: 8 },
      },
    ],
  },
  {
    id: 'ti_senior_mentor',
    title: '凌晨两点的奇遇 · 顶流出道前辈的独家指点！',
    tag: '🌟 练习生稀有奇遇',
    sceneDesc: '凌晨一点半，整栋企划社大楼只剩你的3号练习室还亮着灯。门突然被推开，刚结束海外巡演回公司拿东西的顶流女团师姐走进来，饶有兴致地看完了你的练习。',
    options: [
      {
        text: '礼貌鞠躬问好，虚心请教副歌高音换气与抓镜头的黄金角度！',
        outcomeText: '师姐手把手教你如何在转头瞬间用眼神锁定红灯机位，并请全练习室喝了冰果茶！你的舞台开窍了！',
        effect: { vocalSkill: 8, cameraSkill: 10, traineeProgress: 10, mood: 12 },
      },
      {
        text: '邀请师姐一起合拍一段15秒的新歌Dance Challenge发到官方账号！',
        outcomeText: '顶流师姐带你合拍的Challenge视频一夜破百万播放，韩网都在问“旁边那个神颜未公开练习生是谁”！',
        effect: { danceSkill: 8, snsFollowers: 4500, traineeProgress: 12, appearance: 4 },
      },
    ],
  },
  {
    id: 'ti_pann_viral',
    title: '未出道先火 · 下班路生图登上韩网热帖第一！',
    tag: '📸 练习生突发热点',
    sceneDesc: '你穿着首尔女高校服背着练舞包走出企划社大门时，被蹲点的站姐随手抓拍了一张侧颜生图。当晚以《四大社新公开的神颜女高练习生》为题登上了Pann与Theqoo热帖第一名！',
    options: [
      {
        text: '通过公司官方练习生账号发布一段清唱自弹自唱视频回应期待！',
        outcomeText: '网友们惊呼“以为是花瓶结果是全能大主唱”，你的路人死忠粉瞬间暴涨！',
        effect: { vocalSkill: 6, cameraSkill: 8, snsFollowers: 3800, traineeProgress: 9 },
      },
      {
        text: '保持神秘高冷感，专注于下一次月末评价舞台用实力惊艳所有人',
        outcomeText: '企划社总监对你的沉稳心态大加赞赏，将你列入了新女团核心候选名单！',
        effect: { danceSkill: 6, rapSkill: 6, traineeProgress: 10, mood: 6 },
      },
    ],
  },
  {
    id: 'ti_vocal_bottleneck',
    title: '魔鬼声乐课 · 高音F5真假音转换突破！',
    tag: '🎵 练习生特训事件',
    sceneDesc: '声乐总教练在钢琴前连续弹了二十遍高音阶，严厉地敲着琴盖：“秀妍，不要用嗓子硬顶，用腹部核心支撑气息！再来一遍！”',
    options: [
      {
        text: '闭上眼睛沉下横膈膜，在边跳边唱的状态下飙出清亮稳定的高音F5！',
        outcomeText: '清澈透亮的高音在录音棚回荡，连一向毒舌的声乐教练都露出了满意的微笑！',
        effect: { vocalSkill: 10, traineeProgress: 7, stamina: -8 },
      },
      {
        text: '在尾音加入极具个人辨识度的R&B转音与气泡音处理',
        outcomeText: '教练惊喜地记下笔记：“这个音色太抓耳了，下次主打曲的导入Part非你莫属！”',
        effect: { vocalSkill: 7, rapSkill: 6, cameraSkill: 5, traineeProgress: 7 },
      },
    ],
  },
];

// ==================== 6. 练习生月末评价 & 选秀出道三阶段舞台配置 ====================
export const TRAINEE_EVALUATIONS: TraineeEvaluationStage[] = [
  {
    id: 'eval_monthly',
    title: '企划社月末等级评价 (월말평가 · C/B/A班晋升战)',
    subtitle: '由制作人总监、声乐与舞蹈首席导师联合坐镇的残酷月末考核',
    staminaCost: 16,
    minScoreForA: 65,
    rewardCoins: 45000,
    rewardFollowers: 2200,
    stage1Concepts: [
      {
        name: '🌸 清纯High-Teen校园风曲目',
        desc: '考验清爽元气的表情管理与少年感音色',
        statKey: 'cameraSkill',
        bonusScore: 18,
      },
      {
        name: '🔥 Girl Crush 高强度刀群舞曲目',
        desc: '考验极具爆发力的街舞卡点与Rap气场',
        statKey: 'danceSkill',
        bonusScore: 20,
      },
      {
        name: '🌙 梦幻空灵高音叙事曲目',
        desc: '考验全开麦真假音转换与稳定的气息功底',
        statKey: 'vocalSkill',
        bonusScore: 20,
      },
    ],
    stage2Crises: [
      {
        crisisTitle: '【月末评价突发】总制作人突然按下暂停键要求“关掉半开麦垫音纯清唱”！',
        crisisDesc: '唱到一半时，坐在正中央的王牌制作人突然拿起话筒：“伴奏关掉，我想听听李秀妍在剧烈喘息下的真实全开麦声音。”',
        choices: [
          {
            text: '毫不怯场！在安静的考核厅里边做完整舞蹈动作边飙出稳如CD的清唱高音！',
            bonusScore: 28,
            feedback: '全场鸦雀无声，制作人直接在评分表上画了三个A+：“这就是我找了三年的天生大主唱！”',
            effect: { vocalSkill: 8, traineeProgress: 10 },
          },
          {
            text: '顺势加入一段即兴Beatbox与抓耳Rap，将清唱变成个人炫技秀！',
            bonusScore: 26,
            feedback: '导师们纷纷露出惊艳的表情，夸赞你的舞台松弛感已经超越了现役新人！',
            effect: { rapSkill: 8, cameraSkill: 6, traineeProgress: 10 },
          },
        ],
      },
    ],
  },
  {
    id: 'eval_survival',
    title: '《PRODUCE 首尔女团》公开竞演 & 出道组卡位战',
    subtitle: '全韩全民制作人实时投票！争夺最终出道组 Center 王座！',
    staminaCost: 22,
    minScoreForA: 78,
    rewardCoins: 120000,
    rewardFollowers: 8500,
    stage1Concepts: [
      {
        name: '👑 概念评价原创曲《Crown of Rose》Center位',
        desc: '全能ACE专属曲目，集齐高音、Dance Break与绝美Ending妖精镜头',
        statKey: 'danceSkill',
        bonusScore: 25,
      },
      {
        name: '🎤 主唱定位战《初雪的回信》Killing Part',
        desc: '直击心灵的三段式高音转调，极易诞生百万收藏神级直拍',
        statKey: 'vocalSkill',
        bonusScore: 25,
      },
      {
        name: '⚡ 说唱与舞台气场战《Queendom Seoul》主Rapper',
        desc: '快嘴连击与极具侵略性的女王台风，引爆全场欢呼',
        statKey: 'rapSkill',
        bonusScore: 25,
      },
    ],
    stage2Crises: [
      {
        crisisTitle: '【直播舞台突发】干冰烟雾喷射过猛 + 摇臂摄像机突然逼近脸部特写！',
        crisisDesc: '全国直播进行到Ending前5秒，舞台喷出的干冰吹乱了你的发丝，而1号主摇臂摄像机突然推到了距离你鼻尖不到半米的位置！',
        choices: [
          {
            text: '借着烟雾微微偏头，喘息间露出一抹兼具破碎感与钓系张力的神级Wink！',
            bonusScore: 32,
            feedback: '“李秀妍绝美Ending妖精”词条5分钟内空降热搜第一！个人直拍播放量一夜突破300万，毫无悬念登顶出道组第1名 Center！',
            effect: { cameraSkill: 12, appearance: 5, traineeProgress: 15, snsFollowers: 5000 },
          },
          {
            text: '单手帅气撩起耳侧碎发，用极具穿透力的尾音高音震慑全场观众！',
            bonusScore: 30,
            feedback: '实力与美貌双重暴击！现场全民制作人投票得票数断层第一！',
            effect: { vocalSkill: 10, danceSkill: 8, traineeProgress: 15, snsFollowers: 4000 },
          },
        ],
      },
    ],
  },
];
