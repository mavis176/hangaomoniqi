import React, { useState } from 'react';
import { NPCClassmate } from '../types';
import {
  Heart,
  MessageCircle,
  Utensils,
  Gift,
  Palette,
  ChevronLeft,
  Users,
  Compass,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  onOpenModal: (modalName: string) => void;
  activeModal: string | null;
  npcs?: NPCClassmate[];
  selectedNpc?: NPCClassmate;
  onSelectNpc?: (npc: NPCClassmate) => void;
  onOpenChat?: (npc: NPCClassmate) => void;
  onOpenLunch?: (npc: NPCClassmate) => void;
  onOpenGift?: (npc: NPCClassmate) => void;
  onOpenPortraitModal?: (npcId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenModal,
  activeModal,
  npcs = [],
  selectedNpc,
  onSelectNpc,
  onOpenChat,
  onOpenLunch,
  onOpenGift,
  onOpenPortraitModal,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'bonds'>('menu');
  const [expandedNpcId, setExpandedNpcId] = useState<string | null>(
    selectedNpc?.id || (npcs.length > 0 ? npcs[0].id : null)
  );

  const menuItems = [
    {
      id: 'weeklyTurn',
      name: '周行动排程',
      emoji: '🗓️',
    },
    {
      id: 'map',
      name: '探索地图',
      emoji: '🗺️',
    },
    {
      id: 'relationships',
      name: '全向羁绊',
      emoji: '💕',
    },
    {
      id: 'portraitWorkshop',
      name: '立绘工坊',
      emoji: '🎭',
    },
    {
      id: 'club',
      name: '社团与比赛',
      emoji: '🏆',
    },
    {
      id: 'trainee',
      name: '练习生企划',
      emoji: '🌟',
    },
    {
      id: 'timetable',
      name: '课程与考场',
      emoji: '📚',
    },
    {
      id: 'extracurricular',
      name: '兼职与课外',
      emoji: '🏪',
    },
    {
      id: 'snsPhone',
      name: '手机/SNS',
      emoji: '📱',
    },
    {
      id: 'wardrobe',
      name: '穿搭/美妆',
      emoji: '👗',
    },
    {
      id: 'grades',
      name: '成绩与家庭',
      emoji: '🏡',
    },
    {
      id: 'lifePath',
      name: '人生进阶',
      emoji: '👑',
    },
    {
      id: 'endings',
      name: '13结局图鉴',
      emoji: '🎓',
    },
    {
      id: 'saveload',
      name: '存档/读档',
      emoji: '💾',
    },
  ];

  const getStageBadgeColor = (stage: NPCClassmate['relationshipStage']) => {
    switch (stage) {
      case '恋人':
        return 'bg-rose-500 text-white';
      case '暧昧':
        return 'bg-pink-400 text-white';
      case '灵魂伴侣':
        return 'bg-purple-600 text-white';
      case '挚友':
        return 'bg-emerald-600 text-white';
      case '朋友':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-[#7d7568] text-white';
    }
  };

  return (
    <>
      {activeTab === 'bonds' && (
        <>
          {/* Mobile layout placeholder so main screen does not shift */}
          <div className="w-[56px] shrink-0 sm:hidden" />
          {/* Mobile backdrop to close bond drawer */}
          <div
            className="sm:hidden fixed inset-0 bg-black/45 z-20 backdrop-blur-xs"
            onClick={() => setActiveTab('menu')}
          />
        </>
      )}

      <aside
        className={`z-30 flex flex-col bg-[#544d42]/95 sm:bg-[#8f897e]/65 backdrop-blur-md border-r border-[#d4cec3]/60 shadow-[4px_0_16px_rgba(0,0,0,0.22)] shrink-0 transition-all duration-200 ${
          activeTab === 'bonds'
            ? 'fixed sm:relative inset-y-0 left-0 w-[265px] sm:w-[260px] md:w-[280px] shadow-2xl'
            : 'relative w-[56px] sm:w-[62px] md:w-[70px]'
        }`}
      >
        {/* Top Dual Tab Switcher: Menu vs Bonds */}
        <div className="p-1 sm:p-1.5 border-b border-[#c7bfb0]/70 flex items-center gap-1 bg-[#474136]/70 shrink-0">
          <button
            onClick={() => setActiveTab('menu')}
            title="系统功能菜单"
            className={`flex-1 py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#f5e8cf] text-[#332a1b] shadow-xs'
                : 'text-[#e6ded0] hover:bg-white/10'
            }`}
          >
            <Menu className="w-3 h-3" />
            {activeTab === 'bonds' && <span>菜单</span>}
          </button>

          <button
            onClick={() => setActiveTab('bonds')}
            title="查看羁绊角色列表与互动"
            className={`flex-1 py-1 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'bonds'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-200 hover:bg-white/10'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" />
            <span>{activeTab === 'bonds' ? `羁绊(${npcs.length})` : npcs.length}</span>
          </button>

          {activeTab === 'bonds' && (
            <button
              onClick={() => setActiveTab('menu')}
              className="p-1 rounded-lg text-[#e6ded0] hover:text-white hover:bg-white/15 cursor-pointer"
              title="收起羁绊面板"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mode A: Standard System Menu View */}
        {activeTab === 'menu' && (
          <div
            className="flex-1 overflow-y-auto touch-scroll overscroll-contain pt-1.5 pb-16 px-1 flex flex-col gap-1.5 items-center no-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {menuItems.map((item) => {
              const isActive = activeModal === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'relationships') {
                      setActiveTab('bonds');
                    } else {
                      onOpenModal(item.id);
                    }
                  }}
                  className={`w-[48px] h-[44px] sm:w-[54px] sm:h-[48px] md:w-[62px] md:h-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer select-none shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-b from-[#efeadd] to-[#d4cab8] border-2 border-white shadow-[0_0_12px_rgba(255,248,230,0.7)] scale-105'
                      : 'bg-gradient-to-b from-[#d8d3c8]/92 via-[#c6c0b4]/92 to-[#b0a99d]/92 hover:from-[#e6e1d6] hover:to-[#c2bbb0] border border-[#e6e1d8]/85 shadow-[0_2px_5px_rgba(0,0,0,0.22),inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-95'
                  }`}
                  title={item.name}
                >
                  <span className="text-sm md:text-base leading-none drop-shadow-xs">{item.emoji}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-[#2b2620] tracking-tight leading-none mt-0.5 whitespace-nowrap truncate max-w-full px-0.5">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Mode B: Omnidirectional Bond Characters Drawer */}
        {activeTab === 'bonds' && (
          <div
            className="flex-1 overflow-y-auto touch-scroll overscroll-contain p-2 pb-16 space-y-2 text-[#2b2620] no-scrollbar flex flex-col"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#f7f2e7] flex items-center gap-1 drop-shadow-xs">
                <Users className="w-3.5 h-3.5 text-rose-300" />
                <span>全向羁绊角色 ({npcs.length})</span>
              </span>
              <button
                onClick={() => onOpenModal('relationships')}
                className="text-[10px] text-amber-200 hover:text-amber-100 underline font-bold cursor-pointer"
                title="打开完整角色档案大弹窗"
              >
                详细总览
              </button>
            </div>

          <div className="space-y-1.5 flex-1">
            {npcs.map((npc) => {
              const isSelected = selectedNpc?.id === npc.id;
              const isExpanded = expandedNpcId === npc.id;

              return (
                <div
                  key={npc.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-[#f7f4ed] border-[#9c825b] shadow-md'
                      : 'bg-[#ede7dc]/90 hover:bg-[#f6f2ea] border-[#cfc6b6]'
                  }`}
                >
                  {/* Character Summary Row */}
                  <div
                    onClick={() => {
                      onSelectNpc?.(npc);
                      setExpandedNpcId(isExpanded ? null : npc.id);
                    }}
                    className="p-1.5 flex items-center justify-between cursor-pointer gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#b8b0a2] shrink-0 bg-[#c7bfb2]">
                        <img
                          src={npc.avatar}
                          alt={npc.chineseName}
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-bold text-xs text-[#2b2620] truncate">
                            {npc.chineseName}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded leading-none ${getStageBadgeColor(
                              npc.relationshipStage
                            )}`}
                          >
                            {npc.relationshipStage}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#635a4d] mt-0.5 truncate">
                          好感 {npc.favorability}%
                          {typeof npc.romancePoints === 'number' && npc.romancePoints > 0 && (
                            <span className="text-pink-600 ml-1">· 心动 {npc.romancePoints}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#8c8273] shrink-0">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Quick Action Buttons (shown when clicked / expanded) */}
                  {isExpanded && (
                    <div className="p-1.5 pt-0 border-t border-[#dfd8cc] bg-white/50 space-y-1">
                      <div className="text-[10px] text-[#736756] truncate italic px-1 pt-0.5">
                        {npc.role} · {npc.mbti || '真实高中人设'}
                      </div>

                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat?.(npc);
                          }}
                          className="py-1 px-1 rounded-md bg-gradient-to-b from-[#e3dac7] to-[#ccbea2] hover:from-[#eee4ce] hover:to-[#d8caba] text-[#3b3020] text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs border border-white/60 cursor-pointer"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>聊天</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLunch?.(npc);
                          }}
                          className="py-1 px-1 rounded-md bg-gradient-to-b from-[#dfd3b8] to-[#cca783] hover:from-[#ede1c7] hover:to-[#dbb591] text-[#382617] text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs border border-white/60 cursor-pointer"
                        >
                          <Utensils className="w-2.5 h-2.5" />
                          <span>约会</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenGift?.(npc);
                          }}
                          className="py-1 px-1 rounded-md bg-gradient-to-b from-[#eed4d9] to-[#d9a8b5] hover:from-[#fae3e8] hover:to-[#e6b8c4] text-[#4a222f] text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs border border-white/60 cursor-pointer"
                        >
                          <Gift className="w-2.5 h-2.5" />
                          <span>送礼</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPortraitModal?.(npc.id);
                          }}
                          className="py-1 px-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs border border-[#cfc4b2] cursor-pointer"
                        >
                          <Palette className="w-2.5 h-2.5" />
                          <span>改立绘</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full Relationship Modal Launcher Button */}
          <button
            onClick={() => onOpenModal('relationships')}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-[#6e5d53] to-[#8a7569] text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm hover:opacity-95 cursor-pointer mt-1"
          >
            <Compass className="w-3 h-3 text-amber-200" />
            <span>打开羁绊关系与画风总览</span>
          </button>
        </div>
      )}
      </aside>
    </>
  );
};
