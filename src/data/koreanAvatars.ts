// High-Aesthetic AI-Generated Korean Webtoon / Manhwa Character Portraits
// All portraits are stored locally in /public/avatars/*.jpg for instant 0ms loading,
// plus live AI portrait generation support via /api/ai/generate-avatar.

export interface ProtagonistAvatarPreset {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

export interface AvatarStylePack {
  id: 'webtoon' | 'anime' | 'pastel';
  name: string;
  desc: string;
  protagonistUrl: string;
  npcUrls: Record<string, string>;
}

export const AVATAR_SOOYEON_DEFAULT = '/avatars/sooyeon_default.jpg';

export const PROTAGONIST_AVATAR_PRESETS: ProtagonistAvatarPreset[] = [
  {
    id: 'sooyeon_default',
    name: '初恋栗棕 · 清纯校花 (AI精修)',
    subtitle: '奶油针织开衫 + 樱花柔光',
    url: '/avatars/sooyeon_default.jpg',
  },
  {
    id: 'sooyeon_idol',
    name: '微醺玫瑰 · 顶流爱豆C位 (AI精修)',
    subtitle: '钻石发夹 + 舞台聚光灯',
    url: '/avatars/sooyeon_idol.jpg',
  },
  {
    id: 'sooyeon_ponytail',
    name: '夏日晴空 · 元气高马尾 (AI精修)',
    subtitle: '粉色蝴蝶结 + 水手服领结',
    url: '/avatars/sooyeon_ponytail.jpg',
  },
  {
    id: 'sooyeon_queen',
    name: '清冷黑长直 · 财阀千金 (AI精修)',
    subtitle: '深蓝西装校服 + 泪痣高智感',
    url: '/avatars/sooyeon_winter.jpg',
  },
  {
    id: 'sooyeon_winter',
    name: '初雪红围巾 · 冬日恋歌 (AI精修)',
    subtitle: '驼色大衣 + 初雪氛围感',
    url: '/avatars/sooyeon_winter.jpg',
  },
];

export const NPC_KOREAN_AVATARS_MAP: Record<string, string> = {
  npc_1: '/avatars/npc_1_minyoung.jpg',
  npc_2: '/avatars/npc_2_jiyoung.jpg',
  npc_3: '/avatars/npc_3_sora.jpg',
  npc_4: '/avatars/npc_4_eunwoo.jpg',
  npc_5: '/avatars/npc_5_haein.jpg',
  npc_6: '/avatars/npc_6_yuna.jpg',
  npc_7: '/avatars/npc_7_eunjung.jpg',
  npc_8: '/avatars/npc_8_jaemin.jpg',
};

export const AVATAR_NPC_MINYOUNG = NPC_KOREAN_AVATARS_MAP.npc_1;
export const AVATAR_NPC_JIYOUNG = NPC_KOREAN_AVATARS_MAP.npc_2;
export const AVATAR_NPC_SORA = NPC_KOREAN_AVATARS_MAP.npc_3;
export const AVATAR_NPC_EUNWOO = NPC_KOREAN_AVATARS_MAP.npc_4;
export const AVATAR_NPC_HAEIN = NPC_KOREAN_AVATARS_MAP.npc_5;
export const AVATAR_NPC_YUNA = NPC_KOREAN_AVATARS_MAP.npc_6;
export const AVATAR_NPC_EUNJUNG = NPC_KOREAN_AVATARS_MAP.npc_7;
export const AVATAR_NPC_JAEMIN = NPC_KOREAN_AVATARS_MAP.npc_8;

export const AVATAR_STYLE_PACKS: AvatarStylePack[] = [
  {
    id: 'webtoon',
    name: '🌸 韩漫AI精修立绘 (默认推荐)',
    desc: 'AI生成的高颜值韩漫唯美立绘，细腻光影与真实校服质感',
    protagonistUrl: '/avatars/sooyeon_default.jpg',
    npcUrls: {
      npc_1: '/avatars/npc_1_minyoung.jpg',
      npc_2: '/avatars/npc_2_jiyoung.jpg',
      npc_3: '/avatars/npc_3_sora.jpg',
      npc_4: '/avatars/npc_4_eunwoo.jpg',
      npc_5: '/avatars/npc_5_haein.jpg',
      npc_6: '/avatars/npc_6_yuna.jpg',
      npc_7: '/avatars/npc_7_eunjung.jpg',
      npc_8: '/avatars/npc_8_jaemin.jpg',
    },
  },
  {
    id: 'anime',
    name: '👑 爱豆舞台画报组',
    desc: '主角切换为五代女团C位舞台画报立绘，全员高颜值韩漫风',
    protagonistUrl: '/avatars/sooyeon_idol.jpg',
    npcUrls: {
      npc_1: '/avatars/npc_1_minyoung.jpg',
      npc_2: '/avatars/npc_2_jiyoung.jpg',
      npc_3: '/avatars/npc_3_sora.jpg',
      npc_4: '/avatars/npc_4_eunwoo.jpg',
      npc_5: '/avatars/npc_5_haein.jpg',
      npc_6: '/avatars/npc_6_yuna.jpg',
      npc_7: '/avatars/npc_7_eunjung.jpg',
      npc_8: '/avatars/npc_8_jaemin.jpg',
    },
  },
  {
    id: 'pastel',
    name: '🎀 元气高马尾校园组',
    desc: '主角切换为元气粉色蝴蝶结高马尾立绘，清新甜美少女感',
    protagonistUrl: '/avatars/sooyeon_ponytail.jpg',
    npcUrls: {
      npc_1: '/avatars/npc_1_minyoung.jpg',
      npc_2: '/avatars/npc_2_jiyoung.jpg',
      npc_3: '/avatars/npc_3_sora.jpg',
      npc_4: '/avatars/npc_4_eunwoo.jpg',
      npc_5: '/avatars/npc_5_haein.jpg',
      npc_6: '/avatars/npc_6_yuna.jpg',
      npc_7: '/avatars/npc_7_eunjung.jpg',
      npc_8: '/avatars/npc_8_jaemin.jpg',
    },
  },
];

export interface NPCPortraitPreset {
  id: string;
  name: string;
  tag: string;
  desc: string;
  url: string;
}

export const NPC_PORTRAIT_PRESETS: Record<string, NPCPortraitPreset[]> = {
  npc_1: [
    {
      id: 'npc1_default',
      name: '🌸 经典校服 · 温柔同桌',
      tag: '原版立绘',
      desc: '首尔女高校服配微卷长发，抽屉里永远留着草莓软糖。',
      url: '/avatars/npc_1_minyoung.jpg',
    },
    {
      id: 'npc1_casual',
      name: '🎨 慵懒画手 · 燕麦毛衣',
      tag: '私服日常',
      desc: '宽松奶白色针织毛衣，长发随意挽起，指尖沾着彩色铅笔碎屑。',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc1_beret',
      name: '🎀 弘大打卡 · 复古贝雷帽',
      tag: '周末约会',
      desc: '酒红色羊毛贝雷帽搭配复古格纹大衣，眼神温柔甜美。',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc1_grad',
      name: '🎓 盛放春樱 · 毕业画报版',
      tag: '典礼特辑',
      desc: '毕业学士服配浅粉玫瑰捧花，眼神里带着对未来的坚定与不舍。',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_3: [
    {
      id: 'npc3_default',
      name: '👓 大峙洞第一 · 高冷学霸',
      tag: '原版立绘',
      desc: '一丝不苟的校服领带与冰美式，全校不动如山的第一名。',
      url: '/avatars/npc_3_sora.jpg',
    },
    {
      id: 'npc3_casual',
      name: '☕ 极简私服 · 智性黑西装',
      tag: '私服日常',
      desc: '俐落的深灰修身西装，清冷疏离的高智感千金气场。',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc3_winter',
      name: '❄️ 初雪大衣 · 柔光围巾',
      tag: '冬日恋歌',
      desc: '深蓝羊绒大衣配象牙白羊毛围巾，在你面前才会露出的罕见微笑。',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc3_chaebol',
      name: '💎 财阀名门 · 晚宴黑礼服',
      tag: '名流千金',
      desc: '清潭洞晚宴高定黑色丝绒礼服，佩戴珍珠项链，贵气逼人。',
      url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_4: [
    {
      id: 'npc4_default',
      name: '🎸 广播室吉他 · 白月光学长',
      tag: '原版立绘',
      desc: '佩戴监听耳机，声线如春风般清润温和的广播社长。',
      url: '/avatars/npc_4_eunwoo.jpg',
    },
    {
      id: 'npc4_white_shirt',
      name: '👔 晴朗初夏 · 白衬衫少年',
      tag: '心动校园',
      desc: '干净挺拔的白色短袖衬衫，微风吹乱额前的刘海，笑意朗润。',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc4_band_live',
      name: '🎤 弘大Live · 摇滚主唱',
      tag: '舞台风采',
      desc: '黑色皮衣与银色项链，在聚光灯下尽情扫弦的耀眼主唱。',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc4_winter',
      name: '🧣 初雪汉江 · 温暖毛线围巾',
      tag: '冬日私服',
      desc: '驼色羊毛大衣配深灰厚围巾，在初雪纷飞的江边递给你热咖啡。',
      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_5: [
    {
      id: 'npc5_default',
      name: '🏐 排球王牌 · 飒爽狼尾短发',
      tag: '原版立绘',
      desc: '女排部主攻手，帅气干练，收到情书最多的校园人气王。',
      url: '/avatars/npc_5_haein.jpg',
    },
    {
      id: 'npc5_street',
      name: '🖤 机车夹克 · 酷飒女友风',
      tag: '私服日常',
      desc: '超A黑色短款皮衣配工装阔腿裤，单手插兜朝你挑眉微笑。',
      url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc5_dress',
      name: '👗 罕见反差 · 浅杏色连衣裙',
      tag: '限定反差',
      desc: '修学旅行私下穿上的浅杏色法式连衣裙，脸颊带着一丝不易察觉的微红。',
      url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc5_sport_hoodie',
      name: '🧢 街头卫衣 · 鸭舌帽少年感',
      tag: '运动休闲',
      desc: '灰色Oversize连帽卫衣配反戴棒球帽，满身青春元气。',
      url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_6: [
    {
      id: 'npc6_default',
      name: '🎧 混血辣妹 · 天台听歌',
      tag: '原版立绘',
      desc: '洛杉矶转学而来的冷艳少女，气场强大，舞台功底超群。',
      url: '/avatars/npc_6_yuna.jpg',
    },
    {
      id: 'npc6_idol_stage',
      name: '👑 女团Center · 打歌服画报',
      tag: '顶流爱豆',
      desc: '银光闪烁的爱豆打歌服，高马尾配钻石耳坠，绝对C位的压迫感。',
      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc6_casual_hoodie',
      name: '🖤 美式复古 · 露脐卫衣',
      tag: '私服街头',
      desc: '短款拉链连帽衫配低腰牛仔裤，清冷又带着不羁的美式复古风。',
      url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc6_sunglasses',
      name: '🕶️ 机场私服 · 明星墨镜气场',
      tag: '机场街拍',
      desc: '长款黑色风衣配复古墨镜，即使低调出行也自带巨星光环。',
      url: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_8: [
    {
      id: 'npc8_default',
      name: '👓 金丝眼镜 · 铁血学生会长',
      tag: '原版立绘',
      desc: '金丝细框眼镜，校服领带整齐严谨，唯独对你破例的风纪会长。',
      url: '/avatars/npc_8_jaemin.jpg',
    },
    {
      id: 'npc8_hoodie_cat',
      name: '🐱 猫咪守护 · 暖男灰色连帽衫',
      tag: '放学反差',
      desc: '脱下西装换上随性浅灰卫衣，在学校后山温柔抱起流浪小猫。',
      url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc8_formal_coat',
      name: '🧥 绅士大衣 · 财阀长子正装',
      tag: '正装风度',
      desc: '深炭灰羊绒长款大衣，金丝眼镜在雪光下反射着深邃沉稳的光泽。',
      url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc8_library',
      name: '📚 图书馆私语 · 卷袖白衬衫',
      tag: '自习室特辑',
      desc: '挽起袖口的修身白衬衫，低头为你指出论文逻辑漏洞时侧颜专注。',
      url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_7: [
    {
      id: 'npc7_default',
      name: '🩺 温柔知性 · 白大褂校医',
      tag: '原版立绘',
      desc: '知性温柔的校医兼文学社指导老师，倾听所有疲惫学生的眼泪。',
      url: '/avatars/npc_7_eunjung.jpg',
    },
    {
      id: 'npc7_trench_coat',
      name: '🍂 深秋风衣 · 文学系学者',
      tag: '知性日常',
      desc: '经典米卡其双排扣风衣，内搭珍珠白雪纺衬衫，优雅从容。',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'npc7_spring_cardigan',
      name: '🌸 樱花针织 · 温暖前辈姐姐',
      tag: '假日治愈',
      desc: '柔和浅粉羊绒开衫，在三清洞咖啡馆靠窗微笑，端着热拿铁。',
      url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=400',
    },
  ],
  npc_2: [
    {
      id: 'npc2_default',
      name: '🎀 元气同窗 · 崔智英',
      tag: '原版立绘',
      desc: '活泼开朗的小太阳同窗，八卦小雷达与气氛活跃者。',
      url: '/avatars/npc_2_jiyoung.jpg',
    },
    {
      id: 'npc2_cheer',
      name: '📣 活力应援 · 运动卫衣版',
      tag: '活力日常',
      desc: '黄色亮眼卫衣，扎着双丸子头，随时准备为你欢呼打气。',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    },
  ],
};
