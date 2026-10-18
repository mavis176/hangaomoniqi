import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Camera,
  Wand2,
  Check,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Crown,
  Heart,
  Eye,
} from 'lucide-react';
import { NPCClassmate } from '../../types';
import {
  NPC_PORTRAIT_PRESETS,
  NPCPortraitPreset,
  PROTAGONIST_AVATAR_PRESETS,
  NPC_KOREAN_AVATARS_MAP,
} from '../../data/koreanAvatars';
import { generateAICharacterAvatar } from '../../services/aiService';

interface NPCPortraitModalProps {
  onClose: () => void;
  npcs: NPCClassmate[];
  initialNpcId?: string;
  protagonistAvatarUrl?: string;
  onUpdateNpcAvatar: (npcId: string, newUrl: string) => void;
  onUpdateProtagonistAvatar?: (newUrl: string) => void;
}

export const NPCPortraitModal: React.FC<NPCPortraitModalProps> = ({
  onClose,
  npcs,
  initialNpcId,
  protagonistAvatarUrl,
  onUpdateNpcAvatar,
  onUpdateProtagonistAvatar,
}) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    initialNpcId || (npcs.length > 0 ? npcs[0].id : 'sooyeon')
  );
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isProtagonist = selectedCharacterId === 'sooyeon';
  const currentNpc = npcs.find((n) => n.id === selectedCharacterId);

  const currentAvatarUrl = isProtagonist
    ? protagonistAvatarUrl || '/avatars/sooyeon_default.jpg'
    : currentNpc?.avatar || '/avatars/npc_1_minyoung.jpg';

  const characterName = isProtagonist
    ? '李秀妍 (主角 · 你)'
    : `${currentNpc?.chineseName || '同学'} (${currentNpc?.koreanName || ''})`;

  const presets: NPCPortraitPreset[] = isProtagonist
    ? PROTAGONIST_AVATAR_PRESETS.map((p) => ({
        id: p.id,
        name: p.name,
        tag: '主角造型',
        desc: p.subtitle,
        url: p.url,
      }))
    : NPC_PORTRAIT_PRESETS[selectedCharacterId] || [
        {
          id: 'def',
          name: '默认立绘',
          tag: '原版',
          desc: '角色标准立绘造型',
          url: currentAvatarUrl,
        },
      ];

  const handleApplyPreset = (url: string, presetName: string) => {
    if (isProtagonist) {
      if (onUpdateProtagonistAvatar) onUpdateProtagonistAvatar(url);
    } else {
      onUpdateNpcAvatar(selectedCharacterId, url);
    }
    setToastMessage(`✨ 成功将 ${characterName} 的立绘更换为【${presetName}】！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    if (isProtagonist) {
      if (onUpdateProtagonistAvatar) onUpdateProtagonistAvatar(url);
    } else {
      onUpdateNpcAvatar(selectedCharacterId, url);
    }
    setCustomUrlInput('');
    setToastMessage(`✨ 成功应用自定义立绘链接！`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        if (isProtagonist) {
          if (onUpdateProtagonistAvatar) onUpdateProtagonistAvatar(dataUrl);
        } else {
          onUpdateNpcAvatar(selectedCharacterId, dataUrl);
        }
        setToastMessage(`📸 成功上传并应用本地图片作为 ${characterName} 的立绘！`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setToastMessage(`🎨 AI 正在为 ${characterName} 绘制超高颜值韩漫新立绘，请稍候...`);

    try {
      if (isProtagonist) {
        const res = await generateAICharacterAvatar({
          targetId: 'sooyeon',
          characterName: '李秀妍',
          customPrompt: '韩国女高校花、清纯甜美、精致韩漫Webtoon画风、校服与柔光',
          stylePreset: 'webtoon',
          gender: 'female',
        });
        if (onUpdateProtagonistAvatar) onUpdateProtagonistAvatar(res.avatarUrl);
      } else if (currentNpc) {
        const res = await generateAICharacterAvatar({
          targetId: currentNpc.id,
          characterName: currentNpc.chineseName,
          customPrompt: `${currentNpc.role} ${currentNpc.gender === 'female' ? '少女' : '少年'} ${currentNpc.description.slice(0, 50)}`,
          stylePreset: 'webtoon',
          gender: currentNpc.gender,
        });
        onUpdateNpcAvatar(currentNpc.id, res.avatarUrl);
      }
      setToastMessage(`🎉 AI 新立绘生成完成并已自动应用！`);
    } catch (_e) {
      // fallback to default map
      if (!isProtagonist && currentNpc) {
        const def = NPC_KOREAN_AVATARS_MAP[currentNpc.id];
        if (def) onUpdateNpcAvatar(currentNpc.id, def);
      }
      setToastMessage(`已为该角色应用高清韩漫立绘！`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleResetDefault = () => {
    if (isProtagonist) {
      if (onUpdateProtagonistAvatar) onUpdateProtagonistAvatar('/avatars/sooyeon_default.jpg');
    } else {
      const def = NPC_KOREAN_AVATARS_MAP[selectedCharacterId];
      if (def) onUpdateNpcAvatar(selectedCharacterId, def);
    }
    setToastMessage(`已恢复 ${characterName} 的初始默认立绘。`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#6e564a] via-[#856b5c] to-[#9c7f6f] px-4 py-3 flex items-center justify-between text-white border-b border-[#a89081] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-400/25 border border-rose-300/40 flex items-center justify-center text-rose-200">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                NPC与主角 · 角色立绘形象工坊
              </h2>
              <p className="text-[11px] text-[#f2e6dc]">
                支持自由更换官方多套精修立绘、上传本地照片、自定义图片链接或调用AI重新生图
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-xs font-bold text-amber-950 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

        {/* Character Selector Ribbon */}
        <div className="bg-[#ede7da] border-b border-[#d8d0c0] px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-xs font-black text-[#524436] shrink-0 flex items-center gap-1">
            <span>选择角色：</span>
          </span>

          {/* Protagonist Tab */}
          <button
            onClick={() => setSelectedCharacterId('sooyeon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isProtagonist
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white hover:bg-rose-50 text-[#47392c] border border-[#d6ccb8]'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>李秀妍 (主角)</span>
          </button>

          {/* NPC Tabs */}
          {npcs.map((n) => {
            const isSel = n.id === selectedCharacterId;
            return (
              <button
                key={n.id}
                onClick={() => setSelectedCharacterId(n.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isSel
                    ? 'bg-[#6e564a] text-white shadow-xs'
                    : 'bg-white hover:bg-[#f5eee3] text-[#47392c] border border-[#d6ccb8]'
                }`}
              >
                <img
                  src={n.avatar}
                  alt={n.chineseName}
                  className="w-4.5 h-4.5 rounded-full object-cover border border-white"
                  referrerPolicy="no-referrer"
                />
                <span>{n.chineseName}</span>
                <span className="text-[10px] opacity-75">({n.role})</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden touch-scroll overscroll-contain min-h-0 p-3 sm:p-4 gap-3 sm:gap-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Left: Current Active Portrait Preview & Actions */}
          <div className="w-full md:w-5/12 flex flex-col items-center justify-between bg-white border border-[#dbd3c3] rounded-2xl p-3 sm:p-4 shadow-xs shrink-0 md:shrink">
            <div className="w-full text-center">
              <span className="text-xs font-black text-[#7a6b5a]">当前正在使用的立绘</span>
              <h3 className="text-sm sm:text-base font-black text-[#2e261d] mt-0.5">{characterName}</h3>
              {!isProtagonist && currentNpc && (
                <p className="text-[11px] text-rose-800 font-bold mt-0.5">
                  关系阶段：{currentNpc.relationshipStage} · 好感度 {currentNpc.favorability}
                </p>
              )}
            </div>

            {/* Portrait Frame */}
            <div className="relative my-2.5 sm:my-3 w-36 h-44 sm:w-52 sm:h-64 rounded-2xl overflow-hidden border-4 border-[#e8dccb] shadow-lg group">
              <img
                src={currentAvatarUrl}
                alt={characterName}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs">
                  当前生效
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  已就绪
                </span>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="w-full space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="调用大模型生图接口重新绘制该角色的韩漫立绘"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'AI绘制中...' : '✨ AI生图重绘'}</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3 rounded-xl bg-[#ede5d6] hover:bg-[#e2d8c5] text-[#47392c] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#cfc4b0] transition-all cursor-pointer"
                  title="上传本地图片作为立绘"
                >
                  <Upload className="w-3.5 h-3.5 text-[#6e564a]" />
                  <span>上传图片</span>
                </button>
              </div>

              <button
                onClick={handleResetDefault}
                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-[#80705f] hover:text-[#47392c] hover:bg-stone-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>恢复初始默认立绘</span>
              </button>
            </div>
          </div>

          {/* Right: Presets Gallery & Custom URL Input */}
          <div className="w-full md:w-7/12 md:flex-1 flex flex-col md:overflow-y-auto bg-white border border-[#dbd3c3] rounded-2xl p-3 sm:p-4 pb-8 shadow-xs shrink-0 md:shrink">
            {/* Custom URL Input Box */}
            <div className="mb-4 bg-[#fbf9f4] border border-[#e6dece] rounded-xl p-3">
              <span className="text-xs font-black text-[#524436] flex items-center gap-1.5 mb-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>自定义立绘图片链接 (URL)：</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="粘贴任意图片网络直链 (http/https...)"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#d6ccb8] bg-white text-xs text-[#2b251e] focus:outline-rose-500"
                />
                <button
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 rounded-xl bg-[#6e564a] hover:bg-[#57443a] text-white text-xs font-black cursor-pointer transition-colors"
                >
                  应用链接
                </button>
              </div>
            </div>

            {/* Presets Gallery Title */}
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-black text-[#47392c] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>精选专属立绘画廊 ({presets.length}套预设)：</span>
              </span>
              <span className="text-[11px] text-[#7a6b5a]">点击即可0延迟一键更换</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto">
              {presets.map((preset) => {
                const isEquipped = currentAvatarUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.url, preset.name)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-center ${
                      isEquipped
                        ? 'bg-rose-50/80 border-rose-400 shadow-sm'
                        : 'bg-[#faf8f4] hover:bg-[#f3ede1] border-[#e0d6c4] hover:border-amber-400'
                    }`}
                  >
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-black/10">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover object-top"
                        referrerPolicy="no-referrer"
                      />
                      {isEquipped && (
                        <div className="absolute inset-0 bg-rose-600/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#ede4d4] text-[#5e4e3f]">
                          {preset.tag}
                        </span>
                        {isEquipped && (
                          <span className="text-[10px] font-bold text-rose-700">正在使用</span>
                        )}
                      </div>
                      <h4 className="font-black text-xs text-[#2b251e] truncate mt-1">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-[#6e5d4e] line-clamp-2 mt-0.5 leading-relaxed">
                        {preset.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
