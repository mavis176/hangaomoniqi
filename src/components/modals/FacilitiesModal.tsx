import React from 'react';
import { X, Building, Coffee, BookOpen, Sun, ShoppingBag, CheckCircle2, Sparkles } from 'lucide-react';
import { GameStats } from '../../types';

interface FacilitiesModalProps {
  onClose: () => void;
  stats: GameStats;
  weeklyCompletedActions?: string[];
  onExecuteFacilityAction: (params: {
    actionKey: string;
    facilityName: string;
    locName: string;
    baseDeltas: Partial<GameStats>;
    minStamina?: number;
    minCoins?: number;
    memoryLog: string;
  }) => void;
  onNotify: (msg: string) => void;
}

export const FacilitiesModal: React.FC<FacilitiesModalProps> = ({
  onClose,
  stats,
  weeklyCompletedActions = [],
  onExecuteFacilityAction,
  onNotify,
}) => {
  const facilities = [
    {
      id: 'cafeteria',
      actionKey: 'weekly_facility_cafeteria',
      locName: '学校食堂',
      name: '学生食堂 (학생식당)',
      desc: '享用热腾腾的韩式芝士辣炒鸡排、炸猪排定食与海带汤，快速恢复体力并触发食堂偶遇事件。',
      effect: '体力 +40 · 心情 +10 (₩8,000)',
      minCoins: 8000,
      minStamina: 0,
      baseDeltas: { stamina: 40, mood: 10, coins: -8000 },
      memoryLog: '在学校食堂享用了营养午餐并经历了餐桌小插曲。',
      icon: Coffee,
    },
    {
      id: 'library',
      actionKey: 'weekly_facility_library',
      locName: '安静图书馆',
      name: '3楼安静图书馆 (도서관)',
      desc: '在洒满阳光的木质长桌旁安静自习，身边都是认真备考的同学，触发图书馆研习事件。',
      effect: '学业 +6 · 心情 +4 (体力 -10)',
      minCoins: 0,
      minStamina: 10,
      baseDeltas: { academics: 6, mood: 4, stamina: -10 },
      memoryLog: '前往3楼安静图书馆自习阅读，攻克了不少疑难知识点。',
      icon: BookOpen,
    },
    {
      id: 'rooftop',
      actionKey: 'weekly_facility_rooftop',
      locName: '天台花园',
      name: '教学楼天台花园 (옥상정원)',
      desc: '眺望首尔南山塔与蔚蓝天空，呼吸新鲜空气，平复一天的课业疲惫。',
      effect: '心情 +22 · 体力 +10',
      minCoins: 0,
      minStamina: 0,
      baseDeltas: { mood: 22, stamina: 10 },
      memoryLog: '来到教学楼天台花园吹风小憩，心情豁然开朗。',
      icon: Sun,
    },
    {
      id: 'store',
      actionKey: 'weekly_facility_store',
      locName: '2楼走廊',
      name: '校内小卖部 (매점)',
      desc: '课间抢购胖胖瓶香蕉牛奶、草莓面包与鱼饼串，体验课间热闹的抢购现场。',
      effect: '体力 +20 · 心情 +12 (₩4,500)',
      minCoins: 4500,
      minStamina: 0,
      baseDeltas: { stamina: 20, mood: 12, coins: -4500 },
      memoryLog: '在校内小卖部买到了冰镇香蕉牛奶与草莓面包。',
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-[#f0e6d2]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide">
                首尔女子高中 · 校内设施互动
              </h2>
              <p className="text-[11px] text-[#e6dfd3]">
                每次使用设施均会触发 AI 动态剧情推演与抉择弹窗 · 每项设施每周限 1 次
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto bg-[#e2dbd0]/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {facilities.map((fac) => {
              const Icon = fac.icon;
              const isDone = weeklyCompletedActions.includes(fac.actionKey);
              return (
                <div
                  key={fac.id}
                  className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-2xl p-4 flex flex-col justify-between gap-3.5 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#efe8d8] border border-[#d8cbb0] flex items-center justify-center text-[#7d6338] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#2b2620]">{fac.name}</h3>
                        <div className="text-xs text-[#4e7a56] font-bold">{fac.effect}</div>
                      </div>
                    </div>
                    <p className="text-xs text-[#4a4237] leading-relaxed">{fac.desc}</p>
                  </div>

                  <button
                    disabled={isDone}
                    onClick={() => {
                      if (isDone) return;
                      if (fac.minCoins && stats.coins < fac.minCoins) {
                        onNotify(`金币不足 ₩${fac.minCoins.toLocaleString()}！`);
                        return;
                      }
                      if (fac.minStamina && stats.stamina < fac.minStamina) {
                        onNotify(`体力不足 ${fac.minStamina} 点，请先去食堂或休息补充体力！`);
                        return;
                      }
                      onExecuteFacilityAction({
                        actionKey: fac.actionKey,
                        facilityName: fac.name,
                        locName: fac.locName,
                        baseDeltas: fac.baseDeltas,
                        memoryLog: fac.memoryLog,
                      });
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all ${
                      isDone
                        ? 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
                        : 'bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] cursor-pointer'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>本周已完成（下周重置）</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>前往使用并触发事件</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
