import React, { useState } from 'react';
import { X, CalendarClock, Sparkles, FastForward, CheckCircle2, Flame } from 'lucide-react';
import { GameStats, WeeklyActionItem, EventCategory } from '../../types';
import { WEEKLY_ACTIONS, getWeekCalendarInfo } from '../../data/gameData';
import { EVENT_CATEGORY_LABELS, TOTAL_EVENT_VARIATIONS_COUNT } from '../../data/eventsPool';

interface WeeklySchedulerModalProps {
  onClose: () => void;
  gradeYear: number;
  weekInYear: number;
  stats: GameStats;
  onExecuteTurn: (selectedActions: WeeklyActionItem[], preferredEventCategory?: EventCategory) => void;
  onJumpToWeek: (targetYear: number, targetWeek: number, label: string) => void;
}

export const WeeklySchedulerModal: React.FC<WeeklySchedulerModalProps> = ({
  onClose,
  gradeYear,
  weekInYear,
  stats,
  onExecuteTurn,
  onJumpToWeek,
}) => {
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'act_study_class',
    'act_club_practice',
    'act_rest_sleep',
  ]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [preferredEventCat, setPreferredEventCat] = useState<EventCategory | undefined>(undefined);

  const selectedActions = selectedIds
    .map((id) => WEEKLY_ACTIONS.find((a) => a.id === id))
    .filter((a): a is WeeklyActionItem => Boolean(a));

  const totalStaminaDelta = selectedActions.reduce((acc, item) => acc - item.staminaCost, 0);
  const projectedStamina = Math.min(100, Math.max(0, stats.stamina + totalStaminaDelta));

  const handleToggleSlot = (actionId: string) => {
    if (selectedIds.length < 3) {
      setSelectedIds([...selectedIds, actionId]);
    } else {
      setSelectedIds([selectedIds[1], selectedIds[2], actionId]);
    }
  };

  const applyPreset = (ids: string[]) => {
    setSelectedIds(ids);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-3xl w-full max-h-[94dvh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#57534b] to-[#6e695f] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between text-white border-b border-[#9c9589]">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d68e] shrink-0" />
            <div>
              <h2 className="text-xs sm:text-base font-bold leading-tight">
                每周行动排程 · 高{gradeYear}第{weekInYear}/36周
              </h2>
              <p className="text-[10px] text-[#e6dfd5] hidden sm:block">
                {weekInfo.calendarYear}年{weekInfo.month}月 · 每周零花钱 ₩{stats.allowance.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div
          className="p-3 sm:p-5 overflow-y-auto overscroll-contain space-y-4 flex-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Exam or Seasonal Milestone Banner */}
          {weekInfo.milestoneExam && (
            <div className="bg-gradient-to-r from-[#8c3b3b] to-[#b05252] text-white rounded-xl p-3 flex items-center justify-between shadow-md">
              <div>
                <div className="text-xs font-bold text-amber-200 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>本周学制重点大考周！推进本周将自动进行考场结算</span>
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

          {/* 3 Weekly Action Slots */}
          <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="text-xs sm:text-sm font-bold text-[#3d352b]">
                📌 本周已排程的 3 个行动槽位（预计周日剩余体力：
                <span className={projectedStamina < 25 ? 'text-rose-600 font-black' : 'text-emerald-700 font-black'}>
                  {projectedStamina}/100
                </span>
                ）
              </div>
              {/* Quick 1-Click Presets */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => applyPreset(['act_study_class', 'act_study_daechi', 'act_study_library'])}
                  className="px-2 py-0.5 bg-[#dcd4c5] hover:bg-[#cec4b2] rounded text-[11px] font-bold text-[#3d352b] cursor-pointer"
                >
                  🔥 SKY考霸冲刺
                </button>
                <button
                  onClick={() => applyPreset(['act_club_competition', 'act_social_sns', 'act_work_model'])}
                  className="px-2 py-0.5 bg-[#dcd4c5] hover:bg-[#cec4b2] rounded text-[11px] font-bold text-[#3d352b] cursor-pointer"
                >
                  🌟 练习生/网红路线
                </button>
                <button
                  onClick={() => applyPreset(['act_study_class', 'act_family_dinner', 'act_rest_jjimjilbang'])}
                  className="px-2 py-0.5 bg-[#dcd4c5] hover:bg-[#cec4b2] rounded text-[11px] font-bold text-[#3d352b] cursor-pointer"
                >
                  🏡 家庭与回血
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0, 1, 2].map((slotIdx) => {
                const act = selectedActions[slotIdx];
                const slotNames = ['周中课后行动', '周五傍晚行动', '周末全天行动'];
                return (
                  <div
                    key={slotIdx}
                    className="bg-[#fdfbf7] border-2 border-[#b8ae9c] rounded-xl p-2.5 flex items-center justify-between shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-[#7a7062]">{slotNames[slotIdx]}</div>
                      {act ? (
                        <>
                          <div className="text-xs sm:text-sm font-bold text-[#2b2620] truncate mt-0.5">
                            {act.icon} {act.name}
                          </div>
                          <div className="text-[10px] text-[#5c6e58] font-bold mt-0.5">
                            体力 {act.staminaCost > 0 ? `-${act.staminaCost}` : `+${Math.abs(act.staminaCost)}`}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-[#9c9284] mt-1">点击下方行动卡添加</div>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#6d8c74] shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === cat.id
                    ? 'bg-[#57534b] text-white shadow-xs'
                    : 'bg-[#e6dfd3] text-[#4a4238] hover:bg-[#dad1c2]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {filteredActions.map((act) => {
              const countSelected = selectedIds.filter((id) => id === act.id).length;
              return (
                <button
                  key={act.id}
                  onClick={() => handleToggleSlot(act.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    countSelected > 0
                      ? 'bg-[#fcf8ef] border-2 border-[#8c6d3b] shadow-sm'
                      : 'bg-white/90 hover:bg-white border-[#d6cfc2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-[#2b2620]">
                        {act.icon} {act.name}
                      </span>
                      {countSelected > 0 && (
                        <span className="bg-[#8c6d3b] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          已选x{countSelected}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6e6558] mt-1 line-clamp-2 leading-snug">{act.desc}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-[#eee8dc] flex items-center justify-between text-[10px] font-bold">
                    <span className={act.staminaCost > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {act.staminaCost > 0 ? `消耗体力 -${act.staminaCost}` : `恢复体力 +${Math.abs(act.staminaCost)}`}
                    </span>
                    <span className="text-[#4a6b53]">[{act.categoryLabel}]</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Event Focus Selector + Fast-Forward Time Jump */}
          <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#3d352b]">
                🎭 本周剧情侧重方向（默认按季节与行程随机触发220+事件）：
              </span>
              <select
                value={preferredEventCat || ''}
                onChange={(e) =>
                  setPreferredEventCat((e.target.value || undefined) as EventCategory | undefined)
                }
                className="bg-white border border-[#b8ae9c] rounded-lg px-2.5 py-1 text-xs font-bold text-[#2b2620]"
              >
                <option value="">🎲 智能匹配当前季节与校园剧情 (推荐)</option>
                {(Object.keys(EVENT_CATEGORY_LABELS) as EventCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {EVENT_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Safe Current-Year Milestone Jumps (No accidental skip to Year 3 ending) */}
            <div className="pt-2 border-t border-[#d6cec0] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-[#5e5548] font-medium flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-[#8c6d3b]" />
                <span>本学年（高{gradeYear}）重点日程快捷定位（不跨学年，避免过快结局）：</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onJumpToWeek(gradeYear, 6, `已定位至高${gradeYear}第一学期期中考试周（第6周）`)}
                  className="px-2 py-1 bg-white hover:bg-[#f5ebd6] border border-[#bfb6a6] rounded text-[11px] font-bold cursor-pointer"
                >
                  4月期中考(第6周)
                </button>
                <button
                  onClick={() => onJumpToWeek(gradeYear, 9, `已定位至高${gradeYear}五月修学旅行/社团联赛周（第9周）`)}
                  className="px-2 py-1 bg-white hover:bg-[#f5ebd6] border border-[#bfb6a6] rounded text-[11px] font-bold cursor-pointer"
                >
                  5月修学旅行(第9周)
                </button>
                <button
                  onClick={() => onJumpToWeek(gradeYear, 18, `已定位至高${gradeYear}盛夏暑假集训期（第18周）`)}
                  className="px-2 py-1 bg-white hover:bg-[#f5ebd6] border border-[#bfb6a6] rounded text-[11px] font-bold cursor-pointer"
                >
                  8月暑假合宿(第18周)
                </button>
                <button
                  onClick={() => onJumpToWeek(gradeYear, 26, `已定位至高${gradeYear}十月玫瑰校园祭周（第26周）`)}
                  className="px-2 py-1 bg-white hover:bg-[#f5ebd6] border border-[#bfb6a6] rounded text-[11px] font-bold cursor-pointer"
                >
                  10月校园祭(第26周)
                </button>
                <button
                  onClick={() => onJumpToWeek(gradeYear, 32, `已定位至高${gradeYear}十二月初雪季（第32周）`)}
                  className="px-2 py-1 bg-white hover:bg-[#f5ebd6] border border-[#bfb6a6] rounded text-[11px] font-bold cursor-pointer"
                >
                  12月初雪季(第32周)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Execute Button */}
        <div className="px-4 py-3 bg-[#e6dfd3] border-t border-[#cfc7b8] flex flex-wrap items-center justify-between gap-3">
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
            <span className="text-xs text-[#4a4238] hidden sm:inline">
              零花钱: <span className="font-bold text-emerald-700">+₩{stats.allowance.toLocaleString()}</span>
            </span>
          </div>

          <button
            onClick={() => {
              onExecuteTurn(selectedActions, preferredEventCat);
              onClose();
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#5c7a67] to-[#425c4b] hover:from-[#698a75] hover:to-[#4f6e5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#f5d68e]" />
            <span>开始执行本周行动回合 (推进至下一周)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
