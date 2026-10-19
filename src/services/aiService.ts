import {
  AIConfig,
  GameStats,
  NPCClassmate,
  RandomEvent,
  ChatMessage,
  ForumPost,
  DynamicNarrativeContext,
  DynamicNarrativeResult,
  DynamicNPCEncounter,
  WeeklyActionItem,
  LifePathType,
} from '../types';
import {
  DYNAMIC_NPC_FALLBACK_PRESETS,
  getAvatarForSeed,
  getEncounterLocationByAction,
} from '../data/encounterData';

/**
 * 全局通用的【去AI味文风铁律常量 ANTI_AI_STYLE_RULES】
 * 强制原封不动注入到每一次 AI 请求的 System Prompt 核心位置与末尾
 */
export const ANTI_AI_STYLE_RULES = `
【必须原封不动严格遵守的 5 条核心文风铁律】：

1. 关于句式的节奏与变化：
避免连续使用三个或以上的短句排成一串。也禁止将三个以上的短词组并列在一起。让句子长短交替，段落内部有呼吸感，情感靠细节和独特的语言推进，而不是靠排比叠加。同一个段落中，句式要不断变化。禁止出现相同结构的词组或短句连续排列三次及以上。节奏可以偶尔紧凑，但不能形成机械的排比。

2. 关于标点与连接方式：
全文禁止使用破折号（——）。不论是用于转折、补充，还是解释，都不允许出现。所有原本由破折号承担的功能，请改用逗号、句号，或者通过自然的语序衔接完成。尤其禁止以下两种结构：“——xxxx——”这种插在句子中间的补充说明；“xxxx——xxxxx”这种用破折号带出的解释性语句。

3. 关于否定句式的处理：
描写时，不允许使用先否定后肯定的写法。比如“不是……而是……”“没有……只有……”“不像……更像……”这类结构一律禁止。正文中也不能把“不是”“没有”“不会”“不再”等否定词当作描写的手段。所有画面必须从正面直接切入，用肯定、直接的语言呈现。（例外情况：人物对话中的否定表达属于正常口语，不受限制。）

4. 关于形容词与修饰的使用：
一个名词最多只带一个修饰成分。禁止出现“xx的、xx的、xx的”这种连续叠加的形容结构。禁止连续堆砌短小的形容词，例如“皮肤更白更滑更软”这种用“更”串联的形式，或者“更强、更快、更敏锐”这种用逗号或顿号连接的连续短形容。也禁止将两字或三字的形容词单独成句，或者连续堆叠在一起。每一个形容词都必须放进完整的句子中展开，不能以词组形式独立出现。每个被使用的形容词，都应该是那个语境下无法被替代的。描写的力量来自精准，而不是数量。如果去掉某个修饰词后不影响信息表达，那它就是多余的。

5. 关于比喻的使用节制：
比喻要极其克制。单次生成的剧情或对话中最多出现一处比喻（甚至不用比喻）。禁止连续使用“像”“仿佛”“如同”等词串联出多个比喻，也禁止在相邻段落中密集堆叠比喻句。比喻只应该出现在感官最尖锐、最需要被定格的瞬间，成为场景的一个支点，而不是装饰。最好的比喻是读者几乎察觉不到它，却直接被那个画面击中。`;

const NON_TEXT_KEYS = new Set([
  'id',
  'npcId',
  'avatar',
  'avatarUrl',
  'remoteUrl',
  'avatarSeed',
  'action',
  'focusStat',
  'category',
  'evalRank',
]);

/**
 * 文本后处理清洗函数：自动将返回内容里残余的 `——`、`—` 或 `--` 替换为逗号或句号，从根源上杜绝破折号出现在玩家眼前
 */
export function cleanAntiAIText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  if (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    text.startsWith('data:image/') ||
    text.startsWith('/avatars/')
  ) {
    return text;
  }
  return text
    .replace(/\s*——\s*([^—\n]+?)\s*——\s*/g, '，$1，')
    .replace(/\s*(?:——+|—+|--+)\s*/g, '，')
    .replace(/，([。！？；，、])/g, '$1')
    .replace(/([。！？；：“”‘’])，/g, '$1')
    .replace(/^，+/, '')
    .replace(/，+$/, '。');
}

/**
 * 递归清洗 AI 返回 JSON 对象中的所有文本字段
 */
export function sanitizeAntiAIResponse<T>(data: T, currentKey?: string): T {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    if (currentKey && NON_TEXT_KEYS.has(currentKey)) return data;
    return cleanAntiAIText(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAntiAIResponse(item, currentKey)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleanedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      cleanedObj[key] = sanitizeAntiAIResponse(val, key);
    }
    return cleanedObj as T;
  }
  return data;
}

