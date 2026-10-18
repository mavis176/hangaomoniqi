import React from 'react';
import { Heart, Sparkles, X, Check, Shield, ArrowRight, UserCheck } from 'lucide-react';
import { NPCClassmate, RelationshipStage } from '../../types';

export interface RelationshipChangePromptData {
  npc: NPCClassmate;
  currentStage: RelationshipStage;
  targetStage: RelationshipStage;
  reason: string;
  favValue: number;
  romanceValue: number;
}

interface RelationshipChangePromptModalProps {
  promptData: RelationshipChangePromptData;
  onConfirmAdvance: (npcId: string, newStage: RelationshipStage) => void;
  onKeepCurrent: (npcId: string, currentStage: RelationshipStage) => void;
  onDeclineOrCool: (npcId: string, currentStage: RelationshipStage) => void;
}

export const RelationshipChangePromptModal: React.FC<RelationshipChangePromptModalProps> = ({
  promptData,
  onConfirmAdvance,
  onKeepCurrent,
  onDeclineOrCool,
}) => {
  const { npc, currentStage, targetStage, reason, favValue, romanceValue } = promptData;

  // Generate specialized context monologue based on targetStage and character
  const getStageMonologue = () => {
    if (targetStage === '相识') {
      return `在一次日常课间或放学路上，${npc.chineseName} 主动走到了你的身边，有些不好意思地打了个招呼，彼此交换了联络方式与课表。你愿意正式将 TA 视为【相识】的同学吗？`;
    }
    if (targetStage === '朋友') {
      return `经过许多天的互帮互助与课后闲聊，${npc.chineseName} 已经习惯在人群中寻找你的身影，在抽屉里为你留零食、把笔记借给你复印。你愿意正式确立与 ${npc.chineseName} 的【朋友】关系吗？`;
    }
    if (targetStage === '挚友') {
      if (npc.id === 'npc_1') {
        return `敏英紧紧攥着你的衣袖，眼眶微红地轻声说：“秀妍，我所有不敢公开画的条漫和心事，只想第一个讲给你听……你能做我一辈子最好的挚友吗？”`;
      }
      if (npc.id === 'npc_3') {
        return `韩素拉推了推眼镜，将做满独家注解的真题错题本放在你桌前：“在所有人都在竞争第一名的高中里，只有你是我唯一认可并想并肩走下去的人。”`;
      }
      return `${npc.chineseName} 郑重地向你敞开了心扉，将压抑已久的家庭与人生秘密只告诉了你一人，渴望与你成为患难与共、无话不谈的【挚友】。`;
    }
    if (targetStage === '暧昧') {
      if (npc.id === 'npc_4') {
        return `黄昏的广播室里只剩下你们两人，李恩宇轻轻为你摘下耳机，手指掠过你的发梢，眼底的光温和而深情：“不知道从什么时候开始，我弹吉他写歌的时候，脑海里全是你。”`;
      }
      if (npc.id === 'npc_5') {
        return `打完排球的姜海仁坐在操场台阶上，微仰着脸看着你，脸颊带着运动后的绯红与紧张：“秀妍……我以前从没对谁这样过，一看见你心跳就快得像要扣球一样。”`;
      }
      if (npc.id === 'npc_6') {
        return `千宥娜在天台晚风中靠近你，清冷的气场化作了少见的温柔：“在这个虚伪又无趣的世界里，只有看着你的眼睛，我才觉得舞台是有意义的。”`;
      }
      if (npc.id === 'npc_8') {
        return `尹在民借着检查风纪的名义将你叫到走廊尽头，金丝眼镜后的目光深邃炽热：“秀妍，我向来遵守所有规则，但面对你……我一次又一次想破例。”`;
      }
      return `空气中弥漫着青涩而甜蜜的心跳声，${npc.chineseName} 望向你的眼神已悄悄超越了单纯的友谊，心动与脸红难以掩饰。是否同意关系进入心动的【暧昧】阶段？`;
    }
    if (targetStage === '恋人') {
      return `【心动告白刻印】${npc.chineseName} 鼓起了全部的勇气，在漫天落樱或初雪的夜景下向你递出了手写告白信，眼眸颤抖而炽热：“李秀妍，我不想只做你的朋友……我喜欢你。你愿意做我的恋人吗？”`;
    }
    if (targetStage === '灵魂伴侣') {
      return `【灵魂相认契约】历经三年四季的陪伴、考验与风雨，你与 ${npc.chineseName} 已经达到了无需言语也能懂得对方全部悲喜的境界。你们在彼此生命中留下了不可磨灭的印记，升华为超越世俗的【灵魂伴侣】。`;
    }
    return `${npc.chineseName} 对你的好感与羁绊达到了全新门槛，你希望如何定义你们之间的未来？`;
  };

  const getStageBadgeColor = (stage: RelationshipStage) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-[#faf7f0] border-2 border-[#e3d7c3] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-[#2b251e] flex flex-col">
        {/* Top Heart Pulse Banner */}
        <div className="bg-gradient-to-r from-[#d9777f] via-[#c25e68] to-[#993b45] p-4 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-20">
            <Heart className="w-24 h-24 text-white animate-pulse" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-rose-100 mb-1">
              <Heart className="w-5 h-5 fill-rose-100 animate-bounce" />
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-wide">
              羁绊与关系阶段进阶确认
            </h2>
            <p className="text-xs text-rose-100/90 mt-0.5">
              和同学之间的每一次重要关系转变，都由你亲自选择与决定
            </p>
          </div>
        </div>

        {/* Character Card & Transition Display */}
        <div className="p-4 sm:p-5 flex flex-col items-center text-center">
          {/* NPC Avatar with pulsing heart halo */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-rose-300 shadow-md">
              <img
                src={npc.avatar}
                alt={npc.chineseName}
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="text-base font-black text-[#2e261d]">
            {npc.chineseName} <span className="text-xs text-[#786c5f]">({npc.koreanName})</span>
          </h3>
          <p className="text-[11px] text-[#786c5f] mt-0.5 font-bold">
            {npc.role} · 好感度 {favValue}/100 · 心动值 {romanceValue}
          </p>

          {/* Relationship Stage Transition Pills */}
          <div className="my-3.5 flex items-center justify-center gap-2.5 bg-[#ede4d4] border border-[#d6cbb8] px-4 py-2 rounded-2xl w-full max-w-sm">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#706251] font-bold mb-0.5">当前关系</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black shadow-2xs ${getStageBadgeColor(
                  currentStage
                )}`}
              >
                {currentStage}
              </span>
            </div>

            <div className="flex items-center text-rose-600 px-1">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-rose-800 font-bold mb-0.5">契机晋升为</span>
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-black ring-2 ring-rose-400 ring-offset-1 shadow-xs ${getStageBadgeColor(
                  targetStage
                )}`}
              >
                {targetStage}
              </span>
            </div>
          </div>

          {/* Reason trigger */}
          <p className="text-[11px] text-[#806f5c] font-bold mb-2.5">
            触发原因：{reason}
          </p>

          {/* Story monologue */}
          <div className="bg-white border border-[#e0d6c4] rounded-2xl p-3.5 text-xs text-[#47392c] leading-relaxed text-left shadow-2xs w-full">
            <p className="italic">{getStageMonologue()}</p>
          </div>

          {/* User Decision Buttons */}
          <div className="mt-4.5 w-full space-y-2.5">
            {/* Option A: Accept Advance */}
            <button
              onClick={() => onConfirmAdvance(npc.id, targetStage)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>💖 欣然答应：正式确立【{targetStage}】关系</span>
            </button>

            {/* Option B: Keep Current Stage */}
            <button
              onClick={() => onKeepCurrent(npc.id, currentStage)}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#ede5d6] hover:bg-[#e2d8c5] text-[#47392c] font-bold text-xs flex items-center justify-center gap-2 border border-[#d1c6b2] transition-all cursor-pointer active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-[#6e564a]" />
              <span>🤝 保持现状：暂时维持珍贵的【{currentStage}】</span>
            </button>

            {/* Option C: Decline / Cool distance */}
            <button
              onClick={() => onDeclineOrCool(npc.id, currentStage)}
              className="w-full py-2 px-4 rounded-xl text-[11px] font-bold text-[#8c7b69] hover:text-rose-700 hover:bg-rose-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🌸 稍微拉开一点距离 / 委婉婉拒</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
