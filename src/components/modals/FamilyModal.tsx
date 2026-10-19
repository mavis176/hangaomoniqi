import React, { useState } from 'react';
import {
  X,
  Heart,
  PhoneCall,
  Award,
  Coins,
  Sparkles,
  MessageCircle,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { GameStats, FamilyMilestoneItem } from '../../types';

interface FamilyModalProps {
  onClose: () => void;
  stats: GameStats;
  protagonistName: string;
  gradeYear: number;
  weekInYear: number;
  unreportedMilestones: FamilyMilestoneItem[];
  onClaimMilestone: (milestoneId: string, rewardCoins: number, newsSummary: string) => void;
  onUpdateStats: (deltas: Partial<GameStats>) => void;
  onAddMemory: (summary: string, category: 'family' | 'life') => void;
  onNotify: (msg: string) => void;
}

export const FamilyModal: React.FC<FamilyModalProps> = ({
  onClose,
  stats,
  protagonistName,
  gradeYear,
  weekInYear,
  unreportedMilestones = [],
  onClaimMilestone,
  onUpdateStats,
  onAddMemory,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'call' | 'report'>('call');
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  const handleSendAllowanceOrCall = (amountKRW: number) => {
    if (amountKRW > 0 && stats.coins < amountKRW) {
      onNotify(`⚠️ 零钱不足！发送 ₩${amountKRW.toLocaleString()} 孝亲红包需要充足的韩元。`);
      return;
    }

    const coinsDelta = -amountKRW;
    const familyDelta = amountKRW > 0 ? 12 : 8;
    const darkDelta = -18; // Massive stress relief
    const moodDelta = 15;

    onUpdateStats({
      coins: stats.coins + coinsDelta,
      family: Math.min(100, stats.family + familyDelta),
      darkIndex: Math.max(0, stats.darkIndex + darkDelta),
      mood: Math.min(100, stats.mood + moodDelta),
    });

    const msg = amountKRW > 0
      ? `给爸爸妈妈寄去了 ₩${amountKRW.toLocaleString()} 生活红包。妈妈笑着在 KakaoTalk 发来微信：‘我家${protagonistName}太懂事啦！自己在首尔要注意身体呀！’`
      : `打了半个小时的长途微信视频。爸爸妈妈嘱咐首尔降温要穿厚衣服，家庭羁绊与温暖化解了所有压力。`;

    setLastActionResult(msg);
    onAddMemory(`[高${gradeYear}第${weekInYear}周] ${msg}`, 'family');
    onNotify(`💖 亲情温暖打动人心！家庭关系 +${familyDelta}%，压力 -18 点！`);
  };

  const handleClaimSingleMilestone = (item: FamilyMilestoneItem) => {
    onClaimMilestone(item.id, item.rewardCoins, item.newsSummary);

    const msg = `向爸妈汇报了喜讯【${item.title}】！爸妈高兴得在家族群和朋友圈夸奖赞赏，并骄傲地寄来了 ₩${item.rewardCoins.toLocaleString()} 奖励！`;
    setLastActionResult(msg);
    onNotify(`🎁 报喜成功！获得了父母的特别奖励 ₩${item.rewardCoins.toLocaleString()}，每周零花钱额度 +₩2,000！`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in">
      <div className="bg-[#fcf9f2] border-2 border-[#e6dbc8] rounded-3xl max-w-3xl w-full flex flex-col overflow-hidden shadow-2xl text-[#383025]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#d97736] via-[#e08948] to-[#ca6b2c] px-4 py-3.5 sm:px-6 flex items-center justify-between text-white border-b border-[#e8a374] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black shadow-inner">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wide text-white">
                  父母情感羁绊与温馨家园
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30">
                  家庭羁绊: {stats.family}/100
                </span>
              </div>
              <p className="text-xs text-orange-100 hidden sm:block">
                无论在首尔走得多远，家永远是最温暖的避风港
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Family Affection Progress Bar */}
        <div className="bg-[#f4ebd9] px-4 py-2.5 border-b border-[#e2d4bc] flex items-center justify-between gap-4 shrink-0 text-xs font-bold">
          <div className="flex items-center gap-2 text-orange-950">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>家庭好感羁绊度:</span>
            <span className="text-sm font-black text-orange-700">{stats.family}%</span>
          </div>

          <div className="flex-1 max-w-xs h-3 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-amber-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, stats.family))}%` }}
            />
          </div>

          <div className="text-[11px] text-stone-600 font-bold">
            每周零花钱: <span className="text-orange-800 font-black">₩{stats.allowance.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {lastActionResult && (
          <div className="m-4 mb-0 p-3.5 rounded-2xl bg-orange-100/90 border border-orange-300 text-orange-950 text-xs font-bold flex items-start gap-3 shadow-xs animate-in fade-in">
            <Sparkles className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{lastActionResult}</div>
            <button
              onClick={() => setLastActionResult(null)}
              className="text-orange-800 hover:text-orange-950 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 pt-4 border-b border-[#e8dcc8] flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('call')}
            className={`px-4 py-2 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'call'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-[#ebe0cb] text-[#6b5a45] hover:bg-[#e2d5bd]'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>电话问候 / 孝亲红包</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'report'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-[#ebe0cb] text-[#6b5a45] hover:bg-[#e2d5bd]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>向家里报喜 / 领喜讯奖金</span>
            {unreportedMilestones.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-bounce">
                {unreportedMilestones.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {activeTab === 'call' && (
            <div className="space-y-4">
              <div className="bg-[#f5ecdc] border border-[#e2d2b5] p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-orange-950">
                  <MessageCircle className="w-4 h-4 text-orange-600" />
                  <span>与父母电话/微信互动 (倾诉解压)</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  在首尔独自面对高强度的学业与演艺练习，随时可以给父母打个电话倒出心中的委屈与疲惫。父母无条件的关怀能大幅抚平【压力阴霾值】！
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSendAllowanceOrCall(0)}
                    className="p-3.5 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:bg-orange-50 shadow-xs cursor-pointer transition-all flex flex-col items-start gap-1 text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-black text-orange-950">
                      <PhoneCall className="w-4 h-4 text-orange-500" />
                      <span>长途微信长谈视频</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">
                      效果: 压力 -18 点，心情 +15，家庭好感 +8%
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendAllowanceOrCall(10000)}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:brightness-105 cursor-pointer transition-all flex flex-col items-start gap-1 text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-black text-white">
                      <Coins className="w-4 h-4 text-amber-200" />
                      <span>寄去 ₩10,000 孝亲小红包</span>
                    </div>
                    <div className="text-[11px] text-orange-100 font-medium">
                      效果: 压力 -18 点，心情 +15，家庭好感 +12%
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              <div className="bg-[#f5ecdc] border border-[#e2d2b5] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-orange-950">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span>向父母汇报近期喜讯大捷</span>
                  </div>
                  <span className="text-xs font-bold text-stone-500">
                    待领奖励喜讯: {unreportedMilestones.length} 条
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  父母一直默默关注着你在首尔的每一步突破。只有当你在【学校期中/期末考上榜】、【企划社评级晋升 A 班/出道】或【打歌舞台获胜】时，才会解锁新的喜讯！
                </p>

                {unreportedMilestones.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-stone-700">🔒 当前暂无未汇报的喜讯</div>
                      <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                        杜绝刷钱！请继续在【首尔女高模考】、【企划社选秀评级】或【打歌舞台】中取得新突破后，即可解锁父母的骄傲喜讯与特别奖金！
                      </p>
                    </div>
                    <button
                      disabled
                      className="px-6 py-2.5 rounded-xl bg-stone-200 text-stone-400 text-xs font-bold cursor-not-allowed border border-stone-300"
                    >
                      暂无喜讯待领取
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {unreportedMilestones.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-orange-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              {item.categoryLabel}
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-orange-950 truncate">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {item.newsSummary}
                          </p>
                          <div className="text-[10px] text-stone-400 font-medium">
                            成就解锁时间：{item.createdAtStr}
                          </div>
                        </div>

                        <button
                          onClick={() => handleClaimSingleMilestone(item)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Coins className="w-3.5 h-3.5 text-stone-950" />
                          <span>向父母报喜 (+₩{item.rewardCoins.toLocaleString()})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
