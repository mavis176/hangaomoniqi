import React, { useState, useEffect } from 'react';
import { X, Save, Download, Trash2 } from 'lucide-react';
import { GameStats, NPCClassmate, WardrobeItem, MemoryEntry, ChatMessage } from '../../types';
import { getCalendarDateString } from '../../data/gameData';

interface SaveSlotData {
  timestamp: string;
  day: number;
  clockMinutes: number;
  stats: GameStats;
  npcs: NPCClassmate[];
  discoveredNpcList?: NPCClassmate[];
  wardrobe: WardrobeItem[];
  memories: MemoryEntry[];
  chatHistories: Record<string, ChatMessage[]>;
}

interface SaveLoadModalProps {
  onClose: () => void;
  stats: GameStats;
  currentDay: number;
  clockMinutes: number;
  npcs: NPCClassmate[];
  discoveredNpcList?: NPCClassmate[];
  wardrobe: WardrobeItem[];
  memories: MemoryEntry[];
  chatHistories: Record<string, ChatMessage[]>;
  onLoadGame: (data: SaveSlotData) => void;
  onNotify: (msg: string) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  onClose,
  stats,
  currentDay,
  clockMinutes,
  npcs,
  discoveredNpcList,
  wardrobe,
  memories,
  chatHistories,
  onLoadGame,
  onNotify,
}) => {
  const [slots, setSlots] = useState<Record<number, SaveSlotData | null>>({
    1: null,
    2: null,
    3: null,
  });

  useEffect(() => {
    try {
      const saved1 = localStorage.getItem('kr_school_save_v3_1');
      const saved2 = localStorage.getItem('kr_school_save_v3_2');
      const saved3 = localStorage.getItem('kr_school_save_v3_3');
      setSlots({
        1: saved1 ? JSON.parse(saved1) : null,
        2: saved2 ? JSON.parse(saved2) : null,
        3: saved3 ? JSON.parse(saved3) : null,
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = (slotNum: number) => {
    const data: SaveSlotData = {
      timestamp: new Date().toLocaleString(),
      day: currentDay,
      clockMinutes,
      stats,
      npcs,
      discoveredNpcList: discoveredNpcList || npcs.filter((n) => n.isGenerated),
      wardrobe,
      memories,
      chatHistories,
    };
    try {
      localStorage.setItem(`kr_school_save_v3_${slotNum}`, JSON.stringify(data));
      setSlots((prev) => ({ ...prev, [slotNum]: data }));
      onNotify(`已完整保存当前时间、聊天记录与记忆库至存档位 #${slotNum}`);
    } catch (e) {
      onNotify('保存存档失败');
    }
  };

  const handleLoad = (slotNum: number) => {
    const data = slots[slotNum];
    if (!data) return;
    onLoadGame(data);
    onNotify(`已读取存档位 #${slotNum} 的完整校园进度与记忆`);
    onClose();
  };

  const handleDelete = (slotNum: number) => {
    try {
      localStorage.removeItem(`kr_school_save_v3_${slotNum}`);
      setSlots((prev) => ({ ...prev, [slotNum]: null }));
      onNotify(`已清空存档位 #${slotNum}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2.5">
            <Save className="w-5 h-5 text-[#f0e6d2]" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide">存档与读档（含完整记忆与对话）</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 bg-[#e2dbd0]/60">
          <div className="text-xs text-[#5a5246]">
            所有属性、精确时间、同学好感度、聊天记录与专属记忆手帐均会自动保存，也可在此分槽位备份。
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3].map((slotNum) => {
              const slotData = slots[slotNum];
              const slotCal = slotData
                ? getCalendarDateString(slotData.day, slotData.clockMinutes || 615)
                : null;
              return (
                <div
                  key={slotNum}
                  className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#2b2620]">存档位 #{slotNum}</span>
                      {slotCal && (
                        <span className="text-[11px] bg-[#ece6db] border border-[#cfc8ba] text-[#5a5246] px-2 py-0.5 rounded font-bold">
                          {slotCal.fullLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6e6558]">
                      {slotData ? `保存于: ${slotData.timestamp}` : '空白存档槽位'}
                    </div>
                    {slotData && (
                      <div className="text-[11px] text-[#4e7a56] font-bold flex items-center gap-3 pt-0.5">
                        <span>学业: {slotData.stats.academics}</span>
                        <span>社交: {slotData.stats.social}</span>
                        <span>记忆: {slotData.memories?.length || 0}条</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSave(slotNum)}
                      className="py-1.5 px-3 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>存档</span>
                    </button>
                    {slotData && (
                      <>
                        <button
                          onClick={() => handleLoad(slotNum)}
                          className="py-1.5 px-3 bg-gradient-to-b from-[#c7cacf] to-[#a7abb2] border border-[#e4e6e9] text-[#26292e] rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>读档</span>
                        </button>
                        <button
                          onClick={() => handleDelete(slotNum)}
                          className="p-1.5 bg-[#ece6db] hover:bg-[#e3d5d5] text-[#8c4646] rounded-xl border border-[#cfc8ba] cursor-pointer"
                          title="删除存档"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
