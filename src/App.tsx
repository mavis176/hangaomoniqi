import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainHallway } from './components/MainHallway';
import {
  GameStats,
  NPCClassmate,
  WardrobeItem,
  RandomEvent,
  AIConfig,
  MemoryEntry,
  ChatMessage,
  ExamRecord,
  WeeklyActionItem,
  EventCategory,
  SNSPost,
  RelationshipStage,
  DiaryEntry,
  WeeklyExecutionSummary,
  PlayerTrait,
  DynamicNPCEncounter,
  FanBubbleThread,
  PlayerAssetsState,
  FamilyMilestoneItem,
} from './types';
import { AssetsModal } from './components/modals/AssetsModal';
import { FamilyModal } from './components/modals/FamilyModal';
import { HOUSING_PRESETS, VEHICLE_PRESETS } from './data/assetsData';
import {
  initialStats,
  initialNPCs,
  initialWardrobe,
  initialMemories,
  defaultAIConfig,
  locationScenes,
  getWeekCalendarInfo,
  computeRelationshipStage,
} from './data/gameData';
import { pickWeeklyEvent } from './data/eventsPool';
import {
  AVATAR_SOOYEON_DEFAULT,
  NPC_KOREAN_AVATARS_MAP,
  AVATAR_STYLE_PACKS,
} from './data/koreanAvatars';
import {
  generateDynamicCampusEvent,
  generateDynamicNarrative,
  generateNewNPCEncounter,
  generateActionInteractiveEvent,
  generateFanBubbleMessages,
  ActionEventCategory,
  ActionInteractiveChoice,
} from './services/aiService';
import {
  convertEncounterToNPC,
  DYNAMIC_NPC_FALLBACK_PRESETS,
} from './data/encounterData';

import { WeeklySchedulerModal } from './components/modals/WeeklySchedulerModal';
import { TimeSkipSummaryModal } from './components/modals/TimeSkipSummaryModal';
import { EncounterModal } from './components/modals/EncounterModal';
import { TimetableModal } from './components/modals/TimetableModal';
import { ClubModal } from './components/modals/ClubModal';
import { TraineeModal } from './components/modals/TraineeModal';
import { ExtracurricularModal } from './components/modals/ExtracurricularModal';
import { RelationshipModal } from './components/modals/RelationshipModal';
import { WardrobeModal } from './components/modals/WardrobeModal';
import { GradesModal } from './components/modals/GradesModal';
import { FacilitiesModal } from './components/modals/FacilitiesModal';
import { TimeManagementModal } from './components/modals/TimeManagementModal';
import { DiaryModal } from './components/modals/DiaryModal';
import { DestinyCardModal } from './components/modals/DestinyCardModal';
import { SaveLoadModal } from './components/modals/SaveLoadModal';
import { EventModal } from './components/modals/EventModal';
import { ChatModal } from './components/modals/ChatModal';
import { GiftModal } from './components/modals/GiftModal';
import { LunchModal } from './components/modals/LunchModal';
import { AISettingsModal } from './components/modals/AISettingsModal';
import { ForumModal } from './components/modals/ForumModal';
import { SNSPhoneModal } from './components/modals/SNSPhoneModal';
import { EndingsModal } from './components/modals/EndingsModal';
import { LifePathModal } from './components/modals/LifePathModal';
import { MapModal } from './components/modals/MapModal';
import { NPCPortraitModal } from './components/modals/NPCPortraitModal';
import {
  RelationshipChangePromptModal,
  RelationshipChangePromptData,
} from './components/modals/RelationshipChangePromptModal';
import {
  ChoiceResultModal,
  ChoiceResultData,
} from './components/modals/ChoiceResultModal';
import { CharacterCreationModal } from './components/modals/CharacterCreationModal';
import { MapActionItem, MapLocationInfo } from './data/mapData';

