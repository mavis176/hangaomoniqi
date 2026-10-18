export type TimePeriod =
  | 'morning_1'
  | 'morning_2'
  | 'morning_3'
  | 'lunch'
  | 'afternoon_1'
  | 'afternoon_2'
  | 'afternoon_3'
  | 'after_school'
  | 'evening';

export type SeasonType =
  | 'cherry_blossom'   // 3-4月 樱花季
  | 'early_summer'     // 5月 初夏/修学旅行季
  | 'rainy_season'     // 6-7月 梅雨季
  | 'summer_vacation'  // 8月 暑假
  | 'autumn_festival'  // 9-10月 秋季运动会/校园祭
  | 'first_snow'       // 11-12月 初雪/高考季
  | 'winter_vacation'; // 1-2月 寒假

export type RelationshipStage =
  | '陌生'
  | '相识'
  | '朋友'
  | '挚友'
  | '暧昧'
  | '恋人'
  | '灵魂伴侣';

export type RomanticOrientation =
  | '双性恋'
  | '同性恋'
  | '异性恋'
  | '无性恋'
  | '不限/随心而动';

export type ClubRankType = '见习部员' | '正式主力' | '王牌副社长' | '传奇社长';

export type TraineeGradeType =
  | '未签约练习生'
  | 'C班练习生'
  | 'B班潜力股'
  | 'A班ACE王牌'
  | '出道预备组Center'
  | 'S级·顶流C位出道';

export type TraineeMissionCategory =
  | 'monthly_eval'
  | 'public_stage'
  | 'fan_meeting'
  | 'debut_combat';

export interface TraineeSurvivalMission {
  id: string;
  category: TraineeMissionCategory;
  categoryLabel: string;
  title: string;
  conceptTag: string;
  broadcastChannel: string;
  sceneDescription: string;
  mentorPrompt: string;
  liveNetizenComments: string[];
  isAIGenerated?: boolean;
  options: {
    text: string;
    focusStat: 'vocalSkill' | 'danceSkill' | 'rapSkill' | 'cameraSkill';
    focusLabel: string;
    baseScoreBonus: number;
    mentorVerdict: string;
    fanReaction: string;
    effect: Partial<GameStats>;
  }[];
}

export interface TraineeEvalRecord {
  id: string;
  dateLabel: string;
  missionTitle: string;
  categoryLabel: string;
  finalScore: number;
  evalRank: 'S+' | 'S' | 'A' | 'B+';
  followerGain: number;
  resultingGrade: TraineeGradeType;
  mentorSummary: string;
}

export interface GameStats {
  mood: number;            // 0 - 100 (心情)
  stamina: number;         // 0 - 100 (体力)
  academics: number;       // 0 - 100 (学业)
  social: number;          // 0 - 100 (社交/声望)
  appearance: number;      // 0 - 100 (外形)
  family: number;          // 0 - 100 (家庭关系)
  coins: number;           // ₩ 韩元经济
  allowance: number;       // 每周零花钱额度
  snsFollowers: number;    // Stargram 粉丝数

  // 社团深度养成属性
  clubId: string | null;   // 所属社团 ID ('dance' | 'band' | 'council' | 'sports')
  clubSkill: number;       // 社团综合熟练度 (0 - 100)
  clubTeamwork: number;    // 社团团队默契度 (0 - 100)
  clubStagePower: number;  // 社团舞台/赛场表现力 (0 - 100)
  clubRank: ClubRankType;  // 社团内职位
  clubTrophies: string[];  // 已获得的社团比赛奖杯

  // 练习生企划社深度养成属性
  agencyId: string | null; // 签约企划社 ('hybe' | 'sm' | 'yg' | 'jyp' | null)
  traineeGrade: TraineeGradeType;
  traineeProgress: number; // 练习生综合出道进度 (0 - 100)
  vocalSkill: number;      // 声乐 Vocal (0 - 100)
  danceSkill: number;      // 舞蹈 Dance (0 - 100)
  rapSkill: number;        // 说唱与台风 Rap (0 - 100)
  cameraSkill: number;     // 镜头表情管理与直拍魅力 (0 - 100)

  darkIndex: number;       // 压力/阴霾值 (0 - 100)
  secretUnlocked: boolean; // 是否解锁隐藏真结局秘密线
}

export interface ExamRecord {
  id: string;
  year: number;
  week: number;
  examName: string;
  score: number;
  gradeRank: number;
  percentile: number;
  allowanceDelta: number;
  familyDelta: number;
  evaluation: string;
}

export interface WeeklyActionItem {
  id: string;
  name: string;
  category: 'study' | 'exercise' | 'club' | 'social' | 'parttime' | 'family' | 'rest';
  categoryLabel: string;
  icon: string;
  staminaCost: number;
  desc: string;
  effect: Partial<GameStats>;
}

