import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  GraduationCap,
  Sparkle,
  Coins,
  TrendingUp,
  Heart,
  BookOpen,
  Award,
  Users,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { GameStats, AIConfig } from '../../types';
import { generateTimeSkipSummaryNarrative } from '../../services/aiService';

export interface TimeSkipSummaryModalProps {
  onClose: () => void;
  startWeekLabel: string;
  endWeekLabel: string;
  targetYear: number;
  targetWeek: number;
  stats: GameStats;
  protagonistName?: string;
  aiConfig?: AIConfig;
  onConfirmJump: (deltaStats: Partial<GameStats>, memoirText: string) => void;
}

export const TimeSkipSummaryModal: React.FC<TimeSkipSummaryModalProps> = ({
  onClose,
  startWeekLabel,
  endWeekLabel,
  targetYear,
  targetWeek,
  stats,
  protagonistName = '李秀妍',
  aiConfig,
  onConfirmJump,
}) => {
  const [activeTab, setActiveTab] = useState<'memoir' | 'comparison'>('memoir');
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  // Pre-calculated 4-week accumulated delta stats
  const calculatedDeltas: Partial<GameStats> = {
    coins: (stats.allowance || 20000) * 4 + Math.floor(Math.random() * 20000 + 30000),
    academics: Math.floor(Math.random() * 4 + 6),
    traineeProgress: Math.floor(Math.random() * 6 + 10),
    vocalSkill: Math.floor(Math.random() * 4 + 5),
    danceSkill: Math.floor(Math.random() * 4 + 5),
    social: Math.floor(Math.random() * 5 + 6),
    snsFollowers: Math.floor(Math.random() * 1500 + 2500),
    mood: 12,
    stamina: 85 - (stats.stamina || 50), // Restore stamina to good condition
  };

  const [narrativeData, setNarrativeData] = useState<{
    memoirNarrative: string;
    academicHighlights: string;
    socialHighlights: string;
    financialHighlights: string;
  }>({
    memoirNarrative: `这四周里，首尔女高的樱花与清潭洞练习室的日光悄然流转。在【${startWeekLabel}】至【${endWeekLabel}】的时光跨越中，【${protagonistName}】在课业复习与高强度 Dance/Vocal 特训间找到了完美的平衡。虽然日程充实紧凑，但每次路过弘大咖啡馆或汉江边的夜风，都见证着你向着顶流 C 位一步步蜕变的坚定脚印。`,
    academicHighlights: `连续 4 周深耕首尔女高重难点科目，课业成绩提升 +${calculatedDeltas.academics}；练习室特训进度提升 +${calculatedDeltas.traineeProgress}！`,
    socialHighlights: `四周内社交影响力与 SNS 粉丝新增 +${calculatedDeltas.snsFollowers?.toLocaleString()}，Bubble 站姐贴纸留言不断！`,
    financialHighlights: `四周内累计入账零花钱与生活津贴 ₩${calculatedDeltas.coins?.toLocaleString()}，体力与精神状态维持良好！`,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchNarrative = async () => {
      setIsLoadingAI(true);
      try {
        const res = await generateTimeSkipSummaryNarrative({
          startWeekLabel,
          endWeekLabel,
          deltas: calculatedDeltas,
          protagonistName,
          aiConfig,
        });
        if (isMounted) {
          setNarrativeData(res);
        }
      } catch (_e) {
        // Fallback already set in initial state
      } finally {
        if (isMounted) setIsLoadingAI(false);
      }
    };
    fetchNarrative();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConfirm = () => {
    onConfirmJump(calculatedDeltas, narrativeData.memoirNarrative);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#faf7f2] text-[#2c2621] rounded-3xl border-2 border-[#d6c7b2] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Magazine Banner */}
        <div className="bg-gradient-to-r from-[#2c2621] via-[#3d342c] to-[#251f1a] text-amber-100 p-4 sm:p-5 border-b-2 border-amber-500/40 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-[#2c2621] text-[10px] font-black tracking-wider uppercase">
                  SEOUL MEMOIR · 四周期刊
                </span>
                <span className="text-xs font-bold text-amber-200/80">
                  {startWeekLabel} ➔ {endWeekLabel}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-amber-200 mt-1 tracking-tight flex items-center gap-2">
                <span>📖 首尔演艺与校园 · 四周期刊总结</span>
              </h2>
              <p className="text-xs text-amber-100/70 mt-0.5">
                时光极速跨越 4 周沉浸式总结 · 学业手记、名利场社交与资产履历全景汇总
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-2 border-t border-amber-500/20 relative z-10">
            <button
              onClick={() => setActiveTab('memoir')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'memoir'
                  ? 'bg-amber-400 text-[#2c2621] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200'
              }`}
            >
              📜 四周时光纪实与三大板块
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-amber-400 text-[#2c2621] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-amber-200'
              }`}
            >
              📊 数值成长与属性对比
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'memoir' ? (
            <>
              {/* AI Biography-Style Memoir Retrospective Callout Box */}
              <div className="bg-gradient-to-br from-[#2c2621] via-[#3a3129] to-[#231d18] text-amber-100 p-4 rounded-2xl border border-amber-500/30 shadow-md space-y-2 relative">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
                    <span>【四周时光回顾短评 · AI 润色纪实】</span>
                  </span>
                  {isLoadingAI && (
                    <span className="text-[10px] text-amber-400 animate-pulse">
                      ✨ AI 正在为您沉浸式推演...
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium indent-4 italic">
                  “{narrativeData.memoirNarrative}”
                </p>
              </div>

              {/* Three Structured Journal Highlights */}
              <div className="space-y-3">
                {/* 1. Academic & Trainee Log */}
                <div className="bg-white border border-[#e3d8c8] rounded-2xl p-3.5 space-y-2 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs font-black text-[#3d3226] border-b border-[#f0e6d8] pb-1.5">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>【学业与练习室手记】</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-extrabold">
                      能力突破
                    </span>
                  </div>
                  <p className="text-xs text-[#524638] leading-relaxed">
                    {narrativeData.academicHighlights}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-extrabold pt-1">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      学业成绩 +{calculatedDeltas.academics}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                      练习生进度 +{calculatedDeltas.traineeProgress}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                      Vocal & Dance 技能全面加固
                    </span>
                  </div>
                </div>

                {/* 2. Social & Fan Circle Log */}
                <div className="bg-white border border-[#e3d8c8] rounded-2xl p-3.5 space-y-2 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs font-black text-[#3d3226] border-b border-[#f0e6d8] pb-1.5">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-600" />
                      <span>【名利场与社交动态】</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold">
                      饭圈反响
                    </span>
                  </div>
                  <p className="text-xs text-[#524638] leading-relaxed">
                    {narrativeData.socialHighlights}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-extrabold pt-1">
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                      SNS 新增粉丝 +{calculatedDeltas.snsFollowers?.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200">
                      社交时尚度 +{calculatedDeltas.social}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Bubble 站姐热评持续走高
                    </span>
                  </div>
                </div>

                {/* 3. Assets & Financial Log */}
                <div className="bg-white border border-[#e3d8c8] rounded-2xl p-3.5 space-y-2 shadow-2xs hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between text-xs font-black text-[#3d3226] border-b border-[#f0e6d8] pb-1.5">
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>【资产与生活变动】</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-extrabold">
                      财务充沛
                    </span>
                  </div>
                  <p className="text-xs text-[#524638] leading-relaxed">
                    {narrativeData.financialHighlights}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-extrabold pt-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      零花钱进账 +₩{calculatedDeltas.coins?.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      体力充沛度已修复至 85+
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      心情状态 +{calculatedDeltas.mood}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Comparison Grid Tab */
            <div className="space-y-3">
              <div className="bg-white border border-[#e3d8c8] rounded-2xl p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-[#3d3226] border-b border-[#f0e6d8] pb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>📊 跨越四周前后属性对照总结</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">🎓 学业实力量化</span>
                    <div className="flex items-center justify-between font-black text-blue-900">
                      <span>{stats.academics} ➔ {stats.academics + (calculatedDeltas.academics || 0)}</span>
                      <span className="text-emerald-600">+{calculatedDeltas.academics}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">👑 练习生进阶</span>
                    <div className="flex items-center justify-between font-black text-purple-900">
                      <span>{stats.traineeProgress}% ➔ {Math.min(100, stats.traineeProgress + (calculatedDeltas.traineeProgress || 0))}%</span>
                      <span className="text-emerald-600">+{calculatedDeltas.traineeProgress}%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">💰 零花钱资产余额</span>
                    <div className="flex items-center justify-between font-black text-amber-900">
                      <span>₩{stats.coins.toLocaleString()} ➔ ₩{(stats.coins + (calculatedDeltas.coins || 0)).toLocaleString()}</span>
                      <span className="text-emerald-600">+₩{calculatedDeltas.coins?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">🔥 SNS 粉丝总数</span>
                    <div className="flex items-center justify-between font-black text-rose-900">
                      <span>{stats.snsFollowers.toLocaleString()} ➔ {(stats.snsFollowers + (calculatedDeltas.snsFollowers || 0)).toLocaleString()}</span>
                      <span className="text-emerald-600">+{calculatedDeltas.snsFollowers?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">✨ 时尚社交与气场</span>
                    <div className="flex items-center justify-between font-black text-indigo-900">
                      <span>{stats.social} ➔ {Math.min(100, stats.social + (calculatedDeltas.social || 0))}</span>
                      <span className="text-emerald-600">+{calculatedDeltas.social}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#e3d8c8] space-y-1">
                    <span className="text-[11px] font-bold text-gray-500">💖 体力与心理状态</span>
                    <div className="flex items-center justify-between font-black text-emerald-900">
                      <span>已恢复至 85+ 佳境</span>
                      <span className="text-emerald-600">最佳状态</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Confirmation Button */}
        <div className="p-4 bg-[#f2e9dc] border-t border-[#dcd1c0] shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>【合上日志，开启【高{targetYear}第{targetWeek}周】新征程 ➔】</span>
          </button>
        </div>
      </div>
    </div>
  );
};
