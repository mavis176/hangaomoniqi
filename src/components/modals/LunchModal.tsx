import React from 'react';
import { X, Utensils, CheckCircle2, Sparkles } from 'lucide-react';
import { NPCClassmate, GameStats } from '../../types';

interface LunchModalProps {
  npc: NPCClassmate;
  onClose: () => void;
  stats: GameStats;
  weeklyCompletedActions?: string[];
  onExecuteDateInvite: (params: {
    npc: NPCClassmate;
    spotName: string;
    price: number;
    staminaGain: number;
    moodGain: number;
    favGain: number;
  }) => void;
  onNotify: (msg: string) => void;
}

export const LunchModal: React.FC<LunchModalProps> = ({
  npc,
  onClose,
  stats,
  weeklyCompletedActions = [],
  onExecuteDateInvite,
  onNotify,
}) => {
  const npcDateKey = `weekly_npc_date_${npc.id}`;
  const isNpcDatedThisWeek = weeklyCompletedActions.includes(npcDateKey);

  const lunchSpots = [
    {
      id: 'l1',
      name: '学校食堂 · 芝士辣炒鸡排与海带汤套餐',
      price: 5500,
      stamina: 35,
      mood: 10,
      fav: 7,
      desc: '端着不锈钢餐盘并排坐在一起，边吃边吐槽今天的课堂作业',
    },
    {
      id: 'l2',
      name: '校门街角 · 玫瑰酱辣炒年糕配金枪鱼紫菜包饭',
      price: 9500,
      stamina: 42,
      mood: 16,
      fav: 12,
      desc: '热腾腾的鱼饼汤配拉丝芝士年糕，韩国女高生的快乐老家',
    },
    {
      id: 'l3',
      name: '圣水洞 · 奶油明太子意面与舒芙蕾松饼',
      price: 28000,
      stamina: 50,
      mood: 24,
      fav: 20,
      desc: '放学或周末的精致约饭，吃完还能顺便去旁边拍人生四格',
    },
  ];

  const handleHaveLunch = (spot: (typeof lunchSpots)[0]) => {
    if (isNpcDatedThisWeek) return;
    if (stats.coins < spot.price) {
      onNotify('零花钱不足，支付不起这顿餐费！');
      return;
    }
    onExecuteDateInvite({
      npc,
      spotName: spot.name,
      price: spot.price,
      staminaGain: spot.stamina,
      moodGain: spot.mood,
      favGain: spot.fav,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Utensils className="w-5 h-5 text-[#f0e6d2]" />
            <div>
              <h2 className="text-base font-bold tracking-wide">
                邀请 {npc.chineseName} 主动约会/共进美食
              </h2>
              <p className="text-[11px] text-[#e6dfd3]">
                每位特定 NPC 每周限主动约会邀请 1 次 · 触发 AI 约会现场抉择
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
        <div className="p-4 space-y-2.5 overflow-y-auto bg-[#e2dbd0]/60">
          {lunchSpots.map((spot) => (
            <div
              key={spot.id}
              className="bg-[#f7f4ee] border border-[#cfc8ba] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="font-bold text-sm text-[#2b2620]">{spot.name}</div>
                <div className="text-xs text-[#6e6558] mt-0.5">{spot.desc}</div>
                <div className="text-[11px] text-[#4e7a56] font-bold mt-1">
                  费用: ₩{spot.price.toLocaleString()} · 体力 +{spot.stamina} · 好感 +{spot.fav}%
                </div>
              </div>
              <button
                disabled={isNpcDatedThisWeek}
                onClick={() => handleHaveLunch(spot)}
                className={`py-2 px-3.5 font-bold rounded-xl text-xs shadow-2xs shrink-0 flex items-center justify-center gap-1 transition-all ${
                  isNpcDatedThisWeek
                    ? 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
                    : 'bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] cursor-pointer'
                }`}
              >
                {isNpcDatedThisWeek ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>本周已完成（下周重置）</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>发起约会邀请</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#c7c0b3] hover:bg-[#b8b0a2] text-[#2b2620] rounded-xl text-xs font-bold cursor-pointer"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
