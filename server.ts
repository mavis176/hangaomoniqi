import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DYNAMIC_NPC_FALLBACK_PRESETS,
  getAvatarForSeed,
  getEncounterLocationByAction,
} from './src/data/encounterData';
import {
  ANTI_AI_STYLE_RULES,
  NPC_CHAT_LIVING_PERSONA_RULES,
  splitNpcReplyIntoBubbles,
  sanitizeAntiAIResponse,
  buildLocalActionInteractiveFallback,
} from './src/services/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cloudScopeRestricted = false;

function getGenAIClient(): GoogleGenAI | null {
  if (cloudScopeRestricted) {
    return null;
  }
  const rawKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (
    !rawKey ||
    rawKey === 'MY_GEMINI_API_KEY' ||
    rawKey.startsWith('ya29.') // OAuth access token without generative language scope
  ) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: rawKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGenAIError(err: any) {
  const msg = String(err?.message || err || '');
  if (msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || msg.includes('PERMISSION_DENIED') || err?.status === 403) {
    cloudScopeRestricted = true;
  }
}

/**
 * Live AI LLM fallback using Pollinations OpenAI-compatible endpoint when GEMINI_API_KEY
 * is restricted in the preview container. Guarantees real, non-stiff AI dialogue!
 */
async function callLiveOpenAICompatibleLLM(systemPrompt: string, userPrompt: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai',
        temperature: 0.88,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              systemPrompt +
              '\n' +
              ANTI_AI_STYLE_RULES +
              '\n\n【重要格式要求】必须使用纯正自然的现代简体中文（可点缀极少量韩语感叹词如“呀”、“大发”、“欧尼/前辈”，但正文必须是简体中文），并且只输出合法的 JSON 对象，不要包含 markdown 代码块标记！',
          },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';
    if (!rawContent) return null;
    const cleaned = rawContent
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/\s*(?:——+|—+|--+)\s*/g, '，')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return sanitizeAntiAIResponse(JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)));
    }
    return sanitizeAntiAIResponse(JSON.parse(cleaned));
  } catch (_e) {
    clearTimeout(timer);
    return null;
  }
}

const CHARACTER_PERSONAS: Record<string, string> = {
  npc_1: `【朴敏英 (박민영) · 同班同学 · 邻座死党】
- 真实性格：和李秀妍从高一开学第一天就坐同桌的铁杆闺蜜。温柔细腻、重情重义，课桌抽屉里总藏着草莓百奇和软糖，私下在Webtoon匿名连载人气校园条漫。
- 说话方式：像现实中关系最铁的同桌女生一样自然亲昵、充满生活细节（比如帮忙盯班主任巡堂、借课堂笔记、一起去小卖部抢面包、吐槽数学题难），绝不官方死板。`,

  npc_2: `【金智英 (김지영) · 同班同学 · 时尚美妆与八卦情报局】
- 真实性格：1-1班最懂穿搭、Olive Young美妆销冠、圣水洞网红咖啡店和校园八卦的潮流少女。活泼爱笑、自来熟、重朋友。
- 说话方式：语速快、元气时髦，喜欢聊水光唇釉色号、人生四格拍照、K-Pop爱豆直拍和班里的新鲜事，称呼秀妍“秀妍呐”或“我们门面秀妍”。`,

  npc_3: `【韩素拉 (한소라) · 补习班同学 · 全校第一高岭之花】
- 真实性格：出身首尔江南精英家庭，每天在大峙洞补习班刷题到深夜。表面冷淡毒舌、只喝无糖冰美式，实则外冷内热，把秀妍视为唯一认可的对手与精神支柱。
- 说话方式：克制、简练、傲娇（口嫌体正直），嘴上督促秀妍别松懈，行动上却会主动划重点、递温水，好感高时流露出极强的排他性温柔。`,

  npc_4: `【李恩宇 (이은우) · 社团前辈 · 广播社/乐队温柔学长】
- 真实性格：高二清朗温柔的校园男神，常在午休广播室调试设备、弹木吉他，会专门为秀妍播放她喜欢的歌。
- 说话方式：温柔苏感、体贴有分寸，带着少年特有的清澈宠溺感，会关心秀妍的课业压力与心情。`,

  npc_5: `【姜海仁 (강해인) · 运动部成员 · 校女排王牌主将】
- 真实性格：帅气狼尾短发的排球部ACE，阳光率真、直球坦荡，对秀妍有满满的保护欲，永远第一个站出来替秀妍撑腰。
- 说话方式：爽朗有少年气、直球笨拙又炽热，常提请你喝冰宝矿力、帮你背重书包、邀你来看她扣球训练。`,

  npc_6: `【千宥娜 (천유나) · 神秘转学生 · 前四大社C位练习生】
- 真实性格：从海外转学回首尔的冷艳白金发少女，舞台实力满级、审美顶尖。曾因企划社内部纷争离开，只对真诚的秀妍卸下心防。
- 说话方式：酷飒有态度、自信松弛，懂一切K-Pop练习室、耳返、打歌舞台与穿搭门道，把秀妍当成唯一的灵魂搭档。`,

  npc_7: `【宋恩静 (송은정) · 校医与文学社导师】
- 真实性格：26岁的首尔女高传奇毕业生兼校医，保健室里总泡着洋甘菊花茶。知性温柔，洞察力极强，守护着旧校舍的白玉兰秘密。
- 说话方式：成熟治愈、温柔包容的大姐姐口吻，从不说教，总是让人感到安心。`,

  npc_8: `【尹在民 (윤재민) · 学生会会长】
- 真实性格：戴金丝眼镜的风纪委员长兼学生会长，表面铁面无私、严谨守规，私下每天放学去学校后山喂流浪小猫，唯独对秀妍一再破例。
- 说话方式：礼貌克制、略带禁欲感，但每次被秀妍调侃或靠近时都会紧张地推眼镜、耳尖泛红。`,
};

