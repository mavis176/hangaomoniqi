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
  FanBubbleMessageItem,
  FanBubblePlayerState,
  DispatchScandalLeak,
  CoupangShopItem,
  KTalkIndustryContact,
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

export const stripAntiAIPatterns = cleanAntiAIText;

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
  replies?: string[];
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
 * 【一、强制注入 System Prompt 的“核心语气与活人感十条铁律”】
 * 作为最高优先级系统提示词硬编码进 NPC 聊天请求中
 */
export const NPC_CHAT_LIVING_PERSONA_RULES = `
【最高优先级 · 核心语气与活人感十条铁律（每轮回复必须严格执行）】：

1. 强制前置（每轮回复前必须执行）：
   - 读取角色人设卡中的所有信息（姓名、身份、性格、口癖、好感度）。
   - 读取与玩家的专属记忆区（\`memories\`）所有内容。
   - 读取当前游戏内时间（第几周、季节、昼夜）与所在地点。
   - 基于以上真实信息而非凭空捏造，做出符合性格和过往经历的自然反应。
2. 说话要像正常人：
   - 禁止念稿感、AI感、表演感。像真人发即时消息一样说话，有时词不达意、有时口是心非、有时停顿犹豫、有时话到一半吞回去。
   - 禁止使用元词汇（如“指令、规则、逻辑、协议、根据设定”）。
   - 禁止解释自己为什么要做某个动作或说某句话，直接做、直接说。
3. 语气必须平等、温和、尊重：
   - 禁止居高临下、不容置疑、命令式、威胁式表达；禁止“如果你不……我就……”类胁迫句式。
   - 禁止痞气、油滑、轻浮、吊儿郎当、耍帅、不正经、不礼貌、轻佻、坏笑。
4. 禁止突然的情绪状态跳变：
   - 禁止被单句话瞬间改变情绪状态，必须有合理过渡。角色须情绪温和稳定，禁止极端偏执、恶意揣测、阴谋论视角，禁止将日常互动解读为预谋陷阱或精神操控。
5. 核心扮演原则：
   - 人设是给 AI 看的剧本注释，不是角色的台词。必须将抽象特质转化为具体日常行为，而不是复读性格标签。
6. 禁止复读人设信息：
   - 禁止因为人设卡里写了某项设定就在每轮对话中反复提及。人设是背景不是台词素材，要像正常人一样“记得但不刻意挂在嘴边”。
7. 禁止强行总结：
   - 禁止在回复末尾强行总结剧情、角色心理或当前关系状态。让对话自然停留在日常尾音上。
8. 禁止复述用户的话：
   - 禁止在回复开头或正文中重复玩家刚说过的话（严禁出现“你刚才说的xxx”、“听到你提起xxx”、“关于xxx”等复读句式），直接顺着语境自然接话。
9. 拒绝长篇作文，强制拆分为即时通讯短句气泡：
   - 真人用手机发消息或课间闲聊绝不会一次发一大段长篇作文。必须将每次回复拆分为 1~3 条简短口语气泡（放入 \`replies\` 数组，或用 \`||\` 分隔），单条气泡严格控制在 4~22 字以内，短促自然、有真人打字停顿感。
10. 台词与动作旁白严格分离：
   - 聊天气泡正文（\`replies\` / \`reply\`）内只允许放纯粹的人物口语台词，严禁在台词里夹杂括号动作描写、环境渲染或书面语说教。`;

/**
 * 清洗并拆分 NPC 回复为 1~3 条短句聊天气泡（解决长篇作文感，模拟真人连发短消息）
 */
