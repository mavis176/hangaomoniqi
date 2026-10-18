import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Camera,
  Heart,
  MessageCircle,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Send,
  Briefcase,
  UtensilsCrossed,
  Palette,
  Award,
  Users,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { GameStats, NPCClassmate, SNSPost } from '../../types';
import { generateGroupChatReplies, generateAICharacterAvatar } from '../../services/aiService';

interface SNSPhoneModalProps {
  onClose: () => void;
  stats: GameStats;
  npcs: NPCClassmate[];
  snsPosts: SNSPost[];
  weekLabel: string;
  onPublishPost: (post: SNSPost, statsDelta: Partial<GameStats>) => void;
  onOpenNpcChat: (npc: NPCClassmate) => void;
  onOpenForum: () => void;
  onNotify: (msg: string) => void;
  protagonistAvatar?: string;
  onChangeProtagonistAvatar?: (url: string) => void;
  onUpdateFavorability?: (npcId: string, amount: number, romanceDelta?: number) => void;
}

export const SNSPhoneModal: React.FC<SNSPhoneModalProps> = ({
  onClose,
  stats,
  npcs,
  snsPosts,
  weekLabel,
  onPublishPost,
  onOpenNpcChat,
  onOpenForum,
  onNotify,
  protagonistAvatar,
  onChangeProtagonistAvatar,
  onUpdateFavorability,
}) => {
  const [activeTab, setActiveTab] = useState<
    'stargram' | 'kakao' | 'bubble' | 'delivery' | 'alba' | 'aistudio'
  >('stargram');

  // Stargram state
  const [customCaption, setCustomCaption] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ootd');
  const [completedPRIds, setCompletedPRIds] = useState<string[]>([]);

  // KakaoTalk state
  const [kakaoMode, setKakaoMode] = useState<'contacts' | 'group'>('contacts');
  const [groupType, setGroupType] = useState<'class' | 'idol'>('class');
  const [groupInput, setGroupInput] = useState('');
  const [isGroupSending, setIsGroupSending] = useState(false);
  const [groupMessages, setGroupMessages] = useState<
    { sender: 'user' | 'npc'; name: string; avatar?: string; text: string; time: string }[]
  >([
    {
      sender: 'npc',
      name: '金智英',
      text: '家人们！！今天食堂中午居然有芝士辣炒鸡排和草莓牛奶，下课铃一响谁跟我冲第一波？🏃‍♀️✨',
      time: '11:45',
    },
    {
      sender: 'npc',
      name: '朴敏英',
      text: '我已经帮秀妍把餐盘和湿纸巾都准备好啦~ 秀妍今天想吃什么？🍓',
      time: '11:46',
    },
    {
      sender: 'npc',
      name: '韩素拉',
      text: '……你们去抢吧，顺便帮我带一瓶无糖冰美式，钱转你们KakaoPay。',
      time: '11:47',
    },
  ]);

  // Bubble state
  const [bubbleFeed, setBubbleFeed] = useState<
    { id: string; text: string; tag: string; time: string; fanReplies: string[] }[]
  >([
    {
      id: 'b_init',
      tag: '🤳 练习室日常泡泡',
      text: '今天也在练习室把副歌动作抠了五十遍~ 大家今晚也要早点休息哦，晚安🌙',
      time: '昨天 23:15',
      fanReplies: [
        '秀妍宝宝辛苦了ㅠㅠ 今晚梦里见！！',
        '全世界最宠粉的养成系紫微星，我们永远陪你走花路🌸',
        '已经把秀妍的Bubble设成特别关心提示音啦！',
      ],
    },
  ]);
  const [customBubbleText, setCustomBubbleText] = useState('');

  // Delivery state
  const [shareNpcId, setShareNpcId] = useState<string>('npc_1');

  // AI Photo Studio & Life4Cuts state
  const [aiPromptInput, setAiPromptInput] = useState(
    '韩系清纯女高，柔顺栗棕色长发，水光感杏眼，奶油色校服针织开衫配酒红领结，樱花教室柔光'
  );
  const [aiStylePreset, setAiStylePreset] = useState<'webtoon' | 'anime' | 'idol' | 'watercolor'>('webtoon');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>(protagonistAvatar || '/avatars/sooyeon_default.jpg');

  const photoThemes = [
    {
      id: 'ootd',
      tag: '#今日校服穿搭 #OOTD',
      defaultCaption: '今天的针织开衫配百褶裙，走廊阳光刚好~ ✨',
      baseFollowers: 1500,
      sponsorCoin: 15000,
    },
    {
      id: 'dance',
      tag: '#练习室直拍 #KpopCover',
      defaultCaption: '放学后在社团镜子前录的副歌直拍，大家觉得卡点怎么样？🎵',
      baseFollowers: 2600,
      sponsorCoin: 28000,
    },
    {
      id: 'cafe',
      tag: '#圣水洞探店 #人生四格',
      defaultCaption: '周末和最重要的人一起拍了最新联名款人生四格 📸💕',
      baseFollowers: 1900,
      sponsorCoin: 18000,
    },
    {
      id: 'study',
      tag: '#大峙洞自习 #Gongstagram',
      defaultCaption: '凌晨十二点的读书室，刷完最后一套全国联考真题 📚☕',
      baseFollowers: 1200,
      sponsorCoin: 10000,
    },
    {
      id: 'stage',
      tag: '#打歌后台自拍 #IdolCenter',
      defaultCaption: '戴好专属定制耳返准备上台啦，听到台下你们的应援声了！👑🎤',
      baseFollowers: 3800,
      sponsorCoin: 45000,
    },
    {
      id: 'snow',
      tag: '#首尔初雪 #围巾自拍',
      defaultCaption: '听说初雪这天发动态，心里想的愿望一定会实现 ❄️🧣',
      baseFollowers: 2200,
      sponsorCoin: 22000,
    },
  ];

  const brandPRDeals = [
    {
      id: 'pr_oliveyoung',
      brand: 'Olive Young · 销冠水光镜面唇釉推广',
      minFollowers: 1000,
      pay: 45000,
      followerBoost: 1500,
      desc: '拍摄一组课间涂抹水光唇釉的清透九宫格返图，标注品牌Tag。',
      effect: { coins: 45000, snsFollowers: 1500, appearance: 4, mood: 6, stamina: -6 },
    },
    {
      id: 'pr_yonsei',
      brand: '延世大学牧场 · 生牛乳奶油面包校园大使',
      minFollowers: 3500,
      pay: 85000,
      followerBoost: 2800,
      desc: '在教室与同桌一起拍摄爆浆奶油面包吃播Reels短视频。',
      effect: { coins: 85000, snsFollowers: 2800, social: 6, mood: 8, stamina: -6 },
    },
    {
      id: 'pr_gentle',
      brand: 'GENTLE MONSTER · 圣水洞概念旗舰店画报',
      minFollowers: 10000,
      pay: 180000,
      followerBoost: 6500,
      desc: '受邀前往圣水洞HAUS DOSAN拍摄先锋墨镜时尚街拍。',
      effect: { coins: 180000, snsFollowers: 6500, appearance: 8, cameraSkill: 8, stamina: -10 },
    },
    {
      id: 'pr_miumiu',
      brand: 'Miu Miu · 清潭洞高奢学院风大秀看秀邀约',
      minFollowers: 25000,
      pay: 420000,
      followerBoost: 16000,
      desc: '身着品牌当季秀款百褶裙出席首尔大秀头排，外媒生图刷屏热搜！',
      effect: { coins: 420000, snsFollowers: 16000, appearance: 12, social: 14, cameraSkill: 12, stamina: -12 },
    },
  ];

  const handleUploadPhoto = () => {
    if (stats.stamina < 8) {
      onNotify('体力不足，先点份外卖或休息一下再发动态吧！');
      return;
    }
    const theme = photoThemes.find((t) => t.id === selectedTheme) || photoThemes[0];
    const appearanceMultiplier = 1 + (stats.appearance - 60) / 70;
    const followerGain = Math.max(300, Math.round(theme.baseFollowers * appearanceMultiplier));
    const likes = Math.round(followerGain * 3.2 + stats.snsFollowers * 0.28);
    const adRevenue = stats.snsFollowers >= 3000 ? theme.sponsorCoin : 0;

    const pickedNpcs = [...npcs].sort(() => Math.random() - 0.5).slice(0, 3);
    const captionText = customCaption.trim() || theme.defaultCaption;

    const npcCommentBank: Record<string, string> = {
      npc_1: `哇秀妍这张氛围感绝了！！我已经第一个点赞收藏设为壁纸啦 ❤️`,
      npc_2: `救命！！这是什么女团门面神颜，链接和滤镜参数快交出来！！✨`,
      npc_3: `……拍得还行吧。不过点赞数涨这么快，你明天来学校又要被学妹围观了。`,
      npc_4: `阳光落在发梢上的角度很温柔，很适合今天广播室放的那首曲子。🎸`,
      npc_5: `太好看了吧秀妍！！我们排球部全员刚才都在刷你这条动态！🔥`,
      npc_6: `镜头感越来越有大势爱豆的味道了，这张可以直接当出道预告照。👑`,
      npc_7: `青春明媚的模样真美好，今天也要注意劳逸结合哦~ 🌸`,
      npc_8: `咳，符合校规礼仪的优秀穿搭范本……我用个人账号点过赞了。`,
    };

    const newPost: SNSPost = {
      id: `sns_${Date.now()}`,
      weekLabel,
      tag: theme.tag,
      caption: captionText,
      likes,
      followerGain,
      npcComments: pickedNpcs.map((n) => ({
        npcName: n.chineseName,
        text: npcCommentBank[n.id] || '状态超好，秒赞！',
      })),
    };

    onPublishPost(newPost, {
      stamina: -8,
      mood: 8,
      social: 5,
      snsFollowers: followerGain,
      coins: adRevenue,
      traineeProgress: selectedTheme === 'dance' || selectedTheme === 'stage' ? 6 : 2,
    });

    setCustomCaption('');
    onNotify(
      `📸 Stargram动态发布成功！涨粉 +${followerGain.toLocaleString()}，获赞 ${likes.toLocaleString()}${
        adRevenue > 0 ? `，品牌推广分成 +₩${adRevenue.toLocaleString()}` : ''
      }！`
    );
  };

  const handleSendGroupMessage = async (msgText?: string) => {
    const text = (msgText ?? groupInput).trim();
    if (!text || isGroupSending) return;

    const nowTime = '刚刚';
    setGroupMessages((prev) => [...prev, { sender: 'user', name: '李秀妍 (我)', text, time: nowTime }]);
    setGroupInput('');
    setIsGroupSending(true);

    try {
      const replies = await generateGroupChatReplies({
        userMessage: text,
        groupType,
        npcs,
        timeContext: weekLabel,
      });

      const formatted = replies.map((r) => ({
        sender: 'npc' as const,
        name: r.npcName,
        text: r.text,
        time: '刚刚',
      }));

      setGroupMessages((prev) => [...prev, ...formatted]);
      onPublishPost(
        {
          id: `grp_${Date.now()}`,
          weekLabel,
          tag: '#Kakao群聊互动',
          caption: `在群里和大家热聊了：“${text}”`,
          likes: 120,
          followerGain: 60,
          npcComments: [],
        },
        { mood: 6, social: 5 }
      );
      if (onUpdateFavorability) {
        replies.forEach((r) => {
          if (r.npcId) onUpdateFavorability(r.npcId, 3);
        });
      }
    } catch (_e) {
      setGroupMessages((prev) => [
        ...prev,
        {
          sender: 'npc',
          name: '朴敏英',
          text: `秀妍说的“${text.slice(0, 18)}”我举双手赞成！放学后我们一起行动吧！`,
          time: '刚刚',
        },
      ]);
    } finally {
      setIsGroupSending(false);
    }
  };

  const bubbleActions = [
    {
      id: 'b_selfie',
      title: '🤳 发送刚练完舞的镜面自拍 + 晚安语音',
      tag: '🤳 独家自拍泡泡',
      defaultText: '刚从练习室出来，衣服都汗湿啦~ 但想到你们在等我的泡泡就一点都不觉得累！早点睡哦💕',
      effect: { snsFollowers: 2600, coins: 58000, cameraSkill: 5, mood: 8, stamina: -6 },
      replies: [
        '啊啊啊是新鲜的练习室素颜自拍！！皮肤好到发光ㅠㅠ',
        '秀妍一定要注意补充水分，我们永远是你的底气！',
        '这月订Bubble的4500韩元简直花得太值了，每天幸福感爆棚！',
      ],
    },
    {
      id: 'b_vocal',
      title: '🎤 发送45秒清唱未公开Demo音频泡泡',
      tag: '🎤 清唱语音泡泡',
      defaultText: '睡前在被窝里偷偷给你们哼一小段新写的旋律，只给订阅Bubble的专属粉丝听哦 🎵',
      effect: { snsFollowers: 3200, coins: 72000, vocalSkill: 6, traineeProgress: 5, stamina: -6 },
      replies: [
        '救命这蜜嗓清唱我直接循环了五十遍！！耳膜被净化了！',
        '制作人快来看啊，我们秀妍不仅颜值顶配，连自作曲都这么好听！',
        '已设为清晨闹钟，每天被秀妍的歌声叫醒太幸福了！',
      ],
    },
    {
      id: 'b_fanletter',
      title: '💌 翻牌回复10封粉丝长信与高三考生应援',
      tag: '💌 宠粉翻牌泡泡',
      defaultText: '每一封信我都一字不落地读完啦！正在备战高考和努力生活的大家，我们一起在顶峰相见吧✨',
      effect: { snsFollowers: 3800, coins: 85000, social: 10, mood: 12, stamina: -8 },
      replies: [
        '天哪秀妍居然翻牌了我的高考倒计时信！！我直接哭出声，明天刷题动力拉满！',
        '双向奔赴的神仙爱豆李秀妍，一辈子不脱粉！！',
        '韩网热帖：《连粉丝手写信里提过的小细节都记住的李秀妍》万赞出圈！',
      ],
    },
  ];

  const deliveryItems = [
    {
      id: 'del_bhc',
      name: '🍗 BHC 芝士球 + 蜂蜜芥末炸鸡双拼',
      shop: 'BHC Chicken 江南总店 · 25分钟闪送',
      price: 24000,
      desc: '酥脆爆浆芝士球配无骨炸鸡！立即恢复 体力+32、心情+18，还可邀请好友同享 (+8好感)！',
      effect: { stamina: 32, mood: 18, coins: -24000 },
      canShare: true,
    },
    {
      id: 'del_mega',
      name: '☕ Mega Coffee 1L装冰美式 & 草莓拿铁',
      shop: 'Mega MGC Coffee · 15分钟送达',
      price: 8500,
      desc: '韩国高中生刷题与早训必备续命水！体力+18、学业+4、暗黑压力-8。',
      effect: { stamina: 18, academics: 4, darkIndex: -8, coins: -8500 },
      canShare: true,
    },
    {
      id: 'del_olive',
      name: '💄 Olive Young 销冠水光唇釉 & 积雪草面膜礼盒',
      shop: 'Olive Young 即时达 · 30分钟闪送',
      price: 35000,
      desc: '清潭洞化妆师同款水光肌急救包！外形+9、镜头感+5、粉丝+1,200。',
      effect: { appearance: 9, cameraSkill: 5, snsFollowers: 1200, coins: -35000 },
      canShare: false,
    },
    {
      id: 'del_ginseng',
      name: '💊 正官庄 Everytime 高丽红参精浓缩液礼盒',
      shop: '正官庄官方旗舰店 · 闪送',
      price: 48000,
      desc: '高三冲刺与选秀连轴转的终极元气补给！体力+50、心情+12、暗黑压力-18。',
      effect: { stamina: 50, mood: 12, darkIndex: -18, coins: -48000 },
      canShare: false,
    },
    {
      id: 'del_boba_truck',
      name: '🧋 贡茶黑糖珍珠奶茶 · 全班/练习室豪华应援请客',
      shop: 'Gong Cha 校园应援专送',
      price: 75000,
      desc: '豪气请全班同学与练习室伙伴喝奶茶！全员NPC好感+6、社交+15、粉丝+2,800！',
      effect: { social: 15, mood: 20, snsFollowers: 2800, coins: -75000 },
      shareAll: true,
    },
  ];

  const albaJobs = [
    {
      id: 'alba_illust',
      title: '🎨 Webtoon 韩漫读者Q版头像线稿约稿',
      tag: '手机远程兼职 · 当日结算',
      staminaCost: 12,
      pay: 45000,
      desc: '用平板帮网友绘制韩系Q版情侣/闺蜜头像，足不出户赚取丰厚稿费。',
      effect: { coins: 45000, mood: 4, appearance: 2, stamina: -12 },
    },
    {
      id: 'alba_notes',
      title: '📝 整理大峙洞一等级学霸手写错题PDF售卖',
      tag: '知识付费 · 边赚边学',
      staminaCost: 14,
      pay: 58000,
      desc: '将精心排版的数学与英语高频考点手帐上传至学习社区付费下载。',
      effect: { coins: 58000, academics: 5, social: 4, stamina: -14 },
    },
    {
      id: 'alba_model',
      title: '👗 Musinsa / 弘大潮牌网店私服寄拍模特',
      tag: '高薪穿搭寄拍 · 涨粉兼职',
      staminaCost: 15,
      pay: 88000,
      desc: '换上品牌寄来的新款学院风开衫对镜自拍返图，兼得高额模特费与品牌曝光！',
      effect: { coins: 88000, appearance: 5, snsFollowers: 1600, cameraSkill: 5, stamina: -15 },
    },
  ];

  const handleGenerateAIAvatar = async () => {
    if (!aiPromptInput.trim() || isGeneratingAvatar) return;
    setIsGeneratingAvatar(true);
    try {
      const res = await generateAICharacterAvatar({
        targetId: 'protagonist',
        characterName: '李秀妍',
        customPrompt: aiPromptInput.trim(),
        stylePreset: aiStylePreset,
        gender: 'female',
      });
      setPreviewAvatarUrl(res.avatarUrl);
      if (onChangeProtagonistAvatar) {
        onChangeProtagonistAvatar(res.avatarUrl);
      }
      onNotify('✨ AI 实时生图完成！已自动为你换上全新高颜值立绘头像！');
    } catch (_e) {
      onNotify('AI 生图请求繁忙，请稍后重试~');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const subscriberCount = Math.max(28, Math.floor(stats.snsFollowers * 0.22));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#faf8f5] border-4 border-[#2b2620] rounded-[34px] max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620]">
        {/* Top Smartphone Status Bar & Header */}
        <div className="bg-[#2b2620] text-white px-5 pt-3 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-pink-300" />
            <span className="text-xs font-bold tracking-wide">SKT 5G · 秀妍的智能机</span>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-amber-200 font-bold">
              ₩{stats.coins.toLocaleString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-App Home Screen Navigation Grid */}
        <div className="grid grid-cols-6 bg-[#ede8df] p-1.5 gap-1 border-b border-[#d6cfc2]">
          <button
            onClick={() => setActiveTab('stargram')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'stargram'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>📸</span>
            <span>Stargram</span>
          </button>
          <button
            onClick={() => setActiveTab('kakao')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'kakao'
                ? 'bg-[#fae100] text-[#3b1e1e] shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>💬</span>
            <span>Kakao群</span>
          </button>
          <button
            onClick={() => setActiveTab('bubble')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'bubble'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>🫧</span>
            <span>Bubble</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'delivery'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>🛵</span>
            <span>闪购外卖</span>
          </button>
          <button
            onClick={() => setActiveTab('alba')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'alba'
                ? 'bg-[#4b6b55] text-white shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>💼</span>
            <span>兼职通</span>
          </button>
          <button
            onClick={() => setActiveTab('aistudio')}
            className={`py-1.5 px-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
              activeTab === 'aistudio'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-xs'
                : 'text-[#5a5246] hover:bg-white/50'
            }`}
          >
            <span>🎨</span>
            <span>AI生图</span>
          </button>
        </div>

        {/* Main Smartphone Body */}
        <div
          className="p-3.5 pb-10 overflow-y-auto touch-scroll overscroll-contain flex-1 min-h-0 space-y-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* TAB 1: STARGRAM */}
          {activeTab === 'stargram' && (
            <>
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={protagonistAvatar || '/avatars/sooyeon_default.jpg'}
                    alt="李秀妍"
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-400"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xs font-bold text-rose-900">@suyeon_seoul2025</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">
                      {stats.snsFollowers >= 30000
                        ? '👑 认证百万级顶流网红/爱豆'
                        : stats.snsFollowers >= 3000
                        ? '✨ 已开通品牌PR推广分成'
                        : '🌱 满 1,000 粉丝可接品牌商务推广'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-rose-600 tabular-nums">
                    {stats.snsFollowers.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-800 font-bold">粉丝 (Followers)</div>
                </div>
              </div>

              {/* Publish New Post Box */}
              <div className="bg-white border border-[#e0d9cc] rounded-2xl p-3 space-y-2.5 shadow-xs">
                <div className="text-xs font-bold text-[#3d352b] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-rose-500" />
                    <span>发布新九宫格动态 (消耗8体力)</span>
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold">外形 {stats.appearance} 加成</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {photoThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                        selectedTheme === t.id
                          ? 'bg-rose-50 border-rose-400 text-rose-900'
                          : 'bg-[#f7f4ee] border-[#dfd8ca] text-[#5a5246]'
                      }`}
                    >
                      {t.tag}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="输入照片配文（留空则使用韩系氛围感默认文案）..."
                  className="w-full px-3 py-1.5 bg-[#f7f4ee] border border-[#d6cfc2] rounded-xl text-xs focus:outline-none"
                />

                <button
                  onClick={handleUploadPhoto}
                  className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>立即发布 Stargram 动态</span>
                </button>
              </div>

              {/* Brand PR Endorsement Deals */}
              <div className="bg-gradient-to-br from-amber-50/90 to-rose-50/80 border border-amber-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>品牌方商务PR私信邀约 (高额通告费)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">粉丝达标即可接单</span>
                </div>

                <div className="space-y-2">
                  {brandPRDeals.map((deal) => {
                    const unlocked = stats.snsFollowers >= deal.minFollowers;
                    const done = completedPRIds.includes(deal.id);
                    return (
                      <div
                        key={deal.id}
                        className="bg-white/95 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2b2620] truncate">{deal.brand}</div>
                          <div className="text-[11px] text-[#6e6456] mt-0.5">{deal.desc}</div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                            <span className="text-amber-700">报酬 +₩{deal.pay.toLocaleString()}</span>
                            <span className="text-rose-600">涨粉 +{deal.followerBoost.toLocaleString()}</span>
                            <span className="text-[#8c8273]">需 {deal.minFollowers.toLocaleString()} 粉</span>
                          </div>
                        </div>
                        <button
                          disabled={!unlocked || done || stats.stamina < 10}
                          onClick={() => {
                            setCompletedPRIds([...completedPRIds, deal.id]);
                            onPublishPost(
                              {
                                id: `pr_${Date.now()}`,
                                weekLabel,
                                tag: '#品牌商务合作 #Ad',
                                caption: `很荣幸受邀拍摄【${deal.brand}】特别企划画报 ✨`,
                                likes: deal.followerBoost * 4,
                                followerGain: deal.followerBoost,
                                npcComments: [
                                  { npcName: '金智英', text: '哇啊啊我们秀妍接到大牌商务了！！排面拉满！' },
                                  { npcName: '千宥娜', text: '表现力很专业，时尚资源彻底打开了。' },
                                ],
                              },
                              deal.effect
                            );
                            onNotify(
                              `💼 完成【${deal.brand}】拍摄！入账 +₩${deal.pay.toLocaleString()}，涨粉 +${deal.followerBoost.toLocaleString()}！`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700 disabled:opacity-45 text-white"
                        >
                          {done ? '已履约' : unlocked ? '接单拍摄' : '粉丝未达标'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-2.5">
                {snsPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-[#e2dcd0] rounded-2xl p-3 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-rose-600">{post.tag}</span>
                      <span className="text-[#8c8273]">{post.weekLabel}</span>
                    </div>
                    <p className="text-xs text-[#2b2620] font-medium">{post.caption}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#6e6456] pt-1">
                      <span className="flex items-center gap-1 text-rose-500 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" /> {post.likes.toLocaleString()}赞
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <TrendingUp className="w-3.5 h-3.5" /> +{post.followerGain}粉
                      </span>
                    </div>
                    {post.npcComments.length > 0 && (
                      <div className="bg-[#f7f4ee] rounded-xl p-2 space-y-1 mt-1">
                        {post.npcComments.map((c, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="font-bold text-[#3d352b]">{c.npcName}: </span>
                            <span className="text-[#5a5246]">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TAB 2: KAKAOTALK (1v1 & LIVE AI GROUP CHAT) */}
          {activeTab === 'kakao' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-[#fae100]/40 border border-[#e6cf00] rounded-xl p-1.5">
                <div className="flex gap-1">
                  <button
                    onClick={() => setKakaoMode('contacts')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      kakaoMode === 'contacts' ? 'bg-[#3b1e1e] text-[#fae100]' : 'text-[#3b1e1e]'
                    }`}
                  >
                    💌 1对1 私聊 ({npcs.length})
                  </button>
                  <button
                    onClick={() => setKakaoMode('group')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      kakaoMode === 'group' ? 'bg-[#3b1e1e] text-[#fae100]' : 'text-[#3b1e1e]'
                    }`}
                  >
                    🏫 班级/练习生 AI群聊 (99+)
                  </button>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenForum();
                  }}
                  className="text-[11px] font-bold text-[#6e5211] underline px-2 cursor-pointer"
                >
                  竹林墙 →
                </button>
              </div>

              {kakaoMode === 'contacts' ? (
                <div className="space-y-2">
                  {npcs.map((npc) => (
                    <div
                      key={npc.id}
                      onClick={() => {
                        onClose();
                        onOpenNpcChat(npc);
                      }}
                      className="bg-white hover:bg-[#fcfaf5] border border-[#e0d9cc] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={npc.avatar}
                          alt={npc.chineseName}
                          className="w-11 h-11 rounded-xl object-cover border border-[#cfc8ba] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-[#2b2620]">{npc.chineseName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ede8df] text-[#5a5246] font-bold">
                              {npc.role}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">
                              {npc.relationshipStage}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6e6456] truncate mt-0.5">{npc.status}</div>
                          <div className="text-[10px] text-[#8c7b65] mt-0.5">
                            取向：{npc.orientation} · 好感 {npc.favorability}% · 点击召唤实时AI对话
                          </div>
                        </div>
                      </div>
                      <MessageCircle className="w-4 h-4 text-[#7a6f5d] shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#b2c7d9] border border-[#9ab2c7] rounded-2xl p-3 flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-[#2b2620] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      <span>
                        {groupType === 'class' ? '首尔女高 1-1班 群聊 (8)' : '四大社出道预备组群 (8)'}
                      </span>
                    </span>
                    <button
                      onClick={() => setGroupType(groupType === 'class' ? 'idol' : 'class')}
                      className="text-[10px] font-bold bg-[#fae100] text-[#3b1e1e] px-2 py-0.5 rounded-lg cursor-pointer"
                    >
                      切换至{groupType === 'class' ? '练习生群' : '班级群'}
                    </button>
                  </div>

                  {/* Group Messages */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {groupMessages.map((gm, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${gm.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-bold text-[#2b3844] mb-0.5 px-1">{gm.name}</span>
                        <div
                          className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs shadow-2xs ${
                            gm.sender === 'user'
                              ? 'bg-[#fae100] text-[#3b1e1e] font-medium rounded-br-xs'
                              : 'bg-white text-[#2b2620] rounded-bl-xs'
                          }`}
                        >
                          {gm.text}
                        </div>
                      </div>
                    ))}
                    {isGroupSending && (
                      <div className="text-[11px] text-[#2b3844] bg-white/70 px-2.5 py-1 rounded-xl w-fit">
                        ✨ 群成员们正在输入回复...
                      </div>
                    )}
                  </div>

                  {/* Quick Group Topics */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      '今天放学谁跟我去吃玫瑰酱辣炒年糕？🍢',
                      '救命，明天模拟考重点谁整理好了借我看眼😭',
                      '我刚发了最新Stargram动态，快去帮我点赞评论！📸',
                      '周末我们一起去汉江公园野餐拍人生四格吧！🌸',
                    ].map((t, i) => (
                      <button
                        key={i}
                        disabled={isGroupSending}
                        onClick={() => handleSendGroupMessage(t)}
                        className="text-[10px] bg-white/85 hover:bg-white text-[#2b2620] px-2 py-1 rounded-lg font-medium cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Group Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendGroupMessage();
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={groupInput}
                      onChange={(e) => setGroupInput(e.target.value)}
                      placeholder="在群里发句话，大家会秒回你并互相接梗..."
                      className="flex-1 bg-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isGroupSending || !groupInput.trim()}
                      className="px-3 py-1.5 bg-[#fae100] text-[#3b1e1e] rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" /> 发送
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BUBBLE (IDOL FAN SUBSCRIPTION MESSENGER) */}
          {activeTab === 'bubble' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white rounded-2xl p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold opacity-90">DearU Bubble · 爱豆专属私密订阅</div>
                    <div className="text-base font-black mt-0.5">🫧 李秀妍的专属泡泡房间</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black tabular-nums">{subscriberCount.toLocaleString()} 人</div>
                    <div className="text-[10px] opacity-90">付费死忠订阅粉 (₩4,500/月)</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/20 text-[11px] flex items-center justify-between">
                  <span>✨ 每次发送营业泡泡可立即结算粉丝订阅分成与高额涨粉！</span>
                </div>
              </div>

              {/* Bubble Quick Actions */}
              <div className="bg-white border border-purple-200 rounded-2xl p-3 space-y-2">
                <div className="text-xs font-bold text-purple-950">选择今日宠粉营业内容 (消耗6-8体力)：</div>
                <input
                  type="text"
                  value={customBubbleText}
                  onChange={(e) => setCustomBubbleText(e.target.value)}
                  placeholder="自定义你想对粉丝说的悄悄话（留空则使用默认宠粉台词）..."
                  className="w-full px-3 py-1.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs focus:outline-none"
                />
                <div className="space-y-1.5">
                  {bubbleActions.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        if (stats.stamina < 8) {
                          onNotify('体力不足，先吃点东西再营业吧！');
                          return;
                        }
                        const subBonus = Math.min(120000, subscriberCount * 120);
                        const totalCoin = (act.effect.coins || 50000) + subBonus;
                        const textToUse = customBubbleText.trim() || act.defaultText;
                        setBubbleFeed([
                          {
                            id: `bf_${Date.now()}`,
                            tag: act.tag,
                            text: textToUse,
                            time: '刚刚',
                            fanReplies: act.replies,
                          },
                          ...bubbleFeed,
                        ]);
                        setCustomBubbleText('');
                        onPublishPost(
                          {
                            id: `bub_${Date.now()}`,
                            weekLabel,
                            tag: '#Bubble宠粉营业',
                            caption: textToUse,
                            likes: subscriberCount * 8,
                            followerGain: act.effect.snsFollowers || 2500,
                            npcComments: [],
                          },
                          {
                            ...act.effect,
                            coins: totalCoin,
                          }
                        );
                        onNotify(
                          `🫧 Bubble发送成功！死忠粉沸腾，涨粉 +${act.effect.snsFollowers?.toLocaleString()}，结算订阅收益 +₩${totalCoin.toLocaleString()}！`
                        );
                      }}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 text-left transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-purple-950">{act.title}</div>
                        <div className="text-[10px] text-purple-700 mt-0.5">
                          预计涨粉 +{act.effect.snsFollowers?.toLocaleString()} · 保底分成 +₩
                          {act.effect.coins?.toLocaleString()}
                        </div>
                      </div>
                      <Send className="w-4 h-4 text-purple-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bubble History */}
              <div className="space-y-2">
                {bubbleFeed.map((item) => (
                  <div key={item.id} className="bg-white border border-purple-100 rounded-2xl p-3 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-700">{item.tag}</span>
                      <span className="text-gray-400">{item.time}</span>
                    </div>
                    <div className="bg-purple-600 text-white p-2.5 rounded-2xl rounded-tl-xs text-xs">
                      {item.text}
                    </div>
                    <div className="bg-purple-50 rounded-xl p-2 space-y-1">
                      <div className="text-[10px] font-bold text-purple-800">💖 实时粉丝回复 (999+ ❤️)：</div>
                      {item.fanReplies.map((r, idx) => (
                        <div key={idx} className="text-[11px] text-purple-950">
                          • {r}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COUPANG EATS & OLIVE YOUNG DELIVERY */}
          {activeTab === 'delivery' && (
            <div className="space-y-2.5">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">🛵 Coupang Eats & Olive Young 校园闪送</div>
                  <div className="text-[11px] opacity-90 mt-0.5">随时补充体力、减压、提升颜值或请好友吃夜宵！</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black">₩{stats.coins.toLocaleString()}</div>
                  <div className="text-[10px] opacity-90">可用余额</div>
                </div>
              </div>

              <div className="bg-white border border-[#e0d9cc] rounded-xl p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#3d352b]">🎁 选择一起分享外卖的同伴 (额外+8好感)：</span>
                <select
                  value={shareNpcId}
                  onChange={(e) => setShareNpcId(e.target.value)}
                  className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-lg px-2 py-1 text-xs font-bold"
                >
                  {npcs.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.chineseName} (好感 {n.favorability}%)
                    </option>
                  ))}
                </select>
              </div>

              {deliveryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#e0d9cc] rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#2b2620]">{item.name}</div>
                    <div className="text-[10px] text-orange-600 font-bold mt-0.5">{item.shop}</div>
                    <div className="text-[11px] text-[#6e6456] mt-0.5">{item.desc}</div>
                    <div className="text-xs font-black text-amber-800 mt-1">₩{item.price.toLocaleString()}</div>
                  </div>
                  <button
                    disabled={stats.coins < item.price}
                    onClick={() => {
                      onPublishPost(
                        {
                          id: `del_${Date.now()}`,
                          weekLabel,
                          tag: '#校园外卖投喂',
                          caption: `点了【${item.name}】，幸福感瞬间拉满！✨`,
                          likes: 210,
                          followerGain: 80,
                          npcComments: [],
                        },
                        item.effect
                      );
                      if (onUpdateFavorability) {
                        if (item.shareAll) {
                          npcs.forEach((n) => onUpdateFavorability(n.id, 6));
                        } else if (item.canShare) {
                          onUpdateFavorability(shareNpcId, 8);
                        }
                      }
                      const targetNpc = npcs.find((n) => n.id === shareNpcId);
                      onNotify(
                        `🛵 闪送已送达！【${item.name}】享用完毕${
                          item.shareAll
                            ? '，全员NPC好感度 +6！'
                            : item.canShare && targetNpc
                            ? `，与 ${targetNpc.chineseName} 一起分享，好感度 +8！`
                            : '！'
                        }`
                      );
                    }}
                    className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-45 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    立即下单
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: ALBAMON ONLINE PART-TIME JOBS */}
          {activeTab === 'alba' && (
            <div className="space-y-2.5">
              <div className="bg-[#4b6b55] text-white rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">💼 AlbaMon 韩国高中生线上兼职中心</div>
                  <div className="text-[11px] opacity-90 mt-0.5">手机接单当日结账，轻松实现零花钱与穿搭自由！</div>
                </div>
                <Coins className="w-6 h-6 text-amber-300" />
              </div>

              {albaJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-[#e0d9cc] rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-[#2b2620]">{job.title}</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      {job.tag} · 消耗 {job.staminaCost} 体力
                    </div>
                    <div className="text-[11px] text-[#6e6456] mt-0.5">{job.desc}</div>
                    <div className="text-xs font-black text-emerald-800 mt-1">
                      日结报酬 +₩{job.pay.toLocaleString()}
                    </div>
                  </div>
                  <button
                    disabled={stats.stamina < job.staminaCost}
                    onClick={() => {
                      onPublishPost(
                        {
                          id: `alba_${Date.now()}`,
                          weekLabel,
                          tag: '#充实兼职打卡',
                          caption: `完成了【${job.title}】，靠自己努力赚零花钱超有成就感！💪`,
                          likes: 260,
                          followerGain: 120,
                          npcComments: [],
                        },
                        job.effect
                      );
                      onNotify(`💼 兼职完成！入账 +₩${job.pay.toLocaleString()}！`);
                    }}
                    className="px-3 py-2 bg-[#4b6b55] hover:bg-[#3d5946] disabled:opacity-45 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    立即接单
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: AI PHOTO STUDIO & LIFE4CUTS */}
          {activeTab === 'aistudio' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-2xl p-3.5">
                <div className="text-xs font-bold">🎨 首尔 AI 生图写真馆 & Photoism 人生四格</div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  输入任意外貌/穿搭描述，实时调用 AI 为你生成专属韩漫/二次元高颜值立绘头像！
                </div>
              </div>

              <div className="bg-white border border-pink-200 rounded-2xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={previewAvatarUrl}
                    alt="当前头像预览"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-400 shadow-sm shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#2b2620]">当前主角立绘预览</div>
                    <div className="text-[11px] text-[#6e6456]">
                      选择画风并输入描述词，点击下方按钮即可实时生图并应用到全局头像！
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'webtoon', label: '🌸 韩漫女神' },
                    { id: 'anime', label: '✨ 二次元原画' },
                    { id: 'idol', label: '👑 爱豆画报' },
                    { id: 'watercolor', label: '🎨 梦幻水彩' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setAiStylePreset(st.id as any)}
                      className={`py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                        aiStylePreset === st.id
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-[#f7f4ee] text-[#5a5246] border-[#d6cfc2]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="例如：韩系清纯女高，微卷长发配蝴蝶结，水光大眼睛，粉色校服开衫..."
                  className="w-full p-2.5 bg-[#f7f4ee] border border-[#d6cfc2] rounded-xl text-xs focus:outline-none"
                />

                <div className="flex flex-wrap gap-1">
                  {[
                    '清纯黑长直校花，空气刘海，水光杏眼，深蓝西装校服配酒红领结',
                    '五代女团C位爱豆，微卷玫瑰棕长发，钻石发夹，舞台聚光灯',
                    '甜美桃粉双马尾少女，草莓发卡，奶油色针织开衫，温柔甜笑',
                  ].map((presetText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiPromptInput(presetText)}
                      className="text-[10px] bg-pink-50 hover:bg-pink-100 text-pink-900 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      ✨ 预设词 {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={isGeneratingAvatar}
                  onClick={handleGenerateAIAvatar}
                  className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAvatar ? 'AI 正在绘制高颜值立绘 (约3-6秒)...' : '✨ 立即 AI 生图并设为我的头像'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
