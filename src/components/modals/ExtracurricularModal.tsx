import React, { useState } from 'react';
import {
  X,
  Activity,
  Coffee,
  ShoppingBag,
  Music,
  BookMarked,
  Sparkles,
  Loader2,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { GameStats, AIConfig } from '../../types';
import { generateDynamicNarrative } from '../../services/aiService';

interface ExtracurricularModalProps {
  onClose: () => void;
  stats: GameStats;
  aiConfig?: AIConfig;
  lastJobTurnKey?: string;
  currentTurnKey?: string;
  onRecordJobDone?: () => void;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onNotify: (msg: string) => void;
  onShowResultModal: (data: {
    title: string;
    description: string;
    deltas: Partial<GameStats>;
    memoryLog: string;
  }) => void;
}

export const ExtracurricularModal: React.FC<ExtracurricularModalProps> = ({
  onClose,
  stats,
  aiConfig,
  lastJobTurnKey,
  currentTurnKey,
  onRecordJobDone,
  onUpdateStats,
  onNotify,
  onShowResultModal,
}) => {
  const [loadingActivityId, setLoadingActivityId] = useState<string | null>(null);

  const isAlreadyWorkedToday =
    Boolean(lastJobTurnKey) && Boolean(currentTurnKey) && lastJobTurnKey === currentTurnKey;

  const activities = [
    {
      id: 'convenience',
      name: '汉江公园 GS25 便利店兼职',
      desc: '放学后在汉江边的便利店整理货架与收银，还能偶遇来买拉面的首尔市民。',
      reward: '薪水 +₩120,000 · 社交 +2',
      cost: '体力 -20',
      minStamina: 20,
      isMoneyAction: true,
      memoryLog: '在汉江公园便利店完成兼职打工，靠自己努力赚取了丰厚薪水。',
      location: '汉江公园 GS25 便利店',
      icon: ShoppingBag,
      action: async () => {
        if (isAlreadyWorkedToday) {
          onNotify('今日已完成兼职/代言，请推进日程到下一天！');
          return;
        }
        if (stats.stamina < 20) {
          onNotify('体力不足 20 点，无法进行兼职打工！请先休息补充精力。');
          return;
        }

        setLoadingActivityId('convenience');
        let finalDesc =
          '你顺利完成了汉江便利店兼职，微风拂过汉江，收银结账之余还帮迷路的小朋友指了路，靠自己努力赚取了 ₩120,000 薪水！';
        let bonusCoins = 0;

        try {
          const res = await generateDynamicNarrative({
            aiConfig,
            context: {
              sceneType: 'job_event',
              playerName: '李秀妍',
              stats,
              actionName: '汉江公园 GS25 便利店兼职',
              location: '汉江公园 GS25 便利店',
              timeContext: '放学后傍晚',
            },
          });

          if (res.narrative) {
            finalDesc = res.narrative;
            if (res.dialogue) {
              finalDesc += `\n\n💬【现场台词】: ${res.dialogue}`;
            }
            if (res.jobEvent?.encounterDesc) {
              finalDesc += `\n\n💡【打工插曲】: ${res.jobEvent.encounterDesc}`;
            }
            if (res.jobEvent?.tipGained) {
              bonusCoins = res.jobEvent.tipGained;
            }
          }
        } catch (_err) {
          console.warn('AI 兼职事件生成降级：', _err);
        } finally {
          setLoadingActivityId(null);
        }

        if (onRecordJobDone) onRecordJobDone();

        const totalEarned = 120000 + bonusCoins;
        const deltas = { coins: totalEarned, social: 2, stamina: -20 };
        onShowResultModal({
          title: '兼职打工奇遇与结算 · 汉江 GS25 便利店',
          description: finalDesc,
          deltas,
          memoryLog: `在汉江公园便利店完成兼职，获得薪水 ₩${totalEarned.toLocaleString()}。`,
        });
      },
    },
    {
      id: 'endorsement',
      name: '高奢品牌 & 韩国潮牌商业代言拍摄',
      desc: '受邀前往江南顶级摄影棚拍摄高奢美妆与潮牌代言大片，展现满分镜头魅力。',
      reward: '代言费 +₩280,000 · 粉丝 +3,500 · 外形 +5',
      cost: '体力 -20',
      minStamina: 20,
      isMoneyAction: true,
      memoryLog: '前往江南摄影棚接洽高奢品牌代言拍摄，镜头表现力技惊四座。',
      location: '江南清潭洞顶级摄影棚',
      icon: Camera,
      action: async () => {
        if (isAlreadyWorkedToday) {
          onNotify('今日已完成兼职/代言，请推进日程到下一天！');
          return;
        }
        if (stats.stamina < 20) {
          onNotify('体力不足 20 点，无法进行商业代言拍摄！');
          return;
        }

        setLoadingActivityId('endorsement');
        let finalDesc =
          '江南摄影棚聚光灯璀璨，你身着高级高定服饰在镜头前自信落座。摄影师连连拍案叫绝，品牌高层当场决定追加品牌活动分红！';
        let bonusCoins = 0;

        try {
          const res = await generateDynamicNarrative({
            aiConfig,
            context: {
              sceneType: 'endorsement_event',
              playerName: '李秀妍',
              stats,
              actionName: '高奢品牌与潮牌商业代言拍摄',
              location: '江南清潭洞顶级摄影棚',
              timeContext: '黄金拍摄档期',
            },
          });

          if (res.narrative) {
            finalDesc = res.narrative;
            if (res.dialogue) {
              finalDesc += `\n\n📸【片场台词】: ${res.dialogue}`;
            }
            if (res.jobEvent?.encounterDesc) {
              finalDesc += `\n\n💡【拍摄波折】: ${res.jobEvent.encounterDesc}`;
            }
            if (res.jobEvent?.tipGained) {
              bonusCoins = res.jobEvent.tipGained;
            }
          }
        } catch (_err) {
          console.warn('AI 代言事件生成降级：', _err);
        } finally {
          setLoadingActivityId(null);
        }

        if (onRecordJobDone) onRecordJobDone();

        const totalEarned = 280000 + bonusCoins;
        const deltas = {
          coins: totalEarned,
          snsFollowers: 3500,
          appearance: 5,
          cameraSkill: 4,
          stamina: -20,
        };
        onShowResultModal({
          title: '商业代言现场纪实与结算 · 江南清潭洞',
          description: finalDesc,
          deltas,
          memoryLog: `受邀接洽高奢品牌代言拍摄，斩获代言酬劳 ₩${totalEarned.toLocaleString()}。`,
        });
      },
    },
    {
      id: 'study_cafe',
      name: '大峙洞王牌补习班 (학원) 冲刺',
      desc: '前往首尔最著名的大峙洞补习街参加名师夜间特训，大幅提升学业水平。',
      reward: '学业 +9',
      cost: '体力 -20 · 学费 ₩45,000',
      minStamina: 20,
      isMoneyAction: false,
      memoryLog: '在大峙洞王牌补习班度过高强度刷题夜，学业实力显著精进。',
      location: '大峙洞名师补习学院',
      icon: BookMarked,
      action: async () => {
        if (stats.stamina < 20 || stats.coins < 45000) {
          onNotify('体力不足 20 或金币不足 ₩45,000！');
          return;
        }

        setLoadingActivityId('study_cafe');
        let finalDesc =
          '在大峙洞名师指导下完成高强度刷题特训，虽然有些疲惫，但对高考压轴考点的理解豁然开朗！';

        try {
          const res = await generateDynamicNarrative({
            aiConfig,
            context: {
              sceneType: 'choice_option',
              playerName: '李秀妍',
              stats,
              actionName: '大峙洞王牌补习班冲刺',
              choiceText: '高强度夜间压轴真题破解特训',
              location: '大峙洞名师补习学院',
              timeContext: '深夜22点',
            },
          });

          if (res.narrative) {
            finalDesc = res.narrative;
            if (res.dialogue) finalDesc += `\n\n💬【现场代入】: ${res.dialogue}`;
          }
        } catch (_err) {
          console.warn('AI 补习事件生成降级：', _err);
        } finally {
          setLoadingActivityId(null);
        }

        onShowResultModal({
          title: '补习冲刺结算说明 · 大峙洞',
          description: finalDesc,
          deltas: { academics: 9, stamina: -20, coins: -45000 },
          memoryLog: '在大峙洞王牌补习班度过高强度刷题夜，学业实力显著精进。',
        });
      },
    },
    {
      id: 'karaoke',
      name: '弘大投币练歌房 (코인노래방)',
      desc: '和同班好友一起去弘大街头唱K，尽情飙歌释放一天的课业压力。',
      reward: '心情 +18 · 社交 +5',
      cost: '体力 -10 · 费用 ₩15,000',
      minStamina: 10,
      isMoneyAction: false,
      memoryLog: '和好友在弘大投币练歌房尽情飙歌，释放了所有的备考压力。',
      location: '弘大街头投币练歌房',
      icon: Music,
      action: async () => {
        if (stats.stamina < 10 || stats.coins < 15000) {
          onNotify('体力或金币不足！');
          return;
        }

        setLoadingActivityId('karaoke');
        let finalDesc =
          '在弘大投币练歌房和朋友肆意合唱，烦恼随着歌声飘向夜空，心情大好！';

        try {
          const res = await generateDynamicNarrative({
            aiConfig,
            context: {
              sceneType: 'campus_encounter',
              playerName: '李秀妍',
              stats,
              actionName: '弘大投币练歌房飙歌',
              location: '弘大街头投币练歌房',
              timeContext: '周末傍晚',
            },
          });

          if (res.narrative) {
            finalDesc = res.narrative;
            if (res.dialogue) finalDesc += `\n\n🎤【合唱现场】: ${res.dialogue}`;
          }
        } catch (_err) {
          console.warn('AI 练歌房事件生成降级：', _err);
        } finally {
          setLoadingActivityId(null);
        }

        onShowResultModal({
          title: '休闲放松结算说明 · 弘大练歌房',
          description: finalDesc,
          deltas: { mood: 18, social: 5, stamina: -10, coins: -15000 },
          memoryLog: '和好友在弘大投币练歌房尽情飙歌，释放了所有的备考压力。',
        });
      },
    },
    {
      id: 'bakery',
      name: '圣水洞网红咖啡厅打卡',
      desc: '品尝精致的草莓可颂与冰美式，拍下氛围感满满的制服日常照。',
      reward: '心情 +14 · 外形 +4',
      cost: '费用 ₩32,000',
      minStamina: 0,
      isMoneyAction: false,
      memoryLog: '在圣水洞网红咖啡厅享受下午茶与拍照，时尚度与心情大增。',
      location: '圣水洞潮牌咖啡厅',
      icon: Coffee,
      action: async () => {
        if (stats.coins < 32000) {
          onNotify('金币不足！');
          return;
        }

        setLoadingActivityId('bakery');
        let finalDesc =
          '在圣水洞充满艺术气息的咖啡厅品尝甜品，度过了一个悠闲精致的下午。';

        try {
          const res = await generateDynamicNarrative({
            aiConfig,
            context: {
              sceneType: 'campus_encounter',
              playerName: '李秀妍',
              stats,
              actionName: '圣水洞网红咖啡厅打卡',
              location: '圣水洞潮牌咖啡厅',
              timeContext: '惬意下午茶时段',
            },
          });

          if (res.narrative) {
            finalDesc = res.narrative;
            if (res.dialogue) finalDesc += `\n\n☕【氛围美照】: ${res.dialogue}`;
          }
        } catch (_err) {
          console.warn('AI 咖啡厅事件生成降级：', _err);
        } finally {
          setLoadingActivityId(null);
        }

        onShowResultModal({
          title: '潮牌咖啡厅结算说明 · 圣水洞',
          description: finalDesc,
          deltas: { mood: 14, appearance: 4, coins: -32000 },
          memoryLog: '在圣水洞网红咖啡厅享受下午茶与拍照，时尚度与心情大增。',
        });
      },
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
                每日/本回合限制兼职与代言 1 次 · 需消耗体力
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
          {isAlreadyWorkedToday && (
            <div className="bg-amber-100/90 border border-amber-300 text-amber-900 px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>今日已完成该兼职/代言，请推进日程到下一天后再继续！</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activities.map((item) => {
              const Icon = item.icon;
              const isLoading = loadingActivityId === item.id;
              const isDisabled =
                isLoading || (item.isMoneyAction && isAlreadyWorkedToday);

              return (
                <div
                  key={item.id}
                  className={`border rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs ${
                    item.isMoneyAction && isAlreadyWorkedToday
                      ? 'bg-[#e8e2d8] border-[#d4cdbf] opacity-80'
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
                        <div className="text-[11px] text-[#4e7a56] font-bold">
                          {item.reward}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#4a4237] leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="text-[10px] sm:text-[11px] text-[#6e6558] bg-[#ece6db] px-2 py-1 rounded-lg border border-[#d6cfc2] flex items-center justify-between">
                      <span>消耗: {item.cost}</span>
                      {item.isMoneyAction && (
                        <span className="text-amber-800 font-bold text-[10px]">
                          限制: 1次/天
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={item.action}
                    disabled={isDisabled}
                    className={`w-full py-2 px-3 border rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                      item.isMoneyAction && isAlreadyWorkedToday
                        ? 'bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border-[#efe7d6] text-[#383020] disabled:opacity-50'
                    }`}
                  >
                    {item.isMoneyAction && isAlreadyWorkedToday ? (
                      <span>今日已完成该兼职/代言，请推进日程到下一天</span>
                    ) : isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#383020]" />
                        <span>AI 正在生成现场奇遇...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>立即前往体验</span>
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