/**
 * 通用 AI 返回 JSON 解析与去破折号清洗器（双重保险）
 */
export function parseAndCleanAIJson<T = any>(rawText: string): T {
  const stripped = (rawText || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/\s*(?:——+|—+|--+)\s*/g, '，')
    .trim();
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  const jsonCandidate =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? stripped.slice(firstBrace, lastBrace + 1)
      : stripped;
  return sanitizeAntiAIResponse<T>(JSON.parse(jsonCandidate));
}

export interface NpcChatAIResponse {
  reply: string;
  innerThought: string;
  actionDesc: string;
  newMemory?: string;
  extractedKeywords?: string[];
  favorabilityDelta: number;
  moodDelta: number;
  socialDelta: number;
  suggestedReplies: string[];
}

/**
 * 1. NPC 手机聊天与当面互动 System Prompt 生成与调用
 */
export async function generateNpcChatReply(params: {
  aiConfig: AIConfig;
  npc: NPCClassmate;
  userMessage: string;
  history: ChatMessage[];
  memories: string[];
  stats: GameStats;
  location: string;
  timeContext: string;
}): Promise<NpcChatAIResponse> {
  const { aiConfig, npc, userMessage, history, memories, stats, location, timeContext } = params;

  const historyText = history
    .slice(-8)
    .map((m) => `${m.sender === 'user' ? '李秀妍' : npc.chineseName}: ${m.text}`)
    .join('\n');

  const memoryText =
    memories.length > 0 ? memories.slice(-8).map((m) => `- ${m}`).join('\n') : '暂无特殊记录';

  const nickname = npc.nicknameToPlayer || '秀妍';
  const speakingStyle = npc.speakingStyle || '自然松弛的韩国高中生日常口语';
  const forbiddenList =
    Array.isArray(npc.forbiddenWords) && npc.forbiddenWords.length > 0
      ? npc.forbiddenWords.join('、')
      : '请问有什么可以帮您、作为人工智能、好的呢';

  let attitudeDesc = '客气而自然地相处';
  if (npc.attitudeByAffection) {
    if (npc.favorability < 30) attitudeDesc = npc.attitudeByAffection.low;
    else if (npc.favorability < 70) attitudeDesc = npc.attitudeByAffection.mid;
    else attitudeDesc = npc.attitudeByAffection.high;
  } else {
    if (npc.favorability >= 70) attitudeDesc = '格外偏爱与依赖，愿意分享私密心事';
    else if (npc.favorability >= 30) attitudeDesc = '熟稔亲切，像日常朋友一样轻松调侃';
    else attitudeDesc = '保持礼貌距离，略带初识的矜持';
  }

  const systemPrompt = `你正在进行《韩国女高模拟器》真人化角色扮演。你就是首尔女子高中的【${npc.chineseName}】（${npc.koreanName}，身份：${npc.role}）。
${ANTI_AI_STYLE_RULES}

【角色与语境档案】
- 性格底色：${npc.personality || npc.description}（MBTI：${npc.mbti || 'ENFP'}）
- 对李秀妍的称呼习惯：【${nickname}】
- 说话方式与口癖：${speakingStyle}
- 严禁出现的客服套话：[ ${forbiddenList} ]
- 当前关系阶段：【${npc.relationshipStage}】（好感度 ${npc.favorability}/100，态度：${attitudeDesc}）
- 当前时间：${timeContext}，所在地点：${location}
- 共同记忆档案：
${memoryText}

【对话输出要求】
单次台词控制在 1 至 3 句鲜活口语，直接回应李秀妍的话，写出符合韩国高中生或练习生身份的具体生活细节（如便利店冰美式、小卖部面包、晚自习传纸条、练习室耳返等），严禁复读对方原话，严禁分点作答。
必须严格返回纯 JSON 对象：
{
  "reply": "30-85字自然口语台词",
  "innerThought": "15-35字角色此刻真实的私密想法",
  "actionDesc": "15-30字具体传神的微表情或小动作",
  "newMemory": "若产生新的约定或秘密则总结为一句话，否则填 \"\"",
  "extractedKeywords": ["提炼1-2个记忆关键词"],
  "favorabilityDelta": 5,
  "moodDelta": 5,
  "socialDelta": 3,
  "suggestedReplies": ["玩家可选自然回复1", "玩家可选自然回复2", "玩家可选自然回复3"]
}
${ANTI_AI_STYLE_RULES}`;

  // 0. Auto-Detect Star-Letter (星匣) GameSDK.ai
  if (typeof window !== 'undefined' && (window as any).GameSDK?.ai) {
    try {
      const sdk = (window as any).GameSDK;
      const plainMessages = JSON.parse(
        JSON.stringify([
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `最近对话记录：\n${historyText}\n\n李秀妍刚刚对你说：“${userMessage}”`,
          },
        ])
      );

      const sdkRes = await sdk.ai.chat({
        sceneCode: 'school_npc_chat',
        messages: plainMessages,
      });

      if (sdkRes && sdkRes.content) {
        return parseAndCleanAIJson<NpcChatAIResponse>(sdkRes.content);
      }
    } catch (err) {
      console.warn('星匣 GameSDK AI 引擎响应异常，已自动降级：', err);
    }
  }

  // 1. Custom API Proxy
  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const res = await fetch('/api/ai/custom-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: aiConfig.customBaseUrl,
        apiKey: aiConfig.customApiKey,
        model: aiConfig.customModel || 'gpt-4o-mini',
        temperature: aiConfig.temperature,
        jsonMode: true,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `最近对话记录：\n${historyText}\n\n李秀妍刚刚对你说：“${userMessage}”`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 调用失败');
    return parseAndCleanAIJson<NpcChatAIResponse>(data.content);
  }

  // 2. Built-in Server Endpoint
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      npc,
      userMessage,
      history,
      memories,
      stats,
      location,
      timeContext,
      narrativeStyle: aiConfig.narrativeStyle,
      systemPromptOverride: systemPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 响应失败');
  }
  return sanitizeAntiAIResponse(data);
}