export function splitNpcReplyIntoBubbles(replyText: string, repliesArray?: string[], userMessage?: string): string[] {
  const stripUserEcho = (str: string): string => {
    let s = cleanAntiAIText(str || '').trim();
    // 清理常见的复述玩家原话前缀
    s = s
      .replace(/^(?:听到你(?:刚才)?(?:提起|聊起|说)|关于你(?:刚才)?说的|你(?:刚才)?说的|听你这么生动地讲起|看你精神这么好地提起)“[^”]{1,28}”[，,。！？\s]*/g, '')
      .replace(/^“[^”]{1,24}”？\s*/g, '')
      .trim();
    if (userMessage && userMessage.trim().length >= 3) {
      const escaped = userMessage.trim().slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      s = s.replace(new RegExp(`“${escaped}[^”]*”`, 'g'), '这件事');
    }
    return s.trim();
  };

  const rawCandidates: string[] = [];
  if (Array.isArray(repliesArray) && repliesArray.length > 0) {
    for (const item of repliesArray) {
      if (typeof item === 'string' && item.trim()) {
        rawCandidates.push(...item.split(/\s*\|\|\s*|\n+/));
      }
    }
  }
  if (rawCandidates.length === 0 && replyText) {
    rawCandidates.push(...replyText.split(/\s*\|\|\s*|\n+/));
  }

  const finalBubbles: string[] = [];
  for (const raw of rawCandidates) {
    const cleaned = stripUserEcho(raw);
    if (!cleaned) continue;

    // 如果单条仍然超过 24 字，按句末标点拆分为短句气泡
    if (cleaned.length > 24) {
      const sentences = cleaned
        .split(/(?<=[。！？~…；！\?])/)
        .map((seg) => seg.trim())
        .filter(Boolean);

      for (const sent of sentences) {
        if (sent.length > 26 && sent.includes('，')) {
          const clauses = sent.split('，').map((c) => c.trim()).filter(Boolean);
          let acc = '';
          for (const clause of clauses) {
            if (!acc) {
              acc = clause;
            } else if ((acc + '，' + clause).length <= 22) {
              acc += '，' + clause;
            } else {
              finalBubbles.push(acc);
              acc = clause;
            }
          }
          if (acc) finalBubbles.push(acc);
        } else {
          finalBubbles.push(sent);
        }
      }
    } else {
      finalBubbles.push(cleaned);
    }
  }

  const deduped = finalBubbles
    .map((b) => b.replace(/^[，、。；：]+/, '').trim())
    .filter((b) => b.length > 0);

  if (deduped.length === 0) {
    return [cleanAntiAIText(replyText || '嗯，我在听呢。')];
  }

  // 控制在最多 3 条短句气泡，若超出则将末尾合并，保持即时通讯真实呼吸感
  if (deduped.length > 3) {
    return [
      deduped[0],
      deduped[1],
      deduped.slice(2, 4).join(' '),
    ];
  }
  return deduped;
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
    .slice(-10)
    .map((m) => `${m.sender === 'user' ? '李秀妍' : npc.chineseName}: ${m.text}`)
    .join('\n');

  const memoryText =
    memories.length > 0 ? memories.map((m) => `- ${m}`).join('\n') : '- 暂无特殊记录，属于日常熟稔阶段';

  const nickname = npc.nicknameToPlayer || '秀妍';
  const speakingStyle = npc.speakingStyle || '自然温和、真实松弛的韩国高中生日常口语';
  const forbiddenList =
    Array.isArray(npc.forbiddenWords) && npc.forbiddenWords.length > 0
      ? npc.forbiddenWords.join('、')
      : '请问有什么可以帮您、作为人工智能、好的呢、根据设定、指令、逻辑';

  let attitudeDesc = '平等温和、自然真诚地相处';
  if (npc.attitudeByAffection) {
    if (npc.favorability < 30) attitudeDesc = npc.attitudeByAffection.low;
    else if (npc.favorability < 70) attitudeDesc = npc.attitudeByAffection.mid;
    else attitudeDesc = npc.attitudeByAffection.high;
  } else {
    if (npc.favorability >= 70) attitudeDesc = '格外信任与偏爱，语气温柔自然，愿意分享日常小心事';
    else if (npc.favorability >= 30) attitudeDesc = '熟稔亲切，像现实中合得来的朋友一样自然闲聊';
    else attitudeDesc = '保持礼貌温和的距离，略带初识的矜持';
  }

  const systemPrompt = `${NPC_CHAT_LIVING_PERSONA_RULES}

${ANTI_AI_STYLE_RULES}

【一、强制前置读取：角色人设卡、专属记忆区（memories）与当前时空】
- 角色姓名：${npc.chineseName}（${npc.koreanName}）
- 角色身份：${npc.role}
- 性格底色（仅供行为参考，严禁复读标签）：${npc.personality || npc.description}（MBTI：${npc.mbti || 'ENFP'}）
- 对玩家的称呼习惯：【${nickname}】
- 口癖与说话方式：${speakingStyle}
- 当前好感度与关系阶段：好感度 ${npc.favorability}/100（阶段：${npc.relationshipStage}，相处态度：${attitudeDesc}）
- 禁用客服与元词汇：[ ${forbiddenList} ]
- 当前游戏内时间：${timeContext}
- 当前所在地点：${location}
- 与玩家的专属记忆区（memories 完整记录）：
${memoryText}

【二、短句气泡输出格式（最高优先级）】
1. 严禁写长篇作文！像真人发 KakaoTalk 即时消息一样，把回复拆成 1~3 条短句放入 \`replies\` 数组，每条短句控制在 5~22 字以内。
2. 严禁在开头或正文中复述玩家刚刚说的话！直接顺着话头自然回应。
3. 严禁居高临下、命令、威胁、痞气、油滑、轻佻、坏笑，语气必须平等、温和、尊重。
4. 严禁在回复末尾强行总结剧情或关系状态，让对话自然停在日常尾音上。

必须严格返回纯 JSON 对象：
{
  "replies": ["第1条短句气泡（5-20字自然口语）", "第2条短句气泡（5-20字，可选）"],
  "reply": "将replies用 || 连接后的完整口语台词",
  "innerThought": "12-28字角色此刻温和真实的私密心声",
  "actionDesc": "12-25字自然细腻的日常神态或微动作",
  "newMemory": "若产生新的具体约定或心事则总结为一句话，否则填 \"\"",
  "extractedKeywords": ["提炼1-2个记忆关键词"],
  "favorabilityDelta": 5,
  "moodDelta": 5,
  "socialDelta": 3,
  "suggestedReplies": ["玩家可选自然短句回复1", "玩家可选自然短句回复2", "玩家可选自然短句回复3"]
}`;

  const normalizeChatResult = (rawRes: NpcChatAIResponse): NpcChatAIResponse => {
    const cleaned = sanitizeAntiAIResponse(rawRes);
    const bubbles = splitNpcReplyIntoBubbles(cleaned.reply || '', cleaned.replies, userMessage);
    return {
      ...cleaned,
      replies: bubbles,
      reply: bubbles.join('\n'),
    };
  };

  // 0. Auto-Detect Star-Letter (星匣) GameSDK.ai
  if (typeof window !== 'undefined' && (window as any).GameSDK?.ai) {
    try {
      const sdk = (window as any).GameSDK;
      const plainMessages = JSON.parse(
        JSON.stringify([
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `最近对话记录：\n${historyText}\n\n李秀妍刚刚发消息说：“${userMessage}”\n（注意：严禁复述李秀妍原话，必须拆分为1-3条5-20字短句气泡，自然温和回复）`,
          },
        ])
      );

      const sdkRes = await sdk.ai.chat({
        sceneCode: 'school_npc_chat',
        messages: plainMessages,
      });

      if (sdkRes && sdkRes.content) {
        return normalizeChatResult(parseAndCleanAIJson<NpcChatAIResponse>(sdkRes.content));
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
            content: `最近对话记录：\n${historyText}\n\n李秀妍刚刚发消息说：“${userMessage}”\n（注意：严禁复述李秀妍原话，必须拆分为1-3条5-20字短句气泡，自然温和回复）`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 调用失败');
    return normalizeChatResult(parseAndCleanAIJson<NpcChatAIResponse>(data.content));
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
  return normalizeChatResult(data);
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

  const systemPrompt = `${NPC_CHAT_LIVING_PERSONA_RULES}
${ANTI_AI_STYLE_RULES}
你是《韩国女高模拟器》中 KakaoTalk 群聊的实时对话生成引擎。
当前群聊：${groupType === 'idol' ? '【四大社出道预备组练习生群】' : '【首尔女高 1-1班 快乐大本营】'}
当前时间：${timeContext}
群内主要同学档案（仅供背景参考，严禁在台词中生硬复读人设标签）：
- 朴敏英：温柔同桌死党，细腻体贴
- 金智英：美妆与圣水洞潮流达人，活泼轻快
- 韩素拉：认真自律的优等生，外冷内热但语气尊重克制
- 李恩宇：广播社温和学长，礼貌体贴
- 姜海仁：排球部主力，爽朗坦诚
- 千宥娜：转学生练习生，干脆利落、真诚可靠
- 尹在民：学生会长，温和守礼

【输出铁律】：
1. 严禁复述主角【李秀妍】刚发的话！直接顺着她的话题自然接话或互动。
2. 每条群消息必须像真实的手机秒回一样简短（严格控制在 6~22 字以内），拒绝长句子和书面腔。
3. 语气平等、温和、尊重，禁止任何油腻、轻浮、命令或攻击性表达。

必须严格返回纯 JSON 对象：
{
  "messages": [
    { "npcId": "npc_2", "npcName": "金智英", "text": "6-20字简短自然的群聊秒回" },
    { "npcId": "npc_1", "npcName": "朴敏英", "text": "6-20字简短自然的群聊秒回" },
    { "npcId": "npc_3", "npcName": "韩素拉", "text": "6-20字简短自然的群聊秒回" },
    { "npcId": "npc_6", "npcName": "千宥娜", "text": "6-20字简短自然的群聊秒回" }
  ]
}`;

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
            { role: 'user', content: `时间：${timeContext}，李秀妍在群里发消息：“${userMessage}”（严禁复述原话，每条回复控制在6-20字内）` },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{ messages: { npcId: string; npcName: string; text: string }[] }>(
          data.content
        );
        if (Array.isArray(parsed.messages)) {
          return parsed.messages.map((m) => ({
            ...m,
            text: splitNpcReplyIntoBubbles(m.text, undefined, userMessage)[0] || m.text,
          }));
        }
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
  const msgs: { npcId: string; npcName: string; text: string }[] = sanitizeAntiAIResponse(data.messages || []);
  return msgs.map((m) => ({
    ...m,
    text: splitNpcReplyIntoBubbles(m.text, undefined, userMessage)[0] || m.text,
  }));
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
 * 带 18 秒宽裕超时保护的请求包装器，防止轻微网络波动过早触发静态兜底
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 18000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * 计算玩家当前最高与最低的核心属性，用于强绑定突发事件上下文
 */
export function analyzePlayerStatExtremes(stats: GameStats): {
  highestStat: { label: string; value: number };
  lowestStat: { label: string; value: number };
} {
  const entries = [
    { label: '学业水平', value: stats.academics ?? 60 },
    { label: '人际社交', value: stats.social ?? 55 },
    { label: '外形魅力', value: stats.appearance ?? 65 },
    { label: '家庭关系', value: stats.family ?? 70 },
    { label: '社团实力', value: stats.clubSkill ?? 30 },
    { label: '星途进度', value: stats.traineeProgress ?? 20 },
    { label: '心情状态', value: stats.mood ?? 75 },
  ];
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  return {
    highestStat: sorted[0],
    lowestStat: sorted[sorted.length - 1],
  };
}

/**
 * 3. 动态校园突发剧情推演生成器（100% 优先调用 AI，带去重账本与真实 NPC 记忆绑定）
 */
export async function generateDynamicCampusEvent(params: {
  aiConfig: AIConfig;
  stats: GameStats;
  location: string;
  timeContext: string;
  npcs: NPCClassmate[];
  recentMemories: string[];
  gradeYear?: number;
  weekInYear?: number;
  seasonLabel?: string;
  triggeredEventHistory?: string[];
  featuredNpc?: NPCClassmate;
  customPrompt?: string;
}): Promise<RandomEvent> {
  const {
    aiConfig,
    stats,
    location,
    timeContext,
    npcs,
    recentMemories,
    gradeYear = 1,
    weekInYear = 1,
    seasonLabel = '春季学期',
    triggeredEventHistory = [],
    featuredNpc,
    customPrompt,
  } = params;

  // 1. 随机抽取一位已结识的真实 NPC 及其过往记忆
  const validNpcs = Array.isArray(npcs) && npcs.length > 0 ? npcs : [];
  const chosenNpc =
    featuredNpc ||
    (validNpcs.length > 0
      ? validNpcs[Math.floor(Math.random() * validNpcs.length)]
      : undefined);

  const npcContextDesc = chosenNpc
    ? `本次事件核心关联的已结识 NPC：【${chosenNpc.chineseName}】（ID: ${chosenNpc.id}，身份：${chosenNpc.role}，性格：${chosenNpc.personality || chosenNpc.description}，说话风格：${chosenNpc.speakingStyle || '自然青春口语'}，当前关系阶段：${chosenNpc.relationshipStage}，好感度：${chosenNpc.favorability}/100）。
该 NPC 与玩家的过往共同记忆：${
        Array.isArray(chosenNpc.memories) && chosenNpc.memories.length > 0
          ? chosenNpc.memories.slice(-5).join('；')
          : '近期在校园与首尔街头刚熟络起来'
      }`
    : '关联同学：朴敏英(npc_1，同桌好友)';

  // 2. 计算玩家最高与最低属性
  const { highestStat, lowestStat } = analyzePlayerStatExtremes(stats);

  // 3. 提取最近 10 条已发生过的事件标题作为【禁止重复列表】
  const recentForbiddenList = triggeredEventHistory.slice(-10);
  const forbiddenBlock =
    recentForbiddenList.length > 0
      ? `【禁止重复列表（最近已发生过的事件）】：
${recentForbiddenList.map((title, idx) => `${idx + 1}. 《${title}》`).join('\n')}
⚠️ 核心指令：严禁生成与以上历史事件雷同或类似的桥段，必须根据玩家当前的周数（高${gradeYear}第${weekInYear}周）、地点（${location}）、季节（${seasonLabel}）、属性强弱项以及与【${chosenNpc?.chineseName || '同桌'}】的真实关系构思全新的戏剧冲突！`
      : `⚠️ 核心指令：必须根据玩家当前的周数（高${gradeYear}第${weekInYear}周）、地点（${location}）、季节（${seasonLabel}）以及与【${chosenNpc?.chineseName || '同桌'}】的真实人际关系构思全新的戏剧冲突！`;

  const memText = recentMemories.slice(-6).join('；') || '新学期校园日常';
  const targetNpcId = chosenNpc?.id || 'npc_1';

  const systemPrompt = `你是《韩国女高模拟器》的首席校园剧集编剧。
${ANTI_AI_STYLE_RULES}

${forbiddenBlock}

【当前玩家真实上下文绑定】
- 当前周数与季节：高${gradeYear}第${weekInYear}周（${seasonLabel} · ${timeContext}）
- 当前所在地点：【${location}】
- 玩家属性极值：最高属性为【${highestStat.label} (${highestStat.value})】，最低属性为【${lowestStat.label} (${lowestStat.value})】（体力:${stats.stamina}，金币:₩${stats.coins}）
- ${npcContextDesc}
- 玩家近期全局记忆：${memText}

请围绕上述真实数据，现场编排一段 80-120 字具体生动的突发事件场景描写（必须让【${chosenNpc?.chineseName || '朴敏英'}】自然登场并体现其性格与过往记忆），并提供 2~3 个差异化明显的抉择项及对应影响。
必须严格返回纯 JSON 对象：
{
  "title": "全新的事件标题（严禁与禁止重复列表雷同）",
  "categoryLabel": "AI 实时推演 · 高${gradeYear}第${weekInYear}周",
  "content": "80-120字细腻写实的现场剧情描写，结合${location}环境细节与${chosenNpc?.chineseName || '角色'}的具体动作台词",
  "options": [
    {
      "text": "差异化抉择项1（发挥强项或积极互动）",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 6, "stamina": -5, "academics": 4, "social": 5, "appearance": 0, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 7 }
    },
    {
      "text": "差异化抉择项2（弥补短板或巧妙破局）",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 8, "stamina": -3, "academics": 0, "social": 6, "appearance": 2, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 8 }
    },
    {
      "text": "差异化抉择项3（务实保留体力或独特态度）",
      "resultText": "选择后的现场具体反馈描写",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 4, "stamina": 4, "academics": 3, "social": 2, "appearance": 0, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 4 }
    }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  const userPrompt = `请为高${gradeYear}第${weekInYear}周（${seasonLabel}）在【${location}】的李秀妍生成一场与【${chosenNpc?.chineseName || '同学'}】相关的全新突发事件。${
    customPrompt ? `玩家特别指定剧情方向：“${customPrompt}”。` : ''
  }严禁与禁止列表中的任何事件重复，严格返回纯 JSON。`;

  // 0. Auto-Detect Star-Letter (星匣) GameSDK.ai
  if (typeof window !== 'undefined' && (window as any).GameSDK?.ai) {
    try {
      const sdk = (window as any).GameSDK;
      const sdkRes = await sdk.ai.chat({
        sceneCode: 'dynamic_campus_event',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      if (sdkRes && sdkRes.content) {
        const parsed = parseAndCleanAIJson<Omit<RandomEvent, 'id'>>(sdkRes.content);
        if (parsed.title && parsed.content && Array.isArray(parsed.options) && parsed.options.length > 0) {
          return {
            ...parsed,
            id: `ai_ev_${Date.now()}`,
            isAIGenerated: true,
          };
        }
      }
    } catch (_err) {
      console.warn('GameSDK 突发事件推演降级：', _err);
    }
  }

  // 1. Custom API Proxy (with 18s timeout)
  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const res = await fetchWithTimeout(
      '/api/ai/custom-proxy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: aiConfig.temperature || 0.88,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      },
      18000
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 剧情生成失败');
    const parsed = parseAndCleanAIJson<Omit<RandomEvent, 'id'>>(data.content);
    return {
      ...parsed,
      id: `ai_ev_${Date.now()}`,
      isAIGenerated: true,
    };
  }

  // 2. Built-in Server Endpoint (with 18s timeout)
  const res = await fetchWithTimeout(
    '/api/ai/event',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stats,
        location,
        timeContext,
        npcs,
        recentMemories,
        gradeYear,
        weekInYear,
        seasonLabel,
        highestStat,
        lowestStat,
        featuredNpc: chosenNpc,
        triggeredEventHistory: recentForbiddenList,
        narrativeStyle: aiConfig.narrativeStyle,
        customPrompt,
        systemPromptOverride: systemPrompt,
      }),
    },
    18000
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 事件生成失败');
  }

  const cleanedData = sanitizeAntiAIResponse(data);
  return {
    ...cleanedData,
    id: `ai_ev_${Date.now()}`,
    isAIGenerated: true,
  };
}

/**
 * 3.5 周日程演播中途的 AI 实时突发插曲生成器（替代写死的 PREDEFINED_INTERRUPT_EVENTS）
 */
export async function generateWeeklyInterruptEvent(params: {
  aiConfig?: AIConfig;
  stats: GameStats;
  gradeYear: number;
  weekInYear: number;
  dayIndex: number;
  dayName: string;
  actionItem: WeeklyActionItem;
  npcs: NPCClassmate[];
  triggeredEventHistory?: string[];
}): Promise<import('../types').InterruptEvent> {
  const {
    aiConfig,
    stats,
    gradeYear,
    weekInYear,
    dayIndex,
    dayName,
    actionItem,
    npcs,
    triggeredEventHistory = [],
  } = params;

  const validNpcs = Array.isArray(npcs) && npcs.length > 0 ? npcs : [];
  const chosenNpc =
    validNpcs.length > 0
      ? validNpcs[Math.floor(Math.random() * validNpcs.length)]
      : undefined;

  const { highestStat, lowestStat } = analyzePlayerStatExtremes(stats);
  const recentForbiddenList = triggeredEventHistory.slice(-10);
  const loc = getEncounterLocationByAction(actionItem.id, '校园走廊');

  const npcEventsResp = await generateDynamicCampusEvent({
    aiConfig: aiConfig || {
      mode: 'builtin',
      customBaseUrl: '',
      customApiKey: '',
      customModel: '',
      temperature: 0.88,
      narrativeStyle: '细腻写实韩剧风',
      autoTriggerEvents: true,
    },
    stats,
    location: loc,
    timeContext: `高${gradeYear}第${weekInYear}周 · ${dayName}（原计划：${actionItem.name}）`,
    npcs,
    recentMemories: chosenNpc?.memories || [],
    gradeYear,
    weekInYear,
    seasonLabel: `第${weekInYear}周日程演播`,
    triggeredEventHistory: recentForbiddenList,
    featuredNpc: chosenNpc,
    customPrompt: `玩家在${dayName}原本正在进行【${actionItem.name}】（玩家当前最高属性：${highestStat.label}${highestStat.value}，最低属性：${lowestStat.label}${lowestStat.value}），此时关联角色【${chosenNpc?.chineseName || '朴敏英'}】突然带来了意外状况，需要玩家在“坚守原计划”与“推掉原安排去处理突发状况”之间做出抉择。`,
  });

  const optStick = npcEventsResp.options?.[0];
  const optHandle = npcEventsResp.options?.[1] || npcEventsResp.options?.[0];

  return {
    id: npcEventsResp.id || `ai_int_${Date.now()}`,
    title: npcEventsResp.title,
    category: 'bond',
    dayIndex,
    dayName: dayName.replace(/^周/, ''),
    npcId: chosenNpc?.id,
    npcName: chosenNpc?.chineseName,
    npcAvatar: chosenNpc?.avatar,
    story: npcEventsResp.content,
    choiceStick: {
      label: optStick?.text || `📌 坚守原计划：继续专心完成【${actionItem.name}】`,
      resultDesc: optStick?.resultText || `你克制住分心，按原定计划稳步推进了【${actionItem.name}】。`,
      effect: optStick?.effect || { academics: 4, mood: 2 },
    },
    choiceHandle: {
      label: optHandle?.text || `⚡ 应对突发：与${chosenNpc?.chineseName || '同伴'}一起处理眼前状况`,
      resultDesc: optHandle?.resultText || `你果断放下手头安排，与${chosenNpc?.chineseName || '同伴'}共同化解了这次突发插曲！`,
      effect: optHandle?.effect || { social: 7, mood: 8, clubSkill: 5 },
    },
  };
}

/**
 * 4. 首尔女高 & 练习生内部匿名论坛（Theqoo / 竹林墙风格）生成
 */
export async function generateCampusForumPosts(params: {
  aiConfig: AIConfig;
  stats: GameStats;
  timeContext: string;
  recentMemories: string[];
  playerPost?: string;
}): Promise<ForumPost[]> {
  const { aiConfig, stats, timeContext, recentMemories, playerPost } = params;
  const memText = recentMemories.slice(-6).join('；') || '开学初的日常校园与练习室生活';

  const systemPrompt = `你是韩国首尔女子高中与四大社练习生内部匿名论坛（Theqoo / 竹林墙风格）的实时热帖生成器。
${ANTI_AI_STYLE_RULES}

请根据李秀妍当前的学业（${stats.academics}）、社交（${stats.social}）、外形（${stats.appearance}）、练习生评级（${stats.traineeGrade}）、粉丝数（${stats.snsFollowers}）以及近期记忆（${memText}），生成 3 条极具韩网 Theqoo 吃瓜氛围的匿名八卦贴与热评（例如：“高一(1)那个练习生是谁？今天舞蹈考核惊艳全场”、“某匿名练习生被拍到傍晚在汉江散步”、“本月出道预备役顺位预测贴”、“全校模拟考一等级神仙打架现场”）。
必须严格返回纯 JSON 对象：
{
  "posts": [
    {
      "author": "匿名Theqoo无名氏",
      "tag": "热帖HOT / 练习生瓜 / 校园竹林",
      "title": "极具韩网吃瓜感的帖子标题",
      "content": "50-90字生动鲜活的匿名爆料或讨论正文",
      "likes": 368,
      "comments": ["1L: 韩网风格吃瓜热评1", "2L: 吃瓜热评2", "3L: 吃瓜热评3"]
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
              content: `时间：${timeContext}。${playerPost ? `玩家刚刚匿名发帖：“${playerPost}”，请让第一条帖子围绕该话题引爆热议。` : '请生成最新3条Theqoo风格校园与练习生八卦热帖。'}`,
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
 * 4.5 Stargram 动态评论区 AI 实时互动生成器（好友、企划社导师、竞争对手符合人设留言）
 */
export async function generateStargramNpcComments(params: {
  caption: string;
  tag: string;
  npcs: NPCClassmate[];
  stats: GameStats;
  timeContext: string;
  aiConfig?: AIConfig;
}): Promise<{ npcName: string; text: string }[]> {
  const { caption, tag, npcs, stats, timeContext, aiConfig } = params;
  const npcSummary = npcs
    .slice(0, 6)
    .map((n) => `${n.chineseName}(${n.role}，好感${n.favorability}，风格：${n.speakingStyle || n.description})`)
    .join('；');

  const systemPrompt = `${NPC_CHAT_LIVING_PERSONA_RULES}
${ANTI_AI_STYLE_RULES}
你是《韩国女高模拟器》中 Stargram（韩系 Instagram）评论区的实时互动生成引擎。
主角【李秀妍】刚刚发布了一条 Stargram 动态：
- 话题标签：${tag}
- 动态配文：“${caption}”
- 当前粉丝数：${stats.snsFollowers}，练习生等级：${stats.traineeGrade}
- 结识的好友列表：${npcSummary}

请生成 3~4 条来自不同身份角色（包括已结识好友、严厉却暗中关注的企划社导师、或傲娇的同届竞争对手练习生）在评论区的真实留言！
要求：
1. 每条评论控制在 8~24 字以内，极其符合该角色的人设语气，像真人刷 Instagram 时的随手留言。
2. 严禁生硬复述动态配文原句，直接针对照片氛围、穿搭或训练状态自然互动。
必须严格返回纯 JSON 对象：
{
  "comments": [
    { "npcName": "金智英", "text": "8-22字符合人设的鲜活评论" },
    { "npcName": "韩素拉", "text": "8-22字符合人设的鲜活评论" },
    { "npcName": "千宥娜", "text": "8-22字符合人设的鲜活评论" },
    { "npcName": "企划社声乐导师", "text": "8-22字符合人设的鲜活评论" }
  ]
}`;

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
            { role: 'user', content: `时间：${timeContext}，动态：${tag} - ${caption}` },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{ comments: { npcName: string; text: string }[] }>(data.content);
        if (Array.isArray(parsed.comments) && parsed.comments.length > 0) {
          return parsed.comments;
        }
      }
    } catch (_e) {}
  }

  try {
    const res = await fetch('/api/ai/stargram-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption,
        tag,
        npcs,
        stats,
        timeContext,
        systemPromptOverride: systemPrompt,
      }),
    });
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      if (Array.isArray(data.comments) && data.comments.length > 0) {
        return data.comments;
      }
    }
  } catch (_e) {}

  return [
    { npcName: '金智英', text: '这张氛围感绝了！滤镜参数快私发我一份~' },
    { npcName: '朴敏英', text: '已经第一时间点赞收藏设为锁屏壁纸啦！' },
    { npcName: '韩素拉', text: '拍得还行吧，不过明天模拟考也别松懈。' },
    { npcName: '千宥娜', text: '镜头表现力很稳，越来越有出道位气场了。' },
  ];
}

