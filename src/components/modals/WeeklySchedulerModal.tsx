import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarClock,
  Sparkles,
  FastForward,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Zap,
  Award,
  ArrowRight,
  Heart,
  ShieldAlert,
  Play,
  UserCheck,
  Loader2,
} from 'lucide-react';
import {
  GameStats,
  WeeklyActionItem,
  EventCategory,
  DailyScheduleSlot,
  InterruptEvent,
  WeeklyExecutionSummary,
  PlayerTrait,
  DynamicNPCEncounter,
  NPCClassmate,
  AIConfig,
} from '../../types';
import {
  WEEKLY_ACTIONS,
  getWeekCalendarInfo,
  PREDEFINED_PLAYER_TRAITS,
  PREDEFINED_INTERRUPT_EVENTS,
} from '../../data/gameData';
import { generateNewNPCEncounter } from '../../services/aiService';
import {
  convertEncounterToNPC,
  DYNAMIC_NPC_FALLBACK_PRESETS,
} from '../../data/encounterData';
import { EncounterModal } from './EncounterModal';

interface WeeklySchedulerModalProps {
  onClose: () => void;
  gradeYear: number;
  weekInYear: number;
  stats: GameStats;
  aiConfig?: AIConfig;
  onCompleteWeeklyExecution: (
    summary: WeeklyExecutionSummary,
    combinedDeltas: Partial<GameStats>
  ) => void;
  onJumpToWeek: (targetYear: number, targetWeek: number, label: string) => void;
  onAddNewNPC?: (npc: NPCClassmate) => void;
  onNotify?: (msg: string) => void;
}

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const WeeklySchedulerModal: React.FC<WeeklySchedulerModalProps> = ({
  onClose,
  gradeYear,
  weekInYear,
  stats,
  aiConfig,
  onCompleteWeeklyExecution,
  onJumpToWeek,
  onAddNewNPC,
  onNotify,
}) => {
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);

  // Initial 7-Day Schedule Slots (Mon -> Sun)
  const [scheduleIds, setScheduleIds] = useState<string[]>([
    'act_study_class',    // Mon
    'act_sport_pilates',   // Tue
    'act_club_practice',  // Wed
    'act_study_library',  // Thu
    'act_social_sns',     // Fri
    'act_social_hongdae', // Sat
    'act_rest_sleep',     // Sun
  ]);

  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Execution Phase States
  const [executionPhase, setExecutionPhase] = useState<
    'config' | 'running' | 'interrupt' | 'encounter' | 'summary'
  >('config');
  const [currentExecutingDayIndex, setCurrentExecutingDayIndex] = useState<number>(0);
  const [activeInterrupt, setActiveInterrupt] = useState<InterruptEvent | null>(null);

  // AI Dynamic Encounter State
  const [activeEncounter, setActiveEncounter] = useState<DynamicNPCEncounter | null>(null);
  const [isGeneratingEncounter, setIsGeneratingEncounter] = useState<boolean>(false);
  const [hasEncounteredThisWeek, setHasEncounteredThisWeek] = useState<boolean>(false);

  // Execution Accumulators
  const [executionLogs, setExecutionLogs] = useState<WeeklyExecutionSummary['dailyLogs']>([]);
  const [interruptLogs, setInterruptLogs] = useState<string[]>([]);
  const [unlockedTraitsThisWeek, setUnlockedTraitsThisWeek] = useState<PlayerTrait[]>([]);
  const [accumulatedDeltas, setAccumulatedDeltas] = useState<Partial<GameStats>>({
    coins: stats.allowance,
    stamina: 0,
    academics: 0,
    social: 0,
    appearance: 0,
    family: 0,
    clubSkill: 0,
    traineeProgress: 0,
    darkIndex: 0,
  });

  // Calculate action categories frequency for 7 days
  const categoryCounts: Record<string, number> = {};
  scheduleIds.forEach((id) => {
    const act = WEEKLY_ACTIONS.find((a) => a.id === id);
    if (act) {
      categoryCounts[act.category] = (categoryCounts[act.category] || 0) + 1;
    }
  });

  // Check if schedule is well-balanced
  const uniqueCategoriesCount = Object.keys(categoryCounts).length;
  const isBalancedSchedule = uniqueCategoriesCount >= 4 && (categoryCounts['rest'] || 0) >= 1;

  // Preset Handlers
  const applyPreset = (presetIds: string[]) => {
    if (presetIds.length === 7) {
      setScheduleIds(presetIds);
    }
  };

  const handleSelectActionForActiveSlot = (actionId: string) => {
    const updated = [...scheduleIds];
    updated[activeSlotIdx] = actionId;
    setScheduleIds(updated);
    if (activeSlotIdx < 6) {
      setActiveSlotIdx(activeSlotIdx + 1);
    }
  };

  // Start Weekly Execution Engine
  const handleStartExecution = () => {
    setExecutionPhase('running');
    setCurrentExecutingDayIndex(0);
    setExecutionLogs([]);
    setInterruptLogs([]);
    setUnlockedTraitsThisWeek([]);
    setHasEncounteredThisWeek(false);
    setActiveEncounter(null);
    setIsGeneratingEncounter(false);
    setAccumulatedDeltas({
      coins: stats.allowance,
      stamina: 0,
      academics: 0,
      social: 0,
      appearance: 0,
      family: 0,
      clubSkill: 0,
      traineeProgress: 0,
      darkIndex: 0,
    });
  };

  // Auto Step Driver for 7 Days
  useEffect(() => {
    if (executionPhase !== 'running') return;

    if (currentExecutingDayIndex >= 7) {
      // Finished all 7 days! Shift to summary
      setExecutionPhase('summary');
      return;
    }

    const dayName = DAY_NAMES[currentExecutingDayIndex];
    const actionId = scheduleIds[currentExecutingDayIndex];
    const actionItem = WEEKLY_ACTIONS.find((a) => a.id === actionId) || WEEKLY_ACTIONS[0];

    // Check for interrupt event on this day
    const interruptOnDay = PREDEFINED_INTERRUPT_EVENTS.find(
      (e) => e.dayIndex === currentExecutingDayIndex
    );

    const timer = setTimeout(async () => {
      if (interruptOnDay && !activeInterrupt) {
        // Pause and trigger interrupt modal
        setActiveInterrupt(interruptOnDay);
        setExecutionPhase('interrupt');
        return;
      }

      // Check for dynamic NPC encounter on this day (~25% probability)
      const rollEncounter = !hasEncounteredThisWeek && Math.random() < 0.28;
      if (rollEncounter && !activeEncounter) {
        setExecutionPhase('encounter');
        setIsGeneratingEncounter(true);
        setHasEncounteredThisWeek(true);
        try {
          const enc = await generateNewNPCEncounter({
            stats,
            actionItem,
            dayName,
            weekInYear,
            gradeYear,
            aiConfig,
          });
          setActiveEncounter(enc);
        } catch (_err) {
          const preset = DYNAMIC_NPC_FALLBACK_PRESETS[0];
          setActiveEncounter(preset);
        } finally {
          setIsGeneratingEncounter(false);
        }
        return;
      }

      // Execute normal daily step
      processDailyStep(currentExecutingDayIndex, actionItem, false);
      setCurrentExecutingDayIndex((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [executionPhase, currentExecutingDayIndex]);

  // Process single day step logic
  const processDailyStep = (
    dayIdx: number,
    actionItem: WeeklyActionItem,
    isInterruptedOverride: boolean,
    overrideLog?: string
  ) => {
    const catCount = categoryCounts[actionItem.category] || 1;

    // Calculate yield multiplier & burnout
    let yieldPct = 100;
    let isBurnout = false;
    let isEpiphany = false;

    if (catCount >= 5) {
      yieldPct = 30;
      isBurnout = true;
    } else if (catCount >= 3) {
      yieldPct = 55;
      isBurnout = true;
    }

    // Epiphany check: Balance bonus or random chance under high darkIndex
    if (!isBurnout && (isBalancedSchedule || (stats.darkIndex > 40 && Math.random() < 0.35))) {
      isEpiphany = true;
      yieldPct = 140;
    }

    const mult = yieldPct / 100;
    const staminaCost = Math.round(actionItem.staminaCost * (isBurnout ? 1.3 : 0.9));
    const darkDelta = (actionItem.effect.darkIndex || 0) + (isBurnout ? 4 : 0);

    // Update accumulated deltas
    setAccumulatedDeltas((prev) => ({
      ...prev,
      stamina: (prev.stamina || 0) - staminaCost,
      mood: (prev.mood || 0) + Math.round((actionItem.effect.mood || 0) * mult),
      academics: (prev.academics || 0) + Math.round((actionItem.effect.academics || 0) * mult),
      social: (prev.social || 0) + Math.round((actionItem.effect.social || 0) * mult),
      appearance: (prev.appearance || 0) + Math.round((actionItem.effect.appearance || 0) * mult),
      family: (prev.family || 0) + Math.round((actionItem.effect.family || 0) * mult),
      coins: (prev.coins || 0) + Math.round((actionItem.effect.coins || 0) * mult),
      clubSkill: (prev.clubSkill || 0) + Math.round((actionItem.effect.clubSkill || 0) * mult),
      traineeProgress: (prev.traineeProgress || 0) + Math.round((actionItem.effect.traineeProgress || 0) * mult),
      darkIndex: (prev.darkIndex || 0) + darkDelta,
    }));

    const logText = isInterruptedOverride
      ? overrideLog || `周${DAY_NAMES[dayIdx]}处理了突发事件。`
      : `${actionItem.icon} ${actionItem.name}${
          isEpiphany
            ? ' ✨ 【触发顿悟暴击！】'
            : isBurnout
            ? ' ⚠️ 【专注倦怠(收益衰减)】'
            : ' (完成)'
        }`;

    setExecutionLogs((prev) => [
      ...prev,
      {
        dayIndex: dayIdx,
        dayName: DAY_NAMES[dayIdx],
        actionName: actionItem.name,
        icon: actionItem.icon,
        logText,
        yieldPct,
        staminaDelta: -staminaCost,
        darkDelta,
        isBurnout,
        isEpiphany,
      },
    ]);
  };

  // Handle Interrupt Choice
  const handleInterruptDecision = (type: 'stick' | 'handle') => {
    if (!activeInterrupt) return;

    const dayIdx = activeInterrupt.dayIndex;
    const actionId = scheduleIds[dayIdx];
    const actionItem = WEEKLY_ACTIONS.find((a) => a.id === actionId) || WEEKLY_ACTIONS[0];

    if (type === 'stick') {
      // Stick to original plan
      const choice = activeInterrupt.choiceStick;
      if (choice.effect) {
        setAccumulatedDeltas((prev) => ({
          ...prev,
          mood: (prev.mood || 0) + (choice.effect?.mood || 0),
          academics: (prev.academics || 0) + (choice.effect?.academics || 0),
          traineeProgress: (prev.traineeProgress || 0) + (choice.effect?.traineeProgress || 0),
        }));
      }
      setInterruptLogs((prev) => [...prev, `[${activeInterrupt.dayName}突发] 坚守原计划：${choice.resultDesc}`]);
      processDailyStep(dayIdx, actionItem, false);
    } else {
      // Handle interrupt (override today's schedule)
      const choice = activeInterrupt.choiceHandle;
      if (choice.effect) {
        setAccumulatedDeltas((prev) => ({
          ...prev,
          mood: (prev.mood || 0) + (choice.effect?.mood || 0),
          social: (prev.social || 0) + (choice.effect?.social || 0),
          traineeProgress: (prev.traineeProgress || 0) + (choice.effect?.traineeProgress || 0),
          clubSkill: (prev.clubSkill || 0) + (choice.effect?.clubSkill || 0),
          vocalSkill: (prev.vocalSkill || 0) + (choice.effect?.vocalSkill || 0),
          cameraSkill: (prev.cameraSkill || 0) + (choice.effect?.cameraSkill || 0),
          snsFollowers: (prev.snsFollowers || 0) + (choice.effect?.snsFollowers || 0),
        }));
      }

      if (choice.unlockedTrait) {
        setUnlockedTraitsThisWeek((prev) => {
          if (prev.some((t) => t.id === choice.unlockedTrait?.id)) return prev;
          return [...prev, choice.unlockedTrait!];
        });
      }

      setInterruptLogs((prev) => [
        ...prev,
        `[${activeInterrupt.dayName}突发] 解决突发事件：${choice.resultDesc}`,
      ]);

      processDailyStep(
        dayIdx,
        actionItem,
        true,
        `🚨 突发处理：推掉原安排，处理【${activeInterrupt.title}】！`
      );
    }

    setActiveInterrupt(null);
    setExecutionPhase('running');
    setCurrentExecutingDayIndex((prev) => prev + 1);
  };

  // Handle Dynamic NPC Encounter Decision
  const handleEncounterDecision = (action: 'ADD_FRIEND' | 'IGNORE') => {
    if (!activeEncounter) return;

    const dayIdx = currentExecutingDayIndex;
    const actionId = scheduleIds[dayIdx];
    const actionItem = WEEKLY_ACTIONS.find((a) => a.id === actionId) || WEEKLY_ACTIONS[0];

    if (action === 'ADD_FRIEND') {
      const newNpc = convertEncounterToNPC(activeEncounter, gradeYear, weekInYear);
      if (onAddNewNPC) {
        onAddNewNPC(newNpc);
      }
      setAccumulatedDeltas((prev) => ({
        ...prev,
        social: (prev.social || 0) + 5,
        mood: (prev.mood || 0) + 6,
      }));
      if (onNotify) {
        onNotify(`✨ 结识了新伙伴【${newNpc.chineseName}】！已添加至通讯录与全向人际档案！`);
      }
      processDailyStep(
        dayIdx,
        actionItem,
        true,
        `✨ 偶遇新朋友：在${activeEncounter.encounterLocation}与【${newNpc.chineseName}】交换了KakaoTalk并相约常联系！`
      );
    } else {
      processDailyStep(
        dayIdx,
        actionItem,
        true,
        `👋 萍水相逢：在${activeEncounter.encounterLocation}与【${activeEncounter.name}】微笑点头擦肩而过。`
      );
    }

    setActiveEncounter(null);
    setExecutionPhase('running');
    setCurrentExecutingDayIndex((prev) => prev + 1);
  };

  // Finalize Weekly Execution
  const handleFinalizeWeeklyTurn = () => {
    // Check for schedule balance trait
    let finalTraits = [...unlockedTraitsThisWeek];
    if (isBalancedSchedule && !finalTraits.some((t) => t.id === 'trait_balanced_master')) {
      finalTraits.push(PREDEFINED_PLAYER_TRAITS[0]);
    }

    const summary: WeeklyExecutionSummary = {
      gradeYear,
      weekInYear,
      dailyLogs: executionLogs,
      interruptLogs,
      unlockedTraits: finalTraits,
      totalCoinsDelta: accumulatedDeltas.coins || 0,
      totalAcademicsDelta: accumulatedDeltas.academics || 0,
      totalTraineeDelta: accumulatedDeltas.traineeProgress || 0,
      totalSocialDelta: accumulatedDeltas.social || 0,
    };

    onCompleteWeeklyExecution(summary, accumulatedDeltas);
    onClose();
  };

  const categories = [
    { id: 'all', label: '全部行动' },
    { id: 'study', label: '📖 学习' },
    { id: 'club', label: '🎵 社团' },
    { id: 'exercise', label: '🏃‍♀️ 运动' },
    { id: 'social', label: '🧋 社交/SNS' },
    { id: 'parttime', label: '🏪 打工' },
    { id: 'family', label: '🏡 家庭' },
    { id: 'rest', label: '🛌 休息' },
  ];

  const filteredActions =
    activeCategoryFilter === 'all'
      ? WEEKLY_ACTIONS
      : WEEKLY_ACTIONS.filter((a) => a.category === activeCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-3xl w-full max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#57534b] via-[#6e695f] to-[#48443e] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between text-white border-b border-[#9c9589] shrink-0">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d68e] shrink-0" />
            <div>
              <h2 className="text-xs sm:text-base font-bold leading-tight flex items-center gap-2">
                <span>周一至周日·7日核心决策排程</span>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full font-bold">
                  高{gradeYear}第{weekInYear}/36周
                </span>
              </h2>
              <p className="text-[10px] text-[#e6dfd5] hidden sm:block mt-0.5">
                每天专注于1件核心大事，防无脑死磕，体验节奏掌控与突发羁绊！
              </p>
            </div>
          </div>

          {executionPhase === 'config' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* BODY AREA BASED ON PHASE */}
        <div className="p-3 sm:p-5 overflow-y-auto overscroll-contain space-y-4 flex-1 min-h-0">
          
          {/* PHASE 1: CONFIGURATION */}
          {executionPhase === 'config' && (
            <>
              {/* Milestone Banner */}
              {weekInfo.milestoneExam && (
                <div className="bg-gradient-to-r from-[#8c3b3b] to-[#b05252] text-white rounded-xl p-3 flex items-center justify-between shadow-md">
                  <div>
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      <span>本周学制重点大考周！本周结算将进行考场成绩评定</span>
                    </div>
                    <div className="text-sm sm:text-base font-black mt-0.5">{weekInfo.milestoneExam.title}</div>
                    <div className="text-xs text-rose-100 mt-0.5">{weekInfo.milestoneExam.desc}</div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="text-[11px] text-rose-200">当前学业实力</div>
                    <div className="text-xl font-black text-amber-200">{stats.academics}分</div>
                  </div>
                </div>
              )}

              {/* 7 Daily Slots Grid */}
              <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-bold text-[#3d352b] flex items-center gap-1.5">
                    <span>📌 点击下方槽位编排 7 天行程：</span>
                    {isBalancedSchedule ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        黄金平衡路线 (+15% 全员爆皮加成)
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#706454]">（同一类别连选 3 天以上收益衰减）</span>
                    )}
                  </div>

                  {/* Strategy Quick Presets */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset([
                          'act_study_class',
                          'act_study_daechi',
                          'act_study_library',
                          'act_study_class',
                          'act_study_daechi',
                          'act_study_library',
                          'act_rest_sleep',
                        ])
                      }
                      className="px-2 py-0.5 bg-[#dcd4c5] hover:bg-[#cec4b2] rounded text-[11px] font-bold text-[#3d352b] cursor-pointer"
                    >
                      🎓 大峙洞卷王
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset([
                          'act_club_practice',
                          'act_club_competition',
                          'act_sport_pilates',
                          'act_work_model',
                          'act_club_practice',
                          'act_social_sns',
                          'act_rest_sleep',
                        ])
                      }
                      className="px-2 py-0.5 bg-[#dcd4c5] hover:bg-[#cec4b2] rounded text-[11px] font-bold text-[#3d352b] cursor-pointer"
                    >
                      🌟 K-Pop 选秀C位
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyPreset([
                          'act_study_class',
                          'act_sport_pilates',
                          'act_club_practice',
                          'act_study_library',
                          'act_social_sns',
                          'act_social_hongdae',
                          'act_rest_sleep',
                        ])
                      }
                      className="px-2 py-0.5 bg-emerald-200 text-emerald-950 hover:bg-emerald-300 rounded text-[11px] font-bold cursor-pointer"
                    >
                      🧘 黄金周平衡路线
                    </button>
                  </div>
                </div>

                {/* 7 Slots Mon-Sun */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                  {DAY_NAMES.map((dayName, idx) => {
                    const actionId = scheduleIds[idx];
                    const act = WEEKLY_ACTIONS.find((a) => a.id === actionId) || WEEKLY_ACTIONS[0];
                    const isSelectedSlot = activeSlotIdx === idx;
                    const catCount = categoryCounts[act.category] || 1;
                    const isBurnout = catCount >= 3;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSlotIdx(idx)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[82px] ${
                          isSelectedSlot
                            ? 'bg-white border-amber-500 border-2 shadow-sm ring-2 ring-amber-300/50'
                            : 'bg-[#fdfbf7] border-[#c8bfae] hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#7a7062]">
                          <span>{dayName}</span>
                          {isBurnout && (
                            <span className="text-rose-600 text-[9px] font-black" title="收益边际递减">
                              ⚠️倦怠
                            </span>
                          )}
                        </div>

                        <div className="my-1">
                          <div className="text-xs font-bold text-[#2b2620] truncate flex items-center gap-1">
                            <span>{act.icon}</span>
                            <span className="truncate">{act.name}</span>
                          </div>
                          <div className="text-[9px] text-[#6b5e4f] mt-0.5 truncate">
                            {act.categoryLabel}
                          </div>
                        </div>

                        <div className="text-[9px] font-bold text-[#4e634a] flex items-center justify-between border-t border-[#ede6d8] pt-1">
                          <span>消耗 {act.staminaCost}</span>
                          {isSelectedSlot && <CheckCircle2 className="w-3 h-3 text-amber-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Selection Catalog */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#4a4238]">
                    选择行动替换 【{DAY_NAMES[activeSlotIdx]}】 的安排：
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat.id)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeCategoryFilter === cat.id
                            ? 'bg-[#57534b] text-white shadow-xs'
                            : 'bg-[#e6dfd3] text-[#4a4238] hover:bg-[#dad1c2]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {filteredActions.map((act) => {
                    const isCurrentSlotAct = scheduleIds[activeSlotIdx] === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleSelectActionForActiveSlot(act.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrentSlotAct
                            ? 'bg-amber-50/90 border-amber-500 shadow-2xs'
                            : 'bg-white border-[#d8d0c0] hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span className="flex items-center gap-1">
                              <span>{act.icon}</span>
                              <span>{act.name}</span>
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              {act.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#63584a] mt-1 line-clamp-2 leading-relaxed">
                            {act.desc}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 pt-2 border-t border-[#f0e8dc] mt-1.5">
                          <span>体力 -{act.staminaCost}</span>
                          <span>填入【{DAY_NAMES[activeSlotIdx]}】 ↵</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* PHASE 2: RUNNING (AUTO STEPPING & CALENDAR FLIP ANIMATION) */}
          {executionPhase === 'running' && (
            <div className="space-y-4 py-4 text-center">
              {/* Dynamic Calendar Flip Card */}
              <div className="bg-gradient-to-br from-[#3b3227] via-[#544737] to-[#2e261d] text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-amber-400/60 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-amber-200 font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 fill-amber-300 animate-pulse text-amber-300" />
                    <span>连续演播推进中 · 7日时光飞逝</span>
                  </span>
                  <span className="bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300/30 text-[11px] font-black">
                    第 {Math.min(7, currentExecutingDayIndex + 1)} / 7 天
                  </span>
                </div>

                {/* Calendar Tear-off Animation Card */}
                <div className="bg-[#fcf9f2] text-[#2b251f] rounded-2xl p-4 sm:p-5 max-w-xs mx-auto shadow-xl border-t-8 border-rose-500 transform transition-all duration-300 animate-in zoom-in-95">
                  <div className="text-[11px] font-black tracking-widest uppercase text-rose-600">
                    2025–2027 首尔女高学期历
                  </div>
                  <div className="text-3xl sm:text-4xl font-black my-1 text-stone-900 tracking-tight">
                    {DAY_NAMES[Math.min(6, currentExecutingDayIndex)]}
                  </div>
                  <div className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mt-1 border border-amber-300/50">
                    <span>
                      {(() => {
                        const actId = scheduleIds[Math.min(6, currentExecutingDayIndex)];
                        const act = WEEKLY_ACTIONS.find((a) => a.id === actId);
                        return act ? `${act.icon} ${act.name}` : '🏫 校园日常';
                      })()}
                    </span>
                  </div>
                </div>

                {/* Smooth Progress Bar */}
                <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/20 p-0.5 mt-4">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-rose-400 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.round(((currentExecutingDayIndex + 1) / 7) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Execution Logs List */}
              <div className="space-y-2 text-left max-h-60 overflow-y-auto">
                {executionLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#dcd5c7] rounded-xl p-3 flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-bottom-1 duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{log.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-[#2b2620]">
                          周{log.dayName} · {log.actionName}
                        </div>
                        <div className="text-[11px] text-[#6e6255]">{log.logText}</div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-bold">
                      <div className={log.staminaDelta < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        体力 {log.staminaDelta}
                      </div>
                      <div className="text-amber-800 text-[10px]">
                        收益率 {log.yieldPct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHASE 3: INTERRUPT EVENT MODAL */}
          {executionPhase === 'interrupt' && activeInterrupt && (
            <div className="bg-white border-2 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-200" />
                  <span>{activeInterrupt.title}</span>
                </div>
                <span className="text-[10px] bg-black/25 px-2 py-0.5 rounded-full font-bold">
                  【周{activeInterrupt.dayName}突发事件】
                </span>
              </div>

              <div className="flex items-start gap-3 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#e8dfd1]">
                {activeInterrupt.npcAvatar && (
                  <img
                    src={activeInterrupt.npcAvatar}
                    alt={activeInterrupt.npcName}
                    className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
                  />
                )}
                <p className="text-xs text-[#3d352b] leading-relaxed font-medium">
                  {activeInterrupt.story}
                </p>
              </div>

              {/* Two Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleInterruptDecision('stick')}
                  className="p-3 bg-[#f5f0e6] hover:bg-[#ebe2d3] border-2 border-[#d0c5b2] text-[#3d352b] rounded-xl text-xs font-bold text-left transition-all cursor-pointer"
                >
                  <div className="text-amber-900 font-bold mb-1">
                    {activeInterrupt.choiceStick.label}
                  </div>
                  <div className="text-[10px] text-[#6e6255] leading-normal">
                    {activeInterrupt.choiceStick.resultDesc}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleInterruptDecision('handle')}
                  className="p-3 bg-gradient-to-br from-amber-50 to-rose-50 hover:from-amber-100 hover:to-rose-100 border-2 border-amber-500 text-[#2b2620] rounded-xl text-xs font-bold text-left shadow-sm transition-all cursor-pointer"
                >
                  <div className="text-rose-900 font-bold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>{activeInterrupt.choiceHandle.label}</span>
                  </div>
                  <div className="text-[10px] text-[#52463a] leading-normal">
                    {activeInterrupt.choiceHandle.resultDesc}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PHASE 3.5: AI DYNAMIC ENCOUNTER IN PROGRESS */}
          {executionPhase === 'encounter' && isGeneratingEncounter && (
            <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-stone-900">
                  ✨ 正在首尔街头邂逅新人物...
                </h4>
                <p className="text-xs text-stone-500">
                  AI 正在根据今天的日程现场生成富有故事感的角色与初遇微情境
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>生成独有人设与初见微情境...</span>
              </div>
            </div>
          )}

          {/* PHASE 4: WEEKLY SUMMARY */}
          {executionPhase === 'summary' && (() => {
            const nextWeekNum = weekInYear + 1 > 36 ? 1 : weekInYear + 1;
            const nextYearNum = weekInYear + 1 > 36 ? Math.min(3, gradeYear + 1) : gradeYear;
            return (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-[#57534b] via-[#6e695f] to-[#48443e] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border-2 border-amber-400/40">
                  <div>
                    <div className="text-xs font-bold text-amber-200">
                      高{gradeYear}第{weekInYear}周 · 7日全周总结报告
                    </div>
                    <div className="text-base sm:text-lg font-black mt-0.5">
                      🎉 本周圆满完成！即将推进至【高{nextYearNum}第{nextWeekNum}周】
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-amber-300 shrink-0" />
                </div>

                {/* Stat Totals Card */}
                <div className="bg-white border border-[#dcd5c7] rounded-xl p-3.5 space-y-2 shadow-2xs">
                  <div className="text-xs font-bold text-[#3d352b] border-b border-[#f0e8dc] pb-1">
                    📊 本周综合收益汇总：
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold pt-1">
                    <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#e8dfd1]">
                      <span className="text-[10px] text-[#706454]">零花钱入账</span>
                      <div className="text-emerald-700 mt-0.5">+₩{accumulatedDeltas.coins?.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#e8dfd1]">
                      <span className="text-[10px] text-[#706454]">学业实力</span>
                      <div className="text-blue-700 mt-0.5">+{accumulatedDeltas.academics || 0}</div>
                    </div>
                    <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#e8dfd1]">
                      <span className="text-[10px] text-[#706454]">练习生进度</span>
                      <div className="text-purple-700 mt-0.5">+{accumulatedDeltas.traineeProgress || 0}</div>
                    </div>
                    <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#e8dfd1]">
                      <span className="text-[10px] text-[#706454]">社交与声望</span>
                      <div className="text-amber-800 mt-0.5">+{accumulatedDeltas.social || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Unlocked Traits */}
                {unlockedTraitsThisWeek.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>本周解锁的情境性格特质 (Traits)：</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {unlockedTraitsThisWeek.map((trait) => (
                        <div
                          key={trait.id}
                          className="bg-white border border-amber-400 rounded-xl p-2 text-xs font-bold text-amber-950 flex items-center gap-2 shadow-2xs"
                        >
                          <span className="text-lg">{trait.icon}</span>
                          <div>
                            <div>{trait.name}</div>
                            <div className="text-[10px] text-amber-800 font-normal">{trait.effectDesc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Log Accordion List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="text-xs font-bold text-[#3d352b] mb-1">📜 7 天每日详细日志：</div>
                  {executionLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#e0d8c8] rounded-lg p-2 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{log.icon}</span>
                        <span className="font-bold text-[#3d352b]">周{log.dayName}:</span>
                        <span className="text-[#594d3f]">{log.logText}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#807260]">
                        {log.staminaDelta} 体力
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-4 py-3 bg-[#e6dfd3] border-t border-[#cfc7b8] flex flex-wrap items-center justify-between gap-2 shrink-0">
          {executionPhase === 'config' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    let nextWk = weekInYear + 4;
                    let nextYr = gradeYear;
                    if (nextWk > 36) {
                      if (gradeYear < 3) {
                        nextYr = gradeYear + 1;
                        nextWk = 1;
                      } else {
                        nextWk = 36;
                      }
                    }
                    onJumpToWeek(nextYr, nextWk, `🚀 极速冲刺：成功跃迁至高${nextYr}第${nextWk}周！学业与能力迅速成长。`);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>🚀 极速跨月跃迁 (+4周)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleStartExecution}
                className="px-5 py-2.5 bg-gradient-to-r from-[#5c7a67] to-[#425c4b] hover:from-[#698a75] hover:to-[#4f6e5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#f5d68e] fill-[#f5d68e]" />
                <span>🚀 开始执行 7 天日程</span>
              </button>
            </>
          )}

          {executionPhase === 'summary' && (() => {
            const nextWeekNum = weekInYear + 1 > 36 ? 1 : weekInYear + 1;
            const nextYearNum = weekInYear + 1 > 36 ? Math.min(3, gradeYear + 1) : gradeYear;
            return (
              <button
                type="button"
                onClick={handleFinalizeWeeklyTurn}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>【✨ 结算本周收益 · 领取零花钱并推进至高{nextYearNum}第{nextWeekNum}周 ➔】</span>
              </button>
            );
          })()}
        </div>

        {/* Dynamic NPC Encounter Modal */}
        {activeEncounter && (
          <EncounterModal
            encounter={activeEncounter}
            onConfirmFriend={() => handleEncounterDecision('ADD_FRIEND')}
            onIgnore={() => handleEncounterDecision('IGNORE')}
            onClose={() => handleEncounterDecision('IGNORE')}
          />
        )}
      </div>
    </div>
  );
};