// Rich, multi-topic, non-repetitive short-bubble fallback generator if both Gemini and Pollinations time out
function buildContextualChatFallback(params: {
  npc: any;
  userMessage: string;
  location: string;
  timeContext: string;
  stats: any;
  memories: string[];
}) {
  const { npc, userMessage, location } = params;
  const msg = (userMessage || '').trim();
  const id = npc?.id || 'npc_1';
  const fav = npc?.favorability ?? 60;

  const isStudyTopic = /数学|考试|模拟考|复习|学习|题|成绩|英语|历史|课|作业|补习|大峙洞|笔记|高考|CSAT|卷子/.test(msg);
  const isIdolTopic = /练习生|出道|舞台|跳舞|唱歌|爱豆|K-Pop|打歌|直拍|选秀|月度|考核|C位|专辑|粉丝/.test(msg);
  const isLoveTopic = /喜欢|想你|约会|好看|帅|美|心跳|在一起|手|拥抱|亲|表白|秘密/.test(msg);
  const isTiredTopic = /困|累|睡|烦|难|不想上|头疼|压力|哭|委屈/.test(msg);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  if (id === 'npc_5') {
    if (isStudyTopic) {
      const replies = ['看到数学题我就有点头疼哈哈', '你要是愿意帮我讲讲', '我保证老老实实坐着听完！'];
      return {
        replies,
        reply: replies.join('\n'),
        actionDesc: `姜海仁挠了挠狼尾短发，眼神温和期待地看着你`,
        innerThought: `其实听不听得懂没关系，主要是想跟秀妍多待一会儿。`,
        newMemory: `和姜海仁约定一起温习功课`,
        favorabilityDelta: 5,
        moodDelta: 6,
        socialDelta: 3,
        suggestedReplies: [
          '那说好了，做对题我请你喝冰沙',
          '我帮你划最核心的考点就行',
          '待会儿下课先从第一题开始吧',
        ],
      };
    }
    if (isTiredTopic) {
      const replies = ['是不是最近太累了？', '来靠着歇会儿吧', '待会儿放学书包交给我背就行'];
      return {
        replies,
        reply: replies.join('\n'),
        actionDesc: `姜海仁把干净的运动外套轻轻搭在你肩上`,
        innerThought: `看她露出疲惫的样子，真的很想替她分担一点。`,
        newMemory: `在疲惫时收到了姜海仁贴心披上的运动外套`,
        favorabilityDelta: 7,
        moodDelta: 9,
        socialDelta: 3,
        suggestedReplies: [
          '外套上有阳光的味道，很安心',
          '有海仁在身边感觉好多了',
          '那放学一起去吃热乎乎的鱼饼串吧',
        ],
      };
    }
    if (isLoveTopic || fav >= 75) {
      const replies = ['你突然这么说……', '我都有点不好意思了', '不过我也是这么想的，真的'];
      return {
        replies,
        reply: replies.join('\n'),
        actionDesc: `姜海仁耳根微红，有些腼腆地笑了笑`,
        innerThought: `心跳稍微有点快，还好没有失态。`,
        newMemory: `在${location}和姜海仁有了默契而温暖的对话`,
        favorabilityDelta: 8,
        moodDelta: 8,
        socialDelta: 3,
        suggestedReplies: [
          '海仁害羞的样子很可爱呢',
          '下周排球部比赛我去给你加油',
          '放学后去汉江边骑单车吹风吧',
        ],
      };
    }
    const replies = ['正好在这儿碰到你！', '刚去小卖部买了两罐冰宝矿力', '这罐拧开了，给你喝'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `姜海仁温和地笑着把拧松瓶盖的饮料递给你`,
      innerThought: `刚下训就能碰到秀妍，今天运气真好。`,
      newMemory: `在${location}收到了姜海仁分享的冰镇宝矿力`,
      favorabilityDelta: 5,
      moodDelta: 6,
      socialDelta: 3,
      suggestedReplies: [
        '谢谢海仁，刚好有点渴了',
        '今天排球部训练累不累？',
        '周末有空一起去逛街吗？',
      ],
    };
  }

  if (id === 'npc_6') {
    if (isIdolTopic) {
      const replies = ['这部分节奏确实不太好抓', '放学后有空吗？', '我们去独立练舞室慢慢顺一遍吧'];
      return {
        replies,
        reply: replies.join('\n'),
        actionDesc: `千宥娜摘下单侧监听耳返，温和认真地看向你`,
        innerThought: `秀妍很努力，我想把我懂的经验都教给她。`,
        newMemory: `千宥娜邀请秀妍放学后去练舞室一起顺动作`,
        favorabilityDelta: 7,
        moodDelta: 7,
        socialDelta: 4,
        suggestedReplies: [
          '好呀，有宥娜指导我就安心了',
          '练完舞我请你去吃沙拉轻食',
          '刚才那个定点动作能再示范一次吗？',
        ],
      };
    }
    const replies = ['刚把耳机摘下来就看见你了', '早上路过圣水洞买了燕麦冷萃', '多带了一杯，给你留的'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `千宥娜自然地把一杯加了燕麦奶的冷萃递到你手里`,
      innerThought: `不知不觉就养成帮她多带一杯的习惯了。`,
      newMemory: `千宥娜特意从圣水洞给秀妍带了燕麦冷萃`,
      favorabilityDelta: 6,
      moodDelta: 7,
      socialDelta: 3,
      suggestedReplies: [
        '连我喜欢燕麦奶都记得，太贴心了',
        '下次换我给你带手做可露丽',
        '午休我们去天台听新歌Demo吧',
      ],
    };
  }

  if (id === 'npc_7') {
    const replies = ['最近课业和社团都辛苦了吧', '我刚泡了温热的洋甘菊茶', '先坐下来喝一口喘口气吧'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `宋恩静老师温和地笑着倒了一杯热茶递给你`,
      innerThought: `希望她能照顾好自己，不要给自己太大压力。`,
      newMemory: `在保健室喝了宋恩静老师泡的洋甘菊茶`,
      favorabilityDelta: 6,
      moodDelta: 9,
      socialDelta: 2,
      suggestedReplies: [
        '跟宋老师聊会儿天心里踏实多了',
        '这杯洋甘菊茶闻起来好香呀',
        '周末文学社的读书会我也想参加',
      ],
    };
  }

  if (id === 'npc_8') {
    const replies = ['那个社团申请表我已经看过了', '帮你核对过细节，没问题', '下周如果忙不过来可以随时找我'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `尹在民温和地推了推金丝眼镜，把整理好的文件递给你`,
      innerThought: `能帮上她的忙就好。`,
      newMemory: `尹在民细心地帮忙核对好了社团申请表`,
      favorabilityDelta: 6,
      moodDelta: 7,
      socialDelta: 3,
      suggestedReplies: [
        '谢谢会长，你办事总是这么细致',
        '放学后我陪你一起去后山喂小猫吧',
        '下次复习资料我们一起整理吧',
      ],
    };
  }

  if (id === 'npc_3') {
    if (isStudyTopic) {
      const replies = ['这道题昨晚补习班正好讲过变式', '我的双色笔记在这一页', '你先拿去看吧，不用急着还'];
      return {
        replies,
        reply: replies.join('\n'),
        actionDesc: `韩素拉把整理得干净工整的活页笔记轻轻推到你面前`,
        innerThought: `只要她认真问，我随时都愿意跟她一起讨论。`,
        newMemory: `韩素拉主动把大峙洞双色笔记借给秀妍参考`,
        favorabilityDelta: 6,
        moodDelta: 5,
        socialDelta: 3,
        suggestedReplies: [
          '素拉的笔记条理太清晰了，谢谢！',
          '刷完这套题我请你喝热拿铁',
          '有不懂的步骤我待会儿再请教你',
        ],
      };
    }
    const replies = ['正好我也刚写完这一节', '休息五分钟吧', '你今天看起来气色挺不错的'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `韩素拉轻轻合上笔盖，语气温和地看向你`,
      innerThought: `和秀妍待在一起的时候，紧绷的神经会放松很多。`,
      newMemory: `课间与韩素拉一起休息闲聊`,
      favorabilityDelta: 5,
      moodDelta: 5,
      socialDelta: 2,
      suggestedReplies: [
        '看你今天精神也不错，昨晚早睡啦？',
        '放学去补习班前一起吃个简餐吧',
        '给，分你一颗柠檬薄荷糖提提神',
      ],
    };
  }

  if (id === 'npc_4') {
    const replies = ['刚在广播室调好音就遇到你了', '昨晚新编了一段木吉他旋律', '要不要戴上耳机听听看？'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `李恩宇学长温和地把一只监听耳机递到你手边`,
      innerThought: `写这首曲子的时候，很希望第一个听见的人是秀妍。`,
      newMemory: `李恩宇学长邀请秀妍试听他新编的木吉他曲`,
      favorabilityDelta: 7,
      moodDelta: 8,
      socialDelta: 3,
      suggestedReplies: [
        '旋律好温暖，听着心情都变好了',
        '这首曲子叫什么名字呀？',
        '周末乐队排练我可以带零食去探班吗？',
      ],
    };
  }

  if (id === 'npc_2') {
    const replies = ['秀妍！我正想找你呢', '圣水洞新开了一家超可爱的拍贴店', '今天放学我们一起去逛逛好不好？'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `金智英笑盈盈地凑过来，眼睛亮晶晶地看着你`,
      innerThought: `跟秀妍一起逛街拍照永远是最开心的事。`,
      newMemory: `金智英约秀妍放学后一起去圣水洞拍贴店打卡`,
      favorabilityDelta: 6,
      moodDelta: 7,
      socialDelta: 4,
      suggestedReplies: [
        '好呀！放学铃一响我们就出发',
        '智英推荐的店肯定很出片',
        '顺便去旁边买杯水蜜桃冰茶吧',
      ],
    };
  }

  if (npc?.isGenerated) {
    const cName = npc?.chineseName || '新朋友';
    const replies = ['这么巧在这儿遇到你', '最近学校里还忙得过来吗？', '有空的话我们去附近喝杯热饮吧'];
    return {
      replies,
      reply: replies.join('\n'),
      actionDesc: `${cName}停下脚步，温和友善地朝你微笑`,
      innerThought: `每次偶遇秀妍，聊起天来都觉得很投缘。`,
      newMemory: `在${location}与${cName}愉快寒暄并约好喝热饮`,
      favorabilityDelta: 6,
      moodDelta: 6,
      socialDelta: 4,
      suggestedReplies: [
        '好呀，正好我也想歇一会儿',
        '你今天看起来心情很不错呢',
        '下次再去我们上次去过的那家店坐坐吧',
      ],
    };
  }

  // Default npc_1 朴敏英
  return pick([
    {
      replies: ['秀妍，我刚在速写本角落画了个小插画', '画的是我们俩课间的样子', '待会儿下课一起去小卖部买草莓牛奶吧？'],
      reply: '秀妍，我刚在速写本角落画了个小插画\n画的是我们俩课间的样子\n待会儿下课一起去小卖部买草莓牛奶吧？',
      actionDesc: `朴敏英弯起眉眼，把速写本轻轻往你这边推了推`,
      innerThought: `能和秀妍做同桌，每天来上学都觉得很开心。`,
      newMemory: `朴敏英画了同桌日常小插画，并约秀妍去买草莓牛奶`,
      favorabilityDelta: 6,
      moodDelta: 7,
      socialDelta: 3,
      suggestedReplies: [
        '画得好可爱！我要夹进手帐本珍藏',
        '走呀，今天我请你吃延世奶油面包',
        '放学后我们一起去文具店挑贴纸吧',
      ],
    },
    {
      replies: ['我抽屉里还留了一盒草莓百奇', '今天早上刚买的，可脆了', '趁现在课间，我们分着吃吧~'],
      reply: '我抽屉里还留了一盒草莓百奇\n今天早上刚买的，可脆了\n趁现在课间，我们分着吃吧~',
      actionDesc: `朴敏英从课桌里拿出一盒草莓百奇，温和地递到你手边`,
      innerThought: `跟秀妍分享喜欢的小零食最开心了。`,
      newMemory: `课间和同桌朴敏英一起分吃了草莓百奇`,
      favorabilityDelta: 6,
      moodDelta: 8,
      socialDelta: 3,
      suggestedReplies: [
        '敏英的课桌永远藏着好吃的！',
        '那我把我带的果冻分你一半',
        '下节课要是困了我们互相提醒哦',
      ],
    },
  ]);
}

