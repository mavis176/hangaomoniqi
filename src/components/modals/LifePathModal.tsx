import React, { useState } from 'react';
import {
  X,
  Crown,
  Sparkles,
  GraduationCap,
  Music,
  Gem,
  Award,
  Heart,
  Baby,
  Briefcase,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Tv,
  Disc3,
  Coffee,
  Building2,
  BookOpen,
  Wine,
  Plane,
  Lock,
} from 'lucide-react';
import {
  GameStats,
  NPCClassmate,
  LifePathType,
  IdolCareerState,
  UniversityCareerState,
  ChaebolWifeState,
} from '../../types';
import {
  initialIdolCareerState,
  initialUniversityCareerState,
  initialChaebolWifeState,
  UNIVERSITY_CAREER_TRACKS,
  POTENTIAL_SPOUSE_OPTIONS,
} from '../../data/lifePathData';
import { generateLifePathStory } from '../../services/aiService';

interface LifePathModalProps {
  onClose: () => void;
  stats: GameStats;
  npcs: NPCClassmate[];
  onOpenEndings: () => void;
  onNotify: (msg: string) => void;
}

export const LifePathModal: React.FC<LifePathModalProps> = ({
  onClose,
  stats,
  npcs,
  onOpenEndings,
  onNotify,
}) => {
  // Current view or active life path
  const [selectedTab, setSelectedTab] = useState<LifePathType | 'overview'>('overview');

  // Path States
  const [idolState, setIdolState] = useState<IdolCareerState>(() => {
    try {
      const saved = localStorage.getItem('kr_lifepath_idol_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      ...initialIdolCareerState,
      liveSkill: Math.max(75, Math.min(99, stats.vocalSkill + 10)),
      cfValueScore: Math.max(70, Math.min(99, stats.appearance + 5)),
      fansCount: Math.max(800000, stats.snsFollowers * 5),
    };
  });

  const [uniState, setUniState] = useState<UniversityCareerState>(() => {
    try {
      const saved = localStorage.getItem('kr_lifepath_uni_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      ...initialUniversityCareerState,
      gpa: Math.min(4.5, Number((3.6 + (stats.academics / 100) * 0.85).toFixed(2))),
    };
  });

  const [chaebolState, setChaebolState] = useState<ChaebolWifeState>(() => {
    try {
      const saved = localStorage.getItem('kr_lifepath_chaebol_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      ...initialChaebolWifeState,
      skinCareBeauty: Math.max(85, stats.appearance + 5),
    };
  });

  // Comeback input modal state
  const [showComebackPlanner, setShowComebackPlanner] = useState<boolean>(false);
  const [albumTitleInput, setAlbumTitleInput] = useState<string>('《QUEENDOM : 盛宴》');
  const [albumConcept, setAlbumConcept] = useState<string>('清冷拽姐 Girl Crush');

  // AI Story Generation in progress
  const [isGeneratingStory, setIsGeneratingStory] = useState<boolean>(false);
  const [currentAiStory, setCurrentAiStory] = useState<{
    title: string;
    story: string;
    headline: string;
    netizenReactions: string[];
    statSummary?: string;
  } | null>(null);

  // Helper to persist life path data
  const persistState = (
    newIdol?: IdolCareerState,
    newUni?: UniversityCareerState,
    newChaebol?: ChaebolWifeState
  ) => {
    if (newIdol) {
      setIdolState(newIdol);
      localStorage.setItem('kr_lifepath_idol_state', JSON.stringify(newIdol));
    }
    if (newUni) {
      setUniState(newUni);
      localStorage.setItem('kr_lifepath_uni_state', JSON.stringify(newUni));
    }
    if (newChaebol) {
      setChaebolState(newChaebol);
      localStorage.setItem('kr_lifepath_chaebol_state', JSON.stringify(newChaebol));
    }
  };

  // Trigger specialized AI story generator
  const triggerAIStory = async (pathType: LifePathType, actionTitle: string, contextInfo: string) => {
    setIsGeneratingStory(true);
    setCurrentAiStory(null);
    try {
      const data = await generateLifePathStory({
        pathType,
        actionTitle,
        contextInfo,
        protagonistName: '李秀妍',
      });
      if (data && data.story) {
        setCurrentAiStory({
          title: data.title || `【${actionTitle}】后续新发展`,
          story: data.story,
          headline: data.headline || '[NEWS] 韩国演艺与名流界热议新动态',
          netizenReactions: data.netizenReactions || ['实力太顶了！', '名副其实天花板！'],
          statSummary: data.statSummary,
        });
        onNotify(`✨ 成功生成【${actionTitle}】专属人生进阶篇章剧情！`);
      }
    } catch {
      onNotify('AI 生成遇到波动，已切换为经典高画质剧情物语！');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // -------------------------------------------------------------
  // IDOL PATH ACTIONS
  // -------------------------------------------------------------
  const handleLaunchComeback = () => {
    const isSuccess = Math.random() < 0.85;
    const firstWeekSales = Math.floor(750000 + Math.random() * 450000);
    const melonRank = isSuccess ? 1 : Math.floor(Math.random() * 3 + 2);
    const wins = melonRank === 1 ? Math.floor(5 + Math.random() * 6) : 3;

    const newAlbum = {
      id: `alb_${Date.now()}`,
      title: albumTitleInput || '《SUPERSTAR : 加冕》',
      concept: albumConcept,
      salesFirstWeek: firstWeekSales,
      melonPeakRank: melonRank,
      musicShowWins: wins,
      reviewScore: `打歌斩获${wins}连冠！全开麦安可直拍播放量破千万，登顶Melon实时榜第${melonRank}位！`,
    };

    const updated: IdolCareerState = {
      ...idolState,
      fansCount: idolState.fansCount + Math.floor(firstWeekSales * 0.35),
      melonChartIndex: Math.min(100, idolState.melonChartIndex + 6),
      liveSkill: Math.min(99, idolState.liveSkill + 3),
      cfValueScore: Math.min(99, idolState.cfValueScore + 4),
      mentalStress: Math.min(95, idolState.mentalStress + 8),
      albums: [newAlbum, ...idolState.albums],
      historyLogs: [
        `正式发布新专${newAlbum.title}（${newAlbum.concept}），首周实体狂卖${(firstWeekSales / 10000).toFixed(1)}万张，包揽音乐节目${wins}个1位！`,
        ...idolState.historyLogs,
      ],
    };

    persistState(updated);
    setShowComebackPlanner(false);
    onNotify(`🎤 回归大捷！新专拿下音乐节目 ${wins} 冠王，全开麦直拍引爆韩网热搜！`);
    triggerAIStory(
      'idol',
      `发行新专辑《${newAlbum.title}》斩获一位`,
      `概念：${albumConcept}，首周销量：${firstWeekSales}张，音乐节目获得${wins}个一位`
    );
  };

  const handleWorldTour = () => {
    const gainFans = Math.floor(250000 + Math.random() * 150000);
    const updated: IdolCareerState = {
      ...idolState,
      fansCount: idolState.fansCount + gainFans,
      worldToursDone: idolState.worldToursDone + 1,
      liveSkill: Math.min(99, idolState.liveSkill + 5),
      cfValueScore: Math.min(99, idolState.cfValueScore + 5),
      mentalStress: Math.min(90, idolState.mentalStress + 12),
      historyLogs: [
        `成功完成第${idolState.worldToursDone + 1}次全球巨蛋巡回演唱会（首尔高尺巨蛋/东京巨蛋/洛杉矶站），门票1秒售罄！`,
        ...idolState.historyLogs,
      ],
    };
    persistState(updated);
    onNotify('🎪 巨蛋世界巡回圆满收官！两万名粉丝全场粉紫星海大合唱，天生巨星！');
    triggerAIStory(
      'idol',
      `第${updated.worldToursDone}次全球巡回演唱会全场售罄`,
      `巡演地点：首尔高尺巨蛋与海外场馆，新增粉丝：${gainFans}人，舞台全开麦统治力拉满`
    );
  };

  const handleVarietyShow = () => {
    const updated: IdolCareerState = {
      ...idolState,
      fansCount: idolState.fansCount + 90000,
      cfValueScore: Math.min(99, idolState.cfValueScore + 3),
      mentalStress: Math.max(10, idolState.mentalStress - 5),
      historyLogs: [
        '作为特邀嘉宾常驻《Running Man》撕名牌与《出差十五夜》，幽默机智且真诚，获封“国民好感度女爱豆”！',
        ...idolState.historyLogs,
      ],
    };
    persistState(updated);
    onNotify('📺 热门综艺播出后好评如潮！国民认知度与品牌身价直线上升！');
  };

  const handleHandleCrisisPR = () => {
    const updated: IdolCareerState = {
      ...idolState,
      scandalIndex: Math.max(0, idolState.scandalIndex - 12),
      fansCount: idolState.fansCount + 120000,
      mentalStress: Math.max(15, idolState.mentalStress - 15),
      cfValueScore: Math.min(99, idolState.cfValueScore + 6),
      historyLogs: [
        '面对D社捕风捉影的绯闻与黑通稿，凭借教科书级真诚回应与超强全开麦实力直面谣言，黑粉当场转唯粉！',
        ...idolState.historyLogs,
      ],
    };
    persistState(updated);
    onNotify('🛡️ 危机公关大获全胜！公关团队强硬起诉造谣者，舆论好感度反弹创历史新高！');
    triggerAIStory(
      'idol',
      '教科书级危机公关逆风翻盘',
      '面对D社偷拍捕风捉影与网络恶评，通过实力全开麦直拍与硬气法务起诉赢得全网盛赞'
    );
  };

  const handleIdolRestSpa = () => {
    const updated: IdolCareerState = {
      ...idolState,
      mentalStress: Math.max(5, idolState.mentalStress - 28),
      liveSkill: Math.min(99, idolState.liveSkill + 2),
      historyLogs: [
        '前往济州岛私密悬崖度假村度过安宁的放假时光，海风与普拉提让身心重新焕发神采。',
        ...idolState.historyLogs,
      ],
    };
    persistState(updated);
    onNotify('💆‍♀️ 济州岛休假疗愈完成！疲惫一扫而空，以最佳精神状态迎接下一个舞台！');
  };

  // -------------------------------------------------------------
  // UNIVERSITY & CAREER ACTIONS
  // -------------------------------------------------------------
  const handleStudyForSemester = () => {
    const newGpa = Math.min(4.5, Number((uniState.gpa + 0.08).toFixed(2)));
    const updated: UniversityCareerState = {
      ...uniState,
      gpa: newGpa,
      careerPrestige: Math.min(99, uniState.careerPrestige + 6),
      historyLogs: [
        `首尔大学学期考试斩获 4.5 满绩点，荣获全校最优学术校长奖学金，法学院名誉墙上金榜题名！`,
        ...uniState.historyLogs,
      ],
    };
    persistState(undefined, updated);
    onNotify(`📚 学期考试大捷！GPA 冲至 ${newGpa}/4.5，斩获首尔大学全额优秀生特等奖学金！`);
    triggerAIStory(
      'university',
      '首尔大学学期满绩点与学术论文发表',
      `GPA：${newGpa}，专业：${uniState.major}，荣获法学院第一名荣誉`
    );
  };

  const handleCollegeCampMT = () => {
    const updated: UniversityCareerState = {
      ...uniState,
      careerPrestige: Math.min(99, uniState.careerPrestige + 4),
      familyHappiness: Math.min(99, uniState.familyHappiness + 6),
      historyLogs: [
        '参加加平郡溪谷大学 MT 露营迎新晚会，篝火夜谈与首尔大同学们高歌畅谈理想，收获了宝贵一生的人脉与友谊。',
        ...uniState.historyLogs,
      ],
    };
    persistState(undefined, updated);
    onNotify('⛺ 加平郡大学 MT 篝火野营圆满收官！青春洋溢，收获了名门学府最顶尖的挚友圈！');
  };

  const handlePromoteCareer = (trackId: string) => {
    const selectedTrack = UNIVERSITY_CAREER_TRACKS.find((t) => t.id === trackId);
    if (!selectedTrack) return;

    const updated: UniversityCareerState = {
      ...uniState,
      careerStage: 'master_leader',
      currentJobTitle: selectedTrack.name,
      annualSalaryKRW: selectedTrack.annualSalary,
      careerPrestige: Math.min(99, uniState.careerPrestige + 12),
      historyLogs: [
        `正式就职【${selectedTrack.name}】（年薪 ₩${(selectedTrack.annualSalary / 100000000).toFixed(1)}亿）！以卓越才华成为韩国该领域最年轻的权威翘楚！`,
        ...uniState.historyLogs,
      ],
    };
    persistState(undefined, updated);
    onNotify(`💼 恭喜就任【${selectedTrack.name}】！年薪突破数亿韩元，登顶业界领军人物！`);
    triggerAIStory(
      'university',
      `就任【${selectedTrack.name}】`,
      `领域：${selectedTrack.category}，年薪：${(selectedTrack.annualSalary / 100000000).toFixed(1)}亿韩元`
    );
  };

  const handleMarryPartner = (spouseId: string) => {
    const partner = POTENTIAL_SPOUSE_OPTIONS.find((p) => p.id === spouseId);
    if (!partner) return;

    const updated: UniversityCareerState = {
      ...uniState,
      marriageStatus: 'married',
      spouseName: partner.name,
      spouseRole: partner.role,
      familyHappiness: 98,
      historyLogs: [
        `与【${partner.name}】（${partner.role}）于首尔新罗酒店王朝大厅举行世纪婚礼！誓言永恒，亲友高朋满座，成为全韩艳羡的模范眷侣。`,
        ...uniState.historyLogs,
      ],
    };
    persistState(undefined, updated);
    onNotify(`💍 执子之手！与【${partner.name}】完婚，新罗酒店世纪婚礼收获全网最美祝福！`);
    triggerAIStory(
      'university',
      `与${partner.name}举行新罗酒店世纪婚礼`,
      `伴侣：${partner.name}（${partner.role}），新娘李秀妍，亲友高朋满座`
    );
  };

  const handleHaveBaby = (babyName: string) => {
    const bName = babyName.trim() || '智勋 (Ji-Hoon)';
    const updated: UniversityCareerState = {
      ...uniState,
      childCount: uniState.childCount + 1,
      childName: bName,
      childTalentScore: 88,
      familyHappiness: 100,
      historyLogs: [
        `迎来爱情结晶——宝宝【${bName}】降生！清澈的大眼睛继承了秀妍的美貌与聪慧，家庭温馨美满达到顶峰。`,
        ...uniState.historyLogs,
      ],
    };
    persistState(undefined, updated);
    onNotify(`🍼 恭喜！天使宝宝【${bName}】健康降生！温馨与爱意环绕，家庭幸福度拉满！`);
    triggerAIStory(
      'university',
      `迎来天使宝宝【${bName}】的降生`,
      `母亲李秀妍（${uniState.currentJobTitle}），宝宝名字：${bName}，兼顾事业与温馨家庭`
    );
  };

  // -------------------------------------------------------------
  // CHAEBOL WIFE ACTIONS
  // -------------------------------------------------------------
  const handleChaebolSkincare = () => {
    const updated: ChaebolWifeState = {
      ...chaebolState,
      skinCareBeauty: Math.min(100, chaebolState.skinCareBeauty + 4),
      luxuryPrestige: Math.min(99, chaebolState.luxuryPrestige + 3),
      historyLogs: [
        '在清潭洞顶奢院长专属 VIP 护肤中心享受干细胞再生水光与逆龄微雕，肌肤如冷白羊脂玉般通透无瑕。',
        ...chaebolState.historyLogs,
      ],
    };
    persistState(undefined, undefined, updated);
    onNotify('💆‍♀️ 清潭洞顶级水光护理完成！冷白皮神颜逆龄绽放，贵妇气场绝尘！');
  };

  const handleAcquireLuxuryBespoke = () => {
    const luxuryList = [
      '爱马仕 喜马拉雅鳄鱼皮 Birkin 25',
      '海瑞温斯顿 稀世粉钻水滴形吊坠项链',
      '香奈儿 巴黎高级定制山茶花刺绣长款晚礼服',
      '格拉夫 GRAFF 祖母绿切工高级彩钻戒指',
      '劳斯莱斯 幻影加长防弹定制版（清潭洞专属座驾）',
    ];
    const item = luxuryList[Math.floor(Math.random() * luxuryList.length)];
    const updated: ChaebolWifeState = {
      ...chaebolState,
      luxuryPrestige: Math.min(99, chaebolState.luxuryPrestige + 5),
      privateTrustWealthBillions: chaebolState.privateTrustWealthBillions + 10,
      ownedLuxuryItems: Array.from(new Set([item, ...chaebolState.ownedLuxuryItems])),
      historyLogs: [
        `清潭洞顶级私享沙龙专员登门拜访，私藏入柜【${item}】！`,
        ...chaebolState.historyLogs,
      ],
    };
    persistState(undefined, undefined, updated);
    onNotify(`🛍️ 成功收纳【${item}】！清潭洞名媛沙龙焦点，资产与奢华值飙升！`);
  };

  const handleEliteHeirEducation = () => {
    const updated: ChaebolWifeState = {
      ...chaebolState,
      heirGrowthScore: Math.min(100, chaebolState.heirGrowthScore + 6),
      heirStage:
        chaebolState.heirGrowthScore >= 90
          ? '常春藤双学位继承人'
          : chaebolState.heirGrowthScore >= 85
          ? '瑞士贵族私立预科'
          : '大峙洞特级私塾',
      familyControlPower: Math.min(99, chaebolState.familyControlPower + 5),
      historyLogs: [
        '为继承人安排大峙洞殿堂级名师一对一私塾与瑞士罗西学院马术大提琴私教，斩获全韩名门私校第一名！',
        ...chaebolState.historyLogs,
      ],
    };
    persistState(undefined, undefined, updated);
    onNotify('🎓 大峙洞名师私塾与贵族马术培训大获好评！继承人综合素养登顶名门二代首位！');
    triggerAIStory(
      'chaebol',
      '大峙洞顶级私塾与常春藤名校预科培育',
      `培养阶段：${updated.heirStage}，继承人成长分：${updated.heirGrowthScore}，豪门家族地位稳固`
    );
  };

  const handleHostCharityGala = () => {
    const updated: ChaebolWifeState = {
      ...chaebolState,
      socialiteRank: '掌控家族大权的豪门女掌门',
      familyControlPower: Math.min(99, chaebolState.familyControlPower + 10),
      luxuryPrestige: Math.min(99, chaebolState.luxuryPrestige + 6),
      charityBanquetsHosted: chaebolState.charityBanquetsHosted + 1,
      privateTrustWealthBillions: chaebolState.privateTrustWealthBillions + 25,
      historyLogs: [
        `在汉南洞私家庭院举办第${chaebolState.charityBanquetsHosted + 1}届财阀名媛慈善晚宴，政商名流贵妇悉数出席，轻描淡写募集百亿善款，稳居名媛圈绝对女主人领袖！`,
        ...chaebolState.historyLogs,
      ],
    };
    persistState(undefined, undefined, updated);
    onNotify('🍷 汉南洞顶级慈善晚宴圆满落幕！政商名媛一致推崇，奠定豪门第一女主人地位！');
    triggerAIStory(
      'chaebol',
      '汉南洞顶级名媛慈善晚宴与家族董事会掌权',
      `汉南洞顶级晚宴，募集百亿善款，稳坐清潭洞名媛领袖与财阀家族核心话语权`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-[#f7f4ee] border-2 border-[#d9d0c1] rounded-2xl max-w-5xl w-full max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#3b3227] via-[#5c4a33] to-[#423626] px-4 py-3 flex items-center justify-between text-white border-b border-[#8c7a60] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f3c876] to-[#e4a737] flex items-center justify-center text-[#2e1d05] shadow-md font-bold">
              👑
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>首尔女子高中 · 人生后续进阶篇章</span>
                <span className="text-[10px] bg-[#f5d68e] text-[#33220b] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  成年拓展物语
                </span>
              </h2>
              <p className="text-[11px] text-[#e6ded3]">
                三年女高毕业后的人生故事：可自由选择【顶流爱豆】、【名门大学精英】、【财阀太太奢华生活】或【正常毕业达成结局】
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="bg-[#ede7da] border-b border-[#d4cbba] px-3 py-2 flex items-center justify-between gap-2 shrink-0 overflow-x-auto overscroll-contain no-scrollbar"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTab === 'overview'
                  ? 'bg-[#3b3227] text-white shadow-md'
                  : 'bg-white/70 hover:bg-white text-[#524637] border border-[#d6ccb8]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>人生十字路口 (总览)</span>
            </button>
            <button
              onClick={() => {
                if (!stats.isDebutedIdol) {
                  onNotify('⚠️ 偶像身份强制锁定！你在高中阶段尚未通过企划社终审正式出道，无法提前进入爱豆篇章！');
                  return;
                }
                setSelectedTab('idol');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                !stats.isDebutedIdol
                  ? 'bg-stone-100 text-stone-500 border border-stone-300 hover:bg-stone-200 cursor-not-allowed opacity-80'
                  : selectedTab === 'idol'
                  ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-md'
                  : 'bg-white/70 hover:bg-white text-purple-900 border border-purple-200'
              }`}
              title={!stats.isDebutedIdol ? '需在高中期间作为练习生通过终审正式出道方可解锁' : '进入顶流爱豆篇'}
            >
              {!stats.isDebutedIdol ? (
                <Lock className="w-3.5 h-3.5 text-stone-500" />
              ) : (
                <Music className="w-3.5 h-3.5 text-pink-400" />
              )}
              <span>{stats.isDebutedIdol ? '🌟 K-Pop 顶流爱豆生涯' : '🔒 爱豆篇 (需高中出道)'}</span>
            </button>
            <button
              onClick={() => setSelectedTab('university')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTab === 'university'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md'
                  : 'bg-white/70 hover:bg-white text-blue-900 border border-blue-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
              <span>🎓 SKY 名门大学与精英人生</span>
            </button>
            <button
              onClick={() => setSelectedTab('chaebol')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTab === 'chaebol'
                  ? 'bg-gradient-to-r from-amber-700 to-yellow-600 text-white shadow-md'
                  : 'bg-white/70 hover:bg-white text-amber-900 border border-amber-200'
              }`}
            >
              <Gem className="w-3.5 h-3.5 text-amber-300" />
              <span>💍 财阀太太奢华模拟器</span>
            </button>
          </div>

          {/* Quick Exit to Normal High School Ending Button */}
          <button
            onClick={() => {
              onClose();
              onOpenEndings();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#806f56] to-[#635540] hover:from-[#948165] hover:to-[#73634c] text-white flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto shrink-0 whitespace-nowrap"
            title="如果不选择进入上述三个后续篇章，可正常达成高中结局并结束游戏"
          >
            <Award className="w-3.5 h-3.5 text-[#f5d68e]" />
            <span>正常达成高中结局 / 结束游戏</span>
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div
          className="p-3 sm:p-5 pb-10 overflow-y-auto touch-scroll overscroll-contain space-y-4 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* AI Story Banner (if generated) */}
          {currentAiStory && (
            <div className="bg-gradient-to-br from-[#2a2219] via-[#3d3123] to-[#241c14] text-white p-4 sm:p-5 rounded-2xl border-2 border-[#d9af62] shadow-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#fce8c3]">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#f5d68e]" />
                  <span>AI 沉浸剧情演出 · {currentAiStory.title}</span>
                </span>
                <span className="bg-[#b3883b] text-white font-extrabold px-2 py-0.5 rounded text-[10px]">
                  实时物语生成
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#f5ecd9] leading-relaxed italic bg-black/25 p-3 rounded-xl border border-white/10">
                “{currentAiStory.story}”
              </p>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-xs text-[#fae1a0] font-bold">
                📰 {currentAiStory.headline}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentAiStory.netizenReactions.map((cmt, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-white/10 px-2 py-1 rounded-lg border border-white/10 text-stone-200"
                  >
                    💬 {cmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isGeneratingStory && (
            <div className="bg-[#423626] text-white p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
              <Sparkles className="w-4 h-4 text-[#f5d68e] animate-spin" />
              <span>AI 正在为你构筑唯美韩漫/韩剧级成年篇章物语，请稍候……</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & CROSSROAD SELECTION */}
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-black text-[#2e261d] mb-1">
                  🎓 站在高中毕业的人生十字路口，你想成为谁？
                </h3>
                <p className="text-xs text-[#6e6353] leading-relaxed mb-4">
                  首尔女子高中的青葱岁月铸就了你的起点。你可以打破单一的结局限制，继续书写李秀妍在成年阶段的璀璨宏图。体验三个完全不同维度的极致人生，或者随时达成标准结局圆满谢幕！
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Card 1: Idol */}
                  <div className={`rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    stats.isDebutedIdol
                      ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-white border-2 border-purple-200 hover:shadow-md'
                      : 'bg-stone-50 border-2 border-stone-300 opacity-90'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                          stats.isDebutedIdol ? 'bg-purple-600 text-white' : 'bg-stone-400 text-stone-100'
                        }`}>
                          🎤
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          stats.isDebutedIdol
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700 flex items-center gap-1'
                        }`}>
                          {stats.isDebutedIdol ? '✅ 高中已出道' : <><Lock className="w-2.5 h-2.5" /> 需高中选秀出道</>}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-purple-950">
                        K-Pop 顶流爱豆生涯
                      </h4>
                      <p className="text-xs text-purple-800 leading-relaxed">
                        签约顶级企划社C位出道！发行回归专辑争夺打歌节目1位、举办全球巨蛋巡演、签约奢牌全球代言，体验最炙手可热的超级偶像人生。
                      </p>
                      {stats.isDebutedIdol ? (
                        <div className="text-[11px] text-purple-600 font-bold">
                          当前粉丝：{(idolState.fansCount / 10000).toFixed(1)}万 · 发行专辑：{idolState.albums.length}张
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-600 bg-stone-200/70 p-2 rounded-xl font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                          <span>未达成出道判定：须在高中练习生考核中升入A班并成功通过终审选拔战方可解锁！</span>
                        </div>
                      )}
                    </div>
                    {stats.isDebutedIdol ? (
                      <button
                        onClick={() => setSelectedTab('idol')}
                        className="mt-4 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>进入顶流爱豆篇</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        onClick={() => onNotify('⚠️ 偶像身份强制锁定！你在高中阶段尚未通过企划社出道终审。请在高中生涯中达成 A 班并通过出道选秀大考！')}
                        className="mt-4 w-full py-2 bg-stone-200 text-stone-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed border border-stone-300"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>未出道 · 严禁自选爱豆生涯</span>
                      </button>
                    )}
                  </div>

                  {/* Card 2: University & Career */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white border-2 border-blue-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                        🎓
                      </div>
                      <h4 className="text-base font-black text-blue-950">
                        SKY 名门大学与精英人生
                      </h4>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        考入首尔大学法学院！经历热血校园MT与GPA考核，毕业后就职首尔地检首席检察官或顶级律所合伙人，步入婚姻生子养娃，事业家庭双丰收。
                      </p>
                      <div className="text-[11px] text-blue-600 font-bold">
                        大学：{uniState.universityName} · GPA: {uniState.gpa} · 阶段：{uniState.currentJobTitle}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTab('university')}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>进入大学与职场篇</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 3: Chaebol Wife */}
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white border-2 border-amber-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                        💍
                      </div>
                      <h4 className="text-base font-black text-amber-950">
                        财阀太太奢华模拟器
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        嫁入顶级财阀家族！清潭洞顶级院长抗衰水光、高定爱马仕沙龙、大峙洞殿堂级私塾名师养娃育儿，主办汉南洞名媛慈善晚宴，执掌家族大权。
                      </p>
                      <div className="text-[11px] text-amber-700 font-bold">
                        豪门：{chaebolState.conglomerateName} · 信托：₩{chaebolState.privateTrustWealthBillions}亿
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTab('chaebol')}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>进入财阀贵妇篇</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Standard Ending Option Banner */}
              <div className="bg-[#ede7da] border border-[#cfc4b0] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#594d3c] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    📜
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#2e261d]">
                      我不想进入成年后续篇章，想正常达成高中结局并结束游戏？
                    </h5>
                    <p className="text-xs text-[#6e6353]">
                      没问题！随时点击右侧按钮，系统将根据高中三年积累的各项数值，正式颁发毕业证书并达成 13 大专属高中结局图鉴！
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenEndings();
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#6b583e] to-[#52432e] hover:from-[#7d6749] hover:to-[#5e4e37] text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#f5d68e]" />
                  <span>立即结算高中结局并结束游戏</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IDOL CAREER */}
          {selectedTab === 'idol' && (
            <div className="space-y-4">
              {/* Idol Stats Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-purple-900/10 border border-purple-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-purple-700 font-bold">全球粉丝数</div>
                  <div className="text-base sm:text-lg font-black text-purple-950">
                    {(idolState.fansCount / 10000).toFixed(1)} 万粉
                  </div>
                </div>
                <div className="bg-pink-900/10 border border-pink-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-pink-700 font-bold">Melon音源指数</div>
                  <div className="text-base sm:text-lg font-black text-pink-950">
                    {idolState.melonChartIndex} 分 (TOP 1)
                  </div>
                </div>
                <div className="bg-indigo-900/10 border border-indigo-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-indigo-700 font-bold">全开麦舞台实力</div>
                  <div className="text-base sm:text-lg font-black text-indigo-950">
                    {idolState.liveSkill} / 99
                  </div>
                </div>
                <div className="bg-rose-900/10 border border-rose-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-rose-700 font-bold">商业CF价值</div>
                  <div className="text-base sm:text-lg font-black text-rose-950">
                    {idolState.cfValueScore} 分 (奢牌宠儿)
                  </div>
                </div>
                <div className="bg-amber-900/10 border border-amber-200 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-amber-700 font-bold">心态健康度</div>
                  <div className="text-base sm:text-lg font-black text-amber-950">
                    {100 - idolState.mentalStress} % (良好)
                  </div>
                </div>
              </div>

              {/* Idol Actions */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                    <Disc3 className="w-4 h-4 text-purple-600" />
                    <span>顶流爱豆核心行程与大事件操盘</span>
                  </h4>
                  <span className="text-xs text-purple-700 font-medium">
                    所属团：{idolState.debutGroupName} · {idolState.currentBrandCF}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Action 1: Launch Comeback */}
                  <button
                    onClick={() => setShowComebackPlanner(true)}
                    className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Disc3 className="w-5 h-5 text-purple-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">💿 制作并发布回归新专辑</div>
                      <div className="text-[11px] text-purple-100 mt-0.5">
                        定概念、拍MV、打歌节目1位争夺战与全开麦安可
                      </div>
                    </div>
                  </button>

                  {/* Action 2: World Tour */}
                  <button
                    onClick={handleWorldTour}
                    className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <TrendingUp className="w-5 h-5 text-pink-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🎪 开启全球巨蛋巡回演唱会</div>
                      <div className="text-[11px] text-pink-100 mt-0.5">
                        高尺巨蛋两万座秒罄，全开麦连唱三小时引爆热搜
                      </div>
                    </div>
                  </button>

                  {/* Action 3: Variety Show */}
                  <button
                    onClick={handleVarietyShow}
                    className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Tv className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">📺 常驻国民大热王牌综艺</div>
                      <div className="text-[11px] text-blue-100 mt-0.5">
                        《Running Man》撕名牌、罗PD综艺，收割全民好感
                      </div>
                    </div>
                  </button>

                  {/* Action 4: Handle PR */}
                  <button
                    onClick={handleHandleCrisisPR}
                    className="p-3 bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🛡️ D社绯闻与舆论危机公关</div>
                      <div className="text-[11px] text-amber-100 mt-0.5">
                        硬核法务起诉黑粉，直面澄清，好感度逆势反弹
                      </div>
                    </div>
                  </button>

                  {/* Action 5: Spa & Mental Rest */}
                  <button
                    onClick={handleIdolRestSpa}
                    className="p-3 bg-gradient-to-br from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Coffee className="w-5 h-5 text-teal-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">💆‍♀️ 济州岛私密度假休养</div>
                      <div className="text-[11px] text-teal-100 mt-0.5">
                        普拉提与海景温泉，舒缓身心压力，满血复活
                      </div>
                    </div>
                  </button>

                  {/* Action 6: AI Generate Milestone */}
                  <button
                    onClick={() =>
                      triggerAIStory(
                        'idol',
                        'MAMA年度最佳大赏压轴表演',
                        `团队：${idolState.debutGroupName}，主唱李秀妍，全开麦震撼全球`
                      )
                    }
                    className="p-3 bg-gradient-to-br from-[#4a3b2c] to-[#2e2318] hover:from-[#5a4836] hover:to-[#382b1d] text-[#f7e6c4] rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer border border-[#c4a168]/50"
                  >
                    <Sparkles className="w-5 h-5 text-[#f5d68e] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">✨ AI 续写爱豆高光舞台大戏</div>
                      <div className="text-[11px] text-[#decab0] mt-0.5">
                        实时生成最新巡演/颁奖礼压轴神级舞台与韩网评论
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Comeback Planner Dialog */}
              {showComebackPlanner && (
                <div className="bg-purple-950 text-white p-4 rounded-2xl border-2 border-purple-400 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-purple-200 flex items-center gap-1.5">
                      <Disc3 className="w-4 h-4 text-pink-400" />
                      <span>企划社回归新专辑发布会</span>
                    </h5>
                    <button
                      onClick={() => setShowComebackPlanner(false)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-purple-300 font-bold mb-1">主打歌与专辑名：</label>
                      <input
                        type="text"
                        value={albumTitleInput}
                        onChange={(e) => setAlbumTitleInput(e.target.value)}
                        className="w-full bg-white/10 border border-purple-400/50 rounded-lg px-3 py-1.5 text-white"
                        placeholder="例如：《QUEENDOM : 盛宴》"
                      />
                    </div>
                    <div>
                      <label className="block text-purple-300 font-bold mb-1">主打回归概念：</label>
                      <select
                        value={albumConcept}
                        onChange={(e) => setAlbumConcept(e.target.value)}
                        className="w-full bg-purple-900 border border-purple-400/50 rounded-lg px-3 py-1.5 text-white"
                      >
                        <option value="清冷拽姐 Girl Crush">清冷拽姐 Girl Crush (高难刀群舞)</option>
                        <option value="清纯初恋仙女风">清纯初恋仙女风 (白裙长发仙气飘飘)</option>
                        <option value="暗黑华丽赛博电音">暗黑华丽赛博电音 (全开麦三段高音)</option>
                        <option value="复古 Y2K 潮酷千禧风">复古 Y2K 潮酷千禧风 (引爆穿搭模仿潮)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowComebackPlanner(false)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleLaunchComeback}
                      className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl text-xs font-black shadow-md"
                    >
                      立即全网同步发行打歌！
                    </button>
                  </div>
                </div>
              )}

              {/* History Chronicle */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm">
                <h5 className="text-xs font-bold text-[#4a3b2c] mb-2">📜 顶流爱豆生涯荣耀编年史：</h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs text-[#524637]">
                  {idolState.historyLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 py-0.5">
                      <span className="text-purple-600 shrink-0">✦</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNIVERSITY & CAREER & FAMILY */}
          {selectedTab === 'university' && (
            <div className="space-y-4">
              {/* University Status Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-blue-900/10 border border-blue-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-blue-700 font-bold">名门学府与专业</div>
                  <div className="text-xs sm:text-sm font-black text-blue-950">
                    {uniState.universityName} · {uniState.major}
                  </div>
                </div>
                <div className="bg-indigo-900/10 border border-indigo-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-indigo-700 font-bold">大学绩点 GPA</div>
                  <div className="text-base sm:text-lg font-black text-indigo-950">
                    {uniState.gpa} / 4.5 (校长奖学金)
                  </div>
                </div>
                <div className="bg-teal-900/10 border border-teal-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-teal-700 font-bold">精英职位与年薪</div>
                  <div className="text-xs sm:text-sm font-black text-teal-950 truncate">
                    {uniState.currentJobTitle}
                  </div>
                  <div className="text-[10px] text-teal-600 font-bold">
                    年薪 ₩{(uniState.annualSalaryKRW / 100000000).toFixed(1)} 亿
                  </div>
                </div>
                <div className="bg-rose-900/10 border border-rose-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-rose-700 font-bold">婚姻与育儿状态</div>
                  <div className="text-xs sm:text-sm font-black text-rose-950">
                    {uniState.marriageStatus === 'married'
                      ? `已婚 (${uniState.spouseName})`
                      : '单身备受瞩目'}
                  </div>
                  <div className="text-[10px] text-rose-600 font-bold">
                    {uniState.childCount > 0 ? `育有 ${uniState.childCount} 娃 (${uniState.childName})` : '暂未生育'}
                  </div>
                </div>
              </div>

              {/* University & Career Actions */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>名校进阶、精英职场晋升与婚礼生子</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <button
                    onClick={handleStudyForSemester}
                    className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <GraduationCap className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">📚 首尔大学学期考试攻关 GPA</div>
                      <div className="text-[11px] text-blue-100 mt-0.5">
                        图书馆通宵刷绩点，冲击 4.5 满绩与校长奖学金
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleCollegeCampMT}
                    className="p-3 bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-cyan-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">⛺ 加平郡大学 MT 野营迎新</div>
                      <div className="text-[11px] text-cyan-100 mt-0.5">
                        溪谷露营篝火真心话，拓展政商法界校友挚友圈
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      triggerAIStory(
                        'university',
                        '通过司法考试入职首尔地方检察厅',
                        '首尔大学法学院优秀毕业生，以全韩前十成绩通过司法考试'
                      )
                    }
                    className="p-3 bg-gradient-to-br from-[#3b3227] to-[#2b241c] hover:from-[#4d4133] hover:to-[#382f24] text-[#f7e6c4] rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer border border-[#d4af6d]/50"
                  >
                    <Sparkles className="w-5 h-5 text-[#f5d68e] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">✨ AI 续写名门律政大女主剧本</div>
                      <div className="text-[11px] text-[#decab0] mt-0.5">
                        实时生成首尔地检大案侦办或国际并购辩护高光
                      </div>
                    </div>
                  </button>
                </div>

                {/* Career Promotion Tracks */}
                <div className="pt-2 border-t border-[#eee7da]">
                  <h5 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                    <span>选择精英职业道路（点击立即就任）：</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {UNIVERSITY_CAREER_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handlePromoteCareer(t.id)}
                        className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-950 flex items-center gap-1">
                              <span>{t.icon}</span>
                              <span>{t.name}</span>
                            </span>
                            <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-bold">
                              年薪 ₩{(t.annualSalary / 100000000).toFixed(1)}亿
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-800/80 mt-1 line-clamp-2">
                            {t.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Romance, Marriage & Baby Section */}
                <div className="pt-2 border-t border-[#eee7da] space-y-2">
                  <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    <span>步入婚姻殿堂与生子养娃：</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Marriage options */}
                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-2">
                      <div className="text-xs font-bold text-rose-950">
                        💍 挑选伴侣并举行新罗酒店世纪婚礼：
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {POTENTIAL_SPOUSE_OPTIONS.map((sp) => (
                          <div
                            key={sp.id}
                            className="bg-white p-2 rounded-lg border border-rose-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-rose-950 flex items-center gap-1">
                                <span>{sp.name}</span>
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                  {sp.tag}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 mt-0.5">{sp.role}</div>
                            </div>
                            <button
                              onClick={() => handleMarryPartner(sp.id)}
                              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0"
                            >
                              结婚完婚
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Baby raising */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                          <Baby className="w-3.5 h-3.5 text-amber-600" />
                          <span>迎来天使宝宝（生子养娃与兼顾事业）：</span>
                        </div>
                        <p className="text-[11px] text-amber-800/90 mt-1">
                          在事业如日中天的同时，与心爱之人迎接属于你们的二代结晶，体验职场大女主与温柔母亲的从容转换。
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleHaveBaby('智勋 (Ji-Hoon)')}
                          className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-xl text-xs font-bold cursor-pointer text-center"
                        >
                          生下大宝「智勋」
                        </button>
                        <button
                          onClick={() => handleHaveBaby('瑞雅 (Seo-Ah)')}
                          className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer text-center"
                        >
                          生下千金「瑞雅」
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Chronicle */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm">
                <h5 className="text-xs font-bold text-[#4a3b2c] mb-2">📜 精英大学与婚姻职场编年史：</h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs text-[#524637]">
                  {uniState.historyLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 py-0.5">
                      <span className="text-blue-600 shrink-0">✦</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHAEBOL NOBLE WIFE SIMULATOR */}
          {selectedTab === 'chaebol' && (
            <div className="space-y-4">
              {/* Chaebol Status Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-amber-900/10 border border-amber-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-amber-700 font-bold">豪门财阀归属</div>
                  <div className="text-xs sm:text-sm font-black text-amber-950">
                    {chaebolState.conglomerateName}
                  </div>
                  <div className="text-[10px] text-amber-600 font-bold">
                    丈夫：{chaebolState.spouseName} ({chaebolState.spouseTitle})
                  </div>
                </div>
                <div className="bg-yellow-900/10 border border-yellow-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-yellow-700 font-bold">个人信托专属资产</div>
                  <div className="text-base sm:text-lg font-black text-yellow-950">
                    ₩{chaebolState.privateTrustWealthBillions} 亿韩元
                  </div>
                </div>
                <div className="bg-rose-900/10 border border-rose-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-rose-700 font-bold">清潭洞逆龄水光美貌</div>
                  <div className="text-base sm:text-lg font-black text-rose-950">
                    {chaebolState.skinCareBeauty} / 100
                  </div>
                  <div className="text-[10px] text-rose-600 font-bold">冷白皮贵妇神颜</div>
                </div>
                <div className="bg-orange-900/10 border border-orange-200 rounded-xl p-2.5 text-center">
                  <div className="text-[10px] text-orange-700 font-bold">继承人培养阶段</div>
                  <div className="text-xs sm:text-sm font-black text-orange-950">
                    {chaebolState.heirStage}
                  </div>
                  <div className="text-[10px] text-orange-600 font-bold">
                    培育分：{chaebolState.heirGrowthScore} (名门首位)
                  </div>
                </div>
              </div>

              {/* Chaebol Wife Actions */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>清潭洞贵妇护肤、名媛奢享、大峙洞育儿与豪门掌权</span>
                  </h4>
                  <span className="text-xs text-amber-700 font-bold">
                    头衔：{chaebolState.socialiteRank}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Action 1: Skincare */}
                  <button
                    onClick={handleChaebolSkincare}
                    className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-rose-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">💆‍♀️ 清潭洞顶级院长专属水光与抗衰</div>
                      <div className="text-[11px] text-rose-100 mt-0.5">
                        干细胞活肤与胎盘素唤醒，冷白玉肌逆龄常驻巅峰
                      </div>
                    </div>
                  </button>

                  {/* Action 2: Bespoke Luxury Shopping */}
                  <button
                    onClick={handleAcquireLuxuryBespoke}
                    className="p-3 bg-gradient-to-br from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Gem className="w-5 h-5 text-amber-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🛍️ 汉南洞高定沙龙与爱马仕配货</div>
                      <div className="text-[11px] text-amber-100 mt-0.5">
                        拿下喜马拉雅BKC与拍卖会顶级钻石，私藏升值
                      </div>
                    </div>
                  </button>

                  {/* Action 3: Elite Heir Education */}
                  <button
                    onClick={handleEliteHeirEducation}
                    className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <GraduationCap className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🎓 大峙洞特级私塾私教与贵族养娃</div>
                      <div className="text-[11px] text-indigo-100 mt-0.5">
                        皇家马术、大提琴独奏与常春藤名校预科培育
                      </div>
                    </div>
                  </button>

                  {/* Action 4: Gala Banquet */}
                  <button
                    onClick={handleHostCharityGala}
                    className="p-3 bg-gradient-to-br from-[#593d26] to-[#3d2919] hover:from-[#6b4a2f] hover:to-[#4a321f] text-[#fae1a0] rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer border border-[#d9af62]/50"
                  >
                    <Wine className="w-5 h-5 text-[#f5d68e] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">🍷 汉南洞顶级名媛慈善晚宴</div>
                      <div className="text-[11px] text-[#decab0] mt-0.5">
                        招待政商财阀第一夫人，掌控百亿家族基金大权
                      </div>
                    </div>
                  </button>

                  {/* Action 5: Private Jet Trip */}
                  <button
                    onClick={() => {
                      const updated = {
                        ...chaebolState,
                        skinCareBeauty: Math.min(100, chaebolState.skinCareBeauty + 3),
                        luxuryPrestige: Math.min(99, chaebolState.luxuryPrestige + 4),
                        historyLogs: [
                          '乘坐湾流私人飞机前往摩纳哥蒙特卡洛游艇度假，蓝天碧海与极奢私宴洗涤尘嚣。',
                          ...chaebolState.historyLogs,
                        ],
                      };
                      persistState(undefined, undefined, updated);
                      onNotify('✈️ 摩纳哥私人游艇奢华度假！尽享人间至尊富贵！');
                    }}
                    className="p-3 bg-gradient-to-br from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer"
                  >
                    <Plane className="w-5 h-5 text-teal-200 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">✈️ 私人飞机与摩纳哥游艇度假</div>
                      <div className="text-[11px] text-teal-100 mt-0.5">
                        阿尔卑斯私人雪场与蔚蓝海岸，顶级贵妇生活
                      </div>
                    </div>
                  </button>

                  {/* Action 6: AI Chaebol Drama */}
                  <button
                    onClick={() =>
                      triggerAIStory(
                        'chaebol',
                        '财阀家宴家族董事会核心股权暗战',
                        `豪门：${chaebolState.conglomerateName}，女主人李秀妍掌控家族信托，在公婆与董事会前从容控局`
                      )
                    }
                    className="p-3 bg-gradient-to-br from-[#2e2318] to-[#1c150e] hover:from-[#403122] hover:to-[#261d14] text-[#f7e6c4] rounded-xl text-left shadow-sm flex items-start gap-2.5 cursor-pointer border border-[#c4a168]/60"
                  >
                    <Crown className="w-5 h-5 text-[#f5d68e] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold">✨ AI 续写豪门大女主宫斗爽局</div>
                      <div className="text-[11px] text-[#decab0] mt-0.5">
                        《眼泪女王》《顶楼》级豪门权谋与大女主博弈
                      </div>
                    </div>
                  </button>
                </div>

                {/* Owned Luxury Items showcase */}
                <div className="pt-2 border-t border-[#eee7da]">
                  <h5 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-amber-600" />
                    <span>汉南洞豪门私藏珍宝库与高定衣橱：</span>
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {chaebolState.ownedLuxuryItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-100/80 border border-amber-300 text-amber-950 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"
                      >
                        <span>💎</span>
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* History Chronicle */}
              <div className="bg-white border border-[#ded5c5] rounded-2xl p-4 shadow-sm">
                <h5 className="text-xs font-bold text-[#4a3b2c] mb-2">📜 汉南洞财阀豪门掌权编年史：</h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs text-[#524637]">
                  {chaebolState.historyLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 py-0.5">
                      <span className="text-amber-600 shrink-0">✦</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar with Clear Action to End Game or Return */}
        <div className="bg-[#ede7da] border-t border-[#d6ccb8] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#615545]">
            <span className="font-bold">💡 提示：</span>
            <span>已保存你在这三个篇章里的所有历练与成就，随时可切换体验，也可随时返回高中校园日常。</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#c4baaa] rounded-xl text-xs font-bold text-[#423728] cursor-pointer"
            >
              返回高中主界面
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenEndings();
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#947443] to-[#75592e] hover:from-[#a6824c] hover:to-[#856534] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#f5d68e]" />
              <span>正常达成结局结束游戏</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