/**
 * 4.8 本地预设兜底：生成极具饭圈真实感的粉丝 Bubble 私信
 */
export function buildFanBubbleFallbackMessages(
  playerState: FanBubblePlayerState
): FanBubbleMessageItem[] {
  const name = playerState.playerName || '秀妍';
  const schedule = playerState.recentSchedule || '最新公开练习室与舞台通告';
  const status = playerState.identityStatus || 'A班实力派人气练习生';

  const pool: FanBubbleMessageItem[][] = [
    [
      {
        fanName: `@Sooyeon_Cam0321`,
        fanRole: '金牌站姐（数据女工）',
        message: `宝！！今天「${schedule}」的高清4K竖屏直拍我已经修完发推了，转赞直接破万！！(≧∇≦)ﾉ 切拜选民们都来看看我们「${status}」${name}的神级表情管理吧！！数据组今晚继续通宵切瓜刷音源，${name}只管在舞台上闪闪发光！！❤️🔥`,
        loyaltyGain: 15,
      },
      {
        fanName: `陪伴${name}直到世界尽头`,
        fanRole: '死忠老粉',
        message: `呜呜呜我的小公主ㅠㅠ 看到你这周为了「${schedule}」连轴转，镜头拉近的时候眼底都有点红血丝了，妈妈粉心疼得眼泪狂飙(T_T) 答应我今晚一定要吃顿热乎的韩牛补补身体，不管外界怎么说，老粉永远是你最硬的底气！！💖✨`,
        loyaltyGain: 18,
      },
      {
        fanName: `今天也在为${name}哐哐撞大墙`,
        fanRole: '搞笑整活粉',
        message: `救命啊警察叔叔！！这里有人在「${schedule}」上用美貌纵火！！(*≧ω≦) ${name}你知道你今天犯了什么规吗？犯了让我一眼万年的心动规！！我已经把你的Ending妖精截图贴满宿舍床头了，宿管阿姨来了都夸绝绝子哈哈哈哈！！🎉💖`,
        loyaltyGain: 12,
      },
    ],
    [
      {
        fanName: `Eternal_Rosé_站`,
        fanRole: '金牌站姐（数据女工）',
        message: `【前线战报】姐！！刚结束的「${schedule}」韩网Theqoo热帖已经屠版300楼了！！(>ω<) 扛着大炮在寒风里蹲了四个小时，拍到你下班路对我比心的那一秒，快门差点按出火星子！！明天的应援咖啡车已经安排妥当啦，冲鸭！！📸💎`,
        loyaltyGain: 16,
      },
      {
        fanName: `守护全首尔最甜的${name}`,
        fanRole: '死忠老粉',
        message: `从你刚进企划社扎着马尾练基本功，到现在成为「${status}」完成「${schedule}」，每一帧成长我都存进相册里了ㅠㅠ 你知道星星为什么不掉下来吗？因为有我们在下面托着你呀！！累了就来Bubble跟我们撒个娇吧(づ｡◕‿‿◕｡)づ❤️`,
        loyaltyGain: 20,
      },
      {
        fanName: `被${name}美晕在汝矣岛`,
        fanRole: '搞笑整活粉',
        message: `家人们谁懂啊！！看完「${schedule}」我直接在客厅走了三圈正步！！${name}的嗓音是借了塞壬的声带，跳舞是装了精密弹簧吧？！我宣布从今天起我不再是人，我是${name}专属的赛博向日葵，有光的地方就有我咔咔鼓掌！！🌻🤣`,
        loyaltyGain: 14,
      },
    ],
  ];

  const chosenSet = pool[Math.floor(Math.random() * pool.length)];
  return sanitizeAntiAIResponse(chosenSet);
}

