import {
  IdolCareerState,
  UniversityCareerState,
  ChaebolWifeState,
  LifePathProgress,
} from '../types';

export const initialIdolCareerState: IdolCareerState = {
  debutGroupName: 'ECLIPSE-9 (日蚀少女)',
  agencyName: 'HYBE Labels (ADOR厂牌)',
  debutRole: '全能 ACE 兼门面 C 位',
  fansCount: 1850000,
  melonChartIndex: 92,
  liveSkill: 86,
  cfValueScore: 84,
  mentalStress: 25,
  scandalIndex: 8,
  albums: [
    {
      id: 'alb_debut',
      title: '《FIRST ECLIPSE : 觉醒》',
      concept: '清冷神秘 Girl Crush',
      salesFirstWeek: 780000,
      melonPeakRank: 1,
      musicShowWins: 7,
      reviewScore: '韩网音源榜与日榜双破纪录，全开麦消音直拍封神',
    },
  ],
  worldToursDone: 0,
  currentBrandCF: 'CHANEL 香奈儿全球品牌形象大使',
  historyLogs: [
    '首尔女子高中毕业典礼次日，以主打曲《First Eclipse》正式出道，直拍单日破千万播放！',
  ],
};

export const initialUniversityCareerState: UniversityCareerState = {
  universityName: '首尔大学 (SNU)',
  major: '法学院 · 法学学士 (Pre-Law)',
  gpa: 4.18,
  yearLevel: 1,
  careerStage: 'student',
  currentJobTitle: '首尔大学在读法学系高材生',
  annualSalaryKRW: 0,
  careerPrestige: 78,
  marriageStatus: 'single',
  spouseName: undefined,
  spouseRole: undefined,
  childCount: 0,
  childName: undefined,
  childTalentScore: 0,
  familyHappiness: 90,
  historyLogs: [
    '以全校第一名顶尖考神姿态跨入冠岳山首尔大学校门，开启璀璨名校学涯！',
  ],
};

export const initialChaebolWifeState: ChaebolWifeState = {
  conglomerateName: '大韩泛进星光集团 (Shin Kwang Group)',
  spouseTitle: '集团战略企划室本部长 · 家族第三代继承人',
  spouseName: '姜泰贤',
  skinCareBeauty: 93,
  luxuryPrestige: 88,
  privateTrustWealthBillions: 180, // 180亿韩元专属信托
  socialiteRank: '初入豪门的新媳妇',
  familyControlPower: 45,
  heirStage: '早教精英',
  heirGrowthScore: 80,
  ownedLuxuryItems: [
    '爱马仕 喜马拉雅鳄鱼皮 Birkin 30',
    '梵克雅宝 顶级祖母绿高级珠宝项链',
    '汉南洞江景顶层 400平豪宅私密空中花园',
  ],
  charityBanquetsHosted: 1,
  historyLogs: [
    '汉南洞世纪名门婚礼！李秀妍以耀眼倾城之姿嫁入顶级财阀，成为豪门少奶奶。',
  ],
};

export const initialLifePathProgress: LifePathProgress = {
  currentPath: null,
  idol: initialIdolCareerState,
  university: initialUniversityCareerState,
  chaebol: initialChaebolWifeState,
  activePathUnlocked: false,
};

// Available elite career progressions in University Path
export const UNIVERSITY_CAREER_TRACKS = [
  {
    id: 'prosecutor',
    name: '首尔中央地方检察厅 · 首席女检察官',
    category: '司法政界',
    annualSalary: 160000000,
    desc: '身披黑色检察官袍，刚正不阿侦办重特大财阀政商案件，被称为“正义之剑”。',
    icon: '⚖️',
  },
  {
    id: 'lawyer',
    name: '金&张 顶级律师事务所 · 资深高级合伙人',
    category: '顶尖律所',
    annualSalary: 380000000,
    desc: '掌控数千亿跨国商业并购与跨国仲裁，清潭洞私人办公室俯瞰汉江。',
    icon: '💼',
  },
  {
    id: 'professor',
    name: '首尔大学法学院 · 终身正教授',
    category: '名门学术',
    annualSalary: 140000000,
    desc: '主持国家级法治研究课题，桃李满天下，受邀作为青瓦台法制智囊。',
    icon: '🎓',
  },
  {
    id: 'investment_banker',
    name: '高盛韩国分部 · 董事总经理 (MD)',
    category: '金融华尔街',
    annualSalary: 520000000,
    desc: '操盘百亿美元国际资本运作，出入汝矣岛与江南金融中心。',
    icon: '📈',
  },
  {
    id: 'news_anchor',
    name: 'KBS 黄金9点档 · 首席国宝级女主播',
    category: '传媒国家队',
    annualSalary: 210000000,
    desc: '全国收视率榜首，睿智、优雅、国民信任度第一的新闻面孔。',
    icon: '🎙️',
  },
];

// Potential Marriage Partners for University / Life Path
export const POTENTIAL_SPOUSE_OPTIONS = [
  {
    id: 'eunwoo',
    name: '李恩宇',
    role: '高中年级第一 · 现首尔大学医学院博士/外科医生',
    desc: '曾经的高中同桌与温柔守护者，白大褂下的深情与无微不至的宠爱。',
    tag: '青梅竹马 / 顶级医圣',
  },
  {
    id: 'jaemin',
    name: '尹在民',
    role: '高中学生会长 · 现执政党最年轻国会议员候选人',
    desc: '沉稳克制、深谋远虑，携手你在韩国精英社交圈叱咤风云。',
    tag: '权力伴侣 / 政坛新星',
  },
  {
    id: 'sora',
    name: '韩素拉',
    role: '高中神仙知己 · 现韩国顶级新锐独立策展人/艺术家',
    desc: '灵魂共振的至深羁绊，在私人艺术庄园中与你共度诗意浪漫岁月。',
    tag: '灵魂伴侣 / 浪漫不渝',
  },
  {
    id: 'haein',
    name: '姜海仁',
    role: '高中运动王牌 · 现奥运国家队功勋主教练/体育财团理事',
    desc: '阳光炽热，永远在你疲惫时张开温暖怀抱给你最坚定的安全感。',
    tag: '阳光忠犬 / 热血守护',
  },
  {
    id: 'minyoung',
    name: '朴敏英',
    role: '高中初恋闺蜜 · 现顶级女性时尚杂志主编',
    desc: '从首尔女高课桌一路并肩前行，最懂你眼泪与笑容的心灵依靠。',
    tag: '挚友知己 / 时髦相伴',
  },
  {
    id: 'taehyeon',
    name: '崔泰俊',
    role: '硅谷归国科技巨头创始人 · 独角兽CEO',
    desc: '智商爆表、身家百亿，视你为唯一的精神缪斯与事业合伙人。',
    tag: '科技新贵 / 宠妻狂魔',
  },
];