function buildContextualEventFallback(params: {
  location: string;
  timeContext: string;
  customPrompt?: string;
}) {
  const { location, timeContext, customPrompt } = params;

  if (customPrompt && customPrompt.trim()) {
    const cleanPrompt = customPrompt.trim();
    return {
      title: `校园特别插曲 · ${cleanPrompt.slice(0, 12)}`,
      content: `${timeContext}，在${location}柔和的光线里，正如你所期待的那样，“${cleanPrompt}”悄然发生了。周围同学们的目光若有若无地投来，空气中带着一丝独属于首尔高中的微妙心跳感。`,
      options: [
        {
          text: '大方自然地走上前去互动回应',
          resultText: '你的从容与微笑给对方留下了极深的印象，这段特别的画面成为了今天最亮眼的记忆。',
          memoryLog: `在${location}经历了特别事件：${cleanPrompt}`,
          effect: { mood: 10, stamina: -5, academics: 3, social: 6, appearance: 2, coins: 0, npcId: 'npc_1', favDelta: 6 },
        },
        {
          text: '带着一丝矜持与俏皮，用眼神传递默契',
          resultText: '彼此心照不宣的默契让气氛格外融洽。',
          memoryLog: `在${location}留下了难忘的默契瞬间：${cleanPrompt}`,
          effect: { mood: 8, stamina: -3, academics: 4, social: 4, appearance: 3, coins: 0, npcId: 'npc_4', favDelta: 7 },
        },
        {
          text: '将这一幕悄悄记录在随身手帐本里',
          resultText: '你在活页手帐上写下了今天的心情，感觉内心更加充实笃定了。',
          memoryLog: `在手帐本里记录下了：${cleanPrompt}`,
          effect: { mood: 6, stamina: -2, academics: 5, social: 2, appearance: 0, coins: 0, npcId: '', favDelta: 0 },
        },
      ],
    };
  }

  const pool = [
    {
      title: `${location}的课间耳机分半`,
      content: `${timeContext}，走廊窗外吹来一阵带着梧桐叶气息的微风。朴敏英拿着随身听凑到你身边，神神秘秘地晃了晃手里的耳机线：“秀妍，我刚录了电台里超火的那首R&B慢歌，快听听看前奏！”`,
      options: [
        {
          text: '戴上右耳耳机，和她并肩靠在窗边听完',
          resultText: '两人的发丝被窗风轻轻吹拂，一首歌的时间让紧绷的课业压力消散了大半。',
          memoryLog: `在${location}和朴敏英分戴一副耳机听完了电台新歌`,
          effect: { mood: 10, stamina: 4, academics: 0, social: 5, appearance: 1, coins: 0, npcId: 'npc_1', favDelta: 7 },
        },
        {
          text: '边听歌边考她刚刚背过的英语短语',
          resultText: '朴敏英一边哼歌一边居然全答对了，两人击掌庆祝！',
          memoryLog: `和朴敏英边听歌边互抽英语短语，默契满分`,
          effect: { mood: 6, stamina: -4, academics: 5, social: 4, appearance: 0, coins: 0, npcId: 'npc_1', favDelta: 6 },
        },
      ],
    },
    {
      title: '自动贩卖机多掉下来的一罐桃子汁',
      content: `你在${location}拐角的自动贩卖机投币买饮料时，听见“哐当、哐当”两声，出口竟然同时掉下了两罐冰镇水蜜桃气泡水！而身后的韩素拉正好拿着硬币走过来准备买咖啡。`,
      options: [
        {
          text: '顺手把多出来的那罐桃子汁递给韩素拉',
          resultText: '韩素拉看着粉色的桃子汁愣了两秒，小声说了句“下次我请回你”，耳尖微微泛红地收下了。',
          memoryLog: `把自动贩卖机多掉出来的冰镇桃子汁分给了韩素拉`,
          effect: { mood: 8, stamina: 5, academics: 2, social: 4, appearance: 0, coins: -1500, npcId: 'npc_3', favDelta: 9 },
        },
        {
          text: '带回教室和同桌朴敏英、金智英一起分着喝',
          resultText: '冰凉清甜的气泡水让大家都精神一振，课间气氛热闹极了！',
          memoryLog: `把幸运抽中的第二罐水蜜桃气泡水带回班里和好友分享`,
          effect: { mood: 9, stamina: 6, academics: 0, social: 6, appearance: 0, coins: -1500, npcId: 'npc_2', favDelta: 6 },
        },
      ],
    },
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', aiReady: true });
  });

  // 1. Realistic & Memory-Aware AI NPC Chat Endpoint (Gemini -> Live OpenAI LLM -> Rich Multi-Topic Fallback)
  app.post('/api/ai/chat', async (req, res) => {
    const {
      npc,
      userMessage,
      history,
      memories,
      stats,
      location,
      timeContext,
      narrativeStyle,
    } = req.body;

    const persona =
      CHARACTER_PERSONAS[npc?.id] ||
      (npc?.isGenerated
        ? `【${npc?.chineseName || '新朋友'} (${npc?.koreanName || ''}) · ${npc?.role || '动态结识的伙伴'}】
- 真实性格核心：${npc?.personality || npc?.description || '个性独特鲜活，富有反差魅力'}
- 初识背景与情境：${npc?.initialImpression || '在首尔街头偶遇相识'}（结识于高${npc?.encounterWeek ? `第${npc.encounterWeek}周` : ''}，地点：${npc?.encounterLocation || ''}）
- 独特口癖与称呼习惯：${npc?.speakingStyle || '自然鲜活的年轻人口语'}
- 人设约束：严格沿用上述口癖与性格核心，与李秀妍进行自然亲切的聊天！`
        : npc?.description || '');
    const mbti = npc?.mbti || '真实鲜活的韩国女高中生';
    const interests =
      Array.isArray(npc?.interests) && npc.interests.length > 0
        ? npc.interests.join('、')
        : '校园日常与首尔潮流生活';
    const currentFav = typeof npc?.favorability === 'number' ? npc.favorability : 60;
    const currentRomance = typeof npc?.romancePoints === 'number' ? npc.romancePoints : 0;
    const stage = npc?.relationshipStage || '朋友';
    const nickname = npc?.nicknameToPlayer || '秀妍';
    const speakingStyle = npc?.speakingStyle || '青春口语、有生活细节与情绪波动';
    const forbiddenList = Array.isArray(npc?.forbiddenWords) && npc.forbiddenWords.length > 0
      ? npc.forbiddenWords.join('、')
      : '请问有什么可以帮您、作为人工智能、好的呢、尊敬的用户';

    let attitudeDesc = '平淡而客气地保持社交距离';
    if (npc?.attitudeByAffection) {
      if (currentFav < 30) attitudeDesc = npc.attitudeByAffection.low || attitudeDesc;
      else if (currentFav < 70) attitudeDesc = npc.attitudeByAffection.mid || attitudeDesc;
      else attitudeDesc = npc.attitudeByAffection.high || attitudeDesc;
    } else {
      if (currentFav >= 70) attitudeDesc = '十分依赖与偏爱，展现内心真实脆弱与占有欲';
      else if (currentFav >= 30) attitudeDesc = '损友互怼，亲切自然，随性吐露心事';
      else attitudeDesc = '稍微害羞拘谨，保持客气界限';
    }

    const memoryKeywordsList =
      Array.isArray(npc?.memoryKeywords) && npc.memoryKeywords.length > 0
        ? npc.memoryKeywords.join('、')
        : '初识阶段';

    const memoryList =
      Array.isArray(memories) && memories.length > 0
        ? memories.slice(-10).map((m: string) => `- ${m}`).join('\n')
        : '- 暂无特别记录，今天是熟悉起来的日常校园生活。';

    const historyText =
      Array.isArray(history) && history.length > 0
        ? history
            .slice(-8)
            .map(
              (m: { sender: string; text: string; actionDesc?: string }) =>
                `${m.sender === 'user' ? '李秀妍' : npc.chineseName}${m.actionDesc ? `(${m.actionDesc})` : ''}: ${m.text}`
            )
            .join('\n')
        : '（刚刚走近开始搭话）';

    const systemPrompt =
      req.body.systemPromptOverride ||
      `${NPC_CHAT_LIVING_PERSONA_RULES}

${ANTI_AI_STYLE_RULES}

【一、强制前置读取：角色人设卡、专属记忆区（memories）与当前时空】
- 角色姓名：${npc?.chineseName}（${npc?.koreanName}）
- 角色身份：${npc?.role}
- 角色背景与性格注释（仅供行为转化，严禁复读标签）：${persona}
- 对李秀妍的称呼习惯：【${nickname}】
- 说话方式与口癖：${speakingStyle}
- 严禁出现的客服与元词汇：[ ${forbiddenList} ]
- 当前好感度与关系阶段：【${stage}】（好感 ${currentFav}/100，心动 ${currentRomance}，当前态度：${attitudeDesc}）
- 当前时间：${timeContext || '课间休息'}
- 当前地点：${location || '2楼走廊'}
- 与玩家的专属记忆区（memories）：
${memoryList}`;

    const userPrompt = `【刚才的对话上下文】
${historyText}

【李秀妍刚刚发消息说】
“${userMessage}”

请严格遵循【核心语气与活人感十条铁律】：
1. 严禁复述李秀妍刚刚说的话！直接自然接话。
2. 严禁写长篇作文！将回复拆分为 1~3 条简短口语气泡放入 \`replies\` 数组，每条气泡控制在 5~22 字以内。
3. 语气必须平等、温和、尊重，禁止居高临下、威胁、痞气、轻佻或强行总结。

必须严格返回如下 JSON 格式：
{
  "replies": ["短句气泡1（5-20字）", "短句气泡2（5-20字，可选）"],
  "reply": "短句气泡用换行连接后的台词",
  "innerThought": "角色此刻温和真实的私密心声（12-28字）",
  "actionDesc": "自然细腻的微动作或神态（12-25字）",
  "newMemory": "若聊到重要约定或心事则总结成一句话，否则填 \"\"",
  "extractedKeywords": ["1-2个记忆标签"],
  "favorabilityDelta": 5,
  "moodDelta": 5,
  "socialDelta": 3,
  "suggestedReplies": [
    "自然短句回复1",
    "自然短句回复2",
    "自然短句回复3"
  ]
}`;

    try {
      const client = getGenAIClient();
      if (client) {
        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                replies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '拆分为1-3条5-20字的即时通讯短句气泡',
                },
                reply: { type: Type.STRING },
                innerThought: { type: Type.STRING },
                actionDesc: { type: Type.STRING },
                newMemory: { type: Type.STRING },
                extractedKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '从对话中提取的1-2个记忆关键词标签',
                },
                favorabilityDelta: { type: Type.INTEGER },
                moodDelta: { type: Type.INTEGER },
                socialDelta: { type: Type.INTEGER },
                suggestedReplies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'replies',
                'reply',
                'innerThought',
                'actionDesc',
                'newMemory',
                'extractedKeywords',
                'favorabilityDelta',
                'moodDelta',
                'socialDelta',
                'suggestedReplies',
              ],
            },
          },
        });
        const text = response.text || '{}';
        const parsed = sanitizeAntiAIResponse(JSON.parse(text));
        const bubbles = splitNpcReplyIntoBubbles(parsed.reply || '', parsed.replies, userMessage);
        res.json({
          ...parsed,
          replies: bubbles,
          reply: bubbles.join('\n'),
        });
        return;
      }
    } catch (_error: any) {
      handleGenAIError(_error);
    }

    // Try Live AI OpenAI-compatible LLM when Gemini token scope is restricted
    const liveAIResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (
      liveAIResult &&
      ((typeof liveAIResult.reply === 'string' && liveAIResult.reply.trim().length > 0) ||
        (Array.isArray(liveAIResult.replies) && liveAIResult.replies.length > 0))
    ) {
      const bubbles = splitNpcReplyIntoBubbles(liveAIResult.reply || '', liveAIResult.replies, userMessage);
      res.json({
        replies: bubbles,
        reply: bubbles.join('\n'),
        innerThought: liveAIResult.innerThought || '看着秀妍说话的样子，心情不自觉变好了。',
        actionDesc: liveAIResult.actionDesc || `${npc?.chineseName}温和地注视着你的眼睛`,
        newMemory: liveAIResult.newMemory || '',
        extractedKeywords:
          Array.isArray(liveAIResult.extractedKeywords) && liveAIResult.extractedKeywords.length > 0
            ? liveAIResult.extractedKeywords.slice(0, 3)
            : [`${location}日常`],
        favorabilityDelta: typeof liveAIResult.favorabilityDelta === 'number' ? liveAIResult.favorabilityDelta : 5,
        moodDelta: typeof liveAIResult.moodDelta === 'number' ? liveAIResult.moodDelta : 5,
        socialDelta: typeof liveAIResult.socialDelta === 'number' ? liveAIResult.socialDelta : 3,
        suggestedReplies:
          Array.isArray(liveAIResult.suggestedReplies) && liveAIResult.suggestedReplies.length > 0
            ? liveAIResult.suggestedReplies.slice(0, 3)
            : [
                '哈哈，我也是这么想的',
                '那我们放学后一起去圣水洞逛逛吧？',
                '待会儿下节课见咯',
              ],
      });
      return;
    }

    const fallbackResult = buildContextualChatFallback({
      npc,
      userMessage,
      location: location || '2楼走廊',
      timeContext: timeContext || '10:15 课间',
      stats,
      memories: memories || [],
    });

    const topicKeyword = /数学|考试|模拟考|作业|题/.test(userMessage)
      ? '考点答疑'
      : /吃|面包|草莓|年糕|咖啡/.test(userMessage)
      ? '美食分享'
      : /舞台|练习生|舞蹈|唱歌|爱豆/.test(userMessage)
      ? '练习室特训'
      : /困|累|睡|休息/.test(userMessage)
      ? '课间小憩'
      : `${location}闲谈`;

    res.json({
      ...fallbackResult,
      extractedKeywords: [topicKeyword, `${npc?.chineseName}的心事`],
    });
  });

  // 1.5 KakaoTalk Live Class/Idol Group Chat AI Endpoint
    // 1.2 Global Dynamic Narrative Generator (Choice Outcomes, Part-time Jobs, Mentor Feedback)
  app.post('/api/ai/narrative', async (req, res) => {
    const {
      sceneType = 'general',
      playerName = '李秀妍',
      stats,
      actionName = '',
      choiceText = '',
      npc,
      agencyName = 'K-POP企划社',
      location = '校园',
      timeContext = '平常的一天',
      customPrompt = '',
    } = req.body;

    let systemPrompt = '';
    let userPrompt = '';

    if (sceneType === 'choice_option') {
      systemPrompt = `你正在扮演《韩国女高模拟器》的写实派剧情编剧。
玩家【${playerName}】在【${location}】面临了一个抉择并做出了选择：“${choiceText}”。
请生成一段富有画面感、心理活动与现场代入感的情境后续微描写（50-80字），并给出主角后续的短台词或周边反响。
绝对禁止客观说明文和AI腔，必须用有质感、有呼吸感的青春剧叙事笔触。`;
      userPrompt = `抉择动作：“${choiceText}”，地点：${location}。${npc ? `涉及NPC：${npc.chineseName}(好感${npc.favorability})` : ''}。${customPrompt}`;
    } else if (sceneType === 'job_event') {
      systemPrompt = `你是《韩国女高模拟器》的兼职与打工奇遇编剧。
玩家【${playerName}】正在进行兼职活动【${actionName || '便利店兼职'}】（地点：${location}）。
请随机生成一段 50-80 字生动有趣的兼职打工现场突发事件（如在便利店被大叔认出是练习生、在咖啡馆打翻了当红爱豆的冰美式、被买便利店拉面的人要签名等）。
必须返回JSON：
{
  "title": "打工突发小插曲",
  "narrative": "50-80字兼职打工现场微描写",
  "dialogue": "现场代入台词或对话",
  "jobEvent": {
    "title": "打工奇遇",
    "encounterDesc": "具体的突发细节描写",
    "tipGained": 8000
  }
}`;
      userPrompt = `兼职项目：${actionName}，地点：${location}，时间：${timeContext}。${customPrompt}`;
    } else if (sceneType === 'endorsement_event') {
      systemPrompt = `你是《韩国女高模拟器》的商业代言与高奢拍摄现场编剧。
玩家【${playerName}】正在拍摄商业代言【${actionName || '高奢品牌代言拍摄'}】（地点：${location || '江南摄影棚'}）。
请生成一段 50-80 字的广告拍摄现场突发状况（如摄影师对眼神与表情极度挑剔要求重拍20次、片场偶遇竞争公司对手练习生暗中冷嘲热讽、或品牌高层被主角镜头表现力惊艳直呼选对人）。
必须返回JSON：
{
  "title": "代言拍摄现场纪实",
  "narrative": "50-80字广告拍摄现场突发微描写",
  "dialogue": "摄影师或品牌方/对手的现场台词",
  "jobEvent": {
    "title": "片场突发状况",
    "encounterDesc": "拍摄过程中的波折或闪光时刻",
    "tipGained": 15000
  }
}`;
      userPrompt = `代言广告：${actionName}，地点：${location}，主角形象：${stats?.appearance}。${customPrompt}`;
    } else if (sceneType === 'exam_event') {
      systemPrompt = `你是《韩国女高模拟器》的考场与大考结算微描写编剧。
玩家【${playerName}】刚刚完成了考场测试【${actionName || '全国联合模考'}】（考分：${req.body.examScore || 88}分）。
请结合考分生成一段 50-80 字现场感极强的考场微描写（如同桌试图偷瞄答题卡被监考老师瞪了回去、做完压轴数学大题交卷时全班倒吸一口凉气、答题卡涂卡笔沙沙作响等）。
必须返回JSON：
{
  "title": "考场全真微描写",
  "narrative": "50-80字考场现场气氛与考生反应微描写",
  "dialogue": "考场广播声音或同桌小声惊呼"
}`;
      userPrompt = `考试科目与名称：${actionName}，考分：${req.body.examScore}分，学业水平：${stats?.academics}。${customPrompt}`;
    } else if (sceneType === 'trainee_eval') {
      systemPrompt = `你是韩国顶级K-POP娱乐公司【${agencyName}】的资深总监兼严厉导师（例如HYBE/SM/YG/JYP风格）。
练习生【${playerName}】正在接受月度综合考核（Vocal: ${stats?.vocalSkill || 40}, Dance: ${stats?.danceSkill || 40}, Stage: ${stats?.cameraSkill || 40}, 形象: ${stats?.appearance || 50}）。
请以极其专业、针针见血、严格却充满期望的K-POP导师视角给出考核点评。
必须返回JSON：
{
  "narrative": "60-90字考核现场氛围与评委席上的严肃氛围描写",
  "mentorVerdict": {
    "mentorName": "代表总导师",
    "agencyStyle": "${agencyName} 导师标准",
    "ratingScore": 85,
    "critique": "2-3句犀利直击痛点的点评（如针对呼吸节拍、眼神抓镜头、舞蹈发力点）",
    "advice": "1句具体的训练建议"
  }
}`;
      userPrompt = `练习生：${playerName}，企划社：${agencyName}，属性：Vocal ${stats?.vocalSkill} Dance ${stats?.danceSkill} Camera ${stats?.cameraSkill}。${customPrompt}`;
    } else {
      systemPrompt = `你是《韩国女高模拟器》的校园微叙事引擎。请生成一段50-80字有氛围感、现场感的短剧情。`;
      userPrompt = `玩家：${playerName}，行动：${actionName}，地点：${location}。${customPrompt}`;
    }

    systemPrompt = `${systemPrompt}\n${ANTI_AI_STYLE_RULES}`;

    try {
      const client = getGenAIClient();
      if (client) {
        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                narrative: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                mentorVerdict: {
                  type: Type.OBJECT,
                  properties: {
                    mentorName: { type: Type.STRING },
                    agencyStyle: { type: Type.STRING },
                    ratingScore: { type: Type.NUMBER },
                    critique: { type: Type.STRING },
                    advice: { type: Type.STRING },
                  },
                },
                jobEvent: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    encounterDesc: { type: Type.STRING },
                    tipGained: { type: Type.NUMBER },
                  },
                },
                choiceFollowUp: {
                  type: Type.OBJECT,
                  properties: {
                    innerFeeling: { type: Type.STRING },
                    socialImpact: { type: Type.STRING },
                  },
                },
              },
            },
          },
        });

        if (response.text) {
          const parsed = sanitizeAntiAIResponse(JSON.parse(response.text.trim()));
          return res.json(parsed);
        }
      }

      // Live Pollinations fallback
      const fallbackData = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
      if (fallbackData) {
        return res.json(sanitizeAntiAIResponse(fallbackData));
      }
    } catch (err) {
      handleGenAIError(err);
    }

    // Default Fallback
    if (sceneType === 'job_event') {
      res.json({
        title: `${actionName} 兼职体验`,
        narrative: `在【${location}】打工期间，隔壁桌的客人认出你像是练习生并投来好奇目光。你礼貌回应并利落地整理好餐盘，得到了店长发自肺腑的夸奖。`,
        dialogue: `“小姑娘长得真漂亮，是哪家公司准备要出道的练习生吧？”`,
        jobEvent: {
          title: `收银小插曲`,
          encounterDesc: `在工作期间细心处理好了突发事务，获得了额外的顾客赞赏与小费奖励。`,
          tipGained: 6000,
        },
      });
    } else if (sceneType === 'endorsement_event') {
      res.json({
        title: `${actionName} 拍摄现场`,
        narrative: `江南摄影棚内强光闪烁，严厉的摄影师要求你在3秒内切换冷艳与甜美表情。重拍了15组后，品牌高层看着直出大片拍案叫绝！`,
        dialogue: `“对！就是这个眼神！这就是我们高奢品牌一直在寻找的少女高级感！”`,
        jobEvent: {
          title: `片场惊艳瞬间`,
          encounterDesc: `片场虽有同行竞争对手暗中挑刺，但你的顶级镜头表现力碾压全场，获得了品牌方追加奖金！`,
          tipGained: 15000,
        },
      });
    } else if (sceneType === 'exam_event') {
      res.json({
        title: `${actionName} 考场纪实`,
        narrative: `考场钟声戛然而止，答题卡涂卡笔的声音归于平静。同桌试图偷瞄你的最后压轴大题，被监考老师严厉地咳了一声瞪回去，你气定神神地下上交了试卷。`,
        dialogue: `“最后那道数学压轴几何题太难了……全班好像只有秀妍全做出来了！”`,
      });
    } else if (sceneType === 'trainee_eval') {
      res.json({
        narrative: `在【${agencyName}】主练习室闪烁的聚光灯下，导师们低头查看着你的各项评分数据，现场气氛紧张凝重。`,
        mentorVerdict: {
          mentorName: '首席考核导师',
          agencyStyle: `${agencyName} 标准`,
          ratingScore: Math.min(98, Math.round(((stats?.vocalSkill || 40) + (stats?.danceSkill || 40)) / 2 + 10)),
          critique: '整体表现有进步，发音与节拍控制比上周更加稳定，但舞台感染力和镜头抓取还需要更加自信！',
          advice: '下周重点加强舞蹈定点与大歌发力训练，保持这个冲劲！',
        },
      });
    } else {
      res.json({
        narrative: `在【${location}】，伴随着你的决定，周围的气氛泛起了一阵涟漪，一切都在朝向意料之外又情理之中的方向悄然展开……`,
        dialogue: `“既然做做出选择，那就坚定地走下去吧！”`,
      });
    }
  });

  app.post('/api/ai/group-chat', async (req, res) => {
    const { userMessage, groupType = 'class', timeContext = '放学后', systemPromptOverride } = req.body;

    const systemPrompt =
      systemPromptOverride ||
      `${NPC_CHAT_LIVING_PERSONA_RULES}
${ANTI_AI_STYLE_RULES}
你是《韩国女高模拟器》中 KakaoTalk 群聊的实时对话生成引擎。
群聊名称：${groupType === 'idol' ? '【四大社出道预备组练习生群】' : '【首尔女高 1-1班 快乐大本营】'}
群成员包括：
- 朴敏英（同桌死党，温柔体贴）
- 金智英（时尚美妆达人，活泼轻快）
- 韩素拉（认真自律的优等生，温和克制）
- 李恩宇（广播社温和学长）
- 姜海仁（女排主力，爽朗坦诚）
- 千宥娜（转学生练习生，干脆真诚）
- 尹在民（学生会长，礼貌守规）`;

    const userPrompt = `主角【李秀妍】刚刚在 KakaoTalk 群里发了一条消息：“${userMessage}”（当前时间：${timeContext}）。
请严格遵守【核心语气与活人感十条铁律】，生成 3 到 4 位不同角色的简短秒回（每条严格控制在 6~20 字以内，严禁复述李秀妍原话！），严格返回如下 JSON 格式：
{
  "messages": [
    { "npcId": "npc_2", "npcName": "金智英", "text": "6-20字简短秒回1" },
    { "npcId": "npc_1", "npcName": "朴敏英", "text": "6-20字简短秒回2" },
    { "npcId": "npc_3", "npcName": "韩素拉", "text": "6-20字简短秒回3" },
    { "npcId": "npc_6", "npcName": "千宥娜", "text": "6-20字简短秒回4" }
  ]
}`;

    const liveResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveResult && Array.isArray(liveResult.messages) && liveResult.messages.length > 0) {
      res.json({
        messages: liveResult.messages.map((m: any) => ({
          ...m,
          text: splitNpcReplyIntoBubbles(m.text || '', undefined, userMessage)[0] || m.text,
        })),
      });
      return;
    }

    res.json({
      messages: [
        {
          npcId: 'npc_2',
          npcName: '金智英',
          text: `算我一个！我现在就收拾书包准备出发~`,
        },
        {
          npcId: 'npc_1',
          npcName: '朴敏英',
          text: `哈哈智英秒回好快，需要我带相机和零食吗？`,
        },
        {
          npcId: 'npc_3',
          npcName: '韩素拉',
          text: `刚好我这节题写完了，可以跟你们一起去半小时。`,
        },
        {
          npcId: 'npc_6',
          npcName: '千宥娜',
          text: `刚从练习室出来，把定位发我吧，十分钟到。`,
        },
      ],
    });
  });

  // 1.8 AI Real-time Portrait / Avatar Image Generation Endpoint
  app.post('/api/ai/generate-avatar', async (req, res) => {
    const {
      targetId = 'protagonist',
      characterName = '李秀妍',
      customPrompt = '韩系清纯女高中生，长发，校服针织衫',
      stylePreset = 'webtoon',
      gender = 'female',
    } = req.body;

    const styleMap: Record<string, string> = {
      webtoon: 'masterpiece Korean webtoon manhwa illustration style, True Beauty manhwa aesthetic, luminous porcelain skin, expressive sparkling eyes, soft lighting',
      anime: 'high-budget Japanese-Korean anime key visual portrait, Kyoto Animation & CloverWorks lighting, glossy hair highlights, jewel anime eyes',
      idol: 'stunning 5th-gen K-pop idol concept photocard portrait, stage lighting, high-teen luxury styling, ethereal visual center',
      watercolor: 'dreamy pastel watercolor manhwa art, cherry blossom glow, delicate brush lines, romantic Korean youth aesthetic',
    };

    const styleDesc = styleMap[stylePreset] || styleMap.webtoon;
    const seed = Math.floor(10000 + Math.random() * 89999);

    // Ask Live AI to translate Chinese prompt to English keywords if needed, or combine directly
    const fullPrompt = `${styleDesc}, bust portrait of a ${gender === 'male' ? 'handsome Korean high school boy' : 'gorgeous Korean high school girl'} (${characterName}), ${customPrompt}, centered 1:1 avatar composition, ultra detailed face and eyes, no text, no watermark`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=512&height=512&seed=${seed}&nologo=true`;

    // Try downloading on server if possible, else return the direct browser-loadable URL
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8500);
      const imgRes = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 5000) {
          const outDir = path.join(process.cwd(), 'public', 'avatars');
          fs.mkdirSync(outDir, { recursive: true });
          const fileName = `ai_${targetId}_${seed}.jpg`;
          fs.writeFileSync(path.join(outDir, fileName), buf);
          res.json({
            avatarUrl: `/avatars/${fileName}`,
            remoteUrl: imageUrl,
            seed,
          });
          return;
        }
      }
    } catch (_e) {
      // If server IP is rate-limited, browser can load the Pollinations URL directly
    }

    res.json({
      avatarUrl: imageUrl,
      remoteUrl: imageUrl,
      seed,
    });
  });

  // 2. Realistic & Memory-Aware Dynamic Campus Event Generator
  app.post('/api/ai/event', async (req, res) => {
    const {
      stats,
      location,
      timeContext,
      npcs,
      recentMemories,
      gradeYear = 1,
      weekInYear = 1,
      seasonLabel = '春季学期',
      highestStat,
      lowestStat,
      featuredNpc,
      triggeredEventHistory = [],
      narrativeStyle,
      customPrompt,
      systemPromptOverride,
    } = req.body;

    const validNpcs = Array.isArray(npcs) && npcs.length > 0 ? npcs : [];
    const chosenNpc =
      featuredNpc ||
      (validNpcs.length > 0
        ? validNpcs[Math.floor(Math.random() * validNpcs.length)]
        : undefined);
    const targetNpcId = chosenNpc?.id || 'npc_1';

    const recentForbiddenList = Array.isArray(triggeredEventHistory)
      ? triggeredEventHistory.slice(-10)
      : [];

    const forbiddenPromptText =
      recentForbiddenList.length > 0
        ? `【禁止重复列表（最近10条已发生事件）】：[ ${recentForbiddenList.join(' | ')} ]。\n严禁生成与以上历史事件雷同或类似的桥段，必须根据玩家当前的周数（高${gradeYear}第${weekInYear}周）、地点（${location}）、季节（${seasonLabel}）和人际关系构思全新的戏剧冲突！`
        : `必须根据玩家当前的周数（高${gradeYear}第${weekInYear}周）、地点（${location}）、季节（${seasonLabel}）和人际关系构思全新的戏剧冲突！`;

    const npcMemStr =
      Array.isArray(chosenNpc?.memories) && chosenNpc.memories.length > 0
        ? chosenNpc.memories.slice(-5).join('；')
        : '近期在校园与首尔街头刚熟络起来';

    const memText =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories.slice(-6).join('；')
        : '新学期刚开始的日常';

    const systemPrompt =
      systemPromptOverride ||
      `你是《韩国女高模拟器》的首席校园剧集编剧。
${forbiddenPromptText}
${ANTI_AI_STYLE_RULES}`;

    const userPrompt = `【当前玩家与人际真实上下文】
- 当前周数与季节：高${gradeYear}第${weekInYear}周（${seasonLabel} · ${timeContext}）
- 当前所在地点：${location}
- 玩家最高属性：${highestStat ? `${highestStat.label}(${highestStat.value})` : `外形(${stats?.appearance || 70})`}，最低属性：${lowestStat ? `${lowestStat.label}(${lowestStat.value})` : `社团(${stats?.clubSkill || 30})`}
- 关联真实已结识 NPC：【${chosenNpc?.chineseName || '朴敏英'}】（ID: ${targetNpcId}，身份：${chosenNpc?.role || '同班同学'}，关系：${chosenNpc?.relationshipStage || '朋友'}，好感度：${chosenNpc?.favorability ?? 60}，说话风格：${chosenNpc?.speakingStyle || '自然亲切'}）
- 该 NPC 的过往共同记忆：${npcMemStr}
- 玩家近期记忆：${memText}
- 文风偏好：${narrativeStyle || '细腻写实韩剧风'}
${customPrompt ? `- 玩家特别指定剧情方向：“${customPrompt}”` : ''}

${forbiddenPromptText}
请围绕上述真实数据现场编排一段 80-120 字的突发事件剧情描写，并提供 2~3 个差异化抉择项及对应影响。必须严格返回如下 JSON 格式：
{
  "title": "全新的事件标题",
  "categoryLabel": "AI 实时推演 · 高${gradeYear}第${weekInYear}周",
  "content": "80-120字细腻写实的现场剧情描写（必须包含${chosenNpc?.chineseName || '朴敏英'}的具体互动与细节）",
  "options": [
    {
      "text": "差异化抉择1",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 6, "stamina": -4, "academics": 4, "social": 5, "appearance": 1, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 7 }
    },
    {
      "text": "差异化抉择2",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 8, "stamina": -2, "academics": 0, "social": 6, "appearance": 2, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 8 }
    },
    {
      "text": "差异化抉择3",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 4, "stamina": 4, "academics": 3, "social": 2, "appearance": 0, "coins": 0, "npcId": "${targetNpcId}", "favDelta": 4 }
    }
  ]
}`;

    try {
      const client = getGenAIClient();
      if (client) {
        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text || '{}';
        const parsed = sanitizeAntiAIResponse(JSON.parse(text));
        if (parsed && parsed.title && Array.isArray(parsed.options) && parsed.options.length > 0) {
          res.json(parsed);
          return;
        }
      }
    } catch (_error: any) {
      handleGenAIError(_error);
    }

    const liveEvent = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveEvent && liveEvent.title && Array.isArray(liveEvent.options) && liveEvent.options.length > 0) {
      res.json(sanitizeAntiAIResponse(liveEvent));
      return;
    }

    // If both AI providers fail or are offline, return 503 so frontend uses deduplicated local eventsPool fallback
    res.status(503).json({
      error: 'AI 实时推演超时或断网，切换本地去重事件兜底',
    });
  });

  // 3. Realistic AI Campus Forum / Bamboo Forest Anonymous Wall
  app.post('/api/ai/forum', async (req, res) => {
    const { stats, timeContext, recentMemories, playerPost } = req.body;

    const memText =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories.slice(-6).join('；')
        : '开学第一周日常';

    const systemPrompt =
      req.body.systemPromptOverride ||
      `你是韩国首尔女子高中与四大社练习生内部匿名论坛（Theqoo / 竹林墙风格）生成器。\n${ANTI_AI_STYLE_RULES}`;
    const userPrompt = `当前时间：${timeContext || '3月 第1周'}。高一(1)班李秀妍当前属性：学业${stats?.academics}，社交${stats?.social}，外形${stats?.appearance}，练习生等级：${stats?.traineeGrade || 'A班练习生'}，SNS粉丝${stats?.snsFollowers}。近期校园与训练真实记忆：${memText}。
