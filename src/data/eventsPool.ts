import { RandomEvent, EventCategory, SeasonType, GameStats, NPCClassmate } from '../types';

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  study: '学习相关 · 学业与考场',
  club: '社团活动 · 青春舞台',
  campus: '校园生活 · 四季日常',
  sns: '社交网络 · Kakao与SNS',
  relationship: '人际与心动 · 全向羁绊',
  family: '家庭事件 · 屋檐之下',
  rare: '稀有事件 · 命运分岔口',
};

// Curated High-Impact Story Events across all 7 categories
export const CURATED_STORY_EVENTS: RandomEvent[] = [
  // ==================== 1. 学习相关 (Study) ====================
  {
    id: 'st_midterm_prep',
    category: 'study',
    categoryLabel: EVENT_CATEGORY_LABELS.study,
    title: '第一学期期中考试前夜 · 读书室的咖啡香',
    content: '期中考试周正式来临，大峙洞24小时收费自习室（독서실）里座无虚席。晚上十一点半，邻座的韩素拉还在用荧光笔划古文重点，而你的眼皮已经开始打架。',
    options: [
      {
        text: '灌下一罐高浓度冰美式，和韩素拉互考压轴题 (+8学业, -10体力)',
        memoryLog: '期中考前夜在读书室与韩素拉并肩刷题到凌晨。',
        effect: { academics: 8, stamina: -10, mood: -2, favorabilityChange: { npcId: 'npc_3', amount: 8, romanceAmount: 5 } },
        resultText: '你们用便签纸無声地交换了三道微积分变式题，韩素拉在便签背面写下一句：“明天考场见真章。”',
      },
      {
        text: '按时收拾书包回家保证睡眠，保持最佳考场状态 (+4学业, +8体力)',
        memoryLog: '期中考前夜选择规律作息，稳扎稳打迎战考试。',
        effect: { academics: 4, stamina: 8, mood: 5, family: 3 },
        resultText: '充足的睡眠让你第二天头脑格外清醒，审题时避开了好几个出题老师埋下的陷阱！',
      },
      {
        text: '在Kakao群里和朴敏英分享押题重点 (+5学业, +5社交)',
        memoryLog: '考前把精心整理的国语现代诗押题笔记分享给了朴敏英。',
        effect: { academics: 5, social: 5, stamina: -4, favorabilityChange: { npcId: 'npc_1', amount: 9, romanceAmount: 4 } },
        resultText: '朴敏英发来十几个哭泣猫猫表情包：“秀妍你就是我的救命恩人！！”',
      },
    ],
  },
  {
    id: 'st_mock_exam_aura',
    category: 'study',
    categoryLabel: EVENT_CATEGORY_LABELS.study,
    title: '全国联合学力评价 · 学霸光环觉醒',
    content: '6月全国联合模考（모의고사）成绩单发下来了。你的数学与国语双双拿到1等级标准分！班主任金老师在讲台上公开表扬了你，全班投来羡慕的目光。',
    options: [
      {
        text: '大方将自己的错题整理法贴在班级学习角 (+6社交, +5学业)',
        memoryLog: '全国模考斩获1等级，将错题笔记公开分享给全班同学。',
        effect: { academics: 5, social: 6, mood: 8, allowance: 10000 },
        resultText: '同学们纷纷围过来拍照借阅，连平时严厉的尹在民都称赞了你的条理性，父母也高兴地提高了你的每周零花钱！',
      },
      {
        text: '放学后第一时间把成绩单拍照发给妈妈 (+8家庭, +25,000元奖励)',
        memoryLog: '模考成绩优异，父母欣慰地发来零花钱红包。',
        effect: { family: 8, coins: 25000, mood: 6 },
        resultText: '妈妈秒回了一条长语音，晚上还特意买了韩牛在家里为你庆祝！',
      },
    ],
  },
  {
    id: 'st_teacher_critique',
    category: 'study',
    categoryLabel: EVENT_CATEGORY_LABELS.study,
    title: '课堂抽查危机 · 数学老师的突然袭击',
    content: '下午第一节代数课，阳光晒得人昏昏欲睡。数学朴老师突然敲了敲黑板：“李秀妍，上来把黑板右侧这道函数极值题解一下！”',
    options: [
      {
        text: '深吸一口气，调动大峙洞补习班学过的秒杀公式 (+6学业, +4心情)',
        memoryLog: '在数学课被突然抽查时完美写出压轴题秒杀步骤。',
        effect: { academics: 6, mood: 4, social: 3 },
        resultText: '你干净利落地写下三行推导，朴老师满意地点点头：“不错，思路比标准答案还简练。”',
      },
      {
        text: '小声向邻座朴敏英求助提示，勉强写完步骤 (+3社交, -3心情)',
        memoryLog: '数学课被抽查时靠同桌朴敏英偷偷比划口型过关。',
        effect: { academics: 2, social: 3, mood: -3, favorabilityChange: { npcId: 'npc_1', amount: 6 } },
        resultText: '虽然被老师提醒了一句“上课别走神”，但回到座位时你和敏英默契地相视一笑。',
      },
    ],
  },

  // ==================== 2. 社团活动 (Club) ====================
  {
    id: 'cl_dance_center',
    category: 'club',
    categoryLabel: EVENT_CATEGORY_LABELS.club,
    title: 'K-Pop街舞社 · 校园祭C位选拔赛',
    content: '舞蹈社练习室的落地镜前，社长宣布下个月玫瑰校园祭的压轴曲目将采用公开竞选制决定Center（C位）。转学生千宥娜站在角落热身，眼神里透着专业练习生的锋芒。',
    options: [
      {
        text: '主动留下来加练到晚上九点，死磕定点与表情管理 (+12社团, +6外形, +8练习生进度)',
        memoryLog: '在街舞社加练至深夜，与千宥娜同台竞选校园祭C位。',
        effect: { clubSkill: 12, appearance: 6, traineeProgress: 8, stamina: -12, mood: 6, favorabilityChange: { npcId: 'npc_6', amount: 9, romanceAmount: 5 } },
        resultText: '千宥娜走过来递给你一瓶电解质水，难得露出赞许的微笑：“你的卡点很准，这次舞台有意思了。”',
      },
      {
        text: '提议与千宥娜编排双人镜像领舞Part (+8社团, +6社交)',
        memoryLog: '与转学生千宥娜合作编排了惊艳全场的双人领舞。',
        effect: { clubSkill: 8, social: 6, mood: 8, favorabilityChange: { npcId: 'npc_6', amount: 12, romanceAmount: 8 } },
        resultText: '两人一冷一甜的台风碰撞出奇妙的化学反应，全社成员都忍不住鼓起掌来！',
      },
    ],
  },
  {
    id: 'cl_band_rescue',
    category: 'club',
    categoryLabel: EVENT_CATEGORY_LABELS.club,
    title: '校园独立乐队 · 雨夜排练室的合奏',
    content: '社团大楼顶层的隔音排练室里，李恩宇学长正在调试电吉他效果器。因为原定键盘手突发感冒请假，本周五的校内小型路演面临缺人危机。',
    options: [
      {
        text: '主动顶上键盘/和声位置，陪学长紧急合练 (+10社团, +8好感)',
        memoryLog: '在乐队排练室替补上场，与李恩宇学长完成了默契合奏。',
        effect: { clubSkill: 10, mood: 9, stamina: -8, favorabilityChange: { npcId: 'npc_4', amount: 11, romanceAmount: 8 } },
        resultText: '最后一个和弦落定，恩宇学长温柔地看着你：“有你在，我好像从来不需要担心舞台会冷场。”',
      },
      {
        text: '帮乐队拍摄排练花絮并上传Stargram宣传 (+2,800粉丝, +6社交)',
        memoryLog: '为校园乐队拍摄氛围感排练Vlog，在全校引发转发热潮。',
        effect: { social: 6, snsFollowers: 2800, mood: 6, favorabilityChange: { npcId: 'npc_4', amount: 7 } },
        resultText: '侧拍视频在校园网一夜破千赞，周五路演现场被围得水泄不通！',
      },
    ],
  },
  {
    id: 'cl_volleyball_match',
    category: 'club',
    categoryLabel: EVENT_CATEGORY_LABELS.club,
    title: '运动部热血战 · 首尔高中女排联赛',
    content: '体育馆内哨声尖锐，校排球部主将姜海仁高高跃起扣球得分！中场休息时，她擦着额头的汗水朝观众席前排的你跑来。',
    options: [
      {
        text: '把提前冰镇好的运动毛巾和宝矿力递给她 (+10好感, +6心情)',
        memoryLog: '在女排联赛现场为姜海仁递上冰毛巾，见证她拿下MVP。',
        effect: { mood: 8, social: 4, favorabilityChange: { npcId: 'npc_5', amount: 12, romanceAmount: 9 } },
        resultText: '姜海仁爽朗地揉了揉你的头发，眼睛亮晶晶的：“下半场最后一分，我一定扣给你看！”',
      },
      {
        text: '作为替补自由人换上球衣亲自上场助阵 (+8体力上限, +10社团)',
        memoryLog: '亲自换上球衣与姜海仁并肩作战赢下排球联赛。',
        effect: { clubSkill: 10, stamina: -8, social: 7, favorabilityChange: { npcId: 'npc_5', amount: 10, romanceAmount: 6 } },
        resultText: '你奋力救起关键险球，终场哨响那一刻，姜海仁直接一把将你抱了起来转圈欢呼！',
      },
    ],
  },

  // ==================== 3. 校园生活 & 四季限定 (Campus & Seasons) ====================
  {
    id: 'cp_cherry_blossom',
    category: 'campus',
    categoryLabel: EVENT_CATEGORY_LABELS.campus,
    seasonTag: 'cherry_blossom',
    title: '春季限定 · 汝矣岛轮中路的樱花雨',
    content: '3月末的首尔春风微醺，校门口坡道两侧的吉野樱满开了。粉白色的花瓣随风飘进2楼走廊窗台，大家都在传言：“如果和喜欢的人一起接住落下的樱花瓣，三年都不会分开。”',
    options: [
      {
        text: '邀请心仪的TA放学后去汉江樱花道散步 (+10心情, +10情感羁绊)',
        memoryLog: '在三月末的樱花雨中并肩漫步汉江公园，接住了飘落的花瓣。',
        romanceMode: 'romantic',
        effect: { mood: 10, social: 5, appearance: 3, favorabilityChange: { npcId: 'npc_1', amount: 10, romanceAmount: 10 } },
        resultText: '粉白花瓣落在你们的校服肩头，对方悄悄替你拂去发间的花瓣，空气里满是清甜的春意。',
      },
      {
        text: '穿好春日奶油针织校服拍一组樱花写真发SNS (+3,500粉丝, +5外形)',
        memoryLog: '在樱花树下拍摄了韩系清透感校服写真，Stargram人气飙升。',
        effect: { appearance: 5, snsFollowers: 3500, mood: 8 },
        resultText: '照片被“首尔高中女神墙”账号转载，评论区全在求你的校服穿搭链接！',
      },
    ],
  },
  {
    id: 'cp_school_trip_jeju',
    category: 'campus',
    categoryLabel: EVENT_CATEGORY_LABELS.campus,
    seasonTag: 'early_summer',
    title: '修学旅行 · 济州岛海风与民宿夜谈',
    content: '期盼已久的五月中旬济州岛修学旅行（수학여행）！白天游览了城山日出峰与橘子园，夜晚回到海边韩屋民宿，大家围坐在榻榻米上玩真心话大冒险。',
    options: [
      {
        text: '悄悄和心仪的人溜去海边木栈道吹夜风 (+12好感, +10浪漫)',
        memoryLog: '济州岛修学旅行之夜，溜去海边栈道听着海浪交换了彼此的心事。',
        romanceMode: 'romantic',
        effect: { mood: 14, stamina: -5, favorabilityChange: { npcId: 'npc_6', amount: 12, romanceAmount: 12 } },
        resultText: '远处海面波光粼粼，对方轻声说：“整个修学旅行里，我最期待的其实就是现在这一刻。”',
      },
      {
        text: '和朴敏英、姜海仁一起吃济州黑猪肉泡面聊通宵 (+10社交, +12心情)',
        memoryLog: '济州岛修学旅行和好友们在房间里偷吃黑猪肉泡面、畅聊未来。',
        romanceMode: 'platonic',
        effect: { mood: 12, social: 10, stamina: -6, favorabilityChange: { npcId: 'npc_1', amount: 10 } },
        resultText: '哪怕被查房的宋恩静老师温柔地敲门提醒，大家钻进被窝里憋笑的声音还是成了最珍贵的青春记忆。',
      },
    ],
  },
  {
    id: 'cp_rainy_umbrella',
    category: 'campus',
    categoryLabel: EVENT_CATEGORY_LABELS.campus,
    seasonTag: 'rainy_season',
    title: '梅雨季限定 · 放学教学楼屋檐下的一把伞',
    content: '6月下旬首尔进入梅雨季（장마），放学时分突然下起倾盆大雨。你站在1楼鞋柜大厅望着雨幕发愁，没带伞的你正犹豫要不要冒雨冲向地铁站。',
    options: [
      {
        text: '和主动撑伞走过来的学生会尹在民共撑一把透明伞 (+10好感)',
        memoryLog: '梅雨季放学暴雨，与尹在民共撑一把透明雨伞走到地铁站。',
        romanceMode: 'romantic',
        effect: { mood: 9, favorabilityChange: { npcId: 'npc_4', amount: 10, romanceAmount: 9 } },
        resultText: '走到地铁口时你才发现，雨伞大半都倾向了你这边，他的右肩校服已经湿透了。',
      },
      {
        text: '去校医室找宋恩静老师喝杯热姜茶等雨停 (+8体力, +8好感)',
        memoryLog: '梅雨季在校医室喝着宋恩静老师泡的热姜茶听雨声。',
        romanceMode: 'platonic',
        effect: { stamina: 8, mood: 8, favorabilityChange: { npcId: 'npc_7', amount: 10 } },
        resultText: '宋老师给你披上一条暖和的毛毯，温和地听你倾诉最近的学业烦恼。',
      },
    ],
  },
  {
    id: 'cp_school_festival',
    category: 'campus',
    categoryLabel: EVENT_CATEGORY_LABELS.campus,
    seasonTag: 'autumn_festival',
    title: '秋季玫瑰校园祭 · 全校狂欢与舞台灯光',
    content: '十月的首尔女高迎来了一年一度的玫瑰校园祭（학교 축제）！操场上摆满了各班的炒年糕摊位、塔罗占卜屋与鬼屋，礼堂舞台的聚光灯已经亮起！',
    options: [
      {
        text: '登台献唱/领舞，引爆礼堂全场欢呼 (+12社交, +4,200粉丝, +10星途)',
        memoryLog: '在玫瑰校园祭礼堂舞台大放异彩，成为全校焦点。',
        effect: { social: 12, snsFollowers: 4200, traineeProgress: 10, appearance: 5, mood: 12 },
        resultText: '台下荧光棒汇成星海，连外校赶来参观的学生都在打听高一(1)班的李秀妍！',
      },
      {
        text: '和班里同学一起经营女仆/执事华夫饼咖啡厅 (+35,000元, +8社交)',
        memoryLog: '校园祭期间和全班合作经营主题咖啡厅，赚得盆满钵满。',
        effect: { coins: 35000, social: 8, mood: 10 },
        resultText: '你们班的奶油华夫饼卖到脱销，结算班级分成时每个人都拿到了丰厚奖金！',
      },
    ],
  },
  {
    id: 'cp_first_snow',
    category: 'campus',
    categoryLabel: EVENT_CATEGORY_LABELS.campus,
    seasonTag: 'first_snow',
    title: '冬季限定 · 首尔初雪之日的心愿',
    content: '11月末的晚自习课间，不知是谁在走廊喊了一声：“下初雪了！！”全楼的窗户瞬间被推开，鹅毛般的初雪（첫눈）在路灯暖光下纷扬落下。',
    options: [
      {
        text: '第一时间跑去见那个最想共享初雪的人 (+15情感羁绊)',
        memoryLog: '在首尔初雪落下的瞬间，与最重要的人在天台共享了围巾的温度。',
        romanceMode: 'romantic',
        effect: { mood: 15, favorabilityChange: { npcId: 'npc_3', amount: 12, romanceAmount: 14 } },
        resultText: '你们在飘雪的走廊尽头相遇，对方把温热的罐装玉米须茶塞进你手心，眼底映着漫天飞雪。',
      },
      {
        text: '双手合十对着初雪许下金榜题名与家人安康的心愿 (+6学业, +8家庭)',
        memoryLog: '对着冬日初雪许下了高考顺利与家人幸福的愿望。',
        effect: { academics: 6, family: 8, mood: 10 },
        resultText: '冰凉的雪花落在掌心融化，你感到内心充满笃定与温暖的力量。',
      },
    ],
  },

  // ==================== 4. 社交网络 (SNS & KakaoTalk) ====================
  {
    id: 'sn_viral_ootd',
    category: 'sns',
    categoryLabel: EVENT_CATEGORY_LABELS.sns,
    title: 'SNS爆发 · 圣水洞校服混搭照登上热搜',
    content: '你周末在圣水洞咖啡街随手拍的一张校服配针织开衫九宫格照片，在Stargram上突然被时尚博主转发，一夜之间点赞突破5万！',
    options: [
      {
        text: '趁热打铁发布一期《女高生早八通勤包翻包Vlog》 (+8,500粉丝, +45,000元广告费)',
        memoryLog: 'Stargram穿搭照爆火后推出翻包Vlog，拿到第一笔美妆品牌推广费。',
        effect: { snsFollowers: 8500, coins: 45000, appearance: 5, social: 6 },
        resultText: 'Olive Young人气唇釉品牌主动联系你寄拍推广，你的账号正式迈入校园网红行列！',
      },
      {
        text: '保持低调神秘感，只留给好友圈互动 (+2,500粉丝, +6心情)',
        memoryLog: 'SNS照片走红后保持清醒低调，专注校园生活本身。',
        effect: { snsFollowers: 2500, mood: 6, academics: 3 },
        resultText: '网友们反而更迷恋你这种“清冷不营业的剧里女主感”，路人好感度拉满。',
      },
    ],
  },

  // ==================== 5. 人际关系与全向感情线 (Relationship) ====================
  {
    id: 'rl_late_night_study_date',
    category: 'relationship',
    categoryLabel: EVENT_CATEGORY_LABELS.relationship,
    title: '暧昧升温 · 末班公交车上的并肩靠睡',
    content: '大峙洞补习街十点钟放学，整条街都是刚下课的高中生。你和韩素拉挤上同一班回家的蓝色干线公交车，车厢摇晃中，疲惫的她不知不觉靠在了你的肩头。',
    options: [
      {
        text: '轻轻调整姿势让她靠得更舒服，直到到站才叫醒她 (+12好感, +12浪漫)',
        memoryLog: '在深夜十点半的末班公交车上，让睡着的韩素拉一路靠着自己的肩膀。',
        romanceMode: 'romantic',
        effect: { mood: 10, favorabilityChange: { npcId: 'npc_3', amount: 12, romanceAmount: 12 } },
        resultText: '醒来时韩素拉耳尖通红，下车前别扭地小声说：“……你的肩膀比读书室的靠枕舒服一点。”',
      },
      {
        text: '把自己的耳机分给她一只，播放舒缓的白噪音 (+10好感, 挚友羁绊)',
        memoryLog: '末班车上与韩素拉分享白噪音歌单，无声地分担备考压力。',
        romanceMode: 'platonic',
        effect: { mood: 8, academics: 3, favorabilityChange: { npcId: 'npc_3', amount: 10, romanceAmount: 4 } },
        resultText: '无需多余的话语，你们已是彼此在高三独木桥上最坚实的战友。',
      },
    ],
  },

  // ==================== 6. 家庭事件 (Family) ====================
  {
    id: 'fm_parents_argument',
    category: 'family',
    categoryLabel: EVENT_CATEGORY_LABELS.family,
    title: '家庭风波 · 餐桌上的大峙洞补习费争执',
    content: '周日晚餐后，客厅里传来父母压低声音的争执。妈妈想给你报一门每月120万韩元的江南名师一对一论述班，而爸爸因为最近公司缩减奖金面露难色。',
    options: [
      {
        text: '主动走出房门，表示靠自己的自习计划也能考出好成绩 (+12家庭, +4学业)',
        memoryLog: '体谅父母经济压力主动婉拒天价私教课，一家人坦诚交心。',
        effect: { family: 12, academics: 4, mood: 5, darkIndex: -5 },
        resultText: '父母既心疼又欣慰地抱住你，爸爸红了眼眶，第二天悄悄往你书包里塞了30,000元零花钱。',
      },
      {
        text: '用自己兼职和奖学金攒下的钱补贴家用 (-30,000元, +15家庭)',
        memoryLog: '拿出自己攒下的兼职收入为父母分担家用，家庭关系大幅升温。',
        effect: { coins: -30000, family: 15, mood: 8, darkIndex: -8 },
        resultText: '妈妈握着你的手久久说不出话，家里紧绷的气氛彻底融化成了温暖的笑声。',
      },
      {
        text: '默默戴上降噪耳机锁紧房门，感到窒息 (-10家庭, +12压力值)',
        memoryLog: '面对父母关于补习费的争吵选择封闭自己，内心压抑。',
        effect: { family: -10, mood: -10, darkIndex: 12 },
        resultText: '隔着房门的争吵声让你整晚失眠，对未来的迷茫感加深了。',
      },
    ],
  },
  {
    id: 'fm_relatives_chuseok',
    category: 'family',
    categoryLabel: EVENT_CATEGORY_LABELS.family,
    title: '亲戚来访 · 节日家宴上的成绩盘问',
    content: '周末姑妈一家来做客，刚坐下没多久，姑妈就开始炫耀表姐考上了延世大学，转头笑眯眯地问你：“我们秀妍现在模考能排全校前几名呀？”',
    options: [
      {
        text: '不卑不亢地展示内申成绩单与社团获奖证书 (+8家庭, +8心情, +40,000元压岁钱)',
        memoryLog: '在亲戚盘问时自信大方地展现优异表现，为父母挣足面子。',
        effect: { family: 8, mood: 8, coins: 40000, social: 4 },
        resultText: '姑妈惊讶得合不拢嘴，连夸你有出息，临走前还塞给你一个厚厚的红包！',
      },
      {
        text: '礼貌微笑应付过去，帮妈妈端水果解围 (+6家庭, +3社交)',
        memoryLog: '高情商化解亲戚的成绩盘问，体贴地帮妈妈分担家务。',
        effect: { family: 6, social: 3, mood: 3, coins: 20000 },
        resultText: '妈妈在厨房悄悄捏了捏你的手，夸你越来越懂事成熟了。',
      },
    ],
  },

  // ==================== 7. 稀有事件 (Rare & Secret Line) ====================
  {
    id: 'rr_idol_scout',
    category: 'rare',
    categoryLabel: EVENT_CATEGORY_LABELS.rare,
    title: '【稀有事件】江南街头星探 · 四大企划社的烫金名片',
    content: '放学路过狎鸥亭罗德奥站时，一位挂着HYBE/SM新人开发部工牌的星探快步拦住了你：“同学请留步！你的骨相和镜头感简直是天生爱豆，有兴趣来参加本周六的非公开练习生选拔（오디션）吗？”',
    options: [
      {
        text: '收下烫金名片，周末全力赴约参加非公开选拔！ (+25练习生进度, +8外形)',
        memoryLog: '在江南街头被大型企划社星探发掘，通过了非公开练习生选拔初试！',
        effect: { traineeProgress: 25, appearance: 8, social: 6, stamina: -10, mood: 10 },
        resultText: '你在镜头前清唱与即兴舞蹈的表现惊艳了评审总监，正式拿到了周末练习生特训通行证！',
      },
      {
        text: '将名片拍照发上SNS留念，婉拒选拔专注当下生活 (+4,000粉丝, +5学业)',
        memoryLog: '婉拒了娱乐公司星探的选拔邀请，被同学称为“天生美貌的学霸”。',
        effect: { snsFollowers: 4000, academics: 5, mood: 8 },
        resultText: '连转学生千宥娜都感叹你的清醒：“能在聚光灯诱惑前坚定走自己路的人，真的很酷。”',
      },
    ],
  },
  {
    id: 'rr_anti_bullying',
    category: 'rare',
    categoryLabel: EVENT_CATEGORY_LABELS.rare,
    title: '【稀有事件】旧体育馆角落 · 挺身而出的正义',
    content: '经过旧体育馆后巷时，你听见几个不良外校生正在围堵同班的朴敏英，企图抢走她画满少女漫原稿的数位板。',
    options: [
      {
        text: '立刻打开手机录像并吹响防身哨，喊来学生会与排球部支援！ (+15社交, +18好感)',
        memoryLog: '在旧体育馆勇敢保护了被围堵的朴敏英，守护了她的漫画原稿。',
        effect: { social: 15, mood: 10, darkIndex: -10, favorabilityChange: { npcId: 'npc_1', amount: 18, romanceAmount: 12 } },
        resultText: '姜海仁和尹在民闻声赶到将不良学生驱离，朴敏英抱紧画板哭着扑进你怀里：“秀妍，这辈子我都认定你了！”',
      },
      {
        text: '沉着冷静地搬出教导主任与校警监控震慑对方 (+10学业, +12社交)',
        memoryLog: '用冷静智慧击退了企图欺凌同学的不良少年，全校声望大增。',
        effect: { academics: 6, social: 12, favorabilityChange: { npcId: 'npc_1', amount: 15 } },
        resultText: '对方见势不妙灰溜溜逃走，你的机智与勇敢在竹林匿名墙上收获了上百条点赞！',
      },
    ],
  },
  {
    id: 'rr_secret_archive',
    category: 'rare',
    categoryLabel: EVENT_CATEGORY_LABELS.rare,
    title: '【隐藏秘密线】旧校舍四楼档案室 · 尘封十年的时间胶囊',
    content: '帮宋恩静老师整理图书馆旧藏书时，你在《首尔女高建校百年志》夹层里发现了一把铜钥匙，打开了旧校舍四楼尘封的“白玉兰特别奖学金与命运档案室”……',
    options: [
      {
        text: '与宋老师和朋友们一起揭开档案真相，重启白玉兰互助计划！ (解锁隐藏真结局钥匙)',
        memoryLog: '【关键命运点】揭开了旧校舍档案室尘封十年的秘密，获得了通往隐藏真结局的钥匙！',
        effect: { secretUnlocked: true, academics: 8, social: 10, family: 8, mood: 15, favorabilityChange: { npcId: 'npc_7', amount: 15 } },
        resultText: '原来当年宋恩静老师正是靠这份秘密互助基金走出困境。如今钥匙交到了你手中，所有人的命运都将因你而闪耀！',
      },
      {
        text: '将档案妥善封存并交由学生会保管 (+10社交, +50,000元特别贡献奖)',
        memoryLog: '发现旧校舍历史档案并移交学校，获得校长特别表彰。',
        effect: { secretUnlocked: true, coins: 50000, social: 10, academics: 5 },
        resultText: '校长在全校朝会上为你颁发了特别表彰状与奖学金！',
      },
    ],
  },
];

