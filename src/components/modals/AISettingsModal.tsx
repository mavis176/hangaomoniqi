import React, { useState } from 'react';
import { X, Sparkles, Check, Globe, Wand2, Image as ImageIcon } from 'lucide-react';
import { AIConfig } from '../../types';

interface AISettingsModalProps {
  onClose: () => void;
  aiConfig: AIConfig;
  customBgUrl: string | null;
  onUpdateAIConfig: (newConfig: AIConfig) => void;
  onUpdateCustomBg: (url: string | null) => void;
  onTriggerCustomAIEvent: (customPrompt: string) => void;
  onNotify: (msg: string) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  onClose,
  aiConfig,
  customBgUrl,
  onUpdateAIConfig,
  onUpdateCustomBg,
  onTriggerCustomAIEvent,
  onNotify,
}) => {
  const [form, setForm] = useState<AIConfig>(aiConfig);
  const [customStoryPrompt, setCustomStoryPrompt] = useState('');
  const [bgInput, setBgInput] = useState(customBgUrl || '');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const styles = [
    '写实唯美韩剧青春校园风',
    '财阀千金校园逆袭爽文风',
    '青涩懵懂纯爱甜宠韩剧风',
    '首尔大学高考学霸竞技风',
  ];

  const handleSave = () => {
    onUpdateAIConfig(form);
    onUpdateCustomBg(bgInput.trim() ? bgInput.trim() : null);
    onNotify('AI 引擎与场景配置已保存！');
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('正在测试 AI 接口连接...');
    try {
      if (form.mode === 'builtin') {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (data.status === 'ok') {
          setTestStatus('✅ 内置 Gemini AI 引擎连接正常，可随时生成对话与剧情！');
        } else {
          setTestStatus('⚠️ 服务状态异常');
        }
      } else {
        if (!form.customBaseUrl || !form.customApiKey) {
          setTestStatus('❌ 请填写自定义 API Base URL 和 API Key');
          return;
        }
        const res = await fetch('/api/ai/custom-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: form.customBaseUrl,
            apiKey: form.customApiKey,
            model: form.customModel || 'gpt-4o-mini',
            messages: [{ role: 'user', content: '请用一句话向首尔女子高中的李秀妍问好。' }],
          }),
        });
        const data = await res.json();
        if (res.ok && data.content) {
          setTestStatus(`✅ 自定义 API 连接成功！测试回复：“${data.content.slice(0, 45)}”`);
        } else {
          setTestStatus(`❌ 连接失败：${data.error || '未知错误'}`);
        }
      }
    } catch (e: any) {
      setTestStatus(`❌ 连接出错：${e?.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-[#ece6db] border-2 border-[#f7f4ee] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden text-[#2b2620]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#6b6356] to-[#857b6b] text-white border-b border-[#b5ab99]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#f5d68e]" />
            <h2 className="text-base sm:text-lg font-bold tracking-wide">AI 剧情引擎与 API 接口设置</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#524b40]/60 hover:bg-[#524b40] flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 1. AI Mode Switcher */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-[#4a4237] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#8c6d3b]" />
              <span>AI 接口模式选择</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'builtin' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.mode === 'builtin'
                    ? 'bg-[#efe8d8] border-[#8c6d3b] shadow-xs'
                    : 'bg-[#ece8e0] border-[#cfc8ba] opacity-80'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-[#2b2620] flex items-center justify-between">
                  <span>内置 Gemini AI (推荐)</span>
                  {form.mode === 'builtin' && <Check className="w-4 h-4 text-[#6b8e63]" />}
                </div>
                <div className="text-[11px] text-[#6e6558] mt-1">
                  免配置开箱即用，支持同学AI实时对话、动态突发事件与校内匿名墙。
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, mode: 'custom' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.mode === 'custom'
                    ? 'bg-[#efe8d8] border-[#8c6d3b] shadow-xs'
                    : 'bg-[#ece8e0] border-[#cfc8ba] opacity-80'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-[#2b2620] flex items-center justify-between">
                  <span>连接自定义 API 接口</span>
                  {form.mode === 'custom' && <Check className="w-4 h-4 text-[#6b8e63]" />}
                </div>
                <div className="text-[11px] text-[#6e6558] mt-1">
                  支持接入 OpenAI / DeepSeek / 硅基流动等兼容 `/v1/chat/completions` 的接口。
                </div>
              </button>
            </div>

            {form.mode === 'custom' && (
              <div className="space-y-2.5 pt-2 border-t border-[#dfd9ce]">
                <div>
                  <label className="block text-[11px] font-bold text-[#5a5246] mb-1">
                    API Base URL (接口地址)
                  </label>
                  <input
                    type="text"
                    value={form.customBaseUrl}
                    onChange={(e) => setForm({ ...form, customBaseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1 或 https://api.deepseek.com/v1"
                    className="w-full bg-white border border-[#c7bfb0] rounded-lg px-3 py-1.5 text-xs text-[#2b2620]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5a5246] mb-1">
                      API Key (密钥)
                    </label>
                    <input
                      type="password"
                      value={form.customApiKey}
                      onChange={(e) => setForm({ ...form, customApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-white border border-[#c7bfb0] rounded-lg px-3 py-1.5 text-xs text-[#2b2620]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5a5246] mb-1">
                      模型名称 (Model)
                    </label>
                    <input
                      type="text"
                      value={form.customModel}
                      onChange={(e) => setForm({ ...form, customModel: e.target.value })}
                      placeholder="gpt-4o-mini / deepseek-chat"
                      className="w-full bg-white border border-[#c7bfb0] rounded-lg px-3 py-1.5 text-xs text-[#2b2620]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3 py-1.5 bg-[#dfd3b8] hover:bg-[#d2c3a3] border border-[#c7b693] rounded-lg text-xs font-bold text-[#383020] cursor-pointer"
              >
                测试接口连通性
              </button>
              {testStatus && (
                <span className="text-[11px] text-[#5a5246] font-medium max-w-[65%] truncate">
                  {testStatus}
                </span>
              )}
            </div>
          </div>

          {/* 2. AI Narrative Style */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-[#4a4237]">AI 校园剧情文风设定</div>
            <div className="flex flex-wrap gap-1.5">
              {styles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, narrativeStyle: s })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    form.narrativeStyle === s
                      ? 'bg-[#7d7261] text-white border-[#5a5246]'
                      : 'bg-[#ece8e0] text-[#4a4237] border-[#cfc8ba] hover:bg-[#e2ddd3]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Custom AI Story Director */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-[#4a4237] flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-[#8c6d3b]" />
              <span>AI 自由导演台（立即定制发生一段剧情）</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customStoryPrompt}
                onChange={(e) => setCustomStoryPrompt(e.target.value)}
                placeholder="例如：在天台偶遇李恩宇学长弹吉他、或者韩素拉主动借我笔记..."
                className="flex-1 bg-white border border-[#c7bfb0] rounded-lg px-3 py-2 text-xs text-[#2b2620]"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateAIConfig(form);
                  onClose();
                  onTriggerCustomAIEvent(customStoryPrompt);
                }}
                className="px-3.5 py-2 bg-gradient-to-b from-[#8c7a5b] to-[#6e5f45] text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer shadow-xs"
              >
                立即生成剧情
              </button>
            </div>
          </div>

          {/* 4. Optional Custom Hallway Background Image URL */}
          <div className="bg-[#f7f4ee] border border-[#cfc8ba] rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-[#4a4237] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#8c6d3b]" />
              <span>自定义走廊背景图 URL（选填，留空使用默认韩系校园场景）</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                placeholder="可粘贴任意竖版/横版校园背景图片链接..."
                className="flex-1 bg-white border border-[#c7bfb0] rounded-lg px-3 py-1.5 text-xs text-[#2b2620]"
              />
              {bgInput && (
                <button
                  type="button"
                  onClick={() => setBgInput('')}
                  className="px-2.5 py-1.5 bg-[#e2ddd3] text-[#5a5246] rounded-lg text-xs font-bold cursor-pointer"
                >
                  恢复默认
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#dfd9ce] border-t border-[#c7bfb0] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#c7c0b3] hover:bg-[#b8b0a2] text-[#2b2620] rounded-xl text-xs font-bold cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-b from-[#dfd3b8] to-[#c7b693] hover:from-[#eae0c8] hover:to-[#d2c2a0] border border-[#efe7d6] text-[#383020] rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            保存配置
          </button>
        </div>

      </div>
    </div>
  );
};
