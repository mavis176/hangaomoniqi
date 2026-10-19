import {
  GameStats,
  NPCClassmate,
  WardrobeItem,
  RandomEvent,
  AIConfig,
  CourseSlot,
  MemoryEntry,
  SeasonType,
  WeeklyActionItem,
  RelationshipStage,
  GameEnding,
  PlayerTrait,
  InterruptEvent,
} from '../types';
import { CURATED_STORY_EVENTS } from './eventsPool';
import {
  AVATAR_SOOYEON_DEFAULT,
  AVATAR_NPC_MINYOUNG,
  AVATAR_NPC_JIYOUNG,
  AVATAR_NPC_SORA,
  AVATAR_NPC_EUNWOO,
  AVATAR_NPC_HAEIN,
  AVATAR_NPC_YUNA,
  AVATAR_NPC_JAEMIN,
  AVATAR_NPC_EUNJUNG,
} from './koreanAvatars';

export const initialStats: GameStats = {
  mood: 85,
  stamina: 90,
  academics: 74,
  social: 65,
  appearance: 78,
  family: 80,
  coins: 180000,
  allowance: 35000,
  snsFollowers: 520,
  clubId: 'dance',
  clubSkill: 35,
  clubTeamwork: 40,
  clubStagePower: 38,
  clubRank: '见习部员',
  clubTrophies: [],
  agencyId: null,
  traineeGrade: '未签约普通学生',
  traineeProgress: 0,
  isDebutedIdol: false,
  vocalSkill: 34,
  danceSkill: 38,
  rapSkill: 30,
  cameraSkill: 40,
  darkIndex: 5,
  secretUnlocked: false,
};

export const defaultAIConfig: AIConfig = {
  mode: 'builtin',
  customBaseUrl: 'https://api.openai.com/v1',
  customApiKey: '',
  customModel: 'gpt-4o-mini',
  narrativeStyle: '清新韩系、真实细腻的韩国女高青春日常',
  temperature: 0.85,
  autoTriggerEvents: true,
  playerOrientation: '不限/随心而动',
};

export const protagonistAvatar = AVATAR_SOOYEON_DEFAULT;

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const WEATHER_LIST = ['樱花微风', '晴朗暖阳', '梅雨细雨', '清爽晴空', '秋叶微凉', '初雪纷扬'];

// ==================== 2025-2027 韩国高中学制与季节时间系统 ====================
export interface WeekCalendarInfo {
  calendarYear: number; // 2025, 2026, 2027
  gradeYear: number;    // 1, 2, 3 (高1, 高2, 高3)
  weekInYear: number;   // 1 - 36
  totalWeek: number;    // 1 - 108
  month: number;        // 3 - 12, 1 - 2
  weekOfMonth: number;  // 1 - 4
  semester: string;     // "第1学期" | "暑假" | "第2学期" | "寒假"
  season: SeasonType;
  seasonName: string;
  seasonBadgeColor: string;
  weather: string;
  milestoneExam?: {
    type: 'midterm' | 'final' | 'mock' | 'csat';
    title: string;
    desc: string;
  };
  specialActivity?: string;
}

export function getWeekCalendarInfo(gradeYear: number, weekInYear: number): WeekCalendarInfo {
  const clampedYear = Math.max(1, Math.min(3, gradeYear));
  const clampedWeek = Math.max(1, Math.min(36, weekInYear));
  const calendarYear = 2024 + clampedYear + (clampedWeek >= 33 ? 1 : 0);

  // Korean school year starts in March (3 weeks per month across 12 months = 36 weeks/year)
  const monthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
  const monthIdx = Math.min(11, Math.floor((clampedWeek - 1) / 3));
  const month = monthOrder[monthIdx];
  const weekOfMonth = ((clampedWeek - 1) % 3) + 1;

  let season: SeasonType = 'cherry_blossom';
  let seasonName = '🌸 樱花季';
  let seasonBadgeColor = 'bg-pink-500/80 text-white';
  let weather = '樱花微风';
  let semester = '第1学期';

  if (month === 3 || month === 4) {
    season = 'cherry_blossom';
    seasonName = '🌸 春日樱花季';
    seasonBadgeColor = 'bg-rose-400 text-white';
    weather = month === 3 ? '樱花微风' : '春日暖阳';
    semester = '第1学期';
  } else if (month === 5) {
    season = 'early_summer';
    seasonName = '🌿 初夏修学季';
    seasonBadgeColor = 'bg-emerald-600 text-white';
    weather = '清爽晴空';
    semester = '第1学期';
  } else if (month === 6 || month === 7) {
    season = 'rainy_season';
    seasonName = '🌧️ 首尔梅雨季';
    seasonBadgeColor = 'bg-sky-600 text-white';
    weather = '梅雨微雨';
    semester = '第1学期';
  } else if (month === 8) {
    season = 'summer_vacation';
    seasonName = '🏖️ 盛夏暑假';
    seasonBadgeColor = 'bg-amber-500 text-white';
    weather = '盛夏骄阳';
    semester = '暑假集训期';
  } else if (month === 9 || month === 10) {
    season = 'autumn_festival';
    seasonName = '🍁 秋季校园祭';
    seasonBadgeColor = 'bg-orange-600 text-white';
    weather = '秋高气爽';
    semester = '第2学期';
  } else if (month === 11 || month === 12) {
    season = 'first_snow';
    seasonName = '❄️ 初雪与大考季';
    seasonBadgeColor = 'bg-indigo-500 text-white';
    weather = month === 12 ? '初雪纷扬' : '深秋微凉';
    semester = '第2学期';
  } else {
    season = 'winter_vacation';
    seasonName = '🧣 寒假与新岁';
    seasonBadgeColor = 'bg-slate-600 text-white';
    weather = '冬日暖阳';
    semester = '寒假休整期';
  }

  // Academic Exams & Seasonal Milestones
  let milestoneExam: WeekCalendarInfo['milestoneExam'] = undefined;
  let specialActivity: string | undefined = undefined;

  if (clampedWeek === 1) specialActivity = '新学年开学典礼 & 社团招新周';
  if (clampedWeek === 3) specialActivity = '汝矣岛樱花季踏青周';
  if (clampedWeek === 6) {
    milestoneExam = {
      type: 'midterm',
      title: `高${clampedYear} · 第一学期期中考试 (중간고사)`,
      desc: '检验前半学期内申等级的重要大考，直接影响家庭关系与每周零花钱！',
    };
  }
  if (clampedWeek === 9) {
    specialActivity = clampedYear === 2 ? '济州岛三天两夜修学旅行 (수학여행)' : '春季全校体育运动会';
  }
  if (clampedWeek === 12) {
    milestoneExam = {
      type: 'mock',
      title: `6月全国联合学力评价 (6월 모의고사)`,
      desc: '全韩国高中生同步参加的全国模考，评测你的百分位与大学志愿竞争力。',
    };
  }
  if (clampedWeek === 15) {
    milestoneExam = {
      type: 'final',
      title: `高${clampedYear} · 第一学期期末考试 (기말고사)`,
      desc: '决定第一学期最终内申等级（1~9等级）的期末统考。',
    };
  }
  if (clampedWeek === 17) specialActivity = '暑假大峙洞特训 & 汉江露营季';
  if (clampedWeek === 21) {
    milestoneExam = {
      type: 'mock',
      title: `9月教育课程评价院模考 (9월 모평)`,
      desc: '下半年最重要的全国风向标模拟考试。',
    };
  }
  if (clampedWeek === 24) {
    milestoneExam = {
      type: 'midterm',
      title: `高${clampedYear} · 第二学期期中考试`,
      desc: '秋季学期期中统考，影响升学履历评价。',
    };
  }
  if (clampedWeek === 26) specialActivity = '首尔女高玫瑰校园祭 (학교 축제) 舞台周';
  if (clampedWeek === 29) {
    if (clampedYear === 3) {
      milestoneExam = {
        type: 'csat',
        title: `2027学年度 CSAT 韩国大学修学能力试验 (수능 · 高考)`,
        desc: '三年高中生涯的终极决战！全韩国静音护航，决定你的大学与人生去向！',
      };
    } else {
      milestoneExam = {
        type: 'mock',
        title: `11月全国联合学力评价 (11월 모의고사)`,
        desc: '年度最后一次全国统考模拟测试。',
      };
    }
  }
  if (clampedWeek === 32) specialActivity = '首尔初雪许愿日 (첫눈) & 圣诞狂欢';
  if (clampedWeek === 34 && clampedYear < 3) {
    milestoneExam = {
      type: 'final',
      title: `高${clampedYear} · 第二学期期末考试`,
      desc: '本学年收官期末考试，考完即可迎接寒假与升年级！',
    };
  }
  if (clampedWeek === 36) {
    specialActivity = clampedYear === 3 ? '🎓 首尔女子高中三年毕业典礼 (结局判定周)' : `高${clampedYear}学年结业式`;
  }

  return {
    calendarYear,
    gradeYear: clampedYear,
    weekInYear: clampedWeek,
    totalWeek: (clampedYear - 1) * 36 + clampedWeek,
    month,
    weekOfMonth,
    semester,
    season,
    seasonName,
    seasonBadgeColor,
    weather,
    milestoneExam,
    specialActivity,
  };
}