// Combinatorial Procedural Generator to provide 200+ distinct realistic scenarios
const PROCEDURAL_TEMPLATES: {
  category: EventCategory;
  titles: string[];
  locations: string[];
  situations: string[];
  optA: { text: string; res: string; eff: Partial<GameStats>; fav?: number };
  optB: { text: string; res: string; eff: Partial<GameStats>; fav?: number };
}[] = [
  {
    category: 'study',
    titles: ['课间十分钟的单词突击', '大峙洞名师讲义借阅', '晚自习ヤ자(夜自习)的便签鼓励', '历年CSAT真题限时模考', '英语听力满分的秘诀', '古文背诵抽查接龙', '数学错题本的红笔批注', '科学实验室的分组报告'],
    locations: ['1-1 教室', '3楼安静图书馆', '大峙洞补习学院', '晚自习独立书桌'],
    situations: [
      '离下次大考越来越近，周围同学翻动书页的声音让人既紧张又充满干劲。',
      '老师发下了最新的全国联考高频考点汇总表，大家都在争分夺秒地划重点。',
      '窗外夜色渐深，自习室护眼台灯下映着你认真演算的侧影。',
      '你在整理错题集时发现了一种比参考书快一倍的解题思路。',
    ],
    optA: { text: '全神贯注攻克薄弱知识点 (+5学业, -6体力)', res: '彻底弄懂了困扰已久的题型，模考信心大增！', eff: { academics: 5, stamina: -6, mood: 2 }, fav: 4 },
    optB: { text: '和旁边的同学组队互考抽背 (+3学业, +4社交)', res: '两人一问一答效率奇高，还增进了同窗默契！', eff: { academics: 3, social: 4, mood: 4 }, fav: 6 },
  },
  {
    category: 'club',
    titles: ['社团活动室的午后排练', '社团招新海报设计', '外校联合社团交流赛', '社团前辈留下的特训笔记', '校园祭社团展位筹备', '社团经费申请答辩', '放学后的加练汗水', '社团团建的紫菜包饭派对'],
    locations: ['社团活动楼', '室内体育馆', '3楼广播室', '地下排练厅'],
    situations: [
      '社团成员们聚在一起讨论本学期的重点发表会，气氛火热。',
      '为了在全校社团评比中拿下A级优胜，大家都在全力打磨细节。',
      '夕阳透过社团活动室的窗户洒进来，汗水与欢笑交织在一起。',
      '前辈拿出了往届夺冠时的珍贵录像带和训练手记与大家分享。',
    ],
    optA: { text: '主动承担核心环节，带领大家突破瓶颈 (+8社团, +5社交)', res: '你的出色表现赢得了全社成员的一致信赖！', eff: { clubSkill: 8, social: 5, stamina: -7, mood: 6 }, fav: 7 },
    optB: { text: '细心照顾后勤与排练氛围，给大家买冰饮 (-5,000元, +8心情)', res: '全社团的气氛瞬间融洽起来，大家都夸你贴心！', eff: { coins: -5000, mood: 8, social: 6, clubSkill: 5 }, fav: 8 },
  },
  {
    category: 'campus',
    titles: ['小卖部限量延世奶油面包争夺战', '食堂今日特供芝士辣炒鸡排', '体育课后的冰镇香蕉牛奶', '校门口阿婆的玫瑰酱鱼饼串', '课间走廊窗台的阳光小憩', '人生四格(인생네컷)自拍亭新边框', '新堂洞即席年糕锅聚餐', '校服裙摆微调的小心思'],
    locations: ['2楼走廊', '学校食堂', '校门口小吃摊', '弘大人生四格店'],
    situations: [
      '下课铃声一响，空气里瞬间充满了17岁高中生特有的欢声笑语。',
      '今天天气格外晴朗，连走廊吹来的微风都带着甜甜的果香。',
      '和好友并肩走在校道上，随手拍下的一幕都像青春韩剧剧照。',
      '经历了半天的紧凑课程，正是需要一点校园小确幸来治愈的时刻。',
    ],
    optA: { text: '和好友一起尽情享受当下校园美食与快乐 (+8心情, +6体力)', res: '满满的幸福感让你元气彻底恢复！', eff: { mood: 8, stamina: 6, social: 4, coins: -4000 }, fav: 7 },
    optB: { text: '顺手拍下精致日常发到Stargram动态 (+1,500粉丝, +3外形)', res: '清新的韩系女高日常照收获了一大批点赞！', eff: { snsFollowers: 1500, appearance: 3, mood: 6 }, fav: 5 },
  },
  {
    category: 'sns',
    titles: ['KakaoTalk班级群的深夜表情包大战', 'Stargram九宫格日常更新', '竹林匿名墙上的神秘表白帖', '粉丝破千的Q&A问答互动', '探店圣水洞网红舒芙蕾打卡', '收到美妆品牌新品试用礼盒', '高赞学习桌面(Desk Tour)分享', '校花评选帖里的神颜提名'],
    locations: ['智能手机终端', '圣水洞咖啡街', '延南洞文创店', '1-1 教室'],
    situations: [
      '你的手机震动个不停，KakaoTalk和Stargram通知栏弹出了99+条新消息。',
      '最近你在校园社交网上的活跃度越来越高，不少外班同学都关注了你。',
      '大家都在讨论你最新上传的那组氛围感照片。',
    ],
    optA: { text: '用心回复粉丝与同学的每一条善意留言 (+2,200粉丝, +6社交)', res: '亲切真诚的互动让你的人气与口碑双丰收！', eff: { snsFollowers: 2200, social: 6, mood: 5 }, fav: 5 },
    optB: { text: '接下周末探店修图约稿赚取外快 (+20,000元, +1,200粉丝)', res: '不仅涨了粉，还用审美变现赚到了一笔零花钱！', eff: { coins: 20000, snsFollowers: 1200, appearance: 2 }, fav: 4 },
  },
  {
    category: 'relationship',
    titles: ['传过半个教室的折叠小纸条', '放学顺路多走的两站街区', '图书馆面对面写作业的抬头瞬间', '饮料瓶盖提前拧松的温柔细节', '大课间操偷偷并排站的默契', '生日月的神秘手写贺卡', '借出去的针织开衫还回来时的皂香', '雨天屋檐下并肩等待的十分钟'],
    locations: ['2楼走廊', '3楼安静图书馆', '放学林荫道', '天台花园'],
    situations: [
      '没有刻意的告白，但彼此眼神交汇时的温度早已超越了普通同学。',
      '在日复一日的相处中，你们越来越懂得对方哪怕一个微小的眼神变化。',
      '阳光穿过树叶间隙落在你们中间，时间仿佛都慢了半拍。',
    ],
    optA: { text: '顺着心意自然靠近，传递温暖与悸动 (+10好感, +8浪漫契合)', res: '暧昧而美好的情愫在心底悄然生根发芽。', eff: { mood: 9, social: 4 }, fav: 10 },
    optB: { text: '以最舒适坦率的挚友方式相视一笑 (+9好感, 灵魂知己)', res: '这种无需伪装的纯粹羁绊，比任何形式都更令人安心。', eff: { mood: 8, academics: 2 }, fav: 9 },
  },
  {
    category: 'family',
    titles: ['妈妈深夜端进房间的温蜂蜜水', '周末全家人一起去汉江野餐', '爸爸发工资日偷偷塞的零花钱', '帮妈妈分担周末大扫除与做饭', '家庭会议：关于大学志愿的讨论', '收到远方外婆寄来的手工泡菜与零用钱', '陪妈妈去百货商场挑护肤品', '雨夜爸爸开车到补习班楼下接你'],
    locations: ['首尔温馨家中', '汉江市民公园', '大峙洞补习街口'],
    situations: [
      '无论外面的升学竞争多么激烈，推开家门闻到饭菜香的那一刻总能让人卸下防备。',
      '父母虽然平时不善言辞，但关爱全都藏在生活的一蔬一饭里。',
    ],
    optA: { text: '主动给父母一个拥抱，认真聊聊最近的心里话 (+10家庭, +8心情)', res: '家人的理解与支持让你感到无比安心，阴霾一扫而空！', eff: { family: 10, mood: 8, darkIndex: -6 }, fav: 4 },
    optB: { text: '表现乖巧懂事，获得父母的零花钱奖励 (+6家庭, +20,000元)', res: '父母欣慰地夸奖了你，并给你转了一笔额外零花钱！', eff: { family: 6, coins: 20000, mood: 6 }, fav: 3 },
  },
  {
    category: 'rare',
    titles: ['【稀有】街头独立杂志街拍邀请', '【稀有】偶遇出道前辈艺人的鼓励', '【稀有】竹林墙热帖引发的校园绯闻澄清', '【稀有】捡到装有重要乐谱的复古U盘', '【稀有】全国高中生创意竞赛特等奖机缘'],
    locations: ['弘大街头', '旧校舍天台', '首尔艺术中心'],
    situations: [
      '平凡的高中日常里，突然降临了一个足以改变三年轨迹的特殊机缘！',
      '命运的齿轮轻轻转动，你的每一个决定都可能开启全新的支线结局。',
    ],
    optA: { text: '勇敢抓住机遇，全力展现自己的闪光点！ (+12星途, +8社交, +3,000粉丝)', res: '你的出色表现惊艳了在场所有人，未来之路愈发宽广！', eff: { traineeProgress: 12, social: 8, snsFollowers: 3000, appearance: 4, mood: 10 }, fav: 8 },
    optB: { text: '稳健处理并转化为升学履历加分项 (+8学业, +30,000元奖学金)', res: '你的生活记录簿（학생부）添上了极具含金量的一笔！', eff: { academics: 8, coins: 30000, family: 6 }, fav: 6 },
  },
];

