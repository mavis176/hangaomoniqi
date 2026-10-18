import React, { useState } from 'react';
import {
  X,
  Users,
  Trophy,
  Sparkles,
  Star,
  CheckCircle2,
  Flame,
  Zap,
  Award,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { GameStats, ClubRankType } from '../../types';
import {
  CLUBS_INFO,
  CLUB_SUDDEN_INCIDENTS,
  CLUB_TOURNAMENTS,
  ClubSuddenIncident,
  ClubTournamentTier,
} from '../../data/clubAndTraineeData';

interface ClubModalProps {
  onClose: () => void;
  stats: GameStats;
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onUpdateFavorability?: (npcId: string, amount: number) => void;
  onOpenTraineeModal?: () => void;
  onNotify: (msg: string) => void;
}

function computeClubRank(skill: number, teamwork: number, trophiesCount: number): ClubRankType {
  if (skill >= 80 && teamwork >= 70 && trophiesCount >= 2) return '传奇社长';
  if (skill >= 60 && teamwork >= 50) return '王牌副社长';
  if (skill >= 38) return '正式主力';
  return '见习部员';
}

export const ClubModal: React.FC<ClubModalProps> = ({
  onClose,
  stats,
  onUpdateStats,
  onUpdateFavorability,
  onOpenTraineeModal,
  onNotify,
}) => {
  // Active Sub-Popup 1: Club Sudden Incident Modal
  const [activeIncident, setActiveIncident] = useState<ClubSuddenIncident | null>(null);
  const [incidentOutcome, setIncidentOutcome] = useState<string | null>(null);

  // Active Sub-Popup 2: 3-Stage Interactive Club Competition Modal
  const [activeTournament, setActiveTournament] = useState<ClubTournamentTier | null>(null);
  const [tourStage, setTourStage] = useState<1 | 2 | 3>(1);
  const [tourScore, setTourScore] = useState<number>(0);
  const [tourLogs, setTourLogs] = useState<string[]>([]);

  const currentClub = CLUBS_INFO.find((c) => c.id === stats.clubId) || CLUBS_INFO[0];
  const trophies = stats.clubTrophies || [];

  // Trigger a Club Training + Sudden Incident Popup!
  const handleClubActivityWithIncident = (mode: 'regular' | 'night' | 'camp', clubId: string) => {
    const cost = mode === 'camp' ? 16 : mode === 'night' ? 12 : 8;
    if (stats.stamina < cost) {
      onNotify(`体力不足 ${cost} 点，请先休息补充体力后再进行社团活动！`);
      return;
    }

    const baseSkillGain = mode === 'camp' ? 6 : mode === 'night' ? 4 : 3;
    const baseTeamGain = mode === 'camp' ? 7 : mode === 'night' ? 4 : 3;
    const nextSkill = Math.min(100, stats.clubSkill + baseSkillGain);
    const nextTeam = Math.min(100, (stats.clubTeamwork || 35) + baseTeamGain);
    const nextStagePwr = Math.min(100, (stats.clubStagePower || 35) + baseSkillGain);

    onUpdateStats({
      clubId,
      clubSkill: nextSkill,
      clubTeamwork: nextTeam,
      clubStagePower: nextStagePwr,
      clubRank: computeClubRank(nextSkill, nextTeam, trophies.length),
      stamina: Math.max(0, stats.stamina - cost),
    });

    // Pick a matching sudden incident for this club!
    const pool = CLUB_SUDDEN_INCIDENTS.filter(
      (inc) => inc.clubId === clubId || inc.clubId === 'any'
    );
    const picked =
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : CLUB_SUDDEN_INCIDENTS[0];

    setIncidentOutcome(null);
    setActiveIncident(picked);
  };

  const handleResolveIncidentOption = (opt: ClubSuddenIncident['options'][0]) => {
    const nextSkill = Math.min(100, stats.clubSkill + (opt.effect.clubSkill || 0));
    const nextTeam = Math.min(100, (stats.clubTeamwork || 35) + (opt.effect.clubTeamwork || 0));
    const nextStage = Math.min(100, (stats.clubStagePower || 35) + (opt.effect.clubStagePower || 0));

    onUpdateStats({
      clubSkill: nextSkill,
      clubTeamwork: nextTeam,
      clubStagePower: nextStage,
      clubRank: computeClubRank(nextSkill, nextTeam, trophies.length),
      mood: Math.min(100, Math.max(0, stats.mood + (opt.effect.mood || 0))),
      social: Math.min(100, Math.max(0, stats.social + (opt.effect.social || 0))),
      appearance: Math.min(100, Math.max(0, stats.appearance + (opt.effect.appearance || 0))),
      academics: Math.min(100, Math.max(0, stats.academics + (opt.effect.academics || 0))),
      coins: Math.max(0, stats.coins + (opt.effect.coins || 0)),
      snsFollowers: stats.snsFollowers + (opt.effect.snsFollowers || 0),
      danceSkill: Math.min(100, (stats.danceSkill || 30) + (opt.effect.danceSkill || 0)),
      vocalSkill: Math.min(100, (stats.vocalSkill || 30) + (opt.effect.vocalSkill || 0)),
    });

    if (opt.npcId && opt.favDelta && onUpdateFavorability) {
      onUpdateFavorability(opt.npcId, opt.favDelta);
    }

    setIncidentOutcome(opt.outcomeText);
  };

  // Start 3-Stage Interactive Competition
  const handleStartTournament = (tier: ClubTournamentTier) => {
    if (stats.stamina < tier.staminaCost) {
      onNotify(`出战【${tier.name}】需要至少 ${tier.staminaCost} 点体力！`);
      return;
    }
    const baseScore = Math.round(
      stats.clubSkill * 0.45 +
        (stats.clubTeamwork || 35) * 0.3 +
        (stats.clubStagePower || 35) * 0.25
    );
    onUpdateStats({
      stamina: Math.max(0, stats.stamina - tier.staminaCost),
    });
    setTourScore(baseScore);
    setTourLogs([`📊 赛前基础实力评分：${baseScore} 分`]);
    setTourStage(1);
    setActiveTournament(tier);
  };

  const handleTourStage1Choice = (choice: ClubTournamentTier['stage1Options'][0]) => {
    setTourScore((prev) => prev + choice.bonusScore);
    setTourLogs((prev) => [
      ...prev,
      `✅ 赛前部署：${choice.feedback} (赛场表现 +${choice.bonusScore}分)`,
    ]);
    onUpdateStats({
      clubTeamwork: Math.min(100, (stats.clubTeamwork || 35) + (choice.effect.clubTeamwork || 0)),
      clubSkill: Math.min(100, stats.clubSkill + (choice.effect.clubSkill || 0)),
      clubStagePower: Math.min(100, (stats.clubStagePower || 35) + (choice.effect.clubStagePower || 0)),
    });
    setTourStage(2);
  };

  const handleTourStage2Choice = (
    choice: ClubTournamentTier['stage2CrisisByClub']['dance']['choices'][0]
  ) => {
    const finalTotal = tourScore + choice.bonusScore;
    setTourScore(finalTotal);
    setTourLogs((prev) => [
      ...prev,
      `🔥 危机化解：${choice.feedback} (临场应变 +${choice.bonusScore}分)`,
    ]);

    const isChampion = finalTotal >= 82;
    const prize = activeTournament
      ? isChampion
        ? activeTournament.championPrize
        : activeTournament.runnerUpPrize
      : 30000;

    const newTrophies =
      isChampion && activeTournament && !trophies.includes(activeTournament.trophyName)
        ? [...trophies, activeTournament.trophyName]
        : trophies;

    const nextSkill = Math.min(100, stats.clubSkill + 6);
    const nextTeam = Math.min(100, (stats.clubTeamwork || 35) + 6);

    onUpdateStats({
      clubSkill: nextSkill,
      clubTeamwork: nextTeam,
      clubStagePower: Math.min(100, (stats.clubStagePower || 35) + (choice.effect.clubStagePower || 8)),
      clubTrophies: newTrophies,
      clubRank: computeClubRank(nextSkill, nextTeam, newTrophies.length),
      coins: stats.coins + prize,
      social: Math.min(100, stats.social + (isChampion ? 10 : 5)),
      mood: Math.min(100, stats.mood + (isChampion ? 12 : 5)),
      snsFollowers: stats.snsFollowers + (choice.effect.snsFollowers || (isChampion ? 2000 : 800)),
    });

    if (onUpdateFavorability) {
      onUpdateFavorability(currentClub.npcId, isChampion ? 12 : 6);
    }

    setTourStage(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#f5f2eb] border-2 border-[#dcd5c7] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[#2b2620] relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4b5e4d] to-[#657d68] px-4 py-3 flex items-center justify-between text-white border-b border-[#98b09a]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#f5d68e]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  首尔女高社团部室 & 赛场竞技中心
                </h2>
                <span className="bg-[#f5d68e] text-[#2b2210] text-[11px] font-black px-2 py-0.5 rounded-full">
                  职位：{stats.clubRank || '见习部员'}
                </span>
              </div>
              <p className="text-[11px] text-[#e6f0e7] mt-0.5">
                日常排练将触发【社团专属突发事件弹窗】· 报名联赛将进入【三阶段互动比赛剧场】
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="p-3.5 sm:p-5 pb-10 overflow-y-auto touch-scroll overscroll-contain space-y-4 flex-1 min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Top 4-Dimension Club Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-[#6e6456] font-bold">当前所属社团</div>
              <div className="text-xs sm:text-sm font-black text-[#2b2620] mt-1 truncate">
                {currentClub.name}
              </div>
              <div className="text-[10px] text-[#4b5e4d] font-bold mt-0.5">
                搭档：{currentClub.leader}
              </div>
            </div>

            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-[#6e6456] font-bold">🎯 社团综合实力</div>
              <div className="text-lg font-black text-[#3b5e42] mt-0.5">{stats.clubSkill}/100</div>
              <div className="w-full h-1.5 bg-[#e8e2d6] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#4b7a54]" style={{ width: `${stats.clubSkill}%` }} />
              </div>
            </div>

            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-[#6e6456] font-bold">🤝 团队默契度</div>
              <div className="text-lg font-black text-sky-700 mt-0.5">
                {stats.clubTeamwork || 35}/100
              </div>
              <div className="w-full h-1.5 bg-[#e8e2d6] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-sky-600"
                  style={{ width: `${stats.clubTeamwork || 35}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-[#d6cfc2] rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-[#6e6456] font-bold">✨ 赛场表现力</div>
              <div className="text-lg font-black text-rose-600 mt-0.5">
                {stats.clubStagePower || 35}/100
              </div>
              <div className="w-full h-1.5 bg-[#e8e2d6] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${stats.clubStagePower || 35}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Club Daily Activities (Triggers Club Sudden Incidents!) */}
          <div className="bg-[#eae4d8] border border-[#cfc7b8] rounded-2xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[#2b2620] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>【{currentClub.name}】部室日常活动（每次行动均会触发社团突发事件弹窗！）</span>
                </h3>
                <p className="text-xs text-[#5e5548] mt-0.5">{currentClub.slogan}</p>
              </div>
              {onOpenTraineeModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTraineeModal();
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                  <span>前往练习生企划社中心 →</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleClubActivityWithIncident('regular', currentClub.id)}
                className="bg-white hover:bg-[#fcfaf5] border border-[#cfc7b8] rounded-xl p-3 text-left transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-[#2b2620]">
                  <span>🎵 放学常规合练</span>
                  <span className="text-[11px] text-amber-700">-8体力</span>
                </div>
                <p className="text-[11px] text-[#6e6456] mt-1">
                  与部员们打磨基本功，并处理部室日常突发小插曲。
                </p>
                <div className="mt-2 text-[11px] font-bold text-[#4b5e4d] group-hover:translate-x-0.5 transition-transform">
                  立即开展并触发事件 ▶
                </div>
              </button>

              <button
                onClick={() => handleClubActivityWithIncident('night', currentClub.id)}
                className="bg-white hover:bg-[#fcfaf5] border border-[#cfc7b8] rounded-xl p-3 text-left transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-[#2b2620]">
                  <span>🌙 留校深夜加练</span>
                  <span className="text-[11px] text-amber-700">-12体力</span>
                </div>
                <p className="text-[11px] text-[#6e6456] mt-1">
                  放学后与核心搭档留下来攻克高难技巧，大幅增进默契。
                </p>
                <div className="mt-2 text-[11px] font-bold text-[#4b5e4d] group-hover:translate-x-0.5 transition-transform">
                  立即开展并触发事件 ▶
                </div>
              </button>

              <button
                onClick={() => handleClubActivityWithIncident('camp', currentClub.id)}
                className="bg-white hover:bg-[#fcfaf5] border border-[#cfc7b8] rounded-xl p-3 text-left transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-[#2b2620]">
                  <span>🔥 周末赛前魔鬼合宿</span>
                  <span className="text-[11px] text-amber-700">-16体力</span>
                </div>
                <p className="text-[11px] text-[#6e6456] mt-1">
                  全天候封闭式集训与突发危机演练，快速晋升社团职位！
                </p>
                <div className="mt-2 text-[11px] font-bold text-[#4b5e4d] group-hover:translate-x-0.5 transition-transform">
                  立即开展并触发事件 ▶
                </div>
              </button>
            </div>
          </div>

          {/* 3-Stage Interactive Club Tournaments Section */}
          <div className="bg-gradient-to-br from-[#fdfbf7] to-[#f2ece1] border-2 border-[#d4c3a3] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#3d2e18] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>出战社团竞技大赛（三阶段互动比赛弹窗 · 含赛中突发危机应对）</span>
                </h3>
                <p className="text-xs text-[#6e5c42] mt-0.5">
                  已斩获荣誉奖杯：{trophies.length > 0 ? trophies.join(' · ') : '暂未夺冠，快去报名参赛吧！'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CLUB_TOURNAMENTS.map((tier) => {
                const isWon = trophies.includes(tier.trophyName);
                const canEnter = stats.clubSkill >= tier.requiredSkill - 10;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-xl p-3 border flex flex-col justify-between ${
                      isWon
                        ? 'bg-amber-50/70 border-amber-400'
                        : 'bg-white border-[#d6cfc2]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          {tier.levelLabel}
                        </span>
                        {isWon && (
                          <span className="text-[10px] font-bold text-emerald-700">已夺冠 🏆</span>
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-[#2b2620] mt-1.5">
                        {tier.name}
                      </div>
                      <div className="text-[11px] text-[#6e6456] mt-1">
                        劲敌：{tier.rivalSchool}
                      </div>
                      <div className="text-[11px] font-bold text-amber-800 mt-1">
                        冠军奖金：₩{tier.championPrize.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#7a7062] mt-0.5">
                        建议社团实力 ≥ {tier.requiredSkill} (当前 {stats.clubSkill})
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartTournament(tier)}
                      disabled={!canEnter}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-[#8c6836] to-[#6b4e26] hover:from-[#9e7740] hover:to-[#7d5c2e] disabled:opacity-45 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-[#f5d68e]" />
                      <span>
                        {canEnter ? `进入赛场 (-${tier.staminaCost}体力)` : `实力不足(需${tier.requiredSkill - 10})`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Switch Club Section */}
          <div>
            <div className="text-xs font-bold text-[#5a5246] mb-2">
              切换/转入其他校园社团（共4大社团，各有独立突发事件与赛中剧情）：
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {CLUBS_INFO.map((club) => {
                const isJoined = stats.clubId === club.id;
                return (
                  <div
                    key={club.id}
                    className={`rounded-xl p-3 border flex flex-col justify-between ${
                      isJoined
                        ? 'bg-[#fcfaf5] border-2 border-[#4b5e4d]'
                        : 'bg-white border-[#d6cfc2]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#2b2620]">{club.name}</span>
                        {isJoined && <CheckCircle2 className="w-4 h-4 text-[#4b5e4d] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-[#6e5c42] font-bold mt-1">
                        代表：{club.leader}
                      </div>
                      <p className="text-[11px] text-[#6e6456] mt-1 leading-snug">{club.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        onUpdateStats({ clubId: club.id });
                        onNotify(`已正式转入【${club.name}】！`);
                      }}
                      disabled={isJoined}
                      className={`mt-2.5 w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        isJoined
                          ? 'bg-[#4b5e4d]/15 text-[#4b5e4d]'
                          : 'bg-[#e6dfd3] hover:bg-[#d8cfc0] text-[#3d352b]'
                      }`}
                    >
                      {isJoined ? '当前所属社团' : '申请转入该社团'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================== SUB-POPUP 1: 社团专属突发事件弹窗 ==================== */}
        {activeIncident && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6">
            <div className="bg-[#fcfaf5] border-2 border-[#b89758] rounded-2xl max-w-lg w-full max-h-[86dvh] overflow-y-auto touch-scroll overscroll-contain p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black">
                  {activeIncident.tag}
                </span>
                <span className="text-xs font-bold text-[#6e5c42]">{currentClub.name}</span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-[#2b2620]">
                {activeIncident.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#3d352b] leading-relaxed bg-[#f2ece1] p-3.5 rounded-xl border border-[#dcd2c0]">
                {activeIncident.sceneDesc}
              </p>

              {!incidentOutcome ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#5a5246]">
                    面对突发状况，你作为社团骨干决定：
                  </div>
                  {activeIncident.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResolveIncidentOption(opt)}
                      className="w-full text-left p-3 bg-white hover:bg-[#fdf8ed] border border-[#cfc7b8] hover:border-[#8c6836] rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <span>{opt.text}</span>
                      <ChevronRight className="w-4 h-4 text-[#8c6836] shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    <div className="font-bold text-emerald-800 mb-1">✨ 事件处理结果：</div>
                    {incidentOutcome}
                  </div>
                  <button
                    onClick={() => {
                      setActiveIncident(null);
                      setIncidentOutcome(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-[#4b5e4d] to-[#394a3b] text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    完成本次社团活动
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SUB-POPUP 2: 社团比赛三阶段互动剧场弹窗 ==================== */}
        {activeTournament && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6">
            <div className="bg-[#fcfaf5] border-2 border-[#d4a953] rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[86dvh] overflow-y-auto touch-scroll overscroll-contain">
              {/* Top Stage Progress Indicator */}
              <div className="flex items-center justify-between border-b border-[#e2d9c8] pb-3">
                <div>
                  <span className="text-[11px] font-bold text-amber-800">
                    🏆 {activeTournament.name} · 对阵 {activeTournament.rivalSchool}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#2b2620] mt-0.5">
                    {tourStage === 1
                      ? '第一阶段：赛前候场与战术动员'
                      : tourStage === 2
                      ? '第二阶段：赛中突发意外危机应对！'
                      : '第三阶段：评委亮分与颁奖典礼'}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#7a7062]">实时赛场得分</div>
                  <div className="text-xl font-black text-amber-700">{tourScore}分</div>
                </div>
              </div>

              {/* Stage 1 */}
              {tourStage === 1 && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#3d352b] leading-relaxed bg-[#f2ece1] p-3.5 rounded-xl border border-[#dcd2c0]">
                    {activeTournament.stage1Prompt}
                  </p>
                  <div className="space-y-2">
                    {activeTournament.stage1Options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleTourStage1Choice(opt)}
                        className="w-full text-left p-3 bg-white hover:bg-amber-50/60 border border-[#cfc7b8] hover:border-amber-600 rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between cursor-pointer"
                      >
                        <span>{opt.text}</span>
                        <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage 2: Club-Specific Mid-Competition Crisis */}
              {tourStage === 2 && (() => {
                const crisis =
                  activeTournament.stage2CrisisByClub[currentClub.id] ||
                  activeTournament.stage2CrisisByClub.dance;
                return (
                  <div className="space-y-3">
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 space-y-1.5">
                      <div className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{crisis.crisisTitle}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                        {crisis.crisisDesc}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-[#5a5246]">
                      千钧一发之际，你的临场决断是：
                    </div>
                    <div className="space-y-2">
                      {crisis.choices.map((ch, i) => (
                        <button
                          key={i}
                          onClick={() => handleTourStage2Choice(ch)}
                          className="w-full text-left p-3 bg-white hover:bg-rose-50/50 border border-[#cfc7b8] hover:border-rose-500 rounded-xl text-xs sm:text-[13px] font-bold text-[#2b2620] flex items-center justify-between cursor-pointer"
                        >
                          <span>{ch.text}</span>
                          <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Stage 3: Final Score & Award Ceremony */}
              {tourStage === 3 && (() => {
                const isChamp = tourScore >= 82;
                const prize = isChamp
                  ? activeTournament.championPrize
                  : activeTournament.runnerUpPrize;
                return (
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-xl border-2 ${
                        isChamp
                          ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-400'
                          : 'bg-sky-50 border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-900">
                          {isChamp ? '🏆 斩获全场最高大赏（冠军）！' : '🥈 荣获优秀表现银奖！'}
                        </span>
                        <span className="text-sm font-black text-amber-800">
                          最终总分：{tourScore} 分
                        </span>
                      </div>
                      <div className="text-xs text-[#3d352b] mt-2 space-y-1">
                        {tourLogs.map((l, idx) => (
                          <div key={idx}>{l}</div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-amber-300/60 text-xs font-bold text-emerald-800">
                        🎁 获得赛事奖金：+₩{prize.toLocaleString()}{' '}
                        {isChamp ? `· 解锁奖杯【${activeTournament.trophyName}】！` : ''}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTournament(null);
                        onNotify(
                          `完成了【${activeTournament.name}】，最终得分 ${tourScore}分，奖金 +₩${prize.toLocaleString()}！`
                        );
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-[#8c6836] to-[#6b4e26] text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      捧起奖杯返回社团部室
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