// ==================== 行动回合制：每周可选行动池 (7大类别) ====================
export const WEEKLY_ACTIONS: WeeklyActionItem[] = [
  // 1. 学习类
  {
    id: 'act_study_class',
    name: '课堂专注与内申笔记',
    category: 'study',
    categoryLabel: '学习',
    icon: '📖',
    staminaCost: 14,
    desc: '认真消化本周校内课程并整理康奈尔笔记，稳步提升内申成绩。',
    effect: { academics: 5, family: 2, mood: -2 },
  },
  {
    id: 'act_study_daechi',
    name: '大峙洞名师补习班特训',
    category: 'study',
    categoryLabel: '学习',
    icon: '🏛️',
    staminaCost: 20,
    desc: '乘地铁前往江南大峙洞学院攻克CSAT压轴题（消耗 ₩15,000 学费）。',
    effect: { academics: 9, coins: -15000, mood: -4, family: 3, darkIndex: 2 },
  },
  {
    id: 'act_study_library',
    name: '深夜24h读书室刷题',
    category: 'study',
    categoryLabel: '学习',
    icon: '🕯️',
    staminaCost: 16,
    desc: '在安静的独立隔间刷历年全国联考模拟卷，性价比较高。',
    effect: { academics: 6, mood: -3, darkIndex: 1 },
  },

  // 2. 社团类
  {
    id: 'act_club_practice',
    name: '社团常规训练与合练',
    category: 'club',
    categoryLabel: '社团',
    icon: '🎵',
    staminaCost: 14,
    desc: '参加所属社团（舞蹈/乐队/学生会/排球）的放学排练，提升社团贡献与人气。',
    effect: { clubSkill: 8, social: 4, mood: 5, appearance: 2 },
  },
  {
    id: 'act_club_competition',
    name: '筹备社团公演与校际联赛',
    category: 'club',
    categoryLabel: '社团',
    icon: '🏆',
    staminaCost: 18,
    desc: '全力备战高中社团大赛与公演舞台，积累练习生星途与社团声望。',
    effect: { clubSkill: 12, traineeProgress: 8, social: 6, snsFollowers: 800, mood: 6 },
  },

  // 3. 运动类
  {
    id: 'act_sport_run',
    name: '汉江公园夜跑与拉伸',
    category: 'exercise',
    categoryLabel: '运动',
    icon: '🏃‍♀️',
    staminaCost: 8,
    desc: '吹着汉江晚风慢跑5公里，不仅强健体魄还能舒缓备考焦虑。',
    effect: { appearance: 4, mood: 8, darkIndex: -5 },
  },
  {
    id: 'act_sport_pilates',
    name: '清潭洞体态普拉提课',
    category: 'exercise',
    categoryLabel: '运动',
    icon: '🧘‍♀️',
    staminaCost: 10,
    desc: '矫正仪态与肩颈线条，显著提升气质外形与镜头表现力（-₩12,000）。',
    effect: { appearance: 7, traineeProgress: 5, mood: 6, coins: -12000 },
  },

  // 4. 社交与SNS类
  {
    id: 'act_social_hongdae',
    name: '弘大/圣水洞探店约会',
    category: 'social',
    categoryLabel: '社交',
    icon: '🧋',
    staminaCost: 10,
    desc: '和同学去潮流街区拍人生四格、吃甜品，提升社交声望与心情（-₩8,000）。',
    effect: { social: 8, mood: 10, appearance: 3, snsFollowers: 600, coins: -8000, darkIndex: -4 },
  },
  {
    id: 'act_social_sns',
    name: '经营Stargram与拍摄Vlog',
    category: 'social',
    categoryLabel: '社交',
    icon: '📸',
    staminaCost: 12,
    desc: '精心修图上传本周OOTD穿搭与校园Vlog，快速吸引全网粉丝关注！',
    effect: { snsFollowers: 2400, social: 6, appearance: 4, mood: 6, traineeProgress: 4 },
  },

  // 5. 打工兼职类
  {
    id: 'act_work_cu',
    name: 'CU便利店周末兼职',
    category: 'parttime',
    categoryLabel: '打工',
    icon: '🏪',
    staminaCost: 16,
    desc: '在街角便利店扫码收银、整理三角紫菜包饭货架，赚取稳定时薪。',
    effect: { coins: 42000, social: 3, mood: -3 },
  },
  {
    id: 'act_work_cafe',
    name: '延南洞网红咖啡馆兼职',
    category: 'parttime',
    categoryLabel: '打工',
    icon: '☕',
    staminaCost: 15,
    desc: '身穿围裙学习手冲咖啡与拉花，高颜值店员还能偶遇星探或涨粉！',
    effect: { coins: 48000, appearance: 3, snsFollowers: 500, traineeProgress: 3 },
  },
  {
    id: 'act_work_model',
    name: '东大门/圣水洞网店穿搭模特',
    category: 'parttime',
    categoryLabel: '打工',
    icon: '👗',
    staminaCost: 18,
    desc: '为少女服饰品牌拍摄Lookbook画报，丰厚报酬且大幅提升外形与星途！',
    effect: { coins: 75000, appearance: 6, snsFollowers: 1800, traineeProgress: 10 },
  },

  // 6. 家庭互动类
  {
    id: 'act_family_dinner',
    name: '陪父母温馨家宴与谈心',
    category: 'family',
    categoryLabel: '家庭',
    icon: '🍲',
    staminaCost: 4,
    desc: '帮妈妈准备韩式大酱汤，和父母聊聊学校趣事，修复家庭关系并缓解压力。',
    effect: { family: 10, mood: 9, stamina: 10, darkIndex: -8, allowance: 3000 },
  },

  // 7. 休息恢复类
  {
    id: 'act_rest_sleep',
    name: '周末睡懒觉与居家SPA',
    category: 'rest',
    categoryLabel: '休息',
    icon: '🛌',
    staminaCost: -45, // Negative cost = restores 45 stamina!
    desc: '关掉闹钟睡到自然醒，敷一张补水面膜听雨声，大幅恢复体力与心情。',
    effect: { stamina: 45, mood: 14, appearance: 2, darkIndex: -10 },
  },
  {
    id: 'act_rest_jjimjilbang',
    name: '龙山韩式汗蒸房(찜질방)放松',
    category: 'rest',
    categoryLabel: '休息',
    icon: '♨️',
    staminaCost: -55,
    desc: '戴着羊角毛巾喝甜米露、吃烤鸡蛋，彻底洗去一周的疲惫（-₩10,000）。',
    effect: { stamina: 55, mood: 18, family: 4, coins: -10000, darkIndex: -12 },
  },
];

// ==================== 全向性感情线与 8 名核心可攻略 NPC ====================
export function computeRelationshipStage(
  favorability: number,
  romancePoints: number,
  orientation: NPCClassmate['orientation'],
  role: NPCClassmate['role']
): RelationshipStage {
  if (favorability < 25) return '陌生';
  if (favorability < 45) return '相识';
  if (favorability < 68) return '朋友';

  // Platonic / Mentor / Asexual natural progression
  if (orientation.includes('无性恋') || role === '老师或职员') {
    if (favorability >= 85) return '灵魂伴侣';
    return '挚友';
  }

  // Omnidirectional Romantic or Best Friend natural progression (no forced confession!)
  if (favorability >= 86 && romancePoints >= 45) {
    return '恋人';
  }
  if (favorability >= 72 && romancePoints >= 25) {
    return '暧昧';
  }
  if (favorability >= 88 && romancePoints < 25) {
    return '灵魂伴侣';
  }
  return '挚友';
}