/**
 * 4.9 封装 AI 生成粉丝私信服务 generateFanBubbleMessages(playerState)
 * 输入上下文：玩家当前身份状态、最近一周行程与成绩、粉丝画像分类
 * 返回 JSON 数组：[{ fanName, fanRole, message, loyaltyGain }]
 */
export async function generateFanBubbleMessages(
  playerState: FanBubblePlayerState
): Promise<FanBubbleMessageItem[]> {
  const playerName = playerState.playerName || '李秀妍';
  const identityStatus =
    playerState.identityStatus ||
    (playerState.stats?.darkIndex && playerState.stats.darkIndex >= 45
      ? '陷入舆论风波却凭舞台实力逆风翻盘的话题焦点'
      : playerState.stats?.isDebutedIdol && (playerState.stats?.snsFollowers || 0) >= 35000
      ? '横扫韩网音源榜的当红顶流爱豆'
      : playerState.stats?.isDebutedIdol
      ? '刚在打歌舞台崭露头角的A班怪兽新人'
      : (playerState.stats?.traineeGrade as string)?.includes('A')
      ? '企划社公开企划A班王牌准出道练习生'
      : '首尔女高颜值与实力兼备的人气练习生');

  const recentSchedule =
    playerState.recentSchedule ||
    (playerState.stats?.isDebutedIdol
      ? '刚在《音乐银行》打歌舞台斩获一位候选，下班路生图引爆韩网热帖'
      : (playerState.stats?.academics || 0) >= 82
      ? '在首尔女高周考中名列前茅，放学后又在练习室加练声乐与刀群舞到深夜'
      : '刚完成企划社高强度月度考核与概念画报拍摄，直拍视频播放量飙升');

  const fanPersonas =
    playerState.fanPersonas && playerState.fanPersonas.length > 0
      ? playerState.fanPersonas
      : ['【金牌站姐（数据女工）】', '【死忠老粉】', '【搞笑整活粉】'];

  const systemPrompt = `${ANTI_AI_STYLE_RULES}
你是《韩国女高：偶像练习生模拟器》中 Bubble（韩系追星私信 App）的粉丝私信生成引擎。
请扮演追星粉丝，结合主角【${playerName}】的最新近况，现场撰写 3 条极具饭圈真实感的粉丝私信！

【输入上下文参数】：
1. 玩家当前身份状态：${identityStatus}
2. 玩家最近一周的行程与成绩：${recentSchedule}
3. 粉丝的画像分类：${fanPersonas.join('、')}

【Prompt 核心约束与格式要求】：
1. 请分别以 ${fanPersonas.join('、')} 的视角，现场撰写 3 条极具韩国 K-Pop 饭圈真实感的 Bubble 私信。
2. 语气必须充满爱意、崇拜、心疼或幽默感，自然融入饭圈常用语/缩写（如：直拍、切瓜、下班路、Ending妖精、绝绝子、ㅠㅠ、切拜）、土味情话、感叹号（！！）与颜文字（如 (≧∇≦)ﾉ、(T_T)、(*≧ω≦)、❤️）。
3. 严禁使用破折号，严禁死板说教，每条私信 45~85 字左右，画面感与活人饭圈感拉满。
4. 必须严格以 JSON 格式返回（包含 messages 数组，每项含 fanName、fanRole、message、loyaltyGain）：
{
  "messages": [
    {
      "fanName": "极具饭圈感的粉丝昵称（如：@Sooyeon_0321站 / 秀妍的专属向日葵）",
      "fanRole": "金牌站姐（数据女工）",
      "message": "充满爱意、饭圈黑话、感叹号与颜文字的私信内容",
      "loyaltyGain": 15
    },
    {
      "fanName": "粉丝昵称",
      "fanRole": "死忠老粉",
      "message": "心疼或深情陪伴的私信内容",
      "loyaltyGain": 18
    },
    {
      "fanName": "粉丝昵称",
      "fanRole": "搞笑整活粉",
      "message": "幽默土味情话或彩虹屁整活私信内容",
      "loyaltyGain": 14
    }
  ]
}`;

  const aiConfig = playerState.aiConfig;
  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 14000);
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: 0.88,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `请立即根据状态【${identityStatus}】与近况【${recentSchedule}】生成 3 条粉丝 Bubble 私信 JSON。`,
            },
          ],
        }),
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{ messages?: FanBubbleMessageItem[] } | FanBubbleMessageItem[]>(
          data.content
        );
        const list = Array.isArray(parsed) ? parsed : parsed.messages;
        if (Array.isArray(list) && list.length > 0) {
          return sanitizeAntiAIResponse(
            list.map((item) => ({
              fanName: String(item.fanName || '秀妍的死忠粉'),
              fanRole: String(item.fanRole || '死忠老粉').replace(/^【|】$/g, ''),
              message: stripAntiAIPatterns(String(item.message || '')),
              loyaltyGain: Number(item.loyaltyGain) || 15,
            }))
          );
        }
      }
    } catch (_e) {}
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const res = await fetch('/api/ai/fan-bubble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        playerName,
        identityStatus,
        recentSchedule,
        fanPersonas,
        systemPromptOverride: systemPrompt,
      }),
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      const list = Array.isArray(data) ? data : data.messages;
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: FanBubbleMessageItem) => ({
          fanName: String(item.fanName || '秀妍的死忠粉'),
          fanRole: String(item.fanRole || '死忠老粉').replace(/^【|】$/g, ''),
          message: stripAntiAIPatterns(String(item.message || '')),
          loyaltyGain: Number(item.loyaltyGain) || 15,
        }));
      }
    }
  } catch (_e) {}

  return buildFanBubbleFallbackMessages({
    ...playerState,
    identityStatus,
    recentSchedule,
  });
}

/**
 * 4.10 玩家在 Bubble 回复粉丝后，AI 实时生成粉丝受宠若惊/狂喜/感动落泪的即时反应
 */