/**
 * 2. KakaoTalk 班级群 / 练习生群聊多角色互动
 */
export async function generateGroupChatReplies(params: {
  userMessage: string;
  groupType: 'class' | 'idol';
  npcs: NPCClassmate[];
  timeContext: string;
  aiConfig?: AIConfig;
}): Promise<{ npcId: string; npcName: string; text: string }[]> {
  const { userMessage, groupType, npcs, timeContext, aiConfig } = params;

  const systemPrompt = `你是《韩国女高模拟器》中 KakaoTalk 群聊的实时群像剧编剧。
${ANTI_AI_STYLE_RULES}
当前群聊：${groupType === 'idol' ? '【四大社出道预备组练习生群】' : '【首尔女高 1-1班 快乐大本营】'}
群内主要同学性格：
- 朴敏英：温柔同桌死党，条漫画手，无条件护着秀妍
- 金智英：美妆与圣水洞潮流达人，语速快爱接梗
- 韩素拉：江南大峙洞高冷学霸，嘴硬心软
- 李恩宇：广播社温柔学长，清朗体贴
- 姜海仁：排球部主力，直球爽朗
- 千宥娜：冷艳前大社ACE转学生，酷飒护短
- 尹在民：严谨克制的学生会长，对秀妍格外破例

请根据主角【李秀妍】在群里的发言，生成 3 至 4 条不同角色的接龙秒回，既回复秀妍也互相吐槽接梗，每条发言 15 至 45 字，充满真实高中生群聊气息。
必须严格返回纯 JSON 对象：
{
  "messages": [
    { "npcId": "npc_2", "npcName": "金智英", "text": "群聊自然口语回复" },
    { "npcId": "npc_1", "npcName": "朴敏英", "text": "群聊自然口语回复" },
    { "npcId": "npc_3", "npcName": "韩素拉", "text": "群聊自然口语回复" },
    { "npcId": "npc_6", "npcName": "千宥娜", "text": "群聊自然口语回复" }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: aiConfig.temperature || 0.85,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `时间：${timeContext}，李秀妍在群里发消息：“${userMessage}”` },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{ messages: { npcId: string; npcName: string; text: string }[] }>(
          data.content
        );
        if (Array.isArray(parsed.messages)) return parsed.messages;
      }
    } catch (_e) {}
  }

  const res = await fetch('/api/ai/group-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage,
      groupType,
      npcs,
      timeContext,
      systemPromptOverride: systemPrompt,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '群聊 AI 响应失败');
  }
  return sanitizeAntiAIResponse(data.messages || []);
}

export async function generateAICharacterAvatar(params: {
  targetId: string;
  characterName: string;
  customPrompt: string;
  stylePreset: 'webtoon' | 'anime' | 'idol' | 'watercolor';
  gender?: 'female' | 'male';
}): Promise<{ avatarUrl: string; remoteUrl: string; seed: number }> {
  const res = await fetch('/api/ai/generate-avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 生图失败');
  }
  return data;
}

/**
 * 3. 动态校园突发剧情推演生成器
 */
export async function generateDynamicCampusEvent(params: {
  aiConfig: AIConfig;
  stats: GameStats;
  location: string;
  timeContext: string;
  npcs: NPCClassmate[];
  recentMemories: string[];
  customPrompt?: string;
}): Promise<RandomEvent> {
  const { aiConfig, stats, location, timeContext, npcs, recentMemories, customPrompt } = params;

  const npcSummary = npcs
    .map((n) => `${n.chineseName}(${n.role},好感${n.favorability})`)
    .join('、');
  const memText = recentMemories.slice(-6).join('；') || '新学期校园日常';

  const systemPrompt = `你是《韩国女高模拟器》的首席校园剧集编剧。
${ANTI_AI_STYLE_RULES}

请围绕主角李秀妍当前所处的地点与时间，创作一段具有真实韩国女高生活质感的突发事件与三项分支抉择。通过具体的光影、声音和人物细微动作推进叙事，拒绝空洞说教。
必须严格返回纯 JSON 对象：
{
  "title": "事件标题",
  "content": "90-140字细腻写实的校园场景与人物互动描写",
  "options": [
    {
      "text": "具体行动选项1",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话纪实",
      "effect": { "mood": 5, "stamina": -5, "academics": 3, "social": 4, "appearance": 0, "coins": 0, "npcId": "npc_1", "favDelta": 5 }
    },
    {
      "text": "具体行动选项2",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话纪实",
      "effect": { "mood": 8, "stamina": -2, "academics": 0, "social": 5, "appearance": 1, "coins": -3000, "npcId": "npc_2", "favDelta": 6 }
    },
    {
      "text": "具体行动选项3",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话纪实",
      "effect": { "mood": 2, "stamina": -8, "academics": 6, "social": 0, "appearance": 0, "coins": 0, "npcId": "npc_3", "favDelta": 4 }
    }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const res = await fetch('/api/ai/custom-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: aiConfig.customBaseUrl,
        apiKey: aiConfig.customApiKey,
        model: aiConfig.customModel || 'gpt-4o-mini',
        temperature: aiConfig.temperature,
        jsonMode: true,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `时间：${timeContext}，地点：${location}。认识同学：${npcSummary}。近期记忆：${memText}。${customPrompt ? `玩家期望剧情：${customPrompt}` : ''}`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 剧情生成失败');
    const parsed = parseAndCleanAIJson<Omit<RandomEvent, 'id'>>(data.content);
    return {
      ...parsed,
      id: `ai_ev_${Date.now()}`,
      isAIGenerated: true,
    };
  }

  const res = await fetch('/api/ai/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stats,
      location,
      timeContext,
      npcs,
      recentMemories,
      narrativeStyle: aiConfig.narrativeStyle,
      customPrompt,
      systemPromptOverride: systemPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 事件生成失败');
  }

  const cleanedData = sanitizeAntiAIResponse(data);
  return {
    id: `ai_ev_${Date.now()}`,
    isAIGenerated: true,
    ...cleanedData,
  };
}

/**
 * 4. 校园匿名竹林墙论坛生成
 */
export async function generateCampusForumPosts(params: {
  aiConfig: AIConfig;
  stats: GameStats;
  timeContext: string;
  recentMemories: string[];
  playerPost?: string;
}): Promise<ForumPost[]> {
  const { aiConfig, stats, timeContext, recentMemories, playerPost } = params;
  const memText = recentMemories.slice(-6).join('；') || '开学初的日常校园生活';

  const systemPrompt = `你是首尔女子高中校内匿名论坛“竹林墙（대나무숲）”的内容生成器。
${ANTI_AI_STYLE_RULES}

请根据李秀妍当前的学业（${stats.academics}）、社交（${stats.social}）、外形（${stats.appearance}）、粉丝数（${stats.snsFollowers}）以及近期校园记忆（${memText}），生成 3 条鲜活接地气的韩国高中生匿名贴与跟帖评论。
必须严格返回纯 JSON 对象：
{
  "posts": [
    {
      "author": "匿名昵称",
      "tag": "板块标签",
      "title": "帖子标题",
      "content": "帖子正文",
      "likes": 128,
      "comments": ["跟帖评论1", "跟帖评论2"]
    }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: aiConfig.temperature || 0.85,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `时间：${timeContext}。${playerPost ? `李秀妍刚刚发帖：“${playerPost}”，请让第一条帖子围绕她展开热议。` : '请生成最新3条校园热帖。'}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{ posts: ForumPost[] }>(data.content);
        if (Array.isArray(parsed.posts)) return parsed.posts;
      }
    } catch (_e) {}
  }

  const res = await fetch('/api/ai/forum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stats,
      timeContext,
      recentMemories,
      playerPost,
      systemPromptOverride: systemPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '校园论坛生成失败');
  }
  return sanitizeAntiAIResponse(data.posts || []);
}

