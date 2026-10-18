import React from 'react';
import { X, Clock, Sun, Moon, BookHeart, FastForward } from 'lucide-react';
import { GameStats, MemoryEntry } from '../../types';
import { getCalendarDateString, getDynamicScheduleInfo } from '../../data/gameData';

interface TimeManagementModalProps {
  onClose: () => void;
  currentDay: number;
  clockMinutes: number;
  weather: string;
  stats: GameStats;
  memories: MemoryEntry[];
  onAdvanceMinutes: (mins: number, label?: string) => void;
  onJumpToClock: (targetMinutes: number, label: string) => void;
  onRestAndSleep: () => void;
}

export const TimeManagementModal: React.FC<TimeManagementModalProps> = ({
  onClose,
  currentDay,
  clockMinutes,
  weather,
  stats,
  memories,
  onAdvanceMinutes,
  onJumpToClock,
  onRestAndSleep,
}) => {
  const cal = getCalendarDateString(currentDay, clockMinutes);
  const sched = getDynamicScheduleInfo(currentDay, clockMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#f0e6d2]" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide">时间推移控制与校园记忆手帐</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 sm:p-5 overflow-y-auto touch-scroll overscroll-contain space-y-4 bg-[#e2dbd0]/60 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Current Clock Card */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] p-4 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="text-xs text-[#6e6558] font-bold">
                首尔女子高中 · 第一学期 (天气：{weather})
              </div>
              <div className="text-lg sm:text-xl font-black text-[#2b2620]">
                {cal.month}月{cal.date}日 · {cal.weekdayName} · {cal.clockStr}
              </div>
              <div className="text-xs text-[#7d6338] font-bold">
                当前阶段：{sched.headerTitle}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6e6558]">当前体力</div>
              <div className="text-lg font-black text-[#4e7a56] tabular-nums">{stats.stamina}/100</div>
            </div>
          </div>

          {/* Realistic Time Progression Controls */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5a5246]">精细时间推移操作：</div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onAdvanceMinutes(15, '在走廊课间小憩了 15 分钟');
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#f7f4ee] hover:bg-white border border-[#cfc8ba] rounded-xl text-xs font-bold text-[#2b2620] flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8c6d3b]" /> 课间小憩 (+15分)
                </span>
                <span className="text-[11px] text-[#4e7a56]">体力+4</span>
              </button>

              <button
                onClick={() => {
                  onAdvanceMinutes(50, '推进了一节课的时间 (+50分钟)');
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#f7f4ee] hover:bg-white border border-[#cfc8ba] rounded-xl text-xs font-bold text-[#2b2620] flex items-center justify-between shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-[#8c6d3b]" /> 推进一节课 (+50分)
                </span>
                <span className="text-[11px] text-[#6e5f45]">学业+4</span>
              </button>

              {clockMinutes < 720 && (
                <button
                  onClick={() => {
                    onJumpToClock(725, '时间来到了 12:05 午休午餐时段');
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] rounded-xl text-xs font-bold text-[#383020] flex items-center justify-between shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FastForward className="w-3.5 h-3.5" /> 快进至午休 (12:05)
                  </span>
                  <span className="text-[10px]">午餐时间</span>
                </button>
              )}

              {clockMinutes < 930 && (
                <button
                  onClick={() => {
                    onJumpToClock(930, '放学铃声响起，时间来到了 15:30 放学后时段');
                    onClose();
                  }}
                  className="py-2.5 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] rounded-xl text-xs font-bold text-[#383020] flex items-center justify-between shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FastForward className="w-3.5 h-3.5" /> 快进至放学 (15:30)
                  </span>
                  <span className="text-[10px]">自由活动</span>
                </button>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onRestAndSleep();
              }}
              className="w-full py-3 px-4 bg-gradient-to-b from-[#7d7261] to-[#655b4d] hover:from-[#8c806e] hover:to-[#736858] border border-[#9c9283] text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-sm cursor-pointer mt-1"
            >
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#f5d68e]" />
                <span>结束今天 · 回家洗漱睡觉（进入明天 08:00 早自习前）</span>
              </div>
              <span className="text-[11px] bg-black/25 px-2 py-0.5 rounded text-[#f5e8c7]">体力回满 100</span>
            </button>
          </div>

          {/* Episodic Memory Chronicle */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="text-xs font-bold text-[#5c4a2c] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookHeart className="w-4 h-4 text-[#8c5e14]" />
                <span>李秀妍的校园记忆编年史（AI 剧情与同学对话均会参考以下记忆）</span>
              </span>
              <span className="text-[11px] text-[#7a7164]">共 {memories.length} 条</span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {memories
                .slice()
                .reverse()
                .map((m) => (
                  <div
                    key={m.id}
                    className="bg-[#ece6db]/80 border border-[#dfd9ce] rounded-lg px-3 py-2 text-xs text-[#3a332a] leading-relaxed"
                  >
                    <span className="font-bold text-[#7d6338] mr-1.5">[{m.dateStr}]</span>
                    <span>{m.summary}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#c7c0b3] hover:bg-[#b8b0a2] text-[#2b2620] rounded-xl text-xs font-bold cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
