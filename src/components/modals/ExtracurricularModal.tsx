import React from 'react';
import { X, Activity, Coffee, ShoppingBag, Music, BookMarked } from 'lucide-react';
import { GameStats } from '../../types';

interface ExtracurricularModalProps {
  onClose: () => void;
  stats: GameStats;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onNotify: (msg: string) => void;
}

export const ExtracurricularModal: React.FC<ExtracurricularModalProps> = ({
  onClose,
  stats,
  onUpdateStats,
  onNotify,
}) => {
  const activities = [
    {
      id: 'convenience',
      name: '汉江公园 GS25 便利店兼职',
      desc: '放学后在汉江边的便利店整理货架与收银，还能偶遇来买拉面的首尔市民。',
      reward: '零花钱 +120,000元 · 社交 +2',
      cost: '体力 -25',
      action: () => {
        if (stats.stamina < 25) {
          onNotify('体力不足 25，无法去便利店兼职！');
          return;
        }
        onUpdateStats({
          coins: stats.coins + 120000,
          social: Math.min(100, stats.social + 2),
          stamina: stats.stamina - 25,
        });
        onNotify('完成了汉江便利店兼职！获得 120,000元 薪水，社交 +2');
      },
      icon: ShoppingBag,
    },
    {
      id: 'study_cafe',
      name: '大峙洞王牌补习班 (학원) 冲刺',
      desc: '前往首尔最著名的大峙洞补习街参加名师夜间特训，大幅提升学业水平。',
      reward: '学业 +9',
      cost: '体力 -20 · 学费 45,000元',
      action: () => {
        if (stats.stamina < 20 || stats.coins < 45000) {
          onNotify('体力或金币不足！');
          return;
        }
        onUpdateStats({
          academics: Math.min(100, stats.academics + 9),
          stamina: stats.stamina - 20,
          coins: stats.coins - 45000,
        });
        onNotify('在大峙洞补习班完成了高强度刷题，学业 +9！');
      },
      icon: BookMarked,
    },
    {
      id: 'karaoke',
      name: '弘大投币练歌房 (코인노래방)',
      desc: '和同班好友一起去弘大街头唱K，尽情飙歌释放一天的课业压力。',
      reward: '心情 +18 · 社交 +5',
      cost: '体力 -10 · 费用 15,000元',
      action: () => {
        if (stats.stamina < 10 || stats.coins < 15000) {
          onNotify('体力或金币不足！');
          return;
        }
        onUpdateStats({
          mood: Math.min(100, stats.mood + 18),
          social: Math.min(100, stats.social + 5),
          stamina: stats.stamina - 10,
          coins: stats.coins - 15000,
        });
        onNotify('在弘大投币练歌房唱得超尽兴！心情 +18，社交 +5');
      },
      icon: Music,
    },
    {
      id: 'bakery',
      name: '圣水洞网红咖啡厅打卡',
      desc: '品尝精致的草莓可颂与冰美式，拍下氛围感满满的制服日常照。',
      reward: '心情 +14 · 外形 +4',
      cost: '费用 32,000元',
      action: () => {
        if (stats.coins < 32000) {
          onNotify('金币不足！');
          return;
        }
        onUpdateStats({
          mood: Math.min(100, stats.mood + 14),
          appearance: Math.min(100, stats.appearance + 4),
          coins: stats.coins - 32000,
        });
        onNotify('在圣水洞咖啡厅度过了惬意午后！心情 +14，外形 +4');
      },
      icon: Coffee,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#f0e6d2]" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide">首尔校外活动与兼职</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 sm:p-5 overflow-y-auto touch-scroll overscroll-contain space-y-3 bg-[#e2dbd0]/60 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#efe8d8] border border-[#d8cbb0] flex items-center justify-center text-[#7d6338] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#2b2620]">{item.name}</h3>
                        <div className="text-xs text-[#4e7a56] font-bold">{item.reward}</div>
                      </div>
                    </div>
                    <p className="text-xs text-[#4a4237] leading-relaxed">{item.desc}</p>
                    <div className="text-[11px] text-[#6e6558] bg-[#ece6db] px-2.5 py-1.5 rounded-lg border border-[#d6cfc2]">
                      消耗: {item.cost}
                    </div>
                  </div>

                  <button
                    onClick={item.action}
                    className="w-full py-2 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    立即前往
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
            返回
          </button>
        </div>

      </div>
    </div>
  );
};
