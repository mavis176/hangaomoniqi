import { HousingItem, VehicleItem } from '../types';

export const HOUSING_PRESETS: HousingItem[] = [
  {
    id: 'housing_semi_basement',
    name: '麻浦半地下室 rental (初始住所)',
    koreanName: '마포 반지하',
    price: 0,
    staminaBonusPerTurn: 0,
    moodBonusPerTurn: 0,
    darkIndexReductionPerTurn: 0,
    socialBonus: 0,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200',
    desc: '潮湿狭窄但满载梦想起点的半地下室小屋，窗外是行人匆匆过往的脚踝。',
    locationLabel: '麻浦区 · 半地下',
    tier: 'semi_basement',
  },
  {
    id: 'housing_gangnam_apt',
    name: '江南两居室精装公寓',
    koreanName: '강남 2룸 아파트',
    price: 12000000, // ₩1,200万
    staminaBonusPerTurn: 10,
    moodBonusPerTurn: 10,
    darkIndexReductionPerTurn: 3,
    socialBonus: 10,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200',
    desc: '江南核心地段采光明亮的现代电梯公寓，配有恒温浴缸与隔音练歌房角。',
    locationLabel: '江南区 · 驿三洞',
    tier: 'apartment',
  },
  {
    id: 'housing_hanriver_penthouse',
    name: '汉江边江景豪华大平层',
    koreanName: '한강 뷰 펜트하우스',
    price: 50000000, // ₩5,000万
    staminaBonusPerTurn: 20,
    moodBonusPerTurn: 20,
    darkIndexReductionPerTurn: 8,
    socialBonus: 25,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200',
    desc: '270度落地窗俯瞰汉江落日与首尔天际线，专属VIP管家服务与顶级安全私密性。',
    locationLabel: '龙山区 · 汉南洞',
    tier: 'penthouse',
  },
  {
    id: 'housing_cheongdam_mansion',
    name: '清潭洞独栋顶奢豪宅',
    koreanName: '청담동 단독저택',
    price: 200000000, // ₩2亿
    staminaBonusPerTurn: 35,
    moodBonusPerTurn: 35,
    darkIndexReductionPerTurn: 15,
    socialBonus: 50,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    desc: '带有私人花园、恒温游泳池与顶级录音室的独栋豪宅，象征着首尔阶级最顶尖的荣耀。',
    locationLabel: '江南区 · 清潭洞',
    tier: 'mansion',
  },
];

export const VEHICLE_PRESETS: VehicleItem[] = [
  {
    id: 'vehicle_subway',
    name: '地铁 & T-money 公交卡 (初始出行)',
    koreanName: '지하철 & 버스',
    price: 0,
    socialBonus: 0,
    appearanceBonus: 0,
    unlockedEventsDesc: '日常穿梭于首尔各条地铁线的公共出行。',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266200a?auto=format&fit=crop&q=80&w=1200',
    desc: '拥挤但准时的首尔地铁2号线与黄色公交车，随身带好T-money卡。',
    tier: 'public',
  },
  {
    id: 'vehicle_agency_van',
    name: '经纪公司专属明星保姆车',
    koreanName: '소속사 밴',
    price: 5000000, // ₩500万
    socialBonus: 10,
    appearanceBonus: 5,
    unlockedEventsDesc: '解锁打歌通告与颁奖礼VIP保姆车出行事件，保护私密隐私。',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
    desc: '配备深色防窥隐私车窗与舒适按摩座椅，偶像行走的移动休整避风港。',
    tier: 'van',
  },
  {
    id: 'vehicle_supercar',
    name: '私人豪华超跑 / 敞篷越野',
    koreanName: '럭셔리 슈퍼카',
    price: 30000000, // ₩3,000万
    socialBonus: 30,
    appearanceBonus: 15,
    unlockedEventsDesc: '解锁汉江深夜飙车放空、名媛车友会与奢华炸街偶遇。',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1200',
    desc: '拉风的推头声浪与精致皮革内饰，行驶在清潭洞林荫道上吸引无数目关与拍立得镜头。',
    tier: 'supercar',
  },
];
