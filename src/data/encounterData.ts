import { DynamicNPCEncounter, NPCClassmate } from '../types';

export interface DynamicNPCPreset extends DynamicNPCEncounter {
  gender: 'female' | 'male';
}

export const DYNAMIC_AVATAR_SEEDS: Record<string, string> = {
  female_guitarist: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  male_trainee: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  female_cafe_senior: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  male_skater: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  female_study_cram: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  female_dance_rival: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
  male_film_director: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400',
  female_art_prep: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=400',
};

export function getAvatarForSeed(seed: string, gender: 'female' | 'male' = 'female'): string {
  if (seed && DYNAMIC_AVATAR_SEEDS[seed]) {
    return DYNAMIC_AVATAR_SEEDS[seed];
  }
  const femaleList = [
    DYNAMIC_AVATAR_SEEDS.female_guitarist,
    DYNAMIC_AVATAR_SEEDS.female_cafe_senior,
    DYNAMIC_AVATAR_SEEDS.female_study_cram,
    DYNAMIC_AVATAR_SEEDS.female_dance_rival,
    DYNAMIC_AVATAR_SEEDS.female_art_prep,
  ];
  const maleList = [
    DYNAMIC_AVATAR_SEEDS.male_trainee,
    DYNAMIC_AVATAR_SEEDS.male_skater,
    DYNAMIC_AVATAR_SEEDS.male_film_director,
  ];
  const list = gender === 'male' ? maleList : femaleList;
  let hash = 0;
  for (let i = 0; i < (seed || '').length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
  }
  const idx = Math.abs(hash) % list.length;
  return list[idx];
}

// 5 Curated Local Fallback NPCs with rich personality, Korean flair, and vivid encounters
export const DYNAMIC_NPC_FALLBACK_PRESETS: DynamicNPCPreset[] = [
  {
    name: '崔宥真 (최유진)',
    chineseName: '崔宥真',
    koreanName: '최유진',
    gender: 'female',
    identity: '弘大独立乐队吉他手',
    personality: '外表冷淡酷飒，吉他包上挂着三只毛绒猫咪，其实是个重度猫奴',
    speakingStyle: '语速慢、习惯短句反问，偶尔会夹杂一句带着傲娇的“呀……”',
    avatarSeed: 'female_guitarist',
    avatarUrl: DYNAMIC_AVATAR_SEEDS.female_guitarist,
    encounterLocation: '弘大乐器街旧琴行门口',
    encounterStory: '在弘大乐器街突遇暴雨，你们俩恰好在同一家旧琴行屋檐下躲雨。听着里面传出的蓝调和弦，她默默把黑色雨伞往你头顶倾斜了大半，自己半边肩膀却湿透了。',
    choices: [
      { text: '主动递上纸巾，交换 KakaoTalk 认识一下', action: 'ADD_FRIEND' },
      { text: '礼貌微笑鞠躬，等雨停擦肩而过', action: 'IGNORE' },
    ],
  },
  {
    name: '姜泰宇 (강태우)',
    chineseName: '姜泰宇',
    koreanName: '강태우',
    gender: 'male',
    identity: '竞争娱乐社 B班王牌练习生',
    personality: '元气开朗自来熟，其实极度害怕月底考核淘汰，私下练舞到凌晨',
    speakingStyle: '元气热血、喜欢用“大发”、“哇真的假的！”等语气词，笑起来眼睛弯弯的',
    avatarSeed: 'male_trainee',
    avatarUrl: DYNAMIC_AVATAR_SEEDS.male_trainee,
    encounterLocation: '新沙洞练习室公共自动售货机前',
    encounterStory: '在新沙洞地下练习室的公共售货机前，你们俩同时伸手抓向了最后一罐冰镇维他命水。指尖触碰的瞬间两人都触电般缩回，他挠着湿漉漉的碎发不好意思地笑了。',
    choices: [
      { text: '主动请他喝饮料，交换 KakaoTalk 认识一下', action: 'ADD_FRIEND' },
      { text: '把饮料让给他，微笑点头擦肩而过', action: 'IGNORE' },
    ],
  },
  {
    name: '裴秀彬 (배수빈)',
    chineseName: '裴秀彬',
    koreanName: '배수빈',
    gender: 'female',
    identity: '圣水洞复古胶片咖啡厅打工学姐',
    personality: '随性慵懒的知性文艺少女，随身带着拍立得，喜欢抓拍平凡日常里的微光',
    speakingStyle: '轻声细语、尾音微翘带一点慵懒的笑意，喜欢称呼人“小妹妹”或“这位同桌”',
    avatarSeed: 'female_cafe_senior',
    avatarUrl: DYNAMIC_AVATAR_SEEDS.female_cafe_senior,
    encounterLocation: '圣水洞胶片咖啡厅角落窗边',
    encounterStory: '你在圣水洞咖啡厅自习被一道高难度数学题难住叹气，她端着一杯拉花画着小雏菊的热拿铁轻轻放在你桌上：“学姐请客，喝完思路会变清晰的。”',
    choices: [
      { text: '惊喜道谢，拿出手机交换 KakaoTalk 认识一下', action: 'ADD_FRIEND' },
      { text: '安静喝完拿铁，礼貌道谢后擦肩而过', action: 'IGNORE' },
    ],
  },
  {
    name: '宋敏俊 (송민준)',
    chineseName: '宋敏俊',
    koreanName: '송민준',
    gender: 'male',
    identity: '汉江滑板少年兼潮牌买手店员',
    personality: '阳光率性、直球真诚，很懂穿搭与滑板技巧，极具少年侠气',
    speakingStyle: '直爽真诚，喜欢用调侃又关切的口吻说话，笑声爽朗干净',
    avatarSeed: 'male_skater',
    avatarUrl: DYNAMIC_AVATAR_SEEDS.male_skater,
    encounterLocation: '汝矣岛汉江公园日落坡道',
    encounterStory: '你在汉江公园散步吹风，他的滑板不小心失控滑到了你的脚边。他小跑过来连连抱歉，并从怀里掏出一包刚出炉还冒着热气的华夫饼作为赔罪小点心。',
    choices: [
      { text: '笑着接下华夫饼，主动交换 KakaoTalk 认识一下', action: 'ADD_FRIEND' },
      { text: '把滑板踢还给他，摆摆手微笑擦肩而过', action: 'IGNORE' },
    ],
  },
  {
    name: '柳多熙 (유다희)',
    chineseName: '柳多熙',
    koreanName: '유다희',
    gender: 'female',
    identity: '大峙洞深夜自习室复读学姐',
    personality: '理性清醒、高智专注，外表冰山，但对同样在拼搏的后辈极富同理心',
    speakingStyle: '简练克制、条理极强，从不说废话，但偶尔一句肯定格外有分量',
    avatarSeed: 'female_study_cram',
    avatarUrl: DYNAMIC_AVATAR_SEEDS.female_study_cram,
    encounterLocation: '大峙洞顶级自习室走廊阅览台',
    encounterStory: '深夜一点的大峙洞自习室突遇跳闸停电，四周一片混乱抱怨。在黑暗中，她默默点亮了一盏柔和的充电护眼小台灯，并转过半边光晕，悄悄照亮了你的错题本。',
    choices: [
      { text: '小声真诚道谢，借着微光交换 KakaoTalk 认识一下', action: 'ADD_FRIEND' },
      { text: '默默对她点头微笑，收拾书包擦肩而过', action: 'IGNORE' },
    ],
  },
];

