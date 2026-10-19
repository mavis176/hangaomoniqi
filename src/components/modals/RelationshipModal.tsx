import React, { useState, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Utensils,
  Gift,
  Sparkles,
  Lock,
  Unlock,
  Palette,
  Camera,
  Wand2,
} from 'lucide-react';
import { NPCClassmate } from '../../types';
import { AVATAR_STYLE_PACKS, NPC_KOREAN_AVATARS_MAP } from '../../data/koreanAvatars';
import { generateAICharacterAvatar } from '../../services/aiService';

interface RelationshipModalProps {
  onClose: () => void;
  npcs: NPCClassmate[];
  clockMinutes?: number;
  weekdayIndex?: number;
  onOpenChat: (npc: NPCClassmate) => void;
  onOpenLunch: (npc: NPCClassmate) => void;
  onOpenGift: (npc: NPCClassmate) => void;
  onAdvanceStoryline?: (npc: NPCClassmate) => void;
  onApplyStylePack?: (packId: 'webtoon' | 'anime' | 'pastel') => void;
  onUpdateNpcAvatar?: (npcId: string, newAvatarUrl: string) => void;
  onOpenPortraitModal?: (npcId?: string) => void;
  onRequestStageChangePrompt?: (npc: NPCClassmate) => void;
  onTriggerRandomEncounter?: () => void;
}

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  onClose,
  npcs,
  onOpenChat,
  onOpenLunch,
  onOpenGift,
  onAdvanceStoryline,
  onApplyStylePack,
  onUpdateNpcAvatar,
  onOpenPortraitModal,
  onRequestStageChangePrompt,
  onTriggerRandomEncounter,
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [generatingNpcId, setGeneratingNpcId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dynamicCount = npcs.filter((n) => n.isGenerated).length;
  const roles = ['all', '✨动态邂逅', '同班同学', '补习班同学', '社团前辈', '运动部成员', '转学生', '学生会成员', '老师或职员'];

  const filteredNpcs =
    selectedRoleFilter === 'all'
      ? npcs
      : selectedRoleFilter === '✨动态邂逅'
      ? npcs.filter((n) => n.isGenerated)
      : npcs.filter((n) => n.role === selectedRoleFilter);

  const handleNpcFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingNpcId || !onUpdateNpcAvatar) return;
    const targetId = editingNpcId;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateNpcAvatar(targetId, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAIRegenerateNpc = async (npc: NPCClassmate) => {
    if (!onUpdateNpcAvatar || generatingNpcId) return;
    setGeneratingNpcId(npc.id);
    try {
      const res = await generateAICharacterAvatar({
        targetId: npc.id,
        characterName: npc.chineseName,
        customPrompt: `${npc.role} ${npc.description.slice(0, 50)}`,
        stylePreset: 'webtoon',
        gender: npc.gender,
      });
      onUpdateNpcAvatar(npc.id, res.avatarUrl);
    } catch (_e) {
      // fallback to default local AI portrait
      const def = NPC_KOREAN_AVATARS_MAP[npc.id];
      if (def) onUpdateNpcAvatar(npc.id, def);
    } finally {
      setGeneratingNpcId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6e5d53] to-[#8a7569] px-4 py-3 flex items-center justify-between text-white border-b border-[#9c9589]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-200 fill-rose-200" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                全向性感情线与人际档案 ({npcs.length}名核心角色 · AI精修立绘)
              </h2>
              <p className="text-[11px] text-[#f2e8e1]">
                支持同性、异性、双性、无性恋/挚友羁绊自然推进 · 支持一键【AI生图重绘】任意NPC头像或上传自定义立绘
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleNpcFileUpload}
          className="hidden"
        />

        {/* Top Art Style Switcher Bar */}
        {onApplyStylePack && (
          <div className="bg-[#eae3d5] border-b border-[#d4cbb8] px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-[#3d3429] flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-rose-600" />
              <span>全员NPC与主角AI立绘预设切换：</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {AVATAR_STYLE_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => onApplyStylePack(pack.id)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-[#cfc7b8] hover:border-rose-400 text-[11px] font-bold text-[#2b2620] transition-all cursor-pointer shadow-2xs"
                  title={pack.desc}
                >
                  {pack.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  selectedRoleFilter === r
                    ? 'bg-[#6e5d53] text-white'
                    : 'bg-[#e6dfd3] text-[#4a4238] hover:bg-[#d8cfc0]'
                }`}
              >
                {r === 'all' ? '全部角色' : r === '✨动态邂逅' ? `✨动态邂逅 (${dynamicCount})` : r}
              </button>
            ))}
          </div>

          {onTriggerRandomEncounter && (
            <button
              onClick={onTriggerRandomEncounter}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-black flex items-center gap-1 whitespace-nowrap shadow-xs cursor-pointer shrink-0"
              title="立即调用 AI 在首尔街头偶遇一位全新人物"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>偶遇新人物</span>
            </button>
          )}
        </div>

        {/* NPC Cards */}
        <div
          className="p-3 sm:p-4 pb-10 overflow-y-auto touch-scroll overscroll-contain grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filteredNpcs.map((npc) => {
            const secretUnlocked = npc.favorability >= 68 || npc.secretRevealed;
            const isGen = generatingNpcId === npc.id;
            return (
              <div
                key={npc.id}
                className="bg-white/95 border border-[#d6cfc2] rounded-2xl p-3.5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#e3c5d0] shadow-xs group">
                        <img
                          src={npc.avatar}
                          alt={npc.chineseName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 w-full">
                        {onOpenPortraitModal && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenPortraitModal(npc.id);
                            }}
                            className="w-full py-0.5 px-1.5 rounded bg-rose-50 hover:bg-rose-100 text-[10px] font-bold text-rose-700 border border-rose-200 flex items-center justify-center gap-0.5 cursor-pointer shadow-2xs"
                            title="打开该角色的专属立绘画廊与更换工坊"
                          >
                            <Palette className="w-2.5 h-2.5" />
                            <span>更换立绘</span>
                          </button>
                        )}
                        {onUpdateNpcAvatar && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAIRegenerateNpc(npc)}
                              disabled={isGen}
                              className="text-[9px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="调用 AI 重新生成该角色立绘"
                            >
                              <Wand2 className={`w-2.5 h-2.5 ${isGen ? 'animate-spin' : ''}`} />
                              <span>{isGen ? '生图中' : 'AI生图'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingNpcId(npc.id);
                                fileInputRef.current?.click();
                              }}
                              className="text-[9px] font-bold text-[#6e5634] hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                              title="上传本地自定义NPC立绘头像"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>上传</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base text-[#2b2620]">{npc.chineseName}</span>
                          <span className="text-xs text-[#7a7062]">{npc.koreanName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            关系：{npc.relationshipStage}
                          </span>
                          {onRequestStageChangePrompt && (
                            <button
                              onClick={() => onRequestStageChangePrompt(npc)}
                              className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[10px] font-black text-amber-900 cursor-pointer shadow-2xs transition-colors"
                              title="评定或由你确认是否晋升当前关系阶段"
                            >
                              进阶确认
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                        <span className="px-2 py-0.5 bg-[#ede8df] rounded font-bold text-[#4a4238]">
                          身份：{npc.role}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded font-bold">
                          取向：{npc.orientation}
                        </span>
                        {npc.isGenerated && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold">
                            ✨ 第{npc.encounterWeek || 1}周结识 · {npc.encounterLocation || '首尔街头'}
                          </span>
                        )}
                      </div>

                      {/* Favorability & Romance Progress Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-[#6e5d53]">亲密好感度</span>
                          <span className="text-rose-700">
                            {npc.favorability} / 100 · 心动值 {npc.romancePoints || 0}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#e6dfd3] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, npc.favorability)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Preferences */}
                  <p className="text-xs text-[#4a4238] mt-2.5 leading-relaxed">{npc.description}</p>

                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg px-2.5 py-1 text-emerald-900">
                      <span className="font-bold">🎁 喜欢礼物：</span>
                      {npc.likedGifts.join('、')}
                    </div>
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg px-2.5 py-1 text-amber-900">
                      <span className="font-bold">⚡ 讨厌属性：</span>
                      {npc.dislikedTraits.join('、')}
                    </div>
                  </div>

                  {/* Secret Box */}
                  <div
                    className={`mt-2 rounded-xl px-3 py-2 text-[11px] flex items-start gap-2 border ${
                      secretUnlocked
                        ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                        : 'bg-[#f2ede4] border-[#ddd5c7] text-[#7a7062]'
                    }`}
                  >
                    {secretUnlocked ? (
                      <Unlock className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#8c8273] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold">专属秘密与个人支线：</span>
                      {secretUnlocked ? npc.secret : '好感度达到 68 或推进个人剧情线后自然解锁该角色的深层秘密。'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-[#ece6dc] grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenChat(npc);
                    }}
                    className="py-1.5 px-2 bg-[#f0ebe1] hover:bg-[#e3dacb] text-[#3d352b] rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>AI聊天</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLunch(npc);
                    }}
                    className="py-1.5 px-2 bg-[#f0ebe1] hover:bg-[#e3dacb] text-[#3d352b] rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>约饭</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGift(npc);
                    }}
                    className="py-1.5 px-2 bg-[#f0ebe1] hover:bg-[#e3dacb] text-[#3d352b] rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>送礼</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onAdvanceStoryline) {
                        onClose();
                        onAdvanceStoryline(npc);
                      }
                    }}
                    className="py-1.5 px-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>约会剧情</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