${playerPost ? `李秀妍刚刚发了一条匿名帖：“${playerPost}”，请让第一条帖子是对该帖子的直接引爆热议！` : '请生成3条Theqoo风格匿名八卦热帖（如练习生考核惊艳全场、深夜汉江偶遇、出道预备役顺位预测、校园风云人物讨论）。'}
请严格返回如下 JSON 格式：
{
  "posts": [
    {
      "author": "匿名Theqoo无名氏",
      "tag": "板块标签",
      "title": "帖子标题",
      "content": "帖子正文",
      "likes": 328,
      "comments": ["1L: 热评1", "2L: 热评2", "3L: 热评3"]
    }
  ]
}`;

    const liveForum = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveForum && Array.isArray(liveForum.posts) && liveForum.posts.length > 0) {
      res.json({ posts: sanitizeAntiAIResponse(liveForum.posts.slice(0, 4)) });
      return;
    }

    const latestMem =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories[recentMemories.length - 1]
        : '高一1班与练习室的日常互动';

    const fallbackPosts = [
      ...(playerPost
        ? [
            {
              author: 'Theqoo匿名爆料人',
              tag: '🔥 实时热帖',
              title: `[热议] ${playerPost}`,
              content: `刚在匿名区刷到的热帖：“${playerPost}”，不到十分钟浏览量就破千了，评论区全在猜是不是高一(1)班的那位风云人物！`,
              likes: 426,
              comments: [
                '1L: 晕，这语气一看就是我们学校的人，前排吃瓜！',
                '2L: 听说她最近在练习室和学校两边连轴转，状态还这么绝！',
                '3L: 蹲一个后续，我已经把本帖设为特别关注了ㅋㅋㅋ',
              ],
            },
          ]
        : []),
      {
        author: '练习室监控君',
        tag: '🎤 练习生瓜',
        title: '[HOT] 高一(1)班那个练习生是谁？今天舞蹈考核直接惊艳全场！',
        content: `今天下午路过地下A级考核厅，隔着玻璃看到李秀妍跳的那段高难度卡点，连一向毒舌的首席导师都当场点头給了A+！現在Stargram粉丝已经涨到 ${stats?.snsFollowers || 1200} 了，这绝对是下一代五代女团门面预定吧？`,
        likes: 618,
        comments: [
          '1L: 大发！！我今天在走廊也看见她了，生图皮肤白到发光！',
          '2L: 千宥娜前辈好像也很看重她，经常下课后跟她一起留下来加练。',
          '3L: 趁现在还没正式出道赶紧入股，以后绝对是百万直拍神颜！',
        ],
      },
      {
        author: '汉江夜跑偶遇者',
        tag: '📸 偶遇爆料',
        title: '某人气练习生被拍到傍晚在汉江边散步？氛围感像拍韩剧一样',
        content: `刚在盘浦汉江公园买便利店拉面的时候，好像偶遇1-1班的李秀妍了（近期动态：${latestMem}）。晚风吹起校服百褶裙的样子完全就是青春电影女主角，旁边经过的路人都在偷偷回头看！`,
        likes: 492,
        comments: [
          '1L: 救命，光看文字描述就已经脑补出一整部浪漫韩剧了！',
          '2L: 金智英已经在班群里认领了，说是放学去拍人生四格顺路散步哈哈。',
          '3L: 颜值 ${stats?.appearance || 82} 分不是盖的，随便一拍都是画报级别。',
        ],
      },
      {
        author: '四大社企划情报站',
        tag: '👑 顺位预测',
        title: '[讨论] 本月出道预备役顺位预测贴 & 首尔女高校花榜更新',
        content: `综合目前的声乐（${stats?.vocalSkill || 45}）、舞蹈（${stats?.danceSkill || 45}）与学业（${stats?.academics || 75}）表现，李秀妍不仅稳居企划社月度评价上位圈，连全校模拟考内申成绩都名列前茅，韩素拉都把她当成头号劲敌！`,
        likes: 530,
        comments: [
          '1L: 颜值与实力并存的全能ACE，我投李秀妍一票！',
          '2L: 听说广播社的李恩宇学长和学生会长尹在民都对她印象超好。',
          '3L: 坐等月底公开考核舞台，已经准备好应援手幅了！',
        ],
      },
    ];

    res.json({ posts: fallbackPosts.slice(0, 4) });
  });

  // 3.2 Stargram AI Real-time NPC Comments Generator
  app.post('/api/ai/stargram-comments', async (req, res) => {
    const { caption = '', tag = '', npcs = [], stats = {}, timeContext = '今天', systemPromptOverride } = req.body || {};

    const systemPrompt =
      systemPromptOverride ||
      `${NPC_CHAT_LIVING_PERSONA_RULES}\n${ANTI_AI_STYLE_RULES}\n你是《韩国女高模拟器》中 Stargram 评论区的实时互动生成引擎。请根据动态内容生成3-4条来自好友、导师或竞争对手的8-22字简短评论，严禁复述原配文。`;
    const userPrompt = `动态标签：${tag}，配文：“${caption}”，时间：${timeContext}，粉丝数：${stats?.snsFollowers || 1000}。请返回JSON格式：{ "comments": [{ "npcName": "角色名", "text": "评论内容" }] }`;

    try {
      const ai = getGenAIClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.85,
          },
        });
        const text = response.text?.trim() || '';
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
        if (parsed && Array.isArray(parsed.comments) && parsed.comments.length > 0) {
          return res.json(parsed);
        }
      }
    } catch (err) {
      handleGenAIError(err);
    }

    const liveComments = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveComments && Array.isArray(liveComments.comments) && liveComments.comments.length > 0) {
      return res.json(sanitizeAntiAIResponse(liveComments));
    }

    const fallbackList = [
      { npcName: '金智英', text: '救命这张氛围感绝了！滤镜参数快交出来~' },
      { npcName: '朴敏英', text: '已经第一时间点赞收藏设为壁纸啦 ❤️' },
      { npcName: '千宥娜', text: '镜头表现力很稳，可以直接当出道预告照了。' },
      { npcName: '企划社声乐导师', text: '状态不错，但明天早训的开声练习别迟到。' },
    ];
    if (Array.isArray(npcs)) {
      const extraNpc = npcs.find((n: any) => n.isGenerated);
      if (extraNpc) {
        fallbackList[3] = {
          npcName: extraNpc.chineseName,
          text: '刚刷到你的新动态，今天状态看起来超好呢！',
        };
      }
    }
    return res.json({ comments: fallbackList });
  });

  // 3.3 AI Real-time Fan Bubble Private Messages Generator (/api/ai/fan-bubble)
  app.post('/api/ai/fan-bubble', async (req, res) => {
    const {
      playerName = '李秀妍',
      identityStatus = 'A班人气练习生',
      recentSchedule = '刚完成公开舞台与考核直拍录制',
      fanPersonas = ['【金牌站姐（数据女工）】', '【死忠老粉】', '【搞笑整活粉】'],
      systemPromptOverride,
    } = req.body || {};

    const systemPrompt =
      systemPromptOverride ||
      `${ANTI_AI_STYLE_RULES}
