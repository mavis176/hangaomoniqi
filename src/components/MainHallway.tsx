import React from 'react';
import { NPCClassmate, GameStats } from '../types';
import {
  getWeekCalendarInfo,
  locationScenes,
  WEEKDAYS,
} from '../data/gameData';
import {
  ChevronRight,
  Check,
  Sparkles,
  BookHeart,
  CalendarClock,
  Trophy,
  Star,
  Sun,
} from 'lucide-react';

interface MainHallwayProps {
  gradeYear: number;
  weekInYear: number;
  dayInWeek: number; // 0..6 (周一..周日)
  stats: GameStats;
  location: string;
  customBgUrl: string | null;
  npcs: NPCClassmate[];
  selectedNpc: NPCClassmate;
  isGeneratingAIEvent: boolean;
  totalMemoriesCount: number;
  onSelectNpc: (npc: NPCClassmate) => void;
  onOpenWeeklyScheduler: () => void;
  onAdvanceOneDay: () => void;
  onOpenClubModal: () => void;
  onOpenTraineeModal: () => void;
  onTriggerRandomPoolEvent: () => void;
  onOpenForum: () => void;
  onOpenMemoryBook: () => void;
  onOpenChat: (npc: NPCClassmate) => void;
  onOpenLunch: (npc: NPCClassmate) => void;
  onOpenGift: (npc: NPCClassmate) => void;
  onCycleLocation: () => void;
  onOpenMap?: () => void;
  onOpenPortraitWorkshop?: () => void;
  onOpenRelationships?: () => void;
}

