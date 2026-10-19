import React, { useState } from 'react';
import {
  X,
  Home,
  Car,
  Check,
  Building,
  ShieldCheck,
  Sparkles,
  Zap,
  Coins,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import { GameStats, PlayerAssetsState } from '../../types';
import { HOUSING_PRESETS, VEHICLE_PRESETS } from '../../data/assetsData';

interface AssetsModalProps {
  onClose: () => void;
  stats: GameStats;
  assets: PlayerAssetsState;
  onBuyHousing: (housingId: string, price: number) => void;
  onSelectHousing: (housingId: string) => void;
  onBuyVehicle: (vehicleId: string, price: number) => void;
  onSelectVehicle: (vehicleId: string) => void;
  onNotify: (msg: string) => void;
}

export const AssetsModal: React.FC<AssetsModalProps> = ({
  onClose,
  stats,
  assets,
  onBuyHousing,
  onSelectHousing,
  onBuyVehicle,
  onSelectVehicle,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'housing' | 'vehicle'>('housing');

  const currentHousing =
    HOUSING_PRESETS.find((h) => h.id === assets.currentHousingId) || HOUSING_PRESETS[0];
  const currentVehicle =
    VEHICLE_PRESETS.find((v) => v.id === assets.currentVehicleId) || VEHICLE_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in">
      <div className="bg-[#18161b] border-2 border-[#383340] rounded-3xl max-w-4xl w-full h-[90vh] max-h-[820px] flex flex-col overflow-hidden shadow-2xl text-[#e8e4ee]">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#2a2233] via-[#3d2e4d] to-[#251d2f] px-4 py-3.5 sm:px-6 flex items-center justify-between text-white border-b border-[#4d3c60] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-stone-950 font-black shadow-lg">
              <Building className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wide text-white">
                  首尔高级房产与车产购置中心
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  阶级声望象征
                </span>
              </div>
              <p className="text-xs text-[#c8becf] hidden sm:block">
                购置顶级汉江大平层与豪车，改变居住质感与每回合身心恢复效率
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-amber-400/30 font-black text-amber-300 text-xs sm:text-sm shadow-inner">
              <Coins className="w-4 h-4" />
              <span>₩{stats.coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active Asset Summary Band */}
        <div className="bg-[#211b27] border-b border-[#362b42] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 overflow-x-auto text-xs font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-bold">当前住所:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black border border-amber-400/30 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>{currentHousing.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-bold">当前座驾:</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-black border border-rose-400/30 flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                <span>{currentVehicle.name}</span>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-300 font-bold bg-black/40 px-3 py-1 rounded-lg">
            <span>
              ⚡ 体力加成: <span className="text-emerald-400">+{currentHousing.staminaBonusPerTurn}/周</span>
            </span>
            <span>
              💖 心情加成: <span className="text-rose-300">+{currentHousing.moodBonusPerTurn}/周</span>
            </span>
            <span>
              ✨ 声望: <span className="text-amber-300">+{currentHousing.socialBonus + currentVehicle.socialBonus}</span>
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-[#1d1824] px-4 py-2 border-b border-[#2e2638] flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('housing')}
            className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'housing'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 shadow-lg scale-102'
                : 'bg-[#282133] hover:bg-[#332a42] text-stone-300 border border-[#3b314a]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>住所房产 Center ({HOUSING_PRESETS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'vehicle'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 shadow-lg scale-102'
                : 'bg-[#282133] hover:bg-[#332a42] text-stone-300 border border-[#3b314a]'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>座驾车产 Center ({VEHICLE_PRESETS.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'housing' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HOUSING_PRESETS.map((item) => {
                const isOwned = assets.ownedHousingIds.includes(item.id);
                const isCurrent = assets.currentHousingId === item.id;
                const canAfford = stats.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-gradient-to-b from-[#2a2236] to-[#1c1724] border-amber-400 shadow-xl shadow-amber-950/30'
                        : isOwned
                        ? 'bg-[#221c2b] border-purple-500/40 hover:border-purple-400'
                        : 'bg-[#1e1926] border-[#31283d] hover:border-[#4d3f61]'
                    }`}
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18161b] via-transparent to-black/40" />

                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{item.locationLabel}</span>
                        </div>

                        {isCurrent && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-stone-950 shadow-md flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>当前入住</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Stats */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-black text-white">{item.name}</h3>
                          <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                            {item.koreanName}
                          </span>
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed">{item.desc}</p>

                        {/* Property Perks */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-bold">
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-emerald-300">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>体力恢复: +{item.staminaBonusPerTurn}/周</span>
                          </div>
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-rose-300">
                            <Star className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>心情恢复: +{item.moodBonusPerTurn}/周</span>
                          </div>
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-purple-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>暗黑减免: -{item.darkIndexReductionPerTurn}/周</span>
                          </div>
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-amber-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>声望加成: +{item.socialBonus}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 pt-2 border-t border-[#2e2638] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold">购置价格</div>
                        <div className="text-sm sm:text-base font-black text-amber-300">
                          {item.price === 0 ? '免费 (默认)' : `₩${item.price.toLocaleString()}`}
                        </div>
                      </div>

                      {isCurrent ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center gap-1 cursor-default"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>正在此居住</span>
                        </button>
                      ) : isOwned ? (
                        <button
                          onClick={() => {
                            onSelectHousing(item.id);
                            onNotify(`🏠 成功搬入【${item.name}】！入住环境大幅提升！`);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 shadow-md cursor-pointer transition-all flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>一键搬入居住</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) {
                              onNotify(`⚠️ 资金不足！购买【${item.name}】需要 ₩${item.price.toLocaleString()}。`);
                              return;
                            }
                            onBuyHousing(item.id, item.price);
                            onNotify(`🎉 恭喜成功购买【${item.name}】！阶级身份升级！`);
                          }}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-stone-950 shadow-lg cursor-pointer scale-102'
                              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{canAfford ? '全款买下房产' : '韩元不足'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VEHICLE_PRESETS.map((item) => {
                const isOwned = assets.ownedVehicleIds.includes(item.id);
                const isCurrent = assets.currentVehicleId === item.id;
                const canAfford = stats.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-gradient-to-b from-[#2a2236] to-[#1c1724] border-rose-400 shadow-xl shadow-rose-950/30'
                        : isOwned
                        ? 'bg-[#221c2b] border-purple-500/40 hover:border-purple-400'
                        : 'bg-[#1e1926] border-[#31283d] hover:border-[#4d3f61]'
                    }`}
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative h-44 w-full overflow-hidden bg-stone-900">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18161b] via-transparent to-black/40" />

                        {isCurrent && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black bg-rose-400 text-stone-950 shadow-md flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>当前使用座驾</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Stats */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-black text-white">{item.name}</h3>
                          <span className="text-xs font-bold text-rose-300 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                            {item.koreanName}
                          </span>
                        </div>

                        <p className="text-xs text-stone-300 leading-relaxed">{item.desc}</p>

                        <div className="bg-stone-900/60 p-2.5 rounded-xl border border-stone-800 text-xs text-stone-200">
                          <span className="text-amber-300 font-bold">出行事件解锁: </span>
                          <span>{item.unlockedEventsDesc}</span>
                        </div>

                        {/* Perks */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-amber-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>声望加成: +{item.socialBonus}</span>
                          </div>
                          <div className="bg-stone-900/60 p-2 rounded-xl border border-stone-800 flex items-center gap-1.5 text-rose-300">
                            <Star className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>外形气场: +{item.appearanceBonus}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-4 pt-2 border-t border-[#2e2638] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold">购置价格</div>
                        <div className="text-sm sm:text-base font-black text-amber-300">
                          {item.price === 0 ? '免费 (默认)' : `₩${item.price.toLocaleString()}`}
                        </div>
                      </div>

                      {isCurrent ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-xl text-xs font-black bg-rose-400/20 text-rose-300 border border-rose-300/30 flex items-center gap-1 cursor-default"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>驾驶此座驾</span>
                        </button>
                      ) : isOwned ? (
                        <button
                          onClick={() => {
                            onSelectVehicle(item.id);
                            onNotify(`🚗 成功切换座驾为【${item.name}】！出行气场大变！`);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 shadow-md cursor-pointer transition-all flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>选择驾驶</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (!canAfford) {
                              onNotify(`⚠️ 资金不足！提车【${item.name}】需要 ₩${item.price.toLocaleString()}。`);
                              return;
                            }
                            onBuyVehicle(item.id, item.price);
                            onNotify(`🎉 恭喜全款提车【${item.name}】！顶级私人座驾入手！`);
                          }}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-300 hover:to-rose-300 text-stone-950 shadow-lg cursor-pointer scale-102'
                              : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{canAfford ? '全款买下座驾' : '韩元不足'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
