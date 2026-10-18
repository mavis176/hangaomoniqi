import { AIConfig, GameStats, NPCClassmate, RandomEvent, ChatMessage, ForumPost } from '../types';

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

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const historyText = history
      .slice(-8)
      .map((m) => `${m.sender === 'user' ? '李秀妍' : npc.chineseName}: ${m.text}`)
      .join('\n');

    const memoryText = memories.length > 0 ? memories.slice(-8).map((m) => `- ${m}`).join('\n') : '暂无特殊记忆';
    const keywordText = Array.isArray(npc.memoryKeywords) && npc.memoryKeywords.length > 0
      ? npc.memoryKeywords.join('、')
      : '初识阶段';

    const systemPrompt = `你正在进行极具现实质感的《韩国女高模拟器》角色扮演。
你扮演首尔女子高中的【${npc.chineseName}】（${npc.koreanName}，身份：${npc.role}）。
- MBTI人格：${npc.mbti || '真实鲜活的韩国女高中生'}
- 兴趣爱好：${npc.interests ? npc.interests.join('、') : '日常生活'}
- 说话口吻：${npc.speechStyle || '自然口语化'}
- 当前对李秀妍的好感度：${npc.favorability}/100，心动值：${npc.romancePoints || 0}，关系阶段：${npc.relationshipStage}。
- 共同记忆关键词：${keywordText}
- 当前时间：${timeContext}，地点：${location}。
过往共同记忆：
${memoryText}

请彻底用符合其MBTI与好感度阶段的真实韩国高中生口吻说话（拒绝客服腔、拒绝生硬翻译腔），自然呼应记忆关键词，并提取本轮对话的新记忆关键词，必须严格返回JSON对象：
{
  "reply": "自然鲜活的口语台词（30-85字）",
  "innerThought": "角色此刻真实的心理活动",
  "actionDesc": "具体细腻的神态或小动作描写",
  "newMemory": "若本次对话产生了新约定/秘密/重要事件则总结成一句话，否则填 \"\"",
  "extractedKeywords": ["提炼1-2个记忆关键词"],
  "favorabilityDelta": 5,
  "moodDelta": 5,
  "socialDelta": 3,
  "suggestedReplies": ["自然口语回复1", "自然口语回复2", "自然口语回复3"]
}`;

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
            content: `刚才的对话：\n${historyText}\n\n李秀妍刚刚对你说：“${userMessage}”`,
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '自定义 API 调用失败');
    const cleaned = data.content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }

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
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 响应失败');
  }
  return data;
}

export async function generateGroupChatReplies(params: {
  userMessage: string;
  groupType: 'class' | 'idol';
  npcs: NPCClassmate[];
  timeContext: string;
}): Promise<{ npcId: string; npcName: string; text: string }[]> {
  const res = await fetch('/api/ai/group-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '群聊 AI 响应失败');
  }
  return data.messages || [];
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

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const npcSummary = npcs.map((n) => `${n.chineseName}(${n.role},好感${n.favorability})`).join('、');
    const memText = recentMemories.slice(-6).join('；');
    const systemPrompt = `你是《韩国女高模拟器》的写实派校园编剧。请写一段贴近现实韩国高中生活的突发日常插曲（拒绝悬浮狗血和说教）。
必须严格返回JSON对象：
{
  "title": "事件标题",
  "content": "90-140字细腻写实的校园场景与人物描写",
  "options": [
    {
      "text": "选项1文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 5, "stamina": -5, "academics": 3, "social": 4, "appearance": 0, "coins": 0, "npcId": "npc_1", "favDelta": 5 }
    },
    {
      "text": "选项2文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 8, "stamina": -2, "academics": 0, "social": 5, "appearance": 1, "coins": -3000, "npcId": "npc_2", "favDelta": 6 }
    },
    {
      "text": "选项3文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 2, "stamina": -8, "academics": 6, "social": 0, "appearance": 0, "coins": 0, "npcId": "npc_3", "favDelta": 4 }
    }
  ]
}`;

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
    const parsed = JSON.parse(data.content.replace(/```json|```/g, '').trim());
    return {
      id: `ai_ev_${Date.now()}`,
      isAIGenerated: true,
      ...parsed,
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
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'AI 事件生成失败');
  }

  return {
    id: `ai_ev_${Date.now()}`,
    isAIGenerated: true,
    ...data,
  };
}

export async function generateCampusForumPosts(params: {
  aiConfig: AIConfig;
  stats: GameStats;
  timeContext: string;
  recentMemories: string[];
  playerPost?: string;
}): Promise<ForumPost[]> {
  const { stats, timeContext, recentMemories, playerPost } = params;

  const res = await fetch('/api/ai/forum', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stats,
      timeContext,
      recentMemories,
      playerPost,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '校园论坛生成失败');
  }
  return data.posts || [];
}

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

  if (aiConfig.mode === 'custom' && aiConfig.customBaseUrl && aiConfig.customApiKey) {
    const systemPrompt = `你是韩国K-POP选秀《PRODUCE 首尔女团》与四大社练习生生存系统的总编剧。
请为首尔女子高中练习生【李秀妍】（企划社：${agencyName}，评级：${stats.traineeGrade}，Vocal:${stats.vocalSkill} Dance:${stats.danceSkill} Rap:${stats.rapSkill} Cam:${stats.cameraSkill}，粉丝数:${stats.snsFollowers}）生成一场【${categoryLabels[category]}】生存秀实战任务。
必须严格返回JSON对象：
{
  "title": "任务标题",
  "conceptTag": "#概念标签1 #概念标签2",
  "broadcastChannel": "播出频道或举办场地",
  "sceneDescription": "100-150字细腻真实的韩国舞台/考核/粉丝见面会场景描写",
  "mentorPrompt": "制作人导师的现场发问或考核要求",
  "liveNetizenComments": ["弹幕/站姐速报1", "弹幕/站姐速报2", "弹幕/站姐速报3"],
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
}`;

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
    const parsed = JSON.parse(data.content.replace(/```json|```/g, '').trim());
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
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '练习生生存秀任务生成失败');
  }
  return data;
}
