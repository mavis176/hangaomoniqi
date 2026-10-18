import React, { useState } from 'react';
import { X, Calendar, Check, BookOpen, Clock } from 'lucide-react';
import { GameStats } from '../../types';
import { WEEKLY_TIMETABLE, WEEKDAYS, getCalendarDateString } from '../../data/gameData';

interface TimetableModalProps {
  onClose: () => void;
  stats: GameStats;
  currentDay: number;
  clockMinutes: number;
  onAttendClass: (subject: string, durationMins: number) => void;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  onClose,
  stats,
  currentDay,
  clockMinutes,
  onAttendClass,
}) => {
  const cal = getCalendarDateString(currentDay, clockMinutes);
  const initialTab = cal.weekdayIndex < 5 ? cal.weekdayIndex : 0;
  const [selectedWeekday, setSelectedWeekday] = useState<number>(initialTab);

  const courses = WEEKLY_TIMETABLE[selectedWeekday] || WEEKLY_TIMETABLE[0];
  const isTodaySelected = selectedWeekday === cal.weekdayIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#f0e6d2]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide">首尔女子高中高一(1)班 · 周课程表</h2>
              <p className="text-[11px] text-[#e6dfd3]">
                当前时间：{cal.fullLabel} {cal.weekdayIndex >= 5 ? '(周末休业日)' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Tabs */}
        <div className="px-5 py-2.5 bg-[#dfd9ce] border-b border-[#c7bfb0] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 bg-[#cfc8ba] p-1 rounded-xl">
            {[0, 1, 2, 3, 4].map((wIdx) => (
              <button
                key={wIdx}
                onClick={() => setSelectedWeekday(wIdx)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedWeekday === wIdx
                    ? 'bg-[#f7f4ee] text-[#2b2620] shadow-2xs'
                    : 'text-[#5a5246] hover:text-[#2b2620]'
                }`}
              >
                {WEEKDAYS[wIdx]}
                {cal.weekdayIndex === wIdx && ' (今日)'}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-[#5c4a2c] shrink-0">学业: {stats.academics}</span>
        </div>

        {/* Content */}
        <div
          className="p-4 sm:p-5 overflow-y-auto touch-scroll overscroll-contain space-y-2.5 bg-[#e2dbd0]/60 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {courses.map((item) => {
            const isPast = isTodaySelected && clockMinutes >= item.endMinutes;
            const isOngoing =
              isTodaySelected && clockMinutes >= item.startMinutes - 15 && clockMinutes < item.endMinutes;

            return (
              <div
                key={item.periodNumber}
                className={`bg-[#f7f4ee] border rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs ${
                  isOngoing ? 'border-[#8c6d3b] ring-1 ring-[#8c6d3b]/40' : 'border-[#cfc8ba]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-20 text-center bg-[#ece6db] border border-[#d6cfc2] rounded-lg py-1.5 px-1.5">
                    <span className="text-xs font-bold text-[#4a4237] block">第{item.periodNumber}节</span>
                    <span className="text-[10px] text-[#7a7164] tabular-nums">{item.timeLabel}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2b2620]">{item.subject}</span>
                      {isOngoing && (
                        <span className="text-[10px] bg-[#efe8d8] border border-[#d8cbb0] text-[#8c5e14] font-bold px-1.5 py-0.2 rounded">
                          当前时段
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6e6558] mt-0.5">
                      授课: {item.teacher} · 地点: {item.room}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPast ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4e7a56] bg-[#e3efe5] border border-[#b7d4bc] px-2.5 py-1 rounded-lg">
                      <Check className="w-3.5 h-3.5" /> 已下课
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onAttendClass(item.subject, 50);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] rounded-lg text-xs font-bold text-[#383020] flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isOngoing ? '立即听课 (+50分)' : '提前预习 (+30分)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Lunch & Evening Yaja fixed rows */}
          <div className="bg-[#ece6db] border border-[#cfc8ba] rounded-xl p-3 flex items-center justify-between text-xs text-[#5a5246]">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-[#7d6338]" />
              <span>12:00 - 13:00 学生食堂午餐与午休 · 18:30 - 21:00 夜间自主晚自习 (야자)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            确定
          </button>
        </div>

      </div>
    </div>
  );
};