/**
 * 5. 练习生生存秀舞台与月度评测考核生成
 */
export async function generateTraineeSurvivalMission(params: {
  aiConfig: AIConfig;
  category: 'monthly_eval' | 'public_stage' | 'fan_meeting' | 'debut_combat';
  stats: GameStats;
  agencyName: string;
  customTheme?: string;
  timeContext: string;
}): Promise<import('../types').TraineeSurvivalMission> {
  const { aiConfig, category, stats, agencyName, customTheme, timeContext } = params;

  const categoryLabels: Record<string, string> = {
    monthly_eval: '月度评测考核',
    public_stage: '生存秀公演舞台',
    fan_meeting: '初披露粉丝见面会',
    debut_combat: '出道实战Showcase',
  };

  const systemPrompt = `你是韩国K-POP选秀《PRODUCE 首尔女团》与四大社练习生生存系统的总编剧。
${ANTI_AI_STYLE_RULES}

请为首尔女子高中练习生【李秀妍】（企划社：${agencyName}，评级：${stats.traineeGrade}，Vocal:${stats.vocalSkill} Dance:${stats.danceSkill} Rap:${stats.rapSkill} Cam:${stats.cameraSkill}，粉丝数:${stats.snsFollowers}）生成一场【${categoryLabels[category]}】生存秀实战任务。
描写聚焦舞台灯光、耳返呼吸声、评委席翻动资料的细节与韩网真实评论氛围。
必须严格返回纯 JSON 对象：
{
  "title": "任务标题",
  "conceptTag": "#概念标签1 #概念标签2",
  "broadcastChannel": "播出频道或举办场地",
  "sceneDescription": "100-150字细腻写实的韩国舞台或考核现场场景描写",
  "mentorPrompt": "制作人导师的现场发问或考核要求",
  "liveNetizenComments": ["弹幕或站姐速报1", "弹幕或站姐速报2", "弹幕或站姐速报3"],
  "options": [
    {
      "text": "高光表现选择1",
      "focusStat": "vocalSkill",
      "focusLabel": "声乐高音杀手锏",
      "baseScoreBonus": 32,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 15, "snsFollowers": 6500, "coins": 60000, "vocalSkill": 8, "danceSkill": 4, "rapSkill": 3, "cameraSkill": 6, "mood": 12, "social": 8, "appearance": 3 }
    },
    {
      "text": "高光表现选择2",
      "focusStat": "danceSkill",
      "focusLabel": "刀群舞C位统治",
      "baseScoreBonus": 32,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 15, "snsFollowers": 6200, "coins": 60000, "vocalSkill": 4, "danceSkill": 9, "rapSkill": 4, "cameraSkill": 6, "mood": 12, "social": 8, "appearance": 3 }
    },
    {
      "text": "高光表现选择3",
      "focusStat": "cameraSkill",
      "focusLabel": "神级直拍与宠粉营业",
      "baseScoreBonus": 33,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 16, "snsFollowers": 8000, "coins": 65000, "vocalSkill": 4, "danceSkill": 4, "rapSkill": 3, "cameraSkill": 10, "mood": 14, "social": 10, "appearance": 5 }
    }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const res = await fetch('/api/ai/custom-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseUrl: aiConfig.customBaseUrl,
        apiKey: aiConfig.customApiKey,
        model: aiConfig.customModel || 'gpt-4o-mini',
        temperature: aiConfig.temperature,
        jsonMode: true,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `时间：${timeContext}，任务类型：${categoryLabels[category]}。${customTheme ? `玩家指定主题：“${customTheme}”` : ''}`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 生存秀任务生成失败');
    const parsed = parseAndCleanAIJson<any>(data.content);
    return {
      id: `ai_tr_${Date.now()}`,
      category,
      categoryLabel: categoryLabels[category],
      isAIGenerated: true,
      ...parsed,
    };
  }

  const res = await fetch('/api/ai/trainee-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      stats,
      agencyName,
      customTheme,
      timeContext,
      systemPromptOverride: systemPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '练习生生存秀任务生成失败');
  }
  return sanitizeAntiAIResponse(data);
}

/**
 * 6. 选项结果生成、兼职打工奇遇、商业代言拍摄、考场纪实与练习生考核评价
 */
export async function generateDynamicNarrative(params: {
  aiConfig?: AIConfig;
  context: DynamicNarrativeContext;
}): Promise<DynamicNarrativeResult> {
  const { aiConfig, context } = params;
  const sceneType = context.sceneType || 'general';
  const playerName = context.playerName || '李秀妍';
  const location = context.location || '首尔校园';
  const actionName = context.actionName || '日常行动';
  const choiceText = context.choiceText || '';
  const agencyName = context.agencyName || 'K-POP企划社';

  let roleInstruction = `你是《韩国女高模拟器》的写实派微剧情叙事主笔。请为玩家的行动【${actionName}】生成一段50-80字具有呼吸感与现场细节的短剧情。`;
  if (sceneType === 'choice_option') {
    roleInstruction = `你是《韩国女高模拟器》的写实派剧情编剧。玩家【${playerName}】在【${location}】做出了抉择：“${choiceText}”。请生成一段50-80字富有具体动作细节与情绪余韵的后续微描写，并附带一句自然台词。`;
  } else if (sceneType === 'job_event') {
    roleInstruction = `你是《韩国女高模拟器》的兼职与都市奇遇编剧。玩家【${playerName}】正在【${location}】进行兼职【${actionName}】。请生成一段50-80字真实鲜活的打工现场插曲（如便利店夜班加热便当、圣水洞咖啡馆拉花、遇到前辈或星探等），并给出具体小费与台词。`;
  } else if (sceneType === 'endorsement_event') {
    roleInstruction = `你是《韩国女高模拟器》的商业拍摄现场编剧。玩家【${playerName}】正在【${location}】拍摄商业代言【${actionName}】。请生成一段50-80字片场快门声、灯光调度与镜头表现力的现场微描写。`;
  } else if (sceneType === 'exam_event') {
    roleInstruction = `你是《韩国女高模拟器》的考场纪实编剧。玩家【${playerName}】刚完成【${actionName}】（得分：${context.examScore ?? 88}分）。请生成一段50-80字关于涂卡笔声、考场窗外光线与交卷瞬间的真实微描写。`;
  } else if (sceneType === 'trainee_eval') {
    roleInstruction = `你是韩国顶级娱乐企划社【${agencyName}】的考核总监。练习生【${playerName}】刚完成月末评测（Vocal:${context.stats?.vocalSkill || 40}, Dance:${context.stats?.danceSkill || 40}, Stage:${context.stats?.cameraSkill || 40}）。请给出60-90字考核室现场氛围描写，以及一针见血的专业导师点评与训练建议。`;
  }

  const systemPrompt = `${roleInstruction}
${ANTI_AI_STYLE_RULES}

必须严格返回纯 JSON 对象：
{
  "title": "现场小标题",
  "narrative": "50-80字细腻写实的现场微描写",
  "dialogue": "现场人物自然口语台词或内心独白",
  "jobEvent": { "title": "突发插曲标题", "encounterDesc": "具体事件经过描写", "tipGained": 8000 },
  "mentorVerdict": { "mentorName": "首席考核导师", "agencyStyle": "${agencyName} 严苛标准", "ratingScore": 85, "critique": "直击呼吸发力与镜头眼神的专业点评", "advice": "具体的改进训练建议" }
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig && aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: aiConfig.temperature,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(context) },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok && data.content) {
        return parseAndCleanAIJson<DynamicNarrativeResult>(data.content);
      }
    } catch (_err) {
      console.warn('自定义 API 剧情生成降级：', _err);
    }
  }

  const res = await fetch('/api/ai/narrative', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...context,
      systemPromptOverride: systemPrompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '动态剧情生成失败');
  }
  return sanitizeAntiAIResponse(data);
}