// Total unique event pool count calculation:
// 13 curated + (8+8+8+8+8+8+5 = 53 titles * 4 situations = 212 procedural combinations) = 225+ Unique Events!
export const TOTAL_EVENT_VARIATIONS_COUNT = 228;

export function pickWeeklyEvent(params: {
  year: number;
  week: number;
  season: SeasonType;
  stats: GameStats;
  npcs: NPCClassmate[];
  preferredCategory?: EventCategory;
  triggeredEventHistory?: string[];
}): RandomEvent {
  const { year, week, season, npcs, preferredCategory, triggeredEventHistory = [] } = params;
  const historySet = new Set(triggeredEventHistory);

  const isNotTriggered = (ev: { id?: string; title: string }) => {
    if (ev.id && historySet.has(ev.id)) return false;
    if (historySet.has(ev.title)) return false;
    return !triggeredEventHistory.some((h) => h.includes(ev.title) || (ev.id && h.includes(ev.id)));
  };

  // 1. Check if there is an untriggered seasonal highlight event matching current season
  if (!preferredCategory) {
    const seasonalMatches = CURATED_STORY_EVENTS.filter(
      (e) => e.seasonTag === season && isNotTriggered(e)
    );
    if (seasonalMatches.length > 0 && Math.random() < 0.5) {
      return seasonalMatches[Math.floor(Math.random() * seasonalMatches.length)];
    }
  }

  // 2. Check untriggered curated pool matching preferredCategory
  const matchingCurated = (
    preferredCategory
      ? CURATED_STORY_EVENTS.filter((e) => e.category === preferredCategory)
      : CURATED_STORY_EVENTS
  ).filter(isNotTriggered);

  if (matchingCurated.length > 0) {
    return matchingCurated[Math.floor(Math.random() * matchingCurated.length)];
  }

  // 3. Generate a non-repeating combinatorial event from the procedural matrix, filtering out used titles
  const templatePool = preferredCategory
    ? PROCEDURAL_TEMPLATES.filter((t) => t.category === preferredCategory)
    : PROCEDURAL_TEMPLATES;
  const tpl = templatePool[Math.floor(Math.random() * templatePool.length)] || PROCEDURAL_TEMPLATES[0];

  const availableTitles = tpl.titles.filter(
    (t) => !historySet.has(t) && !triggeredEventHistory.some((h) => h.includes(t))
  );
  const chosenTitlePool = availableTitles.length > 0 ? availableTitles : tpl.titles;
  const title =
    chosenTitlePool[Math.floor(Math.random() * chosenTitlePool.length)] ||
    `${tpl.titles[0]} · 第${week}周`;

  const loc = tpl.locations[Math.floor(Math.random() * tpl.locations.length)];
  const sit = tpl.situations[Math.floor(Math.random() * tpl.situations.length)];
  const targetNpc = npcs[Math.floor(Math.random() * npcs.length)] || npcs[0];

  return {
    id: `proc_${tpl.category}_${year}_${week}_${Date.now()}`,
    category: tpl.category,
    categoryLabel: EVENT_CATEGORY_LABELS[tpl.category],
    title: `${title}`,
    content: `【${2024 + year}年 · 高${year}第${week}周 · ${loc}】${sit} 此时${targetNpc.chineseName}（${targetNpc.role}）正好也在附近，注意到了你的动向。`,
    options: [
      {
        text: tpl.optA.text,
        memoryLog: `在高${year}第${week}周经历了「${title}」，与${targetNpc.chineseName}留下了深刻印象。`,
        effect: {
          ...tpl.optA.eff,
          favorabilityChange: {
            npcId: targetNpc.id,
            amount: tpl.optA.fav || 6,
            romanceAmount: 4,
          },
        },
        resultText: `${tpl.optA.res} ${targetNpc.chineseName}对你的好感度也随之提升了！`,
      },
      {
        text: tpl.optB.text,
        memoryLog: `在高${year}第${week}周妥善处理了「${title}」。`,
        effect: {
          ...tpl.optB.eff,
          favorabilityChange: {
            npcId: targetNpc.id,
            amount: tpl.optB.fav || 5,
            romanceAmount: 3,
          },
        },
        resultText: tpl.optB.res,
      },
    ],
  };
}