export const initialNPCs: NPCClassmate[] = [
  {
    id: 'npc_1',
    chineseName: '朴敏英',
    koreanName: '박민영',
    role: '同班同学',
    gender: 'female',
    orientation: '双性恋',
    relationshipStage: '挚友',
    favorability: 78,
    romancePoints: 22,
    mbti: 'INFP 治愈系同桌',
    interests: ['纯爱校园条漫连载', '草莓甜品品鉴', '水彩手帐贴纸', '文具小店打卡'],
    nicknameToPlayer: "小秀妍",
    speakingStyle: "温柔软萌、同桌闺蜜感、爱用草莓甜品比喻与感叹词、情绪价值拉满、语气亲昵随和",
    forbiddenWords: ["请问有什么可以帮您", "我非常乐意", "好的呢", "作为人工智能", "很高兴为您", "尊敬的顾客"],
    attitudeByAffection: {"low": "稍微有点害羞拘谨，客气有礼，说话温声细语保持社交界限。", "mid": "主动塞给你草莓软糖，分享私下偷偷画的漫画草稿，拉着你吐槽老师和考试。", "high": "对你毫无保留地依恋，遇到难过的事第一时间紧紧贴着你，还会对你和其他同学走得太近而偷偷吃醋。"},
    speechStyle: '温柔软萌、同桌闺蜜感、爱用感叹词与甜品比喻、情绪价值拉满',
    memoryKeywords: ['开学第一天同桌', '草莓软糖秘密', 'Webtoon条漫连载', '济州岛毕业看海约定'],
    avatar: AVATAR_NPC_MINYOUNG,
    status: '坐在邻桌把刚画好的少女漫草稿悄悄给你看',
    description: '高一(1)班的邻座青梅，性格温柔细腻、重情重义，抽屉里永远给你留着草莓软糖。',
    dislikedTraits: ['敷衍冷漠', '居高临下的说教'],
    likedGifts: ['草莓大福礼盒', '樱花手写信', '专业漫画针管笔'],
    secret: '以笔名“Miny”在Naver Webtoon匿名连载超人气纯爱条漫，却因害怕父母反对而不敢公开。',
    storyStage: 1,
    memories: [
      '2025年3月开学第一天，主动帮秀妍搬新教材并成为了形影不离的同桌。',
      '约定好高三毕业那天要一起去济州岛看海。',
    ],
  },
  {
    id: 'npc_2',
    chineseName: '崔智英',
    koreanName: '최지영',
    role: '同班同学',
    gender: 'female',
    orientation: '双性恋',
    relationshipStage: '朋友',
    favorability: 55,
    romancePoints: 16,
    mbti: 'ESFP 元气气氛组',
    interests: ['圣水洞网红探店', '人生四格拍贴收藏', '美妆与美甲穿搭', 'K-Pop新歌随舞打卡'],
    nicknameToPlayer: "秀妍宝",
    speakingStyle: "超级自来熟高亢元气、满屏波浪号与感叹号、爱用圣水洞流行语、八卦雷达秒回",
    forbiddenWords: ["您好", "请问有什么可以帮您", "非常抱歉", "谨遵指令", "作为AI"],
    attitudeByAffection: {"low": "自来熟打招呼，热情推荐圣水洞彩妆，但还没把你拉进核心闺蜜圈。", "mid": "天天拉着你拍人生四格、抢OliveYoung新品、吐槽东大门进货的搞怪日常。", "high": "认定你是她全宇宙第一好的神仙闺蜜，随时为你冲锋陷阵，有任何好事第一个想到你。"},
    speechStyle: '超级活泼自来熟、满屏感叹号与爱心、热衷分享第一手校园八卦',
    memoryKeywords: ['圣水洞人生四格拍贴', '校门口辣年糕打卡', '八卦雷达秒回'],
    avatar: AVATAR_NPC_JIYOUNG,
    status: '正在课间补涂OliveYoung爆款水光唇釉',
    description: '高一(1)班的时尚情报站与八卦小雷达，元气满满、自来熟，最喜欢拉着你自拍打卡。',
    dislikedTraits: ['不合群扫兴', '背后嚼舌根'],
    likedGifts: ['限定水光唇釉', '彩色拍立得相纸', '马卡龙礼盒'],
    secret: '其实家里是做东大门服装批发的，虽然表面大手大脚，但放学后经常偷偷去帮家里打包衣服。',
    storyStage: 1,
    memories: [
      '开学第一周在圣水洞自拍馆偶遇秀妍，两人拼桌拍了一整套人生四格照片。',
    ],
  },
  {
    id: 'npc_3',
    chineseName: '韩素拉',
    koreanName: '한소라',
    role: '补习班同学',
    gender: 'female',
    orientation: '无性恋/智性恋',
    relationshipStage: '相识',
    favorability: 42,
    romancePoints: 15,
    mbti: 'INTJ 清冷极客学霸',
    interests: ['CSAT大考压轴真题破解', '精萃无糖冰美式', '德系极简钢笔手感', '神经科学与认知心理学'],
    nicknameToPlayer: "喂",
    speakingStyle: "清冷从容、句式简短严密、嘴硬心软、高冷傲娇语气、经常用轻哼或反问句",
    forbiddenWords: ["亲爱的", "太棒啦~", "请问有什么可以帮您", "作为AI", "好的呢", "宝贝"],
    attitudeByAffection: {"low": "眼神高冷看真题，淡淡说\"请不要在我刷题时发出噪音\"。", "mid": "傲娇挑刺\"这道题你居然做错了\"，却顺手在你草稿纸上画好辅助线并推给你半杯冰美式。", "high": "彻底卸下冷漠伪装，深夜自习室靠在你肩膀上流露脆弱，拉着你的袖子低声要求你留在她视野里。"},
    speechStyle: '清冷从容、逻辑严密、嘴硬心软、偶尔露出微红傲娇的小情绪',
    memoryKeywords: ['大峙洞分班考并列第一', '冰美式复盘', '深夜自习室并肩刷题', '专属几何辅助线'],
    avatar: AVATAR_NPC_SORA,
    status: '在大峙洞第一排座位拿着冰美式刷CSAT真题',
    description: '全校不动如山的第一名、大峙洞王牌补习班同桌。外表高冷傲娇，实则极其看重唯一能与她并肩的你。',
    dislikedTraits: ['不守时', '半途而废'],
    likedGifts: ['手冲无糖冰美式', '德国限量钢笔', '安神洋甘菊香薰'],
    secret: '江南财阀医生家庭出身，母亲的极端完美主义让她患有严重的考前失眠与胃痛，只有在你身边才能安稳入睡。',
    storyStage: 1,
    memories: [
      '在大峙洞补习班分班考中与秀妍并列第一，第一次正眼记住了秀妍的名字。',
    ],
  },
  {
    id: 'npc_4',
    chineseName: '李恩宇',
    koreanName: '이은우',
    role: '社团前辈',
    gender: 'male',
    orientation: '双性恋',
    relationshipStage: '朋友',
    favorability: 60,
    romancePoints: 20,
    mbti: 'ENFJ 治愈白月光',
    interests: ['木吉他弹唱与即兴编曲', '校园广播站午间电台', '黑胶唱片淘碟', '胶片相机记录日常'],
    nicknameToPlayer: "秀妍学妹",
    speakingStyle: "如春风般清润舒缓、充满广播电台DJ质感的温润语气、礼貌体贴又有深情含蓄感",
    forbiddenWords: ["作为AI", "好的，亲", "系统提示", "请问您有什么需要", "客服"],
    attitudeByAffection: {"low": "温和有礼的社团学长，保持着优雅适度的社交距离。", "mid": "在广播室为你预留专属点歌时间，下雨天为你撑伞，分享他珍藏的雨声钢琴磁带。", "high": "眼神里满是掩饰不住的温柔与独占欲，为你弹奏专属编曲，低声坦白他的音乐只为你而响。"},
    speechStyle: '如春风般清润温和、体贴细致、句式舒缓有礼、善于倾听与给予安心感',
    memoryKeywords: ['广播室点播专属吉他曲', '雨声钢琴磁带书签', '汉江樱花树下约定', '温麦茶'],
    avatar: AVATAR_NPC_EUNWOO,
    status: '在广播室戴着监听耳机为你预留午间点歌时间',
    description: '高二广播社社长兼校园独立乐队吉他手，声线如春风般温和清朗，全校公认的白月光学长。',
    dislikedTraits: ['恶意八卦', '破坏乐器'],
    likedGifts: ['复古黑胶唱片', '润喉蜂蜜柚子茶', '胶片相机胶卷'],
    secret: '曾因突发性耳鸣差点告别舞台，是你写给广播室的匿名鼓励卡让他重拾了吉他。',
    storyStage: 1,
    memories: [
      '社团招新周在广播室送给秀妍一枚录有雨声与钢琴曲的磁带书签。',
    ],
  },
  {
    id: 'npc_5',
    chineseName: '姜海仁',
    koreanName: '강해인',
    role: '运动部成员',
    gender: 'female',
    orientation: '同性恋',
    relationshipStage: '朋友',
    favorability: 58,
    romancePoints: 24,
    mbti: 'ESTP 直球运动系王牌',
    interests: ['女排大力跳发与扣球', '汉江夜骑单车', '探访校门口炸鸡年糕店', '球鞋与运动护腕收藏'],
    nicknameToPlayer: "小秀妍",
    speakingStyle: "直球爽朗、大声欢笑、护短坦率、干脆利落不拖泥带水、被夸奖时罕见结巴脸红",
    forbiddenWords: ["恕我不能", "请问有什么可以帮您", "作为AI", "客套话", "好的呢"],
    attitudeByAffection: {"low": "单手转着排球，大大咧咧招呼\"新来的？跟紧点别受伤\"。", "mid": "排球测试时帅气垫球解围，一把拉过你披上运动外套\"以后体育课我罩你\"。", "high": "护短到极致，谁让你受委屈她直接开怼，被你温柔看着时会害羞得满脸通红。"},
    speechStyle: '飒爽直球、坦率护短、大声欢笑、喜欢身体力行护着秀妍、被夸时罕见脸红',
    memoryKeywords: ['排球测试垫球解围', '体育课我罩你', '运动外套披肩', '冰镇宝矿力特饮'],
    avatar: AVATAR_NPC_HAEIN,
    status: '在体育馆扣球得分后朝着场边的你帅气比耶',
    description: '校女排部王牌主攻手，飒爽狼尾短发、直球坦率的运动系少女，全校女生收到情书最多的人气王。',
    dislikedTraits: ['拐弯抹角', '欺软怕硬'],
    likedGifts: ['冰镇宝矿力特饮', '专业运动护腕', '韩牛能量便当'],
    secret: '父亲早逝，她拼命训练争夺全国大赛MVP是为了拿到全额体育特长生奖学金，减轻母亲开小餐馆的负担。',
    storyStage: 1,
    memories: [
      '体育课排球测试时主动帮秀妍垫球解围，帅气地笑着说“以后体育课我罩你”。',
    ],
  },
  {
    id: 'npc_6',
    chineseName: '千宥娜',
    koreanName: '천유나',
    role: '转学生',
    gender: 'female',
    orientation: '双性恋',
    relationshipStage: '相识',
    favorability: 45,
    romancePoints: 18,
    mbti: 'ISFP 舞台艺术家/前C位',
    interests: ['高难度K-Pop舞蹈编创', '美式街头复古穿搭', '小众独立R&B黑胶', '天台晚风吹风听歌'],
    nicknameToPlayer: "李秀妍",
    speakingStyle: "微哑冷艳、说话极简直击要害、酷妹气场、洛杉矶街头感、私下对秀妍偏心保护",
    forbiddenWords: ["好的呢", "为您服务", "请问有什么可以帮您", "作为AI", "亲"],
    attitudeByAffection: {"low": "戴着降噪耳机在天台练舞，眼神微冷\"借过，别打扰我\"。", "mid": "摘下一侧耳机塞进你耳朵里，分享未公开R&B黑胶，冷酷为你挡掉刺探隐私的骚扰。", "high": "在你面前化为软刺，主动贴着你颈窝流露退社与洛杉矶的伤痕，将你视为唯一心灵避风港。"},
    speechStyle: '微哑冷艳、说话简练直击要害、不随波逐流、私下对秀妍极其偏心与护短',
    memoryKeywords: ['转学第一天递课表', '天台共享降噪耳机', '未公开R&B曲', '四大社解约秘密'],
    avatar: AVATAR_NPC_YUNA,
    status: '靠在天台栏杆上戴着降噪耳机练舞',
    description: '从洛杉矶转学而来的冷艳混血感少女，穿搭时尚、气场强大，举手投足间有着顶级爱豆的舞台功底。',
    dislikedTraits: ['刺探隐私的狗仔行为', '虚假抱团'],
    likedGifts: ['小众木质调香水', '定制耳返保护壳', '低卡抹茶巴斯克'],
    secret: '原本是四大企划社预备出道女团的皇族C位，因替被霸凌的队友发声而主动解约退社，渴望真正的舞台与真心。',
    storyStage: 1,
    memories: [
      '转学第一天拒绝了所有人的搭讪，却唯独接过了秀妍递来的新课表。',
    ],
  },
  {
    id: 'npc_8',
    chineseName: '尹在民',
    koreanName: '윤재민',
    role: '学生会成员',
    gender: 'male',
    orientation: '异性恋',
    relationshipStage: '相识',
    favorability: 48,
    romancePoints: 16,
    mbti: 'ISTJ 铁面风纪会长',
    interests: ['校园章程与活动企划', '学校后山喂养流浪小猫', '逻辑辩论与法学条文', '金丝眼镜与西装领带整理'],
    nicknameToPlayer: "李秀妍同学",
    speakingStyle: "克制严谨、一板一眼、原则性极强、用规章制度说话，但句尾总是强行破例纵容你",
    forbiddenWords: ["亲爱的", "萌萌哒", "作为AI", "为您效劳", "好哒"],
    attitudeByAffection: {"low": "推了推金丝眼镜，严肃扣分\"李秀妍同学，请严格遵守校规\"。", "mid": "叹气说\"这次算帮学生会搬资料破例，下不为例\"，放学后偷偷带你去看他喂流浪猫。", "high": "对你彻底无可救药地偏袒破例，在会议上公然袒护你，金丝眼镜后的眼神沉溺而失控。"},
    speechStyle: '克制严谨、一板一眼、原则性极强、但在秀妍面前总是屡屡破例暗中纵容',
    memoryKeywords: ['执勤免除扣分', '后山流浪猫秘密基地', '金丝眼镜下破例', '学生会校园祭方案'],
    avatar: AVATAR_NPC_JAEMIN,
    status: '戴着金丝眼镜在校门口执勤登记考勤',
    description: '学生会会长兼风纪委员长，金丝眼镜配一丝不苟的校服领带，看似铁面无私，唯独对你屡次破例。',
    dislikedTraits: ['无故逃课', '乱丢垃圾'],
    likedGifts: ['伯爵红茶礼盒', '尹东柱诗集精装版', '手工猫薄荷玩具'],
    secret: '表面是冷酷的铁血会长，实际上每天放学都会在学校后山偷偷喂养五只流浪小猫，并给每只猫起了名字。',
    storyStage: 1,
    memories: [
      '晨间执勤抓到踩点进校门的秀妍，最后却以“帮学生会搬资料”为由免除了扣分。',
    ],
  },
  {
    id: 'npc_7',
    chineseName: '宋恩静',
    koreanName: '송은정',
    role: '老师或职员',
    gender: 'female',
    orientation: '温暖守护(无性恋)',
    relationshipStage: '朋友',
    favorability: 65,
    romancePoints: 0,
    mbti: 'INFJ 知性温暖引路人',
    interests: ['草本洋甘菊茶调配', '近代散文诗集阅读', '学生心理健康倾听', '干花压花明信片制作'],
    nicknameToPlayer: "秀妍",
    speakingStyle: "知性优雅、语调温和从容、充满哲理与包容、像长姐兼避风港般给予无条件接纳",
    forbiddenWords: ["好的呢", "作为AI", "请问有什么可以帮您", "萌萌哒"],
    attitudeByAffection: {"low": "递上温热洋甘菊茶，温柔提醒\"身体不舒服随时可以在校医室休息\"。", "mid": "听你倾诉学业与青春烦恼，用哲理抚平焦虑，为你借阅白玉兰文学笔记。", "high": "毫无保留地对你敞开过往的挣扎与希望，永远是你最值得信赖的避风港与人生引路人。"},
    speechStyle: '知性优雅、语调温和从容、充满哲思与包容、像避风港一样给予无条件接纳',
    memoryKeywords: ['洋甘菊温茶倾听', '白玉兰十年前秘密', '成绩单外的人生', '治愈小说借阅'],
    avatar: AVATAR_NPC_EUNJUNG,
    status: '在校医室整理药箱，为你泡好了温热的洋甘菊茶',
    description: '26岁的知性校医兼文学社指导老师，首尔女高传奇毕业生，总是温柔地接住每一个疲惫学生的眼泪。',
    dislikedTraits: ['熬夜透支身体', '自我放弃'],
    likedGifts: ['大吉岭茶包', '乳木果护手霜', '干花压花书签'],
    secret: '十年前曾是首尔女高白玉兰秘密互助计划的受助生，放弃首尔大医院高薪回到母校，只为守护像当年自己一样的女孩们。',
    storyStage: 1,
    memories: [
      '在秀妍第一次因备考头晕去校医室时，温柔地告诉她“成绩单之外的人生同样辽阔”。',
    ],
  },
];

