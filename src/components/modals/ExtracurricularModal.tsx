import React from 'react';
import {
  X,
  Activity,
  Coffee,
  ShoppingBag,
  Music,
  BookMarked,
  Sparkles,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { GameStats, AIConfig } from '../../types';
import { ActionEventCategory } from '../../services/aiService';

interface ExtracurricularModalProps {
  onClose: () => void;
  stats: GameStats;
  aiConfig?: AIConfig;
  weeklyCompletedActions?: string[];
  onRecordJobDone?: () => void;
  lastJobTurnKey?: string;
  currentTurnKey?: string;
  onNotify: (msg: string) => void;
  onUpdateStats?: (newSt: Partial<GameStats>) => void;
  onShowResultModal?: (data: any) => void;
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

export const ExtracurricularModal: React.FC<ExtracurricularModalProps> = ({
  onClose,
  stats,
  weeklyCompletedActions = [],
  onRecordJobDone,
  onNotify,
  onTriggerActionEvent,
}) => {
  const isJobOrEndorsementDone = weeklyCompletedActions.includes('weekly_parttime_or_endorsement');

  const activities = [
    {
      id: 'convenience',
      weeklyActionKey: 'weekly_parttime_or_endorsement',
      category: 'part_time_job' as ActionEventCategory,
      name: '汉江公园 GS25 便利店兼职',
      desc: '放学后在汉江边的便利店整理货架与收银，实时触发高峰期兼职突发事件与应对抉择。',
      reward: '基础薪水 +₩120,000 · 社交 +2',
      cost: '体力 -20 · 兼职/代言每周限 1 次',
      minStamina: 20,
      minCoins: 0,
      baseDeltas: { coins: 120000, social: 2, stamina: -20 },
      memoryLog: '在汉江公园便利店完成兼职打工，靠自己努力赚取了丰厚薪水。',
      location: '汉江公园 GS25 便利店',
      icon: ShoppingBag,
    },
    {
      id: 'endorsement',
      weeklyActionKey: 'weekly_parttime_or_endorsement',
      category: 'endorsement' as ActionEventCategory,
      name: '高奢品牌 & 韩国潮牌商业代言拍摄',
      desc: '受邀前往江南顶级摄影棚拍摄高奢美妆与潮牌代言大片，应对片场突发状况展现镜头统治力。',
      reward: '基础代言费 +₩280,000 · 粉丝 +3,500 · 外形 +5',
      cost: '体力 -20 · 兼职/代言每周限 1 次',
      minStamina: 20,
      minCoins: 0,
      baseDeltas: {
        coins: 280000,
        snsFollowers: 3500,
        appearance: 5,
        cameraSkill: 4,
        stamina: -20,
      },
      memoryLog: '前往江南摄影棚接洽高奢品牌代言拍摄，镜头表现力技惊四座。',
      location: '江南清潭洞顶级摄影棚',
      icon: Camera,
    },
    {
      id: 'study_cafe',
      weeklyActionKey: 'weekly_study_tutoring',
      category: 'tutoring_exam' as ActionEventCategory,
      name: '大峙洞王牌补习班 (학원) 重点学科补习',
      desc: '前往首尔最著名的大峙洞补习街参加名师夜间重点特训，触发压轴真题攻坚事件。',
      reward: '学业 +9',
      cost: '体力 -20 · 学费 ₩45,000 · 重点补习每周限 1 次',
      minStamina: 20,
      minCoins: 45000,
      baseDeltas: { academics: 9, stamina: -20, coins: -45000 },
      memoryLog: '在大峙洞王牌补习班度过高强度刷题夜，学业实力显著精进。',
      location: '大峙洞名师补习学院',
      icon: BookMarked,
    },
    {
      id: 'karaoke',
      weeklyActionKey: 'weekly_extra_karaoke',
      category: 'map_explore' as ActionEventCategory,
      name: '弘大投币练歌房 (코인노래방)',
      desc: '和同班好友一起去弘大街头唱K，尽情飙歌释放课业压力并触发练歌房偶遇剧情。',
      reward: '心情 +18 · 社交 +5',
      cost: '体力 -10 · 费用 ₩15,000 · 每周限 1 次',
      minStamina: 10,
      minCoins: 15000,
      baseDeltas: { mood: 18, social: 5, stamina: -10, coins: -15000 },
      memoryLog: '和好友在弘大投币练歌房尽情飙歌，释放了所有的备考压力。',
      location: '弘大街头投币练歌房',
      icon: Music,
    },
    {
      id: 'bakery',
      weeklyActionKey: 'weekly_extra_bakery',
      category: 'map_explore' as ActionEventCategory,
      name: '圣水洞网红咖啡厅打卡',
      desc: '品尝精致的草莓可颂与冰美式，拍下氛围感满满的制服日常照并触发街拍插曲。',
      reward: '心情 +14 · 外形 +4',
      cost: '费用 ₩32,000 · 每周限 1 次',
      minStamina: 0,
      minCoins: 32000,
      baseDeltas: { mood: 14, appearance: 4, coins: -32000 },
      memoryLog: '在圣水洞网红咖啡厅享受下午茶与拍照，时尚度与心情大增。',
      location: '圣水洞潮牌咖啡厅',
      icon: Coffee,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99] shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#f0e6d2] shrink-0" />
            <div>
              <h2 className="text-xs sm:text-base font-bold tracking-wide">
                首尔校外活动、兼职打工与商业代言
              </h2>
              <p className="text-[10px] text-[#e3ded6]">
                兼职打工/商业代言每周限 1 次 · 重点学科补习每周限 1 次 · 强制触发 AI 动态事件与抉择
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-3 sm:p-4 overflow-y-auto touch-scroll overscroll-contain space-y-2.5 bg-[#e2dbd0]/60 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isJobOrEndorsementDone && (
            <div className="bg-amber-100/90 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>本周【兼职打工 / 商业代言】配额已完成，推进至下一周后自动重置！</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activities.map((item) => {
              const Icon = item.icon;
              const isDoneThisWeek = weeklyCompletedActions.includes(item.weeklyActionKey);

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs ${
                    isDoneThisWeek
                      ? 'bg-[#e8e2d8] border-[#d4cdbf] opacity-85'
                      : 'bg-[#f7f4ee] border-[#cfc8ba]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#efe8d8] border border-[#d8cbb0] flex items-center justify-center text-[#7d6338] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-[#2b2620] truncate">
                          {item.name}
                        </h3>
                        <div className="text-[11px] text-[#4e7a56] font-bold">{item.reward}</div>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#4a4237] leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="text-[10px] sm:text-[11px] text-[#6e6558] bg-[#ece6db] px-2 py-1 rounded-lg border border-[#d6cfc2] flex items-center justify-between">
                      <span>{item.cost}</span>
                    </div>
                  </div>

                  <button
                    disabled={isDoneThisWeek}
                    onClick={() => {
                      if (isDoneThisWeek) return;
                      if (item.minStamina > 0 && stats.stamina < item.minStamina) {
                        onNotify(`体力不足 ${item.minStamina} 点，请先休息补充精力！`);
                        return;
                      }
                      if (item.minCoins > 0 && stats.coins < item.minCoins) {
                        onNotify(`韩元不足 ₩${item.minCoins.toLocaleString()}！`);
                        return;
                      }
                      onTriggerActionEvent({
                        weeklyActionKey: item.weeklyActionKey,
                        actionCategory: item.category,
                        actionName: item.name,
                        location: item.location,
                        baseDeltas: item.baseDeltas,
                        memoryLog: item.memoryLog,
                        onExtraComplete:
                          item.weeklyActionKey === 'weekly_parttime_or_endorsement'
                            ? onRecordJobDone
                            : undefined,
                      });
                    }}
                    className={`w-full py-2 px-3 border rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                      isDoneThisWeek
                        ? 'bg-stone-300 border-stone-400 text-stone-600 cursor-not-allowed'
                        : 'bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border-[#efe7d6] text-[#383020] cursor-pointer'
                    }`}
                  >
                    {isDoneThisWeek ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>本周已完成（下周重置）</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>立即前往体验 (触发AI事件)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
