import React, { useState } from 'react';
import { X, Sparkles, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { AIConfig, GameStats, ForumPost } from '../../types';
import { generateCampusForumPosts } from '../../services/aiService';

interface ForumModalProps {
  onClose: () => void;
  aiConfig: AIConfig;
  stats: GameStats;
  timeContext: string;
  recentMemories: string[];
  onUpdateStats: (newStats: Partial<GameStats>) => void;
  onAddGlobalMemory: (summary: string) => void;
  onNotify: (msg: string) => void;
}

export const ForumModal: React.FC<ForumModalProps> = ({
  onClose,
  aiConfig,
  stats,
  timeContext,
  recentMemories,
  onUpdateStats,
  onAddGlobalMemory,
  onNotify,
}) => {
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      author: '高一匿名草莓牛奶',
      tag: '日常吐槽',
      title: '今天上午小卖部的延世生牛乳面包3分钟就空了？？',
      content: '第2节课刚下课跑过去，连面包渣都没剩下！到底是谁手速这么快啊，求分半个呜呜呜！',
      likes: 94,
      comments: ['哈哈哈我在2楼走廊看到1班有女生飞奔下楼！', '明天课间提前备好交通卡冲刺！'],
    },
    {
      author: '3楼自习室常驻民',
      tag: '高一风云',
      title: '今年高一(1)班的氛围也太好了吧',
      content: '路过2楼1-1班门口，看到李秀妍和朴敏英课间一直在聊悄悄话，连平时超冷淡的韩素拉都在1班，神仙班级！',
      likes: 78,
      comments: ['听说下周全校摸底月考，韩素拉和李秀妍要正面对决了', '前排押一包辣炒年糕看学霸神仙打架！'],
    },
  ]);

  const [playerPostInput, setPlayerPostInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshForum = async (customPost?: string) => {
    setIsLoading(true);
    try {
      const generated = await generateCampusForumPosts({
        aiConfig,
        stats,
        timeContext,
        recentMemories,
        playerPost: customPost,
      });
      if (generated && generated.length > 0) {
        setPosts(generated);
        if (customPost) {
          onUpdateStats({
            social: Math.min(100, stats.social + 4),
            mood: Math.min(100, stats.mood + 5),
          });
          onAddGlobalMemory(`在竹林匿名墙发帖：“${customPost}”，引发同学们热议。`);
          onNotify('你在竹林匿名墙发布了帖子，全校同学正在火热回帖！社交 +4');
        }
      }
    } catch (e) {
      onNotify('已刷新校内竹林匿名墙动态');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#476b55] to-[#5a8068] text-white border-b border-[#8eb09b]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#e6f5ec]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide">首尔女高 · 竹林匿名墙 (대나무숲)</h2>
              <p className="text-[11px] text-[#d6ebe0]">AI 根据你的近期校园记忆生成真实女高热帖</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Posts List */}
        <div
          className="p-4 flex-1 min-h-0 overflow-y-auto touch-scroll overscroll-contain space-y-3 bg-[#e2dbd0]/70"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5a5246]">{timeContext} · 校内实时新帖</span>
            <button
              onClick={() => handleRefreshForum()}
              disabled={isLoading}
              className="px-3 py-1 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] border border-[#efe7d6] rounded-lg text-xs font-bold text-[#383020] flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#8c5e14] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'AI 正在同步校园八卦...' : 'AI 刷新实时校内贴'}</span>
            </button>
          </div>

          {posts.map((post, idx) => (
            <div
              key={idx}
              className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-3.5 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#476b55]">
                  {post.tag} · {post.author}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#9c6b3b]">
                  <ThumbsUp className="w-3 h-3" /> {post.likes}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#2b2620]">{post.title}</h3>
              <p className="text-xs text-[#4a4237] leading-relaxed">{post.content}</p>
              {post.comments && post.comments.length > 0 && (
                <div className="bg-[#ece6db] rounded-lg p-2 space-y-1 border border-[#dfd9ce]">
                  {post.comments.map((c, ci) => (
                    <div key={ci} className="text-[11px] text-[#5c5449]">
                      💬 {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Post Anonymous Message to AI Forum */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!playerPostInput.trim() || isLoading) return;
            const txt = playerPostInput.trim();
            setPlayerPostInput('');
            handleRefreshForum(txt);
          }}
          className="p-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex items-center gap-2"
        >
          <input
            type="text"
            value={playerPostInput}
            onChange={(e) => setPlayerPostInput(e.target.value)}
            placeholder="匿名发帖吐槽或表白（全校同学将根据记忆跟帖）..."
            className="flex-1 bg-[#f7f4ee] border border-[#bfb7a8] rounded-xl px-3.5 py-2 text-xs text-[#2b2620]"
          />
          <button
            type="submit"
            disabled={isLoading || !playerPostInput.trim()}
            className="px-4 py-2 bg-[#476b55] hover:bg-[#3c5c48] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发帖</span>
          </button>
        </form>

      </div>
    </div>
  );
};