// ==================== 5大分类服装与外形系统 ====================
export const initialWardrobe: WardrobeItem[] = [
  // 1. 校服 (uniform)
  {
    id: 'w_uni_1',
    name: '首尔女高经典西装校服',
    type: 'uniform',
    appearanceBonus: 0,
    socialBonus: 0,
    price: 0,
    owned: true,
    equipped: true,
    desc: '深藏青修身西装外套配酒红领结与灰格百褶裙，端庄大方。',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_uni_2',
    name: '春日奶油色V领针织开衫校服',
    type: 'uniform',
    appearanceBonus: 8,
    socialBonus: 5,
    price: 58000,
    owned: false,
    equipped: false,
    desc: '樱花季最受欢迎的软糯米白学院风针织衫，温柔初恋感拉满。',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_uni_3',
    name: '韩系爱豆打歌舞台改良百褶装',
    type: 'uniform',
    appearanceBonus: 15,
    socialBonus: 10,
    price: 128000,
    owned: false,
    equipped: false,
    desc: '高腰显腿长的清潭洞高定版型校服，SNS拍照涨粉效率提升30%！',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300',
  },

  // 2. 发型 (hair)
  {
    id: 'w_hair_1',
    name: '清纯氧感八字刘海黑长直',
    type: 'hair',
    appearanceBonus: 4,
    socialBonus: 2,
    price: 0,
    owned: true,
    equipped: true,
    desc: '自然柔顺的韩系女高原生黑长发，干净清透。',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_hair_2',
    name: '江南沙龙级慵懒水波纹卷发',
    type: 'hair',
    appearanceBonus: 12,
    socialBonus: 8,
    price: 95000,
    owned: false,
    equipped: false,
    desc: '清潭洞星级造型室同款法式水波纹，走在2楼走廊回头率200%。',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  },

  // 3. 鞋子 (shoes)
  {
    id: 'w_shoe_1',
    name: '经典白色帆布室内鞋',
    type: 'shoes',
    appearanceBonus: 2,
    socialBonus: 0,
    price: 0,
    owned: true,
    equipped: true,
    desc: '轻便透气的高中标准室内鞋（실내화）。',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_shoe_2',
    name: '复古英伦厚底玛丽珍小皮鞋',
    type: 'shoes',
    appearanceBonus: 9,
    socialBonus: 6,
    price: 65000,
    owned: false,
    equipped: false,
    desc: '搭配白色中筒堆堆袜，修饰小腿线条的韩系穿搭神器。',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300',
  },

  // 4. 配饰 (accessory)
  {
    id: 'w_acc_1',
    name: '银丝书卷气细框平光镜',
    type: 'accessory',
    appearanceBonus: 6,
    socialBonus: 4,
    price: 38000,
    owned: false,
    equipped: false,
    desc: '兼具大峙洞智性学霸感与清冷氛围的轻盈银框眼镜。',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_acc_2',
    name: '复古头戴式银色蓝牙耳机',
    type: 'accessory',
    appearanceBonus: 10,
    socialBonus: 8,
    price: 88000,
    owned: false,
    equipped: false,
    desc: '挂在脖子上或戴着听歌都超有Y2K千禧潮流感。',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300',
  },

  // 5. 妆容 (makeup)
  {
    id: 'w_mk_1',
    name: '伪素颜透明防晒润唇妆',
    type: 'makeup',
    appearanceBonus: 3,
    socialBonus: 2,
    price: 0,
    owned: true,
    equipped: true,
    desc: '不会被风纪委员扣分的自然好气色润唇膏。',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'w_mk_2',
    name: 'OliveYoung爆款水光蜜桃果汁妆',
    type: 'makeup',
    appearanceBonus: 11,
    socialBonus: 9,
    price: 52000,
    owned: false,
    equipped: false,
    desc: '清透水光气垫配冰糖水蜜桃镜面唇釉，清纯甜美度爆表！',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300',
  },
];