export interface NPCClassmate {
  id: string;
  chineseName: string;
  koreanName: string;
  role: '同班同学' | '社团前辈' | '补习班同学' | '学生会成员' | '运动部成员' | '转学生' | '老师或职员';
  gender: 'female' | 'male';
  orientation: '双性恋' | '同性恋' | '异性恋' | '无性恋/智性恋' | '温暖守护(无性恋)';
  relationshipStage: RelationshipStage;
  favorability: number;
  romancePoints: number;
  mbti?: string;
  interests?: string[];
  speechStyle?: string;
  memoryKeywords?: string[];
  avatar: string;
  status: string;
  description: string;
  dislikedTraits: string[];
  likedGifts: string[];
  secret: string;
  secretRevealed?: boolean;
  storyStage: number;
  memories?: string[];
}

export interface WardrobeItem {
  id: string;
  name: string;
  type: 'uniform' | 'hair' | 'shoes' | 'accessory' | 'makeup';
  appearanceBonus: number;
  socialBonus?: number;
  price: number;
  owned: boolean;
  equipped: boolean;
  image: string;
  desc?: string;
}

export interface CourseSlot {
  periodNumber: number;
  startMinutes: number;
  endMinutes: number;
  timeLabel: string;
  subject: string;
  teacher: string;
  room: string;
}

export type EventCategory =
  | 'study'
  | 'club'
  | 'campus'
  | 'sns'
  | 'relationship'
  | 'family'
  | 'rare';

export interface RandomEvent {
  id: string;
  title: string;
  category?: EventCategory;
  categoryLabel?: string;
  seasonTag?: string;
  content: string;
  isAIGenerated?: boolean;
  options: {
    text: string;
    memoryLog?: string;
    romanceMode?: 'platonic' | 'romantic' | 'neutral';
    effect: Partial<GameStats> & {
      npcId?: string;
      favDelta?: number;
      romanceDelta?: number;
      favorabilityChange?: { npcId: string; amount: number; romanceAmount?: number };
    };
    resultText: string;
  }[];
}

export interface AIConfig {
  mode: 'builtin' | 'custom';
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
  narrativeStyle: string;
  temperature: number;
  autoTriggerEvents: boolean;
  playerOrientation?: RomanticOrientation;
}

export interface ChatMessage {
  sender: 'user' | 'npc';
  text: string;
  timeLabel?: string;
  innerThought?: string;
  actionDesc?: string;
  favDelta?: number;
  newMemory?: string;
  extractedKeywords?: string[];
}

export interface MemoryEntry {
  id: string;
  dateStr: string;
  npcId?: string;
  summary: string;
  category: 'chat' | 'event' | 'gift' | 'lunch' | 'life' | 'exam' | 'family' | 'romance';
}

export interface ForumPost {
  author: string;
  tag: string;
  title: string;
  content: string;
  likes: number;
  comments: string[];
}

export interface SNSPost {
  id: string;
  weekLabel: string;
  caption: string;
  tag: string;
  likes: number;
  followerGain: number;
  npcComments: { npcName: string; text: string }[];
}

export interface GameEnding {
  id: string;
  code: string;
  title: string;
  koreanTitle: string;
  category: string;
  badgeColor: string;
  summary: string;
  epilogue: string;
  conditionDesc: string;
}

export type LifePathType = 'idol' | 'university' | 'chaebol';

export interface IdolAlbumRelease {
  id: string;
  title: string;
  concept: string;
  salesFirstWeek: number;
  melonPeakRank: number;
  musicShowWins: number;
  reviewScore: string;
  isAIProduced?: boolean;
}

export interface IdolCareerState {
  debutGroupName: string;
  agencyName: string;
  debutRole: string;
  fansCount: number;
  melonChartIndex: number;
  liveSkill: number;
  cfValueScore: number;
  mentalStress: number;
  scandalIndex: number;
  albums: IdolAlbumRelease[];
  worldToursDone: number;
  currentBrandCF: string;
  historyLogs: string[];
}

export interface UniversityCareerState {
  universityName: string;
  major: string;
  gpa: number;
  yearLevel: number; // 1-4 大学, 5+ 职场
  careerStage: 'student' | 'career_starter' | 'elite_pro' | 'master_leader';
  currentJobTitle: string;
  annualSalaryKRW: number;
  careerPrestige: number;
  marriageStatus: 'single' | 'dating' | 'married';
  spouseName?: string;
  spouseRole?: string;
  childCount: number;
  childName?: string;
  childTalentScore: number;
  familyHappiness: number;
  historyLogs: string[];
}

export interface ChaebolWifeState {
  conglomerateName: string;
  spouseTitle: string;
  spouseName: string;
  skinCareBeauty: number;
  luxuryPrestige: number;
  privateTrustWealthBillions: number; // 亿韩元
  socialiteRank: '初入豪门的新媳妇' | '清潭洞名媛领袖' | '汉南洞核心理事' | '掌控家族大权的豪门女掌门';
  familyControlPower: number;
  heirStage: '早教精英' | '大峙洞特级私塾' | '瑞士贵族私立预科' | '常春藤双学位继承人';
  heirGrowthScore: number;
  ownedLuxuryItems: string[];
  charityBanquetsHosted: number;
  historyLogs: string[];
}

export interface LifePathProgress {
  currentPath: LifePathType | null;
  idol: IdolCareerState;
  university: UniversityCareerState;
  chaebol: ChaebolWifeState;
  activePathUnlocked: boolean;
}
