import React from 'react';
import { X, Building, Coffee, BookOpen, Sun, ShoppingBag } from 'lucide-react';
import { GameStats } from '../../types';

interface FacilitiesModalProps {
  onClose: () => void;
  stats: GameStats;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onChangeLocation: (loc: string) => void;
  onNotify: (msg: string) => void;
}

export const FacilitiesModal: React.FC<FacilitiesModalProps> = ({
  onClose,
  stats,
  onUpdateStats,
  onChangeLocation,
  onNotify,
}) => {
  const facilities = [
    {
      id: 'cafeteria',
      locName: '学校食堂',
      name: '学生食堂 (학생식당)',
      desc: '享用热腾腾的韩式芝士辣炒鸡排、炸猪排定食与海带汤，快速恢复体力。',
      effect: '体力 +40 · 心情 +10 (8,000元)',
      action: () => {
        if (stats.coins < 8000) {
          onNotify('金币不足 8,000元！');
          return;
        }
        onUpdateStats({
          stamina: Math.min(100, stats.stamina + 40),
          mood: Math.min(100, stats.mood + 10),
          coins: stats.coins - 8000,
        });
        onChangeLocation('学校食堂');
        onNotify('在学校食堂享用了营养午餐！体力 +40，心情 +10');
        onClose();
      },
      icon: Coffee,
    },
    {
      id: 'library',
      locName: '安静图书馆',
      name: '3楼安静图书馆 (도서관)',
      desc: '在洒满阳光的木质长桌旁安静自习，身边都是认真备考的同学。',
      effect: '学业 +6 · 心情 +4 (体力 -10)',
      action: () => {
        if (stats.stamina < 10) {
          onNotify('体力不足，先去食堂补充体力吧！');
          return;
        }
        onUpdateStats({
          academics: Math.min(100, stats.academics + 6),
          mood: Math.min(100, stats.mood + 4),
          stamina: Math.max(0, stats.stamina - 10),
        });
        onChangeLocation('安静图书馆');
        onNotify('前往3楼图书馆专心阅读！学业 +6，心情 +4');
        onClose();
      },
      icon: BookOpen,
    },
    {
      id: 'rooftop',
      locName: '天台花园',
      name: '教学楼天台花园 (옥상정원)',
      desc: '眺望首尔南山塔与蔚蓝天空，呼吸新鲜空气，平复一天的课业疲惫。',
      effect: '心情 +22 · 体力 +10',
      action: () => {
        onUpdateStats({
          mood: Math.min(100, stats.mood + 22),
          stamina: Math.min(100, stats.stamina + 10),
        });
        onChangeLocation('天台花园');
        onNotify('来到教学楼天台吹风小憩，心情 +22，体力 +10！');
        onClose();
      },
      icon: Sun,
    },
    {
      id: 'store',
      locName: '2楼走廊',
      name: '校内小卖部 (매점)',
      desc: '课间抢购胖胖瓶香蕉牛奶、草莓面包与鱼饼串。',
      effect: '体力 +20 · 心情 +12 (4,500元)',
      action: () => {
        if (stats.coins < 4500) {
          onNotify('金币不足！');
          return;
        }
        onUpdateStats({
          stamina: Math.min(100, stats.stamina + 20),
          mood: Math.min(100, stats.mood + 12),
          coins: stats.coins - 4500,
        });
        onNotify('在小卖部买到了冰镇香蕉牛奶！体力 +20，心情 +12');
      },
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
            <h2 className="text-base sm:text-lg font-bold tracking-wide">首尔女子高中 · 校内设施</h2>
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
                    onClick={fac.action}
                    className="w-full py-2 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    前往使用
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
