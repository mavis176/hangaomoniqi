import React from 'react';
import { X, Activity, Coffee, ShoppingBag, Music, BookMarked, CheckCircle, Coins, Zap } from 'lucide-react';
import { GameStats } from '../../types';

interface ExtracurricularModalProps {
  onClose: () => void;
  stats: GameStats;
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
  onUpdateStats,
  onNotify,
  onShowResultModal,
}) => {
  const activities = [
    {
      id: 'convenience',
      name: '汉江公园 GS25 便利店兼职',
      desc: '放学后在汉江边的便利店整理货架与收银，还能偶遇来买拉面的首尔市民。',
      reward: '零花钱 +₩120,000 · 社交 +2',
      cost: '体力 -25',
      deltas: { coins: 120000, social: 2, stamina: -25 },
      memoryLog: '在汉江公园便利店完成周末兼职，辛苦但靠自己双手赚取了丰厚薪水。',
      action: () => {
        if (stats.stamina < 25) {
          onNotify('体力不足 25，无法去便利店兼职！');
          return;
        }
        onShowResultModal({
          title: '兼职结算说明 · 汉江便利店',
          description: '你顺利完成了汉江便利店兼职，微风拂过汉江，靠自己努力赚取了 ₩120,000 薪水！',
          deltas: { coins: 120000, social: 2, stamina: -25 },
          memoryLog: '在汉江公园便利店完成周末兼职，靠双手赚取了丰厚薪水。',
        });
      },
      icon: ShoppingBag,
    },
    {
      id: 'study_cafe',
      name: '大峙洞王牌补习班 (학원) 冲刺',
      desc: '前往首尔最著名的大峙洞补习街参加名师夜间特训，大幅提升学业水平。',
      reward: '学业 +9',
      cost: '体力 -20 · 学费 ₩45,000',
      deltas: { academics: 9, stamina: -20, coins: -45000 },
      memoryLog: '在大峙洞王牌补习班度过高强度刷题夜，学业实力显著精进。',
      action: () => {
        if (stats.stamina < 20 || stats.coins < 45000) {
          onNotify('体力或金币不足！');
          return;
        }
        onShowResultModal({
          title: '补习冲刺结算说明 · 大峙洞',
          description: '在大峙洞名师指导下完成高强度刷题特训，虽然有些疲惫，但对高考考点的理解豁然开朗！',
          deltas: { academics: 9, stamina: -20, coins: -45000 },
          memoryLog: '在大峙洞王牌补习班度过高强度刷题夜，学业实力显著精进。',
        });
      },
      icon: BookMarked,
    },
    {
      id: 'karaoke',
      name: '弘大投币练歌房 (코인노래방)',
      desc: '和同班好友一起去弘大街头唱K，尽情飙歌释放一天的课业压力。',
      reward: '心情 +18 · 社交 +5',
      cost: '体力 -10 · 费用 ₩15,000',
      deltas: { mood: 18, social: 5, stamina: -10, coins: -15000 },
      memoryLog: '和好友在弘大投币练歌房尽情飙歌，释放了所有的备考压力。',
      action: () => {
        if (stats.stamina < 10 || stats.coins < 15000) {
          onNotify('体力或金币不足！');
          return;
        }
        onShowResultModal({
          title: '休闲放松结算说明 · 弘大练歌房',
          description: '在弘大投币练歌房和朋友肆意合唱，烦恼随着歌声飘向夜空，心情大好！',
          deltas: { mood: 18, social: 5, stamina: -10, coins: -15000 },
          memoryLog: '和好友在弘大投币练歌房尽情飙歌，释放了所有的备考压力。',
        });
      },
      icon: Music,
    },
    {
      id: 'bakery',
      name: '圣水洞网红咖啡厅打卡',
      desc: '品尝精致的草莓可颂与冰美式，拍下氛围感满满的制服日常照。',
      reward: '心情 +14 · 外形 +4',
      cost: '费用 ₩32,000',
      deltas: { mood: 14, appearance: 4, coins: -32000 },
      memoryLog: '在圣水洞网红咖啡厅享受下午茶与拍照，时尚度与心情大增。',
      action: () => {
        if (stats.coins < 32000) {
          onNotify('金币不足！');
          return;
        }
        onShowResultModal({
          title: '潮牌咖啡厅结算说明 · 圣水洞',
          description: '在圣水洞充满艺术气息的咖啡厅品尝甜品，度过了一个悠闲精致的下午。',
          deltas: { mood: 14, appearance: 4, coins: -32000 },
          memoryLog: '在圣水洞网红咖啡厅享受下午茶与拍照，时尚度与心情大增。',
        });
      },
      icon: Coffee,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99] shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#f0e6d2] shrink-0" />
            <h2 className="text-xs sm:text-base font-bold tracking-wide">首尔校外活动与兼职中心</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#efe8d8] border border-[#d8cbb0] flex items-center justify-center text-[#7d6338] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-[#2b2620] truncate">{item.name}</h3>
                        <div className="text-[11px] text-[#4e7a56] font-bold">{item.reward}</div>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[#4a4237] leading-relaxed">{item.desc}</p>
                    <div className="text-[10px] sm:text-[11px] text-[#6e6558] bg-[#ece6db] px-2 py-1 rounded-lg border border-[#d6cfc2] flex items-center gap-1">
                      <span>消耗: {item.cost}</span>
                    </div>
                  </div>

                  <button
                    onClick={item.action}
                    className="w-full py-2 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>立即前往体验</span>
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