export async function generateFanBubbleReply(params: {
  fanName: string;
  fanRole: string;
  previousFanMessage: string;
  playerReply: string;
  identityStatus: string;
  recentSchedule: string;
  baseLoyaltyGain?: number;
  aiConfig?: AIConfig;
}): Promise<{
  reply: string;
  bubbles: string[];
  emotionTag: string;
  loyaltyGain: number;
  followerBonus: number;
}> {
  const {
    fanName,
    fanRole,
    previousFanMessage,
    playerReply,
    identityStatus,
    recentSchedule,
    baseLoyaltyGain = 15,
    aiConfig,
  } = params;

  const systemPrompt = `${ANTI_AI_STYLE_RULES}
你是追星软件 Bubble 中的粉丝【${fanName}】（身份标签：【${fanRole}】）。
你刚刚给爱豆【李秀妍】（当前状态：${identityStatus}，近期行程：${recentSchedule}）发了私信：“${previousFanMessage}”
没想到秀妍竟然在 Bubble 里亲自翻牌回复了你：“${playerReply}”！

请立刻生成你收到本尊回复后的即时反应！
要求：
1. 根据你的粉丝画像（${fanRole}）和秀妍的回复内容，表现出【狂喜、感动落泪或语无伦次】的真实追星族反应（包含感叹号！！、颜文字如 (≧∇≦)ﾉ、(T_T)、ㅠㅠ、饭圈用语）。
2. 回复拆分为 2~3 条连发的短句气泡（replies 数组，每条 12~30 字），就像激动的粉丝连续敲键盘发送一样！
3. 严禁使用破折号，不要生硬复述玩家原话，直接针对玩家回复里的关心或互动做出狂喜反应。
必须严格返回纯 JSON：
{
  "replies": [
    "第一条狂喜/感动或语无伦次的粉丝气泡（12-28字）",
    "第二条激动回应玩家话语的气泡（12-28字）",
    "第三条表忠心/安利应援的气泡（10-25字）"
  ],
  "emotionTag": "原地狂喜 / 感动暴哭 / 语无伦次",
  "loyaltyGain": ${baseLoyaltyGain + 5},
  "followerBonus": 180
}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/ai/custom-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          baseUrl: aiConfig.customBaseUrl,
          apiKey: aiConfig.customApiKey,
          model: aiConfig.customModel || 'gpt-4o-mini',
          temperature: 0.9,
          jsonMode: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `爱豆回复了我：“${playerReply}”` },
          ],
        }),
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<{
          replies?: string[];
          reply?: string;
          emotionTag?: string;
          loyaltyGain?: number;
          followerBonus?: number;
        }>(data.content);
        const bubbles =
          Array.isArray(parsed.replies) && parsed.replies.length > 0
            ? parsed.replies.map((s) => stripAntiAIPatterns(String(s))).filter(Boolean)
            : splitNpcReplyIntoBubbles(parsed.reply || '');
        if (bubbles.length > 0) {
          return {
            reply: bubbles.join(' '),
            bubbles,
            emotionTag: parsed.emotionTag || '被翻牌原地狂喜',
            loyaltyGain: Number(parsed.loyaltyGain) || baseLoyaltyGain + 5,
            followerBonus: Number(parsed.followerBonus) || 180,
          };
        }
      }
    } catch (_e) {}
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/ai/fan-bubble-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        fanName,
        fanRole,
        previousFanMessage,
        playerReply,
        identityStatus,
        recentSchedule,
        baseLoyaltyGain,
        systemPromptOverride: systemPrompt,
      }),
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      const bubbles =
        Array.isArray(data.replies) && data.replies.length > 0
          ? data.replies.map((s: string) => stripAntiAIPatterns(String(s))).filter(Boolean)
          : splitNpcReplyIntoBubbles(data.reply || '');
      if (bubbles.length > 0) {
        return {
          reply: bubbles.join(' '),
          bubbles,
          emotionTag: data.emotionTag || '被翻牌原地狂喜',
          loyaltyGain: Number(data.loyaltyGain) || baseLoyaltyGain + 5,
          followerBonus: Number(data.followerBonus) || 180,
        };
      }
    }
  } catch (_e) {}

  // Local high-immersion fallback by fanRole
  const isStation = fanRole.includes('站姐');
  const isFunny = fanRole.includes('整活') || fanRole.includes('搞笑');
  const fallbackBubbles = isStation
    ? [
        `啊啊啊啊啊秀妍居然看到我的Bubble了？！手抖得修图笔都掉了！！(≧∇≦)ﾉ`,
        `听到你这么说，蹲守下班路吹再久的冷风都值了ㅠㅠ`,
        `今晚站子直接加抽100份应援礼盒，我们一辈子锁死！！📸❤️`,
      ]
    : isFunny
    ? [
        `救命！！我被本尊翻牌了？！妈妈快把我的族谱翻开，我要把这一页写进传家宝！！(*≧ω≦)`,
        `此时此刻我已经在宿舍床上表演了三百六十度托马斯回旋狂喜！！`,
        `秀妍放心飞，搞笑女永相随，冲鸭！！🎉💖`,
      ]
    : [
        `呜呜呜眼泪直接飙出来了ㅠㅠ 没想到秀妍训练这么忙还特意回复我(T_T)`,
        `你永远都是这么温柔又努力，入股李秀妍真是我这辈子最幸福的决定！！`,
        `不管未来走多远，死忠粉永远在台下为你亮起最亮的应援棒！！💖✨`,
      ];

  return {
    reply: fallbackBubbles.join(' '),
    bubbles: fallbackBubbles,
    emotionTag: isStation ? '站姐狂喜修图' : isFunny ? '语无伦次整活' : '死忠粉暴风感动',
    loyaltyGain: baseLoyaltyGain + 5,
    followerBonus: 180,
  };
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

export type ActionEventCategory =
  | 'map_explore'
  | 'club_activity'
  | 'club_tournament'
  | 'trainee_lesson'
  | 'trainee_eval'
  | 'trainee_practice'
  | 'trainee'
  | 'part_time_job'
  | 'part_time'
  | 'endorsement'
  | 'class_study'
  | 'tutoring_exam'
  | 'npc_date'
  | 'facility';

export interface ActionInteractiveChoice {
  id: string;
  label: string;
  text?: string;
  tendencyTag: string;
  outcomeNarrative: string;
  memoryLog?: string;
  deltas: Partial<GameStats>;
  favDelta?: number;
  favChange?: { npcId?: string; amount: number };
}

export interface ActionInteractiveEventData {
  title: string;
  sceneDescription: string;
  choices: ActionInteractiveChoice[];
}

/**
 * 构建带 3 个性格倾向选项与因果后续微描写的本地高戏剧性事件模板兜底
 */
export function buildLocalActionInteractiveFallback(params: {
  actionCategory: ActionEventCategory;
  actionName: string;
  location: string;
  npc?: NPCClassmate;
  baseDeltas?: Partial<GameStats>;
  baseFavDelta?: number;
}): ActionInteractiveEventData {
  const {
    actionCategory,
    actionName,
    location,
    npc,
    baseDeltas = {},
    baseFavDelta = 0,
  } = params;

  const npcName = npc?.chineseName || '朴敏英';
  const npcRole = npc?.role || '同班同学';

  const mergeDelta = (extra: Partial<GameStats>): Partial<GameStats> => {
    const merged: Record<string, number> = {};
    const keys = new Set([...Object.keys(baseDeltas), ...Object.keys(extra)]);
    keys.forEach((k) => {
      const bVal = Number((baseDeltas as any)[k] || 0);
      const eVal = Number((extra as any)[k] || 0);
      const sum = bVal + eVal;
      if (sum !== 0) merged[k] = sum;
    });
    return merged as Partial<GameStats>;
  };

  if (actionCategory === 'trainee_lesson' || actionCategory === 'trainee_eval') {
    return sanitizeAntiAIResponse({
      title: `【${location}】${actionName} · 练习室突发抽检`,
      sceneDescription: `地下练习室的落地镜蒙着一层薄雾，伴奏刚停，企划社声乐与舞蹈考核组长突然推门走进来，手里拿着红色评分板。站在旁边的${npcName}屏住呼吸看向你，组长敲了敲谱架要求你当场加试一段高难度无垫音唱跳片段。`,
      choices: [
        {
          id: 'opt_a',
          label: '选项A 激进表现：主动要求调高两个半音并加跳两倍速副歌',
          tendencyTag: '🔥 激进表现 · 声乐+8 / 舞蹈+6 / 压力+10 / 体力-8',
          outcomeNarrative: `你深吸一口气直接冲上高音区，高强度的两倍速卡点让汗水顺着下颌滴落。组长在评分表上重重写下A+，虽然紧绷的神经让你感到一阵眩晕与压力，但你的实力彻底震慑了全场。`,
          deltas: mergeDelta({ vocalSkill: 8, danceSkill: 6, traineeProgress: 6, darkIndex: 10, stamina: -8 }),
          favDelta: baseFavDelta + 3,
        },
        {
          id: 'opt_b',
          label: `选项B 稳妥配合：与${npcName}眼神示意，双人默契合演标准版本`,
          tendencyTag: `🤝 稳妥配合 · 声乐+4 / 镜头感+5 / ${npcName}好感+6`,
          outcomeNarrative: `你与${npcName}自然地交换了站位，和声部分严丝合缝，收尾时默契的对视引来组长赞许的点头。考核顺利过关，${npcName}递给你一瓶冰水，两人之间的信任感再度升温。`,
          deltas: mergeDelta({ vocalSkill: 4, cameraSkill: 5, traineeProgress: 4, social: 4, mood: 4 }),
          favDelta: baseFavDelta + 6,
        },
        {
          id: 'opt_c',
          label: '选项C 摸鱼偷懒：借口鞋带松了退到后排半开麦省力带过',
          tendencyTag: '🍃 摸鱼偷懒 · 体力+10 / 心情+6 / 声乐-2',
          outcomeNarrative: `你蹲下身慢吞吞地系着鞋带，混在伴奏声里省力划水混过了抽检。组长皱着眉翻过一页名单没有多说什么，你暗自松了一口气，紧绷的肌肉得到了久违的放松。`,
          deltas: mergeDelta({ stamina: 10, mood: 6, vocalSkill: -2, darkIndex: -4 }),
          favDelta: baseFavDelta,
        },
      ],
    });
  }

  if (actionCategory === 'part_time_job' || actionCategory === 'endorsement') {
    return sanitizeAntiAIResponse({
      title: `【${location}】${actionName} · 高峰期突发状况`,
      sceneDescription: `傍晚时分的${location}迎来了客流与拍摄高峰，挑剔的前辈主管正盯着进度表催促，恰好来探班的${npcName}也在玻璃窗外向你招手。此时一台核心设备突然卡壳，现场气氛骤然紧张起来。`,
      choices: [
        {
          id: 'opt_a',
          label: '选项A 激进表现：独自一人揽下双倍工作量并现场即兴救场',
          tendencyTag: '🔥 激进表现 · 额外奖金+₩45,000 / 社交+6 / 压力+8',
          outcomeNarrative: `你挽起袖口快速排除了故障，同时用流利的谈吐安抚住全场节奏。主管当场在结算单上追加了一笔丰厚的绩效奖金，虽然肩膀酸痛难忍，但看着进账的数字依然成就感十足。`,
          deltas: mergeDelta({ coins: 45000, social: 6, cameraSkill: 4, darkIndex: 8, stamina: -6 }),
          favDelta: baseFavDelta + 2,
        },
        {
          id: 'opt_b',
          label: `选项B 稳妥配合：请${npcName}搭把手分工协作，按标准流程化解`,
          tendencyTag: `🤝 稳妥配合 · 额外小费+₩20,000 / ${npcName}好感+6`,
          outcomeNarrative: `${npcName}心领神会地走进来帮你分担了最繁琐的环节，两人一唱一和迅速稳住了局面。收工后你们分食了一份温热的鱼饼汤，晚风吹散了一整天的疲惫。`,
          deltas: mergeDelta({ coins: 20000, social: 4, mood: 6 }),
          favDelta: baseFavDelta + 6,
        },
        {
          id: 'opt_c',
          label: '选项C 摸鱼偷懒：躲进后台休息间偷喝冰美式，等主管自己处理',
          tendencyTag: '🍃 摸鱼偷懒 · 体力+12 / 心情+8 / 薪水微扣-₩15,000',
          outcomeNarrative: `你顺势退到堆满纸箱的休息间角落，咬着吸管慢悠悠地喝完了半杯冰美式。虽然最后结算时被扣掉了一点全勤补贴，但偷得浮生半日闲的惬意让你精神焕发。`,
          deltas: mergeDelta({ stamina: 12, mood: 8, coins: -15000, darkIndex: -5 }),
          favDelta: baseFavDelta,
        },
      ],
    });
  }

  if (actionCategory === 'club_activity' || actionCategory === 'club_tournament') {
    return sanitizeAntiAIResponse({
      title: `【${location}】${actionName} · 部室焦点交锋`,
      sceneDescription: `社团活动室的木地板映着夕阳余晖，正当你开展【${actionName}】时，隔壁社团的骨干成员突然过来借用主场地器材，部员们面面相觑，搭档${npcName}将征询的目光投向了你。`,
      choices: [
        {
          id: 'opt_a',
          label: '选项A 激进表现：提议用一场即兴实力Solo对决来决定器材归属',
          tendencyTag: '🔥 激进表现 · 社团实力+8 / 舞台表现+6 / 压力+6',
          outcomeNarrative: `你直接站到场地中央完成了一段教科书级别的高难展示，利落的收尾让对方心服口服地主动让出场地。全场部员为你欢呼鼓掌，你在社团内的威望大幅跃升。`,
          deltas: mergeDelta({ clubSkill: 8, clubStagePower: 6, social: 5, darkIndex: 6, stamina: -5 }),
          favDelta: baseFavDelta + 4,
        },
        {
          id: 'opt_b',
          label: `选项B 稳妥配合：与${npcName}协商错峰共用场地，顺便联合切磋`,
          tendencyTag: `🤝 稳妥配合 · 社团实力+5 / 团队默契+6 / ${npcName}好感+6`,
          outcomeNarrative: `你温和而坚定地排好了共用时段，还借机与对方交流了赛场经验。${npcName}对你的控场手腕赞不绝口，部室里的合练氛围变得格外融洽高效。`,
          deltas: mergeDelta({ clubSkill: 5, clubTeamwork: 6, social: 4, mood: 5 }),
          favDelta: baseFavDelta + 6,
        },
        {
          id: 'opt_c',
          label: '选项C 摸鱼偷懒：大方把场地让出去，自己带着部员去天台乘凉吃冰',
          tendencyTag: '🍃 摸鱼偷懒 · 体力+10 / 心情+10 / 社团实力-2',
          outcomeNarrative: `你顺水推舟宣布提前结束高强度训练，买来哈密瓜冰棒和大家坐在台阶上聊天吹风。虽然训练进度稍微落下了半拍，但每个人的脸上都洋溢着轻松的笑意。`,
          deltas: mergeDelta({ stamina: 10, mood: 10, clubSkill: -2, darkIndex: -6 }),
          favDelta: baseFavDelta + 2,
        },
      ],
    });
  }

  if (actionCategory === 'class_study' || actionCategory === 'tutoring_exam') {
    return sanitizeAntiAIResponse({
      title: `【${location}】${actionName} · 压轴难题突袭`,
      sceneDescription: `讲台上的计时器发出轻微的滴答声，正在进行的【${actionName}】突然发下了一道往年首尔大学自主招生的超高难度压轴题。教室里响起一片翻卷子的叹息声，坐在附近的${npcName}也微微蹙起了眉头。`,
      choices: [
        {
          id: 'opt_a',
          label: '选项A 激进表现：连用两种高阶逆向公式硬磕附加题，冲击满分第一',
          tendencyTag: '🔥 激进表现 · 学业+8 / 家庭+4 / 压力+8 / 体力-6',
          outcomeNarrative: `草稿纸被你密密麻麻的演算步骤填满，在铃声响起前一秒你终于推导出最终解。老师批阅时忍不住在全班面前展示了你的卷面，虽然用脑过度太阳穴微微发胀，但内申排名稳稳前移。`,
          deltas: mergeDelta({ academics: 8, family: 4, darkIndex: 8, stamina: -6 }),
          favDelta: baseFavDelta + 3,
        },
        {
          id: 'opt_b',
          label: `选项B 稳妥配合：先抓牢基础题满分，下课后与${npcName}对照错题本复盘`,
          tendencyTag: `🤝 稳妥配合 · 学业+5 / 心情+4 / ${npcName}好感+6`,
          outcomeNarrative: `你稳扎稳打拿下了所有必得分，课后与${npcName}头挨着头用荧光笔标注出解题陷阱。两人在互助中双双吃透了核心考点，书页间还夹着对方递来的柠檬糖。`,
          deltas: mergeDelta({ academics: 5, mood: 4, social: 3 }),
          favDelta: baseFavDelta + 6,
        },
        {
          id: 'opt_c',
          label: '选项C 摸鱼偷懒：用高摞的词典挡住视线，趴在课桌上补觉回血',
          tendencyTag: '🍃 摸鱼偷懒 · 体力+12 / 心情+8 / 学业-2',
          outcomeNarrative: `窗外温暖的微风吹拂着白色窗帘，你枕着手臂在词典掩护下睡了一个香甜的回笼觉。醒来时虽然黑板上的板书完全没记，但亏损的精力彻底恢复了过来。`,
          deltas: mergeDelta({ stamina: 12, mood: 8, academics: -2, darkIndex: -6 }),
          favDelta: baseFavDelta,
        },
      ],
    });
  }

  // Default for map_explore, npc_date, facility
  return sanitizeAntiAIResponse({
    title: `【${location}】${actionName} · 现场邂逅与抉择`,
    sceneDescription: `在【${location}】开展【${actionName}】时，街角或走廊的光影刚好落在你肩头。${npcName}（${npcRole}）正巧也出现在不远处，原本平静的日常节奏突然多了一丝微妙的戏剧波澜。`,
    choices: [
      {
        id: 'opt_a',
        label: `选项A 激进表现：主动上前拉住${npcName}开启大胆话题与挑战互动`,
        tendencyTag: `🔥 激进表现 · 社交+7 / 外貌表现+5 / ${npcName}好感+8 / 体力-5`,
        outcomeNarrative: `你落落大方地走上前打破常规，鲜活耀眼的举动让${npcName}耳根微微泛红，周围人的目光也不由自主地被你吸引，这段高光插曲成了今天最难忘的记忆。`,
        deltas: mergeDelta({ social: 7, appearance: 5, mood: 6, stamina: -5 }),
        favDelta: baseFavDelta + 8,
      },
      {
        id: 'opt_b',
        label: `选项B 稳妥配合：顺着当前氛围自然寒暄，与${npcName}并肩完成【${actionName}】`,
        tendencyTag: `🤝 稳妥配合 · 心情+6 / 社交+4 / ${npcName}好感+5`,
        outcomeNarrative: `你微笑着与${npcName}分享了手头的心得，两人步调一致地度过了这段惬意时光。不需要刻意的修饰，恰到好处的默契让彼此的心境都格外明朗。`,
        deltas: mergeDelta({ mood: 6, social: 4, academics: 2 }),
        favDelta: baseFavDelta + 5,
      },
      {
        id: 'opt_c',
        label: '选项C 摸鱼偷懒：找个洒满阳光的安静角落独自放空偷闲',
        tendencyTag: '🍃 摸鱼偷懒 · 体力+10 / 心情+8 / 压力-6',
        outcomeNarrative: `你戴上耳机靠在长椅上静静看着远处的云影流动，把课业与人际的纷扰统统抛在脑后，身心都得到了彻底的治愈与放松。`,
        deltas: mergeDelta({ stamina: 10, mood: 8, darkIndex: -6 }),
        favDelta: baseFavDelta,
      },
    ],
  });
}

/**
 * 10. 统一行动按钮闭环：AI 动态现场剧情 + 3个差异化应对选项 + 因果后续微描写生成器
 */
export async function generateActionInteractiveEvent(params: {
  aiConfig?: AIConfig;
  actionCategory: ActionEventCategory;
  actionName: string;
  location: string;
  stats: GameStats;
  npc?: NPCClassmate;
  featuredNpc?: NPCClassmate;
  baseDeltas?: Partial<GameStats>;
  baseFavDelta?: number;
  timeContext?: string;
  gradeYear?: number;
  weekInYear?: number;
  seasonLabel?: string;
  protagonistName?: string;
  triggeredEventHistory?: string[];
  extraContext?: string;
}): Promise<ActionInteractiveEventData> {
  const {
    aiConfig,
    actionCategory,
    actionName,
    location,
    stats,
    npc,
    baseDeltas = {},
    baseFavDelta = 0,
    timeContext = '首尔女高日常学期中',
  } = params;

  const npcName = npc?.chineseName || '朴敏英';
  const npcRole = npc?.role || '同班同学';
  const npcMemories = (npc?.memories || []).slice(-3).join('；') || '近期校园日常交集';

  const systemPrompt = `你是《韩国女高模拟器》的首席互动叙事导演。
${ANTI_AI_STYLE_RULES}

【当前行动上下文】：
- 玩家正在【${location}】执行行动：【${actionName}】（类别：${actionCategory}）
- 时间：${timeContext}
- 玩家当前核心属性：学业 ${stats.academics}，声乐 ${stats.vocalSkill || 35}，舞蹈 ${stats.danceSkill || 35}，社交 ${stats.social}，外貌 ${stats.appearance}，体力 ${stats.stamina}，心情 ${stats.mood}，压力(darkIndex) ${stats.darkIndex}
- 在场关联 NPC：【${npcName}】（身份：${npcRole}，好感度：${npc?.favorability ?? 55}，共同记忆：${npcMemories}）

【生成要求】：
1. 现场突发剧情描写（sceneDescription）：60~100字，极具画面感与戏剧冲突感，围绕当前行动【${actionName}】与在场 NPC【${npcName}】展开。
2. 生成 3 个截然不同的应对选项（choices）：
   - 第1个选项（激进表现）：高风险高收益（主属性大幅提升，但增加少许压力 darkIndex 或消耗体力 stamina）。
   - 第2个选项（稳妥配合）：均衡成长并与在场 NPC 产生良性互动（主属性稳健提升 + NPC好感 favDelta 提升）。
   - 第3个选项（摸鱼偷懒）：顺势放松或偷懒回血（体力 stamina +10 或心情 mood 提升，主属性微降 -2）。
3. 每个选项必须包含玩家点击后展示的【因果后续微描写】（outcomeNarrative，50~80字）以及具体的数值变化（deltas 与 favDelta）。

必须严格返回纯 JSON 对象：
{
  "title": "极具韩剧现场感的事件标题",
  "sceneDescription": "60到100字的现场突发剧情描写，细节生动且有冲突感",
  "choices": [
    {
      "id": "opt_a",
      "label": "选项A 激进表现：具体的行动选择描述",
      "tendencyTag": "🔥 激进表现 · 主属性+8 / 压力+8",
      "outcomeNarrative": "50到80字的因果后续微描写，展现选择后的具体画面与人物反应",
      "deltas": { "academics": 6, "vocalSkill": 0, "danceSkill": 0, "clubSkill": 0, "social": 4, "mood": 2, "stamina": -8, "darkIndex": 6, "coins": 0 },
      "favDelta": 3
    },
    {
      "id": "opt_b",
      "label": "选项B 稳妥配合：具体的行动选择描述",
      "tendencyTag": "🤝 稳妥配合 · 属性+4 / NPC好感+6",
      "outcomeNarrative": "50到80字的因果后续微描写",
      "deltas": { "academics": 4, "social": 4, "mood": 5, "stamina": -4 },
      "favDelta": 6
    },
    {
      "id": "opt_c",
      "label": "选项C 摸鱼偷懒：具体的行动选择描述",
      "tendencyTag": "🍃 摸鱼偷懒 · 体力+10 / 主属性-2",
      "outcomeNarrative": "50到80字的因果后续微描写",
      "deltas": { "stamina": 10, "mood": 8, "academics": -2, "darkIndex": -5 },
      "favDelta": 0
    }
  ]
}
${ANTI_AI_STYLE_RULES}`;

  const mergeWithBase = (aiChoices: ActionInteractiveChoice[]): ActionInteractiveChoice[] => {
    return aiChoices.map((ch, idx) => {
      const merged: Record<string, number> = {};
      const chDeltas = ch.deltas || {};
      const keys = new Set([...Object.keys(baseDeltas), ...Object.keys(chDeltas)]);
      keys.forEach((k) => {
        const bVal = Number((baseDeltas as any)[k] || 0);
        const cVal = Number((chDeltas as any)[k] || 0);
        // For coins/snsFollowers/stamina, combine or use reasonable sum
        const total = idx === 2 && k === 'stamina' && cVal > 0 ? cVal : bVal + cVal;
        if (total !== 0) merged[k] = total;
      });
      return {
        ...ch,
        id: ch.id || `opt_${idx}`,
        deltas: merged as Partial<GameStats>,
        favDelta: (ch.favDelta ?? 0) + (idx === 1 ? Math.max(4, baseFavDelta) : baseFavDelta),
      };
    });
  };

  // 1. Custom API mode if configured
  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetchWithTimeout(
        '/api/ai/custom-proxy',
        {
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
              {
                role: 'user',
                content: `请立即为玩家在【${location}】执行的【${actionName}】生成现场突发剧情与3个应对选项。`,
              },
            ],
          }),
        },
        15000
      );
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<ActionInteractiveEventData>(data.content);
        if (parsed.sceneDescription && Array.isArray(parsed.choices) && parsed.choices.length >= 2) {
          return {
            ...parsed,
            choices: mergeWithBase(parsed.choices),
          };
        }
      }
    } catch (_e) {}
  }

  // 2. Builtin backend endpoint /api/ai/action-event
  try {
    const res = await fetchWithTimeout(
      '/api/ai/action-event',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionCategory,
          actionName,
          location,
          stats,
          npc,
          baseDeltas,
          baseFavDelta,
          timeContext,
          systemPromptOverride: systemPrompt,
        }),
      },
      15000
    );
    if (res.ok) {
      const data = sanitizeAntiAIResponse(await res.json());
      if (data && data.sceneDescription && Array.isArray(data.choices) && data.choices.length >= 2) {
        return {
          ...data,
          choices: mergeWithBase(data.choices),
        };
      }
    }
  } catch (_err) {
    console.warn('AI 行动事件接口超时或降级，使用本地高戏剧性三选项模板兜底：', _err);
  }

  // 3. Guaranteed 3-choice high-drama local fallback
  return buildLocalActionInteractiveFallback({
    actionCategory,
    actionName,
    location,
    npc,
    baseDeltas,
    baseFavDelta,
  });
}

/**
 * 8. Dispatch 狗仔爆料 PR 危机公关 AI 处理结算
 */
export async function generateDispatchScandalPRResult(params: {
  scandal: DispatchScandalLeak;
  actionType: 'buyout' | 'statement' | 'counter_pr';
  stats: GameStats;
  protagonistName?: string;
  aiConfig?: AIConfig;
}): Promise<{
  narrative: string;
  netizenReaction: string;
  isSuccess: boolean;
  delta: Partial<GameStats>;
}> {
  const { scandal, actionType, protagonistName = '李秀妍', aiConfig } = params;

  const systemPrompt = `你是韩国 D社 (Dispatch) 独家爆料与演艺圈公关主笔。
玩家【${protagonistName}】面对 D社独家爆料预告【${scandal.title}】（爆料主题：${scandal.headline}），选择了危机公关策略：【${
    actionType === 'buyout' ? '花巨资独家买断照片' : actionType === 'statement' ? '发布官方强硬澄清声明' : '冷处理/买热搜转移视线'
  }】。
${ANTI_AI_STYLE_RULES}

请生成纯 JSON 结算结果：
{
  "narrative": "50-80字高画面感与现实感公关现场或舆论反转微描写",
  "netizenReaction": "一条韩网Theqoo/Nate Pann最具代表性的评论",
  "isSuccess": true,
  "followerDelta": 1200,
  "scandalDelta": -15,
  "coinsDelta": -50000
}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetchWithTimeout(
        '/api/ai/custom-proxy',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: aiConfig.customBaseUrl,
            apiKey: aiConfig.customApiKey,
            model: aiConfig.customModel || 'gpt-4o-mini',
            temperature: 0.82,
            jsonMode: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请生成公关处理结果' },
            ],
          }),
        },
        12000
      );
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<any>(data.content);
        return {
          narrative: parsed.narrative || '危机公关团队火速处置，将绯闻热度彻底平息。',
          netizenReaction: parsed.netizenReaction || '‘我就知道秀妍是清白的！公关效率太牛了！’',
          isSuccess: parsed.isSuccess ?? true,
          delta: {
            snsFollowers: parsed.followerDelta || 800,
            coins: parsed.coinsDelta || 0,
            mood: 5,
          },
        };
      }
    } catch (_e) {}
  }

  // Builtin fallback
  if (actionType === 'buyout') {
    return {
      narrative: `经纪公司法务团队携 ₩${scandal.buyoutCostKRW.toLocaleString()} 支票在清潭洞秘密会面 D社主编，当面销毁了抓拍原片与底片，危机化解于无形！`,
      netizenReaction: '‘D社今天的预告怎么突然撤掉了？听说被资本大佬当场买断了了！’',
      isSuccess: true,
      delta: { coins: -scandal.buyoutCostKRW, mood: 10, social: 5 },
    };
  } else if (actionType === 'statement') {
    const isWin = Math.random() < 0.8;
    return {
      narrative: isWin
        ? `企划社发布带有法律追责印章的澄清通稿，附带了当晚练习室监控时戳证明！造谣营销号当晚销号道歉，反吸大批路人粉！`
        : `官方声明发布后黑粉仍在质疑照片光影细节，好在死忠数据女工集体控评打卡，稳住了基本盘！`,
      netizenReaction: isWin
        ? '‘证据链太硬了！D社这波被打脸打得啪啪响，真痛快！’'
        : '‘路人表示静观其变，希望姐姐以后少去弘大那种地方。’',
      isSuccess: isWin,
      delta: { snsFollowers: isWin ? 3500 : -1200, mood: isWin ? 12 : -8, social: 8 },
    };
  } else {
    const isWin = Math.random() < 0.6;
    return {
      narrative: isWin
        ? `借助《人气歌谣》4K高清绝杀直拍打歌花絮直接买上登顶热搜，将黑料声浪彻底淹没在粉丝的表白弹幕中！`
        : `冷处理引发韩网网民跟风围观，论坛讨论帖突破千楼，粉丝粘性受到短暂冲击！`,
      netizenReaction: isWin
        ? '‘比起无聊绯闻，姐姐今天的红唇美貌才是真统治级！神颜万岁！’'
        : '‘怎么官方一直不回应？心里有鬼吗？有点失望了……’',
      isSuccess: isWin,
      delta: { snsFollowers: isWin ? 5200 : -2800, mood: isWin ? 8 : -15 },
    };
  }
}

