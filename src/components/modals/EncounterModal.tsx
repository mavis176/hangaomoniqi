import React from 'react';
import {
  X,
  Sparkles,
  MessageCircle,
  MapPin,
  Heart,
  Tag,
  Volume2,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { DynamicNPCEncounter } from '../../types';
import { getAvatarForSeed } from '../../data/encounterData';

interface EncounterModalProps {
  encounter: DynamicNPCEncounter;
  onConfirmFriend: () => void;
  onConfirmFriendAndOpenPhone?: () => void;
  onIgnore: () => void;
  onClose: () => void;
}

export const EncounterModal: React.FC<EncounterModalProps> = ({
  encounter,
  onConfirmFriend,
  onConfirmFriendAndOpenPhone,
  onIgnore,
  onClose,
}) => {
  const avatarUrl = encounter.avatarUrl || getAvatarForSeed(encounter.avatarSeed);
  const addFriendChoice = encounter.choices?.find((c) => c.action === 'ADD_FRIEND');
  const ignoreChoice = encounter.choices?.find((c) => c.action === 'IGNORE');

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border-2 border-amber-400/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-[#2b251f] flex flex-col relative">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-[#6b472e] via-[#855333] to-[#59341c] text-white px-4 py-3 flex items-center justify-between border-b border-amber-300/40">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                <span>✨ 命运的人际相遇</span>
                <span className="bg-gradient-to-r from-amber-300 to-yellow-200 text-stone-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  AI 实时捏人
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Character Identity & Avatar Spotlight Card */}
          <div className="bg-white border-2 border-[#e6decf] rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center gap-4">
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={encounter.name}
                className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl object-cover border-2 border-amber-300 shadow-md"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-2 -right-1 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 fill-white" />
                <span>初遇</span>
              </span>
            </div>

            <div className="min-w-0 space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  {encounter.name}
                </h3>
              </div>

              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{encounter.identity}</span>
              </div>

              <div className="text-xs text-[#524538] leading-relaxed pt-1">
                <span className="font-bold text-stone-800">性格核心：</span>
                {encounter.personality}
              </div>

              <div className="text-[11px] text-[#705e4c] bg-[#f8f5ee] p-1.5 rounded-lg border border-[#e8dfcf] flex items-start gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  <span className="font-bold text-stone-700">说话口癖：</span>
                  {encounter.speakingStyle}
                </span>
              </div>
            </div>
          </div>

          {/* Encounter Story Box */}
          <div className="bg-gradient-to-br from-amber-50/80 via-[#FAF7F2] to-rose-50/60 border border-amber-300/70 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-900 font-bold border-b border-amber-200/60 pb-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>相遇地点：{encounter.encounterLocation}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-normal">微情境邂逅</span>
            </div>

            <p className="text-xs sm:text-[13px] text-[#3d3328] leading-relaxed italic">
              “{encounter.encounterStory}”
            </p>
          </div>

          {/* Decision Hint */}
          <div className="text-[11px] text-[#6b5c4b] text-center">
            💡 选择是否建立联系？交换联系方式后将正式录入手机通讯录与全向羁绊列表，并解锁实时一对一 AI 聊天！
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onConfirmFriend}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/40 group"
            >
              <UserPlus className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>【{addFriendChoice?.text || '主动交换 KakaoTalk 认识一下'}】</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
            </button>

            {onConfirmFriendAndOpenPhone && (
              <button
                onClick={onConfirmFriendAndOpenPhone}
                className="w-full py-2.5 px-4 bg-[#fae100] hover:bg-[#f2d800] active:scale-[0.98] text-[#3b1e1e] rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-[#d9c300]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#3b1e1e]" />
                <span>💬 交换 KakaoTalk 并立即打开手机通讯录聊天</span>
              </button>
            )}

            <button
              onClick={onIgnore}
              className="w-full py-2.5 px-4 bg-[#ece5d8] hover:bg-[#dfd7c8] active:scale-[0.98] text-[#5c4f3f] rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-[#cfc4b2]"
            >
              <span>【{ignoreChoice?.text || '微笑点头，擦肩而过'}】</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