// ==================== 13+ 多结局完整图鉴与判定系统 ====================
export const ALL_ENDINGS: GameEnding[] = [
  {
    id: 'end_13_true',
    code: 'TRUE ENDING · 13',
    title: '隐藏真结局：奇迹的十七岁 · 白玉兰之冠',
    koreanTitle: '기적의 열일곱, 백목련의 왕관',
    category: '✨ 传说隐藏真结局',
    badgeColor: 'from-amber-400 via-rose-400 to-purple-600',
    conditionDesc: '解锁旧校舍档案室秘密 + 学业≥88 + 社交≥80 + 家庭≥80 + 至少1名NPC达到恋人/灵魂伴侣',
    summary: '你不仅以全国顶尖成绩考入首尔大学，更重启了尘封十年的白玉兰互助基金，改写了所有挚友与恋人的命运。',
    epilogue: '2028年春，汝矣岛的樱花再次盛开。你作为首尔女高百年校史最耀眼的毕业生站在演讲台上，台下坐着为你骄傲的父母、成功出版漫画的朴敏英、摆脱母亲高压阴影的韩素拉、站在舞台中央的千宥娜与李恩宇……你在高中三年播下的每一颗善良与努力的种子，都长成了参天繁花。',
  },
  {
    id: 'end_01_sky',
    code: 'ENDING · 01',
    title: '高考名校结局：SKY名门金榜神话',
    koreanTitle: '서울대 합격 · 대치동의 신화',
    category: '🎓 学业巅峰结局',
    badgeColor: 'from-blue-600 to-indigo-800',
    conditionDesc: 'CSAT高考/学业属性 ≥ 88 且 暗黑值 < 60',
    summary: '历经无数个大峙洞读书室的深夜，你在CSAT高考中斩获全科1等级，收到首尔大学（SNU）录取通知书！',
    epilogue: '查分那天早晨，妈妈看着电脑屏幕上的“合格（합격）”二字喜极而泣。冠岳山下的首尔大学正门前，你穿着学士服回望高中三年的厚厚错题本，所有的汗水都化作了通往最高学府的阶梯。',
  },
  {
    id: 'end_04_idol',
    code: 'ENDING · 04',
    title: '练习生/艺人结局：五代女团Center闪耀出道',
    koreanTitle: '아이돌 데뷔 · 무대 위의 주인공',
    category: '🌟 星途璀璨结局',
    badgeColor: 'from-pink-500 to-rose-600',
    conditionDesc: '练习生选拔进度 ≥ 75 且 外形 ≥ 85',
    summary: '你通过了大型企划社严苛的月末评价，在毕业前夕作为现象级新女团的绝对C位正式出道！',
    epilogue: '《人气歌谣》初一位安可舞台上，漫天彩带飘落。你握着麦克风望向观众席，首尔女高1-1班的同学们正举着写有“李秀妍”名字的应援手幅为你呐喊。属于你的时代才刚刚开始！',
  },
  {
    id: 'end_10_sns',
    code: 'ENDING · 10',
    title: 'SNS网红结局：百万粉圣水洞潮流Icon',
    koreanTitle: '메가 인플루언서 · 트렌드 아이콘',
    category: '📱 社交网络结局',
    badgeColor: 'from-fuchsia-500 to-purple-600',
    conditionDesc: 'Stargram粉丝数 ≥ 30,000 且 外形 ≥ 82',
    summary: '你的Stargram账号成为全韩女高生的穿搭圣经，十八岁便创立了个人独立设计潮牌工作室！',
    epilogue: '首尔时装周的前排看秀席上，闪光灯追随着你的身影。你用镜头记录下的高中青春日常不仅温暖了数十万粉丝，也让你在二十岁前就实现了财务自由与审美理想。',
  },
  {
    id: 'end_05_club',
    code: 'ENDING · 05',
    title: '社团明星结局：全国高中大赛金奖制霸',
    koreanTitle: '전국 동아리 대상 · 청춘의 레전드',
    category: '🏆 社团荣耀结局',
    badgeColor: 'from-amber-500 to-orange-600',
    conditionDesc: '社团熟练度 ≥ 85 且 社交 ≥ 75',
    summary: '你带领社团斩获全韩国高中生艺术/体育全国大赛最高金奖，获得名门大学特长生免试保送资格！',
    epilogue: '当金色的奖杯高高举起，全社团成员哭着拥抱在一起。你在社团活动室留下的训词与照片被永远陈列在首尔女高荣誉室的正中央。',
  },
  {
    id: 'end_06_romance',
    code: 'ENDING · 06',
    title: '恋爱结局：初雪下的第二颗纽扣约定',
    koreanTitle: '첫눈의 약속 · 우리의 봄날',
    category: '💕 唯美全向恋爱结局',
    badgeColor: 'from-rose-400 to-pink-600',
    conditionDesc: '任意可攻略NPC达到【恋人】或满好感【灵魂伴侣】阶段',
    summary: '跨越三年的四季流转，你在毕业典礼飘落的雪花中与最心爱的人十指紧扣，迈向共同的未来。',
    epilogue: '不论性别与世俗定义，你们在十七岁最纯粹的时光里认出了彼此的灵魂。毕业照定格的瞬间，对方在耳畔轻声许下承诺：“以后的每一个四季，我都陪你一起走。”',
  },
  {
    id: 'end_09_popular',
    code: 'ENDING · 09',
    title: '校园人气王结局：首尔女高风云传奇',
    koreanTitle: '학교의 전설 · 모두의 주인공',
    category: '👑 校园声望结局',
    badgeColor: 'from-yellow-500 to-amber-600',
    conditionDesc: '社交属性 ≥ 88 且 心情 ≥ 80',
    summary: '从高一到高三，你是全校最受欢迎的风云人物，作为全体毕业生代表登台发表毕业致辞！',
    epilogue: '毕业典礼那天，你的课桌被学妹们送来的鲜花、礼物和纪念册堆成了小山。走在熟悉的2楼走廊上，每一个迎面走来的人都在向你微笑挥手。',
  },
  {
    id: 'end_08_family',
    code: 'ENDING · 08',
    title: '家庭和解结局：屋檐下的暖光与全家福',
    koreanTitle: '가족의 화해 · 따뜻한 우리 집',
    category: '🏡 温情家庭结局',
    badgeColor: 'from-emerald-500 to-teal-700',
    conditionDesc: '家庭关系 ≥ 90 且 学业 ≥ 65',
    summary: '你用真诚与成熟化解了父母之间的紧绷与焦虑，让家重新变回了最温暖的避风港。',
    epilogue: '毕业当天，父母手挽着手捧着一大束向日葵出现在校门口。照相机快门按下的那一刻，你们一家三口的笑容比春日的阳光还要灿烂。',
  },
  {
    id: 'end_02_uni',
    code: 'ENDING · 02',
    title: '普通大学结局：惠化洞大学路的浪漫青春',
    koreanTitle: '인서울 대학생 · 설레는 캠퍼스 라이프',
    category: '🏫 青春升学结局',
    badgeColor: 'from-sky-500 to-blue-600',
    conditionDesc: '学业属性 65 ~ 87 之间',
    summary: '你顺利考入首尔圈四年制本科大学，即将开启充满联谊、社团与自由气息的大学校园生活！',
    epilogue: '脱下穿了三年的高中校服，换上轻便的大学春装。站在大学路梧桐树下，你喝着冰美式，满怀期待地推开了十九岁的大门。',
  },
  {
    id: 'end_03_career',
    code: 'ENDING · 03',
    title: '专科/就业结局：弘大独立工作室主理人',
    koreanTitle: '독립 커리어 · 나만의 길을 걷다',
    category: '💼 独立就业结局',
    badgeColor: 'from-teal-500 to-cyan-700',
    conditionDesc: '学业 < 65 且 金币 ≥ 250,000',
    summary: '你不走唯学历论的独木桥，凭借高中积累的兼职经验与第一桶金，毕业即成为独立买手/美妆师！',
    epilogue: '当同龄人还在为学分烦恼时，你在弘大延南洞的小店已经排起了长队。你用双手证明了人生的标准答案不止一种。',
  },
  {
    id: 'end_12_transfer',
    code: 'ENDING · 12',
    title: '转校结局：飞往异国海岸的交换生航班',
    koreanTitle: '해외 유학 · 새로운 하늘 아래서',
    category: '✈️ 远行新篇结局',
    badgeColor: 'from-cyan-500 to-indigo-500',
    conditionDesc: '可在结局判定面板随时选择办理海外转学/留学申请（需金币 ≥ 150,000）',
    summary: '你告别了首尔内卷的升学考场，背上画板与行囊登上仁川机场的国际航班，前往更广阔的世界深造。',
    epilogue: '仁川机场T2航站楼里，好友们赶来为你送行。飞机穿过云层升向蔚蓝高空，你在舷窗边翻开纪念册，带着首尔女高的祝福奔向远方。',
  },
  {
    id: 'end_07_lonely',
    code: 'ENDING · 07',
    title: '孤独结局：独自盛开在旷野的野花',
    koreanTitle: '홀로 피어난 들꽃 · 고독한 여행자',
    category: '🌙 独行者结局',
    badgeColor: 'from-slate-500 to-slate-700',
    conditionDesc: '社交 < 45 且 所有NPC好感度均 < 65',
    summary: '三年来你始终与热闹的人群保持着距离，毕业那天独自背上双肩包，踏上了环游半岛的绿皮火车。',
    epilogue: '江陵海边的冬日车站空无一人，海浪拍打着防波堤。虽然没有盛大的告别，但你终于拥有了完完全全属于自己的宁静自由。',
  },
  {
    id: 'end_11_dark',
    code: 'ENDING · 11',
    title: '暗黑结局：失控考场与深渊回响',
    koreanTitle: '무너진 유리성 · 어둠 속의 메아리',
    category: '🖤 暗黑警戒结局',
    badgeColor: 'from-zinc-800 to-red-950',
    conditionDesc: '暗黑压力值 ≥ 70 或 (心情 ≤ 20 且 家庭 ≤ 30)',
    summary: '无休止的排名压迫与家庭冷战最终压垮了紧绷的神经，你在那个雨夜撕碎了模拟考卷。',
    epilogue: '散落的试卷如雪片般飘落在大峙洞冰冷的柏油路上。当你再次醒来时，看着天花板刺眼的白光，决定彻底告别过去那个为了别人眼光而活的木偶。',
  },
];

