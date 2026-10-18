import React, { useState } from 'react';
import { RandomEvent, GameStats } from '../../types';
import { Sparkles, CheckCircle } from 'lucide-react';

interface EventModalProps {
  event: RandomEvent;
  onResolve: (
    effect: Partial<GameStats>,
    favorabilityChange?: { npcId: string; amount: number },
    memoryLog?: string
  ) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onResolve }) => {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<Partial<GameStats>>({});
  const [selectedFav, setSelectedFav] = useState<{ npcId: string; amount: number } | undefined>(undefined);
  const [selectedMemLog, setSelectedMemLog] = useState<string | undefined>(undefined);

  const handleSelectOption = (opt: typeof event.options[0]) => {
    setResultMessage(opt.resultText);
    setSelectedEffect(opt.effect || {});
    const favObj = opt.effect?.favorabilityChange
      ? opt.effect.favorabilityChange
      : opt.effect?.npcId && opt.effect?.favDelta
      ? { npcId: opt.effect.npcId, amount: opt.effect.favDelta }
      : undefined;
    setSelectedFav(favObj);
    setSelectedMemLog(opt.memoryLog || `${event.title}：${opt.text}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-lg max-h-[90dvh] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden text-[#2b2620] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-[#57534b] to-[#756e62] border-b border-[#b5ab99] flex flex-col gap-1 text-white shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold bg-[#f5d68e] text-[#3d3017] px-2 py-0.5 rounded-full">
              {event.categoryLabel || (event.isAIGenerated ? 'AI 动态推演剧情' : '校园生活剧情')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#f5d68e] shrink-0" />
            <h2 className="text-sm sm:text-base font-bold tracking-wide">{event.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-4 sm:p-5 space-y-3.5 bg-[#e2dbd0]/60 flex-1 overflow-y-auto touch-scroll overscroll-contain min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <p className="text-xs sm:text-sm text-[#2b2620] leading-relaxed bg-[#f7f4ee] p-4 rounded-xl border border-[#cfc8ba] shadow-2xs">
            {event.content}
          </p>

          {!resultMessage ? (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#5a5246]">请做出你的抉择:</div>
              {event.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt)}
                  className="w-full text-left py-2.5 px-3.5 bg-[#f7f4ee] hover:bg-[#fffdf9] border border-[#cfc8ba] hover:border-[#8c6d3b] rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between transition-all shadow-2xs cursor-pointer group"
                >
                  <span>{opt.text}</span>
                  <span className="text-[#8c6d3b] text-xs font-bold group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
                    选择 ▶
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#e3efe5] border border-[#b7d4bc] p-3.5 rounded-xl text-xs sm:text-sm text-[#2c4a32] leading-relaxed flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#4e7a56] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>{resultMessage}</div>
                  {selectedMemLog && (
                    <div className="text-[11px] text-[#4e7a56] font-bold pt-1">
                      📌 已记入青春手帐：{selectedMemLog}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onResolve(selectedEffect, selectedFav, selectedMemLog)}
                className="w-full py-2.5 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
              >
                确认并继续校园生活
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
