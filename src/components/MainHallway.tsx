import React from 'react';
import { NPCClassmate, GameStats } from '../types';
import {
  getWeekCalendarInfo,
  locationScenes,
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
  stats: GameStats;
  location: string;
  customBgUrl: string | null;
  npcs: NPCClassmate[];
  selectedNpc: NPCClassmate;
  isGeneratingAIEvent: boolean;
  totalMemoriesCount: number;
  onSelectNpc: (npc: NPCClassmate) => void;
  onOpenWeeklyScheduler: () => void;
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
  onOpenDestinyCard?: () => void;
}

export const MainHallway: React.FC<MainHallwayProps> = ({
  gradeYear,
  weekInYear,
  stats,
  location,
  customBgUrl,
  npcs,
  selectedNpc,
  isGeneratingAIEvent,
  totalMemoriesCount,
  onSelectNpc,
  onOpenWeeklyScheduler,
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
  onOpenDestinyCard,
}) => {
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const scene = locationScenes[location] || locationScenes['2楼走廊'];
  const bgImage = customBgUrl || scene.bgUrl;

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
                  第{weekInYear <= 18 ? '上' : '下'}学期 · {weekInfo.month}月
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
            {weekInfo.calendarYear}年{weekInfo.month}月 · 高{gradeYear}第{weekInYear <= 18 ? '上' : '下'}学期 · 第{weekInYear}周
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
            <span>{stats.isDebutedIdol ? '👑 正式出道 Idol' : stats.traineeGrade || '未签约普通学生'}</span>
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={onOpenMemoryBook}
            className="inline-flex items-center gap-1 text-[#f5d68e] hover:underline font-bold cursor-pointer"
          >
            <BookHeart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>手帐({totalMemoriesCount})</span>
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => onOpenDestinyCard?.()}
            className="inline-flex items-center gap-1 text-amber-200 hover:underline font-bold cursor-pointer animate-pulse"
            title="抽取本周命运奇遇卡，触发随机高额奖励与心动事件"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>🎲命运奇遇</span>
          </button>
        </div>

        {/* Semester & Exam Distance Progress Bar */}
        {(() => {
          const currentSemesterNum = weekInYear <= 18 ? 1 : 2;
          const semesterLabel = `高${gradeYear} · 第${currentSemesterNum === 1 ? '上' : '下'}学期`;
          const semesterProgressPct = Math.round((((weekInYear - 1) % 18) / 18) * 100);
          const totalThreeYearsPct = Math.round((((gradeYear - 1) * 36 + weekInYear) / (3 * 36)) * 100);

          let weeksToNextExam = 0;
          let nextExamTitle = '期末大考';
          const examWeeks = [
            { wk: 6, title: '4月期中考' },
            { wk: 12, title: '6月期末考' },
            { wk: 24, title: '10月期中考' },
            { wk: 32, title: '12月期末大考' },
          ];
          const upcoming = examWeeks.find((e) => e.wk >= weekInYear);
          if (upcoming) {
            weeksToNextExam = upcoming.wk - weekInYear;
            nextExamTitle = upcoming.title;
          } else {
            weeksToNextExam = 36 - weekInYear + 6;
            nextExamTitle = '下学期期中考';
          }

          return (
            <div className="mt-2 mx-auto max-w-xl bg-[#4a443b]/90 backdrop-blur-md border border-[#d4cec3]/60 text-[#f7f4ee] px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{semesterLabel} · {weekInfo.month}月教学阶段</span>
                </div>
                <div className="text-[11px] text-[#f5d68e] bg-[#2e2922]/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {weeksToNextExam === 0 ? '🔥 本周迎来大考！' : `距离【${nextExamTitle}】还有 ${weeksToNextExam} 周`}
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-[#2e2922] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#6b6255]">
                <div
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, Math.min(100, semesterProgressPct))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#c4b9a8] mt-1">
                <span>学期进度：{semesterProgressPct}% (本学期第{((weekInYear - 1) % 18) + 1}/18周)</span>
                <span>三年总进度：{totalThreeYearsPct}%</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 3. Bottom Area: Main Featured Action Deck Card (Requirement 3: Distinguish Visual Focus) */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-end p-2 sm:p-3.5 md:p-5 gap-2.5 pointer-events-none">
        {/* Weekly Scheduler Core Action Deck */}
        <div className="pointer-events-auto w-full max-w-[370px] sm:w-[320px] md:w-[350px] bg-[#3a332a]/92 backdrop-blur-xl border-2 border-[#f3eee4]/60 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.45)] overflow-hidden text-white">
          {/* Header with Weekly Time Engine Indicator */}
          <div className="bg-gradient-to-r from-[#2c261f] to-[#453d33] px-3 py-2 text-amber-200 font-black text-xs sm:text-sm tracking-wide border-b border-[#5e5346] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-amber-300" />
              <span>本周行动规划中心</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full">
              高{gradeYear} 第{weekInYear}周
            </span>
          </div>

          {/* Location Switcher & Map Button Row */}
          <div className="w-full px-3 py-1.5 flex items-center justify-between border-b border-white/10 bg-black/20">
            <button
              onClick={onOpenMap || onCycleLocation}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left min-w-0"
              title="点击打开地图页面 (12大地点·专属互动行动)"
            >
              <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black shrink-0">
                {scene.floorBadge}
              </span>
              <span className="font-black text-xs sm:text-sm text-white truncate">
                {location}
              </span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {onOpenMap && (
                <button
                  onClick={onOpenMap}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-[11px] font-black text-amber-200 border border-amber-300/40 flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95"
                  title="打开首尔女高完整漫游地图"
                >
                  <span>🗺️</span>
                  <span>地图</span>
                </button>
              )}
              <button
                onClick={onCycleLocation}
                className="p-1 text-stone-300 hover:text-white cursor-pointer"
                title="快速切换场景"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Milestone Exam or Weekly Schedule Status Info */}
          <div className="px-3 py-1.5 flex items-start gap-2 border-b border-white/10 bg-black/30">
            <span className="w-4 h-4 rounded bg-amber-500/80 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3 h-3 stroke-[3]" />
            </span>
            <div className="text-[11px] sm:text-xs leading-snug min-w-0">
              <div className="text-stone-100 font-bold truncate">
                {weekInfo.milestoneExam
                  ? `🔥 本周重大考核: ${weekInfo.milestoneExam.title}`
                  : `📅 高${gradeYear}第${weekInYear}周 · 排布7日行动决策并按周推进`}
              </div>
            </div>
          </div>

          {/* Core Main Action Buttons */}
          <div className="p-2.5 space-y-2">
            {/* Primary Hero Button: Open Weekly Scheduler Engine */}
            <button
              onClick={onOpenWeeklyScheduler}
              className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 active:scale-[0.98] text-white rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-xl border-2 border-amber-300/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                  <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 animate-pulse" />
                </div>
                <div className="text-left leading-tight truncate">
                  <div className="text-xs sm:text-sm font-black text-white">
                    开启本周行动排程（第{weekInYear}周）
                  </div>
                  <div className="text-[10px] text-amber-100/90 font-medium truncate">
                    排布7日决策 · 连续演播推进至第{weekInYear + 1}周
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-amber-200 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Featured Hero Actions: Club Competition & Trainee Showcase */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenClubModal}
                className="py-2 px-2.5 bg-gradient-to-r from-[#2c4232] to-[#1f3024] hover:from-[#37523f] hover:to-[#273d2d] active:scale-[0.98] border border-emerald-400/40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="打开社团专属弹窗：部室突发事件 + 三阶段互动比赛"
              >
                <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="truncate">社团与比赛</span>
              </button>

              <button
                onClick={onOpenTraineeModal}
                className="py-2 px-2.5 bg-gradient-to-r from-[#8c2d58] to-[#691f41] hover:from-[#9e3565] hover:to-[#7a254c] active:scale-[0.98] border border-pink-400/40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="打开练习生企划弹窗：地下练习室突发事件 + 月末评价选秀"
              >
                <Star className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                <span className="truncate">练习生选秀</span>
              </button>
            </div>

            {/* Bottom Row: Trigger Story Event + Seoul Map Exploration */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onTriggerRandomPoolEvent}
                disabled={isGeneratingAIEvent}
                className="py-1.5 px-2 bg-gradient-to-r from-[#705e45] to-[#544633] hover:from-[#826f53] hover:to-[#63533d] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-amber-300/30"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-300 shrink-0 ${isGeneratingAIEvent ? 'animate-spin' : ''}`} />
                <span className="truncate">{isGeneratingAIEvent ? '推演中...' : '触发剧情'}</span>
              </button>

              <button
                onClick={onOpenMap || onCycleLocation}
                className="py-1.5 px-2 bg-stone-800/80 hover:bg-stone-700/80 active:scale-[0.98] border border-stone-600/80 rounded-xl text-amber-100 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>🗺️</span>
                <span className="truncate">首尔全景地图</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
