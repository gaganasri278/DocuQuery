import React, { useState, useEffect } from 'react';
import { X, Cpu, Key, Database, Check, AlertCircle, Sliders, Volume2, Palette } from 'lucide-react';
import { SystemSettings, UserPreferences } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings | null;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}) => {
  if (!isOpen || !settings) return null;

  const [activeTab, setActiveTab] = useState<'ai' | 'preferences'>('ai');
  const [provider, setProvider] = useState<string>(settings.llm_provider || 'gemini');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');

  // Personalization Preferences State
  const [prefs, setPrefs] = useState<UserPreferences>({
    response_length: 'balanced',
    response_style: 'standard',
    tone: 'friendly',
    theme: 'system',
    voice_enabled: true
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.getPreferences().then(p => {
      if (p) setPrefs(p);
    }).catch(err => console.error(err));
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload: { llm_provider: string; gemini_api_key?: string; openai_api_key?: string } = {
        llm_provider: provider,
      };
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();

      const [updatedSettings, updatedPrefs] = await Promise.all([
        api.updateSettings(payload),
        api.updatePreferences(prefs)
      ]);

      onSettingsUpdated(updatedSettings);
      setPrefs(updatedPrefs);

      setStatusMsg({ type: 'success', text: 'All settings and preferences updated successfully!' });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-100 font-semibold text-base">
            <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Settings & Personalization</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Model & Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'preferences'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Personalization</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {activeTab === 'ai' ? (
            <>
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Default AI Engine / LLM Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="gemini">Google Gemini (Gemini 3.8 Flash / 3.1 Flash Lite) [Recommended]</option>
                  <option value="local">Local Semantic Extractive Engine (Zero API Key)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="ollama">Ollama Local LLM (Llama 3)</option>
                </select>
                <p className="text-xs text-slate-400">
                  {provider === 'gemini' && 'High-speed generative reasoning powered by Google Gemini with automatic model failover.'}
                  {provider === 'local' && 'Uses sentence-transformers & semantic matching with zero network calls.'}
                  {provider === 'openai' && 'Connects to OpenAI API for generative synthesis.'}
                  {provider === 'ollama' && 'Connects to a locally running Ollama instance at localhost:11434.'}
                </p>
              </div>

              {/* Gemini Key */}
              {provider === 'gemini' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Google Gemini API Key
                    </label>
                    {settings.has_gemini_key && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured & Active
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder={settings.has_gemini_key ? '••••••••••••••••••••' : 'Enter Gemini API Key'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* OpenAI Key */}
              {provider === 'openai' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      OpenAI API Key
                    </label>
                    {settings.has_openai_key && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder={settings.has_openai_key ? '••••••••••••••••••••' : 'Enter sk-...'}
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* System Specs */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Database className="w-3.5 h-3.5" />
                  <span>Vector Indexing Status</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 block">Embedding:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{settings.embedding_model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Chunks:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">{settings.total_chunks} chunks</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Response Length */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Response Detail Length
                </label>
                <select
                  value={prefs.response_length}
                  onChange={(e) => setPrefs({ ...prefs, response_length: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="concise">Concise (Direct, to-the-point answers)</option>
                  <option value="balanced">Balanced (Clear explanations with key context)</option>
                  <option value="detailed">Detailed (Exhaustive analysis, edge cases, background)</option>
                </select>
              </div>

              {/* Response Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preferred Answer Structure
                </label>
                <select
                  value={prefs.response_style}
                  onChange={(e) => setPrefs({ ...prefs, response_style: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="standard">Standard (Natural paragraphs)</option>
                  <option value="bullet_points">Bullet Points (High-yield bullet lists)</option>
                  <option value="step_by_step">Step-by-Step (Numbered progression)</option>
                  <option value="academic">Academic (Formal research tone)</option>
                </select>
              </div>

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Conversation Tone
                </label>
                <select
                  value={prefs.tone}
                  onChange={(e) => setPrefs({ ...prefs, tone: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="friendly">Friendly & Helpful</option>
                  <option value="professional">Professional & Crisp</option>
                  <option value="explanatory">Explanatory & Pedagogical</option>
                  <option value="concise">Direct & Concise</option>
                </select>
              </div>

              {/* Voice Feature Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>Enable Speech-To-Text and Text-To-Speech Controls</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.voice_enabled}
                  onChange={(e) => setPrefs({ ...prefs, voice_enabled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