你是韩国追星应用 Bubble 的粉丝私信生成引擎。请扮演追星粉丝，结合主角【${playerName}】的当前身份状态（${identityStatus}）与最近一周行程成绩（${recentSchedule}），以 ${fanPersonas.join('、')} 的画像分类现场撰写 3 条极具饭圈真实感的私信。
要求语气充满爱意、崇拜、心疼或幽默感（包含饭圈缩写、土味情话、感叹号与颜文字），严禁使用破折号。`;

    const userPrompt = `请结合【身份状态：${identityStatus}】与【最近一周行程与成绩：${recentSchedule}】，生成 3 条粉丝私信 JSON：
{
  "messages": [
    { "fanName": "粉丝昵称", "fanRole": "金牌站姐（数据女工）", "message": "私信内容", "loyaltyGain": 15 },
    { "fanName": "粉丝昵称", "fanRole": "死忠老粉", "message": "私信内容", "loyaltyGain": 18 },
    { "fanName": "粉丝昵称", "fanRole": "搞笑整活粉", "message": "私信内容", "loyaltyGain": 14 }
  ]
}`;

    try {
      const ai = getGenAIClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.88,
          },
        });
        const text = response.text?.trim() || '';
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
        const list = Array.isArray(parsed) ? parsed : parsed?.messages;
        if (Array.isArray(list) && list.length > 0) {
          return res.json({ messages: list });
        }
      }
    } catch (err) {
      handleGenAIError(err);
    }

    const liveResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    const liveList = Array.isArray(liveResult) ? liveResult : liveResult?.messages;
    if (Array.isArray(liveList) && liveList.length > 0) {
      return res.json(sanitizeAntiAIResponse({ messages: liveList }));
    }

    return res.json(
      sanitizeAntiAIResponse({
        messages: [
          {
            fanName: `@Sooyeon_Cam0321`,
            fanRole: '金牌站姐（数据女工）',
            message: `宝！！今天「${recentSchedule}」的高清4K竖屏直拍我已经修完发推了，转赞直接破万！！(≧∇≦)ﾉ 切拜选民们都来看看我们「${identityStatus}」${playerName}的神级表情管理吧！！数据组今晚继续通宵切瓜刷音源，${playerName}只管在舞台上闪闪发光！！❤️🔥`,
            loyaltyGain: 15,
          },
          {
            fanName: `陪伴${playerName}直到世界尽头`,
            fanRole: '死忠老粉',
            message: `呜呜呜我的小公主ㅠㅠ 看到你这周为了「${recentSchedule}」连轴转，镜头拉近的时候眼底都有点红血丝了，妈妈粉心疼得眼泪狂飙(T_T) 答应我今晚一定要吃顿热乎的韩牛补补身体，不管外界怎么说，老粉永远是你最硬的底气！！💖✨`,
            loyaltyGain: 18,
          },
          {
            fanName: `今天也在为${playerName}哐哐撞大墙`,
            fanRole: '搞笑整活粉',
            message: `救命啊警察叔叔！！这里有人在「${recentSchedule}」上用美貌纵火！！(*≧ω≦) ${playerName}你知道你今天犯了什么规吗？犯了让我一眼万年的心动规！！我已经把你的Ending妖精截图贴满宿舍床头了，宿管阿姨来了都夸绝绝子哈哈哈哈！！🎉💖`,
            loyaltyGain: 14,
          },
        ],
      })
    );
  });

  // 3.4 AI Real-time Fan Bubble Reply Reaction Generator (/api/ai/fan-bubble-reply)
  app.post('/api/ai/fan-bubble-reply', async (req, res) => {
    const {
      fanName = '@Sooyeon_Cam0321',
      fanRole = '金牌站姐（数据女工）',
      previousFanMessage = '',
      playerReply = '谢谢你的支持呀❤️',
      identityStatus = 'A班人气练习生',
      recentSchedule = '舞台直拍录制',
      baseLoyaltyGain = 15,
      systemPromptOverride,
    } = req.body || {};

    const systemPrompt =
      systemPromptOverride ||
      `${ANTI_AI_STYLE_RULES}
