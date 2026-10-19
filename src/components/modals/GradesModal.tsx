import React from 'react';
import {
  X,
  BookOpen,
  Award,
  Home,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { GameStats, ExamRecord, AIConfig } from '../../types';
import { getWeekCalendarInfo } from '../../data/gameData';
import { ActionEventCategory } from '../../services/aiService';

interface GradesModalProps {
  onClose: () => void;
  stats: GameStats;
  aiConfig?: AIConfig;
  gradeYear?: number;
  weekInYear?: number;
  weeklyCompletedActions?: string[];
  onRecordExamDone?: () => void;
  examRecords?: ExamRecord[];
  onTakeExam?: (examType: 'midterm' | 'final' | 'mock' | 'csat') => void;
  onNotify: (msg: string) => void;
  onTriggerActionEvent: (params: {
    weeklyActionKey: string;
    actionCategory: ActionEventCategory;
    actionName: string;
    location: string;
    baseDeltas: Partial<GameStats>;
    memoryLog: string;
    onExtraComplete?: () => void;
  }) => void;
}

export const GradesModal: React.FC<GradesModalProps> = ({
  onClose,
  stats,
  gradeYear = 1,
  weekInYear = 1,
  weeklyCompletedActions = [],
  onRecordExamDone,
  examRecords = [],
  onTakeExam,
  onNotify,
  onTriggerActionEvent,
}) => {
  const weekInfo = getWeekCalendarInfo(gradeYear, weekInYear);
  const milestoneExam = weekInfo.milestoneExam;

  const isMockExamDone = weeklyCompletedActions.includes('weekly_mock_exam');
  const isTutoringDone = weeklyCompletedActions.includes('weekly_study_tutoring');
  const isFamilyTalkDone = weeklyCompletedActions.includes('weekly_family_talk');

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

  // 1. 模拟测验 / 阶段统考 (每周限 1 次)
  const handleExecuteMockOrMilestoneExam = () => {
    if (isMockExamDone) return;
    if (stats.stamina < 15) {
      onNotify('体力不足 15 点，无法参加模拟测验！请先休息补充精力。');
      return;
    }

    const examTitle = milestoneExam?.title || `高${gradeYear} · 第${weekInYear}周全国联合模拟测验`;
    const examType = milestoneExam?.type || 'mock';

    const variance = Math.floor(Math.random() * 5) - 1;
    const score = Math.min(100, Math.max(35, stats.academics + variance));
    const gradeRank =
      score >= 92 ? 1 : score >= 84 ? 2 : score >= 75 ? 3 : score >= 65 ? 4 : score >= 55 ? 5 : 6;
    const scholarship = gradeRank === 1 ? 50000 : gradeRank === 2 ? 25000 : 10000;
    const familyDelta = gradeRank <= 2 ? 8 : gradeRank <= 3 ? 4 : 2;
    const allowanceDelta = gradeRank === 1 ? 8000 : gradeRank === 2 ? 4000 : 1500;

    onTriggerActionEvent({
      weeklyActionKey: 'weekly_mock_exam',
      actionCategory: 'tutoring_exam',
      actionName: examTitle,
      location: '首尔女子高中第1大考场',
      baseDeltas: {
        academics: 5,
        stamina: -15,
        coins: scholarship,
        family: familyDelta,
        allowance: allowanceDelta,
      },
      memoryLog: `参加【${examTitle}】考出 ${score}分（内申第${gradeRank}等级），获得奖学金激励 ₩${scholarship.toLocaleString()}。`,
      onExtraComplete: () => {
        if (onRecordExamDone) onRecordExamDone();
        if (onTakeExam) onTakeExam(examType);
      },
    });
  };

  // 2. 重点学科补习 (每周限 1 次)
  const handleExecuteSubjectTutoring = () => {
    if (isTutoringDone) return;
    if (stats.stamina < 14) {
      onNotify('体力不足 14 点，无法进行重点学科补习！');
      return;
    }

    onTriggerActionEvent({
      weeklyActionKey: 'weekly_study_tutoring',
      actionCategory: 'tutoring_exam',
      actionName: `高${gradeYear}内申重点学科1对1补习`,
      location: '首尔女高教务特训室',
      baseDeltas: {
        academics: 7,
        family: 3,
        stamina: -14,
      },
      memoryLog: `完成了高${gradeYear}第${weekInYear}周内申重点学科补习，攻克了薄弱题型。`,
    });
  };

  // 3. 家庭周末夜谈 (每周限 1 次)
  const handleExecuteFamilyTalk = () => {
    if (isFamilyTalkDone) return;
    const allowanceBoost = stats.academics >= 75 ? 5000 : 2500;

    onTriggerActionEvent({
      weeklyActionKey: 'weekly_family_talk',
      actionCategory: 'class_study',
      actionName: '家庭周末夜谈与升学规划交流',
      location: '首尔家中客厅',
      baseDeltas: {
        family: 10,
        mood: 8,
        allowance: allowanceBoost,
        darkIndex: -10,
      },
      memoryLog: `与父母进行了深入温暖的周末家庭夜谈，家庭关系升温，每周零花钱上调 +₩${allowanceBoost.toLocaleString()}。`,
    });
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
                韩国高中学制评价 · 内申成绩单、重点学科补习与模拟测验
              </h2>
              <p className="text-[11px] text-[#e1ebf2]">
                重点学科补习与模拟测验每周各限 1 次 · 每次执行均触发 AI 现场事件与抉择弹窗
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

          {/* 3 Interactive Academic & Family Action Modules (All Weekly Cooldown = 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Mock Exam / Milestone Exam Box */}
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#2b2620] flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#3b5c7a] shrink-0" />
                    <span>模拟测验 / 阶段统考</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-900">
                    每周限1次
                  </span>
                </div>

                <p className="text-xs text-[#5e5548] mt-1.5 leading-relaxed">
                  {milestoneExam
                    ? `本周为【${milestoneExam.title}】！参加统考可赢取奖学金与零花钱上调。`
                    : '参加本周全国联合学力模拟测验（消耗15体力），检验内申排名并赢取测验奖学金！'}
                </p>
              </div>

              <button
                onClick={handleExecuteMockOrMilestoneExam}
                disabled={isMockExamDone}
                className={`mt-3 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isMockExamDone
                    ? 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
                    : 'bg-[#4b5c6b] hover:bg-[#3d4c59] text-white shadow-md cursor-pointer'
                }`}
              >
                {isMockExamDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>本周已完成（下周重置）</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{milestoneExam ? `参加【${milestoneExam.title}】` : '参加本周模拟测验 (-15体力)'}</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Key Subject Tutoring Box */}
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#2b2620] flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>重点学科补习特训</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                    每周限1次
                  </span>
                </div>

                <p className="text-xs text-[#5e5548] mt-1.5 leading-relaxed">
                  针对国语、数学、英语压轴题进行1对1专项补习（消耗14体力），触发课堂钻研抉择事件，学业+7！
                </p>
              </div>

              <button
                onClick={handleExecuteSubjectTutoring}
                disabled={isTutoringDone}
                className={`mt-3 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isTutoringDone
                    ? 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-md cursor-pointer'
                }`}
              >
                {isTutoringDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>本周已完成（下周重置）</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>开始重点学科补习 (-14体力)</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Family Conversation Box */}
            <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#2b2620] flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-[#7a5c3b] shrink-0" />
                    <span>家庭夜谈 & 零花钱申请</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    每周限1次
                  </span>
                </div>
                <p className="text-xs text-[#5e5548] mt-1.5 leading-relaxed">
                  与父母坦诚交流近期校园生活与升学规划，触发家庭对话抉择，修复隔阂并上调每周零花钱额度。
                </p>
              </div>
              <button
                onClick={handleExecuteFamilyTalk}
                disabled={isFamilyTalkDone}
                className={`mt-3 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isFamilyTalkDone
                    ? 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
                    : 'bg-[#7a6248] hover:bg-[#66513a] text-white shadow-md cursor-pointer'
                }`}
              >
                {isFamilyTalkDone ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>本周已完成（下周重置）</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>与父母温馨谈心 (+家庭 & 零花钱)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Exam History Table */}
          <div className="bg-white border border-[#d6cfc2] rounded-xl p-3.5">
            <div className="font-bold text-xs sm:text-sm text-[#2b2620] mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>历次模拟测验/期中/期末/CSAT高考成绩档案 ({examRecords.length}次记录)</span>
            </div>
            {examRecords.length === 0 ? (
              <div className="text-xs text-[#7a7062] py-4 text-center">
                点击上方【参加本周模拟测验】即可记录你的历次考场成绩单与内申等级评定。
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
                      <span className="text-[#2b4c6e]">
                        得分: {rec.score}分 ({rec.gradeRank}等级)
                      </span>
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
