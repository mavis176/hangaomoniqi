import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Award,
  Home,
  FileCheck2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GameStats, ExamRecord, AIConfig } from '../../types';
import { getWeekCalendarInfo } from '../../data/gameData';
import { generateDynamicNarrative } from '../../services/aiService';

interface GradesModalProps {
  onClose: () => void;
  stats: GameStats;
  aiConfig?: AIConfig;
  gradeYear?: number;
  weekInYear?: number;
  lastExamKey?: string;
  onRecordExamDone?: () => void;
  examRecords?: ExamRecord[];
  onTakeExam?: (examType: 'midterm' | 'final' | 'mock' | 'csat') => void;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onNotify: (msg: string) => void;
  onShowResultModal?: (data: {
    title: string;
    description: string;
    deltas: Partial<GameStats>;
    memoryLog: string;
  }) => void;
}

export const GradesModal: React.FC<GradesModalProps> = ({
  onClose,
  stats,
  aiConfig,
  gradeYear = 1,
  weekInYear = 1,
  lastExamKey,
  onRecordExamDone,
  examRecords = [],
  onTakeExam,
  onUpdateStats,
  onNotify,
  onShowResultModal,
}) => {
  const [isLoadingExam, setIsLoadingExam] = useState(false);

  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const milestoneExam = weekInfo.milestoneExam;
  const isExamWeek = Boolean(milestoneExam);

  const currentWeekKey = `${gradeYear}_${weekInYear}`;
  const isExamAlreadyTaken = Boolean(lastExamKey) && lastExamKey === currentWeekKey;

  // Korean 1~9 Grade system calculation
  const koreanGrade =
    stats.academics >= 92
      ? 1
      : stats.academics >= 84
      ? 2
      : stats.academics >= 75
      ? 3
      : stats.academics >= 65
      ? 4
      : stats.academics >= 55
      ? 5
      : 6;

  const targetUni =
    koreanGrade === 1
      ? '首尔大学 / 延世大学 / 高丽大学 (SKY名门稳取)'
      : koreanGrade === 2
      ? '成均馆 / 汉阳 / 梨花女子大学 (首尔上位圈)'
      : koreanGrade <= 4
      ? '首尔圈四年制综合大学 (In-Seoul)'
      : '地方国立大学 / 艺术与职业专科';

  const handleExecuteExam = async () => {
    if (!isExamWeek) {
      onNotify('当前非期中/期末/模考大考周，日常不可反复刷考！请推进日程至考场周。');
      return;
    }
    if (isExamAlreadyTaken) {
      onNotify('本周大考已完成，请推进日程到下一周！');
      return;
    }
    if (stats.stamina < 15) {
      onNotify('体力不足 15 点，无法参加统考！请先休息补充精力。');
      return;
    }

    setIsLoadingExam(true);

    const examTitle = milestoneExam?.title || `高${gradeYear} · 第${weekInYear}周全真统考`;
    const examType = milestoneExam?.type || 'mock';

    const variance = Math.floor(Math.random() * 5) - 1;
    const score = Math.min(100, Math.max(35, stats.academics + variance));
    const gradeRank =
      score >= 92 ? 1 : score >= 84 ? 2 : score >= 75 ? 3 : score >= 65 ? 4 : score >= 55 ? 5 : 6;

    const allowanceDelta =
      gradeRank === 1 ? 8000 : gradeRank === 2 ? 4000 : gradeRank >= 5 ? -3000 : 1000;
    const familyDelta = gradeRank <= 2 ? 8 : gradeRank <= 3 ? 4 : -5;
    const scholarship = gradeRank === 1 ? 50000 : gradeRank === 2 ? 25000 : 0;

    let finalNarrative = `考场内涂卡笔沙沙作响，你气定神闲地完成了【${examTitle}】的所有试题，斩获 ${score} 分（全校第 ${gradeRank} 等级）！`;

    try {
      const res = await generateDynamicNarrative({
        aiConfig,
        context: {
          sceneType: 'exam_event',
          playerName: '李秀妍',
          stats,
          actionName: examTitle,
          examType,
          examScore: score,
          location: '首尔女子高中第1大考场',
          timeContext: `高${gradeYear}第${weekInYear}周统考日`,
        },
      });

      if (res.narrative) {
        finalNarrative = res.narrative;
        if (res.dialogue) {
          finalNarrative += `\n\n💬【考场音效/对话】: ${res.dialogue}`;
        }
      }
    } catch (_err) {
      console.warn('AI 考试剧情生成降级：', _err);
    } finally {
      setIsLoadingExam(false);
    }

    if (onRecordExamDone) onRecordExamDone();

    const resultDeltas: Partial<GameStats> = {
      academics: Math.min(100, stats.academics + 3),
      stamina: Math.max(0, stats.stamina - 15),
      coins: stats.coins + scholarship,
      family: Math.min(100, stats.family + familyDelta),
      allowance: Math.max(10000, stats.allowance + allowanceDelta),
    };

    if (onTakeExam) {
      onTakeExam(examType);
    }

    if (onShowResultModal) {
      onShowResultModal({
        title: `全真大考结算 · ${examTitle}`,
        description: `${finalNarrative}\n\n📊【成绩单】: 考分 ${score}分 (内申第 ${gradeRank} 等级)\n💰【奖学金与零花钱】: 获得奖学金 ₩${scholarship.toLocaleString()}，每周零花钱调整为 ₩${(stats.allowance + allowanceDelta).toLocaleString()}`,
        deltas: resultDeltas,
        memoryLog: `参加了【${examTitle}】，考出 ${score}分（第${gradeRank}等级），斩获奖学金 ₩${scholarship.toLocaleString()}。`,
      });
    } else {
      onUpdateStats(resultDeltas);
      onNotify(
        `完成【${examTitle}】！得分: ${score}分 (${gradeRank}等级)，奖学金 +₩${scholarship.toLocaleString()}！`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4b5c6b] to-[#63788a] px-4 py-3 flex items-center justify-between text-white border-b border-[#8fa3b5]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#f5d68e]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                韩国高中学制评价 · 内申成绩单与家庭关系
              </h2>
              <p className="text-[11px] text-[#e1ebf2]">
                阶段性大考影响升学履历、零花钱额度（当前 ₩{stats.allowance.toLocaleString()}/周）与家庭关系
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="p-3.5 sm:p-5 pb-10 overflow-y-auto touch-scroll overscroll-contain space-y-4 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Top Academic & Family Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3.5 shadow-xs">
              <div className="text-xs text-[#6e6456] font-bold">当前内申综合等级</div>
              <div className="text-2xl font-black text-[#2b4c6e] mt-1">
                第 {koreanGrade} 等级 <span className="text-xs font-normal">({stats.academics}分)</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold mt-1">
                全国百分位 Top {Math.max(1, 100 - stats.academics)}%
              </div>
            </div>

            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3.5 shadow-xs">
              <div className="text-xs text-[#6e6456] font-bold">升学志愿竞争力评价</div>
              <div className="text-xs sm:text-sm font-black text-[#2b2620] mt-1 leading-snug">
                {targetUni}
              </div>
              <div className="text-[11px] text-[#8c7b65] mt-1">
                CSAT高考达到1等级可解锁【高考名校结局】
              </div>
            </div>

            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3.5 shadow-xs">
              <div className="text-xs text-[#6e6456] font-bold flex items-center justify-between">
                <span>🏡 家庭关系指数</span>
                <span className="text-amber-700">压力值: {stats.darkIndex}</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{stats.family}/100</div>
              <div className="text-[11px] text-[#5e5548] mt-1">
                每周零花钱：₩{stats.allowance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Interactive Exam & Family Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Exam Box */}
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-[#2b2620] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#3b5c7a]" />
                    <span>全国联合学力评价 / 阶段大考考场</span>
                  </span>
                  {isExamWeek && !isExamAlreadyTaken && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold animate-pulse">
                      大考周就绪
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5e5548] mt-1.5 leading-relaxed">
                  {isExamWeek
                    ? `当前为【${milestoneExam?.title}】！点击进行全真大考测评（消耗15体力），取得1~2等级可斩获高额奖学金与零花钱上调！`
                    : '考试属于重大阶段性节点，日常不可反复刷考。请推进日程至期中/期末/模考等统考大考周（第6/12/15/21/24/29/34周）！'}
                </p>
              </div>

              <div className="mt-3">
                <button
                  onClick={handleExecuteExam}
                  disabled={!isExamWeek || isExamAlreadyTaken || isLoadingExam}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                    !isExamWeek
                      ? 'bg-gray-300 border border-gray-400 text-gray-600 cursor-not-allowed opacity-80'
                      : isExamAlreadyTaken
                      ? 'bg-amber-200 border border-amber-300 text-amber-900 cursor-not-allowed'
                      : 'bg-[#4b5c6b] hover:bg-[#3d4c59] text-white shadow-md'
                  }`}
                >
                  {!isExamWeek ? (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>非统考大考周，日常不可反复刷考</span>
                    </span>
                  ) : isExamAlreadyTaken ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-800" />
                      <span>本周大考已完成，请推进日程</span>
                    </span>
                  ) : isLoadingExam ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>AI 正在生成全真考场微描写...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>参加【{milestoneExam?.title}】(-15体力)</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Family Conversation Box */}
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-[#2b2620] flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-[#7a5c3b]" />
                  <span>家庭周末夜谈 & 申请上调零花钱</span>
                </div>
                <p className="text-xs text-[#5e5548] mt-1.5 leading-relaxed">
                  与父母坦诚交流近期的校园生活与未来规划，修复家庭隔阂、降低备考压力，并根据学业表现提升零花钱额度。
                </p>
              </div>
              <button
                onClick={() => {
                  const allowanceBoost = stats.academics >= 75 ? 5000 : 2000;
                  onUpdateStats({
                    family: Math.min(100, stats.family + 10),
                    mood: Math.min(100, stats.mood + 8),
                    allowance: stats.allowance + allowanceBoost,
                    darkIndex: Math.max(0, stats.darkIndex - 10),
                  });
                  onNotify(
                    `与父母进行了温暖的家庭长谈！家庭关系+10，压力降低，每周零花钱上调 +₩${allowanceBoost.toLocaleString()}！`
                  );
                }}
                className="mt-3 w-full py-2.5 bg-[#7a6248] hover:bg-[#66513a] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                与父母温馨谈心 (+10家庭 & 上调零花钱)
              </button>
            </div>
          </div>

          {/* Exam History Table */}
          <div className="bg-white border border-[#d6cfc2] rounded-xl p-3.5">
            <div className="font-bold text-xs sm:text-sm text-[#2b2620] mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>历次期中/期末/模考/CSAT高考成绩档案 ({examRecords.length}次记录)</span>
            </div>
            {examRecords.length === 0 ? (
              <div className="text-xs text-[#7a7062] py-4 text-center">
                随着周回合推进（第6周期中考、第12周6月模考、第15周期末考等）在考场周参加测验，你的所有大考成绩单将记录于此。
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {examRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#f7f4ee] border border-[#e2dcd0] rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#2b2620]">{rec.examName}</span>
                      <span className="text-[#7a7062] ml-2">
                        (高{rec.year}·第{rec.week}周)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-[#2b4c6e]">得分: {rec.score}分 ({rec.gradeRank}等级)</span>
                      <span className="text-emerald-700">{rec.evaluation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
