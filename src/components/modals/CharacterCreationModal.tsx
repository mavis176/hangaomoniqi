import React, { useState } from 'react';
import { Sparkles, Dices, User, Crown, Heart, Check, RefreshCw } from 'lucide-react';
import { GameStats } from '../../types';

interface CharacterCreationModalProps {
  onConfirm: (characterData: {
    name: string;
    backgroundId: string;
    backgroundName: string;
    mbti: string;
    stats: Partial<GameStats>;
    avatarUrl?: string;
  }) => void;
}

export const BACKGROUND_OPTIONS = [
  {
    id: 'chaebol',
    title: '👑 清潭洞财阀豪门千金',
    desc: '首尔顶级财阀世家独生女，生活优渥，出入名流圈，自带豪门千金光环。',
    bonusCoins: 800000,
    bonusStats: { appearance: 15, family: 20, mood: 10 },
    badge: '财阀千金 · 资金无忧',
    color: 'from-amber-500/20 to-yellow-600/20 border-amber-400 text-amber-900',
  },
  {
    id: 'elite',
    title: '🎓 大峙洞中产知识精英',
    desc: '父母均为大学教授或名医，家风严谨，从小接受顶级名师特训。',
    bonusCoins: 250000,
    bonusStats: { academics: 18, stamina: 10, mood: 5 },
    badge: '中产精英 · 学霸光环',
    color: 'from-blue-500/20 to-indigo-600/20 border-indigo-400 text-indigo-900',
  },
  {
    id: 'artist',
    title: '🌸 弘大艺术/演艺世家',
    desc: '出生于音乐与舞蹈世家，充满艺术灵性，从小深受街头时尚与星探青睐。',
    bonusCoins: 350000,
    bonusStats: { appearance: 12, traineeProgress: 15, social: 10 },
    badge: '艺术世家 · 舞台圣体',
    color: 'from-pink-500/20 to-rose-600/20 border-rose-400 text-rose-900',
  },
  {
    id: 'worker',
    title: '💪 平民励志自强派',
    desc: '凭自身不懈努力考入首尔女高，吃苦耐劳，拥有超凡的抗压能力与亲和力。',
    bonusCoins: 100000,
    bonusStats: { stamina: 25, social: 15, mood: 15 },
    badge: '励志自强 · 体力爆棚',
    color: 'from-emerald-500/20 to-teal-600/20 border-emerald-400 text-emerald-900',
  },
];