export function evaluateGameEnding(
  stats: GameStats,
  npcs: NPCClassmate[],
  forceTransfer?: boolean
): { primaryEnding: GameEnding; loverNpc?: NPCClassmate } {
  if (forceTransfer) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_12_transfer')! };
  }

  const topNpc = [...npcs].sort((a, b) => b.favorability + b.romancePoints - (a.favorability + a.romancePoints))[0];
  const hasLoverOrSoulmate = npcs.some(
    (n) => n.relationshipStage === '恋人' || n.relationshipStage === '灵魂伴侣' || n.favorability >= 88
  );

  // 13. Hidden True Ending
  if (
    stats.secretUnlocked &&
    stats.academics >= 86 &&
    stats.social >= 78 &&
    stats.family >= 78 &&
    hasLoverOrSoulmate
  ) {
    return { primaryEnding: ALL_ENDINGS[0], loverNpc: topNpc };
  }

  // 11. Dark Ending
  if (stats.darkIndex >= 70 || (stats.mood <= 20 && stats.family <= 30)) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_11_dark')! };
  }

  // 4. Idol Debut Ending
  if (stats.traineeProgress >= 75 && stats.appearance >= 82) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_04_idol')!, loverNpc: topNpc };
  }

  // 10. SNS Influencer Ending
  if (stats.snsFollowers >= 25000 && stats.appearance >= 80) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_10_sns')!, loverNpc: topNpc };
  }

  // 5. Club Legend Ending
  if (stats.clubSkill >= 85 && stats.social >= 72) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_05_club')!, loverNpc: topNpc };
  }

  // 1. SKY Top University Ending
  if (stats.academics >= 88) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_01_sky')!, loverNpc: topNpc };
  }

  // 6. Romance Ending
  if (hasLoverOrSoulmate && topNpc.favorability >= 86) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_06_romance')!, loverNpc: topNpc };
  }

  // 9. Campus Popularity Queen
  if (stats.social >= 86 && stats.mood >= 75) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_09_popular')!, loverNpc: topNpc };
  }

  // 8. Family Reconciliation
  if (stats.family >= 88 && stats.academics >= 65) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_08_family')! };
  }

  // 7. Lonely Ending
  if (stats.social < 45 && npcs.every((n) => n.favorability < 65)) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_07_lonely')! };
  }

  // 2. Standard University Ending
  if (stats.academics >= 65) {
    return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_02_uni')!, loverNpc: topNpc };
  }

  // 3. Independent Career / Vocational Ending
  return { primaryEnding: ALL_ENDINGS.find((e) => e.id === 'end_03_career')! };
}

