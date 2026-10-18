import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  Sparkles,
  Users,
  Check,
  ChevronRight,
  ArrowRight,
  Zap,
  Coins,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { GameStats, NPCClassmate } from '../../types';
import { MAP_LOCATIONS, MapLocationInfo, MapActionItem } from '../../data/mapData';

interface MapModalProps {
  onClose: () => void;
  stats: GameStats;
  npcs: NPCClassmate[];
  currentLocationName: string;
  onSetCurrentLocation: (locName: string, bgUrl?: string) => void;
  onExecuteMapAction: (action: MapActionItem, location: MapLocationInfo) => void;
  onOpenPortraitModal?: (npcId?: string) => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  onClose,
  stats,
  npcs,
  currentLocationName,
  onSetCurrentLocation,
  onExecuteMapAction,
  onOpenPortraitModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeLocationId, setActiveLocationId] = useState<string>(
    MAP_LOCATIONS.find((l) => l.name === currentLocationName)?.id || MAP_LOCATIONS[0].id
  );
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'locations' | 'actions'>('locations');

  const categories = [
    { id: 'all', label: '全部地点 (12)' },
    { id: 'campus', label: '🏫 校园教学与活动 (7)' },
    { id: 'city', label: '🏙️ 校外升学与潮流 (3)' },
    { id: 'luxury', label: '💎 星途与名媛高定 (2)' },
  ];

  const filteredLocations =
    selectedCategory === 'all'
      ? MAP_LOCATIONS
      : MAP_LOCATIONS.filter((l) => l.category === selectedCategory);

  const activeLoc =
    MAP_LOCATIONS.find((l) => l.id === activeLocationId) || MAP_LOCATIONS[0];

  const activeLocNpcs = npcs.filter((n) => activeLoc.frequentNpcIds.includes(n.id));

  const handleActionClick = (action: MapActionItem) => {
    // Check if player has enough stamina (if cost is positive)
    if (action.costStamina > 0 && stats.stamina < action.costStamina) {
      setLastActionResult(`⚠️ 体力不足！需要 ${action.costStamina} 点体力，请先在校医室或食堂休息。`);
      return;
    }
    // Check coins
    if (action.costCoins > 0 && stats.coins < action.costCoins) {
      setLastActionResult(`⚠️ 零钱不足！需要 ₩${action.costCoins.toLocaleString()}，无法完成此行动。`);
      return;
    }

    onExecuteMapAction(action, activeLoc);
    setLastActionResult(`✨ 成功完成【${action.name}】！${action.successMessage}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="bg-[#f5f1e8] border-2 border-[#d9d0be] rounded-2xl max-w-5xl w-full h-[92vh] max-h-[850px] flex flex-col overflow-hidden shadow-2xl text-[#2b251e]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#44382c] via-[#5c4c3b] to-[#73604b] px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between text-white border-b border-[#8c7865] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-200 shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-base font-black tracking-wide">
                  首尔女高 · 漫游地图
                </h2>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400/20 border border-amber-300/40 text-amber-200 hidden sm:inline-block">
                  12大地标
                </span>
              </div>
              <p className="text-[10px] text-[#e0d6cb] hidden sm:block">
                点击地点前往探索专属互动与NPC羁绊
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPortraitModal && (
              <button
                onClick={() => onOpenPortraitModal()}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0e4cf]/20 hover:bg-[#f0e4cf]/30 border border-amber-200/40 text-[11px] font-bold text-amber-100 transition-all cursor-pointer"
                title="打开NPC更换立绘工坊"
              >
                <span>🎭 立绘工坊</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tab Bar */}
        <div className="bg-[#ede5d6] border-b border-[#dad0bd] px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#5c4c3b] text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-[#524536] border border-[#d6ccb8]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-[#5c4c3b]">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>体力: {stats.stamina}/100</span>
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>零钱: ₩{stats.coins.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Mobile View Segmented Switcher (Visible only on mobile screens) */}
        <div className="md:hidden bg-[#e2d8c5] border-b border-[#cfc4af] px-3 py-1.5 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMobileTab('locations')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'locations'
                ? 'bg-[#5c4c3b] text-white shadow-xs'
                : 'bg-white/70 text-[#524536]'
            }`}
          >
            📍 场景列表 ({filteredLocations.length})
          </button>
          <button
            onClick={() => setMobileTab('actions')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'actions'
                ? 'bg-[#5c4c3b] text-white shadow-xs'
                : 'bg-white/70 text-[#524536]'
            }`}
          >
            ⚡ 探索行动: {activeLoc.name}
          </button>
        </div>

        {/* Main Body: Left Locations Grid/List + Right Detailed Place & Actions */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left: Location Cards List */}
          <div
            className={`w-full md:w-5/12 border-r border-[#dad0bd] flex-1 min-h-0 overflow-y-auto touch-scroll overscroll-contain p-2 sm:p-3 pb-10 space-y-2 bg-[#f9f7f2]/60 ${
              mobileTab === 'actions' ? 'hidden md:block' : 'block'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="text-[11px] font-bold text-[#7a6b5a] px-1 pb-1 flex items-center justify-between">
              <span>选择探索目的地：</span>
              <span>当前停留：【{currentLocationName}】</span>
            </div>

            <div className="space-y-2">
              {filteredLocations.map((loc) => {
                const isSelected = loc.id === activeLocationId;
                const isCurrent = loc.name === currentLocationName;
                const hereNpcs = npcs.filter((n) => loc.frequentNpcIds.includes(n.id));

                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setActiveLocationId(loc.id);
                      setMobileTab('actions');
                      setLastActionResult(null);
                    }}
                    className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#594939] to-[#715f4d] text-white border-[#594939] shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-[#faf6ee] text-[#2b251e] border-[#dbd1bf] shadow-2xs'
                    }`}
                  >
                    {/* Location Thumbnail */}
                    <div className="relative w-20 h-16 sm:w-22 sm:h-18 rounded-lg overflow-hidden shrink-0 border border-black/10">
                      <img
                        src={loc.bgUrl}
                        alt={loc.name}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-black/60 text-white backdrop-blur-xs">
                        {loc.floorBadge}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-black text-sm truncate flex items-center gap-1">
                          <span>{loc.name}</span>
                          {isCurrent && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                                isSelected
                                  ? 'bg-amber-400 text-stone-900'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              当前在此
                            </span>
                          )}
                        </h3>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-amber-300' : 'text-stone-400'
                          }`}
                        />
                      </div>

                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-amber-100/90' : 'text-[#6e6050]'
                        }`}
                      >
                        {loc.tagline}
                      </p>

                      {/* Frequent NPCs avatars */}
                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 opacity-70" />
                          <div className="flex -space-x-1.5 items-center">
                            {hereNpcs.map((n) => (
                              <img
                                key={n.id}
                                src={n.avatar}
                                alt={n.chineseName}
                                className="w-4.5 h-4.5 rounded-full border border-white object-cover shadow-2xs"
                                title={`常驻：${n.chineseName} (${n.relationshipStage})`}
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] ml-1 opacity-80">
                            {hereNpcs.map((n) => n.chineseName).join('、')}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold ${
                            isSelected ? 'text-amber-200' : 'text-[#857666]'
                          }`}
                        >
                          {loc.actions.length}个行动
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Selected Location View & Actions */}
          <div
            className={`w-full md:w-7/12 flex-1 min-h-0 flex flex-col overflow-y-auto touch-scroll overscroll-contain p-3 sm:p-4 pb-10 bg-[#fbf9f5] ${
              mobileTab === 'locations' ? 'hidden md:flex' : 'flex'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Mobile Return to Locations List Bar */}
            <div className="md:hidden mb-2.5">
              <button
                onClick={() => setMobileTab('locations')}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#d6ccb8] text-xs font-bold text-[#5c4c3b] flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <span>← 返回地点列表</span>
              </button>
            </div>
            {/* Action Feedback Banner */}
            {lastActionResult && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="flex-1">{lastActionResult}</span>
                <button
                  onClick={() => setLastActionResult(null)}
                  className="text-amber-800 hover:text-amber-950 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Location Hero Showcase */}
            <div className="relative rounded-2xl overflow-hidden border border-[#d6cdbc] shadow-sm mb-3 sm:mb-4 shrink-0">
              <img
                src={activeLoc.bgUrl}
                alt={activeLoc.name}
                className="w-full h-32 sm:h-52 object-cover object-center brightness-[0.95]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-black bg-amber-500 text-stone-950 shadow-md">
                  {activeLoc.floorBadge}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-black/60 text-white backdrop-blur-xs">
                  {activeLoc.categoryLabel}
                </span>
              </div>

              {/* Set as main background button */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => {
                    onSetCurrentLocation(activeLoc.name, activeLoc.bgUrl);
                    setLastActionResult(`🌟 已将【${activeLoc.name}】设为当前校园主场景！`);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#382e24] text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {activeLoc.name === currentLocationName ? '当前主界面场景' : '设为当前主场景'}
                  </span>
                </button>
              </div>

              {/* Bottom text inside banner */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h2 className="text-xl font-black drop-shadow-md flex items-center gap-2">
                  <span>{activeLoc.name}</span>
                </h2>
                <p className="text-xs text-amber-200 font-bold mt-0.5">{activeLoc.tagline}</p>
                <p className="text-[11px] text-stone-200 mt-1 leading-relaxed drop-shadow-xs max-w-xl">
                  {activeLoc.description}
                </p>
              </div>
            </div>

            {/* NPCs Present at this location */}
            <div className="mb-4 bg-[#f0e9dc] border border-[#dcd2bf] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#473b2e] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8a7258]" />
                  <span>此地常驻角色 ({activeLocNpcs.length}人)：</span>
                </span>
                {onOpenPortraitModal && (
                  <button
                    onClick={() => onOpenPortraitModal(activeLocNpcs[0]?.id)}
                    className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                  >
                    🎭 调整角色立绘
                  </button>
                )}
              </div>

              {activeLocNpcs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeLocNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      className="bg-white/90 border border-[#dbd1bd] rounded-xl p-2 flex items-center gap-2.5 shadow-2xs"
                    >
                      <img
                        src={npc.avatar}
                        alt={npc.chineseName}
                        className="w-10 h-10 rounded-lg object-cover border border-[#e4b8c6] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-[#2b251e]">
                            {npc.chineseName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            {npc.relationshipStage}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#706251] truncate mt-0.5">
                          好感: {npc.favorability}/100 · 心动: {npc.romancePoints || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#706251] italic">
                  此区域主要为自主活动与观光体验，较少有固定同班同学常驻。
                </p>
              )}
            </div>

            {/* Location Interactive Actions Title */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-[#382e24] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>可执行的地点互动行动 ({activeLoc.actions.length})</span>
              </h3>
              <span className="text-[11px] text-[#706251]">消耗体力/零钱，获得丰富属性成长与剧情！</span>
            </div>

            {/* Actions List */}
            <div className="space-y-2.5 flex-1">
              {activeLoc.actions.map((act) => {
                const canAffordStamina = act.costStamina <= 0 || stats.stamina >= act.costStamina;
                const canAffordCoins = act.costCoins <= 0 || stats.coins >= act.costCoins;
                const canExecute = canAffordStamina && canAffordCoins;

                return (
                  <div
                    key={act.id}
                    className="bg-white border border-[#dad0bd] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-amber-400/80 transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#f5ede0] border border-[#e3d7c3] flex items-center justify-center text-lg shrink-0">
                        {act.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-black text-sm text-[#2b251e]">{act.name}</h4>
                          {/* Cost Badges */}
                          {act.costStamina > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              体力 -{act.costStamina}
                            </span>
                          )}
                          {act.costStamina < 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              体力 +{Math.abs(act.costStamina)}
                            </span>
                          )}
                          {act.costCoins > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              ₩{act.costCoins.toLocaleString()}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#594d3f] mt-1 leading-relaxed">{act.desc}</p>

                        {/* Dialogue snippet or NPC interaction */}
                        {act.dialogueSnippet && (
                          <div className="mt-1.5 text-[11px] text-rose-900 bg-rose-50/70 border border-rose-200/80 rounded-lg px-2 py-1 leading-relaxed italic">
                            💬 {act.dialogueSnippet}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Execution Button */}
                    <button
                      onClick={() => handleActionClick(act)}
                      disabled={!canExecute}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                        canExecute
                          ? 'bg-gradient-to-r from-[#594939] to-[#715f4d] hover:from-[#6b5845] hover:to-[#85705b] text-white shadow-xs cursor-pointer active:scale-95'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{canExecute ? '立即进行' : '条件不足'}</span>
                    </button>
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
