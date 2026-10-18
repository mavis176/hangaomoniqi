import React, { useState } from 'react';
import { X, BookOpen, PenTool, Calendar, Sparkles, Heart, Smile, CloudSun, Tag, Trash2 } from 'lucide-react';
import { DiaryEntry } from '../../types';

interface DiaryModalProps {
  onClose: () => void;
  currentDateStr: string;
  diaryEntries: DiaryEntry[];
  onSaveEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  onDeleteEntry?: (id: string) => void;
}

const MOOD_OPTIONS = [
  { label: '🌸 充满期待', value: '期待' },
  { label: '💌 心动羞涩', value: '心动' },
  { label: '📚 拼搏充实', value: '充实' },
  { label: '☕ 稍微有点累', value: '疲惫' },
  { label: '👑 信心满满', value: '自信' },
];

const STICKER_OPTIONS = ['🌸', '💌', '🎤', '☕', '👑', '📚', '🎀', '✨', '猫咪🐾'];
const WEATHER_OPTIONS = ['☀️ 暖阳晴空', '🌸 樱花飘落', '☔ 首尔细雨', '❄️ 汉江初雪'];

export const DiaryModal: React.FC<DiaryModalProps> = ({
  onClose,
  currentDateStr,
  diaryEntries,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('期待');
  const [sticker, setSticker] = useState('🌸');
  const [weather, setWeather] = useState('☀️ 暖阳晴空');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSaveEntry({
      dateStr: currentDateStr,
      title: title.trim(),
      content: content.trim(),
      mood,
      sticker,
      weather,
    });

    setTitle('');
    setContent('');
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[#fcf9f2] border-2 border-[#e6dccb] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#2b251f]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6e5d4f] via-[#877464] to-[#594b3f] px-4 py-3 text-white border-b border-[#a89787] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-wide">
                首尔女子高中 · 秘密青春手帐日记
              </h2>
              <p className="text-[10px] text-amber-100/90">
                记录在首尔女高的每一个平淡或闪耀的时刻，留存独一无二的青春回忆。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center border-b border-[#e2d6c3] bg-[#f4ebd9] px-3 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'write'
                ? 'bg-[#fcf9f2] text-[#594b3f] border-t-2 border-x border-[#d8caba] shadow-xs'
                : 'text-[#877868] hover:text-[#594b3f]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-700" />
            <span>✍️ 撰写今日日记</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'bg-[#fcf9f2] text-[#594b3f] border-t-2 border-x border-[#d8caba] shadow-xs'
                : 'text-[#877868] hover:text-[#594b3f]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>📜 历史手帐日志 ({diaryEntries.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'write' ? (
            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Top metadata info */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f4ebd9] p-3 rounded-xl border border-[#dfd2be] text-xs font-bold text-[#594b3f]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>当前时间：{currentDateStr}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <CloudSun className="w-3.5 h-3.5 text-sky-600" />
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="bg-white border border-[#d3c4b0] rounded px-2 py-0.5 text-xs text-[#2b251f]"
                    >
                      {WEATHER_OPTIONS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Mood & Sticker options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-[#e2d6c3]">
                <div>
                  <label className="block text-xs font-bold text-[#6e5d4f] mb-1.5 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5 text-amber-600" />
                    <span>今日心情标签</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMood(m.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          mood === m.value
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-2xs'
                            : 'bg-[#faf6ee] border-[#d8caba] text-[#6e5d4f]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6e5d4f] mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    <span>手帐贴纸/装饰</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STICKER_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSticker(s)}
                        className={`w-7 h-7 rounded-lg text-sm border flex items-center justify-center transition-all cursor-pointer ${
                          sticker === s
                            ? 'bg-rose-100 border-rose-400 scale-110 shadow-2xs'
                            : 'bg-[#faf6ee] border-[#d8caba]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Body */}
              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-[#e2d6c3]">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="日记标题（例如：樱花树下的特别约定）"
                  className="w-full bg-[#fdfbf7] border border-[#d8caba] rounded-lg px-3 py-2 text-xs font-bold text-[#2b251f] focus:outline-none focus:border-[#877464]"
                  required
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="写下今天在首尔女高的心情、和同桌/同学的聊天趣事、或是对高考/打歌舞台的想法吧..."
                  rows={6}
                  className="w-full bg-[#fdfbf7] border border-[#d8caba] rounded-lg p-3 text-xs text-[#2b251f] leading-relaxed focus:outline-none focus:border-[#877464] resize-none"
                  required
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#6e5d4f] via-[#877464] to-[#594b3f] hover:from-[#7e6d5f] hover:to-[#695b4f] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>💾 保存到秘密手帐</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {diaryEntries.length === 0 ? (
                <div className="text-center py-12 text-[#877868] text-xs">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>秘密手帐里还是空的呢，去写下你在首尔女高的第一篇手帐日记吧！</p>
                </div>
              ) : (
                diaryEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-[#e2d6c3] rounded-xl p-3.5 space-y-2 shadow-2xs relative group hover:border-[#b8a794] transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-[#f0e6d6] pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{entry.sticker || '🌸'}</span>
                        <span className="font-bold text-[#594b3f]">{entry.title}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#877868]">
                        <span>{entry.weather}</span>
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                          心情: {entry.mood}
                        </span>
                        <span className="font-mono text-[#a39585]">{entry.dateStr}</span>

                        {onDeleteEntry && (
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer opacity-70 group-hover:opacity-100"
                            title="删除日志"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#4a3f35] leading-relaxed whitespace-pre-wrap pt-1">
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
