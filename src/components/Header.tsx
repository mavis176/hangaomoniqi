import React from 'react';
import { GameStats, AIConfig } from '../types';
import { protagonistAvatar } from '../data/gameData';
import { Sparkles, Award, Smartphone } from 'lucide-react';

interface HeaderProps {
  stats: GameStats;
  gradeYear: number;
  aiConfig: AIConfig;
  unlockedEndingsCount: number;
  protagonistAvatarUrl?: string;
  onOpenAISettings: () => void;
  onOpenWardrobe: () => void;
  onOpenSNS: () => void;
  onOpenEndings: () => void;
  onOpenLifePath: () => void;
  onOpenMap?: () => void;
  onOpenPortraitWorkshop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  gradeYear,
  aiConfig,
  unlockedEndingsCount,
  protagonistAvatarUrl,
  onOpenAISettings,
  onOpenWardrobe,
  onOpenSNS,
  onOpenEndings,
  onOpenLifePath,
  onOpenMap,
  onOpenPortraitWorkshop,
}) => {
  const moodLabel = stats.mood >= 75 ? '极佳' : stats.mood >= 45 ? '普通' : '低落';
  const avatarSrc = protagonistAvatarUrl || protagonistAvatar;

  return (
    <header className="relative w-full z-30 px-1.5 sm:px-3 md:px-4 pt-1.5 pb-1 bg-gradient-to-b from-[#5a564f]/92 via-[#6b665e]/82 to-[#6b665e]/68 backdrop-blur-md border-b border-[#b8b1a5]/50 shadow-[0_4px_16px_rgba(0,0,0,0.22)] shrink-0">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-1.5 md:gap-2.5">
        {/* Left: Protagonist Portrait + Name/Grade/School Plaque */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={onOpenWardrobe}
            className="relative w-10 h-11 sm:w-12 sm:h-13 md:w-14 md:h-15 rounded-xl overflow-hidden border-2 border-[#f5e6eb] shadow-[0_4px_12px_rgba(0,0,0,0.35)] bg-[#fceef3] shrink-0 group cursor-pointer"
            title="点击更换韩漫立绘头像、校服、发型、配饰、妆容"
          >
            <img
              src={avatarSrc}
              alt="李秀妍"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </button>

          <div className="bg-gradient-to-b from-[#969087]/90 to-[#7d776e]/90 border border-[#bdb7ad]/70 rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] flex flex-col justify-center min-w-[84px] sm:min-w-[112px] md:min-w-[136px]">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-white text-xs sm:text-sm md:text-base tracking-wide drop-shadow-sm leading-none">
                李秀妍
              </span>
              <span className="bg-[#5c6d7e] border border-[#8396a8]/60 text-white text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded leading-none shadow-inner">
                高{gradeYear}
              </span>
            </div>

            <div className="mt-1 bg-[#e6dfd5] border border-[#fbf9f5] rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-inner">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-[#d9a441] to-[#a6761e] text-white text-[7px] font-black flex items-center justify-center shrink-0 shadow-xs">
                ✿
              </span>
              <span className="text-[#423b32] text-[9px] sm:text-[10px] font-bold tracking-tight whitespace-nowrap">
                首尔女高
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: 7 Core Attributes + SNS + Endings + AI Hub */}
        <div
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto overscroll-contain no-scrollbar py-0.5 pr-1"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {/* 1. 心情 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">😊</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                心情({moodLabel})
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.mood}
              </span>
            </div>
          </div>

          {/* 2. 体力 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">⚡</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                体力
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.stamina}/100
              </span>
            </div>
          </div>

          {/* 3. 学业 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">📚</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                学业
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.academics}
              </span>
            </div>
          </div>

          {/* 4. 社交 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">💬</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                社交
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.social}
              </span>
            </div>
          </div>

          {/* 5. 外形 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">✨</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                外形
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.appearance}
              </span>
            </div>
          </div>

          {/* 6. 家庭关系 */}
          <div className="bg-[#6b665e]/85 border border-[#9e988e]/60 rounded-lg px-2 py-1 flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] shrink-0">
            <span className="text-sm">🏡</span>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] md:text-[10px] text-[#e6e1d8] font-medium whitespace-nowrap">
                家庭
              </span>
              <span className="text-[11px] md:text-xs text-white font-bold tabular-nums whitespace-nowrap">
                {stats.family}
              </span>
            </div>
          </div>

          {/* 7. 经济/韩元 */}
          <div
            className="bg-[#594d3b]/90 border border-[#d6b87c]/60 rounded-lg px-2 py-1 flex items-center gap-1.5 shrink-0"
            title={`每周零花钱: ₩${stats.allowance.toLocaleString()}`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#f5d073] via-[#d9a236] to-[#9e6e14] border border-[#fae3a4] shadow-xs flex items-center justify-center shrink-0">
              <span className="text-[#593a04] font-black text-[10px] leading-none">₩</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] text-[#f5dec0] whitespace-nowrap">
                零花+{Math.round(stats.allowance / 1000)}k/周
              </span>
              <span className="text-white font-bold text-xs md:text-sm tabular-nums whitespace-nowrap">
                {stats.coins.toLocaleString()}元
              </span>
            </div>
          </div>

          {/* Exploration Map Button */}
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="bg-gradient-to-b from-[#e8d5be] to-[#cca783] hover:from-[#f5e4ce] hover:to-[#dbb591] border border-white text-[#382617] rounded-xl px-2.5 py-1.5 text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              title="打开校园与首尔都市探索地图 (12大地点·专属互动)"
            >
              <span className="text-sm leading-none">🗺️</span>
              <span className="whitespace-nowrap">探索地图</span>
            </button>
          )}

          {/* NPC & Protagonist Portrait Workshop Button */}
          {onOpenPortraitWorkshop && (
            <button
              onClick={onOpenPortraitWorkshop}
              className="hidden sm:flex bg-gradient-to-b from-[#eed4d9] to-[#d9a8b5] hover:from-[#fae3e8] hover:to-[#e6b8c4] border border-white text-[#4a222f] rounded-xl px-2.5 py-1.5 text-xs font-black items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
              title="角色立绘形象工坊：官方精选立绘、AI生图、上传图片"
            >
              <span className="text-sm leading-none">🎭</span>
              <span className="whitespace-nowrap">立绘工坊</span>
            </button>
          )}

          {/* Stargram / Kakao Phone Button */}
          <button
            onClick={onOpenSNS}
            className="bg-gradient-to-b from-[#f7d9e3] to-[#e6b8c9] hover:from-[#fce8ef] hover:to-[#f0c7d6] border border-white text-[#4a2533] rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            title="打开手机：KakaoTalk 聊天 & Stargram 网红经营"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#9e3b60]" />
            <span className="whitespace-nowrap">
              SNS {(stats.snsFollowers / 1000).toFixed(1)}k粉
            </span>
          </button>

          {/* Life Path Post-High School Story Button */}
          <button
            onClick={onOpenLifePath}
            className="bg-gradient-to-b from-[#f2d79d] to-[#d6ab4d] hover:from-[#fce4b3] hover:to-[#e3be64] border border-[#fffaed] text-[#382607] rounded-xl px-2.5 py-1.5 text-xs font-black flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            title="毕业后人生进阶篇章：顶流爱豆、名门大学精英、财阀太太"
          >
            <span className="text-sm leading-none">👑</span>
            <span className="whitespace-nowrap">人生篇章</span>
          </button>

          {/* 13 Endings Gallery & Graduation Button */}
          <button
            onClick={onOpenEndings}
            className="bg-gradient-to-b from-[#e8dcc4] to-[#cbb894] hover:from-[#f3ead8] hover:to-[#d8c7a6] border border-[#f7f2e7] text-[#3d3322] rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
            title="查看13大结局收集图鉴或立即进行毕业结局结算"
          >
            <Award className="w-3.5 h-3.5 text-[#8c5e14]" />
            <span className="whitespace-nowrap">结局({unlockedEndingsCount}/13)</span>
          </button>

          {/* AI Engine Config Button */}
          <button
            onClick={onOpenAISettings}
            className="bg-[#544e44]/90 hover:bg-[#665f53] border border-[#b8b1a5]/70 text-[#f5ebd6] rounded-xl px-2 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
            title="配置 AI 剧情与取向偏好"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f5d68e]" />
            <span className="hidden lg:inline">
              {aiConfig.mode === 'custom' ? '自定义API' : 'AI设定'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
