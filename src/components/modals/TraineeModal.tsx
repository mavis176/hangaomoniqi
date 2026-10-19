import React, { useState } from 'react';
import {
  X,
  Star,
  Sparkles,
  Music,
  Mic,
  Camera,
  Flame,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Award,
  TrendingUp,
  Radio,
  Heart,
  FileText,
  Crown,
  Send,
  ShieldAlert,
  ShieldCheck,
  Dice5,
  Zap,
  Lock,
  Building2,
  Loader2,
  Check,
} from 'lucide-react';
import {
  GameStats,
  TraineeGradeType,
  AIConfig,
  TraineeMissionCategory,
  TraineeSurvivalMission,
  TraineeEvalRecord,
} from '../../types';
import {
  AGENCIES_DATA,
  TRAINEE_SUDDEN_INCIDENTS,
  TRAINEE_EVALUATIONS,
  TraineeSuddenIncident,
  TraineeEvaluationStage,
} from '../../data/clubAndTraineeData';
import {
  generateTraineeSurvivalMission,
  generateDynamicNarrative,
  ActionEventCategory,
} from '../../services/aiService';
import { defaultAIConfig } from '../../data/gameData';

interface TraineeModalProps {
  onClose: () => void;
  stats: GameStats;
  aiConfig?: AIConfig;
  timeContext?: string;
  lastJobTurnKey?: string;
  currentTurnKey?: string;
  weeklyCompletedActions?: string[];
  onMarkWeeklyActionDone?: (key: string) => void;
  onTriggerActionEvent?: (params: {
    actionCategory: ActionEventCategory;
    actionName: string;
    locationName: string;
    baseStaminaCost: number;
    weeklyActionKey: string;
    extraContext?: string;
  }) => void;
  onRecordJobDone?: () => void;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onNotify: (msg: string) => void;
}

const GRADE_LADDER: { grade: TraineeGradeType; minProgress: number; badge: string; desc: string }[] = [
  { grade: '未签约普通学生', minProgress: 0, badge: 'bg-stone-200 text-stone-700', desc: '首尔女高普通学生，尚未签约娱企' },
  { grade: 'D班练习生', minProgress: 10, badge: 'bg-stone-100 text-stone-700', desc: '签约起步，基础练习生' },
  { grade: 'C班练习生', minProgress: 25, badge: 'bg-sky-100 text-sky-800', desc: '掌握基础唱跳，大班排练' },
  { grade: 'B班潜力股', minProgress: 45, badge: 'bg-emerald-100 text-emerald-800', desc: '崭露头角，重点梯队' },
  { grade: 'A班ACE王牌', minProgress: 70, badge: 'bg-purple-100 text-purple-800', desc: '全能六边形王牌，触发出道资格考核' },
  { grade: '出道预备组Center', minProgress: 85, badge: 'bg-rose-100 text-rose-800', desc: '锁定新女团核心C位，等待终选出道战' },
  { grade: 'S级·顶流C位出道', minProgress: 100, badge: 'bg-amber-300 text-amber-950 font-black', desc: '通过终审出道战，正式成为顶级Idol' },
];

export function computeTraineeGrade(
  progress: number,
  agencyId: string | null,
  isDebutedIdol?: boolean
): TraineeGradeType {
  if (isDebutedIdol) return 'S级·顶流C位出道';
  if (!agencyId) return '未签约普通学生';
  if (progress >= 85) return '出道预备组Center';
  if (progress >= 70) return 'A班ACE王牌';
  if (progress >= 45) return 'B班潜力股';
  if (progress >= 25) return 'C班练习生';
  return 'D班练习生';
}

export function checkDebutEligibility(stats: GameStats): {
  isEligible: boolean;
  hasAgency: boolean;
  hasGrade: boolean;
  hasVocal: boolean;
  hasDance: boolean;
  hasCamera: boolean;
  hasStamina: boolean;
  agencyName: string;
  reasons: string[];
} {
  const hasAgency = Boolean(stats.agencyId);
  const hasGrade =
    stats.traineeGrade === 'A班ACE王牌' ||
    stats.traineeGrade === '出道预备组Center' ||
    stats.traineeProgress >= 70;
  const hasVocal = (stats.vocalSkill || 0) >= 60;
  const hasDance = (stats.danceSkill || 0) >= 60;
  const hasCamera = (stats.cameraSkill || 0) >= 50;
  const hasStamina = (stats.stamina || 0) >= 20;

  const reasons: string[] = [];
  if (!hasAgency) reasons.push('需先签约四大娱乐企划社（HYBE/SM/YG/JYP）');
  if (!hasGrade) reasons.push('练习生等级需升至【A班ACE王牌】或【出道预备组Center】（综合进度 ≥ 70%）');
  if (!hasVocal) reasons.push(`声乐 Vocal 需达到 60 分（当前：${stats.vocalSkill || 0}/60）`);
  if (!hasDance) reasons.push(`舞蹈 Dance 需达到 60 分（当前：${stats.danceSkill || 0}/60）`);
  if (!hasCamera) reasons.push(`镜头表现力需达到 50 分（当前：${stats.cameraSkill || 0}/50）`);
  if (!hasStamina) reasons.push('出道终审战需消耗 20 点体力');

  const agencyMap: Record<string, string> = {
    hybe: 'HYBE Labels (Ador/Source)',
    sm: 'SM Entertainment (KWANGYA)',
    yg: 'YG Entertainment (The Black)',
    jyp: 'JYP Entertainment (JYP NATION)',
  };

  return {
    isEligible: hasAgency && hasGrade && hasVocal && hasDance && hasCamera && hasStamina,
    hasAgency,
    hasGrade,
    hasVocal,
    hasDance,
    hasCamera,
    hasStamina,
    agencyName: stats.agencyId ? agencyMap[stats.agencyId] || stats.agencyId : '未签约',
    reasons,
  };
}

interface SurvivalTestThemeConfig {
  id: 'knife_dance' | 'songwriting' | 'solo_live' | 'concept_fancam';
  name: string;
  tag: string;
  weightsLabel: string;
  computeBaseScore: (s: GameStats) => number;
  defaultBrief: string;
  mentorWarning: string;
  penaltyIncident: {
    title: string;
    crisisLevel: '淘汰边缘红牌警告' | '降班与魔鬼加练惩罚';
    sceneDesc: string;
    mentorScold: string;
    choices: {
      text: string;
      badge: string;
      outcomeText: string;
      delta: Partial<GameStats>;
    }[];
  };
}

const SURVIVAL_TEST_THEMES: SurvivalTestThemeConfig[] = [
  {
    id: 'knife_dance',
    name: '刀群舞极限同步考核',
    tag: '⚡ 刀群舞考核',
    weightsLabel: '舞蹈(50%) + 体力(25%) + 镜头感(25%)',
    computeBaseScore: (s) =>
      Math.round((s.danceSkill || 38) * 0.5 + s.stamina * 0.25 + (s.cameraSkill || 40) * 0.25),
    defaultBrief:
      '地下B2主练习室开启红外线角度测算仪与2倍速伴奏！总制作人要求全员完成高强度《猎魔女团》刀群舞连跳三遍，不仅起跳高度、指尖角度必须分毫不差，最后30秒还要全开麦稳住呼吸。',
    mentorWarning:
      '舞蹈总监冷声警告：“哪怕有一个八拍角度偏差超过5度、或者体力不支动作变形，立刻摘下名牌降入淘汰待定区！”',
    penaltyIncident: {
      title: '【淘汰边缘突发】刀群舞2倍速体力透支踩错队形，遭总制作人当场叫停！',
      crisisLevel: '淘汰边缘红牌警告',
      sceneDesc:
        '音乐进行到最后一段高潮2倍速Dance Break，你因连续高强度训练体力透支，转身时鞋底打滑慢了半拍，直接撞乱了C位三角队形！制作人脸色铁青地按下停止键，练习室瞬间死一般寂静，摄像机红灯直直对准你惨白的脸，工作人员甚至拿出了【淘汰待定F班】灰色名牌……',
      mentorScold:
        '“连最基本的刀群舞同步率都守不住，你还想站上出道舞台？给你最后一次48小时加试自救机会，否则月底直接清理出出道预备组！”',
      choices: [
        {
          text: '【通宵魔鬼自救】绑沙袋在B2练习室通宵单曲循环200遍，48小时后申请蒙眼刀群舞复测！',
          badge: '🔥 绝境逆袭 (+12舞蹈 / 保住等级 / 涨粉+4,200)',
          outcomeText:
            '你在练习室汗如雨下苦练两天两夜，复测当天蒙上双眼竟跳出100%肌肉记忆刀群舞！制作人震惊起立鼓掌，这段“浴火重生”花絮在韩网疯传，死忠粉暴涨！',
          delta: {
            danceSkill: 12,
            stamina: -15,
            traineeProgress: 10,
            snsFollowers: 4200,
            mood: 6,
          },
        },
        {
          text: '【向ACE前辈千宥娜请教】放下面子请练习生第一名千宥娜帮你逐帧抠动作发力点',
          badge: '🤝 化险为夷 (+8舞蹈 / +8社交 / 免除降班)',
          outcomeText:
            '千宥娜深夜留下来陪你抠完每一个卡点细节，你在补考中稳稳过关，不仅免除了淘汰危机，还收获了神仙同门情谊！',
          delta: {
            danceSkill: 8,
            cameraSkill: 5,
            social: 8,
            traineeProgress: 6,
            snsFollowers: 2200,
          },
        },
        {
          text: '【接受降班与百遍蛙跳惩罚】默默换上待定区灰衣服，在冷板凳上把屈辱化作动力',
          badge: '⚠️ 卧薪尝胆 (出道进度-6% / +10舞蹈 / 暗黑斗志觉醒)',
          outcomeText:
            '你咬紧牙关接受了降班警告与体能惩罚。虽然出道进度暂时受挫，但你的眼神变得无比狠厉专注，舞蹈核心爆发力大幅突破！',
          delta: {
            danceSkill: 10,
            traineeProgress: -6,
            mood: -8,
            darkIndex: 6,
          },
        },
      ],
    },
  },
  {
    id: 'songwriting',
    name: '原创词曲创作竞赛 (Producer Battle)',
    tag: '🎼 创作竞赛',
    weightsLabel: 'Rap/创作(45%) + 声乐(30%) + 学业灵感(25%)',
    computeBaseScore: (s) =>
      Math.round((s.rapSkill || 30) * 0.45 + (s.vocalSkill || 34) * 0.3 + s.academics * 0.25),
    defaultBrief:
      '企划社启动残酷的【72小时极限词曲创作生存战（Song Camp）】！每位练习生需独立完成一段主打歌Hook旋律与16小节韩英双语Rap词创作，并在制作人面前现场试唱Demo。',
    mentorWarning:
      '王牌制作人敲着混音台：“我不需要流水线口水歌！如果旋律俗套或者Flow毫无灵气，你的曲目将被当场扔进碎纸机并触发末位惩罚！”',
    penaltyIncident: {
      title: '【惩罚边缘突发】原创Demo被批“毫无灵魂”，遭关进录音棚小黑屋限时重写！',
      crisisLevel: '降班与魔鬼加练惩罚',
      sceneDesc:
        '你熬夜交出的第一版Demo刚播放了30秒，总制作人便冷漠地关掉监听音箱：“节奏老套、歌词空洞，这就是首尔女高学生的创作水平？”全场练习生纷纷侧目，你被贴上红牌警告，勒令在明早8点前重写一首能打动全场的作品，否则剥夺下月公演资格！',
      mentorScold:
        '“真正的创作者都是在绝境里逼出来的。明早8点如果还拿不出像样的Hook，你就去给A班当伴舞吧！”',
      choices: [
        {
          text: '【撕碎重写·真情实感】将自己兼顾高考与练习生的孤独心声写进《十七岁的凌晨四点》Rap词',
          badge: '✨ 神作诞生 (+12说唱创作 / +6声乐 / 涨粉+5,500)',
          outcomeText:
            '你把真实的汗水与不甘倾注进字里行间，次日清唱出那句直击灵魂的Hook时，连最严苛的女导师都红了眼眶！Demo直接被钦点收录进出道先行曲！',
          delta: {
            rapSkill: 12,
            vocalSkill: 6,
            traineeProgress: 12,
            snsFollowers: 5500,
            mood: 8,
          },
        },
        {
          text: '【融合广播社古典采样】结合在校学习的文学意象与钢琴采样，重构抓耳旋律线',
          badge: '🎹 巧思翻盘 (+8创作 / +5学业 / 保级成功)',
          outcomeText:
            '你巧妙引入肖邦夜曲采样与韩诗押韵，制作人听后眼前一亮，当场撤回了红牌警告！',
          delta: {
            rapSkill: 8,
            academics: 5,
            traineeProgress: 7,
            snsFollowers: 2600,
          },
        },
        {
          text: '【认罚留堂抄写百首热单乐谱】接受制作人惩罚，在编曲室闭关拆解顶流编曲结构',
          badge: '⚠️ 闭关苦修 (出道进度-5% / +9创作 / 体力-10)',
          outcomeText:
            '你被罚留在编曲室连续一周拆解名曲工程文件，虽然错失了本次舞台中心位，但你的乐理与制作功底突飞猛进！',
          delta: {
            rapSkill: 9,
            vocalSkill: 4,
            traineeProgress: -5,
            stamina: -10,
            mood: -6,
          },
        },
      ],
    },
  },
  {
    id: 'solo_live',
    name: '全开麦个人Live生唱考核',
    tag: '🎤 个人Live',
    weightsLabel: '声乐(55%) + 心态/心情(25%) + 镜头感(20%)',
    computeBaseScore: (s) =>
      Math.round((s.vocalSkill || 34) * 0.55 + s.mood * 0.25 + (s.cameraSkill || 40) * 0.2),
    defaultBrief:
      '零伴奏垫音、零修音滤镜！本次【月度生存测试·个人Live专场】要求练习生独自站在立麦前，挑战三段式升Key高音抒情曲与边跳边唱全开麦测试，分贝仪与音准器实时投屏！',
    mentorWarning:
      '声乐首席导师严肃宣布：“今天撤掉所有背景垫音（MR Removed）！谁敢假唱、破音或气息断层，直接触发淘汰边缘危机！”',
    penaltyIncident: {
      title: '【淘汰边缘突发】全开麦高音区嗓音沙哑破音，面临劝退解约危机！',
      crisisLevel: '淘汰边缘红牌警告',
      sceneDesc:
        '唱到副歌最高潮的F5真音长音时，你因连日疲惫声带水肿，高音瞬间劈叉破音！实时音准大屏亮起刺眼的红色警告，台下同期练习生发出倒吸冷气的声音。考核结束后，企划社艺人管理室长把你叫进办公室，桌上放着一份《练习生末位淘汰劝退通知书》……',
      mentorScold:
        '“爱豆舞台没有重来一次的借口。现在全网都在审判爱豆安可生唱，如果你证明不了自己的Live实力，公司只能放弃你！”',
      choices: [
        {
          text: '【申请无伴奏清唱加试】当场关掉麦克风混响，用极具故事感的中低音与咽音技巧清唱自救！',
          badge: '🎤 天籁逆袭 (+13声乐 / 转危为安 / 涨粉+4,800)',
          outcomeText:
            '你深吸一口气，在完全安静的房间里清唱出极具穿透力的撕裂感高音，真挚的情感震慑全场！室长当场撕掉劝退书，将你重新提拔回主力梯队！',
          delta: {
            vocalSkill: 13,
            cameraSkill: 5,
            traineeProgress: 11,
            snsFollowers: 4800,
            mood: 8,
          },
        },
        {
          text: '【去校医室找宋恩静老师紧急护嗓】针灸雾化修复声带后，参加次日清晨补考',
          badge: '🍵 温柔治愈 (+9声乐 / +10体力 / 稳住评级)',
          outcomeText:
            '宋恩静老师心疼地为你做了温润雾化与蜂蜜柚子护嗓调理，次日补考你发挥稳定，成功解除淘汰警报！',
          delta: {
            vocalSkill: 9,
            stamina: 10,
            mood: 10,
            traineeProgress: 5,
          },
        },
        {
          text: '【签下军令状降入C班】承担破音失误责任，每天清晨5点在汉江边练声开嗓',
          badge: '⚠️ 降班苦练 (出道进度-6% / +11声乐)',
          outcomeText:
            '你含泪签下军令状降入C班重头再来。每天清晨汉江大桥下的迎风练声，让你的全开麦肺活量与高音厚度彻底脱胎换骨！',
          delta: {
            vocalSkill: 11,
            traineeProgress: -6,
            mood: -6,
          },
        },
      ],
    },
  },
  {
    id: 'concept_fancam',
    name: '直拍概念消化力与表情管理测试',
    tag: '📸 概念直拍',
    weightsLabel: '镜头感(50%) + 外形(30%) + 舞蹈(20%)',
    computeBaseScore: (s) =>
      Math.round((s.cameraSkill || 40) * 0.5 + s.appearance * 0.3 + (s.danceSkill || 38) * 0.2),
    defaultBrief:
      '4台4K高速摇臂摄像机随机切换红灯机位！考核主题将在“清纯初恋学院风”、“暗黑恶女Girl Crush”与“破碎感神女风”之间每30秒无缝切换，测试你抓机位与Ending妖精的绝对统治力！',
    mentorWarning:
      '视觉总监冷笑道：“抓不到红灯机位、或者表情僵硬像木头人的练习生，哪怕跳得再好也只能一辈子当背景板！”',
    penaltyIncident: {
      title: '【惩罚边缘突发】机位切换漏看红灯+表情僵硬，被剥夺主打曲C位候选资格！',
      crisisLevel: '降班与魔鬼加练惩罚',
      sceneDesc:
        '3号摇臂机位突然亮起红灯切近景特写时，你正低头调整呼吸，完全错过了黄金3秒Killing Part镜头！回放监视器里，你的眼神游离、表情紧绷，视觉总监毫不留情地将你的名字从主打曲Center候选名单上划掉，并罚你留堂加练表情管理！',
      mentorScold:
        '“观众看直拍只需要3秒就会划走！如果你抓不住镜头，镜头就永远不会爱你！”',
      choices: [
        {
          text: '【加试破碎感落泪Ending】借着委屈与倔强，对着特写镜头演活“一秒仙女落泪+冷艳回眸”！',
          badge: '📸 神颜出圈 (+12镜头感 / +5外形 / 涨粉+6,200)',
          outcomeText:
            '你眼角悬着一滴晶莹泪珠却勾唇冷笑的4K特写镜头直接封神！视觉总监当场拍案叫绝，不仅恢复你的Center候选资格，更把这段直拍发上官号引爆热搜！',
          delta: {
            cameraSkill: 12,
            appearance: 5,
            traineeProgress: 12,
            snsFollowers: 6200,
            mood: 9,
          },
        },
        {
          text: '【对着练习室落地镜苦练30种眼神切换】精准记忆所有导播切镜规律',
          badge: '✨ 稳扎稳打 (+9镜头感 / 免除处罚)',
          outcomeText:
            '你把导播切镜分镜表背得滚瓜烂熟，在补测中精准捕捉每一个红灯机位，顺利保住评级！',
          delta: {
            cameraSkill: 9,
            danceSkill: 4,
            traineeProgress: 6,
            snsFollowers: 2400,
          },
        },
        {
          text: '【接受冷板凳边缘站位惩罚】退居队形最角落，发誓用镶边直拍逆天改命',
          badge: '⚠️ 镶边蓄力 (出道进度-5% / +10镜头感)',
          outcomeText:
            '你被暂时调到了队形最边缘的角落，但你暗下决心，哪怕只有3秒镜头也要做到极致耀眼！',
          delta: {
            cameraSkill: 10,
            appearance: 3,
            traineeProgress: -5,
            mood: -5,
          },
        },
      ],
    },
  },
];