// Helper to deduce location from action item
export function getEncounterLocationByAction(actionId: string, defaultLocation: string = '首尔街头'): string {
  if (actionId.includes('study') || actionId.includes('class') || actionId.includes('daechi')) {
    return '大峙洞深夜自习室或图书阅览室';
  }
  if (actionId.includes('club') || actionId.includes('practice') || actionId.includes('trainee') || actionId.includes('dance')) {
    return '新沙洞专业地下舞室与练习室走廊';
  }
  if (actionId.includes('work') || actionId.includes('parttime')) {
    return '圣水洞网红买手店与便利店街角';
  }
  if (actionId.includes('sport') || actionId.includes('pilates') || actionId.includes('exercise')) {
    return '汉江汝矣岛公园运动跑道与草坪';
  }
  if (actionId.includes('social') || actionId.includes('hongdae')) {
    return '弘大街头潮流乐器街与文创小巷';
  }
  return defaultLocation || '首尔女高校园林荫道';
}

// Convert an encounter into a full-fledged NPCClassmate object
export function convertEncounterToNPC(
  encounter: DynamicNPCEncounter,
  gradeYear: number,
  weekInYear: number
): NPCClassmate {
  // Parse Chinese and Korean names
  let cName = encounter.chineseName || '';
  let kName = encounter.koreanName || '';
  if (!cName) {
    const match = encounter.name.match(/^([^\s(]+)(?:\s*\(([^)]+)\))?/);
    if (match) {
      cName = match[1];
      kName = match[2] || '';
    } else {
      cName = encounter.name;
    }
  }

  const avatar = encounter.avatarUrl || getAvatarForSeed(encounter.avatarSeed);
  const npcId = `dyn_npc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  return {
    id: npcId,
    chineseName: cName,
    koreanName: kName || '친구',
    role: encounter.identity,
    gender: 'female', // default compatible
    orientation: '双性恋',
    relationshipStage: '相识',
    favorability: 25,
    romancePoints: 8,
    mbti: 'ENFP / ISTP',
    interests: [encounter.identity, '音乐与日常探店', 'Kakao聊天'],
    memoryKeywords: ['初次相遇', encounter.encounterLocation, encounter.identity],
    avatar,
    status: encounter.identity,
    description: `${encounter.personality} · 初遇印象：${encounter.encounterStory}`,
    dislikedTraits: ['虚伪敷衍', '爽约'],
    likedGifts: ['草莓牛奶', '黑胶唱片', '薄荷糖', '热咖啡'],
    secret: `表面上是【${encounter.identity}】，私下其实${encounter.personality}`,
    secretRevealed: false,
    storyStage: 1,
    memories: [
      `[高${gradeYear}第${weekInYear}周·${encounter.encounterLocation}] ${encounter.encounterStory}`,
    ],
    nicknameToPlayer: '秀妍',
    speakingStyle: encounter.speakingStyle,
    forbiddenWords: ['请问有什么可以帮您', '作为人工智能', '好的呢', '尊敬的用户'],
    attitudeByAffection: {
      low: '初识礼貌客套，保持界限感',
      mid: '亲切随性，开始分享生活中的真实小情绪与八卦',
      high: '绝对信赖与偏爱，展现内心的秘密与脆弱面',
    },
    isGenerated: true,
    encounterWeek: weekInYear,
    encounterLocation: encounter.encounterLocation,
    initialImpression: encounter.encounterStory,
    personality: encounter.personality,
  };
}
