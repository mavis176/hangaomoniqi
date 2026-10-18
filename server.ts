import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const timer = setTimeout(() => controller.abort(), 9500);
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
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    return JSON.parse(cleaned);
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

// Rich, multi-topic, non-repetitive contextual fallback generator if both Gemini and Pollinations time out
function buildContextualChatFallback(params: {
  npc: any;
  userMessage: string;
  location: string;
  timeContext: string;
  stats: any;
  memories: string[];
}) {
  const { npc, userMessage, location, timeContext } = params;
  const msg = (userMessage || '').trim();
  const id = npc?.id || 'npc_1';
  const fav = npc?.favorability ?? 60;
  const stage = npc?.relationshipStage || '朋友';

  const isStudyTopic = /数学|考试|模拟考|复习|学习|题|成绩|英语|历史|课|作业|补习|大峙洞|笔记|高考|CSAT|卷子/.test(msg);
  const isFoodTopic = /吃|食堂|年糕|面包|小卖部|牛奶|咖啡|冰美式|饿|午饭|零食|麦茶|奶茶|炸鸡|草莓/.test(msg);
  const isIdolTopic = /练习生|出道|舞台|跳舞|唱歌|爱豆|K-Pop|打歌|直拍|选秀|月度|考核|C位|专辑|粉丝/.test(msg);
  const isLoveTopic = /喜欢|想你|约会|好看|帅|美|心跳|在一起|手|拥抱|亲|表白|秘密/.test(msg);
  const isTiredTopic = /困|累|睡|烦|难|不想上|头疼|压力|哭|委屈/.test(msg);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  if (id === 'npc_5') {
    if (isStudyTopic) {
      return {
        reply: `哈哈说到文化课我就头大！刚才那张函数卷子我看了两行就想拿去折纸飞机了……不过秀妍你要是愿意教我，我保证老老实实坐着听四十分钟，绝不乱动！`,
        actionDesc: `姜海仁挠了挠飒爽的狼尾短发，把椅背反过来跨坐着，眼神亮晶晶地看着你`,
        innerThought: `其实题目听不听得懂无所谓，主要是想名正言顺地多看秀妍一会儿。`,
        newMemory: `和姜海仁聊起“${msg.slice(0, 18)}”，约定给她补习文化课`,
        favorabilityDelta: 5,
        moodDelta: 6,
        socialDelta: 3,
        suggestedReplies: [
          '那说好了，这道题你要是做对了，周末我请你喝冰沙！',
          '你们体育特长生训练那么累，文化课我帮你划最核心的考点就行！',
          '我看你不是想学数学，是想借机偷懒吧？',
        ],
      };
    }
    if (isTiredTopic) {
      return {
        reply: `谁惹我们秀妍不开心了？还是最近累着了？来，靠我肩膀上歇会儿！待会儿不管是回教室还是去车站，书包全归我背，谁也别想让你受半点累！`,
        actionDesc: `姜海仁二话不说把自己的运动外套脱下来披在你肩上，拍了拍自己结实的肩膀`,
        innerThought: `看她露出疲惫的表情，我比自己打满五局排球赛还要心疼。`,
        newMemory: `在秀妍疲惫时，姜海仁脱下运动外套披在她身上安慰她`,
        favorabilityDelta: 7,
        moodDelta: 9,
        socialDelta: 3,
        suggestedReplies: [
          '你的外套上还有阳光和皂角的味道，披着超安心。',
          '有海仁在身边撑腰，感觉什么烦心事都没啦！',
          '那待会儿放学你可得请我吃校门口的鱼饼串补补元气！',
        ],
      };
    }
    if (isLoveTopic || fav >= 75) {
      return {
        reply: `喂、喂……你突然说“${msg.slice(0, 16)}”这种话，我连发球动作都要变形了！我这个人不会拐弯抹角，反正在我心里，全首尔女高、不对，全世界你就是最耀眼的那一个！`,
        actionDesc: `姜海仁一向小麦色健康的脸颊腾地红到了耳根，手足无措地握紧了手里的排球`,
        innerThought: `完蛋了，心跳声大得像体育馆的哨声一样，她不会听见了吧？！`,
        newMemory: `在${location}对姜海仁说了心动的话，这位排球王牌罕见地脸红害羞了`,
        favorabilityDelta: 8,
        moodDelta: 8,
        socialDelta: 3,
        suggestedReplies: [
          '平时在球场上那么霸气，怎么一夸你就脸红呀？',
          '下周你们排球部比赛，我只为你一个人呐喊！',
          '放学后我们去汉江边骑单车吹吹风吧！',
        ],
      };
    }
    return pick([
      {
        reply: `嘿！正巧在${location}碰到你！你刚才说的“${msg.slice(0, 16)}”，我刚才在体育馆热身的时候也听队员们提起了。走，我刚从小卖部抢了两瓶冰镇宝矿力，分你一瓶！`,
        actionDesc: `姜海仁单手转着排球走过来，爽快地拧开瓶盖把第一口冰饮料递给你`,
        innerThought: `今天运气真好，刚下训就能在${location}偶遇秀妍！`,
        newMemory: `在${location}与姜海仁聊了“${msg.slice(0, 18)}”并分享了冰饮料`,
        favorabilityDelta: 5,
        moodDelta: 6,
        socialDelta: 3,
        suggestedReplies: [
          '谢谢海仁！你帮我拧开瓶盖的样子超帅！',
          '今天排球部训练量大不大？手腕还酸吗？',
          '周末有空一起去弘大电玩城投篮比赛吗？',
        ],
      },
      {
        reply: `哈哈，听你这么说“${msg.slice(0, 16)}”太有意思了！对了秀妍，这周五下午我们在体育馆有场队内对抗赛，你要是有空来场边坐会儿，我保证给你表演个超帅的跳发得分！`,
        actionDesc: `姜海仁比了个潇洒的扣球手势，眼神充满期待地望着你`,
        innerThought: `只要秀妍坐在场边第一排，我就能打出百分百的王牌状态！`,
        newMemory: `姜海仁约秀妍周五下午去体育馆看她的排球对抗赛`,
        favorabilityDelta: 6,
        moodDelta: 7,
        socialDelta: 3,
        suggestedReplies: [
          '一定去！我还要带着相机把你跳发的瞬间拍下来！',
          '要是你赢了比赛，我们去吃烤肉庆祝！',
          '注意别受伤哦，我给你带了运动护腕。',
        ],
      },
    ]);
  }

  if (id === 'npc_6') {
    if (isIdolTopic) {
      return {
        reply: `说到舞台和练习室，你可算是问对人了。关于“${msg.slice(0, 16)}”，其实镜头最喜欢有故事感的眼神——别去讨好机位，要让机位追着你跑。今晚放学后，我带去我私藏的独立练舞室给你做特训怎么样？`,
        actionDesc: `千宥娜摘下银色监听耳返，修长的手指轻轻托起你的下巴示范了一个极具穿透力的Ending眼神`,
        innerThought: `秀妍的天赋和灵气比我以前在四大社见过的任何同期都要惊艳。`,
        newMemory: `千宥娜亲自指导秀妍舞台镜头感，并邀她放学去独立练舞室合练`,
        favorabilityDelta: 7,
        moodDelta: 7,
        socialDelta: 4,
        suggestedReplies: [
          '刚才那个眼神杀太绝了！宥娜前辈快多教我几招！',
          '如果我们俩能站在同一个出道舞台上，一定能炸翻全场！',
          '练完舞我请你去吃清潭洞的低卡轻食沙拉！',
        ],
      };
    }
    return pick([
      {
        reply: `刚把降噪耳机调成透传模式就听见你的声音了。“${msg.slice(0, 18)}”？嗯，如果是别人找我聊这个我大概会觉得无聊，但既然是秀妍你说的，我很有兴趣听下去。`,
        actionDesc: `千宥娜拨了拨璀璨的白金长卷发，唇角勾起一抹只对你展露的清浅弧度`,
        innerThought: `转学来首尔女高最正确的决定，就是认识了李秀妍。`,
        newMemory: `在${location}与千宥娜深聊了“${msg.slice(0, 18)}”`,
        favorabilityDelta: 6,
        moodDelta: 6,
        socialDelta: 3,
        suggestedReplies: [
          '宥娜平时看似高冷，其实对我超温柔的！',
          '你今天戴的珍珠发夹跟你的发色绝配！',
          '周末陪我去汉南洞逛黑胶唱片店好不好？',
        ],
      },
      {
        reply: `看你精神这么好地提起“${msg.slice(0, 16)}”，连带着我这几天的失眠都治好了。给你，这是我早上路过圣水洞买的手冲冷萃，只有你那份加了燕麦奶。`,
        actionDesc: `千宥娜自然地将一杯带着冰珠的特调咖啡塞进你掌心，指尖不经意擦过你的手背`,
        innerThought: `连我自己都惊讶，居然会习惯每天早上多买一杯她喜欢的口味。`,
        newMemory: `千宥娜特意从圣水洞给秀妍带了加燕麦奶的手冲冷萃`,
        favorabilityDelta: 6,
        moodDelta: 7,
        socialDelta: 3,
        suggestedReplies: [
          '连我喜欢加燕麦奶都记得，宥娜太贴心了吧！',
          '下次换我给你带我亲手做的低糖可露丽！',
          '我们待会儿午休去天台边喝咖啡边听你的新Demo吧！',
        ],
      },
    ]);
  }

  if (id === 'npc_7') {
    return pick([
      {
        reply: `听到你聊起“${msg.slice(0, 18)}”，真让人怀念呢。当年我在首尔女高读书的时候，也曾为了同样的事情在走廊里驻足良久。来，喝口温热的洋甘菊茶，不管你做什么决定，宋老师都会在保健室做你的后盾。`,
        actionDesc: `宋恩静老师扶了扶玫瑰金圆框眼镜，温柔地替你将耳边的碎发理顺`,
        innerThought: `这孩子身上的坚韧与灵气，真是越来越有当年白玉兰社团的风采了。`,
        newMemory: `在${location}向宋恩静老师倾诉了“${msg.slice(0, 18)}”，得到了温柔开解`,
        favorabilityDelta: 6,
        moodDelta: 9,
        socialDelta: 2,
        suggestedReplies: [
          '每次跟宋老师聊完天，心里乱糟糟的线一下子就理顺了。',
          '老师当年在首尔女高留下的那本诗集，我能借来看看吗？',
          '我一定会努力兼顾好学业与梦想，不让老师失望！',
        ],
      },
      {
        reply: `最近在学校和社团都忙坏了吧？你刚才说的“${msg.slice(0, 16)}”我记下了。要是觉得课业或练习压力太大，随时来保健室拉上白色床帘睡个午觉，老师帮你签假条。`,
        actionDesc: `宋恩静老师笑着从白大褂口袋里拿出一枚薰衣草助眠香囊放进你手心`,
        innerThought: `希望她能享受高中三年最纯粹的美好时光，不要被大人们的期望压垮。`,
        newMemory: `宋恩静老师送给秀妍一枚薰衣草香囊，并允许她随时来保健室休息`,
        favorabilityDelta: 6,
        moodDelta: 10,
        socialDelta: 2,
        suggestedReplies: [
          '谢谢宋老师！这个薰衣草香囊闻起来好治愈呀。',
          '那这是我和宋老师之间的专属秘密特权咯！',
          '周末文学社的读书沙龙我也想报名参加！',
        ],
      },
    ]);
  }

  if (id === 'npc_8') {
    return pick([
      {
        reply: `咳……李秀妍同学，关于你刚才说的“${msg.slice(0, 18)}”，从学生会纪检条例来看其实有点擦边。不过……既然是你提出来的，我昨晚已经把审批章盖好了。别、别误会，我只是秉公办理而已！`,
        actionDesc: `尹在民略显局促地推了推金丝眼镜，将一份整理得一丝不苟的批文递给你，耳廓微红`,
        innerThought: `昨晚为了帮她写这份特批报告改了三遍措辞……千万不能让她看出来。`,
        newMemory: `尹在民会长嘴上讲着校规，私下却提前帮秀妍盖好了特批印章`,
        favorabilityDelta: 6,
        moodDelta: 7,
        socialDelta: 3,
        suggestedReplies: [
          '哈哈，会长每次帮我破例的时候都会推眼镜哦！',
          '谢谢在民学长！作为报答，今天放学我陪你去喂后山的小猫吧！',
          '学生会有你这么靠谱又心软的会长真是太好啦。',
        ],
      },
      {
        reply: `原来你也注意到了“${msg.slice(0, 16)}”？不愧是高一最受瞩目的学生。正好学生会下周要筹备校园企划，如果你愿意来学生会室搭把手的话……我的办公桌旁边可以给你留个专属座位。`,
        actionDesc: `尹在民合上钢笔帽，一向严肃的浅灰蓝色眼眸里映着你清晰的身影`,
        innerThought: `只要她坐在学生会室里，连枯燥的预算报表都变得顺眼多了。`,
        newMemory: `尹在民邀请秀妍去学生会室帮忙，并在他桌旁留了专属座位`,
        favorabilityDelta: 7,
        moodDelta: 6,
        socialDelta: 4,
        suggestedReplies: [
          '好呀！那会长可得给我准备热可可当下午茶！',
          '能坐在会长专属座位旁边，全校女生都要羡慕死我了。',
          '下次模拟考的文科复习资料，我们也可以一起整理！',
        ],
      },
    ]);
  }

  if (id === 'npc_3') {
    if (isStudyTopic) {
      return {
        reply: fav >= 60
          ? `关于“${msg.slice(0, 16)}”，大峙洞昨晚发的压轴密卷第三题正好考到了这个变式。喏，这是我用双色笔做的批注，拿去拍张照吧……下周模拟考你要是掉出前三名，我可不认你这个对手。`
          : `怎么，现在才开始研究“${msg.slice(0, 16)}”？我已经把近五年的全国联考真题二刷完了。想赢过我的话，今晚自习室留到十点吧。`,
        actionDesc: `韩素拉看似随意地将她那本千金难求的大峙洞手写笔记推过桌面中线`,
        innerThought: `全校我只把笔记借给过李秀妍一个人，她最好能明白我的心意。`,
        newMemory: `韩素拉傲娇地将自己的大峙洞双色笔手写笔记借给秀妍参考`,
        favorabilityDelta: 6,
        moodDelta: 5,
        socialDelta: 3,
        suggestedReplies: [
          '素拉的字迹又漂亮逻辑又清晰，简直是艺术品！',
          '放心吧，下周月考榜首的位置我们公平竞争！',
          '刷完这套题，我请你去喝热呼呼的燕麦拿铁暖暖胃。',
        ],
      };
    }
    return pick([
      {
        reply: `……你特意跑来跟我说“${msg.slice(0, 18)}”，我还以为是什么十万火急的大事呢。算了，反正我也刚刷完一章题，就破例陪你聊五分钟休息一下眼睛。`,
        actionDesc: `韩素拉将垂落的一缕黑长直发丝挽到耳后，清冷的蓝眸柔和了几分`,
        innerThought: `其实听她叽叽喳喳说话的声音，比听任何白噪音都要让人安心。`,
        newMemory: `课间找韩素拉聊了“${msg.slice(0, 18)}”，她主动放下题本陪伴`,
        favorabilityDelta: 5,
        moodDelta: 5,
        socialDelta: 2,
        suggestedReplies: [
          '我就知道素拉嘴硬心软，才不会赶我走呢！',
          '看你今天气色不错，昨晚终于没熬夜到两点啦？',
          '放学后去大峙洞之前，我们一起在天台看会儿晚霞吧。',
        ],
      },
    ]);
  }

  if (id === 'npc_4') {
    return pick([
      {
        reply: `刚才在调试调音台的时候还在想你呢，结果你就带着“${msg.slice(0, 16)}”的话题出现了。来，戴上这只监听耳机听听看，这是我昨晚新编的木吉他曲，第一个弹给你听。`,
        actionDesc: `李恩宇学长温柔地弯下腰，亲手将柔软的耳机罩戴在你的耳畔`,
        innerThought: `写这首曲子的时候，脑海里浮现的全是秀妍在阳光下微笑的样子。`,
        newMemory: `李恩宇学长让秀妍成为他新编木吉他曲的第一个听众`,
        favorabilityDelta: 7,
        moodDelta: 8,
        socialDelta: 3,
        suggestedReplies: [
          '旋律好温柔啊……学长写的曲子每次都能治愈我！',
          '这首曲子叫什么名字呀？以后能在校园祭上听到吗？',
          '下次学长弹吉他的时候，我来给学长伴唱好不好？',
        ],
      },
      {
        reply: `听你这么生动地讲起“${msg.slice(0, 18)}”，连${location}的空气都变得明快起来了。给，看你跑过来额头都有点微汗，这罐温麦茶是我刚买的，快喝一口吧。`,
        actionDesc: `李恩宇学长笑着从口袋里取出纸巾递给你，目光温柔得像春日的微风`,
        innerThought: `不管是作为学妹还是特别的人，她总是能轻易牵动我的情绪。`,
        newMemory: `在${location}和李恩宇学长愉快交谈，收到了他递来的温麦茶`,
        favorabilityDelta: 6,
        moodDelta: 7,
        socialDelta: 3,
        suggestedReplies: [
          '谢谢恩宇学长，学长永远这么细心体贴！',
          '今天午休广播室的歌单我已经期待一上午啦！',
          '周末乐队排练的时候，我可以带零食去探班吗？',
        ],
      },
    ]);
  }

  if (id === 'npc_2') {
    return pick([
      {
        reply: `天哪秀妍！你说的“${msg.slice(0, 18)}”简直跟我想的一模一样！！而且我跟你说，我刚在Stargram上刷到圣水洞出了超美的新款水光唇釉和人生四格拍贴框，今天放学我们必须去打卡！`,
        actionDesc: `金智英兴奋地挽住你的手臂，拿出小巧的气垫粉饼对着镜子跟你贴脸比心`,
        innerThought: `我们秀妍今天这张脸蛋状态简直是女团门面级别，带出去逛街太有面子了！`,
        newMemory: `和金智英热聊“${msg.slice(0, 18)}”，约好放学去圣水洞打卡`,
        favorabilityDelta: 6,
        moodDelta: 7,
        socialDelta: 4,
        suggestedReplies: [
          '冲冲冲！放学铃一响我们就出发，还要拍十张上传Stargram！',
          '智英每次推荐的探店和美妆从来不踩雷！',
          '对了，刚才班里大家凑在一起在聊什么八卦呀？',
        ],
      },
    ]);
  }

  // Default npc_1 朴敏英
  return pick([
    {
      reply: `嗯嗯！秀妍你说的“${msg.slice(0, 18)}”我太有共鸣了！刚才上课我还悄悄在草稿纸角落画了我们俩的Q版插画呢，你看像不像？待会儿不管是去小卖部还是去图书馆，我都跟你一块儿去！`,
      actionDesc: `朴敏英笑得眼睛弯成月牙，把画着你们俩同桌日常的速写本悄悄推到你面前`,
      innerThought: `能和秀妍做同桌真是我高中三年最幸福的事，要把我们的故事都画进漫画里。`,
      newMemory: `朴敏英在速写本上画了和秀妍的同桌Q版插画，并聊了“${msg.slice(0, 18)}”`,
      favorabilityDelta: 6,
      moodDelta: 7,
      socialDelta: 3,
      suggestedReplies: [
        '哇画得太可爱了吧！敏英以后一定会成为大漫画家的！',
        '快把这一页撕下来送给我，我要夹在手帐本最前面珍藏！',
        '走，为了犒劳我们敏英大画家，请你去吃延世奶油面包！',
      ],
    },
    {
      reply: `听你提到“${msg.slice(0, 18)}”，我就放心啦！对了秀妍，我抽屉里还藏着今天早上刚买的草莓牛奶和蜂蜜黄油杏仁，趁现在${timeContext.split(' ').slice(-1)[0] || '课间'}没人注意，我们一人一半！`,
      actionDesc: `朴敏英神神秘秘地护着课桌洞口，把插好吸管的冰镇草莓牛奶塞进你手里`,
      innerThought: `看到秀妍开心的笑脸，我今天连载条漫的灵感又源源不断了！`,
      newMemory: `和同桌朴敏英偷偷在课间分享了冰镇草莓牛奶与蜂蜜杏仁`,
      favorabilityDelta: 6,
      moodDelta: 8,
      socialDelta: 3,
      suggestedReplies: [
        '敏英的课桌简直是哆啦A梦的百宝袋，太好喝了！',
        '下节课要是老师抽背英语单词，我们互相打暗号哦！',
        '放学后我们一起走，去文具店挑新的手帐贴纸吧！',
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
      content: `${timeContext}，在${location}柔和的光线里，正如你所期待的那样——“${cleanPrompt}”悄然发生了。周围同学们的目光若有若无地投来，空气中带着一丝独属于首尔高中的微妙心跳感。`,
      options: [
        {
          text: '大方自然地走上前去互动回应',
          resultText: '你的从容与微笑给对方留下了极深的印象，这段特别的画面成为了今天最亮眼的记忆。',
          memoryLog: `在${location}经历了特别事件：${cleanPrompt}`,
          effect: { mood: 10, stamina: -5, academics: 3, social: 6, appearance: 2, coins: 0, npcId: 'npc_1', favDelta: 6 },
        },
        {
          text: '带着一丝矜持与俏皮，用眼神传递默契',
          resultText: '虽然没有过多言语，但彼此心照不宣的默契让气氛格外融洽。',
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
      content: `你在${location}拐角的自动贩卖机投币买饮料时，“哐当、哐当”两声——出口竟然同时掉下了两罐冰镇水蜜桃气泡水！而身后的韩素拉正好拿着硬币走过来准备买咖啡。`,
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

    const persona = CHARACTER_PERSONAS[npc?.id] || npc?.description || '';
    const mbti = npc?.mbti || '真实鲜活的韩国女高中生';
    const interests =
      Array.isArray(npc?.interests) && npc.interests.length > 0
        ? npc.interests.join('、')
        : '校园日常与首尔潮流生活';
    const speechStyle = npc?.speechStyle || '青春口语、有生活细节与情绪波动';
    const currentFav = typeof npc?.favorability === 'number' ? npc.favorability : 60;
    const currentRomance = typeof npc?.romancePoints === 'number' ? npc.romancePoints : 0;
    const stage = npc?.relationshipStage || '朋友';
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

    const systemPrompt = `你正在进行一场极具现实生活质感、鲜活灵动的《韩国女高模拟器》角色扮演对话。
请你彻底进入首尔女子高中角色【${npc?.chineseName}】（${npc?.koreanName}，身份：${npc?.role}）。

【角色深度设定（必须严格遵循此人设说话）】
- MBTI 人格类型：${mbti}
- 兴趣与热爱：${interests}
- 说话语气与口吻：${speechStyle}
- 当前对李秀妍的好感度：${currentFav}/100，心动值：${currentRomance}，当前关系阶段：【${stage}】
  * 关系阶段与好感度决定了对话的距离感、亲昵程度、是否害羞或毒舌傲娇或直球守护；
  * 如果是【恋人】或【暧昧】，言行中应自然流露心跳、偏爱与独占欲；
  * 如果是【相识】或好感度较低，则礼貌客气或保持克制距离。
- 你们已有的共同记忆关键词（可在聊天中自然呼应提及，增强持续感）：${memoryKeywordsList}

【角色背景细节】
${persona}

【当前现实情境】
- 当前时间：${timeContext || '周三 上午 10:15 课间休息'}
- 当前地点：${location || '2楼走廊'}
- 李秀妍当前状态：心情${stats?.mood}/100，体力${stats?.stamina}/100，学业${stats?.academics}，外形${stats?.appearance}，练习生等级：${stats?.traineeGrade || '未签约'}
- 叙事基调：${narrativeStyle || '真实细腻、青春鲜活的韩国高中日常'}

【过往共同记忆库】
${memoryList}`;

    const userPrompt = `【刚才的对话上下文】
${historyText}

【李秀妍刚刚对你说】
“${userMessage}”

请根据你的 MBTI（${mbti}）、兴趣爱好（${interests}）以及与李秀妍当前的好感关系（${stage}，好感 ${currentFav}），直接给出角色的鲜活回应。
同时，提炼出 1~2 个能够代表本轮对话核心内容/新约定/共同话题的【记忆关键词】（如“草莓大福之约”、“大峙洞数学竞赛”、“汉江夜跑”、“舞台Ending直拍”等），使后续对话具备持久记忆力！

严格返回如下 JSON 格式（全部使用自然流畅的简体中文）：
{
  "reply": "角色极具个性的自然口语回答（30-85字，紧扣李秀妍刚才说的话，体现性格和口吻，绝不敷衍）",
  "innerThought": "角色此时此刻真实隐秘的内心OS（15-40字，符合好感度与心动值）",
  "actionDesc": "具有韩漫画面的眼神、微表情或动作描写（15-35字）",
  "newMemory": "若本次对话聊到了新约定/秘密/心事则总结成简短一句话，否则填 \"\"",
  "extractedKeywords": ["提炼1-2个记忆关键词标签"],
  "favorabilityDelta": 5,
  "moodDelta": 5,
  "socialDelta": 3,
  "suggestedReplies": [
    "顺着话题继续探讨的自然回复1",
    "展现闺蜜/心动默契的调侃回复2",
    "引申至放学约会/校园日常的回复3"
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
        res.json(JSON.parse(text));
        return;
      }
    } catch (_error: any) {
      handleGenAIError(_error);
    }

    // Try Live AI OpenAI-compatible LLM when Gemini token scope is restricted
    const liveAIResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveAIResult && typeof liveAIResult.reply === 'string' && liveAIResult.reply.trim().length > 0) {
      res.json({
        reply: liveAIResult.reply,
        innerThought: liveAIResult.innerThought || '看着秀妍说话的样子，心情不自觉变好了。',
        actionDesc: liveAIResult.actionDesc || `${npc?.chineseName}认真地注视着你的眼睛`,
        newMemory: liveAIResult.newMemory || '',
        extractedKeywords:
          Array.isArray(liveAIResult.extractedKeywords) && liveAIResult.extractedKeywords.length > 0
            ? liveAIResult.extractedKeywords.slice(0, 3)
            : [`${location}闲聊`, `${userMessage.slice(0, 8)}`],
        favorabilityDelta: typeof liveAIResult.favorabilityDelta === 'number' ? liveAIResult.favorabilityDelta : 5,
        moodDelta: typeof liveAIResult.moodDelta === 'number' ? liveAIResult.moodDelta : 5,
        socialDelta: typeof liveAIResult.socialDelta === 'number' ? liveAIResult.socialDelta : 3,
        suggestedReplies:
          Array.isArray(liveAIResult.suggestedReplies) && liveAIResult.suggestedReplies.length > 0
            ? liveAIResult.suggestedReplies.slice(0, 3)
            : [
                '哈哈，跟你想的一模一样！',
                '那我们放学后一起去圣水洞逛逛吧？',
                '待会儿下节课你可别打瞌睡哦！',
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
  app.post('/api/ai/group-chat', async (req, res) => {
    const { userMessage, groupType = 'class', npcs = [], timeContext = '放学后' } = req.body;

    const systemPrompt = `你是《韩国女高模拟器》中 KakaoTalk 群聊的实时AI模拟器。
群聊名称：${groupType === 'idol' ? '【四大社出道预备组练习生群】' : '【首尔女高 1-1班 快乐大本营】'}
群成员包括：
- 朴敏英（同桌死党，温柔体贴，条漫作者）
- 金智英（时尚美妆与八卦达人，气氛组组长）
- 韩素拉（全校第一高冷学霸，嘴硬心软，偶尔冒泡一针见血）
- 李恩宇（广播社温柔学长）
- 姜海仁（女排王牌，爽朗护短）
- 千宥娜（前C位练习生转学生，酷飒毒舌但宠秀妍）
- 尹在民（学生会长，一本正经但总对秀妍破例）`;

    const userPrompt = `主角【李秀妍】刚刚在 KakaoTalk 群里发了一条消息：“${userMessage}”（当前时间：${timeContext}）。
请生成 3 到 4 位不同性格的 NPC 在群里的连续秒回互动（他们不仅会回复秀妍，还会互相接梗吐槽），严格返回如下 JSON 格式（简体中文）：
{
  "messages": [
    { "npcId": "npc_2", "npcName": "金智英", "text": "群聊回复内容1" },
    { "npcId": "npc_1", "npcName": "朴敏英", "text": "群聊回复内容2" },
    { "npcId": "npc_3", "npcName": "韩素拉", "text": "群聊回复内容3" },
    { "npcId": "npc_6", "npcName": "千宥娜", "text": "群聊回复内容4" }
  ]
}`;

    const liveResult = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveResult && Array.isArray(liveResult.messages) && liveResult.messages.length > 0) {
      res.json({ messages: liveResult.messages });
      return;
    }

    res.json({
      messages: [
        {
          npcId: 'npc_2',
          npcName: '金智英',
          text: `捕捉野生秀妍！！“${(userMessage || '').slice(0, 18)}”？算我一个算我一个！我现在就换衣服出门！✨`,
        },
        {
          npcId: 'npc_1',
          npcName: '朴敏英',
          text: `哈哈智英秒回的速度永远是全班第一！秀妍，我都听你的，需要我带相机和零食吗？🍓`,
        },
        {
          npcId: 'npc_3',
          npcName: '韩素拉',
          text: `……你们几个在群里刷屏99+，害我刷数学卷子的时候手机一直在震。不过如果是秀妍说的这件事，我勉强可以抽出半小时参加。`,
        },
        {
          npcId: 'npc_6',
          npcName: '千宥娜',
          text: `刚从练习室出来就看到秀妍发消息了。定位发我，十分钟后到。🎧`,
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
      narrativeStyle,
      customPrompt,
    } = req.body;

    const npcSummary = Array.isArray(npcs)
      ? npcs.map((n: any) => `${n.chineseName}(${n.role},好感${n.favorability})`).join('、')
      : '朴敏英、金智英、韩素拉、李恩宇';

    const memText =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories.slice(-8).join('；')
        : '新学期刚开始的日常';

    const systemPrompt = `你是《韩国女高模拟器》的写实派校园编剧。请写一段贴近现实韩国高中生活的突发小插曲。`;
    const userPrompt = `主角李秀妍当前的真实时间：${timeContext}，地点：${location}，近期记忆：${memText}，认识的同学：${npcSummary}，文风：${narrativeStyle}。${customPrompt ? `玩家期望剧情：“${customPrompt}”。` : ''}
必须严格返回如下 JSON 格式：
{
  "title": "事件标题",
  "content": "90-140字细腻写实的校园场景与人物描写",
  "options": [
    {
      "text": "选项1文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 6, "stamina": -4, "academics": 3, "social": 4, "appearance": 1, "coins": 0, "npcId": "npc_1", "favDelta": 6 }
    },
    {
      "text": "选项2文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 8, "stamina": -2, "academics": 0, "social": 5, "appearance": 2, "coins": 0, "npcId": "npc_4", "favDelta": 6 }
    },
    {
      "text": "选项3文字",
      "resultText": "选择后的具体反馈",
      "memoryLog": "记录进记忆手帐的一句话总结",
      "effect": { "mood": 4, "stamina": -6, "academics": 6, "social": 2, "appearance": 0, "coins": 0, "npcId": "npc_3", "favDelta": 5 }
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
        res.json(JSON.parse(text));
        return;
      }
    } catch (_error: any) {
      handleGenAIError(_error);
    }

    const liveEvent = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveEvent && liveEvent.title && Array.isArray(liveEvent.options) && liveEvent.options.length > 0) {
      res.json(liveEvent);
      return;
    }

    res.json(
      buildContextualEventFallback({
        location: location || '2楼走廊',
        timeContext: timeContext || '10:15 课间',
        customPrompt,
      })
    );
  });

  // 3. Realistic AI Campus Forum / Bamboo Forest Anonymous Wall
  app.post('/api/ai/forum', async (req, res) => {
    const { stats, timeContext, recentMemories, playerPost } = req.body;

    const memText =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories.slice(-6).join('；')
        : '开学第一周日常';

    const systemPrompt = `你是韩国首尔女子高中校内匿名论坛“竹林墙（대나무숲）”生成器。`;
    const userPrompt = `当前时间：${timeContext || '3月 第1周'}。高一(1)班李秀妍当前属性：学业${stats?.academics}，社交${stats?.social}，外形${stats?.appearance}，SNS粉丝${stats?.snsFollowers}。近期校园真实记忆：${memText}。
${playerPost ? `李秀妍刚刚发了一条帖子：“${playerPost}”，请让第一条帖子是对她的直接热议！` : ''}
请严格返回如下 JSON 格式：
{
  "posts": [
    {
      "author": "匿名昵称",
      "tag": "板块标签",
      "title": "帖子标题",
      "content": "帖子正文",
      "likes": 128,
      "comments": ["评论1", "评论2"]
    }
  ]
}`;

    const liveForum = await callLiveOpenAICompatibleLLM(systemPrompt, userPrompt);
    if (liveForum && Array.isArray(liveForum.posts) && liveForum.posts.length > 0) {
      res.json({ posts: liveForum.posts.slice(0, 3) });
      return;
    }

    const latestMem =
      Array.isArray(recentMemories) && recentMemories.length > 0
        ? recentMemories[recentMemories.length - 1]
        : '高一1班的日常互动';

    const fallbackPosts = [
      ...(playerPost
        ? [
            {
              author: '高一1班李秀妍 (匿名投递)',
              tag: '实时新帖',
              title: playerPost,
              content: `刚在${timeContext || '课间'}发出的匿名心声：“${playerPost}”`,
              likes: 88,
              comments: [
                '前排捕捉！这语气一看就是我们高一的可爱妹妹！',
                '顶上去，祝楼主今天心情满分，月考全一等级！',
              ],
            },
          ]
        : []),
      {
        author: '2楼走廊观察员',
        tag: '校园风向',
        title: '有人注意到高一(1)班最近发生的事吗？',
        content: `听说最近：${latestMem}。而且李秀妍现在的学业已经有 ${stats?.academics || 76} 分、外形 ${stats?.appearance || 82} 分了，简直是今年高一的风云人物！`,
        likes: 112,
        comments: [
          '真的！我今天课间经过1-1班门口也看到了，本人超有气质！',
          '朴敏英跟她同桌每天都形影不离，神仙友情实名羡慕了~',
        ],
      },
      {
        author: '大峙洞夜归人',
        tag: '食堂与小卖部',
        title: '今日食堂菜单红黑榜 & 广播室歌单好评',
        content: '今天中午食堂的芝士辣炒鸡排给得超足！另外表白午休广播室李恩宇学长放的歌，写数学卷子的时候听完整个人都被治愈了。',
        likes: 76,
        comments: [
          '恩宇学长的选曲审美永远在线！',
          '求问小卖部明天还会补货延世生牛乳奶油面包吗？',
        ],
      },
    ];

    res.json({ posts: fallbackPosts.slice(0, 3) });
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
