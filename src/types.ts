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
  | '未签约普通学生'
  | '未签约练习生'
  | 'D班练习生'
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

export interface PlayerTrait {
  id: string;
  name: string;
  icon: string;
  desc: string;
  effectDesc: string;
  category: 'positive' | 'neutral' | 'special';
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
  specialIdentity?: string;// 开局建立的家世背景/身份称号

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
  isDebutedIdol?: boolean; // 是否已成功通过选秀终审正式出道成为 Idol
  vocalSkill: number;      // 声乐 Vocal (0 - 100)
  danceSkill: number;      // 舞蹈 Dance (0 - 100)
  rapSkill: number;        // 说唱与台风 Rap (0 - 100)
  cameraSkill: number;     // 镜头表情管理与直拍魅力 (0 - 100)

  darkIndex: number;       // 压力/阴霾值 (0 - 100)
  secretUnlocked: boolean; // 是否解锁隐藏真结局秘密线

  // 新增：名声/声望与情境特质系统
  reputation?: number;      // 圈内声望与名气
  activeTraits?: PlayerTrait[];
  burnoutLevel?: number;   // 0 - 100 (专注倦怠度)
}

export interface DailyScheduleSlot {
  dayIndex: number;        // 0=Mon .. 6=Sun
  dayName: string;         // '周一' .. '周日'
  action: WeeklyActionItem;
  yieldMultiplier: number; // 1.0 = 100%, 0.5 = 50%, 0.3 = 30%
  isBurnout: boolean;
  isEpiphany: boolean;
  epiphanyBonusText?: string;
}

export interface InterruptEvent {
  id: string;
  dayIndex: number;        // 0..6
  dayName: string;         // '周三', '周五'等
  title: string;
  category: 'bond' | 'trainee' | 'crisis' | 'teacher' | 'rare';
  npcId?: string;
  npcName?: string;
  npcAvatar?: string;
  story: string;
  choiceStick: {
    label: string;
    resultDesc: string;
    effect?: Partial<GameStats>;
  };
  choiceHandle: {
    label: string;
    resultDesc: string;
    effect?: Partial<GameStats>;
    npcFavDelta?: number;
    unlockedTrait?: PlayerTrait;
  };
}

export interface WeeklyExecutionSummary {
  gradeYear: number;
  weekInYear: number;
  dailyLogs: {
    dayIndex: number;
    dayName: string;
    actionName: string;
    icon: string;
    logText: string;
    yieldPct: number;
    staminaDelta: number;
    darkDelta: number;
    isBurnout: boolean;
    isEpiphany: boolean;
  }[];
  interruptLogs: string[];
  unlockedTraits: PlayerTrait[];
  totalCoinsDelta: number;
  totalAcademicsDelta: number;
  totalTraineeDelta: number;
  totalSocialDelta: number;
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
  role: '同班同学' | '社团前辈' | '补习班同学' | '学生会成员' | '运动部成员' | '转学生' | '老师或职员' | string;
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

  // 🎭 独有人设与 AI 口风体系 (Persona Profile)
  nicknameToPlayer?: string; // 对玩家的专属称呼（如："喂"、"秀妍"、"小秀妍"、"学妹"、"那个谁"）
  speakingStyle?: string;    // 句式节奏与口癖（如：短句反问多、毒舌感叹句、波浪号连发、语气委婉）
  forbiddenWords?: string[]; // 严禁使用的客服与AI感词汇（如：["请问有什么可以帮您", "我非常乐意", "好的呢", "作为人工智能"]）
  attitudeByAffection?: {
    low: string;  // 好感度 0~29 时的性格态度表现
    mid: string;  // 好感度 30~69 时的性格态度表现
    high: string; // 好感度 70+ 时的性格态度表现
  };

  // 🌟 AI 动态生成 NPC 扩展字段 (DynamicNPC)
  isGenerated?: boolean;      // 是否为随机偶遇生成的动态 NPC
  encounterWeek?: number;    // 初识结交周数 (例如：第3周)
  encounterLocation?: string;// 相遇地点 (例如：弘大街头、大峙洞自习室、新沙洞练习室)
  initialImpression?: string;// 初遇微情境或第一印象
  personality?: string;      // 性格核心摘要
}

export type NPC = NPCClassmate;

export interface DynamicNPC extends NPCClassmate {
  isGenerated: true;
  encounterWeek: number;
  encounterLocation: string;
  initialImpression: string;
}

export interface DynamicNPCEncounterChoice {
  text: string;
  action: 'ADD_FRIEND' | 'IGNORE';
}

export interface DynamicNPCEncounter {
  name: string;              // 随机韩文名（带中文译名，如"崔宥真 (최유진)"）
  chineseName?: string;
  koreanName?: string;
  identity: string;          // 身份设定（如：隔壁班吉他手/竞争公司C班练习生/便利店打工前辈）
  personality: string;       // 性格核心（如：表面冷淡其实是重度猫奴/元气但容易自卑）
  speakingStyle: string;     // 独特的口癖与称呼习惯
  avatarSeed: string;        // 随机头像种子或预设头像分类ID
  avatarUrl?: string;        // 渲染立绘图片 URL
  encounterStory: string;    // 相遇时的微情境短文（50-80字，如借伞、抢最后一盒草莓牛奶、练习室撞衫）
  encounterLocation: string; // 相遇地点
  choices: DynamicNPCEncounterChoice[];
}

