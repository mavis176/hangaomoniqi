import React, { useState, useRef } from 'react';
import { X, Sparkles, Check, ShoppingBag, UserCircle2, Upload, Palette, Wand2 } from 'lucide-react';
import { WardrobeItem, GameStats } from '../../types';
import { PROTAGONIST_AVATAR_PRESETS, AVATAR_STYLE_PACKS } from '../../data/koreanAvatars';
import { generateAICharacterAvatar } from '../../services/aiService';

interface WardrobeModalProps {
  onClose: () => void;
  wardrobe: WardrobeItem[];
  stats: GameStats;
  currentAvatarUrl?: string;
  onChangeAvatar?: (newUrl: string) => void;
  onApplyStylePack?: (packId: 'webtoon' | 'anime' | 'pastel') => void;
  onBuyItem: (itemId: string, price: number, bonus: number) => void;
  onEquipItem: (itemId: string) => void;
  onNotify?: (msg: string) => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  onClose,
  wardrobe,
  stats,
  currentAvatarUrl,
  onChangeAvatar,
  onApplyStylePack,
  onBuyItem,
  onEquipItem,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'uniform' | 'hair' | 'shoes' | 'accessory' | 'makeup'>('all');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('韩系清纯女高，柔顺微卷长发，水光感大眼睛，校服针织开衫');
  const [isAiDrawing, setIsAiDrawing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'all', label: '全部穿搭' },
    { id: 'uniform', label: '🧥 校服' },
    { id: 'hair', label: '💇‍♀️ 发型' },
    { id: 'shoes', label: '👞 鞋子' },
    { id: 'accessory', label: '👓 配饰' },
    { id: 'makeup', label: '💄 妆容' },
  ];

  const filteredItems =
    activeTab === 'all' ? wardrobe : wardrobe.filter((item) => item.type === activeTab);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChangeAvatar) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeAvatar(reader.result);
        if (onNotify) onNotify('✨ 已成功上传并更换主角专属立绘头像！');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerAIGen = async () => {
    if (!onChangeAvatar || !aiPrompt.trim() || isAiDrawing) return;
    setIsAiDrawing(true);
    try {
      const res = await generateAICharacterAvatar({
        targetId: 'protagonist',
        characterName: '李秀妍',
        customPrompt: aiPrompt.trim(),
        stylePreset: 'webtoon',
        gender: 'female',
      });
      onChangeAvatar(res.avatarUrl);
      if (onNotify) onNotify('✨ AI 生图完成！已为你换上最新生成的韩漫立绘头像！');
    } catch (_e) {
      if (onNotify) onNotify('AI 生图正忙，请稍后再试~');
    } finally {
      setIsAiDrawing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7d6858] to-[#998270] px-4 py-3 flex items-center justify-between text-white border-b border-[#b5a395]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#f5d68e]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">韩漫主角立绘头像 & 穿搭美妆衣橱</h2>
              <p className="text-[11px] text-[#f2e9e1]">
                当前外形：{stats.appearance}分 · 支持一键切换全员韩漫/二次元立绘、本地上传头像或更换穿搭
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

        {/* Unified Scrollable Content Area */}
        <div
          className="flex-1 overflow-y-auto touch-scroll overscroll-contain min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        {/* Protagonist & Full-Cast Korean Webtoon Avatar Switcher */}
        {onChangeAvatar && (
          <div className="bg-[#eae4d8] border-b border-[#cfc7b8] px-3 sm:px-4 py-3 space-y-2.5">
            {/* Full-Cast Style Pack Switcher */}
            {onApplyStylePack && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#d6cfc2]">
                <span className="text-xs font-black text-[#2b2620] flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>一键切换全员（主角+7位NPC）立绘画风：</span>
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

            {/* AI Live Portrait Generator Bar */}
            <div className="bg-gradient-to-r from-rose-50/90 to-pink-50/90 border border-rose-300 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-900 shrink-0">
                <Wand2 className="w-4 h-4 text-rose-600" />
                <span>AI 实时生图换立绘：</span>
              </div>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="输入外貌/穿搭词（如：清冷黑长直财阀千金，泪痣，深蓝校服）..."
                className="flex-1 bg-white border border-rose-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              />
              <button
                onClick={handleTriggerAIGen}
                disabled={isAiDrawing}
                className="px-3 py-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiDrawing ? 'animate-spin' : ''}`} />
                <span>{isAiDrawing ? 'AI生图中...' : '✨ 立即AI生图'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-[#2b2620] flex items-center gap-1.5">
                <UserCircle2 className="w-4 h-4 text-rose-600" />
                <span>切换李秀妍（主角）专属立绘形象：</span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传本地头像</span>
                </button>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="或粘贴图片URL..."
                  className="bg-white border border-[#bfb6a6] rounded-lg px-2.5 py-1 text-xs w-36 sm:w-44"
                />
                <button
                  onClick={() => {
                    if (!customUrlInput.trim()) return;
                    onChangeAvatar(customUrlInput.trim());
                    setCustomUrlInput('');
                    if (onNotify) onNotify('✨ 已应用自定义主角头像！');
                  }}
                  className="px-2.5 py-1 bg-[#7d6858] hover:bg-[#695648] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  应用
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PROTAGONIST_AVATAR_PRESETS.map((preset) => {
                const isSelected = currentAvatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onChangeAvatar(preset.url);
                      if (onNotify) onNotify(`✨ 已切换主角韩漫立绘：【${preset.name}】！`);
                    }}
                    className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fcf8ef] border-2 border-rose-500 shadow-xs'
                        : 'bg-white/90 hover:bg-white border-[#d6cfc2]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-10 h-10 rounded-lg object-cover border border-pink-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-[#2b2620] truncate">{preset.name}</div>
                      <div className="text-[9px] text-[#6e6456] truncate mt-0.5">{preset.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#7d6858] text-white'
                    : 'bg-[#e6dfd3] text-[#4a4238] hover:bg-[#d8cfc0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-bold text-[#6e5634] bg-[#eae3d5] px-2.5 py-1 rounded-lg">
            余额：₩{stats.coins.toLocaleString()}
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-3 sm:p-4 pb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                item.equipped
                  ? 'bg-[#fcf9f2] border-2 border-[#9e7a47] shadow-md'
                  : 'bg-white border-[#d6cfc2]'
              }`}
            >
              <div>
                <div className="relative h-32 w-full bg-[#e6dfd3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 right-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    外形 +{item.appearanceBonus} {item.socialBonus ? `· 社交 +${item.socialBonus}` : ''}
                  </span>
                </div>
                <div className="p-3">
                  <div className="font-bold text-xs sm:text-sm text-[#2b2620]">{item.name}</div>
                  <p className="text-[11px] text-[#6e6456] mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>

              <div className="px-3 pb-3 pt-1">
                {item.owned ? (
                  <button
                    onClick={() => {
                      onEquipItem(item.id);
                      if (onNotify) onNotify(`已穿戴【${item.name}】！`);
                    }}
                    disabled={item.equipped}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      item.equipped
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#dfd8ca] hover:bg-[#d2c9b8] text-[#3d352b]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{item.equipped ? '当前穿戴中' : '换上这件'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (stats.coins < item.price) {
                        if (onNotify) onNotify('韩元余额不足，可通过周末兼职或考试奖励获得金币！');
                        return;
                      }
                      onBuyItem(item.id, item.price, item.appearanceBonus);
                      if (onNotify) onNotify(`成功购入并穿戴【${item.name}】，外形 +${item.appearanceBonus}！`);
                    }}
                    className="w-full py-1.5 bg-gradient-to-r from-[#8c6d3b] to-[#6e542b] hover:from-[#9e7c44] hover:to-[#7d6032] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>购买 (₩{item.price.toLocaleString()})</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};