// ==================== Legacy & Daily Compatibility Helpers ====================
export const WEEKLY_TIMETABLE: Record<number, CourseSlot[]> = {
  0: [
    { periodNumber: 1, startMinutes: 510, endMinutes: 555, timeLabel: '08:30-09:15', subject: '国语文学', teacher: '金美京 老师', room: '1-1 教室' },
    { periodNumber: 2, startMinutes: 565, endMinutes: 610, timeLabel: '09:25-10:10', subject: '数学课 (代数)', teacher: '朴度贤 老师', room: '1-1 教室' },
    { periodNumber: 3, startMinutes: 620, endMinutes: 665, timeLabel: '10:20-11:05', subject: '英语会话', teacher: 'Sarah 老师', room: '语言室' },
    { periodNumber: 4, startMinutes: 675, endMinutes: 720, timeLabel: '11:15-12:00', subject: '韩国近现代史', teacher: '李敏浩 老师', room: '1-1 教室' },
    { periodNumber: 5, startMinutes: 790, endMinutes: 835, timeLabel: '13:10-13:55', subject: '科学探究', teacher: '郑秀晶 老师', room: '理科实验室' },
    { periodNumber: 6, startMinutes: 845, endMinutes: 890, timeLabel: '14:05-14:50', subject: '社团与选修', teacher: '宋恩静 老师', room: '社团活动楼' },
  ],
  1: [
    { periodNumber: 1, startMinutes: 510, endMinutes: 555, timeLabel: '08:30-09:15', subject: '数学 II', teacher: '朴度贤 老师', room: '1-1 教室' },
    { periodNumber: 2, startMinutes: 565, endMinutes: 610, timeLabel: '09:25-10:10', subject: '英语精读', teacher: 'Sarah 老师', room: '1-1 教室' },
    { periodNumber: 3, startMinutes: 620, endMinutes: 665, timeLabel: '10:20-11:05', subject: '物理探究', teacher: '韩东勋 老师', room: '物理室' },
    { periodNumber: 4, startMinutes: 675, endMinutes: 720, timeLabel: '11:15-12:00', subject: '国语写作', teacher: '金美京 老师', room: '1-1 教室' },
    { periodNumber: 5, startMinutes: 790, endMinutes: 835, timeLabel: '13:10-13:55', subject: '体育课 (排球)', teacher: '姜泰宇 老师', room: '室内体育馆' },
    { periodNumber: 6, startMinutes: 845, endMinutes: 890, timeLabel: '14:05-14:50', subject: '美术与设计', teacher: '尹善雅 老师', room: '美术室' },
  ],
  2: [
    { periodNumber: 1, startMinutes: 510, endMinutes: 555, timeLabel: '08:30-09:15', subject: '英语听力', teacher: 'Sarah 老师', room: '1-1 教室' },
    { periodNumber: 2, startMinutes: 565, endMinutes: 610, timeLabel: '09:25-10:10', subject: '数学课', teacher: '朴度贤 老师', room: '1-1 教室' },
    { periodNumber: 3, startMinutes: 620, endMinutes: 665, timeLabel: '10:20-11:05', subject: '生物科学', teacher: '郑秀晶 老师', room: '生物室' },
    { periodNumber: 4, startMinutes: 675, endMinutes: 720, timeLabel: '11:15-12:00', subject: '第二外语', teacher: '佐藤 老师', room: '1-1 教室' },
    { periodNumber: 5, startMinutes: 790, endMinutes: 835, timeLabel: '13:10-13:55', subject: '社会与文化', teacher: '李敏浩 老师', room: '1-1 教室' },
    { periodNumber: 6, startMinutes: 845, endMinutes: 890, timeLabel: '14:05-14:50', subject: '社团联合活动', teacher: '学生会指导', room: '社团活动楼' },
  ],
  3: [
    { periodNumber: 1, startMinutes: 510, endMinutes: 555, timeLabel: '08:30-09:15', subject: '国语古文', teacher: '金美京 老师', room: '1-1 教室' },
    { periodNumber: 2, startMinutes: 565, endMinutes: 610, timeLabel: '09:25-10:10', subject: '化学实验', teacher: '郑秀晶 老师', room: '理科实验室' },
    { periodNumber: 3, startMinutes: 620, endMinutes: 665, timeLabel: '10:20-11:05', subject: '数学 II', teacher: '朴度贤 老师', room: '1-1 教室' },
    { periodNumber: 4, startMinutes: 675, endMinutes: 720, timeLabel: '11:15-12:00', subject: '英语会话', teacher: 'Sarah 老师', room: '1-1 教室' },
    { periodNumber: 5, startMinutes: 790, endMinutes: 835, timeLabel: '13:10-13:55', subject: '韩国地理', teacher: '李敏浩 老师', room: '1-1 教室' },
    { periodNumber: 6, startMinutes: 845, endMinutes: 890, timeLabel: '14:05-14:50', subject: '生涯升学指导', teacher: '宋恩静 老师', room: '1-1 教室' },
  ],
  4: [
    { periodNumber: 1, startMinutes: 510, endMinutes: 555, timeLabel: '08:30-09:15', subject: 'CSAT模拟周测', teacher: '朴度贤 老师', room: '1-1 教室' },
    { periodNumber: 2, startMinutes: 565, endMinutes: 610, timeLabel: '09:25-10:10', subject: '英语阅读', teacher: 'Sarah 老师', room: '1-1 教室' },
    { periodNumber: 3, startMinutes: 620, endMinutes: 665, timeLabel: '10:20-11:05', subject: '韩国近现代史', teacher: '李敏浩 老师', room: '1-1 教室' },
    { periodNumber: 4, startMinutes: 675, endMinutes: 720, timeLabel: '11:15-12:00', subject: '体育课', teacher: '姜泰宇 老师', room: '操场/体育馆' },
    { periodNumber: 5, startMinutes: 790, endMinutes: 835, timeLabel: '13:10-13:55', subject: '国语现代诗', teacher: '金美京 老师', room: '1-1 教室' },
    { periodNumber: 6, startMinutes: 845, endMinutes: 890, timeLabel: '14:05-14:50', subject: '周末班会与大扫除', teacher: '金美京 老师', room: '1-1 教室' },
  ],
};