export const MainHallway: React.FC<MainHallwayProps> = ({
  gradeYear,
  weekInYear,
  dayInWeek,
  stats,
  location,
  customBgUrl,
  npcs,
  selectedNpc,
  isGeneratingAIEvent,
  totalMemoriesCount,
  onSelectNpc,
  onOpenWeeklyScheduler,
  onAdvanceOneDay,
  onOpenClubModal,
  onOpenTraineeModal,
  onTriggerRandomPoolEvent,
  onOpenForum,
  onOpenMemoryBook,
  onOpenChat,
  onOpenLunch,
  onOpenGift,
  onCycleLocation,
  onOpenMap,
  onOpenPortraitWorkshop,
  onOpenRelationships,
}) => {
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const weekdayLabel = WEEKDAYS[dayInWeek % 7] || '周一';
  const scene = locationScenes[location] || locationScenes['2楼走廊'];
  const bgImage = customBgUrl || scene.bgUrl;

  const getStageBadgeColor = (stage: NPCClassmate['relationshipStage']) => {
    switch (stage) {
      case '恋人':
        return 'bg-rose-500 text-white';
      case '暧昧':
        return 'bg-pink-400 text-white';
      case '灵魂伴侣':
        return 'bg-purple-600 text-white';
      case '挚友':
        return 'bg-emerald-600 text-white';
      case '朋友':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-[#7d7568] text-white';
    }
  };

  return (
    <div className="relative flex-1 h-full overflow-y-auto sm:overflow-hidden touch-scroll overscroll-contain bg-[#d8d0c5] flex flex-col justify-between select-none">
      {/* 1. Background Korean High School Scene + Seasonal Particle Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={bgImage}
          alt={location}
          className="w-full h-full object-cover object-center brightness-[0.96] contrast-[1.02] transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8eb]/25 via-transparent to-[#2e2922]/15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#3d362d]/30 via-transparent to-[#2b251e]/40 pointer-events-none" />

        {/* Seasonal Visual Atmosphere Tint */}
        {weekInfo.season === 'cherry_blossom' && (
          <div className="absolute inset-0 bg-pink-200/10 pointer-events-none" />
        )}
        {weekInfo.season === 'rainy_season' && (
          <div className="absolute inset-0 bg-sky-900/15 pointer-events-none" />
        )}
        {weekInfo.season === 'first_snow' && (
          <div className="absolute inset-0 bg-indigo-100/15 pointer-events-none" />
        )}

        {/* Architectural Hallway Details */}
        {location === '2楼走廊' && !customBgUrl && (
          <>
            <div className="hidden sm:flex absolute right-[19%] top-[33%] bg-[#d5d8da]/95 border border-[#8e9396] text-[#2b3035] font-mono font-bold text-xs px-2.5 py-0.5 rounded-xs shadow-md">
              {gradeYear}-1
            </div>
            <div className="hidden sm:flex absolute right-[29%] top-[36.5%] bg-[#d5d8da]/90 border border-[#8e9396] text-[#2b3035] font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs shadow-sm">
              {gradeYear}-2
            </div>
            <div className="hidden sm:flex absolute right-[35%] top-[39%] bg-[#d5d8da]/85 border border-[#8e9396] text-[#2b3035] font-mono font-bold text-[9px] px-1.5 py-0.2 rounded-xs">
              {gradeYear}-3
            </div>

            {/* Interactive School Notice Board on Right Wall */}
            <button
              onClick={onOpenForum}
              className="hidden md:flex flex-col justify-between absolute right-2 top-[26%] w-32 h-46 bg-[#476b55]/92 hover:bg-[#3f614c] border-4 border-[#c9bfa8] rounded-sm p-2 shadow-xl text-left transition-transform hover:scale-[1.02] cursor-pointer group"
              title="点击查看首尔女高公告栏与竹林匿名墙"
            >
              <div className="text-[10px] font-bold text-[#e8f0ea] border-b border-[#7fa38c] pb-1 tracking-tighter">
                {weekInfo.calendarYear}学年度 · 校内公示
              </div>
              <div className="grid grid-cols-2 gap-1 my-1 flex-1">
                <div className="bg-[#f4f1ea] rounded-xs p-1 text-[8px] text-[#3a352e] leading-tight overflow-hidden">
                  <div className="font-bold text-[#9e4b4b] mb-0.5">当前学制</div>
                  高{gradeYear} · 第{weekInYear}周
                  <br />
                  {weekInfo.month}月 · {weekdayLabel}
                </div>
                <div className="bg-[#f4f1ea] rounded-xs p-1 text-[8px] text-[#3a352e] leading-tight overflow-hidden">
                  <div className="font-bold text-[#3b6e8c] mb-0.5">竹林匿名墙</div>
                  点击查看全校八卦与热议
                </div>
              </div>
              <div className="text-[9px] font-bold text-[#dff0e4] bg-[#365442] px-1.5 py-0.5 rounded-xs text-center group-hover:text-amber-200 transition-colors truncate">
                {weekInfo.milestoneExam ? weekInfo.milestoneExam.title : weekInfo.seasonName}
              </div>
            </button>
          </>
        )}
      </div>

      {/* 2. Top-Center Title + 2025-2027 3-Year Seasonal & Academic Status Bar */}
      <div className="relative z-10 pt-1.5 sm:pt-3 pb-1 text-center pointer-events-none px-2 sm:px-3">
        <h1
          className="text-xl sm:text-3xl md:text-[44px] font-black text-[#fffdf9] tracking-[0.05em] leading-tight select-none"
          style={{
            textShadow:
              '0 2px 4px rgba(85, 58, 32, 0.85), 0 0 16px rgba(175, 125, 78, 0.85), 0 0 28px rgba(155, 105, 60, 0.65)',
          }}
        >
          韩国女高模拟器
        </h1>
        <p
          className="text-[10px] sm:text-sm md:text-base font-bold text-[#fffdf9] tracking-wider mt-0.5 sm:mt-1 opacity-90"
          style={{
            textShadow: '0 2px 5px rgba(35, 25, 15, 0.8), 0 0 10px rgba(110, 80, 50, 0.6)',
          }}
        >
          2025–2027 三年慢节奏校园日常 · 社团联赛与练习生选秀
        </p>

        {/* Seasonal & Academic Calendar Pill Bar */}
        <div className="mt-1.5 sm:mt-2 inline-flex flex-wrap items-center justify-center gap-1 sm:gap-2 bg-[#4a443b]/85 backdrop-blur-md border border-[#d4cec3]/50 text-[#f7f4ee] text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full shadow-lg pointer-events-auto max-w-[96vw]">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${weekInfo.seasonBadgeColor}`}>
            {weekInfo.seasonName}
          </span>
          <span className="font-bold text-[#f5d68e]">
            {weekInfo.calendarYear}年{weekInfo.month}月 · 高{gradeYear}第{weekInYear}周 · {weekdayLabel}
          </span>
          <span aria-hidden="true">·</span>
          <button
            onClick={onOpenClubModal}
            className="inline-flex items-center gap-1 text-emerald-200 hover:underline font-bold cursor-pointer"
          >
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>{stats.clubRank || '见习部员'}</span>
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={onOpenTraineeModal}
            className="inline-flex items-center gap-1 text-pink-200 hover:underline font-bold cursor-pointer"
          >
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
            <span>{stats.traineeGrade || 'C班练习生'}</span>
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={onOpenMemoryBook}
            className="inline-flex items-center gap-1 text-[#f5d68e] hover:underline font-bold cursor-pointer"
          >
            <BookHeart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>手帐({totalMemoriesCount})</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Area: Daily/Weekly Scheduler Card (Clean & Responsive for Mobile) */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-end p-2 sm:p-3.5 md:p-5 gap-2.5 pointer-events-none">
        {/* Daily & Weekly Schedule + Club/Trainee Action Card */}
        <div className="pointer-events-auto w-full max-w-[360px] sm:w-[285px] md:w-[325px] bg-[#dfd9ce]/95 backdrop-blur-md border-2 border-[#ede8df] rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.35)] overflow-hidden text-[#2b2620]">
          {/* Header with 7-Day Progress Dots */}
          <div className="bg-gradient-to-r from-[#57534b] to-[#6e695f] px-3 py-2 text-white font-bold text-xs sm:text-sm tracking-wide border-b border-[#9c9589] flex items-center justify-between">
            <span>
              高{gradeYear} · 第{weekInYear}周 · {weekdayLabel}
            </span>
            <div className="flex items-center gap-1" title="本周7天进度（满7天进入下一周）">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <span
                  key={d}
                  className={`w-2 h-2 rounded-full ${
                    d <= dayInWeek ? 'bg-[#f5d68e]' : 'bg-white/25'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Location Switcher & Map Button Row */}
          <div className="w-full px-3 py-1.5 flex items-center justify-between border-b border-[#c7c0b3] bg-white/40">
            <button
              onClick={onOpenMap || onCycleLocation}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left min-w-0"
              title="点击打开地图页面 (12大地点·专属互动行动)"
            >
              <span className="px-1.5 py-0.5 rounded bg-[#6b665c] border border-[#8c867b] text-white text-[10px] font-bold shadow-xs shrink-0">
                {scene.floorBadge}
              </span>
              <span className="font-bold text-xs sm:text-sm text-[#2b2620] truncate">
                {location}
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {onOpenMap && (
                <button
                  onClick={onOpenMap}
                  className="px-2 py-0.5 rounded-md bg-[#e6dbcc] hover:bg-[#d8ccbc] text-[10px] font-black text-[#47392c] border border-[#cfc3b0] flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                  title="打开首尔女高完整漫游地图"
                >
                  <span>🗺️</span>
                  <span>地图</span>
                </button>
              )}
              <button
                onClick={onCycleLocation}
                className="p-1 text-[#5a544a] hover:text-[#2b2620] cursor-pointer"
                title="快速切换场景"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Milestone Exam or Daily Schedule Info */}
          <div className="px-3 py-1.5 flex items-start gap-2 border-b border-[#c7c0b3]/70 bg-[#e8e2d6]/60">
            <span className="w-4 h-4 rounded bg-[#759e7c] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
            <div className="text-[11px] sm:text-xs leading-snug min-w-0">
              <div className="text-[#2b2620] font-bold truncate">
                {weekInfo.milestoneExam
                  ? `🔥 本周大考: ${weekInfo.milestoneExam.title}`
                  : dayInWeek < 5
                  ? `📚 ${weekdayLabel}校内授课 + 放学社团/练习室`
                  : `🌸 ${weekdayLabel}周末自由支配 · 比赛/选秀/约会`}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-2 space-y-1.5">
            {/* Primary Button: Advance 1 Day (Slow, rich daily progression!) */}
            <button
              onClick={onAdvanceOneDay}
              className="w-full bg-gradient-to-r from-[#5c7a67] to-[#466351] hover:from-[#688a75] hover:to-[#52735e] active:scale-[0.98] text-white rounded-xl p-2 flex items-center justify-between shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sun className="w-4 h-4 text-[#f5d68e] shrink-0" />
                <div className="text-left leading-tight truncate">
                  <div className="text-xs sm:text-[13px] font-bold">
                    推进今日校园日常 ({weekdayLabel} → {WEEKDAYS[(dayInWeek + 1) % 7]})
                  </div>
                  <div className="text-[10px] text-[#dcebe1]">
                    按天慢节奏体验 · 触发日常奇遇
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Dedicated Club Competition & Trainee Center Popup Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onOpenClubModal}
                className="py-1.5 px-2 bg-gradient-to-r from-[#4b5e4d] to-[#3c4d3e] hover:from-[#576e5a] hover:to-[#475b49] active:scale-[0.98] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                title="打开社团专属弹窗：部室突发事件 + 三阶段互动比赛"
              >
                <Trophy className="w-3.5 h-3.5 text-[#f5d68e] shrink-0" />
                <span className="truncate">社团与比赛</span>
              </button>

              <button
                onClick={onOpenTraineeModal}
                className="py-1.5 px-2 bg-gradient-to-r from-[#9e426c] to-[#7d3154] hover:from-[#b04b79] hover:to-[#8f3961] active:scale-[0.98] text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                title="打开练习生企划弹窗：地下练习室突发事件 + 月末评价选秀"
              >
                <Star className="w-3.5 h-3.5 text-amber-200 fill-amber-200 shrink-0" />
                <span className="truncate">练习生选秀</span>
              </button>
            </div>

            {/* Bottom Row: Weekly Scheduler + Trigger Random Story Event */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onOpenWeeklyScheduler}
                className="py-1.5 px-2 bg-[#d2cbc0] hover:bg-[#c6beb1] active:scale-[0.98] border border-[#b8b0a2] rounded-lg text-[#2b2620] text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5 text-[#5c4828] shrink-0" />
                <span className="truncate">周行动排程</span>
              </button>

              <button
                onClick={onTriggerRandomPoolEvent}
                disabled={isGeneratingAIEvent}
                className="py-1.5 px-2 bg-gradient-to-r from-[#8c7a5b] to-[#6e5f45] hover:from-[#9c8968] hover:to-[#7d6c50] disabled:opacity-60 text-[#fdfbf7] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 text-[#f5d68e] shrink-0 ${isGeneratingAIEvent ? 'animate-spin' : ''}`} />
                <span className="truncate">{isGeneratingAIEvent ? '推演中...' : '触发剧情'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