export interface DynamicNarrativeContext {
  sceneType:
    | 'choice_option'
    | 'job_event'
    | 'endorsement_event'
    | 'exam_event'
    | 'trainee_eval'
    | 'campus_encounter'
    | 'general';
  playerName?: string;
  stats?: GameStats;
  actionName?: string;
  choiceText?: string;
  npc?: NPCClassmate;
  agencyName?: string;
  location?: string;
  timeContext?: string;
  customPrompt?: string;
  examType?: 'midterm' | 'final' | 'mock' | 'csat';
  examScore?: number;
}

export interface DynamicNarrativeResult {
  title?: string;
  narrative: string; // 50-80字沉浸式情境微描写
  dialogue?: string; // 现场代入台词
  mentorVerdict?: {
    mentorName: string;
    agencyStyle: string;
    ratingScore: number; // 0-100
    critique: string; // 犀利专业点评
    advice: string; // 改进建议
  };
  jobEvent?: {
    title: string;
    encounterDesc: string; // 兼职偶遇/突发事件
    tipGained: number; // 额外奖惩
  };
  choiceFollowUp?: {
    innerFeeling: string; // 主角内心独白
    socialImpact: string; // 周围反响
  };
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
  mode: 'builtin' | 'custom' | 'starletter';
  starletterSceneCode?: string;
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
  bubbles?: string[];
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

export interface DiaryEntry {
  id: string;
  dateStr: string;
  title: string;
  content: string;
  mood: string;
  sticker?: string;
  weather?: string;
  createdAt: string;
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
  imageUrl?: string;
  likes: number;
  followerGain: number;
  npcComments: { npcName: string; text: string }[];
}

export interface FanBubbleMessageItem {
  fanName: string;
  fanRole: string;
  message: string;
  loyaltyGain: number;
}

export interface FanBubblePlayerState {
  identityStatus: string;
  recentSchedule: string;
  fanPersonas?: string[];
  playerName?: string;
  stats?: GameStats;
  weekLabel?: string;
  aiConfig?: AIConfig;
}

export interface FanBubbleChatTurn {
  sender: 'fan' | 'user';
  text: string;
  bubbles?: string[];
  timeLabel: string;
  emotionTag?: string;
  loyaltyDelta?: number;
}

export interface FanBubbleThread {
  id: string;
  fanName: string;
  fanRole: string;
  avatarEmoji: string;
  badgeColor: string;
  loyalty: number;
  pendingLoyaltyGain: number;
  hasUnread: boolean;
  unreadCount: number;
  updatedAtLabel: string;
  messages: FanBubbleChatTurn[];
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

export interface HousingItem {
  id: string;
  name: string;
  koreanName: string;
  price: number;
  staminaBonusPerTurn: number;
  moodBonusPerTurn: number;
  darkIndexReductionPerTurn: number;
  socialBonus: number;
  image: string;
  desc: string;
  locationLabel: string;
  tier: 'semi_basement' | 'apartment' | 'penthouse' | 'mansion';
}

export interface VehicleItem {
  id: string;
  name: string;
  koreanName: string;
  price: number;
  socialBonus: number;
  appearanceBonus: number;
  unlockedEventsDesc: string;
  image: string;
  desc: string;
  tier: 'public' | 'van' | 'supercar';
}

export interface PlayerAssetsState {
  currentHousingId: string;
  currentVehicleId: string;
  ownedHousingIds: string[];
  ownedVehicleIds: string[];
}

export interface FamilyInteractionLog {
  id: string;
  dateStr: string;
  type: 'allowance' | 'dinner' | 'report';
  title: string;
  summary: string;
  coinsDelta?: number;
  familyDelta?: number;
  staminaDelta?: number;
}

export interface FamilyMilestoneItem {
  id: string;
  title: string;
  categoryLabel: string;
  rewardCoins: number;
  newsSummary: string;
  createdAtStr: string;
}

export interface DispatchScandalLeak {
  id: string;
  title: string;
  headline: string;
  targetNpcName?: string;
  isPlayerTarget?: boolean;
  causalReason?: string;
  leakCategory: 'romance' | 'nightlife' | 'attitude' | 'agency_dispute';
  hoursRemaining: number;
  evidencePhoto: string;
  status: 'pending' | 'resolved_bought' | 'resolved_statement' | 'resolved_counter' | 'leaked_disaster';
  buyoutCostKRW: number;
  statementInfluenceCost: number;
  riskPct: number;
  summary: string;
  leakDateLabel: string;
  userReaction?: 'spectate' | 'like' | 'sabotage' | null;
  reactionResultText?: string;
  netizenComments?: { name: string; text: string; likes: number }[];
}

export interface CoupangShopItem {
  id: string;
  name: string;
  koreanName: string;
  category: 'uniform' | 'couture' | 'stage' | 'luxury_bag' | 'skincare';
  priceKRW: number;
  appearanceBonus: number;
  socialBonus: number;
  darkIndexReduction: number;
  image: string;
  tag: string;
  description: string;
  owned?: boolean;
}

export interface KTalkMessage {
  id: string;
  sender: 'vip' | 'player';
  text: string;
  timestamp: string;
  eqScore?: number;
}

export interface KTalkIndustryContact {
  id: string;
  name: string;
  role: string;
  category: 'pd' | 'producer' | 'exec' | 'rival';
  avatar: string;
  influenceLevel: number;
  lastMessage: string;
  unread: boolean;
  messages: KTalkMessage[];
  pendingOffer?: {
    id: string;
    title: string;
    rewardCoins: number;
    followerGain: number;
    influenceGain: number;
    desc: string;
  };
}