export const TraineeModal: React.FC<TraineeModalProps> = ({
  onClose,
  stats,
  aiConfig = defaultAIConfig,
  timeContext = '2025年春季学期',
  lastJobTurnKey,
  currentTurnKey,
  weeklyCompletedActions = [],
  onMarkWeeklyActionDone,
  onTriggerActionEvent,
  onRecordJobDone,
  onUpdateStats,
  onNotify,
}) => {
  const isAlreadyWorkedToday =
    (Boolean(lastJobTurnKey) && Boolean(currentTurnKey) && lastJobTurnKey === currentTurnKey) ||
    weeklyCompletedActions.includes('weekly_parttime_or_endorsement');
  const isWeeklyMentorTrainingDone = weeklyCompletedActions.includes('weekly_trainee_mentor_training');
  const isWeeklyEvalDone = weeklyCompletedActions.includes('weekly_trainee_eval');

  const [activeTab, setActiveTab] = useState<
    'survival_test' | 'survival_ai' | 'post_debut' | 'monthly_eval' | 'training'
  >(stats.isDebutedIdol ? 'post_debut' : 'training');

  // ==================== NEW: 出道后·顶流爱豆生涯 (Post-Debut Idol Career) State ====================
  const [albumTitleInput, setAlbumTitleInput] = useState<string>('');
  const [selectedAlbumConcept, setSelectedAlbumConcept] = useState<string>('y2k');
  const [musicShowWins, setMusicShowWins] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('kr_idol_wins_v1') || '0');
    } catch {
      return 0;
    }
  });
  const [releasedAlbums, setReleasedAlbums] = useState<
    { id: string; title: string; concept: string; melonRank: string; sales: number; royalty: number }[]
  >(() => {
    try {
      const s = localStorage.getItem('kr_idol_albums_v1');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [activeEncoreModal, setActiveEncoreModal] = useState<{
    showName: string;
    score: number;
  } | null>(null);
  const [activePostDebutCrisis, setActivePostDebutCrisis] = useState<{
    title: string;
    desc: string;
    choices: { text: string; outcome: string; delta: Partial<GameStats> }[];
  } | null>(null);

  // ==================== NEW: 练习生月度生存测试 (Monthly Survival Test) State ====================
  const [selectedTestThemeId, setSelectedTestThemeId] = useState<SurvivalTestThemeConfig['id']>('knife_dance');
  const [isGeneratingSurvivalTest, setIsGeneratingSurvivalTest] = useState<boolean>(false);
  const [survivalTestScenario, setSurvivalTestScenario] = useState<{
    themeConfig: SurvivalTestThemeConfig;
    aiTitle: string;
    aiBrief: string;
    aiMentorRule: string;
    passThreshold: number;
  } | null>(null);
  const [survivalTestResult, setSurvivalTestResult] = useState<{
    score: number;
    gradeLetter: 'S' | 'A' | 'B' | 'C' | 'F';
    gradeTitle: string;
    isLowGrade: boolean;
    summary: string;
    followerDelta: number;
    progressDelta: number;
  } | null>(null);
  // Penalty or Elimination Edge Sudden Incident Popup
  const [activePenaltyIncident, setActivePenaltyIncident] = useState<
    SurvivalTestThemeConfig['penaltyIncident'] | null
  >(null);
  const [penaltyOutcomeText, setPenaltyOutcomeText] = useState<string | null>(null);

  // Sub-Popup 1: Trainee Practice Room Sudden Incident
  const [activeIncident, setActiveIncident] = useState<TraineeSuddenIncident | null>(null);
  const [incidentOutcome, setIncidentOutcome] = useState<string | null>(null);

  // Sub-Popup 2: 3-Stage Classic Monthly Evaluation / Survival Show Stage
  const [activeEval, setActiveEval] = useState<TraineeEvaluationStage | null>(null);
  const [evalStage, setEvalStage] = useState<1 | 2 | 3>(1);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [evalLogs, setEvalLogs] = useState<string[]>([]);

  // Sub-Popup 3: AI-Generated Survival Show & Debut Combat Mission Theater
  const [isGeneratingMission, setIsGeneratingMission] = useState<boolean>(false);
  const [customMissionTheme, setCustomMissionTheme] = useState<string>('');
  const [activeAIMission, setActiveAIMission] = useState<TraineeSurvivalMission | null>(null);
  const [customStageAction, setCustomStageAction] = useState<string>('');
  const [aiMissionResult, setAiMissionResult] = useState<{
    finalScore: number;
    evalRank: 'S+' | 'S' | 'A' | 'B+';
    mentorVerdict: string;
    fanReaction: string;
    followerGain: number;
    progressGain: number;
    coinsGain: number;
    previousGrade: TraineeGradeType;
    newGrade: TraineeGradeType;
  } | null>(null);

  // Evaluation & Debut Combat History Records (persisted in localStorage)
  const [evalHistory, setEvalHistory] = useState<TraineeEvalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kr_trainee_eval_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const appendEvalRecord = (rec: TraineeEvalRecord) => {
    setEvalHistory((prev) => {
      const next = [rec, ...prev].slice(0, 20);
      try {
        localStorage.setItem('kr_trainee_eval_history_v1', JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  // ==================== NEW: 出道选拔终审战 (Final Debut Showcase) State ====================
  const [isExecutingDebutShowcase, setIsExecutingDebutShowcase] = useState<boolean>(false);
  const [debutShowcaseResult, setDebutShowcaseResult] = useState<{
    passed: boolean;
    finalScore: number;
    vocalScore: number;
    danceScore: number;
    cameraScore: number;
    narrative: string;
    mentorCritique: string;
  } | null>(null);
  const [showDebutCelebrationModal, setShowDebutCelebrationModal] = useState<boolean>(false);

  const debutEligibility = checkDebutEligibility(stats);

  const currentAgency = AGENCIES_DATA.find((a) => a.id === stats.agencyId);
  const agencyDisplayName = currentAgency ? currentAgency.name : '四大社联合选秀训练营';
  const vocal = stats.vocalSkill || 34;
  const dance = stats.danceSkill || 38;
  const rap = stats.rapSkill || 30;
  const camera = stats.cameraSkill || 40;
  const avgFourDim = Math.round((vocal + dance + rap + camera) / 4);

  const handleExecuteDebutShowcase = async () => {
    const eligibility = checkDebutEligibility(stats);
    if (!eligibility.isEligible) {
      onNotify('⚠️ 尚未达成全部出道门槛：' + eligibility.reasons.join('；'));
      return;
    }
    if (stats.stamina < 20) {
      onNotify('⚠️ 体力不足 20 点，无法支持高强度终审考核！请先休息。');
      return;
    }

    setIsExecutingDebutShowcase(true);
    setDebutShowcaseResult(null);

    // Compute scores based on real player skills
    const vocalScore = Math.min(100, Math.round(vocal * 0.9 + Math.random() * 15));
    const danceScore = Math.min(100, Math.round(dance * 0.9 + Math.random() * 15));
    const cameraScore = Math.min(100, Math.round(camera * 0.9 + Math.random() * 15));
    const finalScore = Math.round(vocalScore * 0.35 + danceScore * 0.35 + cameraScore * 0.3);
    const passed = finalScore >= 68;

    let narrative = '';
    let mentorCritique = '';

    try {
      const aiResult = await generateDynamicNarrative({
        aiConfig,
        context: {
          sceneType: 'trainee_eval',
          actionName: '出道选拔终选战 (Final Debut Showcase)',
          playerName: '李秀妍',
          stats,
        },
      });
      if (aiResult?.narrative) {
        narrative = aiResult.narrative;
        mentorCritique =
          aiResult.mentorVerdict?.critique ||
          aiResult.dialogue ||
          (passed
            ? '“无论是高音的稳定度还是绝杀Ending的眼神，你已经完全具备现役顶流的统治力。出道吧，李秀妍！”'
            : '“舞步很到位，但声音有些许颤抖。我们需要的是绝对控场的舞台主宰，再精进一下发声吧。”');
      }
    } catch {
      // fallback
    }

    if (!narrative) {
      if (passed) {
        narrative = `在全场总制作人与高管的屏息注视下，李秀妍以毫无失误的刀群舞卡点与通透的三段升Key高音引爆了终审主舞台！掌声在评审席雷动，大屏幕亮起全绿灯“DEBUT CONFIRMED”！`;
        mentorCritique = `“毫无疑问的断层第一。你的舞台饥饿感与统治力，就是我们寻觅已久的五代C位核心。恭喜正式出道！”`;
      } else {
        narrative = `终审舞台灯光炫目，但在挑战高难度连续旋转动作时步伐出现微小偏差。虽然整体表现优异，但挑剔的总制作人最终亮起了代表观望的黄灯。`;
        mentorCritique = `“你的技术很扎实，但情绪表达还稍显紧绷。再沉淀两周，下一次舞台我们期待看到更松弛霸气的你。”`;
      }
    }

    setIsExecutingDebutShowcase(false);

    setDebutShowcaseResult({
      passed,
      finalScore,
      vocalScore,
      danceScore,
      cameraScore,
      narrative,
      mentorCritique,
    });

    if (passed) {
      // Formally promote player to Debuted Idol!
      onUpdateStats({
        isDebutedIdol: true,
        traineeGrade: 'S级·顶流C位出道',
        traineeProgress: 100,
        stamina: Math.max(0, stats.stamina - 20),
        coins: stats.coins + 300000,
        snsFollowers: stats.snsFollowers + 35000,
      });

      appendEvalRecord({
        id: `debut_${Date.now()}`,
        dateLabel: timeContext,
        missionTitle: '出道选拔终选战 (Final Debut Showcase)',
        categoryLabel: '出道终审·加冕战',
        finalScore,
        evalRank: 'S+',
        followerGain: 35000,
        resultingGrade: 'S级·顶流C位出道',
        mentorSummary: `【终审全票通过】以 ${finalScore} 高分通过出道考核，正式出道加冕顶流Center！`,
      });

      setShowDebutCelebrationModal(true);
      onNotify('🎊 恭喜李秀妍以断层第1绝对实力通过出道终审！正式加冕【S级·顶流C位出道】！');
    } else {
      onUpdateStats({
        stamina: Math.max(0, stats.stamina - 20),
        traineeProgress: Math.min(100, stats.traineeProgress + 3),
        vocalSkill: Math.min(100, vocal + 1),
        danceSkill: Math.min(100, dance + 1),
      });

      appendEvalRecord({
        id: `debut_fail_${Date.now()}`,
        dateLabel: timeContext,
        missionTitle: '出道选拔终选战 (Final Debut Showcase)',
        categoryLabel: '出道终审·实战考核',
        finalScore,
        evalRank: 'A',
        followerGain: 500,
        resultingGrade: stats.traineeGrade,
        mentorSummary: `【考核暂缓】终审得分 ${finalScore} 分，虽有遗憾但实力进一步精进，继续冲刺！`,
      });

      onMarkWeeklyActionDone?.('weekly_trainee_eval');
      onNotify('⚠️ 出道终审暂未通过，扣除 20 点体力。请继续在练习室磨炼！');
    }
    if (passed) {
      onMarkWeeklyActionDone?.('weekly_trainee_eval');
    }
  };

  // Generate AI Random Monthly Survival Test Theme (刀群舞 / 创作竞赛 / 个人Live / 概念直拍)
  const handleGenerateSurvivalTest = async (forceRandom = true, themeIdOverride?: SurvivalTestThemeConfig['id']) => {
    if (isWeeklyEvalDone) {
      onNotify('本周已完成练习生评级考核，请等待下周重置！');
      return;
    }
    if (stats.stamina < 10) {
      onNotify('体力不足 10 点，请先休息补充体力后再参加练习生月度生存测试！');
      return;
    }

    const chosenTheme = forceRandom
      ? SURVIVAL_TEST_THEMES[Math.floor(Math.random() * SURVIVAL_TEST_THEMES.length)]
      : SURVIVAL_TEST_THEMES.find((t) => t.id === (themeIdOverride || selectedTestThemeId)) ||
        SURVIVAL_TEST_THEMES[0];

    setSelectedTestThemeId(chosenTheme.id);
    setIsGeneratingSurvivalTest(true);
    setSurvivalTestResult(null);

    try {
      const aiMission = await generateTraineeSurvivalMission({
        aiConfig,
        category: 'monthly_eval',
        stats,
        agencyName: agencyDisplayName,
        customTheme: `月度生存测试：${chosenTheme.name}（${chosenTheme.tag}）`,
        timeContext,
      });

      setSurvivalTestScenario({
        themeConfig: chosenTheme,
        aiTitle: aiMission.title || `【月度生存测试】${chosenTheme.name}`,
        aiBrief: aiMission.sceneDescription || chosenTheme.defaultBrief,
        aiMentorRule: aiMission.mentorPrompt || chosenTheme.mentorWarning,
        passThreshold: 68,
      });
    } catch {
      setSurvivalTestScenario({
        themeConfig: chosenTheme,
        aiTitle: `【月度生存测试】${chosenTheme.name}`,
        aiBrief: chosenTheme.defaultBrief,
        aiMentorRule: chosenTheme.mentorWarning,
        passThreshold: 68,
      });
    } finally {
      setIsGeneratingSurvivalTest(false);
    }
  };

  // Calculate Player Rating based on Attributes & Execution Mode, and Trigger Penalty / Elimination Edge if Low!
  const handleExecuteSurvivalTestRating = (
    executionMode: 'standard' | 'high_risk_burst' | 'simulate_low_grade'
  ) => {
    if (!survivalTestScenario) return;
    const { themeConfig } = survivalTestScenario;
    const baseAttrScore = themeConfig.computeBaseScore(stats);

    let finalScore = baseAttrScore;
    if (executionMode === 'standard') {
      // Standard attribute evaluation + slight stage performance bonus
      finalScore = Math.min(100, Math.round(baseAttrScore * 1.05 + 12));
    } else if (executionMode === 'high_risk_burst') {
      // High-difficulty challenge: if baseAttrScore >= 52, leaps to S/A; if low attributes, drops to C/F!
      finalScore =
        baseAttrScore >= 52
          ? Math.min(100, Math.round(baseAttrScore * 1.18 + 18))
          : Math.max(38, Math.round(baseAttrScore * 0.9 + 5));
    } else {
      // Low-state / mistake mode: forces C or F grade (< 65) to trigger Penalty / Elimination Edge sudden event!
      finalScore = Math.min(58, Math.max(42, Math.round(baseAttrScore * 0.72)));
    }

    const gradeLetter: 'S' | 'A' | 'B' | 'C' | 'F' =
      finalScore >= 88
        ? 'S'
        : finalScore >= 78
        ? 'A'
        : finalScore >= 68
        ? 'B'
        : finalScore >= 55
        ? 'C'
        : 'F';

    const isLowGrade = gradeLetter === 'C' || gradeLetter === 'F';

    const gradeTitleMap: Record<typeof gradeLetter, string> = {
      S: '👑 S级 · 全场断层第一 (晋升出道组Center)',
      A: '✨ A级 · 核心主力王牌 (安全晋级)',
      B: '🌿 B级 · 稳定达标通过 (保级成功)',
      C: '⚠️ C级 · 降班警告区 (触发【惩罚或淘汰边缘】突发事件！)',
      F: '🚨 F级 · 末位淘汰边缘 (触发【惩罚或淘汰边缘】突发事件！)',
    };

    const followerDelta =
      gradeLetter === 'S'
        ? 6800
        : gradeLetter === 'A'
        ? 4200
        : gradeLetter === 'B'
        ? 2000
        : -300;
    const progressDelta =
      gradeLetter === 'S'
        ? 16
        : gradeLetter === 'A'
        ? 11
        : gradeLetter === 'B'
        ? 6
        : -4;

    const nextProgress = Math.min(100, Math.max(0, stats.traineeProgress + progressDelta));
    const nextGrade = computeTraineeGrade(nextProgress, stats.agencyId || 'hybe', stats.isDebutedIdol);

    onUpdateStats({
      stamina: Math.max(0, stats.stamina - 10),
      traineeProgress: nextProgress,
      traineeGrade: nextGrade,
      snsFollowers: Math.max(0, stats.snsFollowers + followerDelta),
      vocalSkill: Math.min(100, vocal + (themeConfig.id === 'solo_live' ? 5 : 2)),
      danceSkill: Math.min(100, dance + (themeConfig.id === 'knife_dance' ? 5 : 2)),
      rapSkill: Math.min(100, rap + (themeConfig.id === 'songwriting' ? 5 : 2)),
      cameraSkill: Math.min(100, camera + (themeConfig.id === 'concept_fancam' ? 5 : 2)),
    });

    const summary = isLowGrade
      ? `在【${themeConfig.name}】中综合属性得分 ${finalScore} 分（${gradeLetter}级），低于安全线 68 分，当场触发【惩罚或淘汰边缘】突发危机！`
      : `在【${themeConfig.name}】中综合属性得分 ${finalScore} 分，斩获 ${gradeLetter} 级评价！出道进度 +${progressDelta}%，SNS涨粉 +${followerDelta.toLocaleString()}！`;

    setSurvivalTestResult({
      score: finalScore,
      gradeLetter,
      gradeTitle: gradeTitleMap[gradeLetter],
      isLowGrade,
      summary,
      followerDelta,
      progressDelta,
    });

    appendEvalRecord({
      id: `surv_${Date.now()}`,
      dateLabel: timeContext,
      missionTitle: survivalTestScenario.aiTitle,
      categoryLabel: `月度生存测试·${themeConfig.tag}`,
      finalScore,
      evalRank: gradeLetter === 'S' ? 'S+' : gradeLetter === 'A' ? 'S' : gradeLetter === 'B' ? 'A' : 'B+',
      followerGain: Math.max(0, followerDelta),
      resultingGrade: nextGrade,
      mentorSummary: summary,
    });

    onMarkWeeklyActionDone?.('weekly_trainee_eval');

    // Automatically pop up the Penalty / Elimination Edge Sudden Event when rating is low!
    if (isLowGrade) {
      setPenaltyOutcomeText(null);
      setActivePenaltyIncident(themeConfig.penaltyIncident);
    }
  };

  // Resolve Penalty / Elimination Edge Sudden Incident Choice
  const handleResolvePenaltyChoice = (
    choice: SurvivalTestThemeConfig['penaltyIncident']['choices'][0]
  ) => {
    const nextProgress = Math.min(
      100,
      Math.max(0, stats.traineeProgress + (choice.delta.traineeProgress || 0))
    );
    const nextGrade = computeTraineeGrade(nextProgress, stats.agencyId || 'hybe', stats.isDebutedIdol);

    onUpdateStats({
      vocalSkill: Math.min(100, vocal + (choice.delta.vocalSkill || 0)),
      danceSkill: Math.min(100, dance + (choice.delta.danceSkill || 0)),
      rapSkill: Math.min(100, rap + (choice.delta.rapSkill || 0)),
      cameraSkill: Math.min(100, camera + (choice.delta.cameraSkill || 0)),
      academics: Math.min(100, stats.academics + (choice.delta.academics || 0)),
      appearance: Math.min(100, stats.appearance + (choice.delta.appearance || 0)),
      social: Math.min(100, stats.social + (choice.delta.social || 0)),
      stamina: Math.min(100, Math.max(0, stats.stamina + (choice.delta.stamina || 0))),
      mood: Math.min(100, Math.max(0, stats.mood + (choice.delta.mood || 0))),
      snsFollowers: Math.max(0, stats.snsFollowers + (choice.delta.snsFollowers || 0)),
      darkIndex: Math.min(100, Math.max(0, stats.darkIndex + (choice.delta.darkIndex || 0))),
      traineeProgress: nextProgress,
      traineeGrade: nextGrade,
    });

    setPenaltyOutcomeText(choice.outcomeText);
  };

  const handleSignAgency = (agencyId: string) => {
    const ag = AGENCIES_DATA.find((a) => a.id === agencyId);
    if (!ag) return;
    const nextProg = Math.max(20, stats.traineeProgress);
    const nextGrade = computeTraineeGrade(nextProg, agencyId, stats.isDebutedIdol);
    onUpdateStats({
      agencyId,
      traineeProgress: nextProg,
      traineeGrade: nextGrade,
    });
    onNotify(`🎉 成功签约【${ag.name}】成为正式练习生！当前等级：${nextGrade}`);
  };

  // Launch AI-Assisted Survival Show Mission (Monthly Eval / Public Stage / Fan Meeting / Debut Combat)
  const handleLaunchAIMission = async (category: TraineeMissionCategory, presetTheme?: string) => {
    if (isWeeklyEvalDone) {
      onNotify('本周已完成练习生评级考核，请等待下周重置！');
      return;
    }
    const staminaCost = category === 'debut_combat' ? 18 : category === 'public_stage' ? 15 : 12;
    if (stats.stamina < staminaCost) {
      onNotify(`体力不足 ${staminaCost} 点，请先休息补充体力后再参加生存秀任务！`);
      return;
    }

    setIsGeneratingMission(true);
    setAiMissionResult(null);
    setCustomStageAction('');

    try {
      const mission = await generateTraineeSurvivalMission({
        aiConfig,
        category,
        stats,
        agencyName: agencyDisplayName,
        customTheme: presetTheme !== undefined ? presetTheme : customMissionTheme.trim() || undefined,
        timeContext,
      });

      onUpdateStats({
        stamina: Math.max(0, stats.stamina - staminaCost),
      });
      setActiveAIMission(mission);
    } catch (_e) {
      onNotify('生成生存秀任务时出现波动，请重试！');
    } finally {
      setIsGeneratingMission(false);
    }
  };

  // Resolve Player's Choice in AI Survival Show Mission
  const handleResolveAIMissionOption = (
    opt: TraineeSurvivalMission['options'][0],
    customTextOverride?: string
  ) => {
    if (!activeAIMission) return;

    const focusVal = (stats[opt.focusStat] as number) || avgFourDim;
    const rawScore = Math.min(100, Math.round(focusVal * 0.62 + opt.baseScoreBonus + (customTextOverride ? 5 : 0)));
    const evalRank: 'S+' | 'S' | 'A' | 'B+' =
      rawScore >= 90 ? 'S+' : rawScore >= 80 ? 'S' : rawScore >= 68 ? 'A' : 'B+';

    const rankMultiplier = evalRank === 'S+' ? 1.35 : evalRank === 'S' ? 1.15 : evalRank === 'A' ? 1.0 : 0.8;
    const baseFollowers = opt.effect.snsFollowers || 5500;
    const followerGain = Math.round(baseFollowers * rankMultiplier);
    const baseProg = opt.effect.traineeProgress || 14;
    const progressGain = Math.max(6, Math.round(baseProg * rankMultiplier));
    const coinsGain = Math.round((opt.effect.coins || 55000) * rankMultiplier);

    const prevGrade = stats.traineeGrade || computeTraineeGrade(stats.traineeProgress, stats.agencyId, stats.isDebutedIdol);
    const nextProgress = Math.min(100, stats.traineeProgress + progressGain);
    const nextGrade = computeTraineeGrade(nextProgress, stats.agencyId || 'hybe', stats.isDebutedIdol);

    onUpdateStats({
      vocalSkill: Math.min(100, vocal + (opt.effect.vocalSkill || 4)),
      danceSkill: Math.min(100, dance + (opt.effect.danceSkill || 4)),
      rapSkill: Math.min(100, rap + (opt.effect.rapSkill || 3)),
      cameraSkill: Math.min(100, camera + (opt.effect.cameraSkill || 5)),
      traineeProgress: nextProgress,
      traineeGrade: nextGrade,
      snsFollowers: stats.snsFollowers + followerGain,
      coins: stats.coins + coinsGain,
      mood: Math.min(100, Math.max(0, stats.mood + (opt.effect.mood || 10))),
      social: Math.min(100, stats.social + (opt.effect.social || 8)),
      appearance: Math.min(100, stats.appearance + (opt.effect.appearance || 3)),
    });

    const verdictText = customTextOverride
      ? `【临场高光发挥：“${customTextOverride}”】${opt.mentorVerdict}`
      : opt.mentorVerdict;

    appendEvalRecord({
      id: `rec_${Date.now()}`,
      dateLabel: timeContext,
      missionTitle: activeAIMission.title,
      categoryLabel: activeAIMission.categoryLabel,
      finalScore: rawScore,
      evalRank,
      followerGain,
      resultingGrade: nextGrade,
      mentorSummary: verdictText,
    });

    onMarkWeeklyActionDone?.('weekly_trainee_eval');

    setAiMissionResult({
      finalScore: rawScore,
      evalRank,
      mentorVerdict: verdictText,
      fanReaction: opt.fanReaction,
      followerGain,
      progressGain,
      coinsGain,
      previousGrade: prevGrade,
      newGrade: nextGrade,
    });
  };

  // Specialized Trainee Lesson + Triggers Trainee Sudden Incident Popup!
  const handleTraineeLesson = (
    lessonType: 'vocal' | 'dance' | 'rap' | 'camera',
    lessonName: string
  ) => {
    if (isWeeklyMentorTrainingDone) {
      onNotify('本周已完成导师特训（下周重置）！');
      return;
    }
    if (stats.stamina < 10) {
      onNotify('体力不足 10 点，请先休息补充体力后再来练习室特训！');
      return;
    }

    if (onTriggerActionEvent) {
      onTriggerActionEvent({
        actionCategory: 'trainee',
        actionName: `练习生导师特训：${lessonName}`,
        locationName: `${agencyDisplayName} · 地下练习室`,
        baseStaminaCost: 10,
        weeklyActionKey: 'weekly_trainee_mentor_training',
        extraContext: `专项特训课目：${lessonName}（主修方向：${lessonType}）`,
      });
      return;
    }

    onMarkWeeklyActionDone?.('weekly_trainee_mentor_training');
    const nextVocal = lessonType === 'vocal' ? Math.min(100, vocal + 6) : vocal;
    const nextDance = lessonType === 'dance' ? Math.min(100, dance + 6) : dance;
    const nextRap = lessonType === 'rap' ? Math.min(100, rap + 6) : rap;
    const nextCam = lessonType === 'camera' ? Math.min(100, camera + 6) : camera;
    const nextProg = Math.min(100, stats.traineeProgress + 4);

    onUpdateStats({
      vocalSkill: nextVocal,
      danceSkill: nextDance,
      rapSkill: nextRap,
      cameraSkill: nextCam,
      traineeProgress: nextProg,
      traineeGrade: computeTraineeGrade(nextProg, stats.agencyId, stats.isDebutedIdol),
      stamina: Math.max(0, stats.stamina - 10),
    });

    const randomIncident =
      TRAINEE_SUDDEN_INCIDENTS[
        Math.floor(Math.random() * TRAINEE_SUDDEN_INCIDENTS.length)
      ];
    setIncidentOutcome(null);
    setActiveIncident({
      ...randomIncident,
      tag: `🌟 ${lessonName} · 突发状况`,
    });
  };

  const handleResolveIncident = (opt: TraineeSuddenIncident['options'][0]) => {
    const nextProg = Math.min(100, stats.traineeProgress + (opt.effect.traineeProgress || 5));
    onUpdateStats({
      vocalSkill: Math.min(100, vocal + (opt.effect.vocalSkill || 0)),
      danceSkill: Math.min(100, dance + (opt.effect.danceSkill || 0)),
      rapSkill: Math.min(100, rap + (opt.effect.rapSkill || 0)),
      cameraSkill: Math.min(100, camera + (opt.effect.cameraSkill || 0)),
      appearance: Math.min(100, stats.appearance + (opt.effect.appearance || 0)),
      social: Math.min(100, stats.social + (opt.effect.social || 0)),
      mood: Math.min(100, Math.max(0, stats.mood + (opt.effect.mood || 0))),
      snsFollowers: stats.snsFollowers + (opt.effect.snsFollowers || 0),
      traineeProgress: nextProg,
      traineeGrade: computeTraineeGrade(nextProg, stats.agencyId, stats.isDebutedIdol),
    });
    setIncidentOutcome(opt.outcomeText);
  };

  // Start 3-Stage Classic Monthly Evaluation / Survival Show
  const handleStartEvaluation = (evStage: TraineeEvaluationStage) => {
    if (isWeeklyEvalDone) {
      onNotify('本周已完成练习生评级考核，请等待下周重置！');
      return;
    }
    if (stats.stamina < evStage.staminaCost) {
      onNotify(`参加【${evStage.title}】需要至少 ${evStage.staminaCost} 点体力！`);
      return;
    }
    onUpdateStats({
      stamina: Math.max(0, stats.stamina - evStage.staminaCost),
    });
    setEvalScore(avgFourDim);
    setEvalLogs([`📊 练习生四维基础综合分：${avgFourDim} 分`]);
    setEvalStage(1);
    setActiveEval(evStage);
  };

  const handleEvalStage1Concept = (
    concept: TraineeEvaluationStage['stage1Concepts'][0]
  ) => {
    const statVal = (stats[concept.statKey] as number) || 35;
    const extraBonus = Math.round(concept.bonusScore + statVal * 0.15);
    setEvalScore((prev) => prev + extraBonus);
    setEvalLogs((prev) => [
      ...prev,
      `🎵 选曲与定位：选择【${concept.name}】，专项契合度加分 +${extraBonus}分`,
    ]);
    setEvalStage(2);
  };

  const handleEvalStage2Crisis = (
    choice: TraineeEvaluationStage['stage2Crises'][0]['choices'][0]
  ) => {
    const finalScore = Math.min(100, evalScore + choice.bonusScore);
    setEvalScore(finalScore);
    setEvalLogs((prev) => [
      ...prev,
      `🔥 舞台神级救场：${choice.feedback} (制作人额外加分 +${choice.bonusScore}分)`,
    ]);

    const isGradeA = activeEval ? finalScore >= activeEval.minScoreForA : true;
    const progGain = isGradeA ? 15 : 8;
    const nextProg = Math.min(100, stats.traineeProgress + progGain);
    const nextGrade = computeTraineeGrade(nextProg, stats.agencyId || 'hybe', stats.isDebutedIdol);
    const coinsReward = activeEval
      ? isGradeA
        ? activeEval.rewardCoins
        : Math.round(activeEval.rewardCoins * 0.5)
      : 30000;
    const followerReward = activeEval
      ? isGradeA
        ? activeEval.rewardFollowers
        : Math.round(activeEval.rewardFollowers * 0.4)
      : 1500;

    onUpdateStats({
      vocalSkill: Math.min(100, vocal + (choice.effect.vocalSkill || 3)),
      danceSkill: Math.min(100, dance + (choice.effect.danceSkill || 3)),
      rapSkill: Math.min(100, rap + (choice.effect.rapSkill || 2)),
      cameraSkill: Math.min(100, camera + (choice.effect.cameraSkill || 4)),
      traineeProgress: nextProg,
      traineeGrade: nextGrade,
      coins: stats.coins + coinsReward,
      snsFollowers: stats.snsFollowers + followerReward,
      mood: Math.min(100, stats.mood + 10),
    });

    if (activeEval) {
      appendEvalRecord({
        id: `rec_${Date.now()}`,
        dateLabel: timeContext,
        missionTitle: activeEval.title,
        categoryLabel: '三阶段月末/选秀大考',
        finalScore,
        evalRank: finalScore >= 88 ? 'S+' : isGradeA ? 'S' : 'A',
        followerGain: followerReward,
        resultingGrade: nextGrade,
        mentorSummary: choice.feedback,
      });
    }

    onMarkWeeklyActionDone?.('weekly_trainee_eval');
    setEvalStage(3);
  };

  const activeThemeObj =
    SURVIVAL_TEST_THEMES.find((t) => t.id === selectedTestThemeId) || SURVIVAL_TEST_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#faf7f5] border-2 border-[#e6ced8] rounded-2xl max-w-4xl w-full max-h-[93vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620] relative">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#8c3b61] via-[#a84a75] to-[#732d4d] px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center justify-between text-white border-b border-pink-300/40 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold truncate">
                  {stats.isDebutedIdol ? '👑 K-Pop 顶流 Idol 演艺中心' : '练习生养成与生存测试中心'}
                </h2>
                <span className="bg-amber-300 text-[#3d1a2a] text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                  {stats.isDebutedIdol ? '👑 正式出道 Idol' : stats.traineeGrade || '未签约普通学生'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs Bar (Strict separation of Trainee vs Debuted Idol) */}
        <div
          className="bg-[#f4ecf0] border-b border-pink-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto overscroll-contain no-scrollbar shrink-0"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {stats.isDebutedIdol ? (
            /* Debuted Idol Tab Bar */
            <>
              <button
                onClick={() => setActiveTab('post_debut')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'post_debut'
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-300'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>👑 顶流Idol演艺中心</span>
              </button>

              <button
                onClick={() => setActiveTab('survival_ai')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'survival_ai'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>✨ 专属Live舞台与打歌</span>
              </button>

              <button
                onClick={() => setActiveTab('training')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'training'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5 shrink-0" />
                <span>🎙️ 顶级录音棚与声乐特训</span>
              </button>

              <button
                onClick={() => setActiveTab('monthly_eval')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'monthly_eval'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>📋 艺人星途档案({evalHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('survival_test')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'survival_test'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>🔥 现役艺人商业考核</span>
              </button>
            </>
          ) : (
            /* Strict Trainee Progression Tab Bar */
            <>
              <button
                onClick={() => setActiveTab('training')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'training'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>练习室 & 四大社签约</span>
              </button>

              <button
                onClick={() => setActiveTab('survival_test')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'survival_test'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>月度生存测试</span>
              </button>

              <button
                onClick={() => setActiveTab('survival_ai')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'survival_ai'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span>AI生存秀公演</span>
              </button>

              <button
                onClick={() => setActiveTab('monthly_eval')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'monthly_eval'
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-rose-950 border border-pink-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span>考核档案({evalHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('post_debut')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'post_debut'
                    ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-pink-600 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700 border border-stone-300'
                }`}
                title="企划社出道终审资格考核台：需达成全套严苛门槛方可触发终选战"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>🔒 企划社终审出道门槛</span>
              </button>
            </>
          )}
        </div>

        {/* Main Content Area (Scrollable) */}
        <div
          className="p-3 sm:p-5 pb-10 overflow-y-auto touch-scroll overscroll-contain space-y-4 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Debut Grade Progression Ladder & 4-Dim Bar (Now scrolls naturally with content) */}
          <div className="bg-[#f4ecf0] border border-pink-200 rounded-2xl p-3 space-y-2">
            {/* Debut Rank Ladder */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[11px] font-black text-rose-950 shrink-0">👑 出道阶梯：</span>
                {GRADE_LADDER.map((item, idx) => {
                  const isCurrent = stats.traineeGrade === item.grade;
                  const isUnlocked =
                    item.grade === 'S级·顶流C位出道'
                      ? Boolean(stats.isDebutedIdol)
                      : stats.traineeProgress >= item.minProgress;
                  return (
                    <React.Fragment key={item.grade}>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white ring-2 ring-amber-300 shadow-xs'
                            : isUnlocked
                            ? item.badge
                            : 'bg-stone-200/60 text-stone-400'
                        }`}
                        title={item.desc}
                      >
                        {item.grade === 'S级·顶流C位出道' && !stats.isDebutedIdol && (
                          <Lock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                        )}
                        <span>{item.grade}</span>
                        {isCurrent && <Check className="w-2.5 h-2.5 text-amber-200" />}
                      </span>
                      {idx < GRADE_LADDER.length - 1 && (
                        <span className="text-[10px] text-rose-300 font-bold">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="text-xs font-black text-rose-800 shrink-0">
                出道准备度：{stats.traineeProgress}/100
              </div>
            </div>

            {/* 4-Dimension Trainee Skill Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white/90 border border-pink-200 rounded-lg px-2.5 py-1.5">
                <div className="text-[11px] text-rose-800 font-bold flex items-center justify-between">
                  <span>🎤 声乐 Vocal</span>
                  <span className="font-black">{vocal}</span>
                </div>
                <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-rose-500" style={{ width: `${vocal}%` }} />
                </div>
              </div>

              <div className="bg-white/90 border border-pink-200 rounded-lg px-2.5 py-1.5">
                <div className="text-[11px] text-indigo-800 font-bold flex items-center justify-between">
                  <span>💃 舞蹈 Dance</span>
                  <span className="font-black">{dance}</span>
                </div>
                <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-indigo-500" style={{ width: `${dance}%` }} />
                </div>
              </div>

              <div className="bg-white/90 border border-pink-200 rounded-lg px-2.5 py-1.5">
                <div className="text-[11px] text-amber-900 font-bold flex items-center justify-between">
                  <span>⚡ 说唱 Rap</span>
                  <span className="font-black">{rap}</span>
                </div>
                <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-500" style={{ width: `${rap}%` }} />
                </div>
              </div>

              <div className="bg-white/90 border border-pink-200 rounded-lg px-2.5 py-1.5">
                <div className="text-[11px] text-fuchsia-800 font-bold flex items-center justify-between">
                  <span>📸 镜头感 Cam</span>
                  <span className="font-black">{camera}</span>
                </div>
                <div className="w-full h-1.5 bg-fuchsia-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-fuchsia-500" style={{ width: `${camera}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ==================== TAB 0: 【练习生月度生存测试】专属页面 ==================== */}
          {activeTab === 'survival_test' && (
            <div className="space-y-4">
              {/* Top Theme Generator Banner */}
              <div className="bg-gradient-to-r from-[#2e1624] via-[#4a1c36] to-[#361529] text-white rounded-2xl p-4 border-2 border-rose-400/60 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        SURVIVAL MONTHLY TEST
                      </span>
                      <span className="text-xs text-pink-200 font-bold">
                        综合安全分数线：68分（低于68分评为 C/F 级并触发【惩罚或淘汰边缘】突发事件）
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black mt-1 flex items-center gap-1.5">
                      <span>🔥 练习生月度生存测试 · AI随机主题考核台</span>
                    </h3>
                  </div>

                  <button
                    onClick={() => handleGenerateSurvivalTest(true)}
                    disabled={isGeneratingSurvivalTest || isWeeklyEvalDone}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-500 hover:to-rose-600 disabled:opacity-50 text-[#2b101d] hover:text-white cursor-pointer'
                    }`}
                  >
                    <Dice5 className={`w-4 h-4 ${isGeneratingSurvivalTest ? 'animate-spin' : ''}`} />
                    <span>
                      {isWeeklyEvalDone
                        ? '本周已完成（下周重置）'
                        : isGeneratingSurvivalTest
                        ? 'AI抽取生存考题中...'
                        : '🎲 AI随机抽取本月考核主题'}
                    </span>
                  </button>
                </div>

                {/* 4 Theme Cards Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {SURVIVAL_TEST_THEMES.map((theme) => {
                    const isSelected = selectedTestThemeId === theme.id;
                    const estBase = theme.computeBaseScore(stats);
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setSelectedTestThemeId(theme.id);
                          handleGenerateSurvivalTest(false, theme.id);
                        }}
                        className={`rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white text-[#2b2620] border-2 border-amber-300 shadow-md'
                            : 'bg-white/10 hover:bg-white/15 text-pink-100 border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-rose-600 text-white' : 'bg-white/20 text-amber-200'
                              }`}
                            >
                              {theme.tag}
                            </span>
                            <span
                              className={`text-[11px] font-black ${
                                isSelected ? 'text-rose-700' : 'text-amber-300'
                              }`}
                            >
                              基础分 {estBase}
                            </span>
                          </div>
                          <div className="font-black text-xs sm:text-sm mt-1.5">{theme.name}</div>
                          <div
                            className={`text-[10px] mt-1 leading-snug ${
                              isSelected ? 'text-[#6e5c4e]' : 'text-pink-200/80'
                            }`}
                          >
                            权重：{theme.weightsLabel}
                          </div>
                        </div>
                        <div
                          className={`mt-2 text-[10px] font-bold flex items-center justify-between pt-1.5 border-t ${
                            isSelected ? 'border-pink-200 text-rose-600' : 'border-white/10 text-amber-200'
                          }`}
                        >
                          <span>点击生成此主题考题</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active AI-Generated Survival Test Stage & Attribute Rating Calculator */}
              {!survivalTestScenario ? (
                <div className="bg-white border-2 border-dashed border-rose-300 rounded-2xl p-6 text-center space-y-3">
                  <div className="text-sm font-black text-rose-950">
                    尚未抽取本月生存测试考题 · 点击上方【🎲 AI随机抽取本月考核主题】或任一考核卡片开始！
                  </div>
                  <p className="text-xs text-[#6e5c4e] max-w-xl mx-auto">
                    系统将由 AI 辅助生成本月残酷生存考核题目（刀群舞同步率 / 72小时原创词曲竞赛 / 全开麦个人Live / 4K直拍概念消化），并根据你的实时属性计算 S/A/B/C/F 评级。若评级为 C 或 F，将当场触发【惩罚或淘汰边缘】突发事件！
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleGenerateSurvivalTest(true)}
                      disabled={isWeeklyEvalDone}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm ${
                        isWeeklyEvalDone
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white cursor-pointer'
                      }`}
                    >
                      <Dice5 className="w-4 h-4" />
                      <span>
                        {isWeeklyEvalDone ? '本周已完成（下周重置）' : '立即随机生成本月生存测试考题 (-10体力)'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setPenaltyOutcomeText(null);
                        setActivePenaltyIncident(activeThemeObj.penaltyIncident);
                      }}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>直接预览【{activeThemeObj.tag} · 惩罚或淘汰边缘】突发事件</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-rose-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black">
                          {survivalTestScenario.themeConfig.tag}
                        </span>
                        <span className="text-xs font-bold text-rose-800">
                          考核公式：{survivalTestScenario.themeConfig.weightsLabel}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-[#2b2620] mt-1">
                        {survivalTestScenario.aiTitle}
                      </h4>
                    </div>
                    <div className="text-right bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                      <div className="text-[10px] font-bold text-rose-700">当前属性加权基础分</div>
                      <div className="text-lg font-black text-rose-600">
                        {survivalTestScenario.themeConfig.computeBaseScore(stats)} 分
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#3d352b] leading-relaxed bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
                    {survivalTestScenario.aiBrief}
                  </p>

                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs font-bold text-amber-950 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{survivalTestScenario.aiMentorRule}</span>
                  </div>

                  {/* 3 Rating Calculation & Stage Execution Modes */}
                  <div className="space-y-2">
                    <div className="text-xs font-black text-rose-950">
                      请选择本次生存测试的登台发挥方式（根据当前属性计算最终评级）：
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <button
                        onClick={() => handleExecuteSurvivalTestRating('standard')}
                        className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-300 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-950">
                            🎯 稳健发挥 · 标准属性结算
                          </span>
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-emerald-900/80 mt-1">
                          按当前四维与体能属性稳定发挥（预计得分{' '}
                          {Math.min(
                            100,
                            Math.round(survivalTestScenario.themeConfig.computeBaseScore(stats) * 1.05 + 12)
                          )}{' '}
                          分）。
                        </p>
                      </button>

                      <button
                        onClick={() => handleExecuteSurvivalTestRating('high_risk_burst')}
                        className="p-3.5 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border-2 border-rose-300 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-950">
                            🔥 冲击S级 · 高难炫技考核
                          </span>
                          <Crown className="w-4 h-4 text-rose-600" />
                        </div>
                        <p className="text-[11px] text-rose-900/80 mt-1">
                          属性基础分≥52可直冲S级；若基础属性偏低则容易失误跌入C/F级触发惩罚！
                        </p>
                      </button>

                      <button
                        onClick={() => handleExecuteSurvivalTestRating('simulate_low_grade')}
                        className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-400 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-950">
                            ⚠️ 状态不佳失误 · 触发低评级危机
                          </span>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        </div>
                        <p className="text-[11px] text-amber-900/85 mt-1">
                          模拟带伤/高压失误拿 C/F 低评级，立即触发【惩罚或淘汰边缘】突发事件自救剧情！
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Rating Result Box */}
                  {survivalTestResult && (
                    <div
                      className={`rounded-2xl p-4 border-2 space-y-2 ${
                        survivalTestResult.isLowGrade
                          ? 'bg-rose-50 border-rose-500 text-rose-950'
                          : 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black">{survivalTestResult.gradeTitle}</span>
                        <span className="text-sm font-black px-2.5 py-0.5 rounded-full bg-white border">
                          考核得分：{survivalTestResult.score} / 100
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{survivalTestResult.summary}</p>
                      {survivalTestResult.isLowGrade && (
                        <button
                          onClick={() => {
                            setPenaltyOutcomeText(null);
                            setActivePenaltyIncident(survivalTestScenario.themeConfig.penaltyIncident);
                          }}
                          className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>打开【惩罚或淘汰边缘】突发危机自救弹窗</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 1: AI 生存秀任务与出道实战系统 ==================== */}
          {activeTab === 'survival_ai' && (
            <div className="space-y-4">
              {/* Custom Theme Input Bar for AI Survival Show Mission */}
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 border-2 border-pink-300 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                      <span>AI 练习生生存秀导演台 · 定制公演 / 粉丝见面会 / 出道实战企划</span>
                    </h3>
                    <p className="text-xs text-rose-800/85 mt-0.5">
                      可自由输入你想挑战的舞台概念或营业场景（留空则由AI根据当前四维属性智能命题）
                    </p>
                  </div>
                  <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-full border border-pink-200 text-rose-800">
                    所属：{agencyDisplayName}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customMissionTheme}
                    onChange={(e) => setCustomMissionTheme(e.target.value)}
                    placeholder="例如：弘大雨夜街头游击公演 / 制服清冷破碎感直拍 / 签售会逆应援宠粉..."
                    className="flex-1 bg-white border border-pink-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#2b2620] focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => handleLaunchAIMission('public_stage')}
                    disabled={isGeneratingMission || isWeeklyEvalDone}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm shrink-0 ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 text-amber-200 ${isGeneratingMission ? 'animate-spin' : ''}`} />
                    <span>
                      {isWeeklyEvalDone
                        ? '本周已完成（下周重置）'
                        : isGeneratingMission
                        ? 'AI导演生成舞台中...'
                        : '✨ AI生成生存秀任务'}
                    </span>
                  </button>
                </div>

                {/* Quick Concept Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-rose-800">热门企划词条：</span>
                  {[
                    'High-Teen学院风C位直拍',
                    '圣水洞初雪热可可逆应援粉丝见面会',
                    '全开麦消音海豚音打歌安可',
                    'Girl Crush黑天鹅概念公演',
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setCustomMissionTheme(tag)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white hover:bg-rose-100 text-rose-800 border border-pink-200 cursor-pointer transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Core Survival Show & Debut Combat Mission Modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. AI Monthly Evaluation */}
                <div className="bg-white border-2 border-sky-200 hover:border-sky-400 rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[11px] font-black">
                        📋 核心模块 1 · 月度评测
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">消耗 12 体力</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      【月度评测】AI 命题末位淘汰 & 晋升考
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      每月由制作人导师团针对你的声乐、刀群舞、说唱与镜头感进行突击抽考（如无垫音清唱、倍速随机舞蹈），决定 C→B→A→Center 等级晋升！
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        👑 出道进度 +12~18%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200">
                        📈 SNS涨粉 +3,000~5,000
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLaunchAIMission('monthly_eval')}
                    disabled={isGeneratingMission || isWeeklyEvalDone}
                    className={`mt-3.5 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-200" />
                    <span>{isWeeklyEvalDone ? '本周已完成（下周重置）' : '进入 AI 月度评测考场 ▶'}</span>
                  </button>
                </div>

                {/* 2. Survival Show Public Stage */}
                <div className="bg-white border-2 border-rose-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[11px] font-black">
                        🎤 核心模块 2 · 生存秀公演
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">消耗 15 体力</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      【生存秀公演】千人演播厅竞演 & 百万直拍战
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      登上 Mnet《PRODUCE 首尔女团》直播公演舞台！争夺 Killing Part 与 Ending 妖精特写，现场全民制作人实时投票，引爆韩网百万直拍！
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        👑 出道进度 +15~22%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200">
                        📈 SNS涨粉 +6,000~10,000
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLaunchAIMission('public_stage')}
                    disabled={isGeneratingMission || isWeeklyEvalDone}
                    className={`mt-3.5 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>{isWeeklyEvalDone ? '本周已完成（下周重置）' : '登上 AI 生存秀公演舞台 ▶'}</span>
                  </button>
                </div>

                {/* 3. Fan Meeting & Hi-Touch */}
                <div className="bg-white border-2 border-fuchsia-200 hover:border-fuchsia-400 rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900 text-[11px] font-black">
                        💝 核心模块 3 · 粉丝见面会
                      </span>
                      <span className="text-[11px] font-bold text-amber-700">消耗 12 体力</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      【粉丝见面会】Mini Fan Meeting & 站姐神图营业
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      举办练习生初披露线下粉丝见面会与签售会！应对粉丝点歌、逆应援礼物、站姐长枪短炮抓拍，神级宠粉营业让你的 SNS 死忠粉呈指数级暴涨！
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        👑 出道进度 +13~18%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200">
                        📈 SNS涨粉 +8,000~12,500
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLaunchAIMission('fan_meeting')}
                    disabled={isGeneratingMission || isWeeklyEvalDone}
                    className={`mt-3.5 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                  >
                    <Heart className="w-4 h-4 text-pink-200 fill-pink-200" />
                    <span>{isWeeklyEvalDone ? '本周已完成（下周重置）' : '开启 AI 粉丝见面会营业 ▶'}</span>
                  </button>
                </div>

                {/* 4. Debut Combat Showcase */}
                <div className="bg-gradient-to-br from-amber-50/80 via-white to-rose-50/80 border-2 border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[11px] font-black">
                        👑 核心模块 4 · 出道实战
                      </span>
                      <span className="text-[11px] font-bold text-amber-800">消耗 18 体力</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      【出道实战】打歌初舞台 Showcase & 一位安可战
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      终极出道实战演练！携主打曲登上《人气歌谣》打歌舞台，直面全韩观众最严苛的“一位候补无垫音全开麦安可”，冲击最高【S级·顶流C位出道】！
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                        👑 出道进度 +18~26%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
                        📈 SNS涨粉 +11,000~18,000
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLaunchAIMission('debut_combat')}
                    disabled={isGeneratingMission || isWeeklyEvalDone}
                    className={`mt-3.5 w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md ${
                      isWeeklyEvalDone
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-100" />
                    <span>{isWeeklyEvalDone ? '本周已完成（下周重置）' : '出战 AI 出道实战 Showcase ▶'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: 月度评测三阶段剧场 & 评测历史档案 ==================== */}
          {activeTab === 'monthly_eval' && (
            <div className="space-y-4">
              {/* Classic 3-Stage Monthly Evaluation & Survival Final */}
              <div className="bg-white border-2 border-rose-300 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-rose-600" />
                      <span>标准三阶段月度等级评测 & 出道夜总决赛（选曲定位 → 舞台事故救场 → 制作人亮分）</span>
                    </h3>
                    <p className="text-xs text-[#6e5c42] mt-0.5">
                      固定赛制三阶段深度考核，检验四维硬实力并赢取高额练习生奖金与直拍涨粉
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRAINEE_EVALUATIONS.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-gradient-to-br from-rose-50/70 to-pink-50/70 border border-rose-200 rounded-xl p-3.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-bold text-sm text-rose-950">{ev.title}</div>
                        <p className="text-xs text-rose-800/80 mt-1">{ev.subtitle}</p>
                        <div className="mt-2 text-[11px] font-bold text-emerald-800">
                          A级优胜津贴：+₩{ev.rewardCoins.toLocaleString()} · 直拍涨粉 +{ev.rewardFollowers.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEvaluation(ev)}
                        disabled={isWeeklyEvalDone}
                        className={`mt-3 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm ${
                          isWeeklyEvalDone
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white cursor-pointer'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>
                          {isWeeklyEvalDone
                            ? '本周已完成（下周重置）'
                            : `登台参加三阶段考核 (-${ev.staminaCost}体力)`}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Evaluation & Debut Combat History Log */}
              <div className="bg-white border border-pink-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>练习生【月度评测 & 出道实战】成长档案记录 ({evalHistory.length})</span>
                  </h3>
                  <span className="text-[11px] text-[#6e5c42]">
                    记录每一次舞台表现对出道等级与SNS人气的推动
                  </span>
                </div>

                {evalHistory.length === 0 ? (
                  <div className="text-center py-6 bg-rose-50/40 rounded-xl border border-dashed border-pink-200 text-xs text-[#7a7062]">
                    暂无月度评测或生存秀实战记录，快去参加一场【练习生月度生存测试】或【生存秀公演】吧！
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {evalHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-[#fcf9fa] border border-pink-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black">
                              {rec.evalRank}级 ({rec.finalScore}分)
                            </span>
                            <span className="text-[11px] font-bold text-rose-800">
                              [{rec.categoryLabel}]
                            </span>
                            <span className="text-xs font-black text-[#2b2620]">
                              {rec.missionTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5a5246] line-clamp-2">
                            {rec.mentorSummary}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <div className="text-[11px] font-black text-pink-700">
                            📱 SNS涨粉 +{rec.followerGain.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                            等级 → {rec.resultingGrade}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: 地下练习室特训 & 四大社签约 ==================== */}
          {activeTab === 'training' && (
            <div className="space-y-4">
              {/* 4 Specialized Training Lessons (Triggers Trainee Sudden Incident Popup!) */}
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 border border-pink-200 rounded-2xl p-3.5 space-y-3">
                <div>
                  <h3 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span>地下练习室专项特训（每次特训将触发【练习生专属突发事件弹窗】！）</span>
                  </h3>
                  <p className="text-xs text-rose-800/80 mt-0.5">
                    当前签约企划社：{currentAgency ? `${currentAgency.name} (${currentAgency.specialty})` : '自由练习生（可在下方选择四大社签约）'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => handleTraineeLesson('vocal', '高音真假音转换课')}
                    disabled={isWeeklyMentorTrainingDone}
                    className={`border rounded-xl p-3 text-left transition-all shadow-2xs group ${
                      isWeeklyMentorTrainingDone
                        ? 'bg-gray-100 border-gray-200 opacity-75 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-50/60 border-pink-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-rose-950">
                      <span className="flex items-center gap-1">
                        <Mic className="w-3.5 h-3.5 text-rose-500" /> 声乐高音课
                      </span>
                      <span className="text-[10px] text-rose-600">-10体力</span>
                    </div>
                    <p className="text-[11px] text-[#6e6456] mt-1">
                      打磨全开麦稳定的气息与高音，触发录音棚突发事件。
                    </p>
                    <div className={`mt-2 text-[11px] font-bold ${isWeeklyMentorTrainingDone ? 'text-gray-500' : 'text-rose-600 group-hover:translate-x-0.5 transition-transform'}`}>
                      {isWeeklyMentorTrainingDone ? '本周已完成（下周重置）' : '开始Vocal特训 ▶'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleTraineeLesson('dance', '刀群舞与身体控制课')}
                    disabled={isWeeklyMentorTrainingDone}
                    className={`border rounded-xl p-3 text-left transition-all shadow-2xs group ${
                      isWeeklyMentorTrainingDone
                        ? 'bg-gray-100 border-gray-200 opacity-75 cursor-not-allowed'
                        : 'bg-white hover:bg-indigo-50/60 border-pink-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-indigo-950">
                      <span className="flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-indigo-500" /> 刀群舞齐舞课
                      </span>
                      <span className="text-[10px] text-indigo-600">-10体力</span>
                    </div>
                    <p className="text-[11px] text-[#6e6456] mt-1">
                      高强度2倍速齐舞与核心控制，触发练习室突发事件。
                    </p>
                    <div className={`mt-2 text-[11px] font-bold ${isWeeklyMentorTrainingDone ? 'text-gray-500' : 'text-indigo-600 group-hover:translate-x-0.5 transition-transform'}`}>
                      {isWeeklyMentorTrainingDone ? '本周已完成（下周重置）' : '开始Dance特训 ▶'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleTraineeLesson('rap', 'Swag说唱与气场课')}
                    disabled={isWeeklyMentorTrainingDone}
                    className={`border rounded-xl p-3 text-left transition-all shadow-2xs group ${
                      isWeeklyMentorTrainingDone
                        ? 'bg-gray-100 border-gray-200 opacity-75 cursor-not-allowed'
                        : 'bg-white hover:bg-amber-50/60 border-pink-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-amber-950">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Rap与台风课
                      </span>
                      <span className="text-[10px] text-amber-700">-10体力</span>
                    </div>
                    <p className="text-[11px] text-[#6e6456] mt-1">
                      训练节奏Flow与女王控场气场，触发地下Battle事件。
                    </p>
                    <div className={`mt-2 text-[11px] font-bold ${isWeeklyMentorTrainingDone ? 'text-gray-500' : 'text-amber-700 group-hover:translate-x-0.5 transition-transform'}`}>
                      {isWeeklyMentorTrainingDone ? '本周已完成（下周重置）' : '开始Rap特训 ▶'}
                    </div>
                  </button>

                  <button
                    onClick={() => handleTraineeLesson('camera', '直拍Ending表情管理课')}
                    disabled={isWeeklyMentorTrainingDone}
                    className={`border rounded-xl p-3 text-left transition-all shadow-2xs group ${
                      isWeeklyMentorTrainingDone
                        ? 'bg-gray-100 border-gray-200 opacity-75 cursor-not-allowed'
                        : 'bg-white hover:bg-fuchsia-50/60 border-pink-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-fuchsia-950">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-fuchsia-500" /> 镜头表情管理
                      </span>
                      <span className="text-[10px] text-fuchsia-600">-10体力</span>
                    </div>
                    <p className="text-[11px] text-[#6e6456] mt-1">
                      练习抓红灯机位与绝美Ending妖精，触发站姐出圈事件。
                    </p>
                    <div className={`mt-2 text-[11px] font-bold ${isWeeklyMentorTrainingDone ? 'text-gray-500' : 'text-fuchsia-600 group-hover:translate-x-0.5 transition-transform'}`}>
                      {isWeeklyMentorTrainingDone ? '本周已完成（下周重置）' : '开始镜头特训 ▶'}
                    </div>
                  </button>
                </div>
              </div>

              {/* 4 Major Entertainment Agencies Contract Section */}
              <div>
                <div className="text-xs font-bold text-[#5a5246] mb-2">
                  四大娱乐企划社选拔签约（不同企划社提供专属津贴与特训加成）：
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {AGENCIES_DATA.map((ag) => {
                    const isSigned = stats.agencyId === ag.id;
                    return (
                      <div
                        key={ag.id}
                        className={`rounded-xl p-3 border flex flex-col justify-between ${
                          isSigned
                            ? 'bg-rose-50/60 border-2 border-rose-500 shadow-xs'
                            : 'bg-white border-[#d6cfc2]'
                        }`}
                      >
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${ag.badgeColor} text-white`}
                          >
                            {ag.styleTag}
                          </span>
                          <div className="font-bold text-xs sm:text-sm text-[#2b2620] mt-1.5">
                            {ag.name}
                          </div>
                          <div className="text-[10px] text-[#8c7b65] font-mono">{ag.koreanName}</div>
                          <p className="text-[11px] text-[#5a5246] mt-1 leading-snug">{ag.desc}</p>
                          <div className="text-[10px] font-bold text-rose-700 mt-1.5">
                            ★ {ag.specialty}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSignAgency(ag.id)}
                          disabled={isSigned}
                          className={`mt-2.5 w-full py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                            isSigned
                              ? 'bg-rose-500 text-white'
                              : 'bg-[#ede6dc] hover:bg-[#dfd5c7] text-[#3d352b]'
                          }`}
                        >
                          {isSigned ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> 当前所属企划社
                            </>
                          ) : (
                            '投递简历并签约'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: 🔒 出道考核门槛审核 (未出道状态) ==================== */}
          {activeTab === 'post_debut' && !stats.isDebutedIdol && (
            <div className="space-y-4">
              {/* Debut Locked Warning Header */}
              <div className="bg-gradient-to-r from-[#2c1227] via-[#481c3a] to-[#251020] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-pink-500/30">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-700 text-stone-200 text-[10px] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Idol 身份强制锁定中</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-300/40 text-rose-200 text-[10px] font-black">
                        当前身份：{stats.traineeGrade || 'C班练习生'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black mt-2 text-white flex items-center gap-2">
                      <span>🔒 K-Pop 正式 Idol 身份锁定 · 出道终审资格判定台</span>
                    </h3>
                    <p className="text-xs text-pink-100/80 mt-1 leading-relaxed">
                      偶像并非随意选择的标签，而是从数千名练习生中历经残酷筛选、突破重围斩获的唯一皇冠。未通过企划社终选出道判定前，严禁提前以 Idol 身份活动！
                    </p>
                  </div>
                </div>

                {/* Progression Flow Arrow */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-[11px] font-bold text-amber-200 mb-2">
                    📌 偶像单向严格进阶线：
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-[11px] text-white/90">
                    <span className={`px-2 py-1 rounded-lg ${!stats.agencyId ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/15'}`}>未签约普通学生</span>
                    <span>➜</span>
                    <span className={`px-2 py-1 rounded-lg ${stats.agencyId && stats.traineeGrade?.includes('D班') ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/15'}`}>D班基础练习生</span>
                    <span>➜</span>
                    <span className={`px-2 py-1 rounded-lg ${stats.traineeGrade?.includes('C班') ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/15'}`}>C班练习生</span>
                    <span>➜</span>
                    <span className={`px-2 py-1 rounded-lg ${stats.traineeGrade?.includes('B班') ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/15'}`}>B班潜力股</span>
                    <span>➜</span>
                    <span className={`px-2 py-1 rounded-lg ${stats.traineeGrade?.includes('A班') || stats.traineeGrade?.includes('出道预备组') ? 'bg-amber-400 text-stone-950 font-black' : 'bg-white/15'}`}>A班ACE/预备组</span>
                    <span>➜</span>
                    <span className="px-2 py-1 rounded-lg bg-rose-500/40 text-rose-200 font-bold border border-rose-400/50">月末选秀终审战</span>
                    <span>➜</span>
                    <span className="px-2 py-1 rounded-lg bg-stone-800 text-stone-400 border border-stone-600">👑 S级·正式出道Idol</span>
                  </div>
                </div>
              </div>

              {/* 6-Item Debut Requirements Checklist */}
              <div className="bg-white border-2 border-pink-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span>企划社官方出道考核门槛（达成全部条件方可触发终选）</span>
                    </h4>
                    <p className="text-xs text-[#73634e] mt-0.5">
                      四大社出道选拔极其严苛，缺一不可。考核通过后将全网发布新闻通告并举行出道庆典。
                    </p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-pink-100 text-pink-900">
                    {debutEligibility.isEligible ? '🌟 资格已全部达成' : '⚠️ 尚有条件未满足'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Item 1: Agency */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasAgency ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>1. 签约四大娱乐企划社</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{debutEligibility.hasAgency ? debutEligibility.agencyName : '未签约（普通学生）'}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasAgency ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasAgency ? '✅ 已签约' : '❌ 未签约'}
                    </span>
                  </div>

                  {/* Item 2: Grade Ladder */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasGrade ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>2. 阶级达到 A班ACE / 预备组 (进度 ≥ 70%)</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{stats.traineeGrade} (进度 {stats.traineeProgress}%)
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasGrade ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasGrade ? '✅ 已达标' : '❌ 未达标'}
                    </span>
                  </div>

                  {/* Item 3: Vocal */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasVocal ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>3. 声乐能力 Vocal ≥ 60 分</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{stats.vocalSkill || 0} / 60 分
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasVocal ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasVocal ? '✅ 已达标' : '❌ 未达标'}
                    </span>
                  </div>

                  {/* Item 4: Dance */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasDance ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>4. 舞蹈能力 Dance ≥ 60 分</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{stats.danceSkill || 0} / 60 分
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasDance ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasDance ? '✅ 已达标' : '❌ 未达标'}
                    </span>
                  </div>

                  {/* Item 5: Camera */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasCamera ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>5. 镜头表情管理 Camera ≥ 50 分</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{stats.cameraSkill || 0} / 50 分
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasCamera ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasCamera ? '✅ 已达标' : '❌ 未达标'}
                    </span>
                  </div>

                  {/* Item 6: Stamina */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    debutEligibility.hasStamina ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                  }`}>
                    <div>
                      <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>6. 出道考核体力储备 ≥ 20 点</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        当前：{stats.stamina} / 20 点
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      debutEligibility.hasStamina ? 'bg-emerald-200 text-emerald-950' : 'bg-rose-200 text-rose-950'
                    }`}>
                      {debutEligibility.hasStamina ? '✅ 体力充沛' : '❌ 体力不足'}
                    </span>
                  </div>
                </div>

                {/* Final Showcase Trigger Action Area */}
                <div className="pt-2">
                  {debutEligibility.isEligible ? (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-pink-50 border-2 border-amber-300 text-center space-y-2.5">
                      <div className="text-sm font-black text-[#3d1828]">
                        🌟 企划社董事会与总制作人已入座！考核准备就绪！
                      </div>
                      <p className="text-xs text-[#6e5340] max-w-lg mx-auto leading-relaxed">
                        你将站在全开麦立体考核舞台上，展示声乐高音、刀群舞齐舞与绝杀 Ending 妖精直拍！通过后将正式加冕【正式出道 Idol】并举办全韩出道庆典！
                      </p>
                      <button
                        onClick={handleExecuteDebutShowcase}
                        disabled={isExecutingDebutShowcase}
                        className="px-6 py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                      >
                        {isExecutingDebutShowcase ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>正在进行出道终审判定与导师评卷...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-200" />
                            <span>【💥 启动月末选秀出道终审实战（Final Debut Showcase）】</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-center space-y-2">
                      <div className="text-xs font-bold text-stone-600">
                        ⚠️ 尚未达成全部出道门槛。请前往【练习室 & 四大社】特训声乐与舞蹈，或参加【月度生存测试】提升评级！
                      </div>
                      <button
                        disabled
                        className="px-5 py-2.5 bg-stone-300 text-stone-500 font-bold text-xs rounded-xl cursor-not-allowed inline-flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>未达成出道条件 · 严禁以 Idol 身份提前活动</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Debut Showcase Result Card (if failed or just tested) */}
              {debutShowcaseResult && !debutShowcaseResult.passed && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-rose-900">
                      ⚠️ 出道终审评审结果：未达及格线（总分 {debutShowcaseResult.finalScore} / 68分）
                    </span>
                    <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
                      暂缓出道
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {debutShowcaseResult.narrative}
                  </p>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-xs italic text-rose-900">
                    💬 导师严厉点评：{debutShowcaseResult.mentorCritique}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 5: 👑 出道后·顶流爱豆演艺生涯 (Post-Debut Idol Career Center) ==================== */}
          {activeTab === 'post_debut' && stats.isDebutedIdol && (
            <div className="space-y-4">
              {/* Top Idol Status Banner */}
              <div className="bg-gradient-to-r from-[#2c1227] via-[#591c4d] to-[#3d1235] text-white rounded-2xl p-4 shadow-md border border-pink-400/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#2c1227] text-[11px] font-black">
                        👑 已正式C位出道 · 五代第一女团顶流Center
                      </span>
                      <span className="text-xs text-pink-200 font-bold">{agencyDisplayName} 旗下核心艺人</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black mt-1.5">
                      李秀妍 (SOOYEON) · 出道后艺人通告与回归企划中心
                    </h3>
                    <p className="text-xs text-pink-100/90 mt-0.5">
                      发行回归专辑冲击 Melon 实时一位、争夺四大打歌节目一位安可、接洽高奢全球代言与高尺巨蛋世巡！
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3.5 py-2 border border-white/15">
                    <div className="text-center">
                      <div className="text-lg font-black text-amber-300">{musicShowWins} 座</div>
                      <div className="text-[10px] text-pink-200">打歌一位奖杯</div>
                    </div>
                    <div className="h-7 w-px bg-white/20" />
                    <div className="text-center">
                      <div className="text-lg font-black text-rose-300">{releasedAlbums.length} 张</div>
                      <div className="text-[10px] text-pink-200">已发行专辑</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 1: Album Comeback Producer Workshop */}
              <div className="bg-white border-2 border-pink-300 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-rose-950 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-600" />
                      <span>💿 模块 1 · 制作并发行回归新专辑 (Comeback Album Studio)</span>
                    </h4>
                    <p className="text-xs text-[#6e5c42] mt-0.5">
                      定制回归概念与主打歌名，冲击 Melon 音源实时榜空降一位 (PAK) 与 Hanteo 首周百万初动销量！
                    </p>
                  </div>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
                    消耗 15 体力 · 高额版税分红
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    {
                      id: 'y2k',
                      name: '🐰 清纯Y2K校园风',
                      desc: '《Attention High》大众音源无敌，席卷全韩高中生歌单',
                      bonus: 'Melon空降加成',
                    },
                    {
                      id: 'crush',
                      name: '🐍 旷野金属Girl Crush',
                      desc: '《Supernova Queen》舞台炸裂，死忠粉实体专辑狂暴搬砖',
                      bonus: '百万初动销量加成',
                    },
                    {
                      id: 'royal',
                      name: '🦢 财阀千金芭蕾风',
                      desc: '《Love Dive Royal》优雅高贵，高奢时尚代言纷至沓来',
                      bonus: '高额商业分红加成',
                    },
                    {
                      id: 'selfprod',
                      name: '🔥 全能自作曲概念专',
                      desc: '《QueenCard (Prod.秀妍)》作词作曲全包揽，版权费翻倍',
                      bonus: '全制作人版权费翻倍',
                    },
                  ].map((cp) => (
                    <button
                      key={cp.id}
                      onClick={() => setSelectedAlbumConcept(cp.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedAlbumConcept === cp.id
                          ? 'bg-rose-50 border-2 border-rose-500 shadow-2xs'
                          : 'bg-[#fcf9fa] border-pink-200 hover:bg-rose-50/40'
                      }`}
                    >
                      <div className="text-xs font-black text-rose-950">{cp.name}</div>
                      <div className="text-[11px] text-[#5a5246] mt-1 leading-snug">{cp.desc}</div>
                      <div className="text-[10px] font-bold text-rose-600 mt-1.5">★ {cp.bonus}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={albumTitleInput}
                    onChange={(e) => setAlbumTitleInput(e.target.value)}
                    placeholder="输入回归主打曲/迷你专辑名称（如：《Seoul Blossom》《Crown Me》）..."
                    className="flex-1 bg-[#fcf9fa] border border-pink-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (stats.stamina < 15) {
                        onNotify('体力不足15点，先用手机点份外卖或休息一下再发专回归吧！');
                        return;
                      }
                      const title =
                        albumTitleInput.trim() ||
                        (selectedAlbumConcept === 'y2k'
                          ? '《First Snow in Seoul》'
                          : selectedAlbumConcept === 'crush'
                          ? '《HYPER NOVA》'
                          : selectedAlbumConcept === 'royal'
                          ? '《Royal Swan》'
                          : '《 Blooming (Prod. Sooyeon) 》');

                      const sales = Math.round(
                        480000 + avgFourDim * 9500 + stats.snsFollowers * 4.5 + (selectedAlbumConcept === 'crush' ? 350000 : 0)
                      );
                      const isPAK = avgFourDim >= 55 || stats.snsFollowers >= 15000;
                      const melonRank = isPAK ? 'Melon/Genie/Bugs 实时榜 #1 (达成 PAK 全杀!)' : 'Melon 实时榜 TOP 3 上位圈';
                      const royalty = Math.round(
                        180000 + (selectedAlbumConcept === 'selfprod' ? 160000 : 80000) + Math.min(250000, sales * 0.15)
                      );
                      const followerBoost = Math.round(14000 + avgFourDim * 120);

                      const newAlb = {
                        id: `alb_${Date.now()}`,
                        title,
                        concept: selectedAlbumConcept,
                        melonRank,
                        sales,
                        royalty,
                      };
                      const nextList = [newAlb, ...releasedAlbums];
                      setReleasedAlbums(nextList);
                      try {
                        localStorage.setItem('kr_idol_albums_v1', JSON.stringify(nextList));
                      } catch {}
                      setAlbumTitleInput('');

                      onUpdateStats({
                        stamina: Math.max(0, stats.stamina - 15),
                        coins: stats.coins + royalty,
                        snsFollowers: stats.snsFollowers + followerBoost,
                        traineeProgress: 100,
                        traineeGrade: 'S级·顶流C位出道',
                        vocalSkill: Math.min(100, vocal + 5),
                        danceSkill: Math.min(100, dance + 5),
                        cameraSkill: Math.min(100, camera + 6),
                        mood: Math.min(100, stats.mood + 15),
                      });

                      onNotify(
                        `💿 回归专辑 ${title} 正式发行！音源空降【${melonRank}】，首周Hanteo初动销量突破 ${sales.toLocaleString()} 张！入账版税分红 +₩${royalty.toLocaleString()}，涨粉 +${followerBoost.toLocaleString()}！`
                      );
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-700 hover:to-fuchsia-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>正式音源空降 & 发行回归专辑</span>
                  </button>
                </div>

                {releasedAlbums.length > 0 && (
                  <div className="bg-rose-50/60 border border-pink-200 rounded-xl p-3 space-y-1.5">
                    <div className="text-xs font-black text-rose-950">🏆 已发行回归专辑实绩榜：</div>
                    {releasedAlbums.slice(0, 4).map((a) => (
                      <div
                        key={a.id}
                        className="bg-white rounded-lg px-3 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border border-pink-100"
                      >
                        <span className="font-black text-[#2b2620]">{a.title}</span>
                        <span className="text-rose-600 font-bold">{a.melonRank}</span>
                        <span className="text-indigo-800 font-bold">初动 {a.sales.toLocaleString()} 张</span>
                        <span className="text-emerald-700 font-bold">分红 +₩{a.royalty.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Module 2: Music Show 1st Win & Encore Stage + Top Idol Schedules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Music Show 1st Place & Encore */}
                <div className="bg-gradient-to-br from-amber-50 via-white to-rose-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-950 text-[11px] font-black">
                        🏆 打歌舞台一位争夺战
                      </span>
                      <span className="text-xs font-bold text-amber-800">消耗 14 体力</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      四大打歌节目《人气歌谣 / 音乐银行》一位候补 & 安可生唱
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      携回归主打曲登上打歌放送舞台，实时结算音源+销量+直播投票分！夺得一位奖杯后立即开启【🎤 一位公约全开麦安可舞台】！
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (stats.stamina < 14) {
                        onNotify('体力不足14点，先补充体力再参加打歌放送吧！');
                        return;
                      }
                      const totalScore = Math.min(9990, 6800 + avgFourDim * 28 + Math.min(1200, Math.floor(stats.snsFollowers / 20)));
                      const nextWins = musicShowWins + 1;
                      setMusicShowWins(nextWins);
                      try {
                        localStorage.setItem('kr_idol_wins_v1', String(nextWins));
                      } catch {}
                      setActiveEncoreModal({
                        showName: nextWins % 2 === 1 ? 'SBS《人气歌谣》' : 'KBS《音乐银行》',
                        score: totalScore,
                      });
                    }}
                    className="mt-3.5 w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-100" />
                    <span>出演打歌舞台 · 冲击一位奖杯 & 安可Live ▶</span>
                  </button>
                </div>

                {/* Post-Debut Crisis / Paparazzi Event Trigger */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 border-2 border-purple-300 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-950 text-[11px] font-black">
                        🚨 顶流艺人突发公关剧场
                      </span>
                      <span className="text-xs font-bold text-purple-800">高情商逆转热搜</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-[#2b2620] mt-2">
                      【出道后突发事件】D社狗仔跟拍 / 黑粉恶评反击 / 颁奖礼神级救场
                    </h4>
                    <p className="text-xs text-[#5a5246] mt-1 leading-relaxed">
                      人红是非多！应对《Dispatch》校门口长焦偷拍、直播黑粉恶意带节奏、或红毯高跟鞋断跟危机，将公关危机化为吸粉封神现场！
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const crises = [
                        {
                          title: '📸 《Dispatch (D社)》突袭首尔女高校门口跟拍！',
                          desc: '放学时分，D社狗仔的长焦镜头突然从保姆车对面闪起！韩网论坛瞬间爆出热帖《顶流女团Center李秀妍放学后与神秘同校友人并肩同行》，公司公关部紧急来电询问你的回应方案！',
                          choices: [
                            {
                              text: '✨ 大方在Stargram晒出全班同学合照：“今天请1-1班死党们吃辣炒年糕啦！”',
                              outcome:
                                '你的坦荡与重情重义瞬间粉碎谣言！网友纷纷感叹“红了之后还对高中同桌这么好，简直是仙女本仙”，路人好感与粉丝暴涨！',
                              delta: { snsFollowers: 16000, social: 12, mood: 10, coins: 80000 },
                            },
                            {
                              text: '🎤 直接开Weverse直播素颜边写数学作业边辟谣，顺便清唱新歌宠粉！',
                              outcome:
                                '“女爱豆赶通告回来还要苦哈哈写高数卷子”的反差萌冲上热搜第一，直播间同时在线破百万！',
                              delta: { snsFollowers: 18500, academics: 6, vocalSkill: 5, coins: 95000 },
                            },
                          ],
                        },
                        {
                          title: '🔥 年末大赏直播舞台：耳返突然爆音断联 + 伴奏卡顿3秒！',
                          desc: '在全亚洲直播的年末大赏舞台中央，你的主耳返突然传来刺耳电流声随后彻底静音，紧接着现场伴奏竟卡顿了整整3秒！全场两万名观众屏住呼吸看向C位的你！',
                          choices: [
                            {
                              text: '👑 一把摘掉故障耳返甩在身后，直接无伴奏清唱飙出完美高音带动全场打拍子！',
                              outcome:
                                '封神名场面诞生！！你摘耳返清唱的4K直拍在YouTube播放破千万，被韩媒封为“五代教科书级舞台神迹”！',
                              delta: { snsFollowers: 26000, vocalSkill: 10, cameraSkill: 10, coins: 180000 },
                            },
                            {
                              text: '💃 用极具张力的即兴卡点独舞填满空白3秒，对镜头露出游刃有余的女王微笑！',
                              outcome:
                                '导播镜头疯狂特写你的神级临场反应，台下所有前辈艺人全体起立为你鼓掌！',
                              delta: { snsFollowers: 24000, danceSkill: 10, cameraSkill: 10, coins: 160000 },
                            },
                          ],
                        },
                      ];
                      setActivePostDebutCrisis(crises[Math.floor(Math.random() * crises.length)]);
                    }}
                    className="mt-3.5 w-full py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-200" />
                    <span>触发【出道后艺人公关/舞台突发事件】 ▶</span>
                  </button>
                </div>
              </div>

              {/* Module 3: 4 Top-Tier Post-Debut Schedules */}
              <div className="bg-white border border-pink-200 rounded-2xl p-4 space-y-3">
                <div className="text-sm font-black text-rose-950">
                  🌟 模块 3 · 顶流爱豆专属通告日程（综艺 / 高奢代言 / 高尺巨蛋演唱会 / 年末大赏）：
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'sch_variety',
                      title: '📺 录制国民综艺《Running Man & 认识的哥哥》',
                      desc: '展现满分综艺感与女高学霸反应力，录制片段霸榜Naver热搜前五！',
                      rewardText: '通告费 +₩140,000 · 涨粉 +9,500 · 社交+10',
                      delta: { coins: 140000, snsFollowers: 9500, social: 10, mood: 12, stamina: -12 },
                    },
                    {
                      id: 'sch_luxury',
                      title: '💎 官宣高奢品牌全球大使 & 《VOGUE》金九单人封面',
                      desc: '清潭洞与江南大路挂满你的巨幅地广，时尚表现力惊艳全球时尚圈！',
                      rewardText: '代言费 +₩380,000 · 涨粉 +18,000 · 外形+10',
                      delta: { coins: 380000, snsFollowers: 18000, appearance: 10, cameraSkill: 8, stamina: -12 },
                    },
                    {
                      id: 'sch_dome',
                      title: '🏟️ 首尔高尺巨蛋 (Gocheok Sky Dome) 万人世巡首站',
                      desc: '两万名粉丝挥舞应援棒汇成璀璨紫海，全场齐声合唱你的出道曲！',
                      rewardText: '巡演分红 +₩520,000 · 涨粉 +28,000 · 全实力+6',
                      delta: {
                        coins: 520000,
                        snsFollowers: 28000,
                        vocalSkill: 6,
                        danceSkill: 6,
                        rapSkill: 6,
                        cameraSkill: 8,
                        mood: 20,
                        stamina: -18,
                      },
                    },
                    {
                      id: 'sch_mama',
                      title: '👑 出席年末 MAMA / MMA 颁奖典礼 · 冲击【年度艺人Daesang】',
                      desc: '身着高定礼服走上红毯压轴登场，捧起K-POP最高荣耀年度大赏奖杯！',
                      rewardText: '大赏奖金 +₩600,000 · 涨粉 +35,000 · 传奇声望拉满',
                      delta: {
                        coins: 600000,
                        snsFollowers: 35000,
                        social: 18,
                        appearance: 10,
                        family: 12,
                        mood: 25,
                        stamina: -16,
                      },
                    },
                  ].map((sch) => (
                    <div
                      key={sch.id}
                      className="bg-[#fcf9fa] border border-pink-200 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-black text-[#2b2620]">{sch.title}</div>
                        <p className="text-[11px] text-[#5a5246] mt-1">{sch.desc}</p>
                        <div className="text-[11px] font-bold text-rose-700 mt-1.5">{sch.rewardText}</div>
                      </div>
                      <button
                        disabled={isAlreadyWorkedToday}
                        onClick={() => {
                          if (isAlreadyWorkedToday) {
                            onNotify('本周已完成（下周重置）！');
                            return;
                          }
                          if (stats.stamina < 12) {
                            onNotify('体力不足，先去休息或点外卖补充体力吧！');
                            return;
                          }
                          if (onRecordJobDone) onRecordJobDone();
                          if (onTriggerActionEvent) {
                            onTriggerActionEvent({
                              actionCategory: 'part_time',
                              actionName: sch.title,
                              locationName: '首尔演艺通告现场',
                              baseStaminaCost: 12,
                              weeklyActionKey: 'weekly_parttime_or_endorsement',
                              extraContext: `${sch.desc}（${sch.rewardText}）`,
                            });
                            return;
                          }
                          onMarkWeeklyActionDone?.('weekly_parttime_or_endorsement');
                          onUpdateStats({
                            ...sch.delta,
                            coins: stats.coins + (sch.delta.coins || 0),
                            snsFollowers: stats.snsFollowers + (sch.delta.snsFollowers || 0),
                            social: Math.min(100, stats.social + (sch.delta.social || 0)),
                            appearance: Math.min(100, stats.appearance + (sch.delta.appearance || 0)),
                            mood: Math.min(100, stats.mood + (sch.delta.mood || 0)),
                            stamina: Math.max(0, stats.stamina + (sch.delta.stamina || -12)),
                          });
                          onNotify(`🌟 成功完成顶流艺人通告【${sch.title}】！${sch.rewardText}！`);
                        }}
                        className={`mt-2.5 w-full py-1.5 rounded-lg text-xs font-bold ${
                          isAlreadyWorkedToday
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        }`}
                      >
                        {isAlreadyWorkedToday ? '本周已完成（下周重置）' : '执行艺人通告日程'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-Modal: Music Show 1st Win Encore Stage */}
              {activeEncoreModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                  <div className="bg-white border-2 border-amber-400 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-amber-950 text-xs font-black">
                        🏆 恭喜夺得 {activeEncoreModal.showName} 本周一位！
                      </span>
                      <span className="text-xs font-black text-rose-600">总分 {activeEncoreModal.score} 分</span>
                    </div>
                    <p className="text-xs text-[#3d352b] leading-relaxed">
                      漫天金色彩带落下，MC将沉甸甸的一位水晶奖杯递到你手中！伴奏音乐再次响起，全韩观众都在期待你的【一位公约全开麦安可舞台】，请选择你的安可营业方式：
                    </p>
                    <div className="space-y-2">
                      {[
                        {
                          label: '🧊 边含冰块边全开麦飙三段高音（实力封神！Vocal+8，涨粉+15,000，通告费+₩120,000）',
                          msg: '你在含着冰块的情况下依然唱出了CD级完美高音，消音安可视频登顶韩网热搜第一！',
                          delta: { vocalSkill: 8, snsFollowers: 15000, coins: 120000, stamina: -14 },
                        },
                        {
                          label: '🎀 穿首尔女高校服跳2倍速主题曲（青春无敌！Dance+8，涨粉+14,000，通告费+₩110,000）',
                          msg: '你穿着母校校服跳完超绝2倍速刀群舞，首尔女高全校师生都在为你欢呼！',
                          delta: { danceSkill: 8, snsFollowers: 14000, coins: 110000, stamina: -14 },
                        },
                        {
                          label: '💝 戴花环对镜头十连拍飞吻+感谢死忠粉（神颜暴击！Camera+10，涨粉+16,500，通告费+₩130,000）',
                          msg: '你的仙女落泪与飞吻安可直拍突破百万播放，死忠粉凝聚力达到顶峰！',
                          delta: { cameraSkill: 10, snsFollowers: 16500, coins: 130000, stamina: -14 },
                        },
                      ].map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onUpdateStats({
                              vocalSkill: Math.min(100, vocal + (opt.delta.vocalSkill || 0)),
                              danceSkill: Math.min(100, dance + (opt.delta.danceSkill || 0)),
                              cameraSkill: Math.min(100, camera + (opt.delta.cameraSkill || 0)),
                              snsFollowers: stats.snsFollowers + opt.delta.snsFollowers,
                              coins: stats.coins + opt.delta.coins,
                              stamina: Math.max(0, stats.stamina + opt.delta.stamina),
                              mood: Math.min(100, stats.mood + 15),
                            });
                            setActiveEncoreModal(null);
                            onNotify(`🏆 ${opt.msg}`);
                          }}
                          className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-left text-xs font-bold text-[#2b2620] cursor-pointer"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Modal: Post-Debut Crisis */}
              {activePostDebutCrisis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                  <div className="bg-white border-2 border-purple-400 rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl">
                    <div className="text-sm font-black text-purple-950">{activePostDebutCrisis.title}</div>
                    <p className="text-xs text-[#3d352b] leading-relaxed">{activePostDebutCrisis.desc}</p>
                    <div className="space-y-2">
                      {activePostDebutCrisis.choices.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onUpdateStats({
                              snsFollowers: stats.snsFollowers + (ch.delta.snsFollowers || 0),
                              coins: stats.coins + (ch.delta.coins || 0),
                              social: Math.min(100, stats.social + (ch.delta.social || 0)),
                              vocalSkill: Math.min(100, vocal + (ch.delta.vocalSkill || 0)),
                              danceSkill: Math.min(100, dance + (ch.delta.danceSkill || 0)),
                              cameraSkill: Math.min(100, camera + (ch.delta.cameraSkill || 0)),
                              academics: Math.min(100, stats.academics + (ch.delta.academics || 0)),
                              mood: Math.min(100, stats.mood + 12),
                            });
                            setActivePostDebutCrisis(null);
                            onNotify(`✨ 危机逆转成功：${ch.outcome}`);
                          }}
                          className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left text-xs font-bold text-purple-950 cursor-pointer"
                        >
                          {ch.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== SUB-POPUP 4: 【惩罚或淘汰边缘】突发事件弹窗 (Triggered on Low Survival Rating) ==================== */}
        {activePenaltyIncident && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5">
            <div className="bg-[#fcf8f8] border-2 border-rose-600 rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2.5">
                <span className="px-3 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>🚨 {activePenaltyIncident.crisisLevel}</span>
                </span>
                <span className="text-xs font-bold text-rose-800">
                  练习生月度生存测试 · 低评级突发惩罚事件
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-rose-950">
                {activePenaltyIncident.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#3d292e] leading-relaxed bg-rose-100/70 p-3.5 rounded-xl border border-rose-300">
                {activePenaltyIncident.sceneDesc}
              </p>

              <div className="bg-[#2b141c] text-rose-100 rounded-xl p-3 text-xs font-bold leading-relaxed border border-rose-500/40">
                🎙️ 导师严厉斥责：{activePenaltyIncident.mentorScold}
              </div>

              {!penaltyOutcomeText ? (
                <div className="space-y-2">
                  <div className="text-xs font-black text-rose-950">
                    身处淘汰与降班边缘，请选择你的绝境应对方案：
                  </div>
                  {activePenaltyIncident.choices.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResolvePenaltyChoice(ch)}
                      className="w-full text-left p-3 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-500 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-[13px] text-[#2b2620]">
                          {ch.text}
                        </span>
                        <ChevronRight className="w-4 h-4 text-rose-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="mt-1 text-[10px] font-black text-rose-700">
                        {ch.badge}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <div className="font-black text-emerald-800 mb-1">
                      🌟 淘汰边缘危机化解结果：
                    </div>
                    {penaltyOutcomeText}
                  </div>
                  <button
                    onClick={() => {
                      const msg = penaltyOutcomeText;
                      setActivePenaltyIncident(null);
                      setPenaltyOutcomeText(null);
                      onNotify(msg);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs sm:text-sm font-black cursor-pointer shadow-md"
                  >
                    擦干眼泪与汗水 · 返回练习生生存中心
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SUB-POPUP 3: AI 练习生生存秀 / 月度评测 / 粉丝见面会 / 出道实战弹窗 ==================== */}
        {activeAIMission && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5">
            <div className="bg-[#fcfaf7] border-2 border-rose-400 rounded-2xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto">
              {/* Broadcast Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    {activeAIMission.categoryLabel}
                  </span>
                  <span className="text-xs font-bold text-rose-800">
                    {activeAIMission.broadcastChannel}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-pink-700 bg-pink-100 px-2.5 py-0.5 rounded-full">
                  {activeAIMission.conceptTag}
                </span>
              </div>

              {/* Mission Title & Scene */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#2b2620]">
                  {activeAIMission.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#3d352b] leading-relaxed bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 mt-2">
                  {activeAIMission.sceneDescription}
                </p>
              </div>

              {/* Producer / Mentor Live Prompt */}
              <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 font-bold flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{activeAIMission.mentorPrompt}</span>
              </div>

              {/* Live Netizen & Fansite Bullet Comments */}
              {activeAIMission.liveNetizenComments && activeAIMission.liveNetizenComments.length > 0 && (
                <div className="bg-[#2b2228] text-pink-100 rounded-xl p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>韩网实时直播弹幕 & 站姐前线速报：</span>
                  </div>
                  {activeAIMission.liveNetizenComments.map((cmt, i) => (
                    <div key={i} className="text-[11px] text-pink-100/95 truncate">
                      💬 {cmt}
                    </div>
                  ))}
                </div>
              )}

              {/* Decision Options OR Final Result Settlement */}
              {!aiMissionResult ? (
                <div className="space-y-2.5">
                  <div className="text-xs font-black text-rose-950">
                    聚光灯与4K直拍镜头已锁定你，请选择你的舞台/营业高光表现：
                  </div>

                  {activeAIMission.options.map((opt, idx) => {
                    const statVal = (stats[opt.focusStat] as number) || avgFourDim;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleResolveAIMissionOption(opt)}
                        className="w-full text-left p-3 bg-white hover:bg-rose-50/80 border border-pink-200 hover:border-rose-500 rounded-xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs sm:text-[13px] text-[#2b2620]">
                            {opt.text}
                          </span>
                          <ChevronRight className="w-4 h-4 text-rose-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            侧重：{opt.focusLabel} (当前能力 {statVal})
                          </span>
                          <span className="text-pink-700">
                            预计涨粉 +{(opt.effect.snsFollowers || 5500).toLocaleString()}
                          </span>
                          <span className="text-emerald-700">
                            出道进度 +{opt.effect.traineeProgress || 14}%
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Optional Custom Player Stage Improvisation */}
                  <div className="pt-2 border-t border-pink-200">
                    <div className="text-[11px] font-bold text-[#5a5246] mb-1.5">
                      💡 或者自由输入你的临场即兴发挥 / 宠粉互动台词（额外获得 +5 舞台表现分）：
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customStageAction}
                        onChange={(e) => setCustomStageAction(e.target.value)}
                        placeholder="输入你的即兴舞台动作、海豚音炫技或对粉丝说的话..."
                        className="flex-1 bg-white border border-pink-300 rounded-xl px-3 py-1.5 text-xs text-[#2b2620]"
                      />
                      <button
                        onClick={() => {
                          if (!customStageAction.trim()) return;
                          handleResolveAIMissionOption(
                            activeAIMission.options[0],
                            customStageAction.trim()
                          );
                        }}
                        disabled={!customStageAction.trim()}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>即兴登台</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-pink-50 border-2 border-rose-400 rounded-2xl p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-black">
                          最终舞台评级：{aiMissionResult.evalRank} 级
                        </span>
                        <span className="text-sm font-black text-rose-900">
                          综合得分：{aiMissionResult.finalScore} 分
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                        出道等级：{aiMissionResult.previousGrade} → {aiMissionResult.newGrade}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-[#2b2620] leading-relaxed">
                      <span className="font-black text-rose-800">🎙️ 制作人亮分点评：</span>
                      {aiMissionResult.mentorVerdict}
                    </div>

                    <div className="text-xs sm:text-sm text-[#2b2620] leading-relaxed">
                      <span className="font-black text-pink-700">🔥 韩网与粉丝反响：</span>
                      {aiMissionResult.fanReaction}
                    </div>

                    <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-black">
                      <span className="text-pink-700">
                        📱 Stargram 涨粉：+{aiMissionResult.followerGain.toLocaleString()} 名新粉丝
                      </span>
                      <span className="text-emerald-800">
                        👑 出道准备度：+{aiMissionResult.progressGain}% · 通告结算 +₩{aiMissionResult.coinsGain.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const summaryMsg = `完成【${activeAIMission.title}】获 ${aiMissionResult.evalRank} 级（${aiMissionResult.finalScore}分），SNS涨粉 +${aiMissionResult.followerGain.toLocaleString()}，当前等级：${aiMissionResult.newGrade}！`;
                      setActiveAIMission(null);
                      setAiMissionResult(null);
                      onNotify(summaryMsg);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md cursor-pointer"
                  >
                    收下鲜花与热搜荣耀 · 返回练习生中心
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SUB-POPUP 1: 练习生专属突发事件弹窗 ==================== */}
        {activeIncident && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
            <div className="bg-[#fcfaf5] border-2 border-rose-400 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black">
                  {activeIncident.tag}
                </span>
                <span className="text-xs font-bold text-rose-700">
                  {currentAgency?.name || '企划社地下练习室'}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-[#2b2620]">
                {activeIncident.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#3d352b] leading-relaxed bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
                {activeIncident.sceneDesc}
              </p>

              {!incidentOutcome ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#5a5246]">
                    面对练习室突发状况，你的选择是：
                  </div>
                  {activeIncident.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResolveIncident(opt)}
                      className="w-full text-left p-3 bg-white hover:bg-rose-50 border border-[#cfc7b8] hover:border-rose-500 rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <span>{opt.text}</span>
                      <ChevronRight className="w-4 h-4 text-rose-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <div className="font-bold text-emerald-800 mb-1">🌟 特训事件反馈：</div>
                    {incidentOutcome}
                  </div>
                  <button
                    onClick={() => {
                      setActiveIncident(null);
                      setIncidentOutcome(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    收起毛巾继续努力
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SUB-POPUP 2: 月末评价 & 选秀三阶段舞台剧场弹窗 ==================== */}
        {activeEval && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
            <div className="bg-[#fcfaf5] border-2 border-pink-400 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-pink-200 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-rose-700">
                    🎤 {activeEval.title}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#2b2620] mt-0.5">
                    {evalStage === 1
                      ? '第一阶段：选择竞演曲风概念与Part定位'
                      : evalStage === 2
                      ? '第二阶段：舞台突发危机应对！'
                      : '第三阶段：总制作人点评与等级晋升揭晓'}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#7a7062]">舞台实时表现分</div>
                  <div className="text-xl font-black text-rose-600">{evalScore}分</div>
                </div>
              </div>

              {evalStage === 1 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[#5a5246]">
                    请选择本次登台的竞演概念曲目（对应不同四维属性加成）：
                  </div>
                  {activeEval.stage1Concepts.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEvalStage1Concept(c)}
                      className="w-full text-left p-3.5 bg-white hover:bg-rose-50 border border-pink-200 hover:border-rose-500 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-rose-950">{c.name}</div>
                        <div className="text-[11px] text-[#6e6456] mt-0.5">{c.desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {evalStage === 2 && (() => {
                const crisis = activeEval.stage2Crises[0];
                return (
                  <div className="space-y-3">
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-1.5">
                      <div className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{crisis.crisisTitle}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                        {crisis.crisisDesc}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {crisis.choices.map((ch, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleEvalStage2Crisis(ch)}
                          className="w-full text-left p-3 bg-white hover:bg-rose-50 border border-pink-200 hover:border-rose-500 rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between cursor-pointer"
                        >
                          <span>{ch.text}</span>
                          <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {evalStage === 3 && (() => {
                const isGradeA = evalScore >= activeEval.minScoreForA;
                return (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-300 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-900">
                          {isGradeA ? '👑 考核评级：A+ 级 (全场第一 Center！)' : '✨ 考核评级：B+ 级 (稳步晋升)'}
                        </span>
                        <span className="text-sm font-black text-rose-600">
                          总评：{evalScore} 分
                        </span>
                      </div>
                      <div className="text-xs text-[#3d352b] space-y-1">
                        {evalLogs.map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-rose-200 text-xs font-bold text-emerald-800">
                        🎁 当前练习生等级：{stats.traineeGrade} (出道进度 {stats.traineeProgress}%)
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveEval(null);
                        onNotify(`完成了【${activeEval.title}】，评级晋升为 ${stats.traineeGrade}！`);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      鞠躬谢幕返回练习室
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ==================== SUB-POPUP 4: 👑 K-Pop 顶流 Idol 出道专属庆典与新闻通告 ==================== */}
        {showDebutCelebrationModal && debutShowcaseResult && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="bg-gradient-to-b from-[#2b1025] via-[#1a0817] to-[#0f040e] border-2 border-amber-400/90 rounded-3xl max-w-2xl w-full p-5 sm:p-7 text-white shadow-2xl space-y-4 relative overflow-hidden">
              {/* Golden Ambient Glow & Stars */}
              <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Breaking News Ribbon */}
              <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                    NAVER / THEQOO 全网爆点头条 #1
                  </span>
                  <span className="text-xs text-amber-200/90 font-bold">
                    【独家官方通告】
                  </span>
                </div>
                <span className="text-xs text-rose-300 font-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>K-POP 历史性时刻</span>
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 leading-snug">
                  🎉【官方通告】四大娱乐企划社新一代女团核心 C 位正式揭晓——首尔女高李秀妍全票通过终审！
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  经过长达数百天魔鬼训练与残酷月末末位淘汰，首尔女子高中李秀妍（SOOYEON）在全开麦出道终选大考中，凭借震撼全场的稳定三段高音与绝杀 Ending 妖精直拍斩获评审团 S+ 评级，全票加冕【正式出道 Idol】！
                </p>
              </div>

              {/* Debut Certificate Card */}
              <div className="bg-white/10 border border-amber-400/40 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-xl shadow-md">
                      👑
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        {agencyDisplayName} · 核心艺人
                      </div>
                      <div className="text-base font-black text-white">
                        李秀妍 (SOOYEON) · S级顶流Center
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-300">出道终审总分</div>
                    <div className="text-xl font-black text-rose-300">{debutShowcaseResult.finalScore} / 100 分</div>
                  </div>
                </div>

                {/* 3 Skill Score Chips */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
                  <div className="bg-black/30 p-1.5 rounded-lg">
                    <div className="text-[10px] text-pink-300">声乐 Vocal</div>
                    <div className="text-xs font-black text-white">{debutShowcaseResult.vocalScore} 分</div>
                  </div>
                  <div className="bg-black/30 p-1.5 rounded-lg">
                    <div className="text-[10px] text-indigo-300">舞蹈 Dance</div>
                    <div className="text-xs font-black text-white">{debutShowcaseResult.danceScore} 分</div>
                  </div>
                  <div className="bg-black/30 p-1.5 rounded-lg">
                    <div className="text-[10px] text-amber-300">镜头 Camera</div>
                    <div className="text-xs font-black text-white">{debutShowcaseResult.cameraScore} 分</div>
                  </div>
                </div>

                {/* Mentor Critique */}
                <div className="bg-black/40 p-2.5 rounded-xl border border-amber-300/20 text-xs italic text-amber-100">
                  💬 总制作人亲笔出道寄语：{debutShowcaseResult.mentorCritique}
                </div>
              </div>

              {/* Unlocked Idol Perks */}
              <div className="bg-gradient-to-r from-amber-950/60 to-rose-950/60 border border-amber-500/40 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="font-bold text-amber-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>正式加冕【正式出道 Idol】· 已解锁四大专属后续玩法：</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-200 pt-1">
                  <div>💿 录制制作新专辑（冲击 Melon 实时 1 位 PAK 破表）</div>
                  <div>🏆 参加四大台打歌节目（争夺 1 位安可奖杯）</div>
                  <div>💎 接洽高奢顶级时尚品牌全球代言（Dior / Chanel）</div>
                  <div>🏟️ 举办全球巨蛋巡回演唱会（首尔高尺巨蛋世巡）</div>
                </div>
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-amber-300">
                  <span>💰 获得企划社出道签约金：+300,000 ₩</span>
                  <span>📱 全网粉丝风暴：SNS 死忠粉 +35,000</span>
                </div>
              </div>

              {/* Enter Post-Debut Button */}
              <button
                onClick={() => {
                  setShowDebutCelebrationModal(false);
                  setActiveTab('post_debut');
                  onNotify('👑 欢迎迈入顶级爱豆生涯！已解锁新专辑回归与打歌打榜演艺中心！');
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 hover:from-amber-500 hover:to-fuchsia-700 text-stone-950 font-black text-sm rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>【👑 正式开启 K-Pop 顶流爱豆生涯（前往演艺中心）】</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