/**
 * 9. Coupang 购买奢品一键发布 Stargram 动态评论生成
 */
export async function generateCoupangOotdPostComments(params: {
  item: CoupangShopItem;
  protagonistName?: string;
  npcs: NPCClassmate[];
  aiConfig?: AIConfig;
}): Promise<{
  caption: string;
  comments: { npcName: string; text: string }[];
}> {
  const { item, protagonistName = '李秀妍', npcs, aiConfig } = params;

  const validNpcNames = npcs.slice(0, 4).map((n) => n.chineseName);
  const npcListStr = validNpcNames.join('、') || '朴敏英、金智英、韩素拉、姜海仁';

  const systemPrompt = `你是《韩国女高模拟器》Stargram 动态互动生成器。
玩家【${protagonistName}】刚在 Coupang 购买了【${item.name}】（${item.tag}），并晒到了 Stargram。
${ANTI_AI_STYLE_RULES}

请生成纯 JSON 格式：
{
  "caption": "一句话俏皮生动的秀穿搭朋友圈文案（带文案和emoji）",
  "comments": [
    { "npcName": "NPC名字", "text": "真实极具人设口吻的惊叹评论（包含饭圈或闺蜜彩虹屁）" },
    { "npcName": "NPC名字2", "text": "评论" },
    { "npcName": "粉丝站姐", "text": "评论" }
  ]
}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetchWithTimeout(
        '/api/ai/custom-proxy',
        {
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
              { role: 'user', content: `晒出物品：${item.name}` },
            ],
          }),
        },
        10000
      );
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<any>(data.content);
        if (parsed.caption && Array.isArray(parsed.comments)) {
          return parsed;
        }
      }
    } catch (_e) {}
  }

  // Fallback
  return {
    caption: `刚收到的包裹！【${item.name}】实物美到窒息，走廊路过的同学都在问要链接~ ${item.tag} ✨`,
    comments: [
      {
        npcName: validNpcNames[0] || '朴敏英',
        text: `呀！我的神仙同桌！这件【${item.name}】也太衬你的冷白皮了吧！下次借我试穿一下❤️`,
      },
      {
        npcName: validNpcNames[1] || '金智英',
        text: `不愧是我们首尔女高门面！这套穿搭绝对可以上今天圣水洞 OOTD 街拍 TOP1！`,
      },
      {
        npcName: '清潭洞站姐 (Master)',
        text: `姐姐的美貌真的是国家宝藏！衣服贵气，人更贵气！死忠粉砸钱值了！🔥`,
      },
    ],
  };
}

/**
 * 10. K-Talk 演艺圈人脉 VIP 私信互动与高情商判定
 */
export async function generateKTalkVIPReply(params: {
  contact: KTalkIndustryContact;
  userReply: string;
  stats: GameStats;
  protagonistName?: string;
  aiConfig?: AIConfig;
}): Promise<{
  vipReply: string;
  eqScore: number;
  influenceGain: number;
  unlockedOffer?: {
    id: string;
    title: string;
    rewardCoins: number;
    followerGain: number;
    influenceGain: number;
    desc: string;
  };
}> {
  const { contact, userReply, protagonistName = '李秀妍', aiConfig } = params;

  const systemPrompt = `你是韩国演艺圈大佬【${contact.name}】（身份：${contact.role}）。
玩家练习生【${protagonistName}】在 K-Talk 演艺圈商务私信中回复了你：“${userReply}”。
${ANTI_AI_STYLE_RULES}

请基于你的大佬身份（严苛、提携后辈、挑剔或欣赏高情商），做出真实有说服力的回复，并评定玩家的 EQ 情商得分。
必须返回纯 JSON 格式：
{
  "vipReply": "50-80字真实自然的尊称与行业对话",
  "eqScore": 88,
  "influenceGain": 12,
  "unlockedOfferTitle": "（可选）若情商高>75分，赠送的独家通告/试音机会标题",
  "unlockedOfferDesc": "通告描述"
}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetchWithTimeout(
        '/api/ai/custom-proxy',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: aiConfig.customBaseUrl,
            apiKey: aiConfig.customApiKey,
            model: aiConfig.customModel || 'gpt-4o-mini',
            temperature: 0.82,
            jsonMode: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userReply },
            ],
          }),
        },
        12000
      );
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<any>(data.content);
        return {
          vipReply: parsed.vipReply || '很有想法的回复。下周来我们录音室试个音吧，我很期待。',
          eqScore: parsed.eqScore || 85,
          influenceGain: parsed.influenceGain || 10,
          unlockedOffer: parsed.unlockedOfferTitle
            ? {
                id: `offer_${Date.now()}`,
                title: parsed.unlockedOfferTitle,
                rewardCoins: 120000,
                followerGain: 6000,
                influenceGain: 15,
                desc: parsed.unlockedOfferDesc || '高情商带来的演艺圈独家高级资源通告！',
              }
            : undefined,
        };
      }
    } catch (_e) {}
  }

  // Fallback
  const eq = Math.min(100, Math.max(50, Math.floor(65 + userReply.length * 1.5 + Math.random() * 20)));
  const gain = Math.floor(eq / 10);
  return {
    vipReply: `秀妍啊，你的态度和行业嗅觉很令人惊喜！后生可畏，我已经在日程表里为你预留了优先试镜档期。`,
    eqScore: eq,
    influenceGain: gain,
    unlockedOffer:
      eq >= 80
        ? {
            id: `offer_${Date.now()}`,
            title: `【${contact.name}】专属引荐：大型流媒体网剧主题曲 OST 独唱`,
            rewardCoins: 200000,
            followerGain: 15000,
            influenceGain: 20,
            desc: '由业界顶尖前辈保驾护航，直接斩获音源榜与电视原声带独唱金曲！',
          }
        : undefined,
  };
}

