import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Heart,
  BookHeart,
  Plus,
  Trash2,
  Tag,
  Smile,
  Flame,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { NPCClassmate, GameStats, AIConfig, ChatMessage } from '../../types';
import {
  generateNpcChatReply,
  generateNpcMemorySummary,
  NpcMemorySummaryResult,
} from '../../services/aiService';

interface ChatModalProps {
  npc: NPCClassmate;
  onClose: () => void;
  stats: GameStats;
  aiConfig: AIConfig;
  location: string;
  timeContext: string;
  clockStr: string;
  chatHistory: ChatMessage[];
  onUpdateChatHistory: (npcId: string, messages: ChatMessage[]) => void;
  onAddNpcMemory: (npcId: string, memoryText: string) => void;
  onRemoveNpcMemory: (npcId: string, index: number) => void;
  onUpdateNpcKeywords?: (npcId: string, keywords: string[]) => void;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onUpdateFavorability: (npcId: string, amount: number) => void;
  onAdvanceMinutes: (mins: number) => void;
  onNotify: (msg: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  npc,
  onClose,
  stats,
  aiConfig,
  location,
  timeContext,
  clockStr,
  chatHistory,
  onUpdateChatHistory,
  onAddNpcMemory,
  onRemoveNpcMemory,
  onUpdateNpcKeywords,
  onUpdateStats,
  onUpdateFavorability,
  onAdvanceMinutes,
  onNotify,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [showMindReading, setShowMindReading] = useState(false);
  const [summaryBriefing, setSummaryBriefing] = useState<NpcMemorySummaryResult | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'keywords' | 'memories'>('keywords');
  const [customMemoryInput, setCustomMemoryInput] = useState('');
  const [customKeywordInput, setCustomKeywordInput] = useState('');

  const getMindReadingText = () => {
    const fav = npc.favorability || 50;
    const romance = npc.romancePoints || 0;
    const stage = npc.relationshipStage || '朋友';
    const name = npc.chineseName;

    if (stage === '灵魂伴侣' || stage === '恋人' || romance >= 80) {
      return `${name}现在只要一看见你靠近，心跳就会不由自主地加速。在TA心里，你已经是生命中最不可或缺、最特别的存在。即便表面上装作若无其事，其实满脑子都是你的身影。`;
    }
    if (stage === '暧昧' || fav >= 75) {
      return `${name}对你有着极高且炽热的好感。每次和你对视时，TA都要拼命克制住上扬的嘴角。TA非常渴望能再和你走得近一些，甚至在日记里写满了关于你的点点滴滴。`;
    }
    if (stage === '挚友' || fav >= 60) {
      return `${name}已经将你视为最信任、最交心的挚友。只要有你在身边，TA就觉得格外安心。对于你的秘密和愿望，TA会永远无条件地站在你身后。`;
    }
    if (fav >= 40) {
      return `${name}觉得你是一个很有趣、相处起来很舒服的同学。虽然还在慢慢了解中，但对你的印象分一直在稳步上升，挺期待能和你多聊聊的。`;
    }
    return `${name}目前对你还处于观察和试探阶段。虽然没有防备，但内心还有点小羞涩和拘谨，需要你多制造一些共同话题来破冰哦！`;
  };

  const [memoryKeywords, setMemoryKeywords] = useState<string[]>(
    Array.isArray(npc.memoryKeywords) && npc.memoryKeywords.length > 0
      ? npc.memoryKeywords
      : ['初识印象', '首尔女高日常']
  );

  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(() => {
    if (npc.isGenerated) {
      return [
        `上次在${npc.encounterLocation || '首尔街头'}相遇之后，你最近忙什么呢？`,
        `听说你是【${npc.role}】，平时有什么特别的日常趣事吗？`,
        `周末如果有空的话，要不要一起去圣水洞喝杯咖啡？`,
      ];
    }
    if (npc.id === 'npc_3') {
      return [
        '刚才那道压轴数学题，你做完了吗？',
        '今晚大峙洞补习班，要不要一起拼车去？',
        '下周全国联考，我们要不要比比看内申等级？',
      ];
    }
    if (npc.id === 'npc_4') {
      return [
        '学长，今天广播室放的那首新歌叫什么呀？',
        '广播社放学后的排练辛苦吗？给你带了温麦茶。',
        '学长弹吉他的样子特别帅气！',
      ];
    }
    if (npc.id === 'npc_6') {
      return [
        '宥娜前辈，可以教我刚才那个舞台Ending眼神吗？',
        '放学后一起去独立练舞室特训合练好不好？',
        '你今天这套私服穿搭太酷了，在哪里淘的？',
      ];
    }
    return [
      '刚才上课我差点困得睡着，幸好老师没抓我！',
      '待会儿下课要不要一起去小卖部抢延世奶油包？',
      '放学后我们去校门口吃炒年糕、拍人生四格吧！',
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const memories = npc.memories || [];

  // Sync keywords if npc prop updates
  useEffect(() => {
    if (Array.isArray(npc.memoryKeywords) && npc.memoryKeywords.length > 0) {
      setMemoryKeywords(npc.memoryKeywords);
    }
  }, [npc.memoryKeywords]);

  // Initialize first dynamic greeting based on character personality & stage if empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      const stage = npc.relationshipStage || '朋友';
      let greetingText = `秀妍！正好在${location}碰到你，今天感觉怎么样？`;
      let actionDesc = `${npc.chineseName}转过头来，眼神亮晶晶地注视着你`;
      let innerThought = `看到秀妍走过来，整个人都轻松了不少。`;

      if (npc.isGenerated) {
        greetingText = `秀妍！真巧啊，刚才还在想上次在${npc.encounterLocation || '首尔街头'}偶遇你的事呢。今天过得怎么样？`;
        actionDesc = `${npc.chineseName}带着【${npc.role}】特有的神采看向你，语气自然流露出“${npc.speakingStyle || '亲切随和'}”的风格`;
        innerThought = `没想到这么快就能和秀妍在KakaoTalk上聊起来，上次交换联系方式太明智了。`;
      } else if (npc.id === 'npc_3') {
        greetingText =
          stage === '恋人' || stage === '灵魂伴侣'
            ? `秀妍，你在${location}发什么呆呢？……冷不冷？过来，我这罐热咖啡分你捂捂手。`
            : `李秀妍？现在是${clockStr}，你不去争分夺秒刷题，特意来找我有什么事？`;
        actionDesc = `${npc.chineseName}轻轻合上活页笔记本，抬眸看向你，清冷的目光里带着一丝不易察觉的柔和`;
        innerThought = `她主动找我搭话了……其实我一直在等她开口。`;
      } else if (npc.id === 'npc_4') {
        greetingText =
          stage === '恋人' || stage === '暧昧'
            ? `秀妍，刚从教室出来吗？我正打算去广播室挑歌，想不想来陪我听听新Demo？`
            : `是高一1班的秀妍啊。正好在${location}不忙，下课出来透透气吗？`;
        actionDesc = `${npc.chineseName}温和地笑着收起乐谱，目光里满是少年特有的明朗与体贴`;
        innerThought = `每次在走廊看见秀妍，一天枯燥的排练都变得有意思了。`;
      } else if (npc.id === 'npc_5') {
        greetingText = `哟！秀妍！正巧在${location}遇到你！看我刚去小卖部抢的冰镇宝矿力，给你留了一罐！`;
        actionDesc = `姜海仁飒爽地单手转着排球，笑得露出一口整齐的小白牙，潇洒地递过饮料`;
        innerThought = `特意从小卖部一路小跑回来的，就为了第一时间碰见秀妍！`;
      } else if (npc.id === 'npc_6') {
        greetingText = `把降噪耳机摘下来就听见你的脚步声了。怎么，练习生考核压力大？来跟我聊会儿。`;
        actionDesc = `千宥娜摘下单侧银色监听耳机，修长指尖托着腮，漫不经心地勾唇浅笑`;
        innerThought = `在首尔女高，大概只有她能让我真正卸下防备了。`;
      }

      const initialGreeting: ChatMessage = {
        sender: 'npc',
        timeLabel: clockStr,
        actionDesc,
        text: greetingText,
        innerThought,
      };
      onUpdateChatHistory(npc.id, [initialGreeting]);
    }
  }, [npc.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleExecuteSummaryCommand = async (rawCommandText = '/summary') => {
    if (isLoading) return;
    const userCmdMsg: ChatMessage = {
      sender: 'user',
      text: rawCommandText,
      timeLabel: clockStr,
    };
    const updatedHistory = [...chatHistory, userCmdMsg];
    onUpdateChatHistory(npc.id, updatedHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const summaryRes = await generateNpcMemorySummary({
        aiConfig,
        npc,
        memories,
        timeContext,
      });

      setSummaryBriefing(summaryRes);
      setShowSummaryCard(true);

      const briefingReplyMsg: ChatMessage = {
        sender: 'npc',
        timeLabel: clockStr,
        actionDesc: `📋 【简报 AI · ${summaryRes.impressionTitle || `${npc.chineseName}的羁绊总结`}】`,
        text: summaryRes.summary,
        innerThought: summaryRes.bondEvaluation || `基于 ${memories.length} 条共同记忆生成`,
        extractedKeywords: ['简报AI总结'],
      };

      onUpdateChatHistory(npc.id, [...updatedHistory, briefingReplyMsg]);
      onNotify(`📋 【简报 AI】已基于 memories 生成 ${npc.chineseName} 的100字看法与共同经历总结！`);
    } catch (_e) {
      onNotify('生成简报总结失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Intercept /summary command for Briefing AI
    if (trimmed.toLowerCase() === '/summary' || trimmed.toLowerCase().startsWith('/summary ')) {
      await handleExecuteSummaryCommand(trimmed);
      return;
    }

    const userMsg: ChatMessage = {
      sender: 'user',
      text: trimmed,
      timeLabel: clockStr,
    };
    const updatedHistory = [...chatHistory, userMsg];
    onUpdateChatHistory(npc.id, updatedHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Pass complete character personality matrix to Gemini API
      const aiResult = await generateNpcChatReply({
        aiConfig,
        npc: {
          ...npc,
          memoryKeywords,
        },
        userMessage: trimmed,
        history: updatedHistory,
        memories,
        stats,
        location,
        timeContext,
      });

      const favDelta = typeof aiResult.favorabilityDelta === 'number' ? aiResult.favorabilityDelta : 4;
      const moodDelta = typeof aiResult.moodDelta === 'number' ? aiResult.moodDelta : 4;
      const socialDelta = typeof aiResult.socialDelta === 'number' ? aiResult.socialDelta : 2;
      const newMem = aiResult.newMemory ? aiResult.newMemory.trim() : '';

      // Memory keyword extraction & long-term bond updating
      const extracted = Array.isArray(aiResult.extractedKeywords) ? aiResult.extractedKeywords : [];
      let updatedKwList = [...memoryKeywords];
      let newlyAddedKeywords: string[] = [];

      extracted.forEach((kw) => {
        const cleanKw = kw.replace(/^[#🏷️\s]+/, '').trim();
        if (cleanKw && !updatedKwList.includes(cleanKw)) {
          updatedKwList.push(cleanKw);
          newlyAddedKeywords.push(cleanKw);
        }
      });

      if (newlyAddedKeywords.length > 0) {
        setMemoryKeywords(updatedKwList);
        onUpdateNpcKeywords?.(npc.id, updatedKwList);
        onNotify(`✨ 提取到新记忆关键词：【${newlyAddedKeywords.join('、')}】！已存入长久羁绊`);
      }

      if (newMem) {
        onAddNpcMemory(npc.id, `[${timeContext}] ${newMem}`);
      }

      const npcReplyMsg: ChatMessage = {
        sender: 'npc',
        text: aiResult.reply,
        timeLabel: clockStr,
        innerThought: aiResult.innerThought,
        actionDesc: aiResult.actionDesc,
        favDelta,
        newMemory: newMem || undefined,
        extractedKeywords: newlyAddedKeywords.length > 0 ? newlyAddedKeywords : undefined,
      };

      onUpdateChatHistory(npc.id, [...updatedHistory, npcReplyMsg]);

      if (Array.isArray(aiResult.suggestedReplies) && aiResult.suggestedReplies.length > 0) {
        setSuggestedTopics(aiResult.suggestedReplies.slice(0, 3));
      }

      onUpdateFavorability(npc.id, favDelta);
      onUpdateStats({
        social: Math.min(100, Math.max(0, stats.social + socialDelta)),
        mood: Math.min(100, Math.max(0, stats.mood + moodDelta)),
      });
      // Realistic time passage: chatting takes 10 minutes
      onAdvanceMinutes(10);
    } catch (_err: any) {
      const fallbackFav = 3;
      const fallbackTopic = trimmed.slice(0, 10);
      const fallbackMsg: ChatMessage = {
        sender: 'npc',
        timeLabel: clockStr,
        actionDesc: `${npc.chineseName}专注地听你说完，温柔地弯了弯眉眼`,
        text:
          npc.id === 'npc_3'
            ? `关于你说的这个，我记在心上了。不过别光顾着闲聊，待会儿模拟考冲刺复习可别偷懒。`
            : `嗯！你刚才说的我都记住啦，待会儿下课钟声响了我们继续接着聊~`,
        innerThought: `只要是秀妍说的话，我都想仔细听完。`,
        favDelta: fallbackFav,
        extractedKeywords: [fallbackTopic],
      };

      if (!memoryKeywords.includes(fallbackTopic)) {
        const nextKw = [...memoryKeywords, fallbackTopic];
        setMemoryKeywords(nextKw);
        onUpdateNpcKeywords?.(npc.id, nextKw);
      }

      onUpdateChatHistory(npc.id, [...updatedHistory, fallbackMsg]);
      onUpdateFavorability(npc.id, fallbackFav);
      onAdvanceMinutes(10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customKeywordInput.trim().replace(/^[#🏷️\s]+/, '');
    if (!clean) return;
    if (memoryKeywords.includes(clean)) {
      onNotify('该记忆关键词已存在！');
      return;
    }
    const updated = [...memoryKeywords, clean];
    setMemoryKeywords(updated);
    onUpdateNpcKeywords?.(npc.id, updated);
    setCustomKeywordInput('');
    onNotify(`✨ 已成功将【${clean}】录入与 ${npc.chineseName} 的羁绊关键词库！`);
  };

  const handleRemoveKeyword = (targetKw: string) => {
    const updated = memoryKeywords.filter((k) => k !== targetKw);
    setMemoryKeywords(updated);
    onUpdateNpcKeywords?.(npc.id, updated);
    onNotify(`已移除关键词【${targetKw}】`);
  };

  const handleKeywordQuickTopic = (kw: string) => {
    setInputText(`聊聊关于【${kw}】的事吧~`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-lg max-h-[94dvh] flex flex-col shadow-[0_16px_50px_rgba(0,0,0,0.5)] overflow-hidden text-[#2b2620]">
        
        {/* Character Card Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-[#635b4f] to-[#7f7464] text-white border-b border-[#ad9f8c] shadow-xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-[#ede8df] shadow-sm shrink-0">
                  <img
                    src={npc.avatar}
                    alt={npc.chineseName}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-xs border border-white">
                  <Heart className="w-2 h-2 fill-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm">{npc.chineseName}</span>
                  <span className="text-[10px] font-medium bg-[#4a4237]/80 px-2 py-0.2 rounded-full text-[#f0e6d2]">
                    {npc.role}
                  </span>
                  <span className="text-[10px] font-bold bg-[#f5d68e] text-[#3d3119] px-2 py-0.2 rounded-full">
                    {npc.relationshipStage || '朋友'}
                  </span>
                </div>

                <div className="text-[11px] text-[#e6dfd3] flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-rose-200">
                    <Heart className="w-2.5 h-2.5 text-rose-300 fill-rose-300" />
                    好感 {npc.favorability}%
                  </span>
                  {typeof npc.romancePoints === 'number' && npc.romancePoints > 0 && (
                    <span className="flex items-center gap-1 text-pink-200 text-[10px]">
                      <Flame className="w-2.5 h-2.5 text-pink-300 fill-pink-300" />
                      心动 {npc.romancePoints}
                    </span>
                  )}
                  <span className="text-[10px] text-[#ded7c8] hidden sm:inline">· {location}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleExecuteSummaryCommand('/summary')}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  showSummaryCard
                    ? 'bg-amber-400 text-[#2b2212] border-white shadow-xs'
                    : 'bg-[#5c4f38]/90 hover:bg-[#6e5e42] text-amber-200 border-amber-300/40'
                }`}
                title="触发 /summary 指令：基于 memories 生成 100 字看法与共同经历总结"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">简报AI</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMindReading(!showMindReading)}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  showMindReading
                    ? 'bg-rose-500 text-white border-white shadow-xs'
                    : 'bg-[#5e4b52]/90 hover:bg-[#5e4b52] text-pink-200 border-pink-400/40'
                }`}
                title="实时读取NPC内心独白与情感波动"
              >
                <span>🧠</span>
                <span className="hidden sm:inline">心情读取</span>
              </button>

              <button
                onClick={() => setShowMemoryDrawer(!showMemoryDrawer)}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  showMemoryDrawer
                    ? 'bg-[#f5d68e] text-[#383020] border-white shadow-xs'
                    : 'bg-[#4e463a]/80 hover:bg-[#4e463a] text-[#f5e8c7] border-[#8f8474]/50'
                }`}
                title="查看与管理共同记忆关键词"
              >
                <BookHeart className="w-3 h-3" />
                <span className="hidden sm:inline">羁绊档案</span>
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-[#4e463a]/70 hover:bg-[#4e463a] flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showSummaryCard && summaryBriefing && (
            <div className="mt-2.5 bg-gradient-to-r from-[#3d3122]/95 via-[#4f3f2b]/95 to-[#382c1e]/95 border border-amber-300/60 rounded-xl p-3 text-amber-50 text-xs leading-relaxed shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between font-bold text-amber-300 text-[11px] mb-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>📋 【简报 AI】{summaryBriefing.impressionTitle}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-full text-amber-200">
                    {summaryBriefing.bondEvaluation}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSummaryCard(false)}
                    className="text-amber-200/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <p className="text-amber-50/95 bg-black/25 p-2.5 rounded-lg border border-amber-400/25">
                {summaryBriefing.summary}
              </p>
            </div>
          )}

          {showMindReading && (
            <div className="mt-2.5 bg-gradient-to-r from-rose-950/90 via-purple-950/90 to-indigo-950/90 border border-pink-400/50 rounded-xl p-3 text-pink-100 text-xs leading-relaxed shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between font-bold text-pink-300 text-[11px] mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                  <span>🧠 【{npc.chineseName}】实时心灵感应与内心独白</span>
                </span>
                <span className="text-[10px] bg-pink-500/30 px-2 py-0.5 rounded-full text-pink-200">
                  好感 {npc.favorability}% · {npc.relationshipStage || '朋友'}
                </span>
              </div>
              <p className="italic text-pink-50/90 bg-black/25 p-2.5 rounded-lg border border-pink-500/20">
                "{getMindReadingText()}"
              </p>
            </div>
          )}

          {/* Personality Ribbon: MBTI & Interests */}
          <div className="mt-2.5 pt-2 border-t border-[#877c6c]/60 flex items-center gap-2 text-[11px] overflow-x-auto no-scrollbar">
            <span className="bg-[#41392e]/80 text-[#f5dfb8] px-2 py-0.5 rounded-md font-semibold shrink-0 flex items-center gap-1 border border-[#6b6050]">
              <Smile className="w-3 h-3 text-[#f5d68e]" />
              {npc.mbti || '真实韩国女高人设'}
            </span>
            {Array.isArray(npc.interests) && npc.interests.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 text-[#f1ede3]">
                <span className="text-[#d8cfbe]">偏好：</span>
                {npc.interests.slice(0, 3).map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-white/15 px-1.5 py-0.5 rounded text-[10px] text-[#f7f2ea]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Memory Keywords Quick Bar */}
        <div className="bg-[#e4ddcf] px-3.5 py-2 border-b border-[#cfc6b6] flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#635338] shrink-0">
            <Tag className="w-3 h-3 text-[#946b2a]" />
            <span>记忆关键词:</span>
          </div>
          {memoryKeywords.map((kw, i) => (
            <button
              key={i}
              onClick={() => handleKeywordQuickTopic(kw)}
              title="点击将此关键词加入聊天话题"
              className="shrink-0 text-[11px] bg-[#f9f7f2] hover:bg-[#fffdf8] hover:border-[#b89a61] border border-[#d6cdbe] text-[#443828] font-medium px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shadow-2xs cursor-pointer group"
            >
              <span>#{kw}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowMemoryDrawer(true);
              setDrawerTab('keywords');
            }}
            className="shrink-0 text-[10px] text-[#786445] hover:text-[#42331c] underline cursor-pointer ml-1"
          >
            +管理/新增
          </button>
        </div>

        {/* Collapsible Memory Drawer: Keywords & Detailed Memories */}
        {showMemoryDrawer && (
          <div className="bg-[#f7f2e8] border-b-2 border-[#cfc4b0] p-3.5 space-y-3 max-h-64 overflow-y-auto">
            {/* Drawer Tabs */}
            <div className="flex items-center justify-between border-b border-[#dfd6c6] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerTab('keywords')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drawerTab === 'keywords'
                      ? 'bg-[#e5d5b7] text-[#3d2e14] border border-[#ccb995]'
                      : 'text-[#7d715f] hover:text-[#423a2f]'
                  }`}
                >
                  🏷️ 记忆关键词 ({memoryKeywords.length})
                </button>
                <button
                  onClick={() => setDrawerTab('memories')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drawerTab === 'memories'
                      ? 'bg-[#e5d5b7] text-[#3d2e14] border border-[#ccb995]'
                      : 'text-[#7d715f] hover:text-[#423a2f]'
                  }`}
                >
                  📖 共同回忆日志 ({memories.length})
                </button>
              </div>

              <button
                onClick={() => {
                  onUpdateChatHistory(npc.id, []);
                  onNotify(`已清空与 ${npc.chineseName} 的当前屏幕记录（关键词与羁绊库仍完好保留）`);
                }}
                className="text-[11px] text-[#8c4646] hover:underline cursor-pointer"
              >
                清空本轮屏幕
              </button>
            </div>

            {/* Tab 1: Keywords Management */}
            {drawerTab === 'keywords' && (
              <div className="space-y-2.5">
                <div className="text-[11px] text-[#6b5c46]">
                  Gemini API 会在每次对话中实时提取记忆关键词，并在后续对话中自然关联呼应，赋予角色真实的长期记忆感：
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white/70 border border-[#ded5c5] rounded-xl">
                  {memoryKeywords.map((kw, idx) => (
                    <div
                      key={idx}
                      className="bg-[#f0e7d5] border border-[#d9ccb4] text-[#3a2f1e] text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>#{kw}</span>
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-[#968974] hover:text-rose-600 transition-colors cursor-pointer"
                        title="删除该关键词"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCustomKeyword} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customKeywordInput}
                    onChange={(e) => setCustomKeywordInput(e.target.value)}
                    placeholder="手动输入新关键词（如：大峙洞补习约定、草莓大福）..."
                    className="flex-1 bg-white border border-[#c7bfb0] rounded-lg px-2.5 py-1 text-xs text-[#2b2620] focus:outline-none focus:border-[#967d4f]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#ded0b1] hover:bg-[#d0be97] border border-[#c2ae84] rounded-lg text-xs font-bold text-[#383020] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 添加词条
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Detailed Memories */}
            {drawerTab === 'memories' && (
              <div className="space-y-2">
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {memories.length === 0 ? (
                    <div className="text-xs text-[#7a7164] italic">暂无特别记忆</div>
                  ) : (
                    memories.map((mem, idx) => (
                      <div
                        key={idx}
                        className="bg-white/80 border border-[#dfd9ce] rounded-lg px-2.5 py-1.5 text-xs text-[#3a332a] flex items-center justify-between gap-2"
                      >
                        <span>📌 {mem}</span>
                        <button
                          onClick={() => onRemoveNpcMemory(npc.id, idx)}
                          className="text-[#9c8f7e] hover:text-[#8c4646] shrink-0 cursor-pointer"
                          title="删除这条记忆"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customMemoryInput.trim()) return;
                    onAddNpcMemory(npc.id, `[手动记述] ${customMemoryInput.trim()}`);
                    setCustomMemoryInput('');
                    onNotify('已记入角色记忆库！');
                  }}
                  className="flex gap-1.5 pt-1"
                >
                  <input
                    type="text"
                    value={customMemoryInput}
                    onChange={(e) => setCustomMemoryInput(e.target.value)}
                    placeholder="手动补充一条你们之间的特殊故事或约定..."
                    className="flex-1 bg-white border border-[#c7bfb0] rounded-lg px-2.5 py-1 text-xs text-[#2b2620]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#ded0b1] hover:bg-[#d0be97] border border-[#c2ae84] rounded-lg text-xs font-bold text-[#383020] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 记入
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Chat History Area */}
        <div
          className="p-3 sm:p-4 flex-1 overflow-y-auto overscroll-contain space-y-3 bg-[#e2dbd0]/75 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {chatHistory.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {m.actionDesc && (
                <div className="text-[11px] text-[#635a4e] italic mb-1 px-1 font-medium">
                  * {m.actionDesc} *
                </div>
              )}
              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-b from-[#786c5b] to-[#635848] text-white rounded-br-xs border border-[#918572]'
                    : 'bg-[#f7f5ee] text-[#2b2620] rounded-bl-xs border border-[#cfc7b8]'
                }`}
              >
                <div>{m.text}</div>

                {/* NPC's Deep Inner Thoughts */}
                {m.innerThought && (
                  <div className="mt-2 pt-1.5 border-t border-[#dfd8cc] text-[11px] text-[#705e45] bg-[#efe9dc]/80 px-2.5 py-1 rounded-lg">
                    💭 心声：{m.innerThought}
                  </div>
                )}

                {/* Extracted Memory Keywords Tag */}
                {Array.isArray(m.extractedKeywords) && m.extractedKeywords.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-[#7d6739] font-bold">🧠 记忆提取:</span>
                    {m.extractedKeywords.map((kw, ki) => (
                      <span
                        key={ki}
                        className="text-[10px] font-bold bg-[#faecd2] text-[#634918] border border-[#e8d5b0] px-1.5 py-0.2 rounded-md"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Milestone Memory Log */}
                {m.newMemory && (
                  <div className="mt-1.5 text-[10px] font-bold text-[#6e5528] bg-[#f5ebd6] border border-[#dfcda8] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>📌 新约定：</span>
                    <span>{m.newMemory}</span>
                  </div>
                )}

                <div className="mt-1 flex items-center justify-between gap-3 text-[10px] opacity-75">
                  {m.timeLabel && <span>{m.timeLabel}</span>}
                  {typeof m.favDelta === 'number' && (
                    <span className="font-bold text-[#3f7547]">
                      好感 {m.favDelta >= 0 ? `+${m.favDelta}` : m.favDelta}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#5c5243] bg-[#f7f5ef] border border-[#cfc7b8] px-3.5 py-2 rounded-xl w-fit shadow-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[#9c7838] animate-spin" />
              <span>{npc.chineseName} 正在根据性格与好感度生成回应...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* AI Suggested Continuous Topics */}
        <div className="px-3.5 py-2 bg-[#e6dfd3] border-t border-[#cfc8ba] space-y-1.5">
          <div className="text-[11px] text-[#554d42] font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#786950]" />
              连续交谈话题（点击直接说，或使用 /summary 指令生成简报）：
            </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage('/summary')}
              className="text-[10px] bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-md cursor-pointer flex items-center gap-1 shadow-2xs"
              title="发送 /summary 指令，让简报 AI 生成100字看法与共同回忆总结"
            >
              <FileText className="w-2.5 h-2.5 text-amber-700" />
              <span>/summary 简报AI</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTopics.map((topic, i) => (
              <button
                key={i}
                disabled={isLoading}
                onClick={() => handleSendMessage(topic)}
                className="text-[11px] bg-[#f7f5ef] hover:bg-[#fffdf9] disabled:opacity-50 border border-[#c7bfb0] text-[#332b22] font-medium px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer text-left"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Free Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 bg-[#ded7cb] border-t border-[#c5bba8] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`对 ${npc.chineseName} 自由输入，或输入 /summary 召唤【简报 AI】生成100字总结...`}
            className="flex-1 bg-[#f9f7f2] border border-[#bbb1a0] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#2b2620] placeholder-[#877c6b] focus:outline-none focus:border-[#7d643d] shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2 bg-gradient-to-b from-[#e3d5b7] to-[#cca783] hover:from-[#eddcb9] hover:to-[#dbb591] disabled:opacity-50 border border-white/60 rounded-xl text-[#362a19] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </form>

      </div>
    </div>
  );
};
