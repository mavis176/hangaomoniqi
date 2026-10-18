import React from 'react';
import { X, Gift } from 'lucide-react';
import { NPCClassmate, GameStats } from '../../types';

interface GiftModalProps {
  npc: NPCClassmate;
  onClose: () => void;
  stats: GameStats;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onUpdateFavorability: (npcId: string, amount: number) => void;
  onRecordGiftMemory: (npcId: string, giftName: string, fav: number) => void;
  onNotify: (msg: string) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  npc,
  onClose,
  stats,
  onUpdateStats,
  onUpdateFavorability,
  onRecordGiftMemory,
  onNotify,
}) => {
  const gifts = [
    { id: 'g1', name: '胖胖瓶香蕉牛奶 (바나나맛 우유)', price: 1800, fav: 5, desc: '小卖部冰柜刚拿出来的国民甜饮，课间分享最合适' },
    { id: 'g2', name: 'ARTBOX 活页复习手帐本', price: 8500, fav: 10, desc: '内含康奈尔笔记页与可爱的韩文日程贴纸' },
    { id: 'g3', name: 'Olive Young 销量第一护手霜', price: 16000, fav: 16, desc: '清淡好闻的无花果木质香，涂完写字心情都会变好' },
    { id: 'g4', name: '专辑未公开特典自拍小卡', price: 35000, fav: 26, desc: '装在硬卡套里的绝版闪卡，珍藏级心意' },
  ];

  const handleSendGift = (gift: typeof gifts[0]) => {
    if (stats.coins < gift.price) {
      onNotify('零花钱不足，买不起这份礼物！');
      return;
    }
    onUpdateStats({
      coins: stats.coins - gift.price,
      social: Math.min(100, stats.social + 3),
    });
    onUpdateFavorability(npc.id, gift.fav);
    onRecordGiftMemory(npc.id, gift.name, gift.fav);
    onNotify(`送给 ${npc.chineseName}【${gift.name}】！对方已牢牢记住这份心意，好感 +${gift.fav}%`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-[#f0e6d2]" />
            <h2 className="text-base font-bold tracking-wide">赠送礼物给 {npc.chineseName}</h2>
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
          {gifts.map((g) => (
            <div
              key={g.id}
              className="bg-[#f7f4ee] border border-[#cfc8ba] p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="font-bold text-sm text-[#2b2620]">{g.name}</div>
                <div className="text-xs text-[#6e6558] mt-0.5">{g.desc}</div>
                <div className="text-[11px] text-[#4e7a56] font-bold mt-1">
                  价格: {g.price.toLocaleString()}元 · 好感度 +{g.fav}%
                </div>
              </div>
              <button
                onClick={() => handleSendGift(g)}
                className="py-2 px-4 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-2xs shrink-0 cursor-pointer"
              >
                赠送
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
