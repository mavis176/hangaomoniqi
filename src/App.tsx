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
} from './types';
import {
  initialStats,
  initialNPCs,
  initialWardrobe,
  initialMemories,
  defaultAIConfig,
  locationScenes,
  getWeekCalendarInfo,
  computeRelationshipStage,
  WEEKDAYS,
} from './data/gameData';
import { pickWeeklyEvent } from './data/eventsPool';
import {
  AVATAR_SOOYEON_DEFAULT,
  NPC_KOREAN_AVATARS_MAP,
  AVATAR_STYLE_PACKS,
} from './data/koreanAvatars';
import { generateDynamicCampusEvent } from './services/aiService';

import { WeeklySchedulerModal } from './components/modals/WeeklySchedulerModal';
import { TimetableModal } from './components/modals/TimetableModal';
import { ClubModal } from './components/modals/ClubModal';
import { TraineeModal } from './components/modals/TraineeModal';
import { ExtracurricularModal } from './components/modals/ExtracurricularModal';
import { RelationshipModal } from './components/modals/RelationshipModal';
import { WardrobeModal } from './components/modals/WardrobeModal';
import { GradesModal } from './components/modals/GradesModal';
import { FacilitiesModal } from './components/modals/FacilitiesModal';
import { TimeManagementModal } from './components/modals/TimeManagementModal';
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
import { MapActionItem, MapLocationInfo } from './data/mapData';

