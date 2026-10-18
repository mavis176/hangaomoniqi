import React from 'react';
import { Sparkles, CheckCircle, ArrowUpRight, ArrowDownRight, Heart, Coins, Zap, BookOpen, Smile, Shield } from 'lucide-react';
import { GameStats } from '../../types';

export interface ChoiceResultData {
  title: string;
  description: string;
  deltas?: Partial<GameStats>;
  favorabilityChanges?: { npcId: string; npcName?: string; amount: number }[];
  memoryLog?: string;
  onConfirm: () => void;
}

export const ChoiceResultModal: React.FC<{ data: ChoiceResultData }> = ({ data }) => {
  const { title, description, deltas = {}, favorabilityChanges = [], memoryLog, onConfirm } = data;

  const statLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    academics: { label: '学业实力', icon: <BookOpen className="w-4 h-4" />, color: 'text-indigo-600' },
    stamina: { label: '体力', icon: <Zap className="w-4 h-4" />, color: 'text-amber-600' },
    mood: { label: '心情/压力', icon: <Smile className="w-4 h-4" />, color: 'text-emerald-600' },
    social: { label: '社交魅力', icon: <Heart className="w-4 h-4" />, color: 'text-rose-600' },
    appearance: { label: '外貌/穿搭', icon: <Sparkles className="w-4 h-4" />, color: 'text-pink-600' },
    family: { label: '家庭关系', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600' },
    coins: { label: '韩元现金 (₩)', icon: <Coins className="w-4 h-4" />, color: 'text-amber-700' },
    allowance: { label: '每周零花钱', icon: <Coins className="w-4 h-4" />, color: 'text-amber-700' },
    snsFollowers: { label: 'SNS 粉丝', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600' },
    clubSkill: { label: '社团特长', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-600' },
    traineeProgress: { label: '练习生实力', icon: <Sparkles className="w-4 h-4" />, color: 'text-rose-500' },
    darkIndex: { label: '黑化值', icon: <Zap className="w-4 h-4" />, color: 'text-neutral-700' },
  };

  const activeDeltas = Object.entries(deltas).filter(([_, val]) => typeof val === 'number' && val !== 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#fcf9f2] border-2 border-[#e6decb] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden text-[#2b251e] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#635c51] to-[#7d7568] px-4 py-3 flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-200">
              📌 选择/抉择结果说明弹窗
            </div>
            <h2 className="text-sm sm:text-base font-bold tracking-wide">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto overscroll-contain">
          {/* Result Description */}
          <div className="bg-[#f4efe4] border border-[#d6cdb8] p-3.5 rounded-xl text-xs sm:text-sm text-[#2b251e] leading-relaxed shadow-2xs">
            {description}
          </div>

          {/* Changes Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-black text-[#5e5548] tracking-wider uppercase">
              📊 属性与状态变化明细：
            </div>

            {activeDeltas.length === 0 && favorabilityChanges.length === 0 && (
              <div className="text-xs text-[#7d7568] italic p-2 bg-[#f4efe4]/60 rounded-lg text-center">
                本次选择暂无直接属性变动，剧情正在推进中……
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {activeDeltas.map(([key, val]) => {
                const info = statLabels[key] || { label: key, icon: <Sparkles className="w-4 h-4" />, color: 'text-neutral-700' };
                const numVal = Number(val) || 0;
                const isPositive = numVal > 0;
                return (
                  <div key={key} className="bg-white/80 border border-[#e3dccb] p-2.5 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4a4238]">
                      <span className={info.color}>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                    <div className={`text-xs font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{isPositive ? `+${numVal.toLocaleString()}` : numVal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Favorability Changes */}
            {favorabilityChanges.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-[#635c51]">💖 角色好感度与羁绊变动：</div>
                {favorabilityChanges.map((fav, i) => (
                  <div key={i} className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-900">与 {fav.npcName || fav.npcId} 的好感度</span>
                    <span className="font-black text-rose-700">
                      {fav.amount > 0 ? `+${fav.amount}` : fav.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Memory Log */}
          {memoryLog && (
            <div className="bg-[#eaf1ec] border border-[#bce0c4] p-3 rounded-xl text-xs text-[#284a32] flex items-start gap-2">
              <span className="text-base">📌</span>
              <div>
                <div className="font-bold">已自动记入青春手帐</div>
                <div className="text-[11px] opacity-90 mt-0.5">{memoryLog}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Confirm Button */}
        <div className="p-3 bg-[#f0ebd9] border-t border-[#e3dccb] flex justify-end">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 bg-gradient-to-r from-[#70685c] to-[#575044] hover:from-[#7d7568] hover:to-[#635c51] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <span>确认识别并继续校园生活</span>
            <CheckCircle className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