const MBTI_OPTIONS = ['ENFP 社交小太阳', 'INTJ 高冷高智商', 'ESFP 舞台闪耀ACE', 'INFJ 温柔治愈系', 'ENTP 灵动毒舌妹'];

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ onConfirm }) => {
  const [name, setName] = useState('李秀妍');
  const [selectedBgId, setSelectedBgId] = useState('chaebol');
  const [mbti, setMbti] = useState('ENFP 社交小太阳');
  const [isRolling, setIsRolling] = useState(false);

  // Base random rolled stats
  const [rolledStats, setRolledStats] = useState({
    appearance: 78,
    academics: 75,
    social: 72,
    stamina: 85,
    mood: 80,
  });

  const handleRollStats = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setRolledStats({
        appearance: Math.floor(Math.random() * 31) + 65, // 65-95
        academics: Math.floor(Math.random() * 31) + 65,
        social: Math.floor(Math.random() * 31) + 65,
        stamina: Math.floor(Math.random() * 26) + 75, // 75-100
        mood: Math.floor(Math.random() * 26) + 75,
      });
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const selectedBg = BACKGROUND_OPTIONS.find((b) => b.id === selectedBgId) || BACKGROUND_OPTIONS[0];

  const handleStartGame = () => {
    const finalStats: Partial<GameStats> = {
      appearance: Math.min(100, rolledStats.appearance + (selectedBg.bonusStats.appearance || 0)),
      academics: Math.min(100, rolledStats.academics + (selectedBg.bonusStats.academics || 0)),
      social: Math.min(100, rolledStats.social + (selectedBg.bonusStats.social || 0)),
      stamina: Math.min(100, rolledStats.stamina + (selectedBg.bonusStats.stamina || 0)),
      mood: Math.min(100, rolledStats.mood + (selectedBg.bonusStats.mood || 0)),
      coins: selectedBg.bonusCoins,
      traineeProgress: selectedBg.bonusStats.traineeProgress || 0,
    };

    onConfirm({
      name: name.trim() || '李秀妍',
      backgroundId: selectedBg.id,
      backgroundName: selectedBg.title,
      mbti,
      stats: finalStats,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#E2D7C5] rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-[#2C2620]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6b5847] via-[#85705d] to-[#59483a] px-4 py-3 text-white border-b border-[#A39281] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-wide">
                首尔女子高中 · 新生档案建档登记
              </h1>
              <p className="text-[10px] sm:text-[11px] text-amber-100/90">
                开启属于你的首尔校园长篇故事，选择身份背景并刷新初始天赋吧！
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
          
          {/* 1. Name & MBTI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-[#e4dcd0] shadow-2xs">
            <div>
              <label className="block text-xs font-bold text-[#5c4f42] mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#8c735d]" />
                <span>女主姓名</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入名字（默认李秀妍）"
                maxLength={10}
                className="w-full bg-[#fdfbf7] border border-[#d8cdbc] rounded-lg px-3 py-1.5 text-xs text-[#2C2620] font-bold focus:outline-none focus:border-[#8c735d]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5c4f42] mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>MBTI 人格特质</span>
              </label>
              <select
                value={mbti}
                onChange={(e) => setMbti(e.target.value)}
                className="w-full bg-[#fdfbf7] border border-[#d8cdbc] rounded-lg px-3 py-1.5 text-xs text-[#2C2620] font-bold focus:outline-none focus:border-[#8c735d]"
              >
                {MBTI_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Family Background Selection */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#5c4f42] flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>选择家世与身份背景</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BACKGROUND_OPTIONS.map((bg) => {
                const isSelected = selectedBgId === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBgId(bg.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? `bg-gradient-to-br ${bg.color} border-2 shadow-sm scale-[1.01]`
                        : 'bg-white border-[#e4dcd0] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm">
                        <span>{bg.title}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700 font-bold" />}
                      </div>
                      <p className="text-[11px] text-[#594d40] mt-1 leading-relaxed">{bg.desc}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-bold">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                        初始资金 ₩{bg.bonusCoins.toLocaleString()}
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
                        {bg.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Random Roll Base Stats */}
          <div className="bg-white border border-[#e4dcd0] rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#5c4f42] flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-indigo-600" />
                <span>初始基本属性天赋（可随机重刷）</span>
              </div>

              <button
                type="button"
                onClick={handleRollStats}
                disabled={isRolling}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                <span>🎲 重新刷属性</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#e8dfd1]">
                <div className="text-[10px] text-[#706253] font-bold">颜值外形</div>
                <div className="text-base sm:text-lg font-black text-rose-600 mt-0.5">
                  {rolledStats.appearance}
                  {selectedBg.bonusStats.appearance ? (
                    <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                      +{selectedBg.bonusStats.appearance}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#e8dfd1]">
                <div className="text-[10px] text-[#706253] font-bold">智商学业</div>
                <div className="text-base sm:text-lg font-black text-blue-600 mt-0.5">
                  {rolledStats.academics}
                  {selectedBg.bonusStats.academics ? (
                    <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                      +{selectedBg.bonusStats.academics}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#e8dfd1]">
                <div className="text-[10px] text-[#706253] font-bold">社交情商</div>
                <div className="text-base sm:text-lg font-black text-purple-600 mt-0.5">
                  {rolledStats.social}
                  {selectedBg.bonusStats.social ? (
                    <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                      +{selectedBg.bonusStats.social}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#e8dfd1]">
                <div className="text-[10px] text-[#706253] font-bold">基础体力</div>
                <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                  {rolledStats.stamina}
                  {selectedBg.bonusStats.stamina ? (
                    <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                      +{selectedBg.bonusStats.stamina}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#e8dfd1] col-span-2 sm:col-span-1">
                <div className="text-[10px] text-[#706253] font-bold">初始心情</div>
                <div className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
                  {rolledStats.mood}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Start Game Action */}
        <div className="p-3 sm:p-4 bg-[#f0e8dc] border-t border-[#d8cdbc] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#6b5a4a] font-bold hidden sm:block">
            首尔女子高中高一·1班 · 入学手续就绪
          </div>

          <button
            onClick={handleStartGame}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#6b5847] via-[#85705d] to-[#59483a] hover:from-[#7a6552] hover:to-[#685545] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>确认建档 · 开启首尔女高生活</span>
          </button>
        </div>
      </div>
    </div>
  );
};