export default function App() {
  const [stats, setStats] = useState<GameStats>(initialStats);
  // 2025-2027 3-Year Academic System (Grade 1-3, Week 1-36 per year, Day 0-6 per week = 756 Days!)
  const [gradeYear, setGradeYear] = useState<number>(1);
  const [weekInYear, setWeekInYear] = useState<number>(1);
  const [dayInWeek, setDayInWeek] = useState<number>(0); // 0=周一 .. 6=周日
  const [clockMinutes, setClockMinutes] = useState<number>(615);
  const [location, setLocation] = useState<string>('2楼走廊');
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [protagonistAvatarUrl, setProtagonistAvatarUrl] = useState<string>(AVATAR_SOOYEON_DEFAULT);

  const [npcs, setNpcs] = useState<NPCClassmate[]>(initialNPCs);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(initialWardrobe);
  const [memories, setMemories] = useState<MemoryEntry[]>(initialMemories);
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([]);
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

  const [selectedNpcId, setSelectedNpcId] = useState<string>(initialNPCs[0].id);
  const [aiConfig, setAiConfig] = useState<AIConfig>(defaultAIConfig);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [targetNpcId, setTargetNpcId] = useState<string>(initialNPCs[0].id);
  const [portraitWorkshopNpcId, setPortraitWorkshopNpcId] = useState<string | undefined>(undefined);
  const [pendingRelationshipChange, setPendingRelationshipChange] =
    useState<RelationshipChangePromptData | null>(null);
  const [isGeneratingAIEvent, setIsGeneratingAIEvent] = useState<boolean>(false);
  const [choiceResultData, setChoiceResultData] = useState<ChoiceResultData | null>(null);
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
          const migratedNpcs = parsed.npcs.map((n: NPCClassmate) => {
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
          setNpcs(migratedNpcs);
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
  const weekdayLabel = WEEKDAYS[dayInWeek % 7] || '周一';
  const timeContextStr = `${weekInfo.calendarYear}年${weekInfo.month}月 第${weekInfo.weekOfMonth}周 ${weekdayLabel} (高${gradeYear}·第${weekInYear}周 · ${weekInfo.seasonName})`;

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

  const handleExecuteMapAction = (action: MapActionItem, loc: MapLocationInfo) => {
    const deltaEffect = { ...action.effect };
    if (action.costCoins) {
      deltaEffect.coins = (deltaEffect.coins || 0) - action.costCoins;
    }
    if (action.costStamina) {
      deltaEffect.stamina = (deltaEffect.stamina || 0) - action.costStamina;
    }

    const targetNpc = action.favNpcId ? npcs.find((n) => n.id === action.favNpcId) : undefined;
    const favArr = action.favNpcId && action.favDelta
      ? [{ npcId: action.favNpcId, npcName: targetNpc?.chineseName || action.favNpcId, amount: action.favDelta }]
      : [];

    const memText = `[高${gradeYear}第${weekInYear}周·${loc.name}] ${action.memoryLog}`;

    setChoiceResultData({
      title: `地图行动结算说明 · 【${loc.name} - ${action.name}】`,
      description: action.successMessage || `你在【${loc.name}】进行了【${action.name}】，度过了一段充实的时光。`,
      deltas: deltaEffect,
      favorabilityChanges: favArr,
      memoryLog: memText,
      onConfirm: () => {
        applyDeltaStats(deltaEffect);
        if (action.favNpcId && action.favDelta) {
          updateFavorability(action.favNpcId, action.favDelta, action.romanceDelta || 3);
          addNpcMemory(action.favNpcId, memText);
        } else {
          addGlobalMemory(memText, 'life');
        }
        setChoiceResultData(null);
      },
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
      dateStr: `${weekInfo.calendarYear}年${weekInfo.month}月 高${gradeYear}第${weekInYear}周·${weekdayLabel}`,
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
    addGlobalMemory(`参加【${examTitles[examType]}】考出 ${score}分（${gradeRank}等级），${evaluation}。`, 'exam');

    return newRecord;
  };

  // Slow-Paced Daily Progression (7 days per week = 756 days across 3 years so game never ends too fast!)
  const handleAdvanceOneDay = () => {
    const nextDay = dayInWeek + 1;

    // Daily micro-growth & recovery
    if (dayInWeek < 5) {
      // Weekday: school classes + club/trainee practice
      applyDeltaStats({
        academics: 1,
        clubSkill: 1,
        stamina: stats.stamina < 25 ? 25 : -4,
        mood: 1,
      });
    } else {
      // Weekend: rest & social recovery
      applyDeltaStats({
        stamina: 18,
        mood: 4,
        social: 1,
      });
    }

    if (nextDay < 7) {
      setDayInWeek(nextDay);
      const nextDayName = WEEKDAYS[nextDay];
      showNotification(
        `📅 进入高${gradeYear}第${weekInYear}周 · ${nextDayName}！${
          nextDay === 2 || nextDay === 4
            ? '放学后可前往【社团与比赛】或【练习生企划】体验专属突发事件与舞台！'
            : ''
        }`
      );
      // 45% chance on any day to trigger a rich campus / club / trainee / relationship story event!
      if (Math.random() < 0.45) {
        const ev = pickWeeklyEvent({
          year: gradeYear,
          week: weekInYear,
          season: weekInfo.season,
          stats,
          npcs,
        });
        setActiveEvent(ev);
      }
      return;
    }

    // Completed all 7 days of the week -> advance to Monday of next week and credit weekly allowance!
    setDayInWeek(0);
    applyDeltaStats({
      coins: stats.allowance,
      stamina: 15,
    });

    let examNotice = '';
    if (weekInfo.milestoneExam) {
      const rec = performExamSettlement(
        weekInfo.milestoneExam.type,
        stats.academics,
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
        `✨ 新的一周开始（高${nextYear}第${nextWeek}周·周一）！周零花钱 +₩${stats.allowance.toLocaleString()}${examNotice}`
      );
    }

    setGradeYear(nextYear);
    setWeekInYear(nextWeek);

    const nextWeekInfo = getWeekCalendarInfo(nextYear, nextWeek);
    const ev = pickWeeklyEvent({
      year: nextYear,
      week: nextWeek,
      season: nextWeekInfo.season,
      stats,
      npcs,
    });
    setActiveEvent(ev);
  };

  // Core Weekly Turn Execution (from WeeklySchedulerModal)
  const handleExecuteWeeklyTurn = (
    selectedActions: WeeklyActionItem[],
    preferredEventCategory?: EventCategory
  ) => {
    const combinedDelta: Partial<GameStats> = {
      mood: 0,
      stamina: 0,
      academics: 0,
      social: 0,
      appearance: 0,
      family: 0,
      coins: stats.allowance,
      snsFollowers: 0,
      clubSkill: 0,
      traineeProgress: 0,
      darkIndex: 0,
    };

    selectedActions.forEach((act) => {
      combinedDelta.stamina = (combinedDelta.stamina || 0) - act.staminaCost;
      combinedDelta.mood = (combinedDelta.mood || 0) + (act.effect.mood || 0);
      combinedDelta.academics = (combinedDelta.academics || 0) + (act.effect.academics || 0);
      combinedDelta.social = (combinedDelta.social || 0) + (act.effect.social || 0);
      combinedDelta.appearance = (combinedDelta.appearance || 0) + (act.effect.appearance || 0);
      combinedDelta.family = (combinedDelta.family || 0) + (act.effect.family || 0);
      combinedDelta.coins = (combinedDelta.coins || 0) + (act.effect.coins || 0);
      combinedDelta.snsFollowers = (combinedDelta.snsFollowers || 0) + (act.effect.snsFollowers || 0);
      combinedDelta.clubSkill = (combinedDelta.clubSkill || 0) + (act.effect.clubSkill || 0);
      combinedDelta.traineeProgress = (combinedDelta.traineeProgress || 0) + (act.effect.traineeProgress || 0);
      combinedDelta.darkIndex = (combinedDelta.darkIndex || 0) + (act.effect.darkIndex || 0);
    });

    if (stats.stamina + (combinedDelta.stamina || 0) < 12) {
      combinedDelta.stamina = 35;
      combinedDelta.mood = (combinedDelta.mood || 0) - 4;
    }

    const actionSummary = selectedActions.map((a) => a.name).join(' + ');
    const memText = `完成了本周行动【${actionSummary}】，领取周零花钱 ₩${stats.allowance.toLocaleString()}。`;

    setChoiceResultData({
      title: `高${gradeYear}第${weekInYear}周 · 行动回合结算说明`,
      description: `你顺利完成了本周排程：【${actionSummary}】，本周获得零花钱 ₩${stats.allowance.toLocaleString()}。`,
      deltas: combinedDelta,
      memoryLog: memText,
      onConfirm: () => {
        applyDeltaStats(combinedDelta);
        addGlobalMemory(memText, 'life');

        let examNotice = '';
        if (weekInfo.milestoneExam) {
          const rec = performExamSettlement(
            weekInfo.milestoneExam.type,
            stats.academics + (combinedDelta.academics || 0),
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
            setChoiceResultData(null);
            return;
          }
        } else {
          showNotification(
            `已推进至高${nextYear}第${nextWeek}周！零花钱 +₩${stats.allowance.toLocaleString()}${examNotice}`
          );
        }

        setGradeYear(nextYear);
        setWeekInYear(nextWeek);
        setDayInWeek(0);

        const nextWeekInfo = getWeekCalendarInfo(nextYear, nextWeek);
        const ev = pickWeeklyEvent({
          year: nextYear,
          week: nextWeek,
          season: nextWeekInfo.season,
          stats,
          npcs,
          preferredCategory: preferredEventCategory,
        });
        setActiveEvent(ev);
        setChoiceResultData(null);
      },
    });
  };

  // Trigger Event from 220+ Pool or AI Engine
  const handleTriggerEvent = async (customPrompt?: string) => {
    if (customPrompt) {
      setIsGeneratingAIEvent(true);
      try {
        const recentMemStrings = memories.slice(-8).map((m) => `[${m.dateStr}] ${m.summary}`);
        const ev = await generateDynamicCampusEvent({
          aiConfig,
          stats,
          location,
          timeContext: timeContextStr,
          npcs,
          recentMemories: recentMemStrings,
          customPrompt,
        });
        setActiveEvent(ev);
      } catch (_e) {
        const fallbackEv = pickWeeklyEvent({
          year: gradeYear,
          week: weekInYear,
          season: weekInfo.season,
          stats,
          npcs,
        });
        setActiveEvent(fallbackEv);
      } finally {
        setIsGeneratingAIEvent(false);
      }
      return;
    }

    const ev = pickWeeklyEvent({
      year: gradeYear,
      week: weekInYear,
      season: weekInfo.season,
      stats,
      npcs,
    });
    setActiveEvent(ev);
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

  const handleResolveEvent = (
    effect: Partial<GameStats>,
    favChange?: { npcId: string; amount: number },
    memoryLog?: string
  ) => {
    const targetNpc = favChange?.npcId ? npcs.find((n) => n.id === favChange.npcId) : undefined;
    const favArr = favChange
      ? [{ npcId: favChange.npcId, npcName: targetNpc?.chineseName || favChange.npcId, amount: favChange.amount }]
      : [];

    setChoiceResultData({
      title: activeEvent?.title || '校园突发事件抉择说明',
      description: memoryLog || '你做出了抉择，校园生活因此留下了深刻的印记。',
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
    setMemories(initialMemories);
    setExamRecords([]);
    showNotification('✨ 已开启新周目（2025年高一第1周·周一），已解锁的13大结局图鉴与衣橱已保留！');
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
          dayInWeek={dayInWeek}
          stats={stats}
          location={location}
          customBgUrl={customBgUrl}
          npcs={npcs}
          selectedNpc={selectedNpc}
          isGeneratingAIEvent={isGeneratingAIEvent}
          totalMemoriesCount={memories.length}
          onSelectNpc={(npc) => setSelectedNpcId(npc.id)}
          onOpenWeeklyScheduler={() => setActiveModal('weeklyTurn')}
          onAdvanceOneDay={handleAdvanceOneDay}
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
        />
      </div>

      {/* 1. Weekly Action Turn-Based Scheduler Modal */}
      {activeModal === 'weeklyTurn' && (
        <WeeklySchedulerModal
          onClose={() => setActiveModal(null)}
          gradeYear={gradeYear}
          weekInYear={weekInYear}
          stats={stats}
          onExecuteTurn={handleExecuteWeeklyTurn}
          onJumpToWeek={(targetYr, targetWk, label) => {
            setGradeYear(targetYr);
            setWeekInYear(targetWk);
            setDayInWeek(0);
            setActiveModal(null);
            showNotification(label);
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
          onAttendClass={(subject) => {
            if (stats.stamina < 10) {
              showNotification('体力不足，请先在周行动中安排休息或去食堂补充体力！');
              return;
            }
            applyDeltaStats({ academics: 4, stamina: -10, mood: 2, family: 2 });
            setLocation('1-1 教室');
            addGlobalMemory(`专心完成了【${subject}】强化学习，内申评价提升。`, 'life');
            showNotification(`完成了【${subject}】专修：学业 +4，家庭关系 +2！`);
          }}
        />
      )}

      {/* 3. Club Activities, Sudden Incidents & 3-Stage Competition Theater Modal */}
      {activeModal === 'club' && (
        <ClubModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          onUpdateStats={(newSt) => updateStats(newSt)}
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
          onUpdateStats={(newSt) => updateStats(newSt)}
          onNotify={showNotification}
          onShowResultModal={(data) => {
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
            updateFavorability(n.id, 10, 10);
            addNpcMemory(
              n.id,
              `[高${gradeYear}第${weekInYear}周] 与${n.chineseName}经历了深度的心事共鸣，倾听了TA的秘密与梦想。`
            );
            showNotification(`✨ 与 ${n.chineseName} 的专属感情/知己故事线推进！好感+10，心动契合+10！`);
          }}
          onApplyStylePack={handleApplyAvatarStylePack}
          onUpdateNpcAvatar={handleUpdateNpcAvatar}
          onOpenPortraitModal={(npcId) => {
            setPortraitWorkshopNpcId(npcId);
            setActiveModal('portraitWorkshop');
          }}
          onRequestStageChangePrompt={handleRequestStageChangePrompt}
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
          examRecords={examRecords}
          onTakeExam={(examType) => {
            if (stats.stamina < 15) {
              showNotification('体力不足15点，请先休息补充精力后再参加统考！');
              return;
            }
            applyDeltaStats({ stamina: -15, academics: 3 });
            const rec = performExamSettlement(examType, stats.academics + 3, gradeYear, weekInYear);
            showNotification(`统考结算完成：${rec.examName} 考出 ${rec.score}分（第${rec.gradeRank}等级）！`);
          }}
          onUpdateStats={updateStats}
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
          onUpdateStats={updateStats}
          onChangeLocation={setLocation}
          onNotify={(msg) => {
            addGlobalMemory(msg, 'life');
            showNotification(msg);
          }}
        />
      )}

      {/* 9. Memory Book & Time Management Modal */}
      {activeModal === 'timeManagement' && (
        <TimeManagementModal
          onClose={() => setActiveModal(null)}
          currentDay={currentDayCount}
          clockMinutes={clockMinutes}
          weather={weekInfo.weather}
          stats={stats}
          memories={memories}
          onAdvanceMinutes={(_mins, label) => {
            handleAdvanceOneDay();
            if (label) showNotification(label);
          }}
          onJumpToClock={(_targetMins, label) => {
            if (label) showNotification(label);
          }}
          onRestAndSleep={() => {
            applyDeltaStats({ stamina: 50, mood: 10, darkIndex: -8 });
            showNotification('美美睡了一觉，体力恢复 +50，心情 +10！');
          }}
        />
      )}

      {/* 10. Smartphone: Stargram SNS & KakaoTalk Modal */}
      {activeModal === 'snsPhone' && (
        <SNSPhoneModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          npcs={npcs}
          snsPosts={snsPosts}
          weekLabel={`高${gradeYear}·第${weekInYear}周·${weekdayLabel}`}
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
            if (path) showNotification(`👑 已进入【${path === 'idol' ? 'K-Pop 顶流爱豆' : path === 'university' ? 'SKY 名门大学与精英职场' : '财阀太太奢华模拟'}】篇章！`);
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

      {/* 12. LocalStorage Save/Load Modal */}
      {activeModal === 'saveload' && (
        <SaveLoadModal
          onClose={() => setActiveModal(null)}
          stats={stats}
          currentDay={currentDayCount}
          clockMinutes={clockMinutes}
          npcs={npcs}
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
            setNpcs(data.npcs);
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
          clockStr={`高${gradeYear}第${weekInYear}周·${weekdayLabel}`}
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
              `[高${gradeYear}第${weekInYear}周·${weekdayLabel}] 秀妍送了我一份【${giftName}】（好感+${fav}%），我很喜欢。`
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
          onUpdateStats={updateStats}
          onUpdateFavorability={(id, amt) => updateFavorability(id, amt, 9)}
          onRecordLunchMemory={(npcId, spotName, fav) => {
            addNpcMemory(
              npcId,
              `[高${gradeYear}第${weekInYear}周·${weekdayLabel}] 和秀妍一起去约会享用了【${spotName}】（好感+${fav}%），关系自然升温。`
            );
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

      {activeEvent && <EventModal event={activeEvent} onResolve={handleResolveEvent} />}

      {/* 19. Choice / Action Result Popup Explanation Modal */}
      {choiceResultData && <ChoiceResultModal data={choiceResultData} />}
    </div>
  );
}
