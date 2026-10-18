import React, { useState } from 'react';
import { X, Sparkles, Dices, Award, Heart, Coins, ArrowRight } from 'lucide-react';
import { GameStats } from '../../types';

interface DestinyCardModalProps {
  onClose: () => void;
  stats: GameStats;
  onUpdateStats: (delta: Partial<GameStats>) => void;
  onAddMemory: (summary: string) => void;
  onNotify: (msg: string) => void;
}

interface DestinyCard {
  id: string;
  title: string;
  category: 'lucky' | 'romance' | 'study' | 'trainee' | 'crisis';
  categoryLabel: string;
  badgeColor: string;
  story: string;
  effectDesc: string;
  rewardStats: Partial<GameStats>;
}

const DESTINY_POOL: DestinyCard[] = [
  {
    id: 'card_1',
    title: '🍀 便利店刮刮乐暴击',
    category: 'lucky',
    categoryLabel: '幸运事件',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    story: '放学后在首尔街头全家便利店买牛奶，随手刮了一张彩票，竟然中了二等奖！',
    effectDesc: '获得零花钱 ₩250,000，心情 +15',
    rewardStats: { coins: 250000, mood: 15 },
  },
  {
    id: 'card_2',
    title: '💌 抽屉里的神秘情书',
    category: 'romance',
    categoryLabel: '心动桃花',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    story: '中午回到高一(1)班座位，发现课桌抽屉里多了一封淡粉色的手写情书，上面画着超可爱的草莓贴纸：“每天在上学路上看到你，世界都变甜了。”',
    effectDesc: '心情 +20，社交/魅力 +8，心动值上升',
    rewardStats: { mood: 20, social: 8, appearance: 5 },
  },
  {
    id: 'card_3',
    title: '📚 数学突击小测满分',
    category: 'study',
    categoryLabel: '学霸高光',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    story: '数学朴老师突然进行了毫无预兆的随堂突击小测！你凭借平时的扎实积累，不仅全对，还用了一种超巧妙的简便解法，全班惊艳！',
    effectDesc: '学业 +12，零花钱奖励 ₩50,000',
    rewardStats: { academics: 12, coins: 50000, mood: 10 },
  },
  {
    id: 'card_4',
    title: '✨ 街头星探的递牌',
    category: 'trainee',
    categoryLabel: '星探偶遇',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    story: '周末在弘大逛街时，三大社（SM/HYBE）的星探突然追上来递出名片：“同学，你的镜头感和气场太绝了，有兴趣来公司试镜吗？”',
    effectDesc: '练习生综合进度 +12，外形 +8',
    rewardStats: { traineeProgress: 12, appearance: 8, mood: 15 },
  },
  {
    id: 'card_5',
    title: '☕ 走廊偶遇学姐的咖啡',
    category: 'lucky',
    categoryLabel: '暖心日常',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    story: '课间去饮水机接水时，巧遇高年级温柔的乐队学姐，顺手递给你一杯热可可：“看你背着书包好像很辛苦，加油呀！”',
    effectDesc: '体力 +20，心情 +15',
    rewardStats: { stamina: 20, mood: 15 },
  },
  {
    id: 'card_6',
    title: '🌧️ 雨天共用一把雨伞',
    category: 'romance',
    categoryLabel: '韩剧名场面',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    story: '放学时首尔突然下起暴雨，你忘带伞正发愁时，同桌撑着薰衣草紫的雨伞走到你身旁：“一起走吧，我家离这很近。”',
    effectDesc: '社交 +10，心情 +20，心动值暴增',
    rewardStats: { social: 10, mood: 20 },
  },
];

export const DestinyCardModal: React.FC<DestinyCardModalProps> = ({
  onClose,
  stats,
  onUpdateStats,
  onAddMemory,
  onNotify,
}) => {
  const [drawnCard, setDrawnCard] = useState<DestinyCard | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDrawCard = () => {
    setIsDrawing(true);
    setDrawnCard(null);

    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * DESTINY_POOL.length);
      const card = DESTINY_POOL[randomIdx];
      setDrawnCard(card);
      setIsDrawing(false);

      // Apply rewards
      onUpdateStats(card.rewardStats);
      onAddMemory(`[命运奇遇] 触发了【${card.title}】事件：${card.story}`);
      onNotify(`✨ 命运奇遇抽卡成功！触发【${card.title}】：${card.effectDesc}`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] border-2 border-[#E2D7C5] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden text-[#2C2620]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#59483a] via-[#85705d] to-[#6b5847] px-4 py-3 text-white border-b border-[#A39281] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-wide">
                首尔女高 · 命运奇遇卡牌抽卡室
              </h2>
              <p className="text-[10px] text-amber-100/90">
                抽取今日专属奇遇命运卡，赢取丰厚零花钱、属性加成与心动彩蛋！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col items-center justify-center space-y-5 text-center">
          {!drawnCard ? (
            <div className="space-y-4 py-6 w-full flex flex-col items-center">
              <div className="w-28 h-40 bg-gradient-to-br from-[#85705d] to-[#59483a] rounded-xl border-2 border-amber-300 shadow-xl flex flex-col items-center justify-center text-white p-3 rotate-1 hover:rotate-0 transition-transform cursor-pointer" onClick={handleDrawCard}>
                <Dices className="w-10 h-10 text-amber-300 mb-2 animate-bounce" />
                <span className="text-xs font-bold tracking-wider">命运卡牌</span>
                <span className="text-[10px] text-amber-200 mt-1">点击抽取</span>
              </div>

              <p className="text-xs text-[#6e6255] max-w-xs leading-relaxed">
                每天都可以来抽取一张属于你的首尔女高随机奇遇事件，改变今日运势！
              </p>

              <button
                type="button"
                onClick={handleDrawCard}
                disabled={isDrawing}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isDrawing ? 'animate-spin' : ''}`} />
                <span>{isDrawing ? '正在洗牌与抽取中...' : '🎲 立即抽取命运奇遇卡'}</span>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white border-2 border-amber-400 rounded-2xl p-5 shadow-lg text-left space-y-3 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${drawnCard.badgeColor}`}>
                    {drawnCard.categoryLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2 pr-16">
                  <span className="text-xl">✨</span>
                  <h3 className="text-base font-black text-[#2C2620]">{drawnCard.title}</h3>
                </div>

                <p className="text-xs text-[#52463b] leading-relaxed bg-[#FAF7F2] p-3 rounded-xl border border-[#e8dfd1]">
                  {drawnCard.story}
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>结算效果：{drawnCard.effectDesc}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDrawnCard(null)}
                  className="px-4 py-2 bg-[#e8dfd1] hover:bg-[#ded4c0] text-[#59483a] rounded-xl text-xs font-bold cursor-pointer"
                >
                  再抽一张
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-gradient-to-r from-[#59483a] to-[#85705d] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>收下奖励并返回</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
