import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  Coins,
  Zap,
  BookOpen,
  Smile,
  Shield,
  Loader2,
  ChevronRight,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { GameStats } from '../../types';
import { ActionInteractiveChoice } from '../../services/aiService';

export interface ChoiceResultData {
  title: string;
  description: string;
  sceneDescription?: string;
  locationName?: string;
  npcName?: string;
  npcRole?: string;
  isLoading?: boolean;
  loadingActionName?: string;
  loadingLocationName?: string;
  loadingNpcName?: string;
  interactiveEvent?: any;
  choices?: ActionInteractiveChoice[];
  deltas?: Partial<GameStats>;
  favorabilityChanges?: { npcId: string; npcName?: string; amount: number }[];
  memoryLog?: string;
  onConfirm: (selectedChoice?: ActionInteractiveChoice) => void;
  onConfirmInteractiveChoice?: (selectedChoice: ActionInteractiveChoice) => void;
  onCancel?: () => void;
}

export const ChoiceResultModal: React.FC<{ data: ChoiceResultData }> = ({ data }) => {
  const {
    title,
    description,
    sceneDescription,
    locationName,
    npcName,
    npcRole,
    isLoading = false,
    choices = [],
    deltas = {},
    favorabilityChanges = [],
    memoryLog,
    onConfirm,
  } = data;

  const [selectedChoice, setSelectedChoice] = useState<ActionInteractiveChoice | null>(null);

  // Reset selectedChoice whenever a new modal interaction starts
  useEffect(() => {
    setSelectedChoice(null);
  }, [title, isLoading, sceneDescription, choices.length]);

  const statLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    academics: { label: '学业实力', icon: <BookOpen className="w-4 h-4" />, color: 'text-indigo-600' },
    stamina: { label: '体力', icon: <Zap className="w-4 h-4" />, color: 'text-amber-600' },
    mood: { label: '心情状态', icon: <Smile className="w-4 h-4" />, color: 'text-emerald-600' },
    social: { label: '社交魅力', icon: <Heart className="w-4 h-4" />, color: 'text-rose-600' },
    appearance: { label: '外貌穿搭', icon: <Sparkles className="w-4 h-4" />, color: 'text-pink-600' },
    family: { label: '家庭关系', icon: <Shield className="w-4 h-4" />, color: 'text-blue-600' },
    coins: { label: '韩元现金 (₩)', icon: <Coins className="w-4 h-4" />, color: 'text-amber-700' },
    allowance: { label: '每周零花钱', icon: <Coins className="w-4 h-4" />, color: 'text-amber-700' },
    snsFollowers: { label: 'SNS 粉丝', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-600' },
    clubSkill: { label: '社团实力', icon: <Sparkles className="w-4 h-4" />, color: 'text-cyan-600' },
    clubTeamwork: { label: '团队默契', icon: <Heart className="w-4 h-4" />, color: 'text-sky-600' },
    clubStagePower: { label: '赛场表现', icon: <Sparkles className="w-4 h-4" />, color: 'text-rose-600' },
    traineeProgress: { label: '出道准备度', icon: <Sparkles className="w-4 h-4" />, color: 'text-rose-500' },
    vocalSkill: { label: '声乐 Vocal', icon: <Sparkles className="w-4 h-4" />, color: 'text-rose-600' },
    danceSkill: { label: '舞蹈 Dance', icon: <Sparkles className="w-4 h-4" />, color: 'text-indigo-600' },
    rapSkill: { label: '说唱 Rap', icon: <Sparkles className="w-4 h-4" />, color: 'text-amber-600' },
    cameraSkill: { label: '镜头表现力', icon: <Sparkles className="w-4 h-4" />, color: 'text-fuchsia-600' },
    darkIndex: { label: '心理压力值', icon: <Zap className="w-4 h-4" />, color: 'text-neutral-700' },
  };

  // Determine current step: 'loading' -> 'choose' -> 'result'
  const hasInteractiveChoices = Array.isArray(choices) && choices.length > 0;
  const currentStep: 'loading' | 'choose' | 'result' = isLoading
    ? 'loading'
    : hasInteractiveChoices && !selectedChoice
    ? 'choose'
    : 'result';

  const effectiveDeltas = selectedChoice ? selectedChoice.deltas : deltas;
  const activeDeltas = Object.entries(effectiveDeltas || {}).filter(
    ([_, val]) => typeof val === 'number' && val !== 0
  );

  const effectiveFavChanges =
    selectedChoice && selectedChoice.favDelta && selectedChoice.favDelta !== 0
      ? [
          {
            npcId: favorabilityChanges[0]?.npcId || 'npc_1',
            npcName: npcName || favorabilityChanges[0]?.npcName || '同伴',
            amount: selectedChoice.favDelta,
          },
        ]
      : favorabilityChanges;

  const finalOutcomeDescription = selectedChoice
    ? selectedChoice.outcomeNarrative
    : description;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#fcf9f2] border-2 border-[#e6decb] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-[#2b251e] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#534b40] via-[#6b6153] to-[#7d7262] px-4 py-3 flex items-center justify-between text-white border-b border-[#9c8f7a]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {currentStep === 'loading' ? (
                <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
              ) : currentStep === 'choose' ? (
                <Sparkles className="w-5 h-5 text-amber-300" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-200 flex items-center gap-2">
                <span>
                  {currentStep === 'loading'
                    ? '🔮 第一步：AI 正在推演现场剧情...'
                    : currentStep === 'choose'
                    ? '⚡ 第二步：现场突发剧情与应对抉择'
                    : '📌 第三步：因果后续微描写与数值结算'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold tracking-wide truncate">{title}</h2>
            </div>
          </div>

          {locationName && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-[11px] font-bold text-amber-100 shrink-0">
              <MapPin className="w-3 h-3 text-amber-300" />
              <span>{locationName}</span>
            </span>
          )}
        </div>

        {/* STEP 1: AI Real-Time Scene Deduction Loading State */}
        {currentStep === 'loading' && (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#635849] to-[#8c6d3b] flex items-center justify-center text-[#f5d68e] shadow-md animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-[#2b251e]">
                AI 正在推演现场剧情...
              </h3>
              <p className="text-xs text-[#63584a] leading-relaxed max-w-sm mx-auto">
                正在结合你当前的行动【{title}】、角色属性与在场人物
                {npcName ? `【${npcName}${npcRole ? ` · ${npcRole}` : ''}】` : ''}
                ，实时生成现场冲突描写与差异化应对抉择...
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: AI Scene Description + 2~3 Interactive Choices */}
        {currentStep === 'choose' && (
          <div className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto overscroll-contain">
            {(locationName || npcName) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                {locationName && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eae2d3] text-[#4d4336] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-700" />
                    <span>场景：{locationName}</span>
                  </span>
                )}
                {npcName && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-rose-600" />
                    <span>
                      在场人物：{npcName}
                      {npcRole ? `（${npcRole}）` : ''}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Scene Conflict Narrative */}
            <div className="bg-[#f4efe4] border-2 border-[#d6cdb8] p-4 rounded-xl text-xs sm:text-sm text-[#2b251e] leading-relaxed shadow-2xs">
              <div className="text-[11px] font-black text-amber-900 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>【现场突发状况描写】</span>
              </div>
              {sceneDescription || description}
            </div>

            {/* 2~3 Differentiated Choices */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-[#5e5548] tracking-wide">
                👇 请选择你的现场应对方式（不同性格倾向对应不同收益与代价）：
              </div>
              {choices.map((ch, idx) => (
                <button
                  key={ch.id || idx}
                  onClick={() => setSelectedChoice(ch)}
                  className="w-full text-left p-3.5 rounded-xl bg-white hover:bg-[#fdf9f0] border-2 border-[#dfd7c6] hover:border-[#8c6d3b] transition-all shadow-2xs cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs sm:text-sm font-black text-[#2b251e] group-hover:text-[#6e5227] leading-snug">
                      {ch.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#8c6d3b] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  {ch.tendencyTag && (
                    <div className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                      {ch.tendencyTag}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Causal Follow-Up Narrative + Detailed Stat Breakdown + Confirm Button */}
        {currentStep === 'result' && (
          <>
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto overscroll-contain">
              {selectedChoice && (
                <div className="bg-amber-50/90 border border-amber-300 px-3 py-2 rounded-xl text-xs font-bold text-amber-950 flex items-center justify-between gap-2">
                  <span>✅ 已选抉择：{selectedChoice.label}</span>
                </div>
              )}

              {/* Causal Outcome Narrative */}
              <div className="bg-[#f4efe4] border border-[#d6cdb8] p-3.5 rounded-xl text-xs sm:text-sm text-[#2b251e] leading-relaxed shadow-2xs whitespace-pre-line">
                <div className="text-[11px] font-black text-[#6e5a3c] mb-1">
                  🎬 【因果后续微描写】：
                </div>
                {finalOutcomeDescription}
              </div>

              {/* Stat Changes Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-black text-[#5e5548] tracking-wider uppercase">
                  📊 最终属性与状态变化明细：
                </div>

                {activeDeltas.length === 0 && effectiveFavChanges.length === 0 && (
                  <div className="text-xs text-[#7d7568] italic p-2 bg-[#f4efe4]/60 rounded-lg text-center">
                    本次选择保持了平稳状态，剧情已记录。
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {activeDeltas.map(([key, val]) => {
                    const info = statLabels[key] || {
                      label: key,
                      icon: <Sparkles className="w-4 h-4" />,
                      color: 'text-neutral-700',
                    };
                    const numVal = Number(val) || 0;
                    const isPositive =
                      key === 'darkIndex' ? numVal < 0 : numVal > 0;
                    return (
                      <div
                        key={key}
                        className="bg-white/90 border border-[#e3dccb] p-2.5 rounded-xl flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4a4238]">
                          <span className={info.color}>{info.icon}</span>
                          <span>{info.label}</span>
                        </div>
                        <div
                          className={`text-xs font-black flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {numVal > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {numVal > 0
                              ? `+${numVal.toLocaleString()}`
                              : numVal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Favorability Changes */}
                {effectiveFavChanges.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-[#635c51]">
                      💖 角色好感度与羁绊变动：
                    </div>
                    {effectiveFavChanges.map((fav, i) => (
                      <div
                        key={i}
                        className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-rose-900">
                          与 {fav.npcName || fav.npcId} 的好感度
                        </span>
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
                onClick={() => onConfirm(selectedChoice || undefined)}
                className="w-full py-2.5 bg-gradient-to-r from-[#70685c] to-[#575044] hover:from-[#7d7568] hover:to-[#635c51] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>确认完成</span>
                <CheckCircle className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