export function formatClock(minutes: number): string {
  const clamped = Math.max(0, Math.min(1439, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getCalendarDateString(dayCount: number, clockMinutes: number) {
  const gradeYear = Math.min(3, Math.floor((dayCount - 1) / 36) + 1);
  const weekInYear = ((dayCount - 1) % 36) + 1;
  const info = getWeekCalendarInfo(gradeYear, weekInYear);
  const weekdayIndex = (dayCount - 1) % 5;
  const weekdayName = WEEKDAYS[weekdayIndex];
  const clockStr = formatClock(clockMinutes);
  return {
    month: info.month,
    date: info.weekOfMonth * 7,
    weekdayIndex,
    weekdayName,
    clockStr,
    fullLabel: `${info.calendarYear}年${info.month}月 第${info.weekOfMonth}周 (高${gradeYear}·第${weekInYear}周)`,
  };
}

export function getDynamicScheduleInfo(dayCount: number, clockMinutes: number) {
  const gradeYear = Math.min(3, Math.floor((dayCount - 1) / 36) + 1);
  const weekInYear = ((dayCount - 1) % 36) + 1;
  const info = getWeekCalendarInfo(gradeYear, weekInYear);
  const clockStr = formatClock(clockMinutes);

  return {
    headerTitle: `${info.calendarYear}年${info.month}月 · 第${weekInYear}周`,
    clockStr,
    prevRowLabel: `${info.semester} · ${info.seasonName}`,
    nextRowTime: info.milestoneExam ? '本周重点大考' : '本周校园焦点',
    nextRowSubject: info.milestoneExam
      ? info.milestoneExam.title
      : info.specialActivity || '安排本周行动回合 (学习/社团/兼职/约会)',
    quickActionText: '推进下一周行动回合',
    quickActionBonus: '+周常成长 & 零花钱',
    quickActionType: 'study' as const,
    advanceMinutes: 60,
  };
}

export function getDynamicNpcStatus(npcId: string, _clockMinutes: number, _weekdayIndex: number): string {
  const npc = initialNPCs.find((n) => n.id === npcId);
  return npc?.status || '在校园里度过充实的一周';
}

export const locationScenes: Record<
  string,
  {
    name: string;
    floorBadge: string;
    bgUrl: string;
    ambience: string;
  }
> = {
  '2楼走廊': {
    name: '2楼走廊',
    floorBadge: '2F',
    bgUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1600',
    ambience: '阳光透过走廊高窗洒在水磨石地面上，高一到高三的同学们正穿梭在教室与社团之间。',
  },
  '1-1 教室': {
    name: '1-1 教室',
    floorBadge: '1F',
    bgUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600',
    ambience: '黑板上写着距离CSAT高考的倒计时，课桌上堆着EBS模拟考卷与草莓牛奶。',
  },
  '学校食堂': {
    name: '学校食堂',
    floorBadge: 'B1',
    bgUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1600',
    ambience: '空气中弥漫着韩式辣炒年糕、芝士猪排与海带汤的香气。',
  },
  '安静图书馆': {
    name: '安静图书馆',
    floorBadge: '3F',
    bgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=1600',
    ambience: '原木书架间洒满午后暖阳，旧校舍档案室的入口也隐藏在书架尽头。',
  },
  '大峙洞补习街': {
    name: '大峙洞补习街',
    floorBadge: '江南',
    bgUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1600',
    ambience: '首尔江南区灯火通明的补习学院街，无数学子在这里为SKY名校挑灯夜战。',
  },
  '弘大/圣水洞': {
    name: '弘大/圣水洞',
    floorBadge: '街区',
    bgUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1600',
    ambience: '遍布独立咖啡厅、人生四格自拍馆与街头K-Pop路演的青春潮流圣地。',
  },
};

export const initialMemories: MemoryEntry[] = [
  {
    id: 'mem_init_1',
    dateStr: '2025年3月 第1周',
    npcId: 'npc_1',
    summary: '2025年春樱盛开之际升入首尔女子高中高一(1)班，开启为期三年的高中青春物语。',
    category: 'life',
  },
  {
    id: 'mem_init_2',
    dateStr: '2025年3月 第1周',
    npcId: 'npc_3',
    summary: '在入学摸底考与大峙洞特训班中结识了全校第一的韩素拉，被她视为头号劲敌。',
    category: 'exam',
  },
];

export const randomEvents: RandomEvent[] = CURATED_STORY_EVENTS;

// ==================== 情境特质库 (Traits) ====================
export const PREDEFINED_PLAYER_TRAITS: PlayerTrait[] = [
  {
    id: 'trait_balanced_master',
    name: '平衡调控大师',
    icon: '🧘',
    desc: '周日常规划极为科学均衡，兼顾学习、练习、社交与充沛休整。',
    effectDesc: '体力消耗 -15%，暗黑压力增长 -30%，判定爆发率提升',
    category: 'positive',
  },
  {
    id: 'trait_lone_wolf',
    name: '练习室独行侠',
    icon: '🐺',
    desc: '长期独自疯狂扎根练习室与读书室，习惯独来独往冲刺。',
    effectDesc: '个人单项训练收益 +15%，但团队配合度评价 -20%',
    category: 'neutral',
  },
  {
    id: 'trait_ambience_maker',
    name: '气氛组担当',
    icon: '🌸',
    desc: '首尔女高交际花，走到哪里都能把氛围拉满。',
    effectDesc: 'NPC好感度与粉丝增幅 +25%，考核失误时容易被宽容力保',
    category: 'positive',
  },
  {
    id: 'trait_daechi_involution',
    name: '大峙洞卷王',
    icon: '🏛️',
    desc: '高强度疯狂刷题备考，眼中只有全校内申第一。',
    effectDesc: '所有考试卷面分 +12%，但容易引发专注倦怠',
    category: 'neutral',
  },
  {
    id: 'trait_epiphany_star',
    name: '顿悟灵感体质',
    icon: '✨',
    desc: '极具艺术与情感敏锐度，擅长在低谷与高压中自我悟道突破。',
    effectDesc: '顿悟暴击概率 +35%，触发顿悟时直接获得爆破级双倍加成',
    category: 'special',
  },
];

// ==================== 7天日程推进中：突发打断事件库 (Interrupts) ====================
export const PREDEFINED_INTERRUPT_EVENTS: InterruptEvent[] = [
  {
    id: 'interrupt_friend_cry',
    dayIndex: 2, // 周三
    dayName: '周三',
    title: '🚨 突发事件：同桌朴敏英在楼道悄悄抽泣',
    category: 'bond',
    npcId: 'npc_1',
    npcName: '朴敏英',
    npcAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    story: '周三午后，你在走廊拐角看到同桌朴敏英一个人低着头抹眼泪，桌上散落着刚发下来的模拟试卷。她声音微颤：“秀妍，我最近真的好累，感觉怎么复习都达不到父母的期待……”',
    choiceStick: {
      label: '【坚守原计划】递上纸巾后按原定行程离开',
      resultDesc: '敏英收下纸巾默默点了点头。你按原计划完成了行程，但心里隐隐有些挂念。',
      effect: { mood: -2 },
    },
    choiceHandle: {
      label: '【推掉今天安排】买草莓牛奶去天台倾听并开导她',
      resultDesc: '你们在阳光洒落的天台上聊了很久，敏英重拾笑容！不仅收获了深刻羁绊，还解锁了新特质！',
      effect: { mood: 12, social: 8 },
      npcFavDelta: 15,
      unlockedTrait: PREDEFINED_PLAYER_TRAITS[2], // 气氛组担当
    },
  },
  {
    id: 'interrupt_trainee_inspection',
    dayIndex: 3, // 周四
    dayName: '周四',
    title: '👑 突发选拔：K-Pop社长/导师突击检查练习室',
    category: 'trainee',
    npcId: 'npc_6',
    npcName: '千宥娜',
    npcAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    story: '企划社导师突然来到练习室查岗：“今天的个人直拍表现力考核提前！所有人立刻准备全开麦展现最强状态！”',
    choiceStick: {
      label: '【坚守原计划】向导师请假，按原计划离开',
      resultDesc: '导师对你中途离场略显遗憾，认为你错失了一次绝佳展现机会。',
      effect: { traineeProgress: -2 },
    },
    choiceHandle: {
      label: '【推掉今天安排】立刻换舞鞋登台全开麦震撼开唱！',
      resultDesc: '你凭借惊艳的镜头管理与爆破力直拍震撼全场！导师当场夸赞你的敬业与大心脏姿态！',
      effect: { traineeProgress: 10, cameraSkill: 8, snsFollowers: 1200 },
      unlockedTrait: PREDEFINED_PLAYER_TRAITS[4], // 顿悟灵感体质
    },
  },
  {
    id: 'interrupt_rooftop_epiphany',
    dayIndex: 4, // 周五
    dayName: '周五',
    title: '🎸 突发奇遇：天台上传来清冷的吉他独奏',
    category: 'rare',
    npcId: 'npc_3',
    npcName: '韩素拉',
    npcAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    story: '放学时分，你在天台遇到对着晚霞试音的韩素拉。晚风吹动她的发丝，微光落落。她看向你：“要听听我刚写完的主歌旋律吗？”',
    choiceStick: {
      label: '【坚守原计划】打个招呼后按原计划离开学校',
      resultDesc: '原计划按时完成，但错过了与素拉分享晚霞音符的浪漫契机。',
      effect: {},
    },
    choiceHandle: {
      label: '【推掉今天安排】并肩坐在天台台阶上倾听与和声',
      resultDesc: '晚霞将天空染成紫粉色，你们的声音在天空中完美重叠！你瞬间触发了【艺术顿悟】！',
      effect: { clubSkill: 12, vocalSkill: 10, mood: 15 },
      npcFavDelta: 16,
      unlockedTrait: PREDEFINED_PLAYER_TRAITS[4], // 顿悟灵感体质
    },
  },
  {
    id: 'interrupt_teacher_inspection',
    dayIndex: 1, // 周二
    dayName: '周二',
    title: '🔍 突发查岗：风纪纪律检查与走廊巡视',
    category: 'teacher',
    story: '班主任与教导主任正在各班级走廊检查校服着装与课堂纪律，看到有同学正在私下分发小吃。',
    choiceStick: {
      label: '【坚守原计划】保持肃静端坐，按原计划完成学习任务',
      resultDesc: '获得了教导主任的肯定眼神，学业秩序井然。',
      effect: { academics: 3 },
    },
    choiceHandle: {
      label: '【推掉今天安排】上前用提问吸引老师注意力打掩护',
      resultDesc: '成功化解尴尬！班上同学对你的侠义与机智佩服不已！',
      effect: { social: 8, mood: 6 },
      unlockedTrait: PREDEFINED_PLAYER_TRAITS[2], // 气氛组担当
    },
  },
];