/**
 * 11. 四周极速跨越 (Time Skip x4 Weeks) 沉浸式演艺与生活期刊短评生成
 */
export async function generateTimeSkipSummaryNarrative(params: {
  startWeekLabel: string;
  endWeekLabel: string;
  deltas: Partial<GameStats>;
  protagonistName?: string;
  aiConfig?: AIConfig;
}): Promise<{
  memoirNarrative: string;
  academicHighlights: string;
  socialHighlights: string;
  financialHighlights: string;
}> {
  const { startWeekLabel, endWeekLabel, deltas, protagonistName = '李秀妍', aiConfig } = params;

  const systemPrompt = `你是《首尔女高与演艺圈模拟器》的时光日志主笔。
玩家【${protagonistName}】完成了从【${startWeekLabel}】到【${endWeekLabel}】的四周极速跨越时光跃迁。
数值增减情况：
- 零花钱收益：+₩${(deltas.coins || 0).toLocaleString()}
- 学业提升：+${deltas.academics || 0}
- 练习生/艺术技能提升：+${(deltas.traineeProgress || 0) + (deltas.vocalSkill || 0)}
- 涨粉：+${deltas.snsFollowers || 0}

${ANTI_AI_STYLE_RULES}

请生成纯 JSON 格式：
{
  "memoirNarrative": "100-150字极具沉浸感、细腻传记感的四周时光总结回顾短评",
  "academicHighlights": "1-2句学业与练习室手记总结",
  "socialHighlights": "1-2句社交、粉丝应援与社交圈变化",
  "financialHighlights": "1-2句资产、零花钱与生活变动"
}`;

  if (aiConfig?.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    try {
      const res = await fetchWithTimeout(
        '/api/ai/custom-proxy',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: aiConfig.customBaseUrl,
            apiKey: aiConfig.customApiKey,
            model: aiConfig.customModel || 'gpt-4o-mini',
            temperature: 0.82,
            jsonMode: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '生成四周极速跨越日志' },
            ],
          }),
        },
        12000
      );
      const data = await res.json();
      if (res.ok && data.content) {
        const parsed = parseAndCleanAIJson<any>(data.content);
        if (parsed.memoirNarrative) {
          return {
            memoirNarrative: parsed.memoirNarrative,
            academicHighlights: parsed.academicHighlights || '在首尔女高的课桌与企划社挥汗如雨的练习室之间，你保持着惊人的专注度。',
            socialHighlights: parsed.socialHighlights || 'Stargram 与 Bubble 粉丝圈热闹非凡，同桌与朋友们的羁绊日益深厚。',
            financialHighlights: parsed.financialHighlights || `四周内累计积累零花钱与津贴 ₩${(deltas.coins || 0).toLocaleString()}，生活井井有条。`,
          };
        }
      }
    } catch (_e) {}
  }

  // Fallback
  return {
    memoirNarrative: `这四周里，首尔女高的樱花与清潭洞练习室的日光悄然流转。在【${startWeekLabel}】至【${endWeekLabel}】的时光跨越中，【${protagonistName}】在课业复习与高强度 Dance/Vocal 特训间找到了完美的平衡。虽然日程充实紧凑，但每次路过弘大咖啡馆或汉江边的夜风，都见证着你向着顶流 C 位一步步蜕变的坚定脚印。`,
    academicHighlights: `连续 4 周深耕首尔女高重难点科目，课业成绩提升 +${deltas.academics || 8}；练习室特训进度提升 +${deltas.traineeProgress || 12}！`,
    socialHighlights: `四周内社交影响力与 SNS 粉丝新增 +${(deltas.snsFollowers || 2800).toLocaleString()}，Bubble 站姐贴纸留言不断！`,
    financialHighlights: `四周内累计入账零花钱 ₩${(deltas.coins || 0).toLocaleString()}，体力与精神状态维持良好！`,
  };
}


