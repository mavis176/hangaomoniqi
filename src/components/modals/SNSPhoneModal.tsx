import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Send,
  Briefcase,
  UtensilsCrossed,
  Award,
  Users,
  Coins,
  Wifi,
  BatteryCharging,
  Signal,
  Image as ImageIcon,
  Smile,
  FolderOpen,
  Flame,
  RefreshCw,
  Eye,
  Wallpaper,
  UserCheck,
  Music,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  ShoppingBag,
  ShieldAlert,
  Radio,
  Clock,
  AlertTriangle,
  Lock,
  CheckCircle2,
  DollarSign,
  Share2,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';
import {
  AIConfig,
  ChatMessage,
  FanBubblePlayerState,
  FanBubbleThread,
  ForumPost,
  GameStats,
  NPCClassmate,
  SNSPost,
  CoupangShopItem,
  DispatchScandalLeak,
  KTalkIndustryContact,
  KTalkMessage,
} from '../../types';
import {
  COUPANG_PRESET_ITEMS,
  DISPATCH_INITIAL_LEAKS,
  KTALK_PRESET_CONTACTS,
} from '../../data/phoneAppsData';
import {
  generateGroupChatReplies,
  generateAICharacterAvatar,
  ActionEventCategory,
  splitNpcReplyIntoBubbles,
  generateNpcChatReply,
  generateCampusForumPosts,
  generateStargramNpcComments,
  generateFanBubbleMessages,
  generateFanBubbleReply,
  generateDispatchScandalPRResult,
  generateCoupangOotdPostComments,
  generateKTalkVIPReply,
} from '../../services/aiService';
import { defaultAIConfig } from '../../data/gameData';

interface SNSPhoneModalProps {
  onClose: () => void;
  stats: GameStats;
  npcs: NPCClassmate[];
  snsPosts: SNSPost[];
  weekLabel: string;
  clockStr?: string;
  location?: string;
  timeContext?: string;
  aiConfig?: AIConfig;
  chatHistories?: Record<string, ChatMessage[]>;
  onUpdateChatHistory?: (npcId: string, messages: ChatMessage[]) => void;
  onAddNpcMemory?: (npcId: string, memoryText: string) => void;
  onAppendNpcMemory?: (npcId: string, memoryText: string) => void;
  fanBubbleThreads?: FanBubbleThread[];
  onUpdateFanBubbleThreads?: React.Dispatch<React.SetStateAction<FanBubbleThread[]>>;
  recentScheduleSummary?: string;
  protagonistName?: string;
  recentMemories?: string[];
  lastJobTurnKey?: string;
  currentTurnKey?: string;
  weeklyCompletedActions?: string[];
  onRecordJobDone?: () => void;
  onTriggerActionEvent?: (params: {
    actionCategory: ActionEventCategory;
    actionName: string;
    locationName: string;
    baseStaminaCost: number;
    weeklyActionKey: string;
    extraContext?: string;
  }) => void;
  onPublishPost: (post: SNSPost, statsDelta: Partial<GameStats>) => void;
  onUpdateStats?: (delta: Partial<GameStats>) => void;
  onOpenNpcChat: (npc: NPCClassmate) => void;
  onOpenForum: () => void;
  onNotify: (msg: string) => void;
  protagonistAvatar?: string;
  onChangeProtagonistAvatar?: (url: string) => void;
  onUpdateFavorability?: (npcId: string, amount: number, romanceDelta?: number) => void;
  initialTab?:
    | 'desktop'
    | 'stargram'
    | 'kakao'
    | 'bubble'
    | 'delivery'
    | 'alba'
    | 'aistudio'
    | 'music'
    | 'blind'
    | 'dispatch'
    | 'coupang'
    | 'ktalk';
  onTriggerRandomEncounter?: () => void;
  onOpenAssetsModal?: () => void;
  onOpenFamilyModal?: () => void;
}

interface GalleryPhotoItem {
  id: string;
  title: string;
  category: 'portrait' | 'stage' | 'npc_group';
  categoryLabel: string;
  imageUrl: string;
  desc: string;
  dateLabel: string;
}

