import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  Sparkles,
  Users,
  Zap,
  Coins,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react';
import { GameStats, NPCClassmate } from '../../types';
import {
  MAP_REGIONS,
  MAP_LOCATIONS,
  MapRegion,
  MapLocationInfo,
  MapActionItem,
} from '../../data/mapData';

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
  // Find initial region based on currentLocationName or default to 'campus'
  const initialLoc = MAP_LOCATIONS.find((l) => l.name === currentLocationName) || MAP_LOCATIONS[0];
  const [activeRegionId, setActiveRegionId] = useState<string>(initialLoc.regionId || 'campus');
  const [selectedLocId, setSelectedLocId] = useState<string>(initialLoc.id);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  const activeRegion = MAP_REGIONS.find((r) => r.id === activeRegionId) || MAP_REGIONS[0];

  // Locations belonging to current region
  const regionLocations = MAP_LOCATIONS.filter((l) => l.regionId === activeRegionId);

  // Selected location object
  const activeLoc =
    regionLocations.find((l) => l.id === selectedLocId) || regionLocations[0] || MAP_LOCATIONS[0];

  const activeLocNpcs = npcs.filter((n) => activeLoc.frequentNpcIds.includes(n.id));

  const handleRegionSwitch = (regionId: string) => {
    setActiveRegionId(regionId);
    setLastActionResult(null);
    const locsInNewRegion = MAP_LOCATIONS.filter((l) => l.regionId === regionId);
    if (locsInNewRegion.length > 0) {
      setSelectedLocId(locsInNewRegion[0].id);
    }
  };

  const handleGoToLocation = (loc: MapLocationInfo) => {
    onSetCurrentLocation(loc.name, loc.bgUrl);
    onClose();
  };

  const handleActionClick = (action: MapActionItem, location: MapLocationInfo) => {
    if (action.costStamina > 0 && stats.stamina < action.costStamina) {
      setLastActionResult(`⚠️ 体力不足！需要 ${action.costStamina} 点体力。`);
      return;
    }
    if (action.costCoins > 0 && stats.coins < action.costCoins) {
      setLastActionResult(`⚠️ 零钱不足！需要 ₩${action.costCoins.toLocaleString()}。`);
      return;
    }

    onExecuteMapAction(action, location);
    setLastActionResult(`✨ 成功完成【${action.name}】！${action.successMessage}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#f5f1e8] border-2 border-[#d9d0be] rounded-2xl max-w-5xl w-full h-[94vh] max-h-[880px] flex flex-col overflow-hidden shadow-2xl text-[#2b251e]">
        {/* Top Navigation Bar */}
        <div className="bg-gradient-to-r from-[#382d23] via-[#4d3e31] to-[#635140] px-3 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between text-white border-b border-[#73604f] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-200 shrink-0 shadow-inner">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-black tracking-wide text-white">
                  首尔女高 · 图形化分区地图
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 border border-amber-300/40 text-amber-200">
                  全区无门槛开放
                </span>
              </div>
              <p className="text-[11px] text-[#e0d6cb] hidden sm:block">
                点击大图上的地标地块即可前往或展开专属探索互动
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1 text-amber-300">
                <Zap className="w-3.5 h-3.5" />
                <span>{stats.stamina}/100</span>
              </span>
              <span className="flex items-center gap-1 text-amber-200">
                <Coins className="w-3.5 h-3.5" />
                <span>₩{stats.coins.toLocaleString()}</span>
              </span>
            </div>

            {onOpenPortraitModal && (
              <button
                onClick={() => onOpenPortraitModal()}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-xs font-bold text-amber-100 transition-all cursor-pointer"
                title="打开NPC立绘更换"
              >
                <span>🎭 立绘</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Region Selector Tabs (Step 2.1) */}
        <div className="bg-[#e9e1d1] border-b border-[#d4c8b3] px-2 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {MAP_REGIONS.map((region) => {
              const isActive = region.id === activeRegionId;
              const count = MAP_LOCATIONS.filter((l) => l.regionId === region.id).length;

              return (
                <button
                  key={region.id}
                  onClick={() => handleRegionSwitch(region.id)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#504033] to-[#6e5a4a] text-white shadow-md scale-[1.02]'
                      : 'bg-white/80 hover:bg-white text-[#4a3d30] border border-[#d6cbba] shadow-2xs'
                  }`}
                >
                  <span className="text-sm">{region.icon}</span>
                  <span>{region.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="sm:hidden text-[11px] font-bold text-[#5c4c3b] whitespace-nowrap pr-2">
            📍 当前停留：【{currentLocationName}】
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 p-2 sm:p-4 space-y-3">
          {/* Action Feedback Banner */}
          {lastActionResult && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-between gap-2 shadow-xs shrink-0 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lastActionResult}</span>
              </div>
              <button
                onClick={() => setLastActionResult(null)}
                className="text-amber-800 hover:text-amber-950 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Graphic Region Map Illustration Container (Step 2.2 & 2.3) */}
          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[440px] rounded-2xl overflow-hidden border-2 border-[#c9bcaa] shadow-xl shrink-0 group select-none">
            {/* Region Illustration Background */}
            <img
              src={activeRegion.bgUrl}
              alt={activeRegion.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Gradient Overlays for High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

            {/* Top Region Info Tag */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 max-w-sm pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-black text-xs shadow-md flex items-center gap-1">
                  <span>{activeRegion.icon}</span>
                  <span>{activeRegion.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold backdrop-blur-xs">
                  {activeRegion.subtitle}
                </span>
              </div>
              <p className="text-[11px] text-stone-200 mt-1.5 drop-shadow-md leading-relaxed hidden sm:block">
                {activeRegion.description}
              </p>
            </div>

            {/* Landmark Pins Placed via Percentage Coordinates x, y */}
            {regionLocations.map((loc) => {
              const isSelected = loc.id === activeLoc.id;
              const isCurrent = loc.name === currentLocationName;
              const locNpcs = npcs.filter((n) => loc.frequentNpcIds.includes(n.id));

              return (
                <div
                  key={loc.id}
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${
                    isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocId(loc.id);
                      setLastActionResult(null);
                    }}
                    className="relative flex flex-col items-center cursor-pointer focus:outline-hidden group/pin"
                  >
                    {/* Glowing outer aura when selected or current */}
                    {isSelected && (
                      <span className="absolute -inset-1 rounded-full bg-amber-400/70 animate-pulse blur-[3px]" />
                    )}
                    {isCurrent && !isSelected && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-400/50 animate-ping opacity-60" />
                    )}

                    {/* Exquisite 30x30px Circular Pin Dot */}
                    <div
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-stone-950 border-white ring-2 ring-amber-300 shadow-amber-500/60'
                          : isCurrent
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-emerald-200 ring-2 ring-emerald-300/60 shadow-emerald-600/40'
                          : 'bg-stone-900/85 hover:bg-stone-900 text-amber-300 border-white/70 hover:border-amber-300 backdrop-blur-xs'
                      }`}
                    >
                      <MapPin
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${
                          isSelected
                            ? 'fill-stone-950 text-stone-950 scale-110'
                            : isCurrent
                            ? 'fill-white text-white'
                            : 'fill-amber-400/30 text-amber-300'
                        }`}
                      />

                      {/* 18x18px NPC Avatar bubble hanging at top-right of pin */}
                      {locNpcs.length > 0 && (
                        <div
                          className="absolute -top-1.5 -right-2 w-[18px] h-[18px] rounded-full overflow-hidden border border-white shadow-md bg-stone-900 z-10"
                          title={`常驻角色：${locNpcs.map((n) => n.chineseName).join('、')}`}
                        >
                          <img
                            src={locNpcs[0].avatar}
                            alt={locNpcs[0].chineseName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Tiny Name Badge Below the Pin */}
                    <div
                      className={`mt-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold leading-tight whitespace-nowrap shadow-xs backdrop-blur-xs transition-colors border ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-white font-black shadow-md scale-105'
                          : isCurrent
                          ? 'bg-emerald-600/90 text-white border-emerald-300 font-black'
                          : 'bg-black/65 text-stone-100 border-white/20'
                      }`}
                    >
                      {loc.shortName || loc.name}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Landmark Interactive Tray & Actions */}
          <div className="bg-[#fcfaf5] border-2 border-[#d9cebd] rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-4">
            {/* Header / Primary Travel Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3d8c5] pb-3.5">
              <div className="flex items-start gap-3">
                <img
                  src={activeLoc.bgUrl}
                  alt={activeLoc.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-black/10 shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-xl font-black text-[#2b251e] flex items-center gap-1.5">
                      <span>{activeLoc.name}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#e8ded0] text-[#4a3e31] border border-[#d6c8b5]">
                      {activeLoc.floorBadge}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {activeLoc.categoryLabel}
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 font-bold mt-1">{activeLoc.tagline}</p>
                  <p className="text-xs text-[#5c4f42] mt-0.5 leading-relaxed">
                    {activeLoc.description}
                  </p>
                </div>
              </div>

              {/* Instant Travel Button */}
              <button
                onClick={() => handleGoToLocation(activeLoc)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              >
                <MapPin className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>
                  {activeLoc.name === currentLocationName
                    ? '【立即前往】（已在此处）'
                    : `【立即前往】${activeLoc.shortName || activeLoc.name}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Frequent NPCs list for selected location */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f4ede0] p-2.5 rounded-xl border border-[#e3d8c5]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8a7662] shrink-0" />
                <span className="text-xs font-black text-[#473b2e]">此地常驻关系角色：</span>
                {activeLocNpcs.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeLocNpcs.map((n) => (
                      <span
                        key={n.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#dacdba] text-xs font-bold text-[#382d23] shadow-2xs"
                      >
                        <img
                          src={n.avatar}
                          alt={n.chineseName}
                          className="w-4 h-4 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span>{n.chineseName}</span>
                        <span className="text-[10px] text-rose-700 font-extrabold">
                          ({n.relationshipStage})
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#736556] italic">
                    此地为自由漫游与观光区域，暂无固定同学常驻
                  </span>
                )}
              </div>

              {onOpenPortraitModal && activeLocNpcs.length > 0 && (
                <button
                  onClick={() => onOpenPortraitModal(activeLocNpcs[0]?.id)}
                  className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  🎭 调整立绘
                </button>
              )}
            </div>

            {/* Interactive Actions for this Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black text-[#382d23] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>可在此地点执行的特色互动与属性培育 ({activeLoc.actions.length})</span>
                </h4>
                <span className="text-[11px] text-[#736556]">点击执行行动增加属性与记忆</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeLoc.actions.map((act) => {
                  const canAffordStamina = act.costStamina <= 0 || stats.stamina >= act.costStamina;
                  const canAffordCoins = act.costCoins <= 0 || stats.coins >= act.costCoins;
                  const canExecute = canAffordStamina && canAffordCoins;

                  return (
                    <div
                      key={act.id}
                      className="bg-white border border-[#dad0bd] rounded-xl p-3 flex flex-col justify-between gap-2 shadow-2xs hover:border-amber-400 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{act.icon}</span>
                            <span className="font-black text-xs sm:text-sm text-[#2b251e]">
                              {act.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
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
                        </div>

                        <p className="text-xs text-[#594d3f] mt-1 leading-relaxed">{act.desc}</p>

                        {act.dialogueSnippet && (
                          <div className="mt-1.5 text-[11px] text-rose-900 bg-rose-50/70 border border-rose-200/80 rounded-lg px-2 py-1 leading-relaxed italic">
                            💬 {act.dialogueSnippet}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleActionClick(act, activeLoc)}
                        disabled={!canExecute}
                        className={`w-full mt-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                          canExecute
                            ? 'bg-gradient-to-r from-[#594939] to-[#715f4d] hover:from-[#6b5845] hover:to-[#85705b] text-white shadow-2xs cursor-pointer active:scale-95'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{canExecute ? '立即进行探索' : '条件不足'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