你是追星软件 Bubble 中的粉丝【${fanName}】（身份：【${fanRole}】）。你刚给爱豆发了私信：“${previousFanMessage}”，现在本尊竟然亲自回复了你：“${playerReply}”！
请表现出狂喜、感动或语无伦次的即时反应（带感叹号与颜文字），拆分为 2-3 条短句气泡返回 JSON。`;

    const userPrompt = `爱豆当前状态：${identityStatus}，近期行程：${recentSchedule}，爱豆回复了我：“${playerReply}”。请返回JSON：{ "replies": ["气泡1", "气泡2", "气泡3"], "emotionTag": "原地狂喜", "loyaltyGain": ${baseLoyaltyGain + 5}, "followerBonus": 180 }`;

    try {
      const ai = getGenAIClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.9,
          },
        });
        const text = response.text?.trim() || '';
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
        if (parsed && Array.isArray(parsed.replies) && parsed.replies.length > 0) {
          return res.json(parsed);
        }
      }
    } catch (err) {
      handleGenAIError(err);
    }

    const liveReply = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveReply && Array.isArray(liveReply.replies) && liveReply.replies.length > 0) {
      return res.json(sanitizeAntiAIResponse(liveReply));
    }

    const isStation = String(fanRole).includes('站姐');
    const isFunny = String(fanRole).includes('整活') || String(fanRole).includes('搞笑');
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

    return res.json({
      replies: fallbackBubbles,
      emotionTag: isStation ? '站姐狂喜修图' : isFunny ? '语无伦次整活' : '死忠粉暴风感动',
      loyaltyGain: Number(baseLoyaltyGain) + 5,
      followerBonus: 180,
    });
  });

  // 3.5 AI-Assisted Trainee Survival Show, Monthly Evaluation, Fan Meeting & Debut Combat Generator
  app.post('/api/ai/trainee-mission', async (req, res) => {
    const {
      category = 'public_stage',
      stats,
      agencyName = '四大社联合选秀中心',
      customTheme = '',
      timeContext = '2025年春季赛季',
    } = req.body;

    const categoryMeta: Record<string, { label: string; channel: string }> = {
      monthly_eval: { label: '月度评测考核', channel: `${agencyName} · 地下1层A级考核厅` },
      public_stage: { label: '生存秀公演舞台', channel: 'Mnet《PRODUCE 首尔女团》一山演播厅直播' },
      fan_meeting: { label: '初披露粉丝见面会', channel: '首尔弘大/圣水洞 露天Mini Fan Meeting现场' },
      debut_combat: { label: '出道实战Showcase', channel: 'SBS《人气歌谣》& 首尔奥林匹克大厅全球直播' },
    };
    const meta = categoryMeta[category] || categoryMeta.public_stage;

    const systemPrompt = `你是韩国K-POP顶级选秀节目《PRODUCE 首尔女团》与四大社练习生养成系统的总导演。`;
    const userPrompt = `请为首尔女子高中在读练习生【李秀妍】（所属社：${agencyName}，评级：${stats?.traineeGrade}，Vocal:${stats?.vocalSkill} Dance:${stats?.danceSkill} Rap:${stats?.rapSkill} Cam:${stats?.cameraSkill}）生成一场【${meta.label}】生存秀任务！${customTheme ? `本次特别指定主题：“${customTheme}”。` : ''}