export const SNSPhoneModal: React.FC<SNSPhoneModalProps> = ({
  onClose,
  stats,
  npcs,
  snsPosts,
  weekLabel,
  clockStr = '12:45',
  location = '首尔女高走廊',
  timeContext = '春日午后',
  aiConfig = defaultAIConfig,
  chatHistories = {},
  onUpdateChatHistory,
  onAddNpcMemory,
  onAppendNpcMemory,
  fanBubbleThreads: externalFanThreads,
  onUpdateFanBubbleThreads,
  recentScheduleSummary,
  protagonistName = '李秀妍',
  recentMemories = [],
  lastJobTurnKey,
  currentTurnKey,
  weeklyCompletedActions = [],
  onRecordJobDone,
  onTriggerActionEvent,
  onPublishPost,
  onUpdateStats,
  onOpenNpcChat,
  onNotify,
  protagonistAvatar,
  onChangeProtagonistAvatar,
  onUpdateFavorability,
  initialTab = 'desktop',
  onTriggerRandomEncounter,
  onOpenAssetsModal,
  onOpenFamilyModal,
}) => {
  const recordNpcMemory = onAddNpcMemory || onAppendNpcMemory;
  const isAlreadyWorkedToday =
    (Boolean(lastJobTurnKey) && Boolean(currentTurnKey) && lastJobTurnKey === currentTurnKey) ||
    weeklyCompletedActions.includes('weekly_parttime_or_endorsement');

  const [activeTab, setActiveTab] = useState<
    | 'desktop'
    | 'stargram'
    | 'kakao'
    | 'bubble'
    | 'delivery'
    | 'alba'
    | 'aistudio'
    | 'music'
    | 'blind'
    | 'dispatch'
    | 'coupang'
    | 'ktalk'
  >(initialTab as any);

  // Desktop pages & Life Service Folder state (weakening numeric grind feel)
  const [desktopPage, setDesktopPage] = useState<1 | 2>(1);
  const [showLifeFolder, setShowLifeFolder] = useState(false);

  // Custom Phone Wallpaper state (can be set from AI Gallery)
  const [phoneWallpaper, setPhoneWallpaper] = useState<string>(() => {
    try {
      return localStorage.getItem('kr_phone_wallpaper') || '';
    } catch {
      return '';
    }
  });

  const handleSetWallpaper = (url: string, title: string) => {
    setPhoneWallpaper(url);
    try {
      localStorage.setItem('kr_phone_wallpaper', url);
    } catch {}
    onNotify(`📱 已将「${title}」设为你的韩系手机桌面壁纸！`);
  };

  // Unread Notification Badges for core social apps
  const [unreadBadges, setUnreadBadges] = useState<{
    stargram: number;
    bubble: number;
    kakao: number;
    blind: number;
  }>({
    stargram: 2,
    bubble: 3,
    kakao: 4,
    blind: 5,
  });

  const openAppTab = (
    tabId: 'desktop' | 'stargram' | 'kakao' | 'bubble' | 'delivery' | 'alba' | 'aistudio' | 'music' | 'blind' | 'assets' | 'family'
  ) => {
    if (tabId === ('assets' as any)) {
      if (onOpenAssetsModal) {
        onOpenAssetsModal();
        return;
      }
    }
    if (tabId === ('family' as any)) {
      if (onOpenFamilyModal) {
        onOpenFamilyModal();
        return;
      }
    }
    setActiveTab(tabId as any);
    setShowLifeFolder(false);
    if (tabId in unreadBadges && tabId !== 'bubble') {
      setUnreadBadges((prev) => ({ ...prev, [tabId]: 0 }));
    }
    if (tabId === 'bubble') {
      // Automatically call AI fan message generator when entering Bubble!
      triggerFetchFanBubbleMessages();
    }
  };

  // ============================================================================
  // NEW 1: Dispatch Scandal PR State & Handlers
  // ============================================================================
  const [dispatchLeaks, setDispatchLeaks] = useState<DispatchScandalLeak[]>(() => {
    try {
      const s = localStorage.getItem('kr_phone_dispatch_leaks_v1');
      if (s) return JSON.parse(s);
    } catch {}
    return DISPATCH_INITIAL_LEAKS;
  });
  const [activePRModalScandal, setActivePRModalScandal] = useState<DispatchScandalLeak | null>(null);
  const [prOutcomeResult, setPrOutcomeResult] = useState<{
    narrative: string;
    netizenReaction: string;
    isSuccess: boolean;
  } | null>(null);
  const [isProcessingPR, setIsProcessingPR] = useState(false);

  const handleExecuteDispatchPR = async (actionType: 'buyout' | 'statement' | 'counter_pr') => {
    if (!activePRModalScandal) return;
    const scandal = activePRModalScandal;

    if (actionType === 'buyout' && stats.coins < scandal.buyoutCostKRW) {
      onNotify(`⚠️ 余额不足！买断【${scandal.title}】需要 ₩${scandal.buyoutCostKRW.toLocaleString()} 韩元。`);
      return;
    }

    setIsProcessingPR(true);
    try {
      const res = await generateDispatchScandalPRResult({
        scandal,
        actionType,
        stats,
        protagonistName,
        aiConfig,
      });

      if (onUpdateStats && res.delta) {
        onUpdateStats(res.delta);
      }

      const updatedStatus =
        actionType === 'buyout'
          ? 'resolved_bought'
          : actionType === 'statement'
          ? 'resolved_statement'
          : 'resolved_counter';

      setDispatchLeaks((prev) => {
        const next = prev.map((l) => (l.id === scandal.id ? { ...l, status: updatedStatus as any } : l));
        try {
          localStorage.setItem('kr_phone_dispatch_leaks_v1', JSON.stringify(next));
        } catch {}
        return next;
      });

      setPrOutcomeResult({
        narrative: res.narrative,
        netizenReaction: res.netizenReaction,
        isSuccess: res.isSuccess,
      });

      onNotify(res.isSuccess ? '✨ 危机公关大获全胜！黑料炒作被成功化解！' : '⚠️ 舆论产生波动，请留意粉丝粘性！');
    } catch (_e) {
      onNotify('危机公关团队火速包揽处置，危机已平息！');
    } finally {
      setIsProcessingPR(false);
    }
  };

  // Dynamically check if player triggered a scandal (Hongdae nightlife or low reputation)
  useEffect(() => {
    if (activeTab !== 'dispatch') return;

    const hasHongdaeNightlife =
      weeklyCompletedActions.some(
        (a) => a.includes('hongdae') || a.includes('night_club') || a.includes('bar')
      ) ||
      location.includes('弘大') ||
      location.includes('酒吧') ||
      location.includes('夜店');

    const hasNegativeScandal = (stats.reputation || 50) < 35 || (stats.darkIndex || 0) > 40;

    if (hasHongdaeNightlife || hasNegativeScandal) {
      const hasActivePlayerScandal = dispatchLeaks.some(
        (l) => l.isPlayerTarget && l.status === 'pending'
      );

      if (!hasActivePlayerScandal) {
        const causalReason = hasHongdaeNightlife
          ? `⚠️ 触发因果：因为你近期前往【弘大酒吧/夜店】逗留，被 D社长焦镜头抓拍到深夜出行！`
          : `⚠️ 触发因果：因为你近期声望走低(＜35)或暗黑值偏高，黑粉向 D社投递了负面黑料！`;

        const playerLeak: DispatchScandalLeak = {
          id: `disp_player_${Date.now()}`,
          title: `【D社独家预告】涉及练习生【${protagonistName}】的深夜爆料预告！`,
          headline: `【NEWS】[单独] “深夜现身”……首尔女高练习生${protagonistName}被抓拍，危机即将来袭！`,
          targetNpcName: protagonistName,
          isPlayerTarget: true,
          causalReason,
          leakCategory: hasHongdaeNightlife ? 'nightlife' : 'attitude',
          hoursRemaining: 18,
          evidencePhoto:
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
          status: 'pending',
          buyoutCostKRW: 150000,
          statementInfluenceCost: 20,
          riskPct: 65,
          summary: `D社狗仔于深夜进行了长焦连拍抓拍。如果不及时公关买断或澄清，倒计时结束后将引发全网黑热搜！`,
          leakDateLabel: weekLabel,
        };

        setDispatchLeaks((prev) => {
          const next = [playerLeak, ...prev];
          try {
            localStorage.setItem('kr_phone_dispatch_leaks_v1', JSON.stringify(next));
          } catch {}
          return next;
        });
        onNotify('🚨 D社捕捉到你的特定行为/负面绯闻，已生成针对你的独家爆料预告！');
      }
    }
  }, [activeTab, weeklyCompletedActions, location, stats.reputation, stats.darkIndex, protagonistName, weekLabel]);

  // Handle player interactions with NPC / Celebrity scandals in Dispatch App
  const handleInteractNpcScandal = (
    scandalId: string,
    actionType: 'spectate' | 'like' | 'sabotage'
  ) => {
    setDispatchLeaks((prev) => {
      const next = prev.map((l) => {
        if (l.id !== scandalId) return l;

        let resultText = '';
        if (actionType === 'spectate') {
          resultText = '🍿 你嗑着瓜子翻阅了韩网 Pann/Theqoo 论坛，热评弹幕满天飞！(心情 +5)';
          if (onUpdateStats) onUpdateStats({ mood: Math.min(100, stats.mood + 5) });
          onNotify('🍿 开启围观吃瓜模式！观摩韩网顶流塌房热图，心情 +5！');
        } else if (actionType === 'like') {
          resultText = '👍 你点赞并转发了爆料，带火社群互动！(SNS 粉丝 +300，时尚社交 +5)';
          if (onUpdateStats)
            onUpdateStats({
              snsFollowers: stats.snsFollowers + 300,
              social: Math.min(100, stats.social + 5),
            });
          onNotify('👍 点赞转发八卦！带火社群话题度，SNS 粉丝 +300，社交 +5！');
        } else if (actionType === 'sabotage') {
          resultText = '💥 你针对竞争对手匿名带节奏控评，打压对手声望！(个人声望 +8，暗黑值 +3)';
          if (onUpdateStats)
            onUpdateStats({
              reputation: Math.min(100, (stats.reputation || 50) + 8),
              darkIndex: Math.min(100, stats.darkIndex + 3),
            });
          onNotify('💥 针对竞争对手落井下石！打压竞争位次，声望 +8，暗黑值 +3！');
        }

        return {
          ...l,
          userReaction: actionType,
          reactionResultText: resultText,
        };
      });

      try {
        localStorage.setItem('kr_phone_dispatch_leaks_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // ============================================================================
  // NEW 2: Coupang Luxury Shop State & Handlers
  // ============================================================================
  const [coupangCategory, setCoupangCategory] = useState<'all' | 'uniform' | 'couture' | 'stage' | 'luxury_bag' | 'skincare'>('all');
  const [coupangOwnedIds, setCoupangOwnedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('kr_phone_coupang_owned_v1');
      if (s) return JSON.parse(s);
    } catch {}
    return ['cp_uniform_1'];
  });
  const [isPublishingCoupangOotd, setIsPublishingCoupangOotd] = useState(false);

  const handleBuyCoupangItem = (item: CoupangShopItem) => {
    if (stats.coins < item.priceKRW) {
      onNotify(`⚠️ 余额不足！购买【${item.name}】需要 ₩${item.priceKRW.toLocaleString()} 韩元。`);
      return;
    }

    if (onUpdateStats) {
      onUpdateStats({
        coins: -item.priceKRW,
        appearance: Math.min(100, (stats.appearance || 40) + item.appearanceBonus),
        social: Math.min(100, stats.social + item.socialBonus),
        darkIndex: Math.max(0, stats.darkIndex - item.darkIndexReduction),
      });
    }

    setCoupangOwnedIds((prev) => {
      const next = prev.includes(item.id) ? prev : [...prev, item.id];
      try {
        localStorage.setItem('kr_phone_coupang_owned_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    onNotify(`🛍️ 成功从 Coupang 奢品专区购入【${item.name}】！外形 +${item.appearanceBonus}，时尚度 +${item.socialBonus}！`);
  };

  const handlePublishCoupangToStargram = async (item: CoupangShopItem) => {
    setIsPublishingCoupangOotd(true);
    try {
      const res = await generateCoupangOotdPostComments({
        item,
        protagonistName,
        npcs,
        aiConfig,
      });

      const newPost: SNSPost = {
        id: `post_coupang_${Date.now()}`,
        weekLabel,
        tag: item.tag,
        caption: res.caption,
        imageUrl: item.image,
        likes: Math.floor(1200 + Math.random() * 800),
        followerGain: Math.floor(2500 + Math.random() * 1500),
        npcComments: res.comments,
      };

      onPublishPost(newPost, {
        appearance: item.appearanceBonus,
        social: item.socialBonus,
      });

      openAppTab('stargram');
      onNotify(`✨ 成功将【${item.name}】晒到 Stargram！好友与粉丝彩虹屁跟帖已就绪！`);
    } catch (_e) {
      onNotify('已将新穿搭一键晒到 Stargram！');
    } finally {
      setIsPublishingCoupangOotd(false);
    }
  };

  // ============================================================================
  // NEW 3: K-Talk Industry VIP Messenger State & Handlers
  // ============================================================================
  const [ktalkContacts, setKtalkContacts] = useState<KTalkIndustryContact[]>(() => {
    try {
      const s = localStorage.getItem('kr_phone_ktalk_contacts_v1');
      if (s) return JSON.parse(s);
    } catch {}
    return KTALK_PRESET_CONTACTS;
  });
  const [activeKTalkContactId, setActiveKTalkContactId] = useState<string>('ktalk_pd_sbs');
  const [ktalkInputText, setKtalkInputText] = useState('');
  const [isGeneratingKTalkVIPReply, setIsGeneratingKTalkVIPReply] = useState(false);

  const handleSendKTalkVIPMessage = async () => {
    if (!ktalkInputText.trim()) return;
    const activeContact = ktalkContacts.find((c) => c.id === activeKTalkContactId);
    if (!activeContact) return;

    const userText = ktalkInputText.trim();
    setKtalkInputText('');

    const newMsg: KTalkMessage = {
      id: `m_${Date.now()}`,
      sender: 'player',
      text: userText,
      timestamp: clockStr,
    };

    const updatedMessages = [...activeContact.messages, newMsg];

    setKtalkContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, messages: updatedMessages, unread: false } : c))
    );

    setIsGeneratingKTalkVIPReply(true);

    try {
      const res = await generateKTalkVIPReply({
        contact: activeContact,
        userReply: userText,
        stats,
        protagonistName,
        aiConfig,
      });

      const vipReplyMsg: KTalkMessage = {
        id: `m_vip_${Date.now()}`,
        sender: 'vip',
        text: res.vipReply,
        timestamp: clockStr,
        eqScore: res.eqScore,
      };

      setKtalkContacts((prev) => {
        const next = prev.map((c) => {
          if (c.id === activeContact.id) {
            return {
              ...c,
              lastMessage: res.vipReply,
              influenceLevel: Math.min(100, c.influenceLevel + res.influenceGain),
              messages: [...updatedMessages, vipReplyMsg],
              pendingOffer: res.unlockedOffer || c.pendingOffer,
            };
          }
          return c;
        });
        try {
          localStorage.setItem('kr_phone_ktalk_contacts_v1', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (onUpdateStats) {
        onUpdateStats({ social: Math.min(100, stats.social + Math.floor(res.influenceGain / 2)) });
      }

      onNotify(`💼 高情商商务回复（EQ ${res.eqScore}分）！【${activeContact.name}】圈内人脉 +${res.influenceGain}！`);
    } catch (_e) {
      onNotify('回复已发送！大佬表示十分赏识。');
    } finally {
      setIsGeneratingKTalkVIPReply(false);
    }
  };

  const handleAcceptKTalkOffer = (contactId: string) => {
    const contact = ktalkContacts.find((c) => c.id === contactId);
    if (!contact || !contact.pendingOffer) return;

    const offer = contact.pendingOffer;

    if (onUpdateStats) {
      onUpdateStats({
        coins: stats.coins + offer.rewardCoins,
        snsFollowers: stats.snsFollowers + offer.followerGain,
        social: Math.min(100, stats.social + offer.influenceGain),
      });
    }

    setKtalkContacts((prev) => {
      const next = prev.map((c) => (c.id === contactId ? { ...c, pendingOffer: undefined } : c));
      try {
        localStorage.setItem('kr_phone_ktalk_contacts_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    onNotify(`🎉 成功签约【${offer.title}】！斩获 ₩${offer.rewardCoins.toLocaleString()} 通告费，粉丝 +${offer.followerGain}！`);
  };

  // Music Player state
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentSong, setCurrentSong] = useState({
    title: '🌸 春日樱花树下的告白 (Spring Cherry Blossom Lo-Fi)',
    artist: 'Seoul High School OST',
    duration: '3:45',
  });

  // ============================================================================
  // 1. STARGRAM STATE (Stories + AI Dynamic NPC Comments + User Replies)
  // ============================================================================
  const [customCaption, setCustomCaption] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ootd');
  const [completedPRIds, setCompletedPRIds] = useState<string[]>([]);
  const [isPublishingStargram, setIsPublishingStargram] = useState(false);
  const [loadingCommentPostId, setLoadingCommentPostId] = useState<string | null>(null);
  const [activeStoryNpc, setActiveStoryNpc] = useState<NPCClassmate | null>(null);
  const [likedStoryIds, setLikedStoryIds] = useState<string[]>([]);
  const [extraPostComments, setExtraPostComments] = useState<
    Record<string, { npcName: string; text: string }[]>
  >({});
  const [replyingPostId, setReplyingPostId] = useState<string | null>(null);
  const [postReplyInput, setPostReplyInput] = useState('');

  const photoThemes = [
    {
      id: 'ootd',
      tag: '#今日校服穿搭 #OOTD',
      defaultCaption: '今天的针织开衫配百褶裙，走廊阳光刚好~ ✨',
      baseFollowers: 1500,
      sponsorCoin: 15000,
    },
    {
      id: 'dance',
      tag: '#练习室直拍 #KpopCover',
      defaultCaption: '放学后在练习室镜子前录的副歌直拍，大家觉得卡点怎么样？🎵',
      baseFollowers: 2600,
      sponsorCoin: 28000,
    },
    {
      id: 'cafe',
      tag: '#圣水洞探店 #人生四格',
      defaultCaption: '周末和最重要的人一起拍了最新联名款人生四格 📸💕',
      baseFollowers: 1900,
      sponsorCoin: 18000,
    },
    {
      id: 'study',
      tag: '#大峙洞自习 #Gongstagram',
      defaultCaption: '晚自习刷完最后一套全国联考真题，热美式续命中 📚☕',
      baseFollowers: 1200,
      sponsorCoin: 10000,
    },
    {
      id: 'stage',
      tag: '#打歌后台自拍 #IdolCenter',
      defaultCaption: '戴好专属定制耳返准备上台啦，听到台下你们的应援声了！👑🎤',
      baseFollowers: 3800,
      sponsorCoin: 45000,
    },
    {
      id: 'snow',
      tag: '#首尔初雪 #围巾自拍',
      defaultCaption: '听说初雪这天发动态，心里想的愿望一定会实现 ❄️🧣',
      baseFollowers: 2200,
      sponsorCoin: 22000,
    },
  ];

  const handleUploadPhoto = async () => {
    if (stats.stamina < 8) {
      onNotify('体力不足，先去生活服务点份外卖或休息一下再发动态吧！');
      return;
    }
    if (isPublishingStargram) return;
    setIsPublishingStargram(true);

    const theme = photoThemes.find((t) => t.id === selectedTheme) || photoThemes[0];
    const appearanceMultiplier = 1 + (stats.appearance - 60) / 70;
    const followerGain = Math.max(300, Math.round(theme.baseFollowers * appearanceMultiplier));
    const likes = Math.round(followerGain * 3.2 + stats.snsFollowers * 0.28);
    const adRevenue = stats.snsFollowers >= 3000 ? theme.sponsorCoin : 0;
    const captionText = customCaption.trim() || theme.defaultCaption;

    let aiComments: { npcName: string; text: string }[] = [];
    try {
      aiComments = await generateStargramNpcComments({
        caption: captionText,
        tag: theme.tag,
        npcs,
        stats,
        timeContext: weekLabel,
        aiConfig,
      });
    } catch {
      aiComments = [
        { npcName: '金智英', text: '救命这张氛围感绝了！滤镜参数快交出来~' },
        { npcName: '朴敏英', text: '已经第一时间点赞收藏设为壁纸啦 ❤️' },
        { npcName: '千宥娜', text: '镜头感越来越稳，很有出道预告照的气场。' },
      ];
    }

    const newPost: SNSPost = {
      id: `sns_${Date.now()}`,
      weekLabel,
      tag: theme.tag,
      caption: captionText,
      likes,
      followerGain,
      npcComments: aiComments,
    };

    onPublishPost(newPost, {
      stamina: -8,
      mood: 8,
      social: 5,
      snsFollowers: followerGain,
      coins: adRevenue,
      traineeProgress: selectedTheme === 'dance' || selectedTheme === 'stage' ? 6 : 2,
    });

    setCustomCaption('');
    setIsPublishingStargram(false);
    setUnreadBadges((prev) => ({ ...prev, bubble: prev.bubble + 1 }));
    onNotify(
      `📸 Stargram发布成功！好友与导师纷纷赶来评论，涨粉 +${followerGain.toLocaleString()}${
        adRevenue > 0 ? `，推广分成 +₩${adRevenue.toLocaleString()}` : ''
      }！`
    );
  };

  const handleRefreshPostAIComments = async (post: SNSPost) => {
    if (loadingCommentPostId) return;
    setLoadingCommentPostId(post.id);
    try {
      const freshComments = await generateStargramNpcComments({
        caption: post.caption,
        tag: post.tag,
        npcs,
        stats,
        timeContext: weekLabel,
        aiConfig,
      });
      setExtraPostComments((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), ...freshComments.slice(0, 2)],
      }));
      onNotify('✨ 好友与企划社导师在你的 Stargram 动态下留下了新评论！');
    } catch {
      onNotify('评论加载稍忙，请稍后再试~');
    } finally {
      setLoadingCommentPostId(null);
    }
  };

  const handleReplyToPostComment = (postId: string) => {
    const clean = postReplyInput.trim();
    if (!clean) return;
    setExtraPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { npcName: '李秀妍 (作者回复)', text: clean }],
    }));
    setPostReplyInput('');
    setReplyingPostId(null);
    onNotify('💬 评论回复成功，粉丝与好友互动热度提升！');
  };

  // ============================================================================
  // 2. BUBBLE STATE (AI Fan Bubble DMs + 1v1 Living Short-Bubble NPC Chat)
  // ============================================================================
  const [bubbleMode, setBubbleMode] = useState<'fan_dm' | 'npc_dm' | 'fan_room'>('fan_dm');
  const [selectedBubbleNpcId, setSelectedBubbleNpcId] = useState<string>(npcs[0]?.id || 'npc_1');
  const [bubbleDmInput, setBubbleDmInput] = useState('');
  const [isBubbleNpcTyping, setIsBubbleNpcTyping] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [showPhotoDrawer, setShowPhotoDrawer] = useState(false);
  const [localBubbleChats, setLocalBubbleChats] = useState<Record<string, ChatMessage[]>>({});
  const bubbleChatEndRef = useRef<HTMLDivElement>(null);

  // Fan Bubble 1v1 Private Messages State
  const [internalFanThreads, setInternalFanThreads] = useState<FanBubbleThread[]>(() => [
    {
      id: 'fan_init_station',
      fanName: '@Sooyeon_Cam0321',
      fanRole: '金牌站姐（数据女工）',
      avatarEmoji: '📸',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      loyalty: 82,
      pendingLoyaltyGain: 15,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '刚刚',
      messages: [
        {
          sender: 'fan',
          text: '宝！！今天公开练习室的4K竖屏直拍我已经精修完发推了，十分钟转赞破五千！！(≧∇≦)ﾉ 数据组今晚继续通宵切瓜刷榜，秀妍只管在舞台上闪闪发光！！❤️🔥',
          timeLabel: clockStr,
        },
      ],
    },
    {
      id: 'fan_init_loyal',
      fanName: '陪伴秀妍直到世界尽头',
      fanRole: '死忠老粉',
      avatarEmoji: '💖',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      loyalty: 90,
      pendingLoyaltyGain: 18,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '2分钟前',
      messages: [
        {
          sender: 'fan',
          text: '呜呜呜我的小公主ㅠㅠ 看到你这周兼顾学业和声乐刀群舞训练连轴转，镜头拉近的时候都瘦了一圈，妈妈粉心疼得眼泪狂飙(T_T) 今晚一定要吃顿热乎的韩牛补补身体呀！！💖✨',
          timeLabel: clockStr,
        },
      ],
    },
    {
      id: 'fan_init_funny',
      fanName: '今天也在为秀妍哐哐撞大墙',
      fanRole: '搞笑整活粉',
      avatarEmoji: '🤣',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      loyalty: 76,
      pendingLoyaltyGain: 14,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '5分钟前',
      messages: [
        {
          sender: 'fan',
          text: '救命啊警察叔叔！！这里有人在舞台上用美貌纵火！！(*≧ω≦) 秀妍你知道你今天犯了什么规吗？犯了让我一眼万年的心动规！！我已经把你的Ending妖精截图贴满宿舍床头了哈哈哈哈！！🎉💖',
          timeLabel: clockStr,
        },
      ],
    },
  ]);

  const fanThreads = externalFanThreads && externalFanThreads.length > 0 ? externalFanThreads : internalFanThreads;
  const setFanThreads: React.Dispatch<React.SetStateAction<FanBubbleThread[]>> =
    onUpdateFanBubbleThreads || setInternalFanThreads;

  const [activeFanThreadId, setActiveFanThreadId] = useState<string | null>(null);
  const [fanReplyInput, setFanReplyInput] = useState('');
  const [isGeneratingFanDMs, setIsGeneratingFanDMs] = useState(false);
  const [isFanReplying, setIsFanReplying] = useState(false);
  const [hasAutoFetchedOnEnter, setHasAutoFetchedOnEnter] = useState(false);
  const fanChatEndRef = useRef<HTMLDivElement>(null);

  const activeFanThread = fanThreads.find((f) => f.id === activeFanThreadId) || null;
  const unreadFanCount = fanThreads.filter((f) => f.hasUnread).length;
  const totalFanLoyalty = fanThreads.reduce((acc, f) => acc + f.loyalty, 0);

  const buildPlayerStateForFanBubble = (customScheduleOverride?: string): FanBubblePlayerState => {
    const identityStatus =
      stats.darkIndex >= 45
        ? '陷入热议舆论风波却凭神级舞台逆风翻盘的话题焦点'
        : stats.isDebutedIdol && stats.snsFollowers >= 35000
        ? '横扫韩网音源榜与打歌一位的当红顶流女团Center'
        : stats.isDebutedIdol
        ? '刚出道的 A 班怪兽新人爱豆'
        : stats.traineeGrade?.includes('A')
        ? '企划社公开企划 A 班王牌新人练习生'
        : '首尔女高颜值与实力兼备的人气练习生';

    const recentSchedule =
      customScheduleOverride ||
      recentScheduleSummary ||
      (stats.isDebutedIdol
        ? `刚在《音乐银行》拿下一位安可舞台，且最新动态「${snsPosts[0]?.tag || '#打歌舞台'}」引爆韩网`
        : stats.academics >= 82
        ? `在首尔女高周考中表现惊艳名列前茅，同时完成高强度练习室考核直拍`
        : `刚完成企划社月度舞台评测与时尚画报拍摄，直拍播放量暴涨`);

    return {
      identityStatus,
      recentSchedule,
      fanPersonas: ['【金牌站姐（数据女工）】', '【死忠老粉】', '【搞笑整活粉】'],
      playerName: protagonistName,
      stats,
      weekLabel,
      aiConfig,
    };
  };

  const triggerFetchFanBubbleMessages = async (customScheduleOverride?: string, forceFetch = false) => {
    if (isGeneratingFanDMs) return;
    if (!forceFetch && hasAutoFetchedOnEnter && !customScheduleOverride) return;
    setHasAutoFetchedOnEnter(true);
    setIsGeneratingFanDMs(true);

    try {
      const playerState = buildPlayerStateForFanBubble(customScheduleOverride);
      const generatedItems = await generateFanBubbleMessages(playerState);

      if (Array.isArray(generatedItems) && generatedItems.length > 0) {
        const nowStamp = Date.now();
        const newThreads: FanBubbleThread[] = generatedItems.slice(0, 3).map((item, idx) => {
          const isStation = item.fanRole.includes('站姐');
          const isFunny = item.fanRole.includes('搞笑') || item.fanRole.includes('整活');
          return {
            id: `fan_ai_${nowStamp}_${idx}`,
            fanName: item.fanName,
            fanRole: item.fanRole,
            avatarEmoji: isStation ? '📸' : isFunny ? '🤣' : '💖',
            badgeColor: isStation
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : isFunny
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : 'bg-rose-100 text-rose-800 border-rose-300',
            loyalty: isStation ? 85 : isFunny ? 78 : 92,
            pendingLoyaltyGain: item.loyaltyGain || 15,
            hasUnread: true,
            unreadCount: 1,
            updatedAtLabel: '刚刚 · 新来信',
            messages: [
              {
                sender: 'fan',
                text: item.message,
                timeLabel: clockStr,
              },
            ],
          };
        });

        setFanThreads((prev) => [...newThreads, ...prev.slice(0, 6)]);
        setUnreadBadges((prev) => ({ ...prev, bubble: prev.bubble + newThreads.length }));
      }
    } catch {
      // Fallback already handled inside generateFanBubbleMessages
    } finally {
      setIsGeneratingFanDMs(false);
    }
  };

  // If modal opened directly into Bubble tab, auto-fetch fresh AI fan messages
  useEffect(() => {
    if (activeTab === 'bubble' && !hasAutoFetchedOnEnter) {
      triggerFetchFanBubbleMessages();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'bubble' && bubbleMode === 'fan_dm' && activeFanThreadId) {
      fanChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, bubbleMode, activeFanThreadId, fanThreads, isFanReplying]);

  const handleOpenFanThread = (threadId: string) => {
    setActiveFanThreadId(threadId);
    setFanThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, hasUnread: false, unreadCount: 0 } : t))
    );
  };

  const handleSendReplyToFan = async (replyText?: string) => {
    const cleanReply = (replyText ?? fanReplyInput).trim();
    if (!cleanReply || !activeFanThread || isFanReplying) return;

    setFanReplyInput('');
    setIsFanReplying(true);

    const lastFanMsg =
      [...activeFanThread.messages].reverse().find((m) => m.sender === 'fan')?.text ||
      activeFanThread.messages[0]?.text ||
      '';

    const userTurn = {
      sender: 'user' as const,
      text: cleanReply,
      timeLabel: clockStr,
    };

    // Append player's reply immediately
    setFanThreads((prev) =>
      prev.map((t) =>
        t.id === activeFanThread.id
          ? {
              ...t,
              hasUnread: false,
              unreadCount: 0,
              updatedAtLabel: '刚刚已翻牌',
              messages: [...t.messages, userTurn],
            }
          : t
      )
    );

    try {
      const playerState = buildPlayerStateForFanBubble();
      const aiReaction = await generateFanBubbleReply({
        fanName: activeFanThread.fanName,
        fanRole: activeFanThread.fanRole,
        previousFanMessage: lastFanMsg,
        playerReply: cleanReply,
        identityStatus: playerState.identityStatus,
        recentSchedule: playerState.recentSchedule,
        baseLoyaltyGain: activeFanThread.pendingLoyaltyGain,
        aiConfig,
      });

      const reactionBubbles =
        aiReaction.bubbles && aiReaction.bubbles.length > 0
          ? aiReaction.bubbles
          : [aiReaction.reply];

      // Sequential multi-bubble pop-in for fan's ecstatic reaction
      for (let i = 0; i < reactionBubbles.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 240));
        }
        const partial = reactionBubbles.slice(0, i + 1);
        const isLast = i === reactionBubbles.length - 1;
        const fanReactionTurn = {
          sender: 'fan' as const,
          text: partial.join('\n'),
          bubbles: partial,
          timeLabel: clockStr,
          emotionTag: isLast ? aiReaction.emotionTag : undefined,
          loyaltyDelta: isLast ? aiReaction.loyaltyGain : undefined,
        };

        setFanThreads((prev) =>
          prev.map((t) => {
            if (t.id !== activeFanThread.id) return t;
            const baseMsgs = [...t.messages];
            // Replace or append the in-progress fan reaction turn
            const lastIdx = baseMsgs.length - 1;
            if (lastIdx >= 0 && baseMsgs[lastIdx].sender === 'fan' && i > 0) {
              baseMsgs[lastIdx] = fanReactionTurn;
            } else {
              baseMsgs.push(fanReactionTurn);
            }
            return {
              ...t,
              loyalty: isLast ? t.loyalty + aiReaction.loyaltyGain : t.loyalty,
              messages: baseMsgs,
            };
          })
        );
      }

      if (onUpdateStats) {
        onUpdateStats({
          snsFollowers: stats.snsFollowers + (aiReaction.followerBonus || 180),
          mood: Math.min(100, stats.mood + 5),
          social: Math.min(100, stats.social + 3),
        });
      }

      onNotify(
        `💖 翻牌成功！【${activeFanThread.fanName}】(${activeFanThread.fanRole}) ${aiReaction.emotionTag}！粉丝粘性 +${aiReaction.loyaltyGain}，安利涨粉 +${aiReaction.followerBonus}！`
      );
    } catch {
      onNotify('粉丝激动得信号卡顿了一下，已送达你的心意！');
    } finally {
      setIsFanReplying(false);
    }
  };

  const currentBubbleNpc = npcs.find((n) => n.id === selectedBubbleNpcId) || npcs[0];

  const getNpcBubbleMessages = (npcObj: NPCClassmate): ChatMessage[] => {
    const fromGlobal = chatHistories[npcObj.id];
    if (fromGlobal && fromGlobal.length > 0) return fromGlobal;
    const fromLocal = localBubbleChats[npcObj.id];
    if (fromLocal && fromLocal.length > 0) return fromLocal;
    return [
      {
        sender: 'npc',
        timeLabel: clockStr,
        actionDesc: `${npcObj.chineseName}刚刚在 Bubble 上向你挥了挥手`,
        text: `秀妍，今天在学校过得怎么样？\n有空记得回我消息哦~`,
        bubbles: [`秀妍，今天在学校过得怎么样？`, `有空记得回我消息哦~`],
      },
    ];
  };

  const updateNpcBubbleMessages = (npcId: string, msgs: ChatMessage[]) => {
    setLocalBubbleChats((prev) => ({ ...prev, [npcId]: msgs }));
    if (onUpdateChatHistory) {
      onUpdateChatHistory(npcId, msgs);
    }
  };

  useEffect(() => {
    if (activeTab === 'bubble' && bubbleMode === 'npc_dm') {
      bubbleChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, bubbleMode, selectedBubbleNpcId, localBubbleChats, chatHistories, isBubbleNpcTyping]);

  const koreanStickers = [
    { id: 'stk_milk', emoji: '🍓🥛', label: '送你草莓牛奶', promptText: '[发送了表情包：🍓递上一盒冰镇草莓牛奶]' },
    { id: 'stk_cat', emoji: '🐱✨', label: '猫猫探头贴贴', promptText: '[发送了表情包：🐱小猫悄悄探头盯——]' },
    { id: 'stk_heart', emoji: '🫶💕', label: '双手比大大的心', promptText: '[发送了表情包：🫶给你比一个超大爱心]' },
    { id: 'stk_hug', emoji: '🥺🫂', label: '委屈求抱抱安慰', promptText: '[发送了表情包：🥺今天有点累，求摸摸头]' },
    { id: 'stk_fire', emoji: '🔥💃', label: '练习室燃起来了', promptText: '[发送了表情包：🔥今天练习状态拉满冲呀]' },
    { id: 'stk_moon', emoji: '🌙💤', label: '道晚安好梦贴纸', promptText: '[发送了表情包：🌙盖好小被子晚安好梦]' },
  ];

  const shareablePhotos = [
    {
      id: 'ph_mirror',
      title: '练习室镜面自拍',
      emoji: '🤳✨',
      desc: '刚练完舞带着微汗的镜面自拍照',
      promptText: '[发来一张照片：刚在练习室落地镜前拍的穿搭自拍]',
    },
    {
      id: 'ph_cafe',
      title: '圣水洞燕麦拿铁',
      emoji: '☕🍰',
      desc: '拉花超精致的冰燕麦拿铁与可露丽',
      promptText: '[发来一张照片：圣水洞咖啡店的两杯冰拿铁和甜点]',
    },
    {
      id: 'ph_notes',
      title: '双色荧光笔课堂笔记',
      emoji: '📓✏️',
      desc: '整理得工工整整的考前重点笔记',
      promptText: '[发来一张照片：刚用双色荧光笔整理好的模拟考重点笔记]',
    },
    {
      id: 'ph_sunset',
      title: '首尔女高天台晚霞',
      emoji: '🌇🌸',
      desc: '粉紫色的傍晚天空与汉江远景',
      promptText: '[发来一张照片：放学时在学校天台拍到的粉紫色晚霞]',
    },
  ];

  const handleSendBubbleDm = async (rawMessageText: string, displayLabel?: string) => {
    const trimmed = rawMessageText.trim();
    if (!trimmed || isBubbleNpcTyping || !currentBubbleNpc) return;

    setShowStickerDrawer(false);
    setShowPhotoDrawer(false);

    const existingMsgs = getNpcBubbleMessages(currentBubbleNpc);
    const userMsg: ChatMessage = {
      sender: 'user',
      text: displayLabel || trimmed,
      timeLabel: clockStr,
    };
    const updatedWithUser = [...existingMsgs, userMsg];
    updateNpcBubbleMessages(currentBubbleNpc.id, updatedWithUser);
    setBubbleDmInput('');
    setIsBubbleNpcTyping(true);

    try {
      const aiRes = await generateNpcChatReply({
        aiConfig,
        npc: currentBubbleNpc,
        userMessage: trimmed,
        history: updatedWithUser,
        memories: currentBubbleNpc.memories || [],
        stats,
        location,
        timeContext: `${weekLabel} ${clockStr}`,
      });

      const bubbles = splitNpcReplyIntoBubbles(aiRes.reply, aiRes.replies, trimmed);
      const favDelta = typeof aiRes.favorabilityDelta === 'number' ? aiRes.favorabilityDelta : 4;

      if (aiRes.newMemory && recordNpcMemory) {
        recordNpcMemory(currentBubbleNpc.id, `[${weekLabel}] ${aiRes.newMemory}`);
      }

      // Sequential multi-bubble pop-in (260ms interval)
      for (let i = 0; i < bubbles.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 260));
        }
        const partialBubbles = bubbles.slice(0, i + 1);
        const isLast = i === bubbles.length - 1;
        const npcReplyMsg: ChatMessage = {
          sender: 'npc',
          text: partialBubbles.join('\n'),
          bubbles: partialBubbles,
          timeLabel: clockStr,
          actionDesc: aiRes.actionDesc,
          innerThought: isLast ? aiRes.innerThought : undefined,
          favDelta: isLast ? favDelta : undefined,
          newMemory: isLast && aiRes.newMemory ? aiRes.newMemory : undefined,
        };
        updateNpcBubbleMessages(currentBubbleNpc.id, [...updatedWithUser, npcReplyMsg]);
      }

      if (onUpdateFavorability) {
        onUpdateFavorability(currentBubbleNpc.id, favDelta);
      }
      if (onUpdateStats) {
        onUpdateStats({
          mood: Math.min(100, stats.mood + 3),
          social: Math.min(100, stats.social + 2),
        });
      }
    } catch {
      const fallbackBubbles = ['刚看到你的消息~', '待会儿下课我们见面再细聊吧！'];
      const fallbackMsg: ChatMessage = {
        sender: 'npc',
        text: fallbackBubbles.join('\n'),
        bubbles: fallbackBubbles,
        timeLabel: clockStr,
        actionDesc: `${currentBubbleNpc.chineseName}秒回了你的 Bubble 消息`,
        innerThought: `每次收到秀妍的消息心情都会变好。`,
        favDelta: 3,
      };
      updateNpcBubbleMessages(currentBubbleNpc.id, [...updatedWithUser, fallbackMsg]);
      if (onUpdateFavorability) {
        onUpdateFavorability(currentBubbleNpc.id, 3);
      }
    } finally {
      setIsBubbleNpcTyping(false);
    }
  };

  // Fan Subscription Bubble state
  const [bubbleFeed, setBubbleFeed] = useState<
    { id: string; text: string; tag: string; time: string; fanReplies: string[] }[]
  >([
    {
      id: 'b_init',
      tag: '🤳 练习室日常泡泡',
      text: '今天也在练习室把副歌动作抠了五十遍~ 大家今晚也要早点休息哦，晚安🌙',
      time: '昨天 23:15',
      fanReplies: [
        '秀妍宝宝辛苦了ㅠㅠ 今晚梦里见！！',
        '全世界最宠粉的养成系紫微星，我们永远陪你走花路🌸',
        '已经把秀妍的Bubble设成特别关心提示音啦！',
      ],
    },
  ]);
  const [customBubbleText, setCustomBubbleText] = useState('');

  const bubbleActions = [
    {
      id: 'b_selfie',
      title: '🤳 发送刚练完舞的镜面自拍 + 晚安语音',
      tag: '🤳 独家自拍泡泡',
      defaultText: '刚从练习室出来，衣服都汗湿啦~ 但想到你们在等我的泡泡就一点都不觉得累！早点睡哦💕',
      effect: { snsFollowers: 2600, coins: 58000, cameraSkill: 5, mood: 8, stamina: -6 },
      replies: [
        '啊啊啊是新鲜的练习室素颜自拍！！皮肤好到发光ㅠㅠ',
        '秀妍一定要注意补充水分，我们永远是你的底气！',
        '这月订Bubble的4500韩元简直花得太值了，每天幸福感爆棚！',
      ],
    },
    {
      id: 'b_vocal',
      title: '🎤 发送45秒清唱未公开Demo音频泡泡',
      tag: '🎤 清唱语音泡泡',
      defaultText: '睡前在被窝里偷偷给你们哼一小段新写的旋律，只给订阅Bubble的专属粉丝听哦 🎵',
      effect: { snsFollowers: 3200, coins: 72000, vocalSkill: 6, traineeProgress: 5, stamina: -6 },
      replies: [
        '救命这蜜嗓清唱我直接循环了五十遍！！耳膜被净化了！',
        '制作人快来看啊，我们秀妍不仅颜值顶配，连自作曲都这么好听！',
        '已设为清晨闹钟，每天被秀妍的歌声叫醒太幸福了！',
      ],
    },
    {
      id: 'b_fanletter',
      title: '💌 翻牌回复10封粉丝长信与高三考生应援',
      tag: '💌 宠粉翻牌泡泡',
      defaultText: '每一封信我都一字不落地读完啦！正在备战高考和努力生活的大家，我们一起在顶峰相见吧✨',
      effect: { snsFollowers: 3800, coins: 85000, social: 10, mood: 12, stamina: -8 },
      replies: [
        '天哪秀妍居然翻牌了我的高考倒计时信！！我直接哭出声，明天刷题动力拉满！',
        '双向奔赴的神仙爱豆李秀妍，一辈子不脱粉！！',
        '韩网热帖：《连粉丝手写信里提过的小细节都记住的李秀妍》万赞出圈！',
      ],
    },
  ];

  // ============================================================================
  // 3. KAKAOTALK GROUP CHAT STATE
  // ============================================================================
  const [contactFilter, setContactFilter] = useState<'all' | 'dynamic'>('all');
  const [kakaoMode, setKakaoMode] = useState<'group' | 'contacts'>('group');
  const [groupType, setGroupType] = useState<'class' | 'idol'>('class');
  const [groupInput, setGroupInput] = useState('');
  const [isGroupSending, setIsGroupSending] = useState(false);
  const [groupMessages, setGroupMessages] = useState<
    { sender: 'user' | 'npc'; name: string; avatar?: string; text: string; time: string }[]
  >([
    {
      sender: 'npc',
      name: '金智英',
      text: '今天食堂中午有芝士辣炒鸡排！下课铃一响谁跟我冲第一波？✨',
      time: '11:45',
    },
    {
      sender: 'npc',
      name: '朴敏英',
      text: '我已经帮秀妍把餐盘和湿纸巾准备好啦~ 🍓',
      time: '11:46',
    },
    {
      sender: 'npc',
      name: '韩素拉',
      text: '你们去吧，顺便帮我带一瓶无糖冰美式，钱转KakaoPay。',
      time: '11:47',
    },
  ]);

  const handleSendGroupMessage = async (msgText?: string) => {
    const text = (msgText ?? groupInput).trim();
    if (!text || isGroupSending) return;

    const nowTime = '刚刚';
    setGroupMessages((prev) => [...prev, { sender: 'user', name: '李秀妍 (我)', text, time: nowTime }]);
    setGroupInput('');
    setIsGroupSending(true);

    try {
      const replies = await generateGroupChatReplies({
        userMessage: text,
        groupType,
        npcs,
        timeContext: weekLabel,
        aiConfig,
      });

      for (let i = 0; i < replies.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 240));
        }
        const r = replies[i];
        const shortBubbles = splitNpcReplyIntoBubbles(r.text, undefined, text);
        const bubbleText = shortBubbles[0] || r.text;
        setGroupMessages((prev) => [
          ...prev,
          {
            sender: 'npc' as const,
            name: r.npcName,
            text: bubbleText,
            time: '刚刚',
          },
        ]);
      }

      onPublishPost(
        {
          id: `grp_${Date.now()}`,
          weekLabel,
          tag: '#Kakao群聊互动',
          caption: `在群里和大家热聊了日常话题`,
          likes: 120,
          followerGain: 60,
          npcComments: [],
        },
        { mood: 6, social: 5 }
      );
      if (onUpdateFavorability) {
        replies.forEach((r) => {
          if (r.npcId) onUpdateFavorability(r.npcId, 3);
        });
      }
    } catch (_e) {
      setGroupMessages((prev) => [
        ...prev,
        {
          sender: 'npc',
          name: '朴敏英',
          text: `我举双手赞成！放学后我们一起行动吧~`,
          time: '刚刚',
        },
      ]);
    } finally {
      setIsGroupSending(false);
    }
  };

  // ============================================================================
  // 4. THEQOO GOSSIP FORUM & ANONYMOUS CONFESSION WALL (Refactored 'blind' tab)
  // ============================================================================
  const [theqooCategory, setTheqooCategory] = useState<'all' | 'trainee' | 'school' | 'confess'>('all');
  const [isRefreshingForum, setIsRefreshingForum] = useState(false);
  const [newAnonPostInput, setNewAnonPostInput] = useState('');
  const [likedForumTitles, setLikedForumTitles] = useState<string[]>([]);
  const [commentingForumTitle, setCommentingForumTitle] = useState<string | null>(null);
  const [forumCommentInput, setForumCommentInput] = useState('');

  const [theqooPosts, setTheqooPosts] = useState<ForumPost[]>([
    {
      author: '匿名Theqoo吃瓜群众',
      tag: '🎤 练习生瓜',
      title: '[HOT] 高一(1)班那个练习生是谁？今天舞蹈考核直接惊艳全场！',
      content:
        '今天下午路过企划社地下A级考核厅，隔着玻璃看到李秀妍跳的那段高难度卡点，连一向严格的首席导师都当场点头给了A+！这实力绝对是五代女团ACE预定吧？',
      likes: 642,
      comments: [
        '1L: 大发！！我今天在走廊也看见她了，生图皮肤白到发光！',
        '2L: 千宥娜前辈好像也很看重她，经常下课后跟她一起留下来加练。',
        '3L: 趁现在还没正式出道赶紧入股，以后绝对是百万直拍神颜！',
      ],
    },
    {
      author: '汉江夜跑偶遇者',
      tag: '🏫 校园竹林',
      title: '[爆料] 某人气练习生被拍到傍晚在汉江散步？氛围感完全像拍韩剧',
      content:
        '刚在盘浦汉江公园买便利店拉面的时候，偶遇1-1班的李秀妍在江边吹风，晚风吹起校服百褶裙的样子完全就是青春电影女主角，连路人都在频频回头！',
      likes: 518,
      comments: [
        '1L: 救命，光看文字描述就已经脑补出一整部浪漫韩剧了！',
        '2L: 金智英已经在班群里认领了，说是放学去拍人生四格顺路散步哈哈。',
        '3L: 颜值高真的随便走走都是画报级别。',
      ],
    },
    {
      author: '四大社企划情报站',
      tag: '🎤 练习生瓜',
      title: '[预测] 本月出道预备役顺位预测贴 & 首尔女高风云榜更新',
      content:
        '综合目前的声乐、舞蹈与镜头表现力评分，李秀妍不仅稳居月末评价上位圈，连全校模拟考内申成绩都名列前茅，听说韩素拉都把她当成唯一认可的对手！',
      likes: 735,
      comments: [
        '1L: 颜值与实力并存的全能ACE，我投李秀妍一票！',
        '2L: 坐等月底公开考核舞台，已经准备好应援手幅了！',
      ],
    },
    {
      author: '某高一(1)班匿名同学',
      tag: '💌 匿名表白',
      title: '[心动投递] 每次上课转头借橡皮的时候，心跳都快得要命',
      content:
        '其实从开学第一周看到你坐在窗边阳光里的样子就移不开眼了。今天午休广播室李恩宇学长点播的那首《Through the Night》，我也在走廊里偷偷陪你听完了。',
      likes: 389,
      comments: [
        '1L: 嗑到了嗑到了！！这是谁写的匿名情书快出来认领！',
        '2L: 我们秀妍真是全校白月光级别的人气王~',
      ],
    },
  ]);

  const handleRefreshTheqooGossip = async (customPostText?: string) => {
    if (isRefreshingForum) return;
    setIsRefreshingForum(true);
    try {
      const generated = await generateCampusForumPosts({
        aiConfig,
        stats,
        timeContext: weekLabel,
        recentMemories,
        playerPost: customPostText,
      });
      if (Array.isArray(generated) && generated.length > 0) {
        setTheqooPosts((prev) => [...generated, ...prev.slice(0, 6)]);
      }
      if (customPostText) {
        setNewAnonPostInput('');
        if (onUpdateStats) {
          onUpdateStats({
            social: Math.min(100, stats.social + 6),
            snsFollowers: stats.snsFollowers + 450,
            mood: Math.min(100, stats.mood + 5),
          });
        }
        onNotify('🔥 匿名发帖成功！Theqoo 论坛瞬间盖起高楼，校园声望 +6，粉丝 +450！');
      } else {
        onNotify('🔄 已实时刷新 Theqoo 内部匿名论坛最新八卦热帖！');
      }
    } catch {
      onNotify('论坛刷新稍忙，已展示最新缓存热帖~');
    } finally {
      setIsRefreshingForum(false);
    }
  };

  const handleAddForumComment = (postTitle: string) => {
    const clean = forumCommentInput.trim();
    if (!clean) return;
    setTheqooPosts((prev) =>
      prev.map((p) =>
        p.title === postTitle
          ? {
              ...p,
              likes: p.likes + 15,
              comments: [...p.comments, `${p.comments.length + 1}L (匿名楼主/当事人人气跟帖): ${clean}`],
            }
          : p
      )
    );
    setForumCommentInput('');
    setCommentingForumTitle(null);
    if (onUpdateStats) {
      onUpdateStats({
        social: Math.min(100, stats.social + 4),
        snsFollowers: stats.snsFollowers + 220,
      });
    }
    onNotify('💬 匿名吃瓜跟帖成功！全校讨论度飙升，声望 +4，粉丝 +220！');
  };

  // ============================================================================
  // 5. AI PHOTO STUDIO & OUTFIT / NPC PHOTO ALBUM (Can set as Phone Wallpaper!)
  // ============================================================================
  const [studioMode, setStudioMode] = useState<'album' | 'generator'>('album');
  const [albumFilter, setAlbumFilter] = useState<'all' | 'portrait' | 'stage' | 'npc_group'>('all');
  const [aiPromptInput, setAiPromptInput] = useState(
    '韩系清纯女高，柔顺栗棕色长发，水光感杏眼，奶油色校服针织开衫配酒红领结，樱花教室柔光'
  );
  const [aiStylePreset, setAiStylePreset] = useState<'webtoon' | 'anime' | 'idol' | 'watercolor'>('webtoon');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>(protagonistAvatar || '/avatars/sooyeon_default.jpg');
  const [lightboxItem, setLightboxItem] = useState<GalleryPhotoItem | null>(null);

  const [galleryItems, setGalleryItems] = useState<GalleryPhotoItem[]>(() => [
    {
      id: 'gal_default_portrait',
      title: '首尔女高 · 春日樱花校服公式照',
      category: 'portrait',
      categoryLabel: '✨ 主角立绘',
      imageUrl: protagonistAvatar || '/avatars/sooyeon_default.jpg',
      desc: '高一开学季在教室窗边留下的清纯校服立绘，阳光洒在栗棕色发梢上。',
      dateLabel: '高1 · 入学纪念',
    },
    {
      id: 'gal_stage_1',
      title: '《PRODUCE 首尔》初C位打歌高定舞台照',
      category: 'stage',
      categoryLabel: '👑 打歌舞台服装',
      imageUrl:
        'https://image.pollinations.ai/prompt/stunning%205th-gen%20K-pop%20idol%20girl%20center%20stage%20outfit%20white%20and%20silver%20sequin%20uniform%20spotlight%20manhwa%20style?width=512&height=512&seed=8821&nologo=true',
      desc: '身着银白星光镶钻学院风打歌服，戴着定制耳返在聚光灯下定格的传奇 Ending 画面。',
      dateLabel: '公开舞台直拍',
    },
    {
      id: 'gal_stage_2',
      title: '圣水洞高奢学院风 Miu系私服画报',
      category: 'stage',
      categoryLabel: '👗 舞台与私服画报',
      imageUrl:
        'https://image.pollinations.ai/prompt/Korean%20webtoon%20manhwa%20style%20high%20school%20girl%20luxury%20preppy%20cardigan%20pleated%20skirt%20Seongsu-dong%20street%20snap?width=512&height=512&seed=9912&nologo=true',
      desc: '周末在圣水洞概念店拍摄的早秋针织穿搭画报，被韩网评为女高穿搭教科书。',
      dateLabel: 'Stargram 万赞神图',
    },
    {
      id: 'gal_npc_minyoung',
      title: '与朴敏英 · 弘大 Photoism 人生四格合影',
      category: 'npc_group',
      categoryLabel: '📸 NPC 羁绊合影',
      imageUrl: npcs.find((n) => n.id === 'npc_1')?.avatar || '/avatars/npc_1.jpg',
      desc: '和同桌死党朴敏英戴着兔耳朵头饰在人生四格拍贴机里比心的纪念照。',
      dateLabel: '同桌死党纪念',
    },
    {
      id: 'gal_npc_sora',
      title: '与韩素拉 · 大峙洞深夜自习室并肩留影',
      category: 'npc_group',
      categoryLabel: '📸 NPC 羁绊合影',
      imageUrl: npcs.find((n) => n.id === 'npc_3')?.avatar || '/avatars/npc_3.jpg',
      desc: '刷完压轴卷后，韩素拉难得放下笔与你分喝热美式的珍贵瞬间。',
      dateLabel: '双A学霸羁绊',
    },
    {
      id: 'gal_npc_yuna',
      title: '与千宥娜 · 独立练习室深夜合练镜面照',
      category: 'npc_group',
      categoryLabel: '📸 NPC 羁绊合影',
      imageUrl: npcs.find((n) => n.id === 'npc_6')?.avatar || '/avatars/npc_6.jpg',
      desc: '排练完双人 Dance Break 后，千宥娜揽着你的肩膀对镜拍下的黑白质感合照。',
      dateLabel: '王牌搭档纪念',
    },
  ]);

  const handleGenerateAIAvatar = async () => {
    if (!aiPromptInput.trim() || isGeneratingAvatar) return;
    setIsGeneratingAvatar(true);
    try {
      const res = await generateAICharacterAvatar({
        targetId: 'protagonist',
        characterName: '李秀妍',
        customPrompt: aiPromptInput.trim(),
        stylePreset: aiStylePreset,
        gender: 'female',
      });
      setPreviewAvatarUrl(res.avatarUrl);
      if (onChangeProtagonistAvatar) {
        onChangeProtagonistAvatar(res.avatarUrl);
      }
      const newGalleryItem: GalleryPhotoItem = {
        id: `gal_ai_${Date.now()}`,
        title: `AI 写真 · ${aiPromptInput.trim().slice(0, 12)}`,
        category: 'portrait',
        categoryLabel: '🎨 AI 生成立绘',
        imageUrl: res.avatarUrl,
        desc: aiPromptInput.trim(),
        dateLabel: weekLabel,
      };
      setGalleryItems((prev) => [newGalleryItem, ...prev]);
      onNotify('✨ AI 实时生图完成！已存入你的穿搭相册并更新全局立绘头像！');
    } catch (_e) {
      onNotify('AI 生图请求繁忙，请稍后重试~');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // ============================================================================
  // 6. LIFE SERVICES (Folded into Page 2 / Folder: Delivery, Alba, PR Deals)
  // ============================================================================
  const [shareNpcId, setShareNpcId] = useState<string>('npc_1');

  const brandPRDeals = [
    {
      id: 'pr_oliveyoung',
      brand: 'Olive Young · 销冠水光镜面唇釉推广',
      minFollowers: 1000,
      pay: 45000,
      followerBoost: 1500,
      desc: '拍摄一组课间涂抹水光唇釉的清透九宫格返图，标注品牌Tag。',
      effect: { coins: 45000, snsFollowers: 1500, appearance: 4, mood: 6, stamina: -6 },
    },
    {
      id: 'pr_yonsei',
      brand: '延世大学牧场 · 生牛乳奶油面包校园大使',
      minFollowers: 3500,
      pay: 85000,
      followerBoost: 2800,
      desc: '在教室与同桌一起拍摄爆浆奶油面包吃播Reels短视频。',
      effect: { coins: 85000, snsFollowers: 2800, social: 6, mood: 8, stamina: -6 },
    },
    {
      id: 'pr_gentle',
      brand: 'GENTLE MONSTER · 圣水洞概念旗舰店画报',
      minFollowers: 10000,
      pay: 180000,
      followerBoost: 6500,
      desc: '受邀前往圣水洞HAUS DOSAN拍摄先锋墨镜时尚街拍。',
      effect: { coins: 180000, snsFollowers: 6500, appearance: 8, cameraSkill: 8, stamina: -10 },
    },
    {
      id: 'pr_miumiu',
      brand: 'Miu Miu · 清潭洞高奢学院风大秀看秀邀约',
      minFollowers: 25000,
      pay: 420000,
      followerBoost: 16000,
      desc: '身着品牌当季秀款百褶裙出席首尔大秀头排，外媒生图刷屏热搜！',
      effect: { coins: 420000, snsFollowers: 16000, appearance: 12, social: 14, cameraSkill: 12, stamina: -12 },
    },
  ];

  const deliveryItems = [
    {
      id: 'del_bhc',
      name: '🍗 BHC 芝士球 + 蜂蜜芥末炸鸡双拼',
      shop: 'BHC Chicken 江南总店 · 25分钟闪送',
      price: 24000,
      desc: '酥脆爆浆芝士球配无骨炸鸡！立即恢复 体力+32、心情+18，还可邀请好友同享 (+8好感)！',
      effect: { stamina: 32, mood: 18, coins: -24000 },
      canShare: true,
    },
    {
      id: 'del_mega',
      name: '☕ Mega Coffee 1L装冰美式 & 草莓拿铁',
      shop: 'Mega MGC Coffee · 15分钟送达',
      price: 8500,
      desc: '韩国高中生刷题与早训必备续命水！体力+18、学业+4、暗黑压力-8。',
      effect: { stamina: 18, academics: 4, darkIndex: -8, coins: -8500 },
      canShare: true,
    },
    {
      id: 'del_olive',
      name: '💄 Olive Young 销冠水光唇釉 & 积雪草面膜礼盒',
      shop: 'Olive Young 即时达 · 30分钟闪送',
      price: 35000,
      desc: '清潭洞化妆师同款水光肌急救包！外形+9、镜头感+5、粉丝+1,200。',
      effect: { appearance: 9, cameraSkill: 5, snsFollowers: 1200, coins: -35000 },
      canShare: false,
    },
    {
      id: 'del_ginseng',
      name: '💊 正官庄 Everytime 高丽红参精浓缩液礼盒',
      shop: '正官庄官方旗舰店 · 闪送',
      price: 48000,
      desc: '高三冲刺与选秀连轴转的终极元气补给！体力+50、心情+12、暗黑压力-18。',
      effect: { stamina: 50, mood: 12, darkIndex: -18, coins: -48000 },
      canShare: false,
    },
    {
      id: 'del_boba_truck',
      name: '🧋 贡茶黑糖珍珠奶茶 · 全班/练习室豪华应援请客',
      shop: 'Gong Cha 校园应援专送',
      price: 75000,
      desc: '豪气请全班同学与练习室伙伴喝奶茶！全员NPC好感+6、社交+15、粉丝+2,800！',
      effect: { social: 15, mood: 20, snsFollowers: 2800, coins: -75000 },
      shareAll: true,
    },
  ];

  const albaJobs = [
    {
      id: 'alba_illust',
      title: '🎨 Webtoon 韩漫读者Q版头像线稿约稿',
      tag: '手机远程兼职 · 当日结算',
      staminaCost: 12,
      pay: 45000,
      desc: '用平板帮网友绘制韩系Q版情侣/闺蜜头像，足不出户赚取丰厚稿费。',
      effect: { coins: 45000, mood: 4, appearance: 2, stamina: -12 },
    },
    {
      id: 'alba_notes',
      title: '📝 整理大峙洞一等级学霸手写错题PDF售卖',
      tag: '知识付费 · 边赚边学',
      staminaCost: 14,
      pay: 58000,
      desc: '将精心排版的数学与英语高频考点手帐上传至学习社区付费下载。',
      effect: { coins: 58000, academics: 5, social: 4, stamina: -14 },
    },
    {
      id: 'alba_model',
      title: '👗 Musinsa / 弘大潮牌网店私服寄拍模特',
      tag: '高薪穿搭寄拍 · 涨粉兼职',
      staminaCost: 15,
      pay: 88000,
      desc: '换上品牌寄来的新款学院风开衫对镜自拍返图，兼得高额模特费与品牌曝光！',
      effect: { coins: 88000, appearance: 5, snsFollowers: 1600, cameraSkill: 5, stamina: -15 },
    },
  ];

  const subscriberCount = Math.max(28, Math.floor(stats.snsFollowers * 0.22));
  const moodStatusLabel =
    stats.mood >= 80
      ? '✨ 元气明媚'
      : stats.mood >= 55
      ? '🌸 温柔惬意'
      : stats.mood >= 35
      ? '☁️ 略带疲惫'
      : '🌧️ 需要治愈';

  const identityTitle =
    stats.isDebutedIdol
      ? '👑 顶流C位出道爱豆'
      : stats.traineeGrade && stats.traineeGrade !== '未签约普通学生'
      ? `🎤 ${stats.traineeGrade}`
      : stats.specialIdentity || '🏫 首尔女高 1-1班学生';

  const filteredTheqooPosts = theqooPosts.filter((p) => {
    if (theqooCategory === 'all') return true;
    if (theqooCategory === 'trainee') return p.tag.includes('练习生') || p.tag.includes('顺位');
    if (theqooCategory === 'school') return p.tag.includes('校园') || p.tag.includes('竹林') || p.tag.includes('偶遇');
    if (theqooCategory === 'confess') return p.tag.includes('表白') || p.tag.includes('心动');
    return true;
  });

  const filteredGallery = galleryItems.filter((g) => (albumFilter === 'all' ? true : g.category === albumFilter));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-md">
      {/* Korean Smartphone Outer Shell */}
      <div className="relative bg-gradient-to-b from-[#fdf8fb] via-[#f8f3f9] to-[#f2eef8] border-[6px] border-[#2d262e] rounded-[42px] max-w-md w-full h-[88dvh] max-h-[820px] flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.55)] text-[#2b262d]">
        {/* Custom Wallpaper Layer (visible on desktop & subtly behind glass apps) */}
        {phoneWallpaper && (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-500"
            style={{
              backgroundImage: `url(${phoneWallpaper})`,
              opacity: activeTab === 'desktop' ? 0.38 : 0.12,
            }}
          />
        )}

        {/* Top Authentic Korean Smartphone Status Bar + Dynamic Island */}
        <div className="relative z-20 bg-white/75 backdrop-blur-xl px-5 pt-2.5 pb-2 border-b border-pink-200/50 flex items-center justify-between text-[#2d262e] shrink-0">
          {/* Left: Carrier & Signal */}
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-tight">
            <Signal className="w-3.5 h-3.5 text-rose-500" />
            <span>SKT 5G</span>
            <Wifi className="w-3.5 h-3.5 text-[#5c5160]" />
          </div>

          {/* Center: Dynamic Island Pill */}
          <div className="px-3.5 py-0.5 rounded-full bg-[#231e24] text-white text-[10px] font-bold flex items-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{clockStr.length <= 10 ? clockStr : '12:45'}</span>
            <span className="text-pink-300">· 18°C</span>
          </div>

          {/* Right: Battery & Close Phone Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#4a3f4d]">
              <span>96%</span>
              <BatteryCharging className="w-4 h-4 text-emerald-600" />
            </div>
            <button
              onClick={onClose}
              title="锁屏收起手机"
              className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* App Sub-Header Navigation Bar (when inside an App) */}
        {activeTab !== 'desktop' && (
          <div className="relative z-20 bg-white/80 backdrop-blur-xl px-4 py-2 border-b border-pink-100 flex items-center justify-between shrink-0">
            <button
              onClick={() => setActiveTab('desktop')}
              className="px-2.5 py-1 bg-pink-50/90 hover:bg-pink-100 border border-pink-200/80 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>桌面</span>
            </button>
            <span className="text-xs font-black text-[#3b2f3d] tracking-wide">
              {activeTab === 'stargram'
                ? '📸 Stargram · 校园与演艺圈'
                : activeTab === 'bubble'
                ? '🫧 Bubble · 私密短句聊天'
                : activeTab === 'kakao'
                ? '💬 KakaoTalk · 群聊与通讯录'
                : activeTab === 'blind'
                ? '🔥 Theqoo · 内部匿名八卦论坛'
                : activeTab === 'aistudio'
                ? '🖼️ AI 写真馆 & 穿搭壁纸相册'
                : activeTab === 'music'
                ? '🎧 Melon · 治愈音乐电台'
                : activeTab === 'delivery'
                ? '🛵 Coupang 校园闪购外卖'
                : '💼 AlbaMon 兼职与商务通告'}
            </span>
            <span className="text-[11px] font-bold text-rose-600 tabular-nums">
              ₩{stats.coins.toLocaleString()}
            </span>
          </div>
        )}

        {/* Main Smartphone Viewport */}
        <div
          className="relative z-10 p-3.5 pb-6 overflow-y-auto touch-scroll overscroll-contain flex-1 min-h-0 space-y-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* ================================================================== */}
          {/* DESKTOP HOME SCREEN (Macaron Glassmorphism + Widget + Unread Badges) */}
          {/* ================================================================== */}
          {activeTab === 'desktop' && (
            <div className="flex flex-col justify-between min-h-full py-1 space-y-4 select-none">
              {/* Top Glassmorphism Dynamic Clock & Identity Widget */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/90 rounded-[28px] p-4 shadow-[0_8px_30px_rgba(236,72,153,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-extrabold text-rose-500 tracking-wide flex items-center gap-1.5">
                      <span>🌸 SEOUL WEATHER · 首尔江南区</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black tracking-tight text-[#2b222c]">
                        {clockStr.length <= 8 ? clockStr : '12:45'}
                      </span>
                      <span className="text-xs font-bold text-[#756578]">{weekLabel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 text-rose-800 text-xs font-bold shadow-2xs">
                      <span>☀️ 18°C</span>
                      <span>·</span>
                      <span>{moodStatusLabel}</span>
                    </div>
                    <div className="text-[10px] text-[#7c6d7e] font-medium mt-1">
                      心情 {stats.mood}/100 · 体力 {stats.stamina}/100
                    </div>
                  </div>
                </div>

                {/* Player Current Identity & Quick Status Ribbon */}
                <div className="pt-2.5 border-t border-pink-100/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={previewAvatarUrl}
                      alt="李秀妍"
                      className="w-10 h-10 rounded-2xl object-cover border-2 border-pink-300 shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#2b222c] truncate">
                        李秀妍 · {identityTitle}
                      </div>
                      <div className="text-[11px] text-[#6d5e70] truncate">
                        粉丝 {stats.snsFollowers.toLocaleString()} · 声望 {stats.social} · 零花钱 ₩{stats.coins.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openAppTab('aistudio')}
                    className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-700 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    换壁纸/写真
                  </button>
                </div>
              </div>

              {/* Desktop Page 1: Core Social, Gossip, Idol & Aesthetic Apps */}
              {desktopPage === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3.5 px-1">
                    {[
                      {
                        id: 'stargram',
                        label: 'Stargram',
                        sub: '动态圈',
                        icon: '📸',
                        badge: unreadBadges.stargram,
                        bg: 'bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#f68084] text-white',
                      },
                      {
                        id: 'bubble',
                        label: 'Bubble',
                        sub: unreadFanCount > 0 ? '🔴有新粉丝来信' : '粉丝/私聊泡泡',
                        icon: '🫧',
                        badge: Math.max(unreadBadges.bubble, unreadFanCount),
                        bg: 'bg-gradient-to-br from-[#c471f5] to-[#fa71cd] text-white',
                      },
                      {
                        id: 'kakao',
                        label: 'Kakao群',
                        sub: '班级/练习生',
                        icon: '💬',
                        badge: unreadBadges.kakao,
                        bg: 'bg-gradient-to-br from-[#ffe259] to-[#ffa751] text-[#3b1e1e]',
                      },
                      {
                        id: 'blind',
                        label: 'Theqoo',
                        sub: '匿名八卦墙',
                        icon: '🔥',
                        badge: unreadBadges.blind,
                        bg: 'bg-gradient-to-br from-[#ff758c] to-[#ff7eb3] text-white',
                      },
                      {
                        id: 'aistudio',
                        label: '穿搭相册',
                        sub: 'AI写真/壁纸',
                        icon: '🖼️',
                        badge: 0,
                        bg: 'bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] text-white',
                      },
                      {
                        id: 'music',
                        label: 'Melon电台',
                        sub: '校园Lo-Fi',
                        icon: '🎧',
                        badge: 0,
                        bg: 'bg-gradient-to-br from-[#84fab0] to-[#8fd3f4] text-[#1c4532]',
                      },
                      {
                        id: 'dispatch' as any,
                        label: 'D社爆料',
                        sub: '黑料监控/公关',
                        icon: '🚨',
                        badge: dispatchLeaks.filter((l) => l.status === 'pending').length,
                        bg: 'bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#334155] text-amber-400',
                      },
                      {
                        id: 'coupang' as any,
                        label: 'Coupang奢品',
                        sub: '一键晒Stargram',
                        icon: '🛍️',
                        badge: 0,
                        bg: 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white',
                      },
                      {
                        id: 'ktalk' as any,
                        label: 'K-Talk人脉',
                        sub: '通告/电视台PD',
                        icon: '💼',
                        badge: ktalkContacts.filter((c) => c.unread).length,
                        bg: 'bg-gradient-to-br from-[#d97706] to-[#b45309] text-white',
                      },
                      {
                        id: 'assets' as any,
                        label: '资产 Center',
                        sub: '房产/豪车',
                        icon: '🏢',
                        badge: 0,
                        bg: 'bg-gradient-to-br from-[#f6d365] to-[#fda085] text-stone-900',
                      },
                      {
                        id: 'family' as any,
                        label: '亲情 Family',
                        sub: '温情羁绊',
                        icon: '💖',
                        badge: 0,
                        bg: 'bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white',
                      },
                    ].map((app) => (
                      <button
                        key={app.id}
                        onClick={() => openAppTab(app.id as any)}
                        className="flex flex-col items-center gap-1 group cursor-pointer relative"
                      >
                        <div
                          className={`relative w-15 h-15 rounded-[22px] ${app.bg} shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center text-2xl group-hover:scale-105 group-active:scale-95 transition-all border-2 border-white/80`}
                        >
                          <span>{app.icon}</span>
                          {app.badge > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md ring-2 ring-white animate-bounce">
                              {app.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold text-[#2e2430] leading-tight mt-0.5">
                          {app.label}
                        </span>
                        <span className="text-[9px] text-[#7a6b7d] -mt-0.5">{app.sub}</span>
                      </button>
                    ))}

                    {/* Folded Life Services Macaron Folder (De-emphasizes numeric grind) */}
                    <button
                      onClick={() => setShowLifeFolder(true)}
                      className="flex flex-col items-center gap-1 group cursor-pointer relative"
                    >
                      <div className="w-15 h-15 rounded-[22px] bg-white/75 backdrop-blur-md border-2 border-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] p-1.5 grid grid-cols-2 gap-1 group-hover:scale-105 transition-all">
                        <span className=" rounded-md bg-orange-100 flex items-center justify-center text-xs">🛵</span>
                        <span className="rounded-md bg-emerald-100 flex items-center justify-center text-xs">💼</span>
                        <span className="rounded-md bg-amber-100 flex items-center justify-center text-xs">💎</span>
                        <span className="rounded-md bg-pink-100 flex items-center justify-center text-xs">✨</span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#2e2430] leading-tight mt-0.5">
                        生活服务
                      </span>
                      <span className="text-[9px] text-[#7a6b7d] -mt-0.5">外卖/兼职</span>
                    </button>

                    {/* Street Random Encounter Shortcut */}
                    {onTriggerRandomEncounter && (
                      <button
                        onClick={onTriggerRandomEncounter}
                        className="flex flex-col items-center gap-1 group cursor-pointer relative"
                      >
                        <div className="w-15 h-15 rounded-[22px] bg-gradient-to-br from-[#f6d365] to-[#fda085] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center text-2xl group-hover:scale-105 transition-all border-2 border-white/80">
                          🌸
                        </div>
                        <span className="text-[11px] font-extrabold text-[#2e2430] leading-tight mt-0.5">
                          街头偶遇
                        </span>
                        <span className="text-[9px] text-[#7a6b7d] -mt-0.5">邂逅新角色</span>
                      </button>
                    )}
                  </div>

                  {/* Live Social Feed Preview Banner on Home Screen */}
                  <div
                    onClick={() => openAppTab('blind')}
                    className="bg-white/80 backdrop-blur-md border border-pink-200/80 rounded-2xl p-3 shadow-xs cursor-pointer hover:bg-white/95 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 mb-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>Theqoo 实时热帖速报</span>
                      </span>
                      <span className="text-[10px] text-[#7a6b7d]">点击吃瓜 →</span>
                    </div>
                    <div className="text-xs font-bold text-[#2b222c] truncate">
                      {theqooPosts[0]?.title}
                    </div>
                    <div className="text-[11px] text-[#6d5e70] truncate mt-0.5">
                      {theqooPosts[0]?.comments?.[0] || theqooPosts[0]?.content}
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Page 2: Secondary Life Services Page */
                <div className="space-y-3 py-2">
                  <div className="text-xs font-bold text-[#5e4f61] px-2">
                    📂 第二屏 · 首尔生活与兼职便利箱
                  </div>
                  <div className="grid grid-cols-4 gap-3.5 px-1">
                    <button
                      onClick={() => openAppTab('delivery')}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-15 h-15 rounded-[22px] bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md flex items-center justify-center text-2xl border-2 border-white/80">
                        🛵
                      </div>
                      <span className="text-[11px] font-bold text-[#2e2430]">闪购外卖</span>
                    </button>
                    <button
                      onClick={() => openAppTab('alba')}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-15 h-15 rounded-[22px] bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md flex items-center justify-center text-2xl border-2 border-white/80">
                        💼
                      </div>
                      <span className="text-[11px] font-bold text-[#2e2430]">兼职通</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Life Services Folder Modal Overlay */}
              {showLifeFolder && (
                <div
                  onClick={() => setShowLifeFolder(false)}
                  className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs p-6"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white/90 backdrop-blur-xl border-2 border-white rounded-[32px] p-5 w-full max-w-xs shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                      <span className="text-sm font-black text-[#2e2430] flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-rose-500" />
                        <span>生活服务文件夹</span>
                      </span>
                      <button
                        onClick={() => setShowLifeFolder(false)}
                        className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        关闭
                      </button>
                    </div>
                    <p className="text-[11px] text-[#6d5e70]">
                      补充体力、点夜宵请客或接线上兼职/品牌通告均收纳于此：
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openAppTab('delivery')}
                        className="p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span className="text-2xl">🛵</span>
                        <span className="text-xs font-bold text-orange-950">Coupang 闪购外卖</span>
                        <span className="text-[10px] text-orange-700">回体力 / 请好友吃炸鸡</span>
                      </button>
                      <button
                        onClick={() => openAppTab('alba')}
                        className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex flex-col items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <span className="text-2xl">💼</span>
                        <span className="text-xs font-bold text-emerald-950">AlbaMon 兼职通</span>
                        <span className="text-[10px] text-emerald-700">赚取零花钱 / 寄拍模特</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Page Dots & Frosted Glass Bottom Dock */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setDesktopPage(1)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      desktopPage === 1 ? 'w-6 bg-rose-500' : 'w-2 bg-rose-300/70'
                    }`}
                    title="第一页：社交与养成"
                  />
                  <button
                    onClick={() => setDesktopPage(2)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      desktopPage === 2 ? 'w-6 bg-rose-500' : 'w-2 bg-rose-300/70'
                    }`}
                    title="第二页：生活服务"
                  />
                </div>

                <div className="w-full bg-white/75 backdrop-blur-xl border border-white/90 rounded-[28px] p-2.5 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                  {[
                    { id: 'stargram', icon: '📸', label: 'Stargram', badge: unreadBadges.stargram },
                    {
                      id: 'bubble',
                      icon: '🫧',
                      label: 'Bubble',
                      badge: Math.max(unreadBadges.bubble, unreadFanCount),
                    },
                    { id: 'kakao', icon: '💬', label: 'Kakao群', badge: unreadBadges.kakao },
                    { id: 'blind', icon: '🔥', label: 'Theqoo', badge: unreadBadges.blind },
                  ].map((dockApp) => (
                    <button
                      key={dockApp.id}
                      onClick={() => openAppTab(dockApp.id as any)}
                      className="relative flex flex-col items-center gap-0.5 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-white to-pink-50/90 border border-pink-100 shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {dockApp.icon}
                      </div>
                      {dockApp.badge > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                          {dockApp.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 1: STARGRAM (Instagram-like Feed + Stories + AI NPC Comments)  */}
          {/* ================================================================== */}
          {activeTab === 'stargram' && (
            <div className="space-y-3">
              {/* Top NPC Stories Bar */}
              <div className="bg-white/90 backdrop-blur-md border border-pink-100 rounded-2xl p-2.5 shadow-2xs">
                <div className="text-[10px] font-bold text-[#7c6d7e] mb-1.5 px-1">
                  ✨ 好友与前辈今日快拍 Stories（点击查看并点赞互动）：
                </div>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                  {npcs.slice(0, 8).map((n) => {
                    const isStoryLiked = likedStoryIds.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => setActiveStoryNpc(n)}
                        className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                      >
                        <div
                          className={`p-0.5 rounded-full ${
                            isStoryLiked
                              ? 'bg-gray-200'
                              : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600'
                          }`}
                        >
                          <img
                            src={n.avatar}
                            alt={n.chineseName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#3b2f3d] truncate max-w-[54px]">
                          {n.chineseName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Story Viewer Modal */}
              {activeStoryNpc && (
                <div className="bg-gradient-to-br from-[#2e2236] via-[#3d2b47] to-[#1f1824] text-white rounded-2xl p-4 space-y-3 shadow-xl border border-pink-400/40 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={activeStoryNpc.avatar}
                        alt={activeStoryNpc.chineseName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-pink-400"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{activeStoryNpc.chineseName}</span>
                          <span className="text-[10px] text-pink-300">· {activeStoryNpc.role}</span>
                        </div>
                        <div className="text-[10px] text-gray-300">刚刚发布于 首尔 · 24h限时快拍</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveStoryNpc(null)}
                      className="p-1 rounded-full bg-white/15 hover:bg-white/25 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-xs leading-relaxed text-pink-50">
                    {activeStoryNpc.id === 'npc_3'
                      ? '📸 【大峙洞凌晨自习打卡】刷完最后一套数学模拟卷，旁边座位的某人今天居然没打瞌睡。☕'
                      : activeStoryNpc.id === 'npc_6'
                      ? '📸 【练习室镜面快拍】新编的副歌 Dance Break 终于顺下来了，期待和某位搭档的同台。🎧'
                      : `📸 【今日校园碎片】在${location}捕捉到的好天气，希望今天也是元气满满的一天 ✨`}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => {
                        if (!likedStoryIds.includes(activeStoryNpc.id)) {
                          setLikedStoryIds((prev) => [...prev, activeStoryNpc.id]);
                          if (onUpdateFavorability) onUpdateFavorability(activeStoryNpc.id, 4);
                          onNotify(`❤️ 已为 ${activeStoryNpc.chineseName} 的快拍点赞，好感度 +4！`);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                        likedStoryIds.includes(activeStoryNpc.id)
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/15 hover:bg-white/25 text-pink-200'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{likedStoryIds.includes(activeStoryNpc.id) ? '已点赞快拍 (+4好感)' : '点赞快拍'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBubbleNpcId(activeStoryNpc.id);
                        setActiveStoryNpc(null);
                        openAppTab('bubble');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold cursor-pointer"
                    >
                      去 Bubble 私聊 TA →
                    </button>
                  </div>
                </div>
              )}

              {/* Protagonist Stargram Profile Header */}
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={previewAvatarUrl}
                    alt="李秀妍"
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-400"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-black text-rose-950">@suyeon_seoul_official</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">{identityTitle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-rose-600 tabular-nums">
                    {stats.snsFollowers.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-800 font-bold">Followers</div>
                </div>
              </div>

              {/* Publish New Post Box */}
              <div className="bg-white/95 border border-pink-100 rounded-2xl p-3 space-y-2.5 shadow-2xs">
                <div className="text-xs font-bold text-[#3b2f3d] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-500" />
                    <span>发布日常心情 / 训练动态 (消耗8体力)</span>
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold">AI 好友与导师实时评论</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {photoThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                        selectedTheme === t.id
                          ? 'bg-rose-50 border-rose-400 text-rose-900'
                          : 'bg-[#faf7fc] border-pink-100 text-[#5e5163]'
                      }`}
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="写下此刻的日常心情或训练感悟（好友与导师会根据配文留言）..."
                  className="w-full px-3 py-2 bg-[#faf7fc] border border-pink-200 rounded-xl text-xs focus:outline-none focus:border-rose-400"
                />

                <button
                  disabled={isPublishingStargram}
                  onClick={handleUploadPhoto}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500 hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isPublishingStargram ? 'animate-spin' : ''}`} />
                  <span>
                    {isPublishingStargram
                      ? '正在发布并召唤好友/导师评论...'
                      : '立即发布 Stargram 动态'}
                  </span>
                </button>
              </div>

              {/* Feed List with Real-time AI NPC Comments & Reply Interaction */}
              <div className="space-y-3">
                {snsPosts.map((post) => {
                  const combinedComments = [
                    ...(post.npcComments || []),
                    ...(extraPostComments[post.id] || []),
                  ];
                  return (
                    <div
                      key={post.id}
                      className="bg-white border border-pink-100 rounded-2xl p-3.5 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={previewAvatarUrl}
                            alt="李秀妍"
                            className="w-7 h-7 rounded-full object-cover border border-pink-300"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#2b222c]">李秀妍</div>
                            <div className="text-[10px] text-rose-500 font-semibold">{post.tag}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#8c7d90]">{post.weekLabel}</span>
                      </div>

                      <p className="text-xs text-[#2b2620] leading-relaxed font-medium bg-[#fcf9fd] p-2.5 rounded-xl border border-pink-50">
                        {post.caption}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-rose-500 font-bold">
                            <Heart className="w-3.5 h-3.5 fill-rose-500" /> {post.likes.toLocaleString()} 赞
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <TrendingUp className="w-3.5 h-3.5" /> +{post.followerGain} 粉
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRefreshPostAIComments(post)}
                            disabled={loadingCommentPostId === post.id}
                            className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${loadingCommentPostId === post.id ? 'animate-spin' : ''}`}
                            />
                            <span>AI新评</span>
                          </button>
                          <button
                            onClick={() =>
                              setReplyingPostId(replyingPostId === post.id ? null : post.id)
                            }
                            className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            回复评论
                          </button>
                        </div>
                      </div>

                      {combinedComments.length > 0 && (
                        <div className="bg-[#faf6fc] rounded-xl p-2.5 space-y-1.5 border border-pink-100/80">
                          {combinedComments.map((c, i) => (
                            <div key={i} className="text-[11px] leading-snug">
                              <span className="font-extrabold text-[#3d2c42]">{c.npcName}：</span>
                              <span className="text-[#594a5e]">{c.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingPostId === post.id && (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={postReplyInput}
                            onChange={(e) => setPostReplyInput(e.target.value)}
                            placeholder="在评论区回复好友或导师..."
                            className="flex-1 bg-[#faf7fc] border border-pink-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleReplyToPostComment(post.id)}
                            className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            发送
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 2: BUBBLE (AI Fan DMs + 1v1 Living Short-Bubble NPC Chat)      */}
          {/* ================================================================== */}
          {activeTab === 'bubble' && (
            <div className="space-y-2.5 flex flex-col h-full">
              {/* Top Mode Switcher: Fan Bubble DMs vs 1v1 NPC Bubble vs Subscription Room */}
              <div className="flex gap-1 bg-purple-100/80 p-1 rounded-2xl shrink-0">
                <button
                  onClick={() => setBubbleMode('fan_dm')}
                  className={`relative flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    bubbleMode === 'fan_dm'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-purple-800 hover:text-purple-950'
                  }`}
                >
                  <span>💌 粉丝私信应援</span>
                  {unreadFanCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center gap-0.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      新来信 {unreadFanCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setBubbleMode('npc_dm')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    bubbleMode === 'npc_dm'
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-purple-800 hover:text-purple-950'
                  }`}
                >
                  💬 好友前辈私聊
                </button>
                <button
                  onClick={() => setBubbleMode('fan_room')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    bubbleMode === 'fan_room'
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-purple-800 hover:text-purple-950'
                  }`}
                >
                  🫧 群发营业 ({subscriberCount})
                </button>
              </div>

              {bubbleMode === 'fan_dm' ? (
                /* Mode A: AI Real-Time Fan Bubble Private Messages & 1v1 Fan Chatroom */
                !activeFanThread ? (
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {/* Top Context & Loyalty Banner */}
                    <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white rounded-2xl p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">💌</span>
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <span>DearU Bubble · 粉丝私信信箱</span>
                              {unreadFanCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                  有新粉丝来信 ({unreadFanCount})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-pink-100 mt-0.5">
                              当前状态：{buildPlayerStateForFanBubble().identityStatus}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black tabular-nums">❤️ {totalFanLoyalty}</div>
                          <div className="text-[9px] text-pink-100">死忠粘性总值</div>
                        </div>
                      </div>

                      <div className="bg-white/15 backdrop-blur-xs rounded-xl px-2.5 py-1.5 text-[10px] text-pink-50 flex items-center justify-between gap-2">
                        <span className="truncate">
                          📌 本周行程焦点：{buildPlayerStateForFanBubble().recentSchedule}
                        </span>
                        <button
                          onClick={() => triggerFetchFanBubbleMessages(undefined, true)}
                          disabled={isGeneratingFanDMs}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-white text-rose-600 hover:bg-pink-50 disabled:opacity-60 font-black text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className={`w-3 h-3 ${isGeneratingFanDMs ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingFanDMs ? 'AI 生成中...' : 'AI 刷新粉丝来信'}</span>
                        </button>
                      </div>
                    </div>

                    {isGeneratingFanDMs && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-rose-700 animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin text-rose-500" />
                        <span>AI 正在结合你本周的行程与表现，实时生成站姐/死忠粉/整活粉私信...</span>
                      </div>
                    )}

                    {/* Fan Bubble Inbox List */}
                    <div className="space-y-2">
                      {fanThreads.map((fan) => {
                        const latestMsg = fan.messages[fan.messages.length - 1];
                        return (
                          <div
                            key={fan.id}
                            onClick={() => handleOpenFanThread(fan.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                              fan.hasUnread
                                ? 'bg-gradient-to-r from-rose-50/90 via-white to-pink-50/80 border-rose-300 shadow-xs'
                                : 'bg-white hover:bg-purple-50/40 border-purple-100'
                            }`}
                          >
                            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-200 flex items-center justify-center text-xl shrink-0">
                              <span>{fan.avatarEmoji}</span>
                              {fan.hasUnread && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-white animate-bounce" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-black text-[#2b222c] truncate">
                                    {fan.fanName}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border shrink-0 ${fan.badgeColor}`}
                                  >
                                    【{fan.fanRole}】
                                  </span>
                                </div>
                                <span className="text-[9px] text-gray-400 shrink-0">
                                  {fan.updatedAtLabel}
                                </span>
                              </div>

                              <p className="text-xs text-[#4a3b52] line-clamp-2 mt-1 leading-relaxed">
                                {latestMsg?.text}
                              </p>

                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-pink-100/80">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-rose-600">
                                    ❤️ 粉丝粘性 {fan.loyalty}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                    翻牌回复 +{fan.pendingLoyaltyGain} 粘性
                                  </span>
                                </div>
                                {fan.hasUnread ? (
                                  <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    有新粉丝来信 · 点击翻牌 →
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-purple-600">
                                    进入聊天室 →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Active 1v1 Fan Bubble Chatroom */
                  <div className="flex flex-col flex-1 min-h-[450px] bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-xs">
                    {/* Fan Chatroom Header */}
                    <div className="px-3.5 py-2.5 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 border-b border-rose-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveFanThreadId(null)}
                          className="p-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                          title="返回粉丝来信列表"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-base">
                          {activeFanThread.avatarEmoji}
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#2e2430] flex items-center gap-1.5">
                            <span>{activeFanThread.fanName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${activeFanThread.badgeColor}`}
                            >
                              【{activeFanThread.fanRole}】
                            </span>
                          </div>
                          <div className="text-[10px] text-rose-600 font-bold">
                            ❤️ 当前粉丝忠诚度：{activeFanThread.loyalty}（每次翻牌回复触发狂喜/感动反馈）
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveFanThreadId(null)}
                        className="text-[10px] font-bold text-rose-700 hover:underline cursor-pointer"
                      >
                        信箱列表
                      </button>
                    </div>

                    {/* Fan Chat Messages Stream */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gradient-to-b from-[#fff7fa] to-[#f8f2fc] max-h-[290px]">
                      {activeFanThread.messages.map((m, idx) => {
                        const bubbles =
                          m.bubbles && m.bubbles.length > 0 ? m.bubbles : [m.text];
                        return (
                          <div
                            key={idx}
                            className={`flex gap-2 ${
                              m.sender === 'user' ? 'justify-end' : 'justify-start items-start'
                            }`}
                          >
                            {m.sender === 'fan' && (
                              <div className="w-7 h-7 rounded-full bg-white border border-rose-200 flex items-center justify-center text-sm shadow-2xs shrink-0 mt-1">
                                {activeFanThread.avatarEmoji}
                              </div>
                            )}
                            <div
                              className={`flex flex-col ${
                                m.sender === 'user' ? 'items-end' : 'items-start'
                              } max-w-[82%] space-y-1`}
                            >
                              {m.emotionTag && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                                  ✨ 粉丝状态：{m.emotionTag}
                                </span>
                              )}
                              {bubbles.map((bText, bIdx) => (
                                <div
                                  key={bIdx}
                                  className={`px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                                    m.sender === 'user'
                                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-xs'
                                      : 'bg-white text-[#2b222c] border border-rose-100 rounded-tl-xs'
                                  }`}
                                >
                                  {bText}
                                </div>
                              ))}
                              {m.loyaltyDelta && (
                                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  💖 粉丝忠诚度 +{m.loyaltyDelta} · 安利涨粉 +180
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isFanReplying && (
                        <div className="flex items-center gap-2 text-xs text-rose-600 bg-white/90 border border-rose-200 px-3 py-1.5 rounded-2xl w-fit shadow-2xs animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>粉丝【{activeFanThread.fanName}】收到本尊翻牌，正手抖狂喜打字中...</span>
                        </div>
                      )}
                      <div ref={fanChatEndRef} />
                    </div>

                    {/* Quick Idol Fan-Service Reply Chips */}
                    <div className="px-2.5 py-1.5 bg-rose-50/70 border-t border-rose-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                      {[
                        '今天在台上有看到你举的手幅哦，超级感动❤️',
                        '刚下训看到你的私信，一天的疲惫都飞走啦~',
                        '答应你今晚一定好好吃饭，下次一位安可舞台见！！',
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          disabled={isFanReplying}
                          onClick={() => handleSendReplyToFan(chip)}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold shrink-0 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Fan Reply Input Bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendReplyToFan();
                      }}
                      className="p-2.5 bg-white border-t border-rose-100 flex items-center gap-1.5 shrink-0"
                    >
                      <input
                        type="text"
                        value={fanReplyInput}
                        onChange={(e) => setFanReplyInput(e.target.value)}
                        placeholder={`亲自翻牌回复【${activeFanThread.fanName}】...`}
                        className="flex-1 bg-[#fdf8fa] border border-rose-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-rose-400"
                      />
                      <button
                        type="submit"
                        disabled={isFanReplying || !fanReplyInput.trim()}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>翻牌</span>
                      </button>
                    </form>
                  </div>
                )
              ) : bubbleMode === 'npc_dm' && currentBubbleNpc ? (
                <div className="flex flex-col flex-1 min-h-[450px] bg-white border border-purple-200/80 rounded-2xl overflow-hidden shadow-xs">
                  {/* Horizontal NPC Selector Bar */}
                  <div className="bg-[#f9f5ff] px-3 py-2 border-b border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    {npcs.map((n) => {
                      const active = n.id === currentBubbleNpc.id;
                      return (
                        <button
                          key={n.id}
                          onClick={() => setSelectedBubbleNpcId(n.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            active
                              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-xs'
                              : 'bg-white text-[#4a3b52] border border-purple-200/70 hover:bg-purple-50'
                          }`}
                        >
                          <img
                            src={n.avatar}
                            alt={n.chineseName}
                            className="w-5 h-5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span>{n.chineseName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active NPC Info Subbar */}
                  <div className="px-3.5 py-2 bg-white border-b border-purple-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={currentBubbleNpc.avatar}
                        alt={currentBubbleNpc.chineseName}
                        className="w-8 h-8 rounded-xl object-cover border border-purple-300"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-black text-[#2e2430] flex items-center gap-1.5">
                          <span>{currentBubbleNpc.chineseName}</span>
                          <span className="text-[10px] font-semibold text-purple-600">
                            · {currentBubbleNpc.relationshipStage} (好感 {currentBubbleNpc.favorability}%)
                          </span>
                        </div>
                        <div className="text-[10px] text-[#7c6d7e]">
                          实时活人感短句连发 · 每次回复分多条气泡弹出
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNpcChat(currentBubbleNpc);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold cursor-pointer"
                    >
                      羁绊档案/简报AI →
                    </button>
                  </div>

                  {/* Short-Sentence Multi-Bubble Chat Stream */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gradient-to-b from-[#f6f0fc] to-[#fdf7fa] max-h-[300px]">
                    {getNpcBubbleMessages(currentBubbleNpc).map((m, idx) => {
                      const bubbles =
                        m.sender === 'npc'
                          ? m.bubbles && m.bubbles.length > 0
                            ? m.bubbles
                            : splitNpcReplyIntoBubbles(m.text)
                          : [m.text];
                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 ${
                            m.sender === 'user' ? 'justify-end' : 'justify-start items-start'
                          }`}
                        >
                          {m.sender === 'npc' && (
                            <img
                              src={currentBubbleNpc.avatar}
                              alt={currentBubbleNpc.chineseName}
                              className="w-7 h-7 rounded-full object-cover border border-white shadow-2xs shrink-0 mt-1"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div
                            className={`flex flex-col ${
                              m.sender === 'user' ? 'items-end' : 'items-start'
                            } max-w-[80%] space-y-1`}
                          >
                            {m.actionDesc && (
                              <span className="text-[10px] text-purple-700/80 italic px-1">
                                * {m.actionDesc} *
                              </span>
                            )}
                            {bubbles.map((bText, bIdx) => (
                              <div
                                key={bIdx}
                                className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed shadow-2xs animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                                  m.sender === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-xs'
                                    : 'bg-white text-[#2b222c] border border-purple-100 rounded-tl-xs'
                                }`}
                              >
                                {bText}
                              </div>
                            ))}
                            {m.innerThought && (
                              <div className="text-[10px] text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-lg">
                                💭 {m.innerThought}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isBubbleNpcTyping && (
                      <div className="flex items-center gap-2 text-xs text-purple-700 bg-white/90 border border-purple-200 px-3 py-1.5 rounded-2xl w-fit shadow-2xs animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>{currentBubbleNpc.chineseName} 正在打字连发短消息...</span>
                      </div>
                    )}
                    <div ref={bubbleChatEndRef} />
                  </div>

                  {/* Sticker Drawer */}
                  {showStickerDrawer && (
                    <div className="p-2.5 bg-purple-50 border-t border-purple-200 grid grid-cols-3 gap-1.5 shrink-0">
                      {koreanStickers.map((stk) => (
                        <button
                          key={stk.id}
                          disabled={isBubbleNpcTyping}
                          onClick={() =>
                            handleSendBubbleDm(stk.promptText, `${stk.emoji} ${stk.label}`)
                          }
                          className="p-2 bg-white hover:bg-pink-50 rounded-xl border border-purple-200/80 flex flex-col items-center gap-0.5 cursor-pointer transition-all"
                        >
                          <span className="text-lg">{stk.emoji}</span>
                          <span className="text-[10px] font-bold text-[#3b2f3d]">{stk.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Photo Drawer */}
                  {showPhotoDrawer && (
                    <div className="p-2.5 bg-pink-50 border-t border-pink-200 grid grid-cols-2 gap-1.5 shrink-0">
                      {shareablePhotos.map((ph) => (
                        <button
                          key={ph.id}
                          disabled={isBubbleNpcTyping}
                          onClick={() =>
                            handleSendBubbleDm(ph.promptText, `📸 [发送照片：${ph.title}]`)
                          }
                          className="p-2 bg-white hover:bg-rose-50 rounded-xl border border-pink-200 text-left flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <span className="text-xl">{ph.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-rose-950 truncate">
                              {ph.title}
                            </div>
                            <div className="text-[9px] text-rose-700 truncate">{ph.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Bottom Input Bar with Sticker & Photo Buttons */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendBubbleDm(bubbleDmInput);
                    }}
                    className="p-2.5 bg-white border-t border-purple-100 flex items-center gap-1.5 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowStickerDrawer(!showStickerDrawer);
                        setShowPhotoDrawer(false);
                      }}
                      title="发送韩系表情包"
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        showStickerDrawer
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoDrawer(!showPhotoDrawer);
                        setShowStickerDrawer(false);
                      }}
                      title="发送日常/练习室照片"
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        showPhotoDrawer
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={bubbleDmInput}
                      onChange={(e) => setBubbleDmInput(e.target.value)}
                      placeholder={`给 ${currentBubbleNpc.chineseName} 发即时短消息...`}
                      className="flex-1 bg-[#f8f5fc] border border-purple-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="submit"
                      disabled={isBubbleNpcTyping || !bubbleDmInput.trim()}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              ) : (
                /* Mode B: Idol Fan Subscription Room */
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white rounded-2xl p-3.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold opacity-90">DearU Bubble · 爱豆专属私密订阅</div>
                        <div className="text-base font-black mt-0.5">🫧 李秀妍的专属泡泡房间</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black tabular-nums">{subscriberCount.toLocaleString()} 人</div>
                        <div className="text-[10px] opacity-90">付费死忠订阅粉 (₩4,500/月)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-purple-200 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-bold text-purple-950">群发今日宠粉营业泡泡 (消耗6-8体力)：</div>
                    <input
                      type="text"
                      value={customBubbleText}
                      onChange={(e) => setCustomBubbleText(e.target.value)}
                      placeholder="自定义你想对粉丝说的悄悄话（留空使用默认台词）..."
                      className="w-full px-3 py-1.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs focus:outline-none"
                    />
                    <div className="space-y-1.5">
                      {bubbleActions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => {
                            if (stats.stamina < 8) {
                              onNotify('体力不足，先吃点东西再营业吧！');
                              return;
                            }
                            const subBonus = Math.min(120000, subscriberCount * 120);
                            const totalCoin = (act.effect.coins || 50000) + subBonus;
                            const textToUse = customBubbleText.trim() || act.defaultText;
                            setBubbleFeed([
                              {
                                id: `bf_${Date.now()}`,
                                tag: act.tag,
                                text: textToUse,
                                time: '刚刚',
                                fanReplies: act.replies,
                              },
                              ...bubbleFeed,
                            ]);
                            setCustomBubbleText('');
                            onPublishPost(
                              {
                                id: `bub_${Date.now()}`,
                                weekLabel,
                                tag: '#Bubble宠粉营业',
                                caption: textToUse,
                                likes: subscriberCount * 8,
                                followerGain: act.effect.snsFollowers || 2500,
                                npcComments: [],
                              },
                              {
                                ...act.effect,
                                coins: totalCoin,
                              }
                            );
                            onNotify(
                              `🫧 Bubble发送成功！死忠粉沸腾，涨粉 +${act.effect.snsFollowers?.toLocaleString()}，结算订阅分成 +₩${totalCoin.toLocaleString()}！`
                            );
                          }}
                          className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-bold text-purple-950">{act.title}</div>
                            <div className="text-[10px] text-purple-700 mt-0.5">
                              预计涨粉 +{act.effect.snsFollowers?.toLocaleString()} · 保底分成 +₩
                              {act.effect.coins?.toLocaleString()}
                            </div>
                          </div>
                          <Send className="w-4 h-4 text-purple-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {bubbleFeed.map((item) => (
                      <div key={item.id} className="bg-white border border-purple-100 rounded-2xl p-3 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-purple-700">{item.tag}</span>
                          <span className="text-gray-400">{item.time}</span>
                        </div>
                        <div className="bg-purple-600 text-white p-2.5 rounded-2xl rounded-tl-xs text-xs">
                          {item.text}
                        </div>
                        <div className="bg-purple-50 rounded-xl p-2 space-y-1">
                          <div className="text-[10px] font-bold text-purple-800">💖 实时粉丝回复 (999+ ❤️)：</div>
                          {item.fanReplies.map((r, idx) => (
                            <div key={idx} className="text-[11px] text-purple-950">
                              • {r}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 3: KAKAOTALK (Group Chat & Full Contacts Directory)            */}
          {/* ================================================================== */}
          {activeTab === 'kakao' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-[#fae100]/45 border border-[#e6cf00] rounded-xl p-1.5">
                <div className="flex gap-1">
                  <button
                    onClick={() => setKakaoMode('group')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      kakaoMode === 'group' ? 'bg-[#3b1e1e] text-[#fae100]' : 'text-[#3b1e1e]'
                    }`}
                  >
                    🏫 班级/练习生 AI群聊
                  </button>
                  <button
                    onClick={() => setKakaoMode('contacts')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      kakaoMode === 'contacts' ? 'bg-[#3b1e1e] text-[#fae100]' : 'text-[#3b1e1e]'
                    }`}
                  >
                    💌 好友通讯录 ({npcs.length})
                  </button>
                </div>
              </div>

              {kakaoMode === 'group' ? (
                <div className="bg-[#b2c7d9] border border-[#9ab2c7] rounded-2xl p-3 flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between bg-white/85 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-[#2b2620] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        {groupType === 'class' ? '首尔女高 1-1班 群聊 (8)' : '四大社出道预备组群 (8)'}
                      </span>
                    </span>
                    <button
                      onClick={() => setGroupType(groupType === 'class' ? 'idol' : 'class')}
                      className="text-[10px] font-bold bg-[#fae100] text-[#3b1e1e] px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      切换至{groupType === 'class' ? '练习生群' : '班级群'}
                    </button>
                  </div>

                  {/* Group Messages */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {groupMessages.map((gm, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${gm.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-[#2b3844] mb-0.5 px-1">{gm.name}</span>
                        <div
                          className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs shadow-2xs ${
                            gm.sender === 'user'
                              ? 'bg-[#fae100] text-[#3b1e1e] font-medium rounded-br-xs'
                              : 'bg-white text-[#2b2620] rounded-bl-xs'
                          }`}
                        >
                          {gm.text}
                        </div>
                      </div>
                    ))}
                    {isGroupSending && (
                      <div className="text-[11px] text-[#2b3844] bg-white/70 px-2.5 py-1 rounded-xl w-fit">
                        ✨ 群成员们正在输入短消息...
                      </div>
                    )}
                  </div>

                  {/* Quick Group Topics */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      '今天放学谁跟我去吃玫瑰酱辣炒年糕？🍢',
                      '明天模拟考重点谁整理好了借我看眼😭',
                      '我刚发了最新Stargram动态，快去帮我点赞！📸',
                      '周末我们一起去汉江公园野餐拍人生四格吧！🌸',
                    ].map((t, i) => (
                      <button
                        key={i}
                        disabled={isGroupSending}
                        onClick={() => handleSendGroupMessage(t)}
                        className="text-[10px] bg-white/85 hover:bg-white text-[#2b2620] px-2 py-1 rounded-lg font-medium cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Group Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendGroupMessage();
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={groupInput}
                      onChange={(e) => setGroupInput(e.target.value)}
                      placeholder="在群里发句话，大家会秒回短句接梗..."
                      className="flex-1 bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isGroupSending || !groupInput.trim()}
                      className="px-3 py-1.5 bg-[#fae100] text-[#3b1e1e] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" /> 发送
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white border border-pink-100 rounded-xl p-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setContactFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          contactFilter === 'all'
                            ? 'bg-[#3b1e1e] text-[#fae100]'
                            : 'text-[#5a5246] hover:bg-gray-100'
                        }`}
                      >
                        全部好友 ({npcs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactFilter('dynamic')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          contactFilter === 'dynamic'
                            ? 'bg-amber-600 text-white'
                            : 'text-amber-900 bg-amber-100/70'
                        }`}
                      >
                        ✨ 偶遇新结识 ({npcs.filter((n) => n.isGenerated).length})
                      </button>
                    </div>
                    {onTriggerRandomEncounter && (
                      <button
                        type="button"
                        onClick={onTriggerRandomEncounter}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>街头偶遇新朋友</span>
                      </button>
                    )}
                  </div>

                  {(contactFilter === 'dynamic' ? npcs.filter((n) => n.isGenerated) : npcs).map((npc) => (
                    <div
                      key={npc.id}
                      onClick={() => {
                        setSelectedBubbleNpcId(npc.id);
                        setBubbleMode('npc_dm');
                        openAppTab('bubble');
                      }}
                      className="bg-white hover:bg-pink-50/40 border border-pink-100 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={npc.avatar}
                          alt={npc.chineseName}
                          className="w-11 h-11 rounded-xl object-cover border border-pink-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs text-[#2b2620]">{npc.chineseName}</span>
                            <span className="text-[10px] text-[#7a6b7d]">
                              · {npc.role} · {npc.relationshipStage}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6e6456] truncate mt-0.5">
                            {npc.isGenerated && npc.personality ? npc.personality : npc.status}
                          </div>
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            好感 {npc.favorability}% · 点击进入 Bubble 短句私聊
                          </div>
                        </div>
                      </div>
                      <MessageCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 4: THEQOO ANONYMOUS GOSSIP FORUM (Refactored 'blind' tab)      */}
          {/* ================================================================== */}
          {activeTab === 'blind' && (
            <div className="space-y-3">
              {/* Theqoo Header */}
              <div className="bg-gradient-to-r from-[#2b2238] via-[#432c52] to-[#612c4f] text-white rounded-2xl p-3.5 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-pink-300 tracking-wider uppercase">
                      THEQOO · SEOUL HIGH & IDOL TRAINEE INSIDER
                    </div>
                    <div className="text-sm font-black mt-0.5">
                      🔥 首尔女高 & 练习生内部匿名论坛
                    </div>
                  </div>
                  <button
                    disabled={isRefreshingForum}
                    onClick={() => handleRefreshTheqooGossip()}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingForum ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingForum ? '刷瓜中...' : 'AI刷新新瓜'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-pink-100/90">
                  实时刷新练习生考核内幕、汉江偶遇目击贴与出道顺位预测，匿名发帖或吃瓜将直接影响你的校园声望！
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-pink-100 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: '🔥 全部热帖' },
                  { id: 'trainee', label: '🎤 练习生瓜' },
                  { id: 'school', label: '🏫 校园竹林' },
                  { id: 'confess', label: '💌 匿名表白' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTheqooCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                      theqooCategory === cat.id
                        ? 'bg-rose-500 text-white'
                        : 'text-[#5e5163] hover:bg-pink-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Anonymous Post Publisher */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAnonPostInput.trim()) return;
                  handleRefreshTheqooGossip(newAnonPostInput.trim());
                }}
                className="bg-white border border-pink-200 rounded-2xl p-2.5 flex gap-2 shadow-2xs"
              >
                <input
                  type="text"
                  value={newAnonPostInput}
                  onChange={(e) => setNewAnonPostInput(e.target.value)}
                  placeholder="匿名发帖爆料/带节奏（如：高一1班李秀妍这次月评稳拿A+）..."
                  className="flex-1 bg-[#faf7fc] border border-pink-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isRefreshingForum || !newAnonPostInput.trim()}
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                >
                  匿名发帖
                </button>
              </form>

              {/* Gossip Threads List */}
              <div className="space-y-2.5">
                {filteredTheqooPosts.map((post, idx) => {
                  const isLiked = likedForumTitles.includes(post.title);
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-pink-100 rounded-2xl p-3.5 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#7c6d7e]">
                        <span className="font-bold text-rose-600">
                          {post.tag} · {post.author}
                        </span>
                        <span>浏览 {(post.likes * 14).toLocaleString()}</span>
                      </div>

                      <div className="text-xs sm:text-[13px] font-black text-[#2b222c] leading-snug">
                        {post.title}
                      </div>

                      <p className="text-xs text-[#4a3f4d] leading-relaxed bg-[#fcf9fd] p-2.5 rounded-xl border border-pink-50">
                        {post.content}
                      </p>

                      {/* Netizen Replies */}
                      {Array.isArray(post.comments) && post.comments.length > 0 && (
                        <div className="bg-[#f8f4fa] rounded-xl p-2.5 space-y-1">
                          {post.comments.map((c, cIdx) => (
                            <div key={cIdx} className="text-[11px] text-[#524456]">
                              {c}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interactive Gossip Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            if (!isLiked) {
                              setLikedForumTitles((prev) => [...prev, post.title]);
                              if (onUpdateStats) {
                                onUpdateStats({
                                  social: Math.min(100, stats.social + 3),
                                  mood: Math.min(100, stats.mood + 2),
                                });
                              }
                              onNotify('🔥 吃瓜顶帖成功！校园声望 +3，心情 +2！');
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                            isLiked
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-gray-100 hover:bg-rose-50 text-[#524456]'
                          }`}
                        >
                          <Flame className="w-3 h-3 text-rose-500" />
                          <span>{isLiked ? `已顶帖 (${post.likes + 1})` : `顶帖吃瓜 (${post.likes})`}</span>
                        </button>

                        <button
                          onClick={() =>
                            setCommentingForumTitle(
                              commentingForumTitle === post.title ? null : post.title
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquarePlus className="w-3 h-3" />
                          <span>匿名跟帖 (+4声望)</span>
                        </button>
                      </div>

                      {commentingForumTitle === post.title && (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={forumCommentInput}
                            onChange={(e) => setForumCommentInput(e.target.value)}
                            placeholder="以匿名身份在评论区留下一句神回复..."
                            className="flex-1 bg-[#faf7fc] border border-pink-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddForumComment(post.title)}
                            className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            跟帖
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 5: AI PHOTO STUDIO & OUTFIT / NPC ALBUM (Set Phone Wallpaper!) */}
          {/* ================================================================== */}
          {activeTab === 'aistudio' && (
            <div className="space-y-3">
              {/* Mode Toggle */}
              <div className="flex gap-1 bg-pink-100/80 p-1 rounded-2xl">
                <button
                  onClick={() => setStudioMode('album')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    studioMode === 'album'
                      ? 'bg-white text-rose-950 shadow-xs'
                      : 'text-rose-800 hover:text-rose-950'
                  }`}
                >
                  🖼️ 立绘/舞台/NPC合影相册 ({galleryItems.length})
                </button>
                <button
                  onClick={() => setStudioMode('generator')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    studioMode === 'generator'
                      ? 'bg-white text-rose-950 shadow-xs'
                      : 'text-rose-800 hover:text-rose-950'
                  }`}
                >
                  ✨ AI 实时生图写真馆
                </button>
              </div>

              {studioMode === 'album' ? (
                <div className="space-y-3">
                  {/* Category Filter */}
                  <div className="flex items-center justify-between gap-1 bg-white p-1.5 rounded-xl border border-pink-100">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'all', label: '全部相册' },
                        { id: 'portrait', label: '✨ 精美立绘' },
                        { id: 'stage', label: '👑 打歌服/私服' },
                        { id: 'npc_group', label: '📸 NPC合影' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setAlbumFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                            albumFilter === f.id
                              ? 'bg-rose-500 text-white'
                              : 'text-[#5e5163] hover:bg-pink-50'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {phoneWallpaper && (
                      <button
                        onClick={() => {
                          setPhoneWallpaper('');
                          try {
                            localStorage.removeItem('kr_phone_wallpaper');
                          } catch {}
                          onNotify('已恢复默认马卡龙渐变手机壁纸');
                        }}
                        className="text-[10px] text-rose-600 underline shrink-0 px-1 cursor-pointer"
                      >
                        重置壁纸
                      </button>
                    )}
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredGallery.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setLightboxItem(item)}
                        className="group bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-2xs cursor-pointer hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="relative aspect-square overflow-hidden bg-pink-50">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 bg-black/55 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.categoryLabel}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-white/85 text-[#2b222c] p-1.5 rounded-full shadow-xs opacity-90 group-hover:opacity-100">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="p-2.5 space-y-1">
                          <div className="text-xs font-bold text-[#2b222c] truncate">{item.title}</div>
                          <div className="text-[10px] text-[#7a6b7d] line-clamp-1">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fullscreen Lightbox Modal for Viewing & Setting Wallpaper */}
                  {lightboxItem && (
                    <div
                      onClick={() => setLightboxItem(null)}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl space-y-3 p-4 animate-in zoom-in-95 duration-150"
                      >
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-pink-50 border border-pink-100">
                          <img
                            src={lightboxItem.imageUrl}
                            alt={lightboxItem.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => setLightboxItem(null)}
                            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-rose-600">
                            {lightboxItem.categoryLabel} · {lightboxItem.dateLabel}
                          </div>
                          <div className="text-sm font-black text-[#2b222c] mt-0.5">
                            {lightboxItem.title}
                          </div>
                          <p className="text-xs text-[#6d5e70] mt-1 leading-relaxed">
                            {lightboxItem.desc}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              handleSetWallpaper(lightboxItem.imageUrl, lightboxItem.title);
                              setLightboxItem(null);
                            }}
                            className="py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Wallpaper className="w-3.5 h-3.5" />
                            <span>设为手机壁纸</span>
                          </button>
                          <button
                            onClick={() => {
                              setPreviewAvatarUrl(lightboxItem.imageUrl);
                              if (onChangeProtagonistAvatar) {
                                onChangeProtagonistAvatar(lightboxItem.imageUrl);
                              }
                              onNotify(`👤 已将「${lightboxItem.title}」设为主角立绘头像！`);
                              setLightboxItem(null);
                            }}
                            className="py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>设为主角头像</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* AI Generator Sub-Tab */
                <div className="bg-white border border-pink-200 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewAvatarUrl}
                      alt="当前头像预览"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-400 shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[#2b2620]">AI 实时写真馆</div>
                      <div className="text-[11px] text-[#6e6456]">
                        生成的新立绘将自动收录进你的【穿搭相册】，可随时设为手机壁纸或全局头像！
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'webtoon', label: '🌸 韩漫女神' },
                      { id: 'anime', label: '✨ 二次元' },
                      { id: 'idol', label: '👑 爱豆画报' },
                      { id: 'watercolor', label: '🎨 梦幻水彩' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setAiStylePreset(st.id as any)}
                        className={`py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          aiStylePreset === st.id
                            ? 'bg-pink-600 text-white border-pink-600'
                            : 'bg-[#faf7fc] text-[#5a5246] border-pink-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    placeholder="输入外貌与穿搭描述词..."
                    className="w-full p-2.5 bg-[#faf7fc] border border-pink-200 rounded-xl text-xs focus:outline-none"
                  />

                  <div className="flex flex-wrap gap-1">
                    {[
                      '清纯黑长直校花，空气刘海，水光杏眼，深蓝西装校服配酒红领结',
                      '五代女团C位爱豆，微卷玫瑰棕长发，钻石发夹，打歌舞台聚光灯',
                      '甜美桃粉双马尾少女，草莓发卡，奶油色针织开衫，温柔甜笑',
                    ].map((presetText, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAiPromptInput(presetText)}
                        className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-900 px-2 py-1 rounded-lg cursor-pointer"
                      >
                        ✨ 预设造型 {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={isGeneratingAvatar}
                    onClick={handleGenerateAIAvatar}
                    className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingAvatar
                        ? 'AI 正在绘制高颜值写真 (约3-6秒)...'
                        : '✨ 立即生成写真并收入相册'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 6: MELON MUSIC RADIO                                           */}
          {/* ================================================================== */}
          {activeTab === 'music' && (
            <div className="space-y-3.5">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">🎧 Melon 韩国校园 Lo-Fi & K-Pop 电台</div>
                  <div className="text-[11px] opacity-90 mt-0.5">沉浸式治愈音符，随时放松身心 (+心情)</div>
                </div>
                <Music className={`w-6 h-6 ${isPlayingMusic ? 'animate-bounce' : ''}`} />
              </div>

              <div className="bg-white border border-pink-100 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
                <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#2b2620] to-[#4a4238] border-4 border-emerald-300 shadow-xl flex items-center justify-center text-3xl relative overflow-hidden">
                  <span className="relative z-10 text-white text-xs font-bold">MELON</span>
                </div>

                <div>
                  <div className="text-sm font-black text-[#2b2620]">{currentSong.title}</div>
                  <div className="text-xs text-[#7a6f5e] mt-0.5">{currentSong.artist}</div>
                </div>

                <button
                  onClick={() => {
                    setIsPlayingMusic(!isPlayingMusic);
                    if (!isPlayingMusic) {
                      onNotify('🎵 正在播放治愈系校园 Lo-Fi，心情 +10！');
                    }
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {isPlayingMusic ? '⏸️ 暂停播放' : '▶️ 开始播放电台'}
                </button>

                <div className="grid grid-cols-2 gap-2 pt-2 text-left">
                  {[
                    { title: '🌸 春日樱花路 Lo-Fi', artist: 'Seoul High School OST' },
                    { title: '☕ 弘大雨后爵士咖啡', artist: 'Hongdae Cafe' },
                    { title: '🌙 汉江夜风钢琴曲', artist: 'Han River Piano' },
                    { title: '✨ 顶流女团出道单曲Demo', artist: 'SOOYEON' },
                  ].map((song, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentSong({ ...song, duration: '3:30' });
                        setIsPlayingMusic(true);
                        onNotify(`🎶 已切换至《${song.title}》！`);
                      }}
                      className="p-2 bg-[#faf7fc] hover:bg-emerald-50 rounded-xl border border-pink-100 text-left text-xs font-bold truncate cursor-pointer"
                    >
                      🎵 {song.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 7: DELIVERY (Folded in Life Services)                          */}
          {/* ================================================================== */}
          {activeTab === 'delivery' && (
            <div className="space-y-2.5">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Coupang Eats & Olive Young 闪送</span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">补充体力、减压或请好友吃夜宵！</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black">₩{stats.coins.toLocaleString()}</div>
                  <div className="text-[10px] opacity-90">可用余额</div>
                </div>
              </div>

              <div className="bg-white border border-orange-100 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#3d352b]">🎁 选择一起分享外卖的好友 (+8好感)：</span>
                <select
                  value={shareNpcId}
                  onChange={(e) => setShareNpcId(e.target.value)}
                  className="bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 text-xs font-bold"
                >
                  {npcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.chineseName} (好感 {n.favorability}%)
                    </option>
                  ))}
                </select>
              </div>

              {deliveryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-orange-100 rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#2b2620]">{item.name}</div>
                    <div className="text-[10px] text-orange-600 font-bold mt-0.5">{item.shop}</div>
                    <div className="text-[11px] text-[#6e6456] mt-0.5">{item.desc}</div>
                    <div className="text-xs font-black text-amber-800 mt-1">₩{item.price.toLocaleString()}</div>
                  </div>
                  <button
                    disabled={stats.coins < item.price}
                    onClick={() => {
                      onPublishPost(
                        {
                          id: `del_${Date.now()}`,
                          weekLabel,
                          tag: '#校园外卖投喂',
                          caption: `点了【${item.name}】，幸福感瞬间拉满！✨`,
                          likes: 210,
                          followerGain: 80,
                          npcComments: [],
                        },
                        item.effect
                      );
                      if (onUpdateFavorability) {
                        if (item.shareAll) {
                          npcs.forEach((n) => onUpdateFavorability(n.id, 6));
                        } else if (item.canShare) {
                          onUpdateFavorability(shareNpcId, 8);
                        }
                      }
                      const targetNpc = npcs.find((n) => n.id === shareNpcId);
                      onNotify(
                        `🛵 闪送已送达！【${item.name}】享用完毕${
                          item.shareAll
                            ? '，全员NPC好感度 +6！'
                            : item.canShare && targetNpc
                            ? `，与 ${targetNpc.chineseName} 一起分享，好感度 +8！`
                            : '！'
                        }`
                      );
                    }}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-45 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    立即下单
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ================================================================== */}
          {/* APP 8: ALBA & BRAND PR DEALS (Folded in Life Services)             */}
          {/* ================================================================== */}
          {activeTab === 'alba' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>AlbaMon 线上兼职 & 品牌商务通告</span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">每周限执行 1 次兼职或品牌推广通告</div>
                </div>
                <Coins className="w-6 h-6 text-amber-300" />
              </div>

              {isAlreadyWorkedToday && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-xl text-xs font-bold">
                  本周已完成兼职/商务通告（下周重置）！
                </div>
              )}

              {/* Alba Jobs */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#3b2f3d]">📌 线上兼职列表：</div>
                {albaJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-emerald-100 rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#2b2620]">{job.title}</div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        {job.tag} · 消耗 {job.staminaCost} 体力
                      </div>
                      <div className="text-[11px] text-[#6e6456] mt-0.5">{job.desc}</div>
                      <div className="text-xs font-black text-emerald-800 mt-1">
                        报酬 +₩{job.pay.toLocaleString()}
                      </div>
                    </div>
                    <button
                      disabled={isAlreadyWorkedToday || stats.stamina < job.staminaCost}
                      onClick={() => {
                        if (isAlreadyWorkedToday) {
                          onNotify('本周已完成（下周重置）！');
                          return;
                        }
                        if (onRecordJobDone) onRecordJobDone();
                        if (onTriggerActionEvent) {
                          onTriggerActionEvent({
                            actionCategory: 'part_time_job',
                            actionName: `兼职打工：${job.title}`,
                            locationName: '首尔市区兼职地点',
                            baseStaminaCost: job.staminaCost,
                            weeklyActionKey: 'weekly_parttime_or_endorsement',
                            extraContext: `${job.desc}（日结报酬 +₩${job.pay.toLocaleString()}）`,
                          });
                          return;
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 ${
                        isAlreadyWorkedToday
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      }`}
                    >
                      {isAlreadyWorkedToday ? '本周已完成' : '立即接单'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Brand PR Deals */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>品牌方商务 PR 通告邀约（粉丝达标解锁）：</span>
                </div>
                {brandPRDeals.map((deal) => {
                  const unlocked = stats.snsFollowers >= deal.minFollowers;
                  const done = completedPRIds.includes(deal.id);
                  return (
                    <div
                      key={deal.id}
                      className="bg-white border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2b2620] truncate">{deal.brand}</div>
                        <div className="text-[11px] text-[#6e6456] mt-0.5">{deal.desc}</div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                          <span className="text-amber-700">通告费 +₩{deal.pay.toLocaleString()}</span>
                          <span className="text-rose-600">涨粉 +{deal.followerBoost.toLocaleString()}</span>
                          <span className="text-[#8c8273]">需 {deal.minFollowers.toLocaleString()} 粉</span>
                        </div>
                      </div>
                      <button
                        disabled={!unlocked || done || isAlreadyWorkedToday || stats.stamina < 10}
                        onClick={() => {
                          if (isAlreadyWorkedToday) {
                            onNotify('本周已完成（下周重置）！');
                            return;
                          }
                          setCompletedPRIds([...completedPRIds, deal.id]);
                          if (onRecordJobDone) onRecordJobDone();
                          if (onTriggerActionEvent) {
                            onTriggerActionEvent({
                              actionCategory: 'endorsement',
                              actionName: `商业代言拍摄：${deal.brand}`,
                              locationName: '圣水洞/清潭洞品牌摄影棚',
                              baseStaminaCost: 10,
                              weeklyActionKey: 'weekly_parttime_or_endorsement',
                              extraContext: `${deal.desc}（报酬 +₩${deal.pay.toLocaleString()}，涨粉 +${deal.followerBoost.toLocaleString()}）`,
                            });
                            return;
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 ${
                          isAlreadyWorkedToday || done || !unlocked
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                        }`}
                      >
                        {isAlreadyWorkedToday
                          ? '本周已完成'
                          : done
                          ? '已履约'
                          : unlocked
                          ? '接单拍摄'
                          : '粉丝未达标'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* NEW APP 1: DISPATCH 狗仔爆料 & 全首尔吃瓜广场                      */}
          {/* ================================================================== */}
          {activeTab === 'dispatch' && (
            <div className="space-y-3">
              {/* Dispatch Header Banner */}
              <div className="bg-gradient-to-r from-stone-950 via-gray-900 to-stone-900 text-amber-400 p-3.5 rounded-2xl border border-stone-800 shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 text-[10px] font-black">
                      DISPATCH SQUAWK
                    </span>
                    <span className="text-xs font-bold text-stone-300">D社 · 全首尔娱乐圈吃瓜广场</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    首尔演艺圈八卦爆料全景汇聚 · 循规蹈矩安心吃瓜；仅当出入夜店/负面绯闻时触发个人危机！
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-amber-400">
                    {dispatchLeaks.length} 条热议
                  </div>
                  <div className="text-[9px] text-stone-400">娱乐圈吃瓜广场</div>
                </div>
              </div>

              {/* Dispatch Leaks List */}
              <div className="space-y-3">
                {dispatchLeaks.map((scandal) => {
                  const isPending = scandal.status === 'pending';
                  const isPlayerTarget = Boolean(scandal.isPlayerTarget);

                  return (
                    <div
                      key={scandal.id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                        isPlayerTarget
                          ? 'bg-gradient-to-br from-rose-950/90 via-stone-900 to-red-950 text-white border-rose-500/80 shadow-lg animate-pulse-subtle'
                          : isPending
                          ? 'bg-gradient-to-br from-stone-900 via-stone-900/90 to-gray-950 text-white border-amber-500/40 shadow-md'
                          : 'bg-stone-100/90 text-stone-700 border-stone-300 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isPlayerTarget
                              ? 'bg-rose-600 text-white border border-rose-400'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isPlayerTarget ? '🚨 针对你的偷拍危机' : '🍿 娱乐圈爆料吃瓜'}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                          ⏳ 爆料倒计时: {scandal.hoursRemaining}小时
                        </span>
                      </div>

                      {/* Explicit Causal Explanation Box for Player Target Scandal */}
                      {isPlayerTarget && scandal.causalReason && (
                        <div className="bg-rose-950/90 border border-rose-500/60 p-2.5 rounded-xl text-xs text-rose-200 font-bold leading-relaxed flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{scandal.causalReason}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-3 pt-1">
                        <img
                          src={scandal.evidencePhoto}
                          alt="D社爆料底片"
                          className="w-20 h-20 rounded-xl object-cover border border-stone-700 shrink-0 shadow-sm"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-black text-amber-200 leading-snug">
                            {scandal.headline}
                          </h4>
                          <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                            {scandal.summary}
                          </p>
                          <div className="text-[10px] text-stone-400 font-medium">
                            爆料主角：{scandal.targetNpcName || '演艺圈明星'} · {scandal.leakDateLabel}
                          </div>
                        </div>
                      </div>

                      {/* Netizen comments section for NPC / Celebrity Scandals */}
                      {!isPlayerTarget && scandal.netizenComments && scandal.netizenComments.length > 0 && (
                        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 space-y-1.5 text-[11px]">
                          <div className="text-[10px] text-amber-400 font-black flex items-center gap-1">
                            <span>💬 韩网 Theqoo / Pann 论坛爆火评论切片：</span>
                          </div>
                          {scandal.netizenComments.map((cmt, idx) => (
                            <div key={idx} className="text-stone-300 flex items-center justify-between gap-2">
                              <span className="font-bold text-amber-200/90 shrink-0">{cmt.name}:</span>
                              <span className="truncate flex-1">{cmt.text}</span>
                              <span className="text-[9px] text-amber-400 font-mono shrink-0">👍 {cmt.likes}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions Logic */}
                      {isPlayerTarget ? (
                        /* Player Target Scandal PR Actions */
                        isPending ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800">
                            <button
                              onClick={() => {
                                setActivePRModalScandal(scandal);
                                setPrOutcomeResult(null);
                                handleExecuteDispatchPR('buyout');
                              }}
                              disabled={isProcessingPR || stats.coins < scandal.buyoutCostKRW}
                              className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <span>💰 巨资买断照片</span>
                              <span className="text-[9px] font-mono">(-₩{scandal.buyoutCostKRW.toLocaleString()})</span>
                            </button>

                            <button
                              onClick={() => {
                                setActivePRModalScandal(scandal);
                                setPrOutcomeResult(null);
                                handleExecuteDispatchPR('statement');
                              }}
                              disabled={isProcessingPR}
                              className="p-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-black rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <span>🛡️ 发官方法律澄清</span>
                              <span className="text-[9px]">权威证据控评</span>
                            </button>

                            <button
                              onClick={() => {
                                setActivePRModalScandal(scandal);
                                setPrOutcomeResult(null);
                                handleExecuteDispatchPR('counter_pr');
                              }}
                              disabled={isProcessingPR}
                              className="p-2 bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white font-black rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <span>🔥 冷处理/热搜反击</span>
                              <span className="text-[9px]">高直拍作品淹没</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-stone-200/80 text-stone-700 text-xs font-black flex items-center justify-between border border-stone-300">
                            <span>✅ 危机已化解：{scandal.status === 'resolved_bought' ? '巨资买断底片' : scandal.status === 'resolved_statement' ? '强硬官方澄清' : '反击舆论胜利'}</span>
                            <span className="text-[10px] text-stone-500">不再产生舆论冲击</span>
                          </div>
                        )
                      ) : (
                        /* NPC / Celebrity Gossip Interactions */
                        <div className="pt-2 border-t border-stone-800">
                          {scandal.userReaction ? (
                            <div className="p-2.5 rounded-xl bg-stone-800/90 text-amber-300 text-xs font-black border border-amber-500/30 flex items-center justify-between">
                              <span>✨ 我的吃瓜态度：{scandal.reactionResultText}</span>
                              <span className="text-[10px] text-stone-400">已互动</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleInteractNpcScandal(scandal.id, 'spectate')}
                                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer"
                              >
                                <span>🍿 围观吃瓜</span>
                                <span className="text-[9px] text-amber-400/80">心情 +5</span>
                              </button>

                              <button
                                onClick={() => handleInteractNpcScandal(scandal.id, 'like')}
                                className="p-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer"
                              >
                                <span>👍 点赞转发</span>
                                <span className="text-[9px] text-sky-400/80">粉丝+300 / 社交+5</span>
                              </button>

                              <button
                                onClick={() => handleInteractNpcScandal(scandal.id, 'sabotage')}
                                className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-[11px] flex flex-col items-center justify-center cursor-pointer"
                              >
                                <span>💥 踩竞争对手</span>
                                <span className="text-[9px] text-rose-400/80">打压对手 / 声望+8</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PR Outcome Result Banner Modal */}
              {prOutcomeResult && activePRModalScandal && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900 to-gray-950 text-white border-2 border-amber-400 shadow-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-black">
                    <span>✨ 危机公关处置结果报告</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px]">
                      {prOutcomeResult.isSuccess ? '公关大获全胜' : '舆论产生波动'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 leading-relaxed font-medium bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                    {prOutcomeResult.narrative}
                  </p>
                  <div className="bg-black/40 p-2.5 rounded-xl text-xs text-amber-200 font-bold border border-amber-500/30">
                    💬 代表性韩网评论：{prOutcomeResult.netizenReaction}
                  </div>
                  <button
                    onClick={() => {
                      setActivePRModalScandal(null);
                      setPrOutcomeResult(null);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl cursor-pointer"
                  >
                    知道了，返回监控中心
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================== */}
          {/* NEW APP 2: COUPANG 奢品网购 & 一键晒 STARGRAM                      */}
          {/* ================================================================== */}
          {activeTab === 'coupang' && (
            <div className="space-y-3">
              {/* Coupang Header Banner */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-black">
                      ROCKET LUXURY
                    </span>
                    <h3 className="text-xs sm:text-sm font-black">Coupang 奢品网购 & 极速穿搭仓</h3>
                  </div>
                  <p className="text-[10px] text-blue-100 mt-1">
                    购买可提升外形、时尚度与减压速 · 拥有后可一键发布至 Stargram 朋友圈！
                  </p>
                </div>
                <ShoppingBag className="w-7 h-7 text-amber-300 shrink-0" />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'uniform', label: '校服高定' },
                  { id: 'couture', label: '秀场礼服' },
                  { id: 'stage', label: '打歌战袍' },
                  { id: 'luxury_bag', label: '名门包包' },
                  { id: 'skincare', label: '护肤水光' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCoupangCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                      coupangCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-blue-50 text-blue-900 border border-blue-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Shop Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COUPANG_PRESET_ITEMS.filter(
                  (item) => coupangCategory === 'all' || item.category === coupangCategory
                ).map((item) => {
                  const isOwned = coupangOwnedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-blue-100 rounded-2xl p-3 flex flex-col justify-between shadow-xs space-y-2 hover:shadow-md transition-all"
                    >
                      <div className="space-y-2">
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-stone-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-black">
                            {item.tag}
                          </span>
                          {isOwned && (
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black shadow-xs">
                              ✅ 已拥有
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-blue-950 line-clamp-1">{item.name}</h4>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.koreanName}</div>
                          <p className="text-[11px] text-stone-600 leading-snug line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>

                        {/* Stats Boost Ribbon */}
                        <div className="flex flex-wrap gap-1 text-[10px] font-extrabold pt-1">
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            外形 +{item.appearanceBonus}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            时尚 +{item.socialBonus}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            减压 -{item.darkIndexReduction}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-50 flex items-center justify-between gap-2">
                        <div className="text-xs font-black text-blue-900">
                          ₩{item.priceKRW.toLocaleString()}
                        </div>

                        {isOwned ? (
                          <button
                            onClick={() => handlePublishCoupangToStargram(item)}
                            disabled={isPublishingCoupangOotd}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-[11px] font-black cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>一键晒到 Stargram</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyCoupangItem(item)}
                            disabled={stats.coins < item.priceKRW}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black cursor-pointer shadow-xs"
                          >
                            购买下单
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================== */}
          {/* NEW APP 3: K-TALK 演艺圈人脉与高管商务私信                        */}
          {/* ================================================================== */}
          {activeTab === 'ktalk' && (
            <div className="space-y-3 flex flex-col h-full min-h-[480px]">
              {/* KTalk Header */}
              <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-black">
                      K-TALK VIP
                    </span>
                    <h3 className="text-xs sm:text-sm font-black">K-Talk · 演艺圈人脉与高管商务私信</h3>
                  </div>
                  <p className="text-[10px] text-amber-100 mt-1">
                    电视台 PD、金牌制作人与对手私信博弈 · 高情商解锁独家高级通告！
                  </p>
                </div>
                <Briefcase className="w-7 h-7 text-amber-200 shrink-0" />
              </div>

              {/* VIP Contacts Selector Horizontal Bar */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 py-0.5">
                {ktalkContacts.map((contact) => {
                  const isSelected = activeKTalkContactId === contact.id;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => setActiveKTalkContactId(contact.id)}
                      className={`p-2 rounded-2xl border flex items-center gap-2 cursor-pointer shrink-0 transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-sm'
                          : 'bg-white hover:bg-amber-50 text-stone-800 border-amber-200'
                      }`}
                    >
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-8 h-8 rounded-xl object-cover border border-amber-300 shrink-0"
                      />
                      <div className="text-left">
                        <div className="text-xs font-bold truncate max-w-[100px]">{contact.name}</div>
                        <div className="text-[9px] opacity-80">人脉: {contact.influenceLevel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected VIP Chat Window */}
              {(() => {
                const activeContact = ktalkContacts.find((c) => c.id === activeKTalkContactId) || ktalkContacts[0];
                return (
                  <div className="bg-white border border-amber-200 rounded-2xl p-3.5 flex-1 flex flex-col justify-between space-y-3 shadow-xs">
                    {/* Top VIP Profile Strip */}
                    <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={activeContact.avatar}
                          alt={activeContact.name}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-300"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-amber-950">{activeContact.name}</h4>
                          <div className="text-[10px] text-amber-800 font-medium">{activeContact.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-black">
                          圈内人脉: {activeContact.influenceLevel}/100
                        </span>
                      </div>
                    </div>

                    {/* Pending Offer Card if unlocked */}
                    {activeContact.pendingOffer && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 space-y-2 shadow-md shrink-0">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-stone-950 text-amber-300 text-[10px] font-black">
                            🎉 高情商解锁演艺圈独家通告
                          </span>
                          <span className="text-[10px] font-black text-stone-900">
                            +₩{activeContact.pendingOffer.rewardCoins.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-stone-950">{activeContact.pendingOffer.title}</h5>
                          <p className="text-[11px] text-stone-900 font-medium mt-0.5">
                            {activeContact.pendingOffer.desc}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAcceptKTalkOffer(activeContact.id)}
                          className="w-full py-1.5 bg-stone-950 hover:bg-stone-900 text-amber-300 font-black text-xs rounded-xl cursor-pointer shadow-xs"
                        >
                          ✨ 立即接下并履约此高级通告
                        </button>
                      </div>
                    )}

                    {/* Message Thread */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 p-2 bg-[#faf7f2] rounded-xl border border-amber-100 max-h-60">
                      {activeContact.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                              msg.sender === 'player'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold rounded-tr-xs'
                                : 'bg-white text-stone-800 border border-amber-200/80 shadow-2xs rounded-tl-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-stone-400 mt-0.5 px-1 font-mono">
                            <span>{msg.timestamp}</span>
                            {msg.eqScore && (
                              <span className="text-amber-600 font-bold">· 情商评分: {msg.eqScore}分</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input Box */}
                    <div className="flex gap-2 shrink-0 pt-1 border-t border-amber-100">
                      <input
                        type="text"
                        value={ktalkInputText}
                        onChange={(e) => setKtalkInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendKTalkVIPMessage()}
                        placeholder={`回复 ${activeContact.name}... (高情商回复可大幅提升人脉/解锁高级通告)`}
                        className="flex-1 bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        onClick={handleSendKTalkVIPMessage}
                        disabled={isGeneratingKTalkVIPReply || !ktalkInputText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isGeneratingKTalkVIPReply ? 'AI思考中...' : '发送'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="relative z-20 bg-white/80 backdrop-blur-xl py-2 flex justify-center border-t border-pink-100/60 shrink-0">
          <button
            onClick={() => setActiveTab('desktop')}
            title="返回手机主屏幕"
            className="w-32 h-1.5 rounded-full bg-[#3b2f3d]/35 hover:bg-rose-500 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
