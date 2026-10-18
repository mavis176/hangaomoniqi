import React, { useState } from 'react';
import { X, Award, Sparkles, Lock, CheckCircle2, Plane, HeartHandshake, RotateCcw } from 'lucide-react';
import { GameStats, NPCClassmate, GameEnding } from '../../types';
import { ALL_ENDINGS, evaluateGameEnding } from '../../data/gameData';

interface EndingsModalProps {
  onClose: () => void;
  stats: GameStats;
  npcs: NPCClassmate[];
  gradeYear: number;
  weekInYear: number;
  unlockedEndingIds: string[];
  onUnlockEnding: (endingId: string) => void;
  onResetNewGamePlus: () => void;
  onOpenLifePath?: (path?: 'idol' | 'university' | 'chaebol') => void;
}

export const EndingsModal: React.FC<EndingsModalProps> = ({
  onClose,
  stats,
  npcs,
  gradeYear,
  weekInYear,
  unlockedEndingIds,
  onUnlockEnding,
  onResetNewGamePlus,
  onOpenLifePath,
}) => {
  const [activeEnding, setActiveEnding] = useState<{
    ending: GameEnding;
    loverNpc?: NPCClassmate;
  } | null>(null);

  const handleSettleGraduation = (forceTransfer?: boolean) => {
    const res = evaluateGameEnding(stats, npcs, forceTransfer);
    onUnlockEnding(res.primaryEnding.id);
    setActiveEnding({
      ending: res.primaryEnding,
      loverNpc: res.loverNpc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a4338] to-[#695e4e] px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between text-white border-b border-[#9c9589] shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d68e] shrink-0" />
            <div>
              <h2 className="text-xs sm:text-base font-bold">
                毕业图鉴与结局结算 ({unlockedEndingIds.length}/13)
              </h2>
              <p className="text-[10px] text-[#e6dfd5] hidden sm:block">
                当前：高{gradeYear}第{weekInYear}周 · 预览或触发结局结算
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
          className="p-3 sm:p-5 pb-10 overflow-y-auto touch-scroll overscroll-contain space-y-4 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Active Ending Cinematic Epilogue Display */}
          {activeEnding ? (
            <div className="bg-gradient-to-br from-[#2b2620] via-[#3d352c] to-[#1f1b17] text-[#fdfbf7] rounded-2xl p-5 sm:p-7 border-2 border-[#d4b982] shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${activeEnding.ending.badgeColor} text-white shadow-md`}
                >
                  {activeEnding.ending.code} · {activeEnding.ending.category}
                </span>
                <span className="text-xs text-[#d4b982] font-mono">
                  {activeEnding.ending.koreanTitle}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#f7e4b5] tracking-wide">
                {activeEnding.ending.title}
              </h3>

              <p className="text-sm sm:text-base text-[#f0ebe1] font-bold bg-white/10 p-3.5 rounded-xl border border-white/15">
                {activeEnding.ending.summary}
              </p>

              <div className="text-xs sm:text-sm text-[#e6dfd5] leading-relaxed space-y-2 bg-black/25 p-4 rounded-xl border border-white/10">
                <div className="text-[#f5d68e] font-bold mb-1">📜 毕业终章 · 未来物语：</div>
                <p>{activeEnding.ending.epilogue}</p>
              </div>

              {activeEnding.loverNpc && activeEnding.loverNpc.favorability >= 75 && (
                <div className="bg-rose-950/50 border border-rose-400/40 rounded-xl p-3.5 flex items-center gap-3">
                  <img
                    src={activeEnding.loverNpc.avatar}
                    alt={activeEnding.loverNpc.chineseName}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-rose-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs leading-relaxed">
                    <div className="font-bold text-rose-200 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-rose-300" />
                      <span>
                        羁绊同行人：{activeEnding.loverNpc.chineseName} ({activeEnding.loverNpc.relationshipStage} · 好感 {activeEnding.loverNpc.favorability}%)
                      </span>
                    </div>
                    <p className="text-rose-100/90 mt-1">
                      “从2025年春天的第一场樱花，到2027年冬天的毕业初雪，谢谢你出现在我的十七岁里。以后的每一页人生，我们继续一起写下去。”
                    </p>
                  </div>
                </div>
              )}

              {/* Three Life Paths Options after Graduation */}
              <div className="bg-gradient-to-r from-[#292219] to-[#3a3022] p-4 rounded-xl border border-[#d4af6d] space-y-2.5">
                <div className="text-xs font-bold text-[#f5d68e] flex items-center justify-between">
                  <span>🌟 毕业后的人生道路拓展（成年后续篇章）：</span>
                  <span className="text-[10px] text-[#e6ded3]">自主选择进入哪一阶段，或正常结束游戏</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('idol');
                    }}
                    className="p-2.5 bg-gradient-to-r from-purple-800 to-pink-700 hover:from-purple-900 hover:to-pink-800 rounded-xl text-left text-white shadow-sm cursor-pointer"
                  >
                    <div className="text-xs font-bold">🎤 开启【顶流爱豆生涯】</div>
                    <div className="text-[10px] text-purple-200 mt-0.5">发行专辑打歌1位、世界巡演、代言奢牌</div>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('university');
                    }}
                    className="p-2.5 bg-gradient-to-r from-blue-800 to-indigo-800 hover:from-blue-900 hover:to-indigo-900 rounded-xl text-left text-white shadow-sm cursor-pointer"
                  >
                    <div className="text-xs font-bold">🎓 开启【名门大学与精英职场】</div>
                    <div className="text-[10px] text-blue-200 mt-0.5">首尔大学、检察官/教授、结婚生子养娃</div>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('chaebol');
                    }}
                    className="p-2.5 bg-gradient-to-r from-amber-800 to-yellow-700 hover:from-amber-900 hover:to-yellow-800 rounded-xl text-left text-white shadow-sm cursor-pointer"
                  >
                    <div className="text-xs font-bold">💍 开启【财阀太太奢华模拟】</div>
                    <div className="text-[10px] text-amber-200 mt-0.5">清潭洞护肤水光、名媛慈善晚宴、大峙洞育儿</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setActiveEnding(null)}
                  className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white cursor-pointer"
                >
                  ← 返回查看全部 13 大结局图鉴
                </button>
                <button
                  onClick={() => {
                    onResetNewGamePlus();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4a953] to-[#b0832c] hover:from-[#e0b865] hover:to-[#c29338] text-[#2b2010] rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>正常结束高中生涯（开启下一周目）</span>
                </button>
              </div>
            </div>
          ) : (
            /* Life Paths Entrance Banner & Graduation Settlement Bar */
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-[#ede3d1] via-[#faeed9] to-[#ebdcc2] border-2 border-[#d9af62] rounded-xl p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm font-black text-[#3d2f1f] flex items-center gap-1.5">
                    <span>👑 三大人生进阶篇章（高中毕业后的成人故事）：</span>
                  </div>
                  <span className="text-[10px] bg-[#d9af62] text-[#2e1d05] font-extrabold px-2 py-0.5 rounded">
                    随时可开启
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('idol');
                    }}
                    className="p-2.5 bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-800 hover:to-pink-700 rounded-xl text-left text-white shadow-xs cursor-pointer flex flex-col justify-between"
                  >
                    <div className="text-xs font-black">🎤 K-Pop 顶流爱豆生涯</div>
                    <div className="text-[10px] text-purple-100 mt-0.5">发行专辑打歌1位、世界巡演、代言奢牌</div>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('university');
                    }}
                    className="p-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 rounded-xl text-left text-white shadow-xs cursor-pointer flex flex-col justify-between"
                  >
                    <div className="text-xs font-black">🎓 SKY 名门大学与精英职场</div>
                    <div className="text-[10px] text-blue-100 mt-0.5">首尔大学、检察官/教授、结婚生子养娃</div>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenLifePath) onOpenLifePath('chaebol');
                    }}
                    className="p-2.5 bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-800 hover:to-yellow-700 rounded-xl text-left text-white shadow-xs cursor-pointer flex flex-col justify-between"
                  >
                    <div className="text-xs font-black">💍 财阀太太奢华模拟器</div>
                    <div className="text-[10px] text-amber-100 mt-0.5">清潭洞护肤水光、名媛慈善晚宴、大峙洞育儿</div>
                  </button>
                </div>
              </div>

              <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#2b2620]">
                    🎓 正常达成高中毕业结局与图鉴结算
                  </div>
                  <div className="text-xs text-[#5e5548] mt-0.5">
                    不进入上述三个后续篇章？随时点击右侧立即判定当前学业({stats.academics})、社团({stats.clubSkill})、星途({stats.traineeProgress})与全向羁绊达成的毕业结局。
                  </div>
                </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSettleGraduation(false)}
                  className="px-4 py-2 bg-gradient-to-r from-[#8c6836] to-[#6b4e26] hover:from-[#9e7740] hover:to-[#7d5c2e] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#f5d68e]" />
                  <span>立即判定当前毕业结局</span>
                </button>
                <button
                  onClick={() => handleSettleGraduation(true)}
                  disabled={stats.coins < 150000}
                  className="px-3 py-2 bg-[#5c6d7e] hover:bg-[#4c5c6b] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                  title="消耗15万韩元存款办理海外留学转校结局"
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>办理海外转校结局 (需15万)</span>
                </button>
              </div>
            </div>
            </div>
          )}

          {/* 13 Endings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_ENDINGS.map((end) => {
              const isUnlocked = unlockedEndingIds.includes(end.id);
              return (
                <div
                  key={end.id}
                  onClick={() => {
                    if (isUnlocked) {
                      setActiveEnding({ ending: end });
                    }
                  }}
                  className={`rounded-xl p-3.5 border transition-all ${
                    isUnlocked
                      ? 'bg-white border-2 border-[#b89758] shadow-sm cursor-pointer hover:scale-[1.01]'
                      : 'bg-[#ebe6dc]/80 border-[#cfc8ba]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${end.badgeColor} text-white`}
                    >
                      {end.code} · {end.category}
                    </span>
                    {isUnlocked ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 已解锁 (点击回顾)
                      </span>
                    ) : (
                      <span className="text-xs text-[#7a7062] flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> 未解锁
                      </span>
                    )}
                  </div>

                  <div className="mt-2 font-bold text-sm text-[#2b2620]">{end.title}</div>
                  <div className="text-[11px] text-[#8c7b65] font-mono">{end.koreanTitle}</div>

                  <p className="text-xs text-[#4a4238] mt-1.5 leading-snug">
                    {isUnlocked ? end.summary : '达成下方条件后进行毕业结局结算即可点亮该结局图鉴。'}
                  </p>

                  <div className="mt-2 pt-2 border-t border-[#e8e2d5] text-[11px] text-[#6e5c42] font-medium">
                    🎯 达成条件：{end.conditionDesc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
