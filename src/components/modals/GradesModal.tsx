import React from 'react';
import { X, BookOpen, Award, Home, TrendingUp, FileCheck2, HeartHandshake } from 'lucide-react';
import { GameStats, ExamRecord } from '../../types';

interface GradesModalProps {
  onClose: () => void;
  stats: GameStats;
  examRecords?: ExamRecord[];
  onTakeExam?: (examType: 'midterm' | 'final' | 'mock' | 'csat') => void;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onNotify: (msg: string) => void;
}

export const GradesModal: React.FC<GradesModalProps> = ({
  onClose,
  stats,
  examRecords = [],
  onTakeExam,
  onUpdateStats,
  onNotify,
}) => {
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
                成绩直接影响升学评价、每周零花钱额度（当前 ₩{stats.allowance.toLocaleString()}/周）、家庭关系与最终结局
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
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-[#2b2620] flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#3b5c7a]" />
                  <span>参加全国联合学力评价 / CSAT模拟考</span>
                </div>
                <p className="text-xs text-[#5e5548] mt-1 leading-relaxed">
                  立即进行一次全真统考测验（消耗15体力）。若取得1~2等级优异成绩，将获得丰厚奖学金并上调每周零花钱！
                </p>
              </div>
              <button
                onClick={() => {
                  if (onTakeExam) {
                    onTakeExam('mock');
                  } else {
                    const bonusCoin = stats.academics >= 80 ? 40000 : 15000;
                    onUpdateStats({
                      academics: Math.min(100, stats.academics + 4),
                      stamina: Math.max(0, stats.stamina - 15),
                      coins: stats.coins + bonusCoin,
                      family: Math.min(100, stats.family + 5),
                    });
                    onNotify(`完成全国模考测验！学业+4，家庭关系+5，获得优胜奖学金 ₩${bonusCoin.toLocaleString()}！`);
                  }
                }}
                className="mt-3 w-full py-2 bg-[#4b5c6b] hover:bg-[#3d4c59] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                立即参加模考测验 (-15体力)
              </button>
            </div>

            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-[#2b2620] flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-[#7a5c3b]" />
                  <span>家庭周末夜谈 & 申请上调零花钱</span>
                </div>
                <p className="text-xs text-[#5e5548] mt-1 leading-relaxed">
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
                className="mt-3 w-full py-2 bg-[#7a6248] hover:bg-[#66513a] text-white rounded-xl text-xs font-bold cursor-pointer"
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
                随着周回合推进（第6周期中考、第12周6月模考、第15周期末考等）或点击上方按钮，你的所有大考成绩单将记录于此。
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
