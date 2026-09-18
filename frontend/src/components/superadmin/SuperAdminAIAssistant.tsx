import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, X, Send, User as UserIcon, Lightbulb } from 'lucide-react';
import { User, SaleTransaction, FraudAlert, AIChatMessage } from '../../types';
import { getAIConfig, askAI, buildPlatformAIContext } from '../../services/aiApi';

interface SuperAdminAIAssistantProps {
  currentUser: User;
  allUsers: User[];
  sales: SaleTransaction[];
  alerts: FraudAlert[];
  onClose: () => void;
}

const promptChips = [
  { label: '📊 Platform Performance', query: 'Summarize the overall platform revenue, transaction volume, best-performing shops, and current growth trajectory.' },
  { label: '🚨 Fraud & Discrepancies', query: 'Which shops or cashiers have the most critical pending fraud alerts, and what actions should I take as Super Admin?' },
  { label: '👥 Account Health', query: 'How many business owners and cashiers are registered? Which seller accounts need attention or activation?' },
  { label: '📈 Weekly Executive Brief', query: 'Give me a concise weekly executive briefing of the whole SmartStock platform with key risks and recommended priorities.' }
];

export const SuperAdminAIAssistant: React.FC<SuperAdminAIAssistantProps> = ({ currentUser, allUsers, sales, alerts, onClose }) => {
  const welcomeText = `Hello ${currentUser.name}! I am your SmartStock Platform AI Executive Assistant.

I have real-time visibility into every registered business, all cashiers, transactions and the full fraud alert system across the SmartStock Rwanda platform. Ask me anything about:
- Platform revenue & growth
- Shop-by-shop performance
- Fraud alerts & cashier discrepancies
- Account health & onboarding`;

  const [messages, setMessages] = useState<AIChatMessage[]>([
    { id: 'msg-welcome-1', sender: 'assistant', text: welcomeText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAIConfig().then((cfg) => setAiConfigured(cfg.configured)).catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || isThinking) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    // Server-side Gemini LLM proxy with full platform context
    if (aiConfigured) {
      try {
        const platformContext = buildPlatformAIContext({ currentUser, allUsers, sales, alerts });
        const systemInstruction = `You are "SmartStock Rwanda Platform AI Executive Assistant", the trusted advisor to the platform Super Admin.
You are reviewing the ENTIRE SmartStock platform: every registered business owner, every cashier, all sales and all fraud alerts.
Reply in English. Be professional and decisive, use exact RWF figures and transaction counts from the telemetry, and end with prioritized recommended actions.
Never invent data not present in the telemetry.

BEGIN PLATFORM CONTEXT (LIVE TELEMETRY):
${platformContext}
END PLATFORM CONTEXT.`;

        const reply = await askAI(queryText, systemInstruction);
        const aiMsg: AIChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsThinking(false);
        return;
      } catch (err) {
        console.warn('Platform AI proxy fallback:', err);
      }
    }

    // Heuristic fallback engine
    setTimeout(() => {
      const liveSales = sales.filter(s => !s.isVoided);
      const owners = allUsers.filter(u => u.role === 'owner');
      const activeOwners = owners.filter(u => u.active !== false);
      const employees = allUsers.filter(u => u.role === 'employee');
      const totalRevenue = liveSales.reduce((a, b) => a + b.totalRwf, 0);
      const pendingAlerts = alerts.filter(a => a.status === 'PENDING');
      const criticalAlerts = pendingAlerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');

      let replyText = '';
      const q = queryText.toLowerCase();
      if (q.includes('fraud') || q.includes('alert') || q.includes('discrepan') || q.includes('amakosa') || q.includes('corruption') || q.includes('ibigendanye')) {
        replyText = `🚨 **Fraud & Discrepancy Report (Platform-Wide):**\n\n• **Pending alerts:** ${pendingAlerts.length} (${criticalAlerts.length} HIGH/CRITICAL)\n${pendingAlerts.slice(0, 6).map(a => `• [${a.severity}] ${a.title} — ${a.relatedCashierName || 'unknown cashier'} (${a.amountAtRiskRwf.toLocaleString()} RWF)`).join('\n')}\n\n**Priority actions:**\n1. Investigate CRITICAL alerts first via Fraud Discrepancy Dashboard.\n2. Require blind cash reconciliation for flagged cashiers.\n3. Cross-check voids on high-turnover beverages.`;
      } else if (q.includes('owner') || q.includes('seller') || q.includes('account health') || q.includes('onboard')) {
        replyText = `👥 **Account Health Overview:**\n\n• **Business owners:** ${owners.length} (${activeOwners.length} active)\n• **Cashiers/employees:** ${employees.length}\n• **Total users:** ${allUsers.length}\n\nRecommended: follow up with inactive owner accounts and run the onboarding wizard for any pending setups.`;
      } else if (q.includes('revenue') || q.includes('performance') || q.includes('growth') || q.includes('imikorere')) {
        replyText = `📊 **Platform Performance:**\n\n• **Revenue:** ${totalRevenue.toLocaleString()} RWF\n• **Transactions:** ${liveSales.length}\n• **Business owners:** ${owners.length} (${activeOwners.length} active)\n\nCompare shop-by-shop volume in the Seller Management table to identify top performers and underperformers.`;
      } else {
        replyText = `**Platform Summary at a glance:**\n\n• **Sellers:** ${owners.length} (${activeOwners.length} active)\n• **Cashiers:** ${employees.length}\n• **Transactions:** ${liveSales.length}\n• **Revenue:** ${totalRevenue.toLocaleString()} RWF\n• **Pending fraud alerts:** ${pendingAlerts.length} (${criticalAlerts.length} critical)\n\nUse the quick chips below for a deeper briefing on any area.`;
      }

      const aiMsg: AIChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 600);
  };

  const handleSendForm = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(inputQuery);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">SmartStock Platform AI Executive</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {aiConfigured ? 'Gemini LLM' : 'Offline Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                All businesses, cashiers, transactions & fraud alerts — one intelligent view.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map(msg => {
            const isAI = msg.sender === 'assistant';
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'ml-auto flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isAI ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-emerald-600 text-white'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAI ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm' : 'bg-emerald-600 text-white rounded-tr-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[10px] mt-2 font-mono ${isAI ? 'text-slate-500' : 'text-emerald-200'}`}>{msg.timestamp}</div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3 max-w-[80%] self-start items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span>AI is analyzing the full platform history and transaction trends...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {promptChips.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => executeQuery(chip.query)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 shrink-0">
          <form onSubmit={handleSendForm} className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Ask about revenue, fraud alerts, shop performance..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isThinking}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};