/**
 * 7. AI 动态生成偶遇 NPC 与微情境生成器
 */
export async function generateNewNPCEncounter(params: {
  stats: GameStats;
  actionItem?: WeeklyActionItem;
  dayName?: string;
  weekInYear: number;
  gradeYear: number;
  location?: string;
  aiConfig?: AIConfig;
}): Promise<DynamicNPCEncounter> {
  const { actionItem, dayName, weekInYear, gradeYear, location, aiConfig } = params;
  const actName = actionItem?.name || '日常活动';
  const loc = location || getEncounterLocationByAction(actionItem?.id || '', '首尔街头');

  const systemPrompt = `你是《韩国女高模拟器》角色导演。玩家高${gradeYear}第${weekInYear}周正在【${loc}】进行【${actName}】。
${ANTI_AI_STYLE_RULES}

请现场即兴生成一个富有韩国真实当代校园或娱乐界特色的全新偶遇人物（Dynamic NPC Encounter）。
必须严格返回纯 JSON 格式：
{
  "name": "随机韩文名（带中文译名，如崔宥真 (최유진)）",
  "chineseName": "中文译名",
  "koreanName": "韩文名",
  "identity": "身份设定（如：隔壁校乐队吉他手 / 竞争娱乐社C班练习生 / 便利店打工前辈）",
  "personality": "性格核心（如：表面冷淡其实是重度猫奴 / 元气但容易害羞）",
  "speakingStyle": "独特的口癖与称呼习惯",
  "avatarSeed": "female_guitarist",
  "encounterStory": "相遇时的微情境短文（50-80字，如借伞、抢最后一盒草莓牛奶、练习室撞衫）",
  "encounterLocation": "${loc}",
  "choices": [
    { "text": "主动交换 KakaoTalk 认识一下", "action": "ADD_FRIEND" },
    { "text": "微笑点头，擦肩而过", "action": "IGNORE" }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  // 0. Auto-Detect Star-Letter (星匣) GameSDK.ai
  if (typeof window !== 'undefined' && (window as any).GameSDK?.ai) {
    try {
      const sdk = (window as any).GameSDK;
      const sdkRes = await sdk.ai.chat({
        sceneCode: 'dynamic_npc_encounter',
        messages: [{ role: 'user', content: systemPrompt }],
      });
      if (sdkRes && sdkRes.content) {
        const parsed = parseAndCleanAIJson<DynamicNPCEncounter>(sdkRes.content);
        if (parsed.name && parsed.identity && parsed.encounterStory) {
          if (!parsed.avatarUrl) parsed.avatarUrl = getAvatarForSeed(parsed.avatarSeed);
          return parsed;
        }
      }
    } catch (_e) {}
  }

  // 1. Try Custom API proxy if configured
  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: 0.9,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `日程：${actName}，地点：${loc}` },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<DynamicNPCEncounter>(data.content);
        if (parsed.name && parsed.identity && parsed.encounterStory) {
          if (!parsed.avatarUrl) parsed.avatarUrl = getAvatarForSeed(parsed.avatarSeed);
          return parsed;
        }
      }
    } catch (_err) {}
  }

  // 2. Call server proxy /api/ai/generate-encounter
  try {
    const res = await fetch('/api/ai/generate-encounter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerContext: {
          actionId: actionItem?.id || 'act_study_class',
          actionName: actName,
          actionCategory: actionItem?.categoryLabel || '校园生活',
          dayName: dayName || '今天',
          weekInYear,
          gradeYear,
          location: loc,
        },
        systemPromptOverride: systemPrompt,
      }),
    });
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      if (data && data.name && data.identity && data.encounterStory) {
        if (!data.avatarUrl) data.avatarUrl = getAvatarForSeed(data.avatarSeed);
        return data;
      }
    }
  } catch (_e) {}

  // 3. Fallback to local 5 curated presets
  const randIdx = Math.floor(Math.random() * DYNAMIC_NPC_FALLBACK_PRESETS.length);
  const preset = DYNAMIC_NPC_FALLBACK_PRESETS[randIdx];
  return sanitizeAntiAIResponse({
    ...preset,
    encounterLocation: loc || preset.encounterLocation,
  });
}

export interface NpcMemorySummaryResult {
  summary: string;
  impressionTitle: string;
  bondEvaluation: string;
}

/**
 * 8. ChatModal `/summary` 简报 AI 生成器
 */
export async function generateNpcMemorySummary(params: {
  aiConfig: AIConfig;
  npc: NPCClassmate;
  memories: string[];
  timeContext?: string;
}): Promise<NpcMemorySummaryResult> {
  const { aiConfig, npc, memories, timeContext } = params;
  const memList = Array.isArray(memories) && memories.length > 0 ? memories : npc.memories || [];
  const memText =
    memList.length > 0
      ? memList.map((m, idx) => `${idx + 1}. ${m}`).join('\n')
      : `初识于${npc.encounterLocation || '首尔女高'}，身份为${npc.role}，性格：${npc.personality || npc.description}`;

  const systemPrompt = `你是《韩国女高模拟器》的【简报 AI】。请根据角色【${npc.chineseName}】（身份：${npc.role}，性格：${npc.personality || npc.description}，当前关系：${npc.relationshipStage}，好感度：${npc.favorability}/100）的 memories 共同经历记录，生成一份关于该 NPC 对玩家（李秀妍）的真实看法与两人过去共同经历的 100 字左右精炼总结。
${ANTI_AI_STYLE_RULES}

共同记忆记录：
${memText}

必须严格返回纯 JSON：
{
  "impressionTitle": "四到八字印象标题（如：并肩追光的温暖同桌）",
  "summary": "约100字的角色视角看法与共同经历回顾总结",
  "bondEvaluation": "一句话关系羁绊评语"
}
${ANTI_AI_STYLE_RULES}`;

  // 0. Auto-Detect Star-Letter (星匣) GameSDK.ai
  if (typeof window !== 'undefined' && (window as any).GameSDK?.ai) {
    try {
      const sdk = (window as any).GameSDK;
      const sdkRes = await sdk.ai.chat({
        sceneCode: 'npc_memory_summary',
        messages: [{ role: 'user', content: systemPrompt }],
      });
      if (sdkRes && sdkRes.content) {
        const parsed = parseAndCleanAIJson<NpcMemorySummaryResult>(sdkRes.content);
        if (parsed.summary) return parsed;
      }
    } catch (_e) {}
  }

  // 1. Custom API proxy if configured
  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: 0.75,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `当前时间：${timeContext || '首尔女高学期中'}\n过往共同记忆(memories)：\n${memText}`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<NpcMemorySummaryResult>(data.content);
        if (parsed.summary) return parsed;
      }
    } catch (_err) {}
  }

  // 2. Server endpoint /api/ai/npc-summary
  try {
    const res = await fetch('/api/ai/npc-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npc,
        memories: memList,
        timeContext,
        systemPromptOverride: systemPrompt,
      }),
    });
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      if (data && data.summary) return data;
    }
  } catch (_e) {}

  // 3. Local deterministic 100-word synthesis fallback based on memories
  const recentMems = memList
    .slice(-3)
    .map((m) => m.replace(/^\[[^\]]+\]\s*/, ''))
    .join('；');
  const stageDesc =
    npc.favorability >= 75
      ? '早已将秀妍视为心底最耀眼且无可替代的特别存在'
      : npc.favorability >= 50
      ? '对秀妍充满了信任与欣赏，觉得每次相处都格外合拍安心'
      : '对秀妍抱有温暖的好奇与好感，期待在未来的校园日常中创造更多交集';

  return sanitizeAntiAIResponse({
    impressionTitle: `${npc.chineseName}眼中的秀妍 · ${npc.relationshipStage || '相识'}篇`,
    summary: `在身为【${npc.role}】的${npc.chineseName}心中，两人曾共同经历了：${
      recentMems || `在${npc.encounterLocation || '首尔校园'}的初次邂逅与日常交谈`
    }。点滴相处让好感度升至 ${npc.favorability}%，TA${stageDesc}，这份青春羁绊正日益深厚。`,
    bondEvaluation: `已记录 ${memList.length} 条专属共同记忆 · 当前关系【${npc.relationshipStage || '朋友'}】`,
  });
}

export interface LifePathStoryResult {
  title: string;
  story: string;
  headline: string;
  netizenReactions: string[];
  statSummary?: string;
}

/**
 * 9. 毕业后成年人生进阶篇章剧情生成器（爱豆顶流 / 首尔大精英 / 汉南洞豪门）
 */
export async function generateLifePathStory(params: {
  pathType: LifePathType;
  actionTitle: string;
  contextInfo: string;
  protagonistName?: string;
  aiConfig?: AIConfig;
}): Promise<LifePathStoryResult> {
  const { pathType, actionTitle, contextInfo, protagonistName = '李秀妍', aiConfig } = params;

  const roleDescMap: Record<string, string> = {
    idol: 'K-Pop 顶流女团 C 位兼全能 ACE 爱豆',
    university: '首尔大学名门精英女性（法学与学术深造、平衡事业与家庭）',
    chaebol: '汉南洞顶级财阀豪门主母与清潭洞名媛领袖',
  };

  const systemPrompt = `你是韩国现实主义剧集编剧。正在撰写主角【${protagonistName}】在成年进阶篇章【${roleDescMap[pathType] || '成年篇章'}】中的故事。
${ANTI_AI_STYLE_RULES}

请结合鲜活的韩国社会细节（如打歌舞台安可、Melon音源榜、首尔大学冠岳校区、清潭洞私享沙龙、汉南洞家宴等）展开具象叙事。
必须严格返回纯 JSON 对象：
{
  "title": "篇章剧情标题",
  "story": "120-200字细腻写实的剧情细节描写",
  "headline": "韩网新闻头条",
  "netizenReactions": ["韩网热评1", "论坛热帖2", "圈内评价3"],
  "statSummary": "属性变动简报"
}
${ANTI_AI_STYLE_RULES}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: 0.85,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `行动：【${actionTitle}】\n背景现状：${contextInfo}` },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        return parseAndCleanAIJson<LifePathStoryResult>(data.content);
      }
    } catch (_e) {}
  }

  const res = await fetch('/api/ai/lifepath-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pathType,
      actionTitle,
      contextInfo,
      protagonistName,
      systemPromptOverride: systemPrompt,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '生成人生剧情失败');
  }
  return sanitizeAntiAIResponse(data);
}