必须严格返回如下 JSON 格式：
{
  "title": "任务标题",
  "conceptTag": "#概念标签1 #概念标签2",
  "broadcastChannel": "${meta.channel}",
  "sceneDescription": "100-150字细腻真实的韩国舞台/考核/粉丝见面会场景描写",
  "mentorPrompt": "制作人导师的现场发问或考核要求",
  "liveNetizenComments": ["弹幕/站姐速报1", "弹幕/站姐速报2", "弹幕/站姐速报3"],
  "options": [
    {
      "text": "🎤 高光选择1（偏声乐）",
      "focusStat": "vocalSkill",
      "focusLabel": "声乐 Vocal 爆发",
      "baseScoreBonus": 32,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 15, "snsFollowers": 6500, "coins": 60000, "vocalSkill": 8, "danceSkill": 4, "rapSkill": 3, "cameraSkill": 6, "mood": 12, "social": 8, "appearance": 3 }
    },
    {
      "text": "💃 高光选择2（偏刀群舞）",
      "focusStat": "danceSkill",
      "focusLabel": "舞蹈 Dance 统治力",
      "baseScoreBonus": 32,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 15, "snsFollowers": 6200, "coins": 60000, "vocalSkill": 4, "danceSkill": 9, "rapSkill": 4, "cameraSkill": 6, "mood": 12, "social": 8, "appearance": 3 }
    },
    {
      "text": "📸 高光选择3（偏直拍与宠粉）",
      "focusStat": "cameraSkill",
      "focusLabel": "镜头感 Camera 绝杀",
      "baseScoreBonus": 33,
      "mentorVerdict": "制作人当场亮分点评",
      "fanReaction": "粉丝与韩网热搜反响",
      "effect": { "traineeProgress": 16, "snsFollowers": 8000, "coins": 65000, "vocalSkill": 4, "danceSkill": 4, "rapSkill": 3, "cameraSkill": 10, "mood": 14, "social": 10, "appearance": 5 }
    }
  ]
}`;

    const liveMission = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveMission && liveMission.title && Array.isArray(liveMission.options) && liveMission.options.length > 0) {
      res.json({
        id: `ai_tr_${Date.now()}`,
        category,
        categoryLabel: meta.label,
        isAIGenerated: true,
        ...liveMission,
      });
      return;
    }

    const themePrefix = customTheme ? `「${customTheme}」· ` : '';
    res.json({
      id: `ai_tr_${Date.now()}`,
      category,
      categoryLabel: meta.label,
      isAIGenerated: true,
      title: `${themePrefix}${agencyName} · ${meta.label}高光舞台对决`,
      conceptTag: `#${meta.label} #百万直拍诞生 #全开麦实力认证`,
      broadcastChannel: meta.channel,
      sceneDescription: `聚光灯骤然亮起，摄像机红灯锁定舞台中央的你。${customTheme ? `围绕“${customTheme}”的概念舞台正式拉开帷幕，` : ''}台下导师席与站姐的长枪短炮都在屏息等待你的第一个动作。`,
      mentorPrompt: '总制作人拿着麦克风：“李秀妍，把你这段时间汗水打磨出的真正实力展现出来吧！”',
      liveNetizenComments: [
        '【前线速报】李秀妍今天一上台气场全开，生图颜值简直是人间芭比！',
        '【实时弹幕】全开麦气息稳得像吃CD一样，这实力不C位出道天理难容！',
        '【韩网热帖】她的直拍链接已经在推特转疯了！！',
      ],
      options: [
        {
          text: '🎤 爆发高音杀手锏：在副歌最高潮直接升Key飙出清亮三段高音！',
          focusStat: 'vocalSkill',
          focusLabel: '声乐 Vocal 爆发',
          baseScoreBonus: 32,
          mentorVerdict: '总制作人起立鼓掌：“无可挑剔的CD级全开麦！直接晋升A+顺位！”',
          fanReaction: '高音消音视频在韩网Pann疯传，网友惊呼“五代第一大主唱诞生了”！',
          effect: {
            traineeProgress: 15,
            snsFollowers: 6800,
            coins: 65000,
            vocalSkill: 8,
            danceSkill: 4,
            rapSkill: 3,
            cameraSkill: 5,
            mood: 12,
            social: 8,
            appearance: 3,
          },
        },
        {
          text: '💃 极致刀群舞控场：卡准每一个鼓点重拍，在间奏加入高难度Dance Break！',
          focusStat: 'danceSkill',
          focusLabel: '舞蹈 Dance 统治力',
          baseScoreBonus: 32,
          mentorVerdict: '首席编舞导师连画三个S：“连发丝都在卡点！舞台支配力满分！”',
          fanReaction: '练习室与舞台对比直拍突破百万播放，海外K-POP粉疯狂刷屏安利！',
          effect: {
            traineeProgress: 15,
            snsFollowers: 6500,
            coins: 60000,
            vocalSkill: 3,
            danceSkill: 9,
            rapSkill: 4,
            cameraSkill: 6,
            mood: 12,
            social: 8,
            appearance: 3,
          },
        },
        {
          text: '📸 钓系镜头叙事：在尾声对主机位抛出飞吻+仙女落泪Ending妖精定格！',
          focusStat: 'cameraSkill',
          focusLabel: '镜头感 Camera 绝杀',
          baseScoreBonus: 33,
          mentorVerdict: '视觉总监激动拍桌：“天生的偶像圣体！短短三分钟把舞台演成了电影！”',
          fanReaction: '“李秀妍传奇Ending妖精”动图被转发上万次，直拍人气断层登顶！',
          effect: {
            traineeProgress: 16,
            snsFollowers: 8500,
            coins: 70000,
            vocalSkill: 4,
            danceSkill: 4,
            rapSkill: 3,
            cameraSkill: 10,
            mood: 14,
            social: 10,
            appearance: 5,
          },
        },
      ],
    });
  });

  // 4. OpenAI-Compatible Custom API Proxy
  app.post('/api/ai/custom-proxy', async (req, res) => {
    try {
      const { baseUrl, apiKey, model, messages, temperature, jsonMode } = req.body;
      if (!baseUrl || !apiKey) {
        res.status(400).json({ error: '缺少自定义 API 地址或密钥' });
        return;
      }

      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = cleanUrl.endsWith('/chat/completions')
        ? cleanUrl
        : `${cleanUrl}/chat/completions`;

      const payload: Record<string, any> = {
        model: model || 'gpt-4o-mini',
        messages,
        temperature: temperature ?? 0.85,
      };
      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        res.status(upstream.status).json({
          error: data?.error?.message || `上游 API 返回错误 (${upstream.status})`,
        });
        return;
      }

      const content = data?.choices?.[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({
        error: error?.message || '连接自定义 API 失败',
      });
    }
  });

  // Specialized AI story generator for Post-High School Life Paths (Idol, University & Career, Chaebol Wife)
  app.post('/api/ai/lifepath-story', async (req, res) => {
    try {
      const {
        pathType = 'idol',
        actionTitle = '推进新篇章',
        contextInfo = '',
        protagonistName = '李秀妍',
      } = req.body;

      const roleDescMap: Record<string, string> = {
        idol: 'K-Pop 顶流女团 C 位兼全能 ACE 爱豆',
        university: '首尔大学名门精英女性（法学/政界/律所/学者，结婚生子平衡事业家庭）',
        chaebol: '汉南洞顶级财阀豪门少奶奶 / 清潭洞名媛领袖（掌控百亿家族信托、精英育儿、贵妇护肤）',
      };

      const systemPrompt = `你是韩国顶级剧集（如《顶楼》《眼泪女王》《制作人》《天空之城》）编剧与 Webtoon 剧情主笔。
正在撰写主角【${protagonistName}】在人生进阶篇章【${roleDescMap[pathType] || '成年篇章'}】中的精彩故事与突发剧情。
请结合真实且极具质感的韩国社会与圈层细节（如打歌节目一位安可、Melon音源破表、SKY名门校园、大峙洞私塾、清潭洞水光管理、汉南洞豪门家宴等），生动描写。
必须严格返回如下 JSON 格式：
{
  "title": "篇章剧情标题",
  "story": "120-220字极具沉浸感、韩漫/韩剧质感的剧情细节描写",
  "headline": "韩网热搜/新闻头条（带热搜序号或大字报）",
  "netizenReactions": ["韩网热评1", "推特/论坛热帖2", "圈内名流/粉丝评价3"],
  "statSummary": "属性变动简报（如：粉丝+25万 / 家族威望+5 / GPA稳居上位圈）"
}`;

      const userPrompt = `主角行动：【${actionTitle}】
当前背景数据与现状：
${contextInfo}
请生成本次行动引发的精彩故事剧情、社交圈反响与头条新闻。`;

      const liveResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
      if (liveResult && liveResult.title && liveResult.story) {
        res.json({ success: true, ...liveResult });
        return;
      }

      // Contextual high-quality fallbacks
      const fallbackMap: Record<string, any> = {
        idol: {
          title: `闪耀聚光灯 · ${actionTitle}`,
          story: `首尔高尺巨蛋两万名粉丝挥舞着专属应援棒，全场化为粉紫色璀璨星海。${protagonistName}在终章安可舞台上摘下耳返，以无可挑剔的三段高音和全开麦清唱引爆全场尖叫，汗水滑过精致下颌，向全世界宣告新一代 K-Pop 女帝的加冕。`,
          headline: `[BREAKING] ${protagonistName} 个人舞台全球直拍播放量最快破千万！韩网叹服“天生巨星”`,
          netizenReactions: [
            '这全开麦消音直拍简直是在耳边开CD，实力断层第一！',
            '从首尔女高时期关注到现在，秀妍真的成为了闪闪发光的大明星 😭',
            '推特全球趋势第一！各奢牌公关争相送花篮到后台！',
          ],
          statSummary: '全球粉丝 +180,000 · 音源 Melon 稳居第1 · 商业代言价值飙升',
        },
        university: {
          title: `名门荣光 · ${actionTitle}`,
          story: `首尔大学百年礼堂庄严肃穆，阳光穿透彩绘玻璃映照在${protagonistName}挺拔的学者长袍上。面对来自司法界与政商界的资深评委，她以无可辩驳的法理逻辑与清晰洞察完美作答，全场起立鼓掌。在事业顶峰与温馨家庭之间，她展现着属于新时代精英女性的从容。`,
          headline: `[专访] 从首尔女高考神到首尔地检首席精英：兼顾家庭与顶尖事业的传奇人生`,
          netizenReactions: [
            '智性恋天花板！这才是真正的大女主剧本！',
            '一边在专业领域雷厉风行，一边把家庭生活经营得温馨美满，太令人羡慕了。',
            '高中时期就是传说级学霸，走到哪里都是最优秀的那个。',
          ],
          statSummary: '声誉 Prestige +8 · 年薪与学术资历晋升 · 家庭幸福度满溢',
        },
        chaebol: {
          title: `汉南洞权势 · ${actionTitle}`,
          story: `汉南洞私密官邸内水晶吊灯流光溢彩，清潭洞名媛与政商贵妇们纷纷簇拥在${protagonistName}身旁。经过顶级院长私享皮肤管理，她的肌肤宛如冷白羊脂玉般通透，举手投足间戴着传世珠宝，谈笑间轻描淡写敲定数十亿慈善基金去向，豪门女主人的从容气场震慑全场。`,
          headline: `[财界名媛周刊] 汉南洞少奶奶${protagonistName}主办年度顶级慈善晚宴，掌控家族核心理事话语权`,
          netizenReactions: [
            '气质完全是清冷贵妇天花板，站在人群里就是全场焦点！',
            '听闻大峙洞顶级私塾名师全是她亲自筛选，继承人培养得也是顶尖精英。',
            '从容优雅，深得财阀家族长辈器重，真正的豪门掌舵人。',
          ],
          statSummary: '清潭洞名媛声望 +10 · 家族地位更上层楼 · 容貌逆龄水润',
        },
      };

      res.json({ success: true, ...(fallbackMap[pathType] || fallbackMap.idol) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || '生成人生剧情失败' });
    }
  });

  // 11. AI Dynamic NPC Encounter Generator Endpoint (Gemini -> OpenAI LLM -> 5 Curated Local Fallbacks)
  app.post('/api/ai/generate-encounter', async (req, res) => {
    try {
      const { playerContext } = req.body || {};
      const {
        actionId = 'act_study_class',
        actionName = '校园日程',
        actionCategory = '校园生活',
        dayName = '今天',
        weekInYear = 1,
        gradeYear = 1,
        location = '',
      } = playerContext || {};

      const loc = getEncounterLocationByAction(actionId, location);

      const systemPrompt = `你正在为网页模拟游戏《韩国女高模拟器》担任游戏导演与角色设定主笔。
玩家李秀妍当前正处于高${gradeYear}第${weekInYear}周（${dayName}），正在进行日程：【${actionName}】（类别：${actionCategory}，发生地点：${loc}）。

请现场即兴生成一个富有韩国真实当代校园或都市流行娱乐特色的【全新偶遇人物 (Dynamic NPC Encounter)】！
人物必须鲜活、接地气、具有韩漫人物的反差萌与记忆点（例如：隔壁校乐队吉他手/竞争公司C班练习生/便利店打工前辈/圣水洞买手店咖啡师/大峙洞并肩刷题的学姐/街舞工作室踢馆舞者）。

必须严格以合法 JSON 对象格式返回，绝不包含任何 markdown 代码块标记，不要额外说明文字：
{
  "name": "随机韩文名（带中文译名，例如：崔宥真 (최유진)）",
  "chineseName": "中文译名（如：崔宥真）",
  "koreanName": "纯韩文名（如：최유진）",
  "identity": "身份设定（如：隔壁校乐队吉他手 / 竞争娱乐社C班练习生 / 便利店打工前辈）",
  "personality": "性格核心（如：表面冷淡其实是重度猫奴 / 元气但容易自卑 / 慵懒知性的胶片控）",
  "speakingStyle": "独特的口癖与称呼习惯（如：习惯短句反问，偶尔带一句傲娇的“呀……”）",
  "avatarSeed": "头像种子（从以下分类中选最贴合的：female_guitarist | male_trainee | female_cafe_senior | male_skater | female_study_cram | female_dance_rival | male_film_director | female_art_prep）",
  "encounterStory": "相遇时的微情境短文（50-80字，如借伞、抢最后一盒草莓牛奶、练习室撞衫、耳机线缠绕等富有生活画面的瞬间）",
  "encounterLocation": "${loc}",
  "choices": [
    { "text": "主动交换 KakaoTalk 认识一下", "action": "ADD_FRIEND" },
    { "text": "微笑点头，擦肩而过", "action": "IGNORE" }
  ]
}
${ANTI_AI_STYLE_RULES}`;

      const userPrompt = `请在【${loc}】围绕玩家刚刚进行的【${actionName}】日程，即兴生成一位全新的偶遇 NPC，严格返回纯 JSON。`;

      // 1. Try Gemini Client (gemini-3.8-flash)
      const ai = getGenAIClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.9,
            },
          });
          const text = response.text?.trim() || '';
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
          if (parsed.name && parsed.identity && parsed.encounterStory) {
            if (!parsed.avatarUrl) {
              parsed.avatarUrl = getAvatarForSeed(parsed.avatarSeed);
            }
            if (!parsed.encounterLocation) {
              parsed.encounterLocation = loc;
            }
            return res.json(parsed);
          }
        } catch (err) {
          handleGenAIError(err);
        }
      }

      // 2. Try Live OpenAI Compatible fallback
      try {
        const liveData = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
        if (liveData && liveData.name && liveData.identity && liveData.encounterStory) {
          if (!liveData.avatarUrl) {
            liveData.avatarUrl = getAvatarForSeed(liveData.avatarSeed);
          }
          if (!liveData.encounterLocation) {
            liveData.encounterLocation = loc;
          }
          return res.json(sanitizeAntiAIResponse(liveData));
        }
      } catch (_e) {}

      // 3. Fallback to 5 curated local presets
      const randIdx = Math.floor(Math.random() * DYNAMIC_NPC_FALLBACK_PRESETS.length);
      const preset = DYNAMIC_NPC_FALLBACK_PRESETS[randIdx];
      const fallbackData = sanitizeAntiAIResponse({
        ...preset,
        encounterLocation: loc || preset.encounterLocation,
      });
      return res.json(fallbackData);
    } catch (err: any) {
      // Guaranteed safety: return local preset 0
      const safeFallback = sanitizeAntiAIResponse(DYNAMIC_NPC_FALLBACK_PRESETS[0]);
      return res.json(safeFallback);
    }
  });

  // 12. AI Briefing (/summary) Endpoint based on NPC memories field
  app.post('/api/ai/npc-summary', async (req, res) => {
    try {
      const { npc, memories, timeContext } = req.body || {};
      const cName = npc?.chineseName || '伙伴';
      const role = npc?.role || '同学';
      const stage = npc?.relationshipStage || '朋友';
      const fav = npc?.favorability ?? 50;
      const memList: string[] =
        Array.isArray(memories) && memories.length > 0
          ? memories
          : Array.isArray(npc?.memories)
          ? npc.memories
          : [];
      const memText =
        memList.length > 0
          ? memList.map((m, idx) => `${idx + 1}. ${m}`).join('\n')
          : `初识于${npc?.encounterLocation || '首尔女子高中'}，身份为${role}，性格：${npc?.personality || npc?.description || '温柔鲜活'}`;

      const systemPrompt = `你是《韩国女高模拟器》中的【简报 AI（Briefing AI）】。
请严格基于当前 NPC【${cName}】（身份：${role}，当前关系阶段：${stage}，好感度：${fav}/100，性格：${npc?.personality || npc?.description || ''}）的 \`memories\` 字段记录，生成一份关于该 NPC 对玩家（李秀妍）的真实看法以及两人过去共同经历的 100 字左右总结。
要求：
1. 字数控制在 85~115 字左右（约 100 字），文风细腻且富有青春纪实感。
2. 既要概括两人过去共同经历的关键记忆，也要点出该 NPC 目前对李秀妍的内心真实看法与羁绊温度。
3. 必须严格返回纯 JSON 对象：
{
  "impressionTitle": "四到十字的印象标题（如：并肩追光的温暖同桌）",
  "summary": "约100字的共同经历回顾与NPC对玩家看法总结",
  "bondEvaluation": "一句话关系评语"
}
${ANTI_AI_STYLE_RULES}`;

      const userPrompt = `当前时间：${timeContext || '首尔女高学期中'}
NPC【${cName}】的 memories 共同记忆列表：
${memText}
请生成 100 字左右的【简报 AI】总结，严格返回纯 JSON。`;

      // 1. Try Gemini
      const ai = getGenAIClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.75,
            },
          });
          const text = response.text?.trim() || '';
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
          if (parsed && parsed.summary) {
            return res.json(parsed);
          }
        } catch (err) {
          handleGenAIError(err);
        }
      }

      // 2. Try Live OpenAI Compatible LLM
      try {
        const liveData = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
        if (liveData && liveData.summary) {
          return res.json(sanitizeAntiAIResponse(liveData));
        }
      } catch (_e) {}

      // 3. Deterministic 100-word synthesis fallback based on memories
      const recentMems = memList
        .slice(-3)
        .map((m) => m.replace(/^\[[^\]]+\]\s*/, ''))
        .join('；');
      const attitude =
        fav >= 75
          ? '早已将秀妍视为心底最耀眼、最无可替代的特别之人，每次并肩都满怀偏爱与默契'
          : fav >= 50
          ? '对秀妍充满欣赏与信赖，觉得有她在身边的时光总是格外安心明朗'
          : '对秀妍抱有温暖的好感与好奇，期待在接下来的青春岁月里写下更多故事';

      return res.json({
        impressionTitle: `${cName}的羁绊简报 · ${stage}`,
        summary: `翻开与【${role}】${cName}的共同回忆：${
          recentMems || `从初识相遇的那一刻起，两人便在首尔校园开启了独特的缘分`
        }。随着好感度升至 ${fav}%，在${cName}眼中，${attitude}。`,
        bondEvaluation: `共收录 ${memList.length} 条专属记忆 · 关系阶段【${stage}】`,
      });
    } catch (_err) {
      return res.json({
        impressionTitle: '青春羁绊简报',
        summary: '两人从初次相识一路走来，在校园与首尔街头留下了许多温暖的共同回忆，彼此间的默契与信任正在悄然升温。',
        bondEvaluation: '羁绊持续升温中',
      });
    }
  });

  // 10. Action Interactive Event + 3 Choices + Causal Narrative Generator
  app.post('/api/ai/action-event', async (req, res) => {
    const {
      actionCategory = 'map_explore',
      actionName = '校园探索',
      location = '首尔女高',
      stats = {},
      npc,
      baseDeltas = {},
      baseFavDelta = 0,
      timeContext = '首尔女高学期中',
      systemPromptOverride,
    } = req.body || {};

    const npcName = npc?.chineseName || '朴敏英';
    const npcRole = npc?.role || '同班同学';
    const systemPrompt =
      systemPromptOverride ||
      `你是《韩国女高模拟器》的首席互动叙事导演。\n${ANTI_AI_STYLE_RULES}\n请为玩家在【${location}】进行的【${actionName}】生成一段60-100字极具画面感与冲突感的现场突发剧情描写，并提供3个不同性格倾向（激进表现 / 稳妥配合 / 摸鱼偷懒）的应对选项及因果后续微描写。`;
    const userPrompt = `时间：${timeContext}，地点：${location}，正在执行：【${actionName}】（类别：${actionCategory}），在场NPC：${npcName}（${npcRole}）。请严格输出JSON对象（含 title, sceneDescription, choices 数组）。`;

    try {
      const ai = getGenAIClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.85,
            },
          });
          const text = response.text?.trim() || '';
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = sanitizeAntiAIResponse(JSON.parse(cleaned));
          if (parsed && parsed.sceneDescription && Array.isArray(parsed.choices) && parsed.choices.length >= 2) {
            return res.json(parsed);
          }
        } catch (err) {
          handleGenAIError(err);
        }
      }

      try {
        const liveData = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
        if (liveData && liveData.sceneDescription && Array.isArray(liveData.choices) && liveData.choices.length >= 2) {
          return res.json(sanitizeAntiAIResponse(liveData));
        }
      } catch (_e) {}

      return res.json(
        buildLocalActionInteractiveFallback({
          actionCategory,
          actionName,
          location,
          npc,
          baseDeltas,
          baseFavDelta,
        })
      );
    } catch (_err) {
      return res.json(
        buildLocalActionInteractiveFallback({
          actionCategory,
          actionName,
          location,
          npc,
          baseDeltas,
          baseFavDelta,
        })
      );
    }
  });

  // Fetch models from custom OpenAI-compatible API endpoint
  app.post('/api/ai/models', async (req, res) => {
    try {
      const { baseUrl, apiKey } = req.body;
      if (!baseUrl || !apiKey) {
        return res.status(400).json({ error: '请先填写 API Base URL 和 API Key' });
      }
      const cleanBaseUrl = String(baseUrl).replace(/\/+$/, '');
      const targetUrl = cleanBaseUrl.endsWith('/v1') ? `${cleanBaseUrl}/models` : `${cleanBaseUrl}/v1/models`;

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `拉取模型失败 (${response.status}): ${errText.slice(0, 100)}` });
      }

      const data = await response.json();
      let models: string[] = [];
      if (Array.isArray(data)) {
        models = data.map((m: any) => m.id || m.name || String(m));
      } else if (Array.isArray(data?.data)) {
        models = data.data.map((m: any) => m.id || m.name || String(m));
      } else if (Array.isArray(data?.models)) {
        models = data.models.map((m: any) => m.id || m.name || String(m));
      }

      res.json({ models });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || '拉取模型出错' });
    }
  });

  // 1. Download H5 Game Upload Package (for Star-letter / Lofter / H5 Platform Upload)
  app.get('/api/download-game', (_req, res) => {
    const filePath = '/tmp/h5_game_upload.zip';
    if (fs.existsSync(filePath)) {
      res.download(filePath, 'korean_high_school_simulator_h5.zip');
    } else {
      res.status(404).json({ error: 'H5 Game zip not found' });
    }
  });

  // 2. Download Full Source Code Archive Endpoint
  app.get('/api/download-source', (_req, res) => {
    const filePath = '/tmp/full_source_code.zip';
    if (fs.existsSync(filePath)) {
      res.download(filePath, 'korean_high_school_simulator_source.zip');
    } else {
      res.status(404).json({ error: 'Source archive not found' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