export default function App() {
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [protagonistName, setProtagonistName] = useState<string>(() => {
    return localStorage.getItem('seoul_heroine_name') || '李秀妍';
  });
  const [showCharacterCreation, setShowCharacterCreation] = useState<boolean>(() => {
    return !localStorage.getItem('seoul_heroine_created');
  });
  // 2025-2027 3-Year Academic System (Grade 1-3, Week 1-36 per year, Day 0-6 per week = 756 Days!)
  const [gradeYear, setGradeYear] = useState<number>(1);
  const [weekInYear, setWeekInYear] = useState<number>(1);
  const [dayInWeek, setDayInWeek] = useState<number>(0); // 0=周一 .. 6=周日
  const [clockMinutes, setClockMinutes] = useState<number>(615);
  const [location, setLocation] = useState<string>('2楼走廊');
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [protagonistAvatarUrl, setProtagonistAvatarUrl] = useState<string>(AVATAR_SOOYEON_DEFAULT);

  const [npcs, setNpcs] = useState<NPCClassmate[]>(initialNPCs);
  const [discoveredNpcList, setDiscoveredNpcList] = useState<NPCClassmate[]>([]);
  const [triggeredEventHistory, setTriggeredEventHistory] = useState<string[]>([]);
  const [weeklyCompletedActions, setWeeklyCompletedActions] = useState<string[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(initialWardrobe);
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
  const [unreportedMilestones, setUnreportedMilestones] = useState<FamilyMilestoneItem[]>(() => {
    const saved = localStorage.getItem('seoul_unreported_milestones');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'm_init_enrollment',
        title: '成功考入首尔女子高中 1-1 班',
        categoryLabel: '入学捷报',
        rewardCoins: 30000,
        newsSummary: '正式踏入首尔女子高中校门，开启精彩高中三年人生篇章！',
        createdAtStr: '高1第1周',
      },
    ];
  });

  const addFamilyMilestone = (title: string, categoryLabel: string, rewardCoins: number, newsSummary: string) => {
    const id = `milestone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newItem: FamilyMilestoneItem = {
      id,
      title,
      categoryLabel,
      rewardCoins,
      newsSummary,
      createdAtStr: `高${gradeYear}第${weekInYear}周`,
    };
    setUnreportedMilestones((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem('seoul_unreported_milestones', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClaimMilestone = (milestoneId: string, rewardCoins: number, newsSummary: string) => {
    applyDeltaStats({
      coins: rewardCoins,
      allowance: 2000,
      family: 15,
      mood: 15,
    });
    setUnreportedMilestones((prev) => {
      const updated = prev.filter((m) => m.id !== milestoneId);
      localStorage.setItem('seoul_unreported_milestones', JSON.stringify(updated));
      return updated;
    });
    addGlobalMemory(`向家里报喜：${newsSummary}，父母骄傲地奖赏了 ₩${rewardCoins.toLocaleString()}。`, 'family');
  };
  const [playerAssets, setPlayerAssets] = useState<PlayerAssetsState>(() => {
    const saved = localStorage.getItem('seoul_player_assets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      currentHousingId: 'housing_semi_basement',
      currentVehicleId: 'vehicle_subway',
      ownedHousingIds: ['housing_semi_basement'],
      ownedVehicleIds: ['vehicle_subway'],
    };
  });

  const handleBuyHousing = (housingId: string, price: number) => {
    if (stats.coins < price) return;
    updateStats({ coins: -price });
    setPlayerAssets((prev) => {
      const updated = {
        ...prev,
        currentHousingId: housingId,
        ownedHousingIds: prev.ownedHousingIds.includes(housingId)
          ? prev.ownedHousingIds
          : [...prev.ownedHousingIds, housingId],
      };
      localStorage.setItem('seoul_player_assets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectHousing = (housingId: string) => {
    setPlayerAssets((prev) => {
      const updated = { ...prev, currentHousingId: housingId };
      localStorage.setItem('seoul_player_assets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBuyVehicle = (vehicleId: string, price: number) => {
    if (stats.coins < price) return;
    updateStats({ coins: -price });
    setPlayerAssets((prev) => {
      const updated = {
        ...prev,
        currentVehicleId: vehicleId,
        ownedVehicleIds: prev.ownedVehicleIds.includes(vehicleId)
          ? prev.ownedVehicleIds
          : [...prev.ownedVehicleIds, vehicleId],
      };
      localStorage.setItem('seoul_player_assets', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setPlayerAssets((prev) => {
      const updated = { ...prev, currentVehicleId: vehicleId };
      localStorage.setItem('seoul_player_assets', JSON.stringify(updated));
      return updated;
    });
  };

  const [snsPosts, setSnsPosts] = useState<SNSPost[]>([
    {
      id: 'sns_init_1',
      weekLabel: '2025年3月 第1周',
      tag: '#首尔女高 #高一新生报到',
      caption: '2025年春樱盛开的季节，正式成为首尔女子高中1-1班的一员啦 🌸✨',
      likes: 640,
      followerGain: 520,
      npcComments: [
        { npcName: '朴敏英', text: '以后三年请多多关照呀我的神仙同桌 ❤️' },
        { npcName: '姜海仁', text: '欢迎学妹！有空来体育馆看我们排球部训练！' },
      ],
    },
  ]);
  const [unlockedEndingIds, setUnlockedEndingIds] = useState<string[]>([]);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [recentScheduleSummary, setRecentScheduleSummary] = useState<string>(
    '刚在首尔女高周考中表现惊艳，并在企划社公开练习室完成4K竖屏直拍录制'
  );
  const [fanBubbleThreads, setFanBubbleThreads] = useState<FanBubbleThread[]>(() => [
    {
      id: 'fan_init_station',
      fanName: '@Sooyeon_Cam0321',
      fanRole: '金牌站姐（数据女工）',
      avatarEmoji: '📸',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      loyalty: 85,
      pendingLoyaltyGain: 15,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '刚刚 · 新来信',
      messages: [
        {
          sender: 'fan',
          text: '宝！！今天公开练习室的4K竖屏直拍我已经精修完发推了，十分钟转赞破五千！！(≧∇≦)ﾉ 数据组今晚继续通宵切瓜刷榜，秀妍只管在舞台上闪闪发光！！❤️🔥',
          timeLabel: '10:15',
        },
      ],
    },
    {
      id: 'fan_init_loyal',
      fanName: '陪伴秀妍直到世界尽头',
      fanRole: '死忠老粉',
      avatarEmoji: '💖',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      loyalty: 92,
      pendingLoyaltyGain: 18,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '2分钟前',
      messages: [
        {
          sender: 'fan',
          text: '呜呜呜我的小公主ㅠㅠ 看到你这周兼顾学业和声乐刀群舞训练连轴转，镜头拉近的时候都瘦了一圈，妈妈粉心疼得眼泪狂飙(T_T) 今晚一定要吃顿热乎的韩牛补补身体呀！！💖✨',
          timeLabel: '10:12',
        },
      ],
    },
    {
      id: 'fan_init_funny',
      fanName: '今天也在为秀妍哐哐撞大墙',
      fanRole: '搞笑整活粉',
      avatarEmoji: '🤣',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      loyalty: 78,
      pendingLoyaltyGain: 14,
      hasUnread: true,
      unreadCount: 1,
      updatedAtLabel: '5分钟前',
      messages: [
        {
          sender: 'fan',
          text: '救命啊警察叔叔！！这里有人在舞台上用美貌纵火！！(*≧ω≦) 秀妍你知道你今天犯了什么规吗？犯了让我一眼万年的心动规！！我已经把你的Ending妖精截图贴满宿舍床头了哈哈哈哈！！🎉💖',
          timeLabel: '10:08',
        },
      ],
    },
  ]);

  const refreshGlobalFanBubbleMessages = async (
    scheduleDesc: string,
    overrideStats?: GameStats,
    weekContextLabel?: string
  ) => {
    const curStats = overrideStats || stats;
    setRecentScheduleSummary(scheduleDesc);
    const identityStatus =
      curStats.darkIndex >= 45
        ? '陷入热议舆论风波却凭神级舞台逆风翻盘的话题焦点'
        : curStats.isDebutedIdol && curStats.snsFollowers >= 35000
        ? '横扫韩网音源榜与打歌一位的当红顶流女团Center'
        : curStats.isDebutedIdol
        ? '刚出道的 A 班怪兽新人爱豆'
        : curStats.traineeGrade?.includes('A')
        ? '企划社公开企划 A 班王牌新人练习生'
        : '首尔女高颜值与实力兼备的人气练习生';

    try {
      const items = await generateFanBubbleMessages({
        identityStatus,
        recentSchedule: scheduleDesc,
        fanPersonas: ['【金牌站姐（数据女工）】', '【死忠老粉】', '【搞笑整活粉】'],
        playerName: protagonistName,
        stats: curStats,
        weekLabel: weekContextLabel || `高${gradeYear}第${weekInYear}周`,
        aiConfig,
      });
      if (Array.isArray(items) && items.length > 0) {
        const nowStamp = Date.now();
        const timeStr = `${String(Math.floor(clockMinutes / 60)).padStart(2, '0')}:${String(
          clockMinutes % 60
        ).padStart(2, '0')}`;
        const freshThreads: FanBubbleThread[] = items.slice(0, 3).map((item, idx) => {
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
            loyalty: isStation ? 86 : isFunny ? 79 : 93,
            pendingLoyaltyGain: item.loyaltyGain || 15,
            hasUnread: true,
            unreadCount: 1,
            updatedAtLabel: '刚刚 · 新粉丝来信',
            messages: [
              {
                sender: 'fan',
                text: item.message,
                timeLabel: timeStr,
              },
            ],
          };
        });
        setFanBubbleThreads((prev) => [...freshThreads, ...prev.slice(0, 6)]);
      }
    } catch (_e) {}
  };

  const [lastJobTurnKey, setLastJobTurnKey] = useState<string>(() => {
    return localStorage.getItem('seoul_last_job_turn') || '';
  });
  const [lastExamKey, setLastExamKey] = useState<string>(() => {
    return localStorage.getItem('seoul_last_exam_key') || '';
  });

  const currentTurnKey = `y${gradeYear}_w${weekInYear}`;
  const currentWeekKey = `y${gradeYear}_w${weekInYear}`;

  const handleRecordJobDone = () => {
    setLastJobTurnKey(currentTurnKey);
    localStorage.setItem('seoul_last_job_turn', currentTurnKey);
    markWeeklyActionCompleted('weekly_parttime_or_endorsement');
  };

  const handleRecordExamDone = () => {
    setLastExamKey(currentWeekKey);
    localStorage.setItem('seoul_last_exam_key', currentWeekKey);
    markWeeklyActionCompleted('weekly_mock_exam');
  };

  const markWeeklyActionCompleted = (actionKey: string) => {
    if (!actionKey) return;
    setWeeklyCompletedActions((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]));
  };

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('seoul_heroine_diary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved diary entries');
      }
    }
    return [
      {
        id: 'diary_init_1',
        dateStr: '高一 第1学期 第1周',
        title: '樱花开的初春，首尔女高开学日🌸',
        content: '今天第一天踏进首尔女高1-1班，同桌朴敏英人超好，还分给我她自己烘焙的小蛋挞！下课时在走廊遇到了风纪委员韩素拉，眼神好高冷，但我一定要和她成为好朋友！',
        mood: '期待',
        sticker: '🌸',
        weather: '🌸 樱花飘落',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const handleSaveDiaryEntry = (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `diary_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDiaryEntries((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('seoul_heroine_diary', JSON.stringify(updated));
      return updated;
    });
    showNotification('✍️ 成功将日志存入秘密青春手帐！');
  };

  const handleDeleteDiaryEntry = (id: string) => {
    setDiaryEntries((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      localStorage.setItem('seoul_heroine_diary', JSON.stringify(updated));
      return updated;
    });
    showNotification('🗑️ 已删除手帐日记条目');
  };

  const [selectedNpcId, setSelectedNpcId] = useState<string>(initialNPCs[0].id);
  const [aiConfig, setAiConfig] = useState<AIConfig>(defaultAIConfig);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [timeSkipTarget, setTimeSkipTarget] = useState<{ year: number; week: number } | null>(null);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [targetNpcId, setTargetNpcId] = useState<string>(initialNPCs[0].id);
  const [portraitWorkshopNpcId, setPortraitWorkshopNpcId] = useState<string | undefined>(undefined);
  const [pendingRelationshipChange, setPendingRelationshipChange] =
    useState<RelationshipChangePromptData | null>(null);
  const [isGeneratingAIEvent, setIsGeneratingAIEvent] = useState<boolean>(false);
  const [eventLoadingContext, setEventLoadingContext] = useState<{
    year: number;
    week: number;
    seasonName: string;
    location: string;
    npcName: string;
    npcRole: string;
  } | null>(null);
  const [choiceResultData, setChoiceResultData] = useState<ChoiceResultData | null>(null);
  const [activeEncounter, setActiveEncounter] = useState<DynamicNPCEncounter | null>(null);
  const [snsInitialTab, setSnsInitialTab] = useState<'desktop' | 'stargram' | 'kakao'>('desktop');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kr_school_sim_2025_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stats) setStats({ ...initialStats, ...parsed.stats });
        if (parsed.gradeYear) setGradeYear(parsed.gradeYear);
        if (parsed.weekInYear) setWeekInYear(parsed.weekInYear);
        if (typeof parsed.dayInWeek === 'number') setDayInWeek(parsed.dayInWeek);
        if (typeof parsed.clockMinutes === 'number') setClockMinutes(parsed.clockMinutes);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.customBgUrl !== undefined) setCustomBgUrl(parsed.customBgUrl);
        if (
          parsed.protagonistAvatarUrl &&
          !parsed.protagonistAvatarUrl.includes('images.unsplash.com') &&
          (parsed.protagonistAvatarUrl.startsWith('data:image/png') ||
            parsed.protagonistAvatarUrl.startsWith('data:image/jpeg') ||
            parsed.protagonistAvatarUrl.startsWith('data:image/webp') ||
            parsed.protagonistAvatarUrl.includes('clipL_') ||
            parsed.protagonistAvatarUrl.startsWith('http'))
        ) {
          setProtagonistAvatarUrl(parsed.protagonistAvatarUrl);
        }
        if (parsed.npcs && Array.isArray(parsed.npcs)) {
          // Automatically migrate any old Unsplash or legacy avatars in localStorage to the upgraded Korean Webtoon portraits
          const migratedNpcs: NPCClassmate[] = parsed.npcs.map((n: NPCClassmate) => {
            if (n.isGenerated) return n;
            const freshAvatar = NPC_KOREAN_AVATARS_MAP[n.id];
            const isLegacyUnsplashOrOldSvg =
              !n.avatar ||
              n.avatar.includes('images.unsplash.com') ||
              (n.avatar.startsWith('data:image/svg+xml') && !n.avatar.includes('clipL_'));
            return {
              ...n,
              avatar: isLegacyUnsplashOrOldSvg && freshAvatar ? freshAvatar : n.avatar,
            };
          });
          const savedDiscovered: NPCClassmate[] = Array.isArray(parsed.discoveredNpcList)
            ? parsed.discoveredNpcList
            : migratedNpcs.filter((n) => n.isGenerated);
          setDiscoveredNpcList(savedDiscovered);
          const mergedNpcs = [...migratedNpcs];
          savedDiscovered.forEach((d) => {
            if (!mergedNpcs.some((existing) => existing.id === d.id)) {
              mergedNpcs.push(d);
            }
          });
          setNpcs(mergedNpcs);
        } else if (Array.isArray(parsed.discoveredNpcList) && parsed.discoveredNpcList.length > 0) {
          setDiscoveredNpcList(parsed.discoveredNpcList);
          setNpcs([...initialNPCs, ...parsed.discoveredNpcList]);
        }
        if (Array.isArray(parsed.triggeredEventHistory)) {
          setTriggeredEventHistory(parsed.triggeredEventHistory);
        }
        if (Array.isArray(parsed.weeklyCompletedActions)) {
          setWeeklyCompletedActions(parsed.weeklyCompletedActions);
        }
        if (parsed.wardrobe) setWardrobe(parsed.wardrobe);
        if (parsed.memories) setMemories(parsed.memories);
        if (parsed.examRecords) setExamRecords(parsed.examRecords);
        if (parsed.snsPosts) setSnsPosts(parsed.snsPosts);
        if (parsed.unlockedEndingIds) setUnlockedEndingIds(parsed.unlockedEndingIds);
        if (parsed.chatHistories) setChatHistories(parsed.chatHistories);
        if (parsed.aiConfig) setAiConfig(parsed.aiConfig);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto-save state to localStorage
  useEffect(() => {
    try {
      const data = {
        stats,
        gradeYear,
        weekInYear,
        dayInWeek,
        clockMinutes,
        location,
        customBgUrl,
        protagonistAvatarUrl,
        npcs,
        discoveredNpcList,
        triggeredEventHistory,
        weeklyCompletedActions,
        wardrobe,
        memories,
        examRecords,
        snsPosts,
        unlockedEndingIds,
        chatHistories,
        aiConfig,
      };
      localStorage.setItem('kr_school_sim_2025_v4', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  }, [
    stats,
    gradeYear,
    weekInYear,
    dayInWeek,
    clockMinutes,
    location,
    customBgUrl,
    protagonistAvatarUrl,
    npcs,
    discoveredNpcList,
    triggeredEventHistory,
    weeklyCompletedActions,
    wardrobe,
    memories,
    examRecords,
    snsPosts,
    unlockedEndingIds,
    chatHistories,
    aiConfig,
  ]);

  const handleApplyAvatarStylePack = (packId: 'webtoon' | 'anime' | 'pastel') => {
    const pack = AVATAR_STYLE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setProtagonistAvatarUrl(pack.protagonistUrl);
    setNpcs((prev) =>
      prev.map((n) => ({
        ...n,
        avatar: pack.npcUrls[n.id] || n.avatar,
      }))
    );
    showNotification(`✨ 已一键切换全员立绘画风：【${pack.name}】！`);
  };

  const handleUpdateNpcAvatar = (npcId: string, newAvatarUrl: string) => {
    setNpcs((prev) =>
      prev.map((n) => (n.id === npcId ? { ...n, avatar: newAvatarUrl } : n))
    );
    showNotification('✨ 已更新该角色的立绘头像！');
  };

  const handleUpdateNpcKeywords = (npcId: string, keywords: string[]) => {
    setNpcs((prev) =>
      prev.map((n) => (n.id === npcId ? { ...n, memoryKeywords: keywords } : n))
    );
  };

  const currentDayCount = (gradeYear - 1) * 36 + weekInYear;
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const timeContextStr = `${weekInfo.calendarYear}年${weekInfo.month}月 高${gradeYear}第${weekInYear <= 18 ? '上' : '下'}学期 第${weekInYear}周 (${weekInfo.seasonName})`;

  const selectedNpc = npcs.find((n) => n.id === selectedNpcId) || npcs[0];
  const targetNpc = npcs.find((n) => n.id === targetNpcId) || selectedNpc;

  const updateStats = (newStats: Partial<GameStats>) => {
    setStats((prev) => ({
      ...prev,
      mood: newStats.mood !== undefined ? Math.min(100, Math.max(0, newStats.mood)) : prev.mood,
      stamina: newStats.stamina !== undefined ? Math.min(100, Math.max(0, newStats.stamina)) : prev.stamina,
      academics: newStats.academics !== undefined ? Math.min(100, Math.max(0, newStats.academics)) : prev.academics,
      social: newStats.social !== undefined ? Math.min(100, Math.max(0, newStats.social)) : prev.social,
      appearance: newStats.appearance !== undefined ? Math.min(100, Math.max(0, newStats.appearance)) : prev.appearance,
      family: newStats.family !== undefined ? Math.min(100, Math.max(0, newStats.family)) : prev.family,
      coins: newStats.coins !== undefined ? Math.max(0, newStats.coins) : prev.coins,
      allowance: newStats.allowance !== undefined ? Math.max(10000, newStats.allowance) : prev.allowance,
      snsFollowers: newStats.snsFollowers !== undefined ? Math.max(0, newStats.snsFollowers) : prev.snsFollowers,
      clubId: newStats.clubId !== undefined ? newStats.clubId : prev.clubId,
      clubSkill: newStats.clubSkill !== undefined ? Math.min(100, Math.max(0, newStats.clubSkill)) : prev.clubSkill,
      clubTeamwork:
        newStats.clubTeamwork !== undefined
          ? Math.min(100, Math.max(0, newStats.clubTeamwork))
          : prev.clubTeamwork,
      clubStagePower:
        newStats.clubStagePower !== undefined
          ? Math.min(100, Math.max(0, newStats.clubStagePower))
          : prev.clubStagePower,
      clubRank: newStats.clubRank !== undefined ? newStats.clubRank : prev.clubRank,
      clubTrophies: newStats.clubTrophies !== undefined ? newStats.clubTrophies : prev.clubTrophies,
      agencyId: newStats.agencyId !== undefined ? newStats.agencyId : prev.agencyId,
      traineeGrade: newStats.traineeGrade !== undefined ? newStats.traineeGrade : prev.traineeGrade,
      traineeProgress:
        newStats.traineeProgress !== undefined
          ? Math.min(100, Math.max(0, newStats.traineeProgress))
          : prev.traineeProgress,
      isDebutedIdol:
        newStats.isDebutedIdol !== undefined ? newStats.isDebutedIdol : prev.isDebutedIdol,
      vocalSkill:
        newStats.vocalSkill !== undefined ? Math.min(100, Math.max(0, newStats.vocalSkill)) : prev.vocalSkill,
      danceSkill:
        newStats.danceSkill !== undefined ? Math.min(100, Math.max(0, newStats.danceSkill)) : prev.danceSkill,
      rapSkill:
        newStats.rapSkill !== undefined ? Math.min(100, Math.max(0, newStats.rapSkill)) : prev.rapSkill,
      cameraSkill:
        newStats.cameraSkill !== undefined ? Math.min(100, Math.max(0, newStats.cameraSkill)) : prev.cameraSkill,
      darkIndex: newStats.darkIndex !== undefined ? Math.min(100, Math.max(0, newStats.darkIndex)) : prev.darkIndex,
      secretUnlocked: newStats.secretUnlocked !== undefined ? newStats.secretUnlocked : prev.secretUnlocked,
    }));
  };

  const applyDeltaStats = (delta: Partial<GameStats>) => {
    if (delta.isDebutedIdol && !stats.isDebutedIdol) {
      addFamilyMilestone(
        '正式通关选秀终审 C位出道成为 Idol',
        '爱豆荣耀',
        100000,
        '正式通过企划社高管终审考察，作为全新女团 C位荣耀出道！'
      );
    } else if (delta.traineeGrade && delta.traineeGrade.includes('A') && !stats.traineeGrade?.includes('A')) {
      addFamilyMilestone(
        '企划社月度评级晋升为 A班 ACE',
        '选秀晋升',
        50000,
        '在企划社残酷月末评级中夺得全场第一，顺利升入 A 班！'
      );
    }

    setStats((prev) => ({
      ...prev,
      mood: Math.min(100, Math.max(0, prev.mood + (delta.mood || 0))),
      stamina: Math.min(100, Math.max(0, prev.stamina + (delta.stamina || 0))),
      academics: Math.min(100, Math.max(0, prev.academics + (delta.academics || 0))),
      social: Math.min(100, Math.max(0, prev.social + (delta.social || 0))),
      appearance: Math.min(100, Math.max(0, prev.appearance + (delta.appearance || 0))),
      family: Math.min(100, Math.max(0, prev.family + (delta.family || 0))),
      coins: Math.max(0, prev.coins + (delta.coins || 0)),
      allowance: Math.max(10000, prev.allowance + (delta.allowance || 0)),
      snsFollowers: Math.max(0, prev.snsFollowers + (delta.snsFollowers || 0)),
      clubSkill: Math.min(100, Math.max(0, prev.clubSkill + (delta.clubSkill || 0))),
      clubTeamwork: Math.min(100, Math.max(0, (prev.clubTeamwork || 40) + (delta.clubTeamwork || 0))),
      clubStagePower: Math.min(100, Math.max(0, (prev.clubStagePower || 38) + (delta.clubStagePower || 0))),
      traineeProgress: Math.min(100, Math.max(0, prev.traineeProgress + (delta.traineeProgress || 0))),
      traineeGrade: delta.traineeGrade !== undefined ? delta.traineeGrade : prev.traineeGrade,
      isDebutedIdol: delta.isDebutedIdol !== undefined ? delta.isDebutedIdol : prev.isDebutedIdol,
      vocalSkill: Math.min(100, Math.max(0, (prev.vocalSkill || 34) + (delta.vocalSkill || 0))),
      danceSkill: Math.min(100, Math.max(0, (prev.danceSkill || 38) + (delta.danceSkill || 0))),
      rapSkill: Math.min(100, Math.max(0, (prev.rapSkill || 30) + (delta.rapSkill || 0))),
      cameraSkill: Math.min(100, Math.max(0, (prev.cameraSkill || 40) + (delta.cameraSkill || 0))),
      darkIndex: Math.min(100, Math.max(0, prev.darkIndex + (delta.darkIndex || 0))),
      secretUnlocked: delta.secretUnlocked !== undefined ? delta.secretUnlocked : prev.secretUnlocked,
    }));
  };

  const updateFavorability = (npcId: string, amount: number, romanceDelta = 4) => {
    if (!amount) return;
    setNpcs((prev) =>
      prev.map((n) => {
        if (n.id !== npcId) return n;
        const nextFav = Math.min(100, Math.max(0, n.favorability + amount));
        const nextRom = Math.min(100, Math.max(0, (n.romancePoints || 0) + romanceDelta));
        const potentialStage = computeRelationshipStage(nextFav, nextRom, n.orientation, n.role);

        // When relationship between user and npc would change, ask the user!
        if (potentialStage !== n.relationshipStage) {
          setTimeout(() => {
            setPendingRelationshipChange({
              npc: { ...n, favorability: nextFav, romancePoints: nextRom },
              currentStage: n.relationshipStage,
              targetStage: potentialStage,
              reason: `好感度提升至 ${nextFav}（心动值 ${nextRom}），触发关系阶段转变契机！`,
              favValue: nextFav,
              romanceValue: nextRom,
            });
          }, 400);
        }

        return {
          ...n,
          favorability: nextFav,
          romancePoints: nextRom,
          secretRevealed: nextFav >= 68 ? true : n.secretRevealed,
        };
      })
    );
  };

  const handleConfirmRelationshipStage = (npcId: string, newStage: RelationshipStage) => {
    const targetNpc = npcs.find((n) => n.id === npcId);
    setNpcs((prev) =>
      prev.map((n) => (n.id === npcId ? { ...n, relationshipStage: newStage } : n))
    );
    addGlobalMemory(
      `在青春的重要节点，与【${targetNpc?.chineseName || '同学'}】正式确立了【${newStage}】关系。`,
      'romance',
      npcId
    );
    if (targetNpc) {
      addNpcMemory(
        npcId,
        `[高${gradeYear}第${weekInYear}周] 彼此确认心意，正式成为【${newStage}】。`
      );
    }
    showNotification(`🎉 确认成功！你与 ${targetNpc?.chineseName} 正式确立了【${newStage}】关系！`);
    setPendingRelationshipChange(null);
  };

  const handleKeepCurrentRelationship = (npcId: string, currentStage: RelationshipStage) => {
    const targetNpc = npcs.find((n) => n.id === npcId);
    addGlobalMemory(
      `在好感度提升的契机下，与【${targetNpc?.chineseName || '同学'}】决定暂时维持珍贵的【${currentStage}】关系。`,
      'life',
      npcId
    );
    showNotification(`已维持与 ${targetNpc?.chineseName} 当前的【${currentStage}】关系。`);
    setPendingRelationshipChange(null);
  };

  const handleDeclineOrCoolRelationship = (npcId: string, currentStage: RelationshipStage) => {
    const targetNpc = npcs.find((n) => n.id === npcId);
    setNpcs((prev) =>
      prev.map((n) =>
        n.id === npcId
          ? { ...n, romancePoints: Math.max(0, (n.romancePoints || 0) - 5) }
          : n
      )
    );
    addGlobalMemory(
      `委婉婉拒了与【${targetNpc?.chineseName || '同学'}】的进一步关系推进，保持舒适距离。`,
      'life',
      npcId
    );
    showNotification(`已委婉保持与 ${targetNpc?.chineseName} 舒适的交往距离。`);
    setPendingRelationshipChange(null);
  };

  const handleRequestStageChangePrompt = (npc: NPCClassmate) => {
    const potentialStage = computeRelationshipStage(npc.favorability, npc.romancePoints, npc.orientation, npc.role);
    setPendingRelationshipChange({
      npc,
      currentStage: npc.relationshipStage,
      targetStage: potentialStage !== npc.relationshipStage ? potentialStage : (npc.relationshipStage === '恋人' ? '灵魂伴侣' : '挚友'),
      reason: `主动发起关系进阶评定 (好感: ${npc.favorability}, 心动: ${npc.romancePoints})`,
      favValue: npc.favorability,
      romanceValue: npc.romancePoints || 0,
    });
  };

  // Unified 3-Step AI Interactive Action Event Loop (Step 1: Loading -> Step 2: 2-3 AI Choices -> Step 3: Causal Follow-up & Settlement)
  const handleTriggerActionInteractiveEvent = async (params: {
    actionCategory: ActionEventCategory;
    actionName: string;
    locationName: string;
    baseStaminaCost: number;
    baseCoinsCost?: number;
    weeklyActionKey: string;
    featuredNpc?: NPCClassmate;
    extraContext?: string;
    onAfterConfirm?: (choice: ActionInteractiveChoice) => void;
  }) => {
    if (params.weeklyActionKey && weeklyCompletedActions.includes(params.weeklyActionKey)) {
      showNotification('本周已完成该项行动（下周重置）！');
      return;
    }
    if (params.baseStaminaCost > 0 && stats.stamina < params.baseStaminaCost) {
      showNotification(`体力不足 ${params.baseStaminaCost} 点，请先休息或去食堂补充体力！`);
      return;
    }
    if (params.baseCoinsCost && params.baseCoinsCost > 0 && stats.coins < params.baseCoinsCost) {
      showNotification(`韩元余额不足 ₩${params.baseCoinsCost.toLocaleString()}！`);
      return;
    }

    const validNpcs = npcs.length > 0 ? npcs : initialNPCs;
    const chosenNpc =
      params.featuredNpc ||
      validNpcs[Math.floor(Math.random() * validNpcs.length)] ||
      selectedNpc;

    // Step 1: Immediately open modal in loading state ("AI 正在推演现场剧情...")
    setChoiceResultData({
      title: `行动现场推演 · ${params.actionName}`,
      description: 'AI 正在推演现场剧情...',
      deltas: {},
      isLoading: true,
      loadingActionName: params.actionName,
      loadingLocationName: params.locationName,
      loadingNpcName: chosenNpc?.chineseName,
      onConfirm: () => setChoiceResultData(null),
    });

    // Step 2: Call aiService.ts (with timeout & local high-drama 3-choice fallback)
    const interactiveEvent = await generateActionInteractiveEvent({
      aiConfig,
      actionCategory: params.actionCategory,
      actionName: params.actionName,
      location: params.locationName,
      stats,
      gradeYear,
      weekInYear,
      seasonLabel: weekInfo.seasonName,
      protagonistName,
      featuredNpc: chosenNpc,
      triggeredEventHistory,
      extraContext: params.extraContext,
    });

    recordTriggeredEvent(undefined, interactiveEvent.title);

    // Step 2 -> Step 3: Present choices, then causal follow-up & confirm settlement
    setChoiceResultData({
      title: interactiveEvent.title,
      description: interactiveEvent.sceneDescription,
      deltas: {},
      isLoading: false,
      interactiveEvent,
      onConfirm: () => setChoiceResultData(null),
      onConfirmInteractiveChoice: (selectedChoice) => {
        const finalDeltas: Partial<GameStats> = { ...selectedChoice.deltas };

        // Ensure base stamina cost is accounted for if choice didn't already deduct or restore stamina
        if (params.baseStaminaCost > 0 && finalDeltas.stamina === undefined) {
          finalDeltas.stamina = -params.baseStaminaCost;
        }
        // Ensure base coins cost is accounted for if applicable
        if (params.baseCoinsCost && params.baseCoinsCost > 0) {
          finalDeltas.coins = (finalDeltas.coins || 0) - params.baseCoinsCost;
        }

        applyDeltaStats(finalDeltas);
        setLocation(params.locationName);

        const memStr =
          selectedChoice.memoryLog ||
          `[高${gradeYear}第${weekInYear}周·${params.locationName}] 在【${params.actionName}】中选择了「${selectedChoice.text}」。`;

        if (selectedChoice.favChange && selectedChoice.favChange.npcId) {
          updateFavorability(selectedChoice.favChange.npcId, selectedChoice.favChange.amount, 6);
          addNpcMemory(selectedChoice.favChange.npcId, memStr);
        } else {
          addGlobalMemory(memStr, 'life');
        }

        if (params.weeklyActionKey) {
          markWeeklyActionCompleted(params.weeklyActionKey);
        }

        if (params.onAfterConfirm) {
          params.onAfterConfirm(selectedChoice);
        }

        setChoiceResultData(null);
        showNotification(`✨ 已完成【${params.actionName}】抉择结算！`);

        // Automatically generate new AI Fan Bubble DMs after completing trainee stages, evaluations, or endorsements
        if (
          params.actionCategory === 'trainee_eval' ||
          params.actionCategory === 'trainee_practice' ||
          params.actionCategory === 'part_time_job' ||
          params.actionName.includes('舞台') ||
          params.actionName.includes('考核') ||
          params.actionName.includes('代言') ||
          params.actionName.includes('通告') ||
          params.actionName.includes('打歌')
        ) {
          refreshGlobalFanBubbleMessages(
            `刚完成「${params.actionName}」（${selectedChoice.text}），现场表现引发饭圈热议`
          );
        }
      },
    });
  };

  const handleExecuteMapAction = (action: MapActionItem, loc: MapLocationInfo) => {
    const targetNpc = action.favNpcId ? npcs.find((n) => n.id === action.favNpcId) : undefined;
    handleTriggerActionInteractiveEvent({
      actionCategory: 'map_explore',
      actionName: `${loc.name} · ${action.name}`,
      locationName: loc.name,
      baseStaminaCost: action.costStamina || 0,
      baseCoinsCost: action.costCoins || 0,
      weeklyActionKey: `weekly_map_${action.id}`,
      featuredNpc: targetNpc,
      extraContext: `${action.desc}（${action.successMessage || ''}）`,
    });
  };

  const handleSetCurrentLocation = (locName: string, bgUrl?: string) => {
    setLocation(locName);
    if (bgUrl) setCustomBgUrl(bgUrl);
    showNotification(`🗺️ 已抵达并设为主场景：【${locName}】！`);
  };

  const handleUpdateProtagonistAvatar = (newUrl: string) => {
    setProtagonistAvatarUrl(newUrl);
    showNotification(`🎭 主角立绘形象已更换！`);
  };

  const addGlobalMemory = (summary: string, category: MemoryEntry['category'] = 'life', npcId?: string) => {
    const newEntry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      dateStr: `${weekInfo.calendarYear}年${weekInfo.month}月 高${gradeYear}第${weekInYear <= 18 ? '上' : '下'}学期 第${weekInYear}周`,
      npcId,
      summary,
      category,
    };
    setMemories((prev) => [...prev.slice(-49), newEntry]);
  };

  const addNpcMemory = (npcId: string, memoryText: string) => {
    setNpcs((prev) =>
      prev.map((n) => {
        if (n.id !== npcId) return n;
        const existing = n.memories || [];
        return {
          ...n,
          memories: [...existing.slice(-14), memoryText],
        };
      })
    );
    addGlobalMemory(memoryText, 'chat', npcId);
  };

  const removeNpcMemory = (npcId: string, index: number) => {
    setNpcs((prev) =>
      prev.map((n) => {
        if (n.id !== npcId) return n;
        const existing = [...(n.memories || [])];
        existing.splice(index, 1);
        return { ...n, memories: existing };
      })
    );
  };

  const updateChatHistory = (npcId: string, messages: ChatMessage[]) => {
    setChatHistories((prev) => ({
      ...prev,
      [npcId]: messages.slice(-30),
    }));
  };

  // Add newly discovered AI NPC into discoveredNpcList & npcs & initialize KakaoTalk greeting
  const handleAddNewNPC = (newNpc: NPCClassmate) => {
    setDiscoveredNpcList((prev) => {
      if (prev.some((n) => n.id === newNpc.id || n.chineseName === newNpc.chineseName)) return prev;
      return [...prev, newNpc];
    });
    setNpcs((prev) => {
      if (prev.some((n) => n.id === newNpc.id || n.chineseName === newNpc.chineseName)) return prev;
      return [...prev, newNpc];
    });
    setChatHistories((prev) => ({
      ...prev,
      [newNpc.id]: [
        {
          sender: 'npc',
          text: `嗨秀妍！我是刚才在【${newNpc.encounterLocation || '首尔街头'}】偶遇的${newNpc.chineseName}（${newNpc.role}）~ 很高兴加上你的 KakaoTalk，以后常联系呀！`,
          timeLabel: `高${gradeYear}第${weekInYear}周`,
          actionDesc: `${newNpc.chineseName}发来了一张可爱的Kakao表情包，说话风格透着“${newNpc.speakingStyle || '自然亲切'}”的独特气息`,
          innerThought: `没想到今天出门能偶遇秀妍这样投缘的新朋友！`,
        },
      ],
    }));
    addGlobalMemory(
      `在【${newNpc.encounterLocation || '首尔街头'}】偶遇并结识了新朋友【${newNpc.chineseName}】（${newNpc.role}），交换了 KakaoTalk 联系方式。`,
      'life',
      newNpc.id
    );
  };

  // Trigger a standalone AI Dynamic NPC Encounter
  const handleTriggerRandomEncounter = async () => {
    showNotification('✨ 正在首尔街头触发命运偶遇...');
    try {
      const enc = await generateNewNPCEncounter({
        stats,
        weekInYear,
        gradeYear,
        location,
        aiConfig,
      });
      setActiveEncounter(enc);
    } catch (_e) {
      const fallback =
        DYNAMIC_NPC_FALLBACK_PRESETS[
          Math.floor(Math.random() * DYNAMIC_NPC_FALLBACK_PRESETS.length)
        ];
      setActiveEncounter(fallback);
    }
  };

  // Exam Settlement Helper
  const performExamSettlement = (
    examType: 'midterm' | 'final' | 'mock' | 'csat',
    currentAcademics: number,
    year: number,
    week: number
  ) => {
    const variance = Math.floor(Math.random() * 5) - 1;
    const score = Math.min(100, Math.max(35, currentAcademics + variance));
    const gradeRank =
      score >= 92 ? 1 : score >= 84 ? 2 : score >= 75 ? 3 : score >= 65 ? 4 : score >= 55 ? 5 : 6;
    const percentile = Math.min(99.9, Math.max(10, Number((score * 0.99).toFixed(1))));

    const allowanceDelta = gradeRank === 1 ? 8000 : gradeRank === 2 ? 4000 : gradeRank >= 5 ? -3000 : 1000;
    const familyDelta = gradeRank <= 2 ? 8 : gradeRank <= 3 ? 4 : -5;
    const scholarship = gradeRank === 1 ? 50000 : gradeRank === 2 ? 25000 : 0;

    const examTitles = {
      midterm: `高${year} · 期中考试`,
      final: `高${year} · 期末考试`,
      mock: `高${year} · 全国联合模考`,
      csat: `2027学年度 CSAT 韩国高考`,
    };

    const evaluation =
      gradeRank === 1
        ? `斩获全校1等级！奖学金+₩50,000，零花钱+${allowanceDelta}`
        : gradeRank === 2
        ? `取得2等级佳绩！奖学金+₩25,000，父母倍感欣慰`
        : gradeRank <= 4
        ? `发挥稳定(${gradeRank}等级)，继续努力冲击上位圈`
        : `成绩下滑(${gradeRank}等级)，父母有些担忧`;

    const newRecord: ExamRecord = {
      id: `ex_${Date.now()}`,
      year,
      week,
      examName: examTitles[examType],
      score,
      gradeRank,
      percentile,
      allowanceDelta,
      familyDelta,
      evaluation,
    };

    setExamRecords((prev) => [newRecord, ...prev]);
    applyDeltaStats({
      coins: scholarship,
      allowance: allowanceDelta,
      family: familyDelta,
      mood: gradeRank <= 2 ? 10 : -4,
    });

    if (gradeRank <= 2 || scholarship > 0) {
      addFamilyMilestone(
        `【${examTitles[examType]}】考出 ${score}分（${gradeRank}等级）`,
        '学业考捷报',
        scholarship > 0 ? scholarship + 20000 : 35000,
        `在【${examTitles[examType]}】中斩获${gradeRank}等级，名列全校前茅！`
      );
    }

    addGlobalMemory(`参加【${examTitles[examType]}】考出 ${score}分（${gradeRank}等级），${evaluation}。`, 'exam');

    return newRecord;
  };

  // Core Weekly Schedule Execution Handler (from WeeklySchedulerModal)
  const handleCompleteWeeklyExecution = (
    summary: WeeklyExecutionSummary,
    combinedDeltas: Partial<GameStats>
  ) => {
    // 1. Update active traits if any unlocked
    if (summary.unlockedTraits && summary.unlockedTraits.length > 0) {
      setStats((prev) => {
        const existingTraits = prev.activeTraits || [];
        const mergedTraits = [...existingTraits];
        summary.unlockedTraits.forEach((t: PlayerTrait) => {
          if (!mergedTraits.some((ex) => ex.id === t.id)) {
            mergedTraits.push(t);
          }
        });
        return {
          ...prev,
          activeTraits: mergedTraits,
        };
      });
    }

    // 2. Ensure stamina floor and apply housing/vehicle per-turn bonuses
    const curHousing = HOUSING_PRESETS.find((h) => h.id === playerAssets.currentHousingId);
    if (curHousing) {
      if (curHousing.staminaBonusPerTurn > 0) {
        combinedDeltas.stamina = (combinedDeltas.stamina || 0) + curHousing.staminaBonusPerTurn;
      }
      if (curHousing.moodBonusPerTurn > 0) {
        combinedDeltas.mood = (combinedDeltas.mood || 0) + curHousing.moodBonusPerTurn;
      }
      if (curHousing.darkIndexReductionPerTurn > 0) {
        combinedDeltas.darkIndex = (combinedDeltas.darkIndex || 0) - curHousing.darkIndexReductionPerTurn;
      }
    }

    if (stats.stamina + (combinedDeltas.stamina || 0) < 12) {
      combinedDeltas.stamina = 25;
      combinedDeltas.mood = (combinedDeltas.mood || 0) - 3;
    }

    const earnedCoins = combinedDeltas.coins || stats.allowance;
    const memText = `完成了高${gradeYear}第${weekInYear}周 7 天核心决策日程巡礼，收获零花钱 +₩${earnedCoins.toLocaleString()}。`;

    applyDeltaStats(combinedDeltas);
    addGlobalMemory(memText, 'life');

    let examNotice = '';
    if (weekInfo.milestoneExam) {
      const rec = performExamSettlement(
        weekInfo.milestoneExam.type,
        stats.academics + (combinedDeltas.academics || 0),
        gradeYear,
        weekInYear
      );
      examNotice = ` | 📢 ${rec.examName}: ${rec.score}分(${rec.gradeRank}等级)`;
    }

    let nextYear = gradeYear;
    let nextWeek = weekInYear + 1;
    if (nextWeek > 36) {
      if (gradeYear < 3) {
        nextYear = gradeYear + 1;
        nextWeek = 1;
        showNotification(`🌸 恭喜升入高${nextYear}学年（${2024 + nextYear}年3月）！新学期开始了！`);
      } else {
        setActiveModal('endings');
        showNotification('🎓 三年高中生涯圆满结束！迎来了首尔女子高中毕业典礼与结局结算！');
        return;
      }
    } else {
      showNotification(
        `已推进至高${nextYear}第${nextWeek}周！零花钱 +₩${earnedCoins.toLocaleString()}${examNotice}`
      );
    }

    setGradeYear(nextYear);
    setWeekInYear(nextWeek);
    setDayInWeek(0);
    // Reset all weekly action cooldown locks when advancing to the next week (week + 1)
    setWeeklyCompletedActions([]);
    setChoiceResultData(null);

    const nextWeekInfo = getWeekCalendarInfo(nextYear, nextWeek);
    // Automatically refresh AI Fan Bubble DMs when advancing to a new week
    refreshGlobalFanBubbleMessages(
      `顺利推进至高${nextYear}第${nextWeek}周，完成了充实的周间训练与学业行程${examNotice ? `（${examNotice.replace(' | 📢 ', '')}）` : ''}`,
      undefined,
      `高${nextYear}第${nextWeek}周`
    );
    // 100% prioritize AI real-time generation when advancing to the new week
    handleTriggerEvent(undefined, {
      year: nextYear,
      week: nextWeek,
      season: nextWeekInfo.season,
      seasonName: nextWeekInfo.seasonName,
    });
  };

  // Record event ID & title into triggeredEventHistory deduplication ledger
  const recordTriggeredEvent = (eventId?: string, eventTitle?: string) => {
    setTriggeredEventHistory((prev) => {
      const next = [...prev];
      if (eventId && !next.includes(eventId)) {
        next.push(eventId);
      }
      if (eventTitle && !next.includes(eventTitle)) {
        next.push(eventTitle);
      }
      return next.slice(-80);
    });
  };

  // 100% Prioritize Real-Time AI Event Generation (Fallback to deduplicated static pool ONLY if offline/error)
  const handleTriggerEvent = async (
    customPrompt?: string,
    overrideCtx?: {
      year: number;
      week: number;
      season: import('./types').SeasonType;
      seasonName: string;
    }
  ) => {
    const targetYear = overrideCtx?.year ?? gradeYear;
    const targetWeek = overrideCtx?.week ?? weekInYear;
    const targetSeason = overrideCtx?.season ?? weekInfo.season;
    const targetSeasonName = overrideCtx?.seasonName ?? weekInfo.seasonName;

    // Pick 1 real discovered/known NPC and their memories to anchor the event
    const validNpcs = npcs.length > 0 ? npcs : initialNPCs;
    const featuredNpc = validNpcs[Math.floor(Math.random() * validNpcs.length)] || validNpcs[0];

    setActiveEvent(null);
    setEventLoadingContext({
      year: targetYear,
      week: targetWeek,
      seasonName: targetSeasonName,
      location,
      npcName: featuredNpc.chineseName,
      npcRole: featuredNpc.role,
    });
    setIsGeneratingAIEvent(true);

    try {
      const recentMemStrings = memories.slice(-8).map((m) => `[${m.dateStr}] ${m.summary}`);
      const ev = await generateDynamicCampusEvent({
        aiConfig,
        stats,
        location,
        timeContext: `${2024 + targetYear}年 高${targetYear}第${targetWeek}周 (${targetSeasonName})`,
        npcs: validNpcs,
        recentMemories: recentMemStrings,
        gradeYear: targetYear,
        weekInYear: targetWeek,
        seasonLabel: targetSeasonName,
        triggeredEventHistory,
        featuredNpc,
        customPrompt,
      });
      recordTriggeredEvent(ev.id, ev.title);
      setActiveEvent(ev);
    } catch (_e) {
      // Final fallback ONLY when completely offline or API error, strictly filtering triggeredEventHistory
      const fallbackEv = pickWeeklyEvent({
        year: targetYear,
        week: targetWeek,
        season: targetSeason,
        stats,
        npcs: validNpcs,
        triggeredEventHistory,
      });
      recordTriggeredEvent(fallbackEv.id, fallbackEv.title);
      setActiveEvent(fallbackEv);
    } finally {
      setIsGeneratingAIEvent(false);
      setEventLoadingContext(null);
    }
  };

  const handleCycleLocation = () => {
    const keys = Object.keys(locationScenes);
    const idx = keys.indexOf(location);
    const nextLoc = keys[(idx + 1) % keys.length];
    setLocation(nextLoc);
    showNotification(`切换场景至【${nextLoc}】`);
  };

  const handleBuyItem = (itemId: string, price: number, bonus: number) => {
    const boughtItem = wardrobe.find((i) => i.id === itemId);
    const delta = {
      coins: -price,
      appearance: bonus,
      social: boughtItem?.socialBonus || 2,
    };
    const memText = boughtItem ? `购入并换上了新装扮【${boughtItem.name}】，外形与校园时尚度提升。` : '购入新衣物。';

    setChoiceResultData({
      title: '购物与衣橱穿搭结算说明',
      description: `你成功购买并换上了【${boughtItem?.name || '新衣物'}】，焕然一新！`,
      deltas: delta,
      memoryLog: memText,
      onConfirm: () => {
        updateStats({
          coins: stats.coins - price,
          appearance: Math.min(100, stats.appearance + bonus),
          social: Math.min(100, stats.social + (boughtItem?.socialBonus || 2)),
        });
        setWardrobe((prev) =>
          prev.map((item) => {
            if (item.id === itemId) return { ...item, owned: true, equipped: true };
            if (boughtItem && item.type === boughtItem.type) return { ...item, equipped: false };
            return item;
          })
        );
        if (boughtItem) {
          addGlobalMemory(memText, 'life');
        }
        setChoiceResultData(null);
      },
    });
  };

  const handleEquipItem = (itemId: string) => {
    const itemToEquip = wardrobe.find((i) => i.id === itemId);
    if (!itemToEquip) return;

    setWardrobe((prev) =>
      prev.map((item) => {
        if (item.type === itemToEquip.type) {
          return { ...item, equipped: item.id === itemId };
        }
        return item;
      })
    );
  };

  const handleResolveEvent = async (
    effect: Partial<GameStats>,
    favChange?: { npcId: string; amount: number },
    memoryLog?: string
  ) => {
    const targetNpc = favChange?.npcId ? npcs.find((n) => n.id === favChange.npcId) : undefined;
    const favArr = favChange
      ? [{ npcId: favChange.npcId, npcName: targetNpc?.chineseName || favChange.npcId, amount: favChange.amount }]
      : [];

    let desc = memoryLog || '你做出了抉择，校园生活因此留下了深刻的印记。';

    try {
      const res = await generateDynamicNarrative({
        aiConfig,
        context: {
          sceneType: 'choice_option',
          playerName: protagonistName,
          stats,
          choiceText: memoryLog || '做出抉择',
          npc: targetNpc,
          location,
          timeContext: timeContextStr,
        },
      });

      if (res.narrative) {
        desc = res.narrative;
        if (res.dialogue) desc += `\n\n💬【现场心境】: ${res.dialogue}`;
      }
    } catch (_e) {
      console.warn('动态选项结果生成降级：', _e);
    }

    setChoiceResultData({
      title: activeEvent?.title || '校园突发事件抉择说明',
      description: desc,
      deltas: effect,
      favorabilityChanges: favArr,
      memoryLog: memoryLog,
      onConfirm: () => {
        applyDeltaStats(effect);
        if (favChange && favChange.npcId) {
          updateFavorability(favChange.npcId, favChange.amount, 6);
          if (memoryLog) {
            addNpcMemory(favChange.npcId, `[高${gradeYear}第${weekInYear}周] ${memoryLog}`);
          }
        } else if (memoryLog) {
          addGlobalMemory(memoryLog, 'event');
        }
        setActiveEvent(null);
        setChoiceResultData(null);
      },
    });
  };

  const handleUnlockEnding = (endingId: string) => {
    setUnlockedEndingIds((prev) => (prev.includes(endingId) ? prev : [...prev, endingId]));
  };

  const handleResetNewGamePlus = () => {
    setStats(initialStats);
    setGradeYear(1);
    setWeekInYear(1);
    setDayInWeek(0);
    setNpcs(initialNPCs);
    setDiscoveredNpcList([]);
    setTriggeredEventHistory([]);
    setWeeklyCompletedActions([]);
    setMemories(initialMemories);
    setExamRecords([]);
    showNotification('✨ 已开启新周目（2025年高一第1学期·第1周），已解锁的13大结局图鉴与衣橱已保留！');
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-[#cfc7ba] font-sans relative">
      {/* Non-intrusive Warm Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#4a4338]/95 backdrop-blur-md border-2 border-[#e8dfc9] text-[#fffdf9] px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center gap-2 pointer-events-none max-w-[92vw]">
          <span className="text-[#f5d68e] shrink-0">✿</span>
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Top Header Status Bar (7 Core Attributes + SNS + 13 Endings) */}
      <Header
        stats={stats}
        gradeYear={gradeYear}
        aiConfig={aiConfig}
        unlockedEndingsCount={unlockedEndingIds.length}
        protagonistAvatarUrl={protagonistAvatarUrl}
        protagonistName={protagonistName}
        onOpenAISettings={() => setActiveModal('aiSettings')}
        onOpenWardrobe={() => setActiveModal('wardrobe')}
        onOpenSNS={() => setActiveModal('snsPhone')}
        onOpenEndings={() => setActiveModal('endings')}
        onOpenLifePath={() => setActiveModal('lifePath')}
        onOpenMap={() => setActiveModal('map')}
        onOpenPortraitWorkshop={() => {
          setPortraitWorkshopNpcId(undefined);
          setActiveModal('portraitWorkshop');
        }}
        onOpenCharacterCreation={() => setShowCharacterCreation(true)}
      />

      {/* Main Viewport: Left Vertical Sidebar (with Bond Characters Tab) + Center Korean High School Hallway */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <Sidebar
          onOpenModal={setActiveModal}
          activeModal={activeModal}
          npcs={npcs}
          selectedNpc={selectedNpc}
          onSelectNpc={(npc) => setSelectedNpcId(npc.id)}
          onOpenChat={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('chat');
          }}
          onOpenLunch={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('lunch');
          }}
          onOpenGift={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('gift');
          }}
          onOpenPortraitModal={(npcId) => {
            setPortraitWorkshopNpcId(npcId);
            setActiveModal('portraitWorkshop');
          }}
        />

        <MainHallway
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          stats={stats}
          location={location}
          customBgUrl={customBgUrl}
          npcs={npcs}
          selectedNpc={selectedNpc}
          isGeneratingAIEvent={isGeneratingAIEvent}
          totalMemoriesCount={memories.length}
          onSelectNpc={(npc) => setSelectedNpcId(npc.id)}
          onOpenWeeklyScheduler={() => setActiveModal('weeklyTurn')}
          onOpenClubModal={() => setActiveModal('club')}
          onOpenTraineeModal={() => setActiveModal('trainee')}
          onTriggerRandomPoolEvent={() => handleTriggerEvent()}
          onOpenForum={() => setActiveModal('forum')}
          onOpenMemoryBook={() => setActiveModal('timeManagement')}
          onOpenChat={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('chat');
          }}
          onOpenLunch={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('lunch');
          }}
          onOpenGift={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('gift');
          }}
          onCycleLocation={handleCycleLocation}
          onOpenMap={() => setActiveModal('map')}
          onOpenPortraitWorkshop={() => {
            setPortraitWorkshopNpcId(undefined);
            setActiveModal('portraitWorkshop');
          }}
          onOpenRelationships={() => setActiveModal('relationships')}
          onOpenDestinyCard={() => setActiveModal('destinyCard')}
        />
      </div>

      {/* 0. Initial Character Creation Modal (Enrollment) */}
      {showCharacterCreation && (
        <CharacterCreationModal
          onConfirm={(characterData) => {
            setProtagonistName(characterData.name);
            localStorage.setItem('seoul_heroine_name', characterData.name);
            localStorage.setItem('seoul_heroine_created', 'true');
            updateStats({
              ...characterData.stats,
              specialIdentity: characterData.backgroundName,
            });
            addGlobalMemory(
              `在首尔女子高中完成了新生入学建档，名字：【${characterData.name}】，家世：【${characterData.backgroundName}】，MBTI：${characterData.mbti}`,
              'life'
            );
            showNotification(`✨ 角色【${characterData.name}】入学建档成功！身份背景：${characterData.backgroundName}`);
            setShowCharacterCreation(false);
          }}
        />
      )}

      {/* 1. Weekly Action Turn-Based Scheduler Modal */}
      {activeModal === 'weeklyTurn' && (
        <WeeklySchedulerModal
          onClose={() => setActiveModal(null)}
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          stats={stats}
          npcs={npcs}
          triggeredEventHistory={triggeredEventHistory}
          onRecordTriggeredEvent={recordTriggeredEvent}
          aiConfig={aiConfig}
          onCompleteWeeklyExecution={handleCompleteWeeklyExecution}
          onOpenTimeSkipSummary={(targetYr, targetWk) => {
            setTimeSkipTarget({ year: targetYr, week: targetWk });
            setActiveModal('timeSkipSummary');
          }}
          onAddNewNPC={handleAddNewNPC}
          onNotify={showNotification}
          onJumpToWeek={(targetYr, targetWk, label) => {
            setGradeYear(targetYr);
            setWeekInYear(targetWk);
            setDayInWeek(0);
            setWeeklyCompletedActions([]);
            setActiveModal(null);
            showNotification(label);
          }}
        />
      )}

      {/* 1.5 Time Skip x4 Weeks Summary Journal Modal */}
      {activeModal === 'timeSkipSummary' && timeSkipTarget && (
        <TimeSkipSummaryModal
          onClose={() => {
            setActiveModal(null);
            setTimeSkipTarget(null);
          }}
          startWeekLabel={`高${gradeYear}第${weekInYear}周`}
          endWeekLabel={`高${timeSkipTarget.year}第${timeSkipTarget.week}周`}
          targetYear={timeSkipTarget.year}
          targetWeek={timeSkipTarget.week}
          stats={stats}
          protagonistName={protagonistName}
          aiConfig={aiConfig}
          onConfirmJump={(deltaStats, memoirText) => {
            applyDeltaStats(deltaStats);
            setGradeYear(timeSkipTarget.year);
            setWeekInYear(timeSkipTarget.week);
            setDayInWeek(0);
            setWeeklyCompletedActions([]);
            addGlobalMemory(
              `在【高${gradeYear}第${weekInYear}周】至【高${timeSkipTarget.year}第${timeSkipTarget.week}周】完成四周期刊极速跃迁：${memoirText.slice(0, 45)}...`,
              'life'
            );
            showNotification(`✨ 4 周极速跃迁圆满完成！正式踏入高${timeSkipTarget.year}第${timeSkipTarget.week}周新征程！`);
            setActiveModal(null);
            setTimeSkipTarget(null);
          }}
        />
      )}

      {/* 2. Timetable & Korean Academic Calendar Modal */}
      {activeModal === 'timetable' && (
        <TimetableModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          currentDay={currentDayCount}
          clockMinutes={clockMinutes}
          weeklyCompletedActions={weeklyCompletedActions}
          onAttendClass={(subject) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: 'class_study',
              actionName: `课堂专修：${subject}`,
              locationName: '首尔女高 · 1-1班教室',
              baseStaminaCost: 10,
              weeklyActionKey: `weekly_class_${subject}`,
            });
          }}
        />
      )}

      {/* 3. Club Activities, Sudden Incidents & 3-Stage Competition Theater Modal */}
      {activeModal === 'club' && (
        <ClubModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          weeklyCompletedActions={weeklyCompletedActions}
          onMarkWeeklyActionDone={markWeeklyActionCompleted}
          onTriggerActionEvent={(params: any) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: params.actionCategory,
              actionName: params.actionName,
              locationName: params.location || '社团活动室',
              baseStaminaCost: 10,
              weeklyActionKey: params.weeklyActionKey,
              extraContext: params.memoryLog,
            });
            if (params.onExtraComplete) params.onExtraComplete();
          }}
          onUpdateStats={(newSt: Partial<GameStats>) => updateStats(newSt)}
          onUpdateFavorability={(npcId, amt) => updateFavorability(npcId, amt, 5)}
          onOpenTraineeModal={() => setActiveModal('trainee')}
          onNotify={(msg) => {
            addGlobalMemory(msg, 'life');
            showNotification(msg);
          }}
        />
      )}

      {/* 3B. Idol Trainee Agency, Monthly Evaluation, Debut Combat & AI Survival Show Modal */}
      {activeModal === 'trainee' && (
        <TraineeModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          aiConfig={aiConfig}
          timeContext={timeContextStr}
          lastJobTurnKey={lastJobTurnKey}
          currentTurnKey={currentTurnKey}
          weeklyCompletedActions={weeklyCompletedActions}
          onMarkWeeklyActionDone={markWeeklyActionCompleted}
          onTriggerActionEvent={handleTriggerActionInteractiveEvent}
          onRecordJobDone={handleRecordJobDone}
          onUpdateStats={(newSt) => updateStats(newSt)}
          onNotify={(msg) => {
            addGlobalMemory(msg, 'life');
            showNotification(msg);
          }}
        />
      )}

      {/* 4. Part-Time Jobs & Extracurricular Modal */}
      {activeModal === 'extracurricular' && (
        <ExtracurricularModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          aiConfig={aiConfig}
          lastJobTurnKey={lastJobTurnKey}
          currentTurnKey={currentTurnKey}
          weeklyCompletedActions={weeklyCompletedActions}
          onRecordJobDone={handleRecordJobDone}
          onTriggerActionEvent={(params: any) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: params.actionCategory,
              actionName: params.actionName,
              locationName: params.location || '兼职地点',
              baseStaminaCost: 10,
              weeklyActionKey: params.weeklyActionKey,
              extraContext: params.memoryLog,
            });
            if (params.onExtraComplete) params.onExtraComplete();
          }}
          onUpdateStats={(newSt: Partial<GameStats>) => updateStats(newSt)}
          onNotify={showNotification}
          onShowResultModal={(data: any) => {
            setChoiceResultData({
              title: data.title,
              description: data.description,
              deltas: data.deltas,
              memoryLog: data.memoryLog,
              onConfirm: () => {
                updateStats(data.deltas);
                addGlobalMemory(data.memoryLog, 'life');
                setChoiceResultData(null);
                setActiveModal(null);
              },
            });
          }}
        />
      )}

      {/* 5. Omnidirectional Relationships & 7 NPC Profiles Modal */}
      {activeModal === 'relationships' && (
        <RelationshipModal
          onClose={() => setActiveModal(null)}
          npcs={npcs}
          clockMinutes={clockMinutes}
          weekdayIndex={dayInWeek}
          weeklyCompletedActions={weeklyCompletedActions}
          onOpenChat={(n) => {
            setTargetNpcId(n.id);
            setActiveModal('chat');
          }}
          onOpenLunch={(n) => {
            setTargetNpcId(n.id);
            setActiveModal('lunch');
          }}
          onOpenGift={(n) => {
            setTargetNpcId(n.id);
            setActiveModal('gift');
          }}
          onAdvanceStoryline={(n) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: 'npc_date',
              actionName: `与【${n.chineseName}】推进专属羁绊故事线`,
              locationName: location,
              baseStaminaCost: 8,
              weeklyActionKey: `weekly_storyline_${n.id}`,
              featuredNpc: n,
              extraContext: `倾听${n.chineseName}（${n.role}）内心深处的秘密与梦想，羁绊阶段：${n.relationshipStage}`,
            });
          }}
          onApplyStylePack={handleApplyAvatarStylePack}
          onUpdateNpcAvatar={handleUpdateNpcAvatar}
          onOpenPortraitModal={(npcId) => {
            setPortraitWorkshopNpcId(npcId);
            setActiveModal('portraitWorkshop');
          }}
          onRequestStageChangePrompt={handleRequestStageChangePrompt}
          onTriggerRandomEncounter={handleTriggerRandomEncounter}
        />
      )}

      {/* 6. 5-Category Wardrobe & Makeup Modal */}
      {activeModal === 'wardrobe' && (
        <WardrobeModal
          onClose={() => setActiveModal(null)}
          wardrobe={wardrobe}
          stats={stats}
          currentAvatarUrl={protagonistAvatarUrl}
          onChangeAvatar={setProtagonistAvatarUrl}
          onApplyStylePack={handleApplyAvatarStylePack}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
          onNotify={showNotification}
        />
      )}

      {/* 7. Academic Grades, CSAT & Family Relationship Modal */}
      {activeModal === 'grades' && (
        <GradesModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          aiConfig={aiConfig}
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          weeklyCompletedActions={weeklyCompletedActions}
          onRecordExamDone={handleRecordExamDone}
          onTriggerActionEvent={(params: any) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: params.actionCategory,
              actionName: params.actionName,
              locationName: params.location || '首尔女高',
              baseStaminaCost: 10,
              weeklyActionKey: params.weeklyActionKey,
              extraContext: params.memoryLog,
              onAfterConfirm:
                params.weeklyActionKey === 'weekly_mock_exam'
                  ? () => {
                      performExamSettlement('mock', stats.academics + 3, gradeYear, weekInYear);
                    }
                  : undefined,
            });
            if (params.onExtraComplete) params.onExtraComplete();
          }}
          examRecords={examRecords}
          onTakeExam={(examType) => {
            performExamSettlement(examType, stats.academics + 3, gradeYear, weekInYear);
          }}
          onNotify={(msg) => {
            addGlobalMemory(msg, 'family');
            showNotification(msg);
          }}
        />
      )}

      {/* 8. School Facilities Modal */}
      {activeModal === 'facilities' && (
        <FacilitiesModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          weeklyCompletedActions={weeklyCompletedActions}
          onExecuteFacilityAction={(params: any) => {
            handleTriggerActionInteractiveEvent({
              actionCategory: 'facility',
              actionName: params.facilityName,
              locationName: params.locName,
              baseStaminaCost: params.minStamina || 0,
              baseCoinsCost: params.minCoins || 0,
              weeklyActionKey: params.actionKey,
              extraContext: params.memoryLog,
            });
          }}
          onNotify={(msg) => {
            addGlobalMemory(msg, 'life');
            showNotification(msg);
          }}
        />
      )}

      {/* 9. Memory Book & Secret Diary Modal */}
      {(activeModal === 'timeManagement' || activeModal === 'diary') && (
        <DiaryModal
          onClose={() => setActiveModal(null)}
          currentDateStr={`高${gradeYear}·第${weekInYear <= 18 ? '上' : '下'}学期·第${weekInYear}周`}
          diaryEntries={diaryEntries}
          onSaveEntry={handleSaveDiaryEntry}
          onDeleteEntry={handleDeleteDiaryEntry}
        />
      )}

      {/* 10. Smartphone: Stargram SNS & KakaoTalk Modal */}
      {activeModal === 'snsPhone' && (
        <SNSPhoneModal
          onClose={() => {
            setActiveModal(null);
            setSnsInitialTab('desktop');
          }}
          stats={stats}
          npcs={npcs}
          snsPosts={snsPosts}
          weekLabel={`高${gradeYear}·第${weekInYear <= 18 ? '上' : '下'}学期·第${weekInYear}周`}
          clockStr={`${String(Math.floor(clockMinutes / 60)).padStart(2, '0')}:${String(clockMinutes % 60).padStart(2, '0')}`}
          location={location}
          aiConfig={aiConfig}
          chatHistories={chatHistories}
          onUpdateChatHistory={updateChatHistory}
          fanBubbleThreads={fanBubbleThreads}
          onUpdateFanBubbleThreads={setFanBubbleThreads}
          recentScheduleSummary={recentScheduleSummary}
          protagonistName={protagonistName}
          protagonistAvatar={protagonistAvatarUrl}
          onChangeProtagonistAvatar={setProtagonistAvatarUrl}
          onUpdateFavorability={(npcId, delta) => updateFavorability(npcId, delta)}
          onAppendNpcMemory={addNpcMemory}
          onUpdateStats={applyDeltaStats}
          lastJobTurnKey={lastJobTurnKey}
          currentTurnKey={currentTurnKey}
          weeklyCompletedActions={weeklyCompletedActions}
          onRecordJobDone={handleRecordJobDone}
          onTriggerActionEvent={handleTriggerActionInteractiveEvent}
          onPublishPost={(newPost, delta) => {
            setSnsPosts((prev) => [newPost, ...prev]);
            applyDeltaStats(delta);
            addGlobalMemory(`在Stargram发布了动态「${newPost.tag}」，涨粉 +${newPost.followerGain}。`, 'life');
          }}
          onOpenNpcChat={(npc) => {
            setTargetNpcId(npc.id);
            setActiveModal('chat');
          }}
          onOpenForum={() => setActiveModal('forum')}
          onNotify={showNotification}
          initialTab={snsInitialTab}
          onTriggerRandomEncounter={handleTriggerRandomEncounter}
          onOpenAssetsModal={() => setActiveModal('assets')}
          onOpenFamilyModal={() => setActiveModal('family')}
        />
      )}

      {/* 11. 13+ Endings Gallery & Graduation Settlement Modal */}
      {activeModal === 'endings' && (
        <EndingsModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          npcs={npcs}
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          unlockedEndingIds={unlockedEndingIds}
          onUnlockEnding={handleUnlockEnding}
          onResetNewGamePlus={handleResetNewGamePlus}
          onOpenLifePath={(path) => {
            setActiveModal('lifePath');
            if (path === 'university' || path === 'chaebol') {
              showNotification('✨ 豪门名流与职场精英支线正在加急制作中！当前版本请先沉浸体验首尔女高、练习生出道及 Bubble 互动，敬请期待后续更新！');
            } else if (path === 'idol') {
              showNotification('👑 已进入【K-Pop 顶流爱豆】篇章！');
            }
          }}
        />
      )}

      {/* 11.5 Post-High School Life Path Chapter Modal */}
      {activeModal === 'lifePath' && (
        <LifePathModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          npcs={npcs}
          onOpenEndings={() => setActiveModal('endings')}
          onNotify={showNotification}
        />
      )}

      {/* 11.8 Destiny Card Gacha Modal */}
      {activeModal === 'destinyCard' && (
        <DestinyCardModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          onUpdateStats={updateStats}
          onAddMemory={addGlobalMemory}
          onNotify={showNotification}
        />
      )}

      {/* 11.9 Assets Center Modal */}
      {activeModal === 'assets' && (
        <AssetsModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          assets={playerAssets}
          onBuyHousing={handleBuyHousing}
          onSelectHousing={handleSelectHousing}
          onBuyVehicle={handleBuyVehicle}
          onSelectVehicle={handleSelectVehicle}
          onNotify={showNotification}
        />
      )}

      {/* 11.95 Family Emotional Bond Modal */}
      {activeModal === 'family' && (
        <FamilyModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          protagonistName={protagonistName}
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          unreportedMilestones={unreportedMilestones}
          onClaimMilestone={handleClaimMilestone}
          onUpdateStats={updateStats}
          onAddMemory={(summary, cat) => addGlobalMemory(summary, cat)}
          onNotify={showNotification}
        />
      )}

      {/* 12. LocalStorage Save/Load Modal */}
      {activeModal === 'saveload' && (
        <SaveLoadModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          currentDay={currentDayCount}
          clockMinutes={clockMinutes}
          npcs={npcs}
          discoveredNpcList={discoveredNpcList}
          triggeredEventHistory={triggeredEventHistory}
          weeklyCompletedActions={weeklyCompletedActions}
          wardrobe={wardrobe}
          memories={memories}
          chatHistories={chatHistories}
          onLoadGame={(data) => {
            setStats({ ...initialStats, ...data.stats });
            const loadedDay = data.day || 1;
            setGradeYear(Math.min(3, Math.floor((loadedDay - 1) / 36) + 1));
            setWeekInYear(((loadedDay - 1) % 36) + 1);
            setDayInWeek(0);
            if (typeof data.clockMinutes === 'number') setClockMinutes(data.clockMinutes);
            const loadedDiscovered = Array.isArray(data.discoveredNpcList)
              ? data.discoveredNpcList
              : (data.npcs || []).filter((n) => n.isGenerated);
            setDiscoveredNpcList(loadedDiscovered);
            if (Array.isArray(data.triggeredEventHistory)) {
              setTriggeredEventHistory(data.triggeredEventHistory);
            }
            if (Array.isArray(data.weeklyCompletedActions)) {
              setWeeklyCompletedActions(data.weeklyCompletedActions);
            } else {
              setWeeklyCompletedActions([]);
            }
            const mergedNpcs = [...(data.npcs || initialNPCs)];
            loadedDiscovered.forEach((d) => {
              if (!mergedNpcs.some((ex) => ex.id === d.id)) {
                mergedNpcs.push(d);
              }
            });
            setNpcs(mergedNpcs);
            setWardrobe(data.wardrobe);
            if (data.memories) setMemories(data.memories);
            if (data.chatHistories) setChatHistories(data.chatHistories);
          }}
          onNotify={showNotification}
        />
      )}

      {/* 13. AI Settings & Custom API Connector Modal */}
      {activeModal === 'aiSettings' && (
        <AISettingsModal
          onClose={() => setActiveModal(null)}
          aiConfig={aiConfig}
          customBgUrl={customBgUrl}
          onUpdateAIConfig={setAiConfig}
          onUpdateCustomBg={setCustomBgUrl}
          onTriggerCustomAIEvent={(customPrompt) => handleTriggerEvent(customPrompt)}
          onNotify={showNotification}
        />
      )}

      {/* 14. Campus Bamboo Forest Anonymous Wall Modal */}
      {activeModal === 'forum' && (
        <ForumModal
          onClose={() => setActiveModal(null)}
          aiConfig={aiConfig}
          stats={stats}
          timeContext={timeContextStr}
          recentMemories={memories.slice(-8).map((m) => m.summary)}
          onUpdateStats={updateStats}
          onAddGlobalMemory={(summary) => addGlobalMemory(summary, 'event')}
          onNotify={showNotification}
        />
      )}

      {/* 15. KakaoTalk / Interactive Classmate Chat, Gift & Date Modals */}
      {activeModal === 'chat' && (
        <ChatModal
          npc={targetNpc}
          onClose={() => setActiveModal(null)}
          stats={stats}
          aiConfig={aiConfig}
          location={location}
          timeContext={timeContextStr}
          clockStr={`高${gradeYear}·第${weekInYear <= 18 ? '上' : '下'}学期·第${weekInYear}周`}
          chatHistory={chatHistories[targetNpc.id] || []}
          onUpdateChatHistory={updateChatHistory}
          onAddNpcMemory={addNpcMemory}
          onRemoveNpcMemory={removeNpcMemory}
          onUpdateNpcKeywords={handleUpdateNpcKeywords}
          onUpdateStats={updateStats}
          onUpdateFavorability={(id, amt) => updateFavorability(id, amt, 5)}
          onAdvanceMinutes={() => {}}
          onNotify={showNotification}
        />
      )}
      {activeModal === 'gift' && (
        <GiftModal
          npc={targetNpc}
          onClose={() => setActiveModal(null)}
          stats={stats}
          onUpdateStats={updateStats}
          onUpdateFavorability={(id, amt) => updateFavorability(id, amt, 8)}
          onRecordGiftMemory={(npcId, giftName, fav) => {
            addNpcMemory(
              npcId,
              `[高${gradeYear}第${weekInYear}周] 秀妍送了我一份【${giftName}】（好感+${fav}%），我很喜欢。`
            );
          }}
          onNotify={showNotification}
        />
      )}
      {activeModal === 'lunch' && (
        <LunchModal
          npc={targetNpc}
          onClose={() => setActiveModal(null)}
          stats={stats}
          weeklyCompletedActions={weeklyCompletedActions}
          onExecuteDateInvite={(p: any) => {
            setActiveModal(null);
            handleTriggerActionInteractiveEvent({
              actionCategory: 'npc_date',
              actionName: `约会用餐：${p.spotName}`,
              locationName: '首尔街头约会地点',
              baseStaminaCost: 0,
              baseCoinsCost: p.price,
              weeklyActionKey: `weekly_npc_date_${p.npc.id}`,
              featuredNpc: p.npc,
              extraContext: `与${p.npc.chineseName}一起约会享用了【${p.spotName}】`,
            });
          }}
          onNotify={showNotification}
        />
      )}

      {/* 16. School & Seoul City Exploration Map Modal (12 Locations & 40+ Actions) */}
      {activeModal === 'map' && (
        <MapModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          npcs={npcs}
          currentLocationName={location}
          weeklyCompletedActions={weeklyCompletedActions}
          onSetCurrentLocation={handleSetCurrentLocation}
          onExecuteMapAction={handleExecuteMapAction}
          onOpenPortraitModal={(npcId) => {
            setPortraitWorkshopNpcId(npcId);
            setActiveModal('portraitWorkshop');
          }}
        />
      )}

      {/* 17. Character & NPC Portrait Customization Workshop Modal */}
      {activeModal === 'portraitWorkshop' && (
        <NPCPortraitModal
          onClose={() => setActiveModal(null)}
          npcs={npcs}
          initialNpcId={portraitWorkshopNpcId}
          protagonistAvatarUrl={protagonistAvatarUrl}
          onUpdateNpcAvatar={handleUpdateNpcAvatar}
          onUpdateProtagonistAvatar={handleUpdateProtagonistAvatar}
        />
      )}

      {/* 18. Relationship Stage Change Interactive Decision Modal (Always asks user!) */}
      {pendingRelationshipChange && (
        <RelationshipChangePromptModal
          promptData={pendingRelationshipChange}
          onConfirmAdvance={handleConfirmRelationshipStage}
          onKeepCurrent={handleKeepCurrentRelationship}
          onDeclineOrCool={handleDeclineOrCoolRelationship}
        />
      )}

      {/* 18.5 Real-Time AI Fate Deduction / Event Generating Loading Modal */}
      {isGeneratingAIEvent && !activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
          <div className="bg-[#f5f0e6] border-2 border-[#d8ccb8] rounded-3xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#57534b] to-[#8c6d3b] flex items-center justify-center text-[#f5d68e] shadow-md animate-pulse">
              <span className="text-2xl">🔮</span>
            </div>
            <div className="space-y-1.5">
              <div className="inline-block text-[10px] font-bold bg-[#e8decb] text-[#5c4f3d] px-2.5 py-0.5 rounded-full">
                高{eventLoadingContext?.year ?? gradeYear}第{eventLoadingContext?.week ?? weekInYear}周 ·{' '}
                {eventLoadingContext?.seasonName ?? weekInfo.seasonName} · {eventLoadingContext?.location ?? location}
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#2b2620] tracking-wide">
                命运推演中 / 剧情生成中...
              </h3>
              <p className="text-xs text-[#63584a] leading-relaxed">
                AI 正在结合你当前的属性极值、所在场景【{eventLoadingContext?.location ?? location}】以及与【
                {eventLoadingContext?.npcName ?? selectedNpc.chineseName}（{eventLoadingContext?.npcRole ?? selectedNpc.role}
                ）】的过往共同记忆，现场构思独一无二的突发事件...
              </p>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-[#7a6035]">
              <span className="w-2 h-2 rounded-full bg-[#8c6d3b] animate-ping" />
              <span>已过滤 {triggeredEventHistory.slice(-10).length} 条近期历史事件 · 拒绝重复桥段</span>
            </div>
          </div>
        </div>
      )}

      {activeEvent && <EventModal event={activeEvent} onResolve={handleResolveEvent} />}

      {/* 19. Choice / Action Result Popup Explanation Modal */}
      {choiceResultData && <ChoiceResultModal data={choiceResultData} />}

      {/* 20. Standalone AI Dynamic NPC Encounter Modal */}
      {activeEncounter && (
        <EncounterModal
          encounter={activeEncounter}
          onConfirmFriend={() => {
            const newNpc = convertEncounterToNPC(activeEncounter, gradeYear, weekInYear);
            handleAddNewNPC(newNpc);
            applyDeltaStats({ social: 5, mood: 6 });
            showNotification(`✨ 结识了新朋友【${newNpc.chineseName}】！已加入手机通讯录与全向羁绊列表！`);
            setActiveEncounter(null);
          }}
          onConfirmFriendAndOpenPhone={() => {
            const newNpc = convertEncounterToNPC(activeEncounter, gradeYear, weekInYear);
            handleAddNewNPC(newNpc);
            applyDeltaStats({ social: 5, mood: 6 });
            setActiveEncounter(null);
            setSnsInitialTab('kakao');
            setActiveModal('snsPhone');
            showNotification(`💬 已添加【${newNpc.chineseName}】至 KakaoTalk 通讯录！点击即可开启实时 AI 聊天！`);
          }}
          onIgnore={() => {
            showNotification(`👋 与【${activeEncounter.name}】微笑点头，擦肩而过。`);
            setActiveEncounter(null);
          }}
          onClose={() => setActiveEncounter(null)}
        />
      )}
    </div>
  );
}
