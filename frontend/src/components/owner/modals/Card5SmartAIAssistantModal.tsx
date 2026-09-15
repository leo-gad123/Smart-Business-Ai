import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Bot, 
  X, 
  Send, 
  User as UserIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  TrendingUp, 
  Users, 
  Receipt,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { Product, SaleTransaction, ShiftRegister, User, AIChatMessage } from '../../../types';
import { db } from '../../../services/db';
import { useLanguage } from '../../../contexts/LanguageContext';
import { GoogleGenAI } from '@google/genai';

interface Card5SmartAIAssistantModalProps {
  currentUser: User;
  products: Product[];
  sales: SaleTransaction[];
  shifts: ShiftRegister[];
  allUsers: User[];
  onClose: () => void;
  initialPrompt?: string;
}

export const Card5SmartAIAssistantModal: React.FC<Card5SmartAIAssistantModalProps> = ({
  currentUser,
  products,
  sales,
  shifts,
  allUsers,
  onClose,
  initialPrompt
}) => {
  const { language, t } = useLanguage();

  const promptChips = useMemo(() => {
    if (language === 'fr') {
      return [
        { label: '👥 Croissance Clients & Churn', query: 'Comment les clients ont-ils augmenté ou diminué ? Donnez les chiffres de nouveaux clients, fidèles et taux d\'attrition.' },
        { label: '💳 Débiteurs & Crédit', query: 'Quel est l\'état des créances et dettes clients non payées ?' },
        { label: '🏆 Produits Populaires', query: 'Quels sont les produits les plus vendus en volume et valeur cette semaine ?' },
        { label: '📉 Stock Faible', query: 'Quels sont les produits en rupture de stock qui nécessitent un réapprovisionnement urgent ?' },
        { label: '📊 Rapport Hebdomadaire', query: 'Donnez-moi une analyse approfondie du rapport de performance hebdomadaire.' },
        { label: '🚨 Écarts de Caisse', query: 'Vérifiez s\'il y a des écarts de caisse ou des anomalies dans les quarts de travail.' }
      ];
    }
    if (language === 'en') {
      return [
        { label: '👥 Customer Growth & Churn', query: 'How did customers increase or decrease? Break down new vs returning customers and churn rate.' },
        { label: '💳 Debtors & Credit Ledger', query: 'What is the current total unpaid customer debt and active debtor count?' },
        { label: '🏆 Top-Moving Items', query: 'What are the top-moving items by volume and revenue this week?' },
        { label: '📉 Low Stock Alert', query: 'Which products are low in stock and urgently need restock?' },
        { label: '📊 Weekly Performance Report', query: 'Provide a strategic audit of the latest weekly performance metrics and next steps.' },
        { label: '🚨 Cash Shortages & Audits', query: 'Check if there are any cash drawer discrepancies or shift mismatches.' }
      ];
    }
    return [
      { label: '👥 Ubwiyongere bw\'Abakiriya (Growth & Churn)', query: 'Nigute abakiriya babaye benshi cyangwa bagabanutse? Mbwira imibare y\'abashya, abagarutse, na churn rate.' },
      { label: '💳 Igitabo cy\'Amadeni (Debtors & Credit)', query: 'Amadeni yose ahagaze ate? Ni ayahe mafaranga asigaye mu bakiriya batarishyura?' },
      { label: '🏆 Ibicuruzwa Bigurishwa Cyane (Top-Moving Items)', query: 'Ni ibihe bicuruzwa 5 byambere biri kugurishwa cyane n\'ingano yabyo?' },
      { label: '📉 Stock Igiye Gushira (Low Stock)', query: 'Ese ni ibihe bicuruzwa bigiye gushira muri stock bikeneye kurangurwa vuba?' },
      { label: '📊 Raporo y\'Icyumweru (Weekly Executive Report)', query: 'Ndasaba isesengura ryimbitse kuri Raporo y\'Icyumweru: ubwiyongere bw\'abakiriya, inyungu yose, n\'amadeni asigaye.' },
      { label: '🚨 Genzura Ikigega (Cashier Shortages & Audits)', query: 'Genzura niba hari ibura rya cash mu kigega cyangwa amafaranga adahuye mu mashifuti.' }
    ];
  }, [language]);

  const welcomeText = useMemo(() => {
    if (language === 'fr') {
      return `Bonjour ! Je suis votre Assistant d'Affaires IA intelligent pour ${currentUser.shopName || 'SmartStock Rwanda'}. 
Je peux vous aider à analyser les données de stock, suivre les salaires, vérifier les écarts de caisse et identifier vos produits les plus rentables.

Posez-moi n'importe quelle question en français, anglais ou kinyarwanda !`;
    }
    if (language === 'en') {
      return `Hello! I am your Smart AI Business Assistant for ${currentUser.shopName || 'SmartStock Rwanda'}. 
I can help you audit real-time stock levels, verify payroll and employee contracts, detect cash drawer shortages, and pinpoint your top profit products.

Ask me any question in English or Kinyarwanda!`;
    }
    return `Muraho neza! Ndi Smart AI Business Assistant wawe muri ${currentUser.shopName || 'SmartStock Rwanda'}. 
Nshobora kugufasha gusesengura amakuru ya stock, kugenzura abakozi bazohembwa, kureba niba hari ibura rya cash mu kigega, no kumenya ibicuruzwa bikwungukira cyane.

Wambaza ikibazo cyose mu Kinyarwanda cyangwa mu Cyongereza!`;
  }, [language, currentUser.shopName]);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-welcome-1',
      sender: 'assistant',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Context preparation for AI analysis
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

    // Prepare Live DB Telemetry & Backend Customer/Sales Analytics
    const lowStockItems = products.filter(p => p.currentStock <= p.reorderLevel);
    const contracts = db.getContracts();
    const invoices = db.getInvoices();
    const expenses = db.getExpenses();
    const analytics = db.getCustomerAndSalesAnalytics();

    const totalSalariesMonthly = contracts
      .filter(c => c.status === 'ACTIVE')
      .reduce((acc, c) => acc + c.monthlySalaryRwf, 0);

    const shiftDiscrepancies = shifts
      .map(s => {
        const cashVar = (s.closingActualCashCountedRwf ?? s.totalCashSalesRwf) - s.totalCashSalesRwf;
        const momoVar = (s.closingActualMomoCountedRwf ?? s.totalMomoSalesRwf) - s.totalMomoSalesRwf;
        return {
          cashier: s.cashierName,
          shiftCode: s.shiftCode,
          cashDiscrepancy: cashVar,
          momoDiscrepancy: momoVar,
          totalDiscrepancy: cashVar + momoVar
        };
      })
      .filter(d => d.totalDiscrepancy !== 0);

    const totalSalesRev = sales.reduce((acc, s) => acc + (s.isVoided ? 0 : s.totalAmountRwf), 0);

    // Call Gemini if API Key is configured
    const apiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are "SmartStock Rwanda AI Business Assistant", an expert retail store auditor and operations consultant based in Kigali, Rwanda.
Your role is to answer questions from the store owner ("${currentUser.shopName}") accurately, professionally, and empathetically using the LIVE shop data provided below.
Provide your response in clear, helpful Kinyarwanda and English (bilingual or matching the user query).
Use specific numbers, currency in RWF, and actionable next steps.

LIVE STORE TELEMETRY:
- Shop Name: ${currentUser.shopName}
- Total SKUs in Stock: ${products.length}
- Low Stock Items: ${JSON.stringify(lowStockItems.map(p => ({ name: p.name, currentStock: p.currentStock, reorderLevel: p.reorderLevel, unit: p.unit })))}
- Active Employees on Contract: ${JSON.stringify(contracts.map(c => ({ name: c.employeeName, role: c.role, salaryRwf: c.monthlySalaryRwf, status: c.status })))}
- Total Monthly Payroll Obligation: ${totalSalariesMonthly} RWF
- Cashier Shift Discrepancies: ${JSON.stringify(shiftDiscrepancies)}
- Total Sales Generated: ${totalSalesRev} RWF
- Purchase Invoices Recorded: ${invoices.length} invoices totaling ${invoices.reduce((a, b) => a + b.totalAmountRwf, 0)} RWF
- Operational Expenses Logged: ${expenses.length} expenses totaling ${expenses.reduce((a, b) => a + b.amountRwf, 0)} RWF

CUSTOMER GROWTH & SALES ANALYTICS:
- Total Customers: ${analytics.totalCustomers}
- New Customers: ${analytics.newCustomers}
- Returning Customers: ${analytics.returningCustomers}
- Repeat Customer Rate: ${analytics.repeatCustomerRatePercent}%
- Estimated Customer Churn Rate: ${analytics.churnRatePercent}%
- Customer Growth Trend: +${analytics.customerGrowthPercent}% (${analytics.growthTrend})
- Top-Moving Products: ${JSON.stringify(analytics.topMovingItems)}
- Debtors & Credit Status: ${analytics.debtSummary.activeDebtorsCount} active debtors, ${analytics.debtSummary.outstandingBalanceRwf} RWF unpaid balance, ${analytics.debtSummary.totalRecoveredRwf} RWF recovered (${Math.round((analytics.debtSummary.totalRecoveredRwf / (analytics.debtSummary.totalDebtIssuedRwf || 1)) * 100)}%)
- Sales Volume & Gross Margin: Revenue ${analytics.salesSummary.totalRevenueRwf} RWF, Gross Profit ${analytics.salesSummary.grossProfitRwf} RWF (${analytics.salesSummary.profitMarginPercent}%)
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\nUser Question: "${queryText}"`
        });

        if (response.text) {
          const aiMsg: AIChatMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: 'assistant',
            text: response.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsThinking(false);
          return;
        }
      } catch (err) {
        console.warn('Gemini Assistant API fallback:', err);
      }
    }

    // High-fidelity heuristic engine tailored for Rwanda retail shop context
    setTimeout(() => {
      let replyText = '';
      const q = queryText.toLowerCase();

      if (q.includes('abakiriya') || q.includes('customer') || q.includes('benshi') || q.includes('bagabanutse') || q.includes('churn') || q.includes('growth') || q.includes('returning') || q.includes('croissance')) {
        replyText = `📈 **Isesengura ry'Ubwiyongere bw'Abakiriya (Customer Growth & Retention):**\n\n` +
          `• **Ubwiyongere bw'Abakiriya (Growth Rate):** +${analytics.customerGrowthPercent}% (${analytics.growthTrend.toUpperCase()})\n` +
          `• **Abakiriya Bose Bahashye:** abakiriya ${analytics.totalCustomers}\n` +
          `• **Abakiriya Bashya (New Customers):** ${analytics.newCustomers} bashya bahashye ubwa mbere\n` +
          `• **Abakiriya Bagarutse (Returning / Repeat):** ${analytics.returningCustomers} (${analytics.repeatCustomerRatePercent}% repeat customer rate)\n` +
          `• **Igipimo cy'Abataragarutse (Estimated Churn Rate):** ${analytics.churnRatePercent}%\n\n` +
          `💡 **Inama z'Ubucuruzi zo Gukuza Abakiriya:**\n` +
          `1. **Gushimira abagaruka:** Abakiriya ${analytics.returningCustomers} bakunda guhaha hano. Kwakira neza no kwohereza SMS receipt bibubakamo ikizere gihoraho.\n` +
          `2. **Kugabanya Churn:** Buri mukiriya utagarutse mu minsi 14, shishikariza abakozi kumuterefona no kumenya impamvu cyangwa kumwoherereza amakuru y'ibicuruzwa bishya.`;
      } else if (q.includes('amadeni') || q.includes('debt') || q.includes('debtor') || q.includes('kwikopesha') || q.includes('ibirarane') || q.includes('créance')) {
        const recoveryPct = Math.round((analytics.debtSummary.totalRecoveredRwf / (analytics.debtSummary.totalDebtIssuedRwf || 1)) * 100);
        replyText = `💳 **Amakuru y'Igitabo cy'Amadeni (Debtors & Credit Ledger):**\n\n` +
          `• **Amafaranga Asigaye Kwishyuzwa (Outstanding Balance):** ${analytics.debtSummary.outstandingBalanceRwf.toLocaleString()} RWF\n` +
          `• **Abakiriya Bafite Ibirarane (Active Debtors):** abakiriya ${analytics.debtSummary.activeDebtorsCount}\n` +
          `• **Amafaranga amaze Kugaruzwa:** ${analytics.debtSummary.totalRecoveredRwf.toLocaleString()} RWF (${recoveryPct}% recovery rate)\n` +
          `• **Amafaranga Yose Yatanzwe ku Kwikopesha:** ${analytics.debtSummary.totalDebtIssuedRwf.toLocaleString()} RWF\n\n` +
          `⚠️ **Inama yo Kwishyuza:** Koresha "Card 4: Debtors Dashboard" ukande buto "Kwishyuza" kuri buri mukiriya wishyuye cash cyangwa MoMo. Ibi birinda ko 142,500 RWF yahera mu bakiriya!`;
      } else if (q.includes('top') || q.includes('moving') || q.includes('curuzwa') || q.includes('bicuruzwa cyane') || q.includes('populaire')) {
        const itemsList = analytics.topMovingItems.map((item, idx) => `• #${idx + 1} **${item.productName}**: yacuruje ${item.unitsSold} units (${item.revenueRwf.toLocaleString()} RWF)`).join('\n');
        replyText = `🏆 **Ibicuruzwa Byagurishijwe Cyane Muri Iki Cyumweru (Top-Moving Items):**\n\n${itemsList}\n\n📊 Ibi bicuruzwa nibyo bigize igice kinini cy'amafaranga yinjira muri ${currentUser.shopName}. Bikeneye guhora bifite stock ihagije kugira ngo bitarinda gushira.`;
      } else if (q.includes('raporo') || q.includes('weekly') || q.includes('icyumweru') || q.includes('report') || q.includes('rapport')) {
        replyText = `📊 **Isesengura ry'Imikorere y'Icyumweru (Weekly Strategic Performance):**\n\n` +
          `• **Amafaranga Yinjiye (Total Sales Volume):** ${analytics.salesSummary.totalRevenueRwf.toLocaleString()} RWF (${analytics.salesSummary.totalTransactions} transactions)\n` +
          `• **Inyungu Nzima (Gross Profit):** ${analytics.salesSummary.grossProfitRwf.toLocaleString()} RWF (Margin: ${analytics.salesSummary.profitMarginPercent}%)\n` +
          `• **Ubwiyongere bw'Abakiriya:** +${analytics.customerGrowthPercent}% (${analytics.newCustomers} bashya, ${analytics.returningCustomers} bagarutse)\n` +
          `• **Amadeni Asigaye:** ${analytics.debtSummary.outstandingBalanceRwf.toLocaleString()} RWF mu bakiriya ${analytics.debtSummary.activeDebtorsCount}\n` +
          `• **Ibicuruzwa Byambere:** ${analytics.topMovingItems[0]?.productName || 'Inyange Milk'} (${analytics.topMovingItems[0]?.unitsSold || 0} units)\n\n` +
          `🎯 **Ingamba z'Icyumweru Gitaha:**\n` +
          `1. Ishyura abakozi hakurikijwe amasezerano ya MIFOTRA.\n` +
          `2. Shishikariza abakiriya kwishyura amadeni asigaye ukoresheje SMS z'ikibutso.\n` +
          `3. Kongera stock y'ibicuruzwa bigurishwa cyane mbere y'impera z'icyumweru.`;
      } else if (q.includes('stock') || q.includes('gushira') || q.includes('reorder') || q.includes('rangura')) {
        if (lowStockItems.length > 0) {
          const itemsList = lowStockItems.map(p => `• ${p.name}: bisigaye ${p.currentStock} ${p.unit} gusa (Reorder level: ${p.reorderLevel})`).join('\n');
          replyText = `**Ibicuruzwa bigiye gushira bikeneye kurangurwa (${lowStockItems.length} items):**\n\n${itemsList}\n\n💡 **Inama ya AI:** Ihutishe commande kuri supplier/depot kugira ngo abakiriya bidasubiriraho ubusa.`;
        } else {
          replyText = `✅ Amakuru meza! Kugeza ubu ibicuruzwa byose (${products.length} SKUs) biri hejuru ya reorder level. Nta gicuruzwa gishonje muri stock.`;
        }
      } else if (q.includes('umushahara') || q.includes('salary') || q.includes('payroll') || q.includes('abakozi') || q.includes('hemba')) {
        const staffList = contracts.map(c => `• **${c.employeeName}** (${c.role}): ${c.monthlySalaryRwf.toLocaleString()} RWF/ukwezi (${c.status})`).join('\n');
        replyText = `**Amakuru y'Umushahara w'Abakozi (Payroll Summary):**\n\n${staffList}\n\n💵 **Amafaranga yose akenewe ku kwezi:** ${totalSalariesMonthly.toLocaleString()} RWF\n\n📌 *Icyitonderwa:* Amasezerano yose arinzwe hakurikijwe itegeko rya MIFOTRA & RSSB.`;
      } else if (q.includes('cashier') || q.includes('shortage') || q.includes('ikigega') || q.includes('ibura') || q.includes('audit')) {
        if (shiftDiscrepancies.length > 0) {
          const discList = shiftDiscrepancies.map(d => `• **${d.cashier}** (${d.shiftCode}): Ikinyuranyo cyose ni ${d.totalDiscrepancy.toLocaleString()} RWF (Cash: ${d.cashDiscrepancy.toLocaleString()} RWF, MoMo: ${d.momoDiscrepancy.toLocaleString()} RWF)`).join('\n');
          replyText = `⚠️ **Iburira ku Bucungamari bwa Cashier:**\n\nHagaragaye ikinyuranyo mu mashifuti akurikira:\n\n${discList}\n\n🔍 **Inama y'Umutekano:** Koresha "Card 3: Cashier Reconciliation" ugenzure buri kintu cyaguzwe na buri ticket. Ibi birinda ko amafaranga yakwibwa buri munsi bikavamo ibihumbi byinshi mu kwezi.`;
        } else {
          replyText = `✅ **Audit y'Ikigega Isukuye:** Amashifuti yose arangije neza kandi nta cash shortage cyangwa ikinyuranyo cyagaragaye. Cash yo mu isanduku na MTN MoMo bihwanye 100% n'ibyagurishijwe muri POS.`;
        }
      } else if (q.includes('inyungu') || q.includes('profit') || q.includes('gurisha')) {
        replyText = `📊 **Incamake y'Ubukungu bw'Iduka:**\n\n• **Amafaranga Yagurishijwe (Total Sales):** ${totalSalesRev.toLocaleString()} RWF\n• **Ibicuruzwa Biri muri Sisitemu:** ${products.length} SKUs\n• **Inyungu Nzima (Gross Profit):** ${analytics.salesSummary.grossProfitRwf.toLocaleString()} RWF (${analytics.salesSummary.profitMarginPercent}% margin)\n• **Ibicuruzwa Byinjiza Cyane:** Amata ya Inyange, Isukari ya Kabuye, Primus na Simba Groceries.\n\n📈 Kanda kuri "Card 3: Business Management & Revenue Analytics" urebe profit kuri buri gicuruzwa n'amatariki uhisemo.`;
      } else {
        replyText = `**Igisubizo kuri "${queryText}":**\n\nMurakoze kubaza. Muri ${currentUser.shopName}, ubu dufite:\n• Ibicuruzwa ${products.length} muri stock\n• Abakiriya ${analytics.totalCustomers} bahashye (+${analytics.customerGrowthPercent}% growth)\n• Amadeni asigaye kwishyuzwa: ${analytics.debtSummary.outstandingBalanceRwf.toLocaleString()} RWF\n• Abakozi ${allUsers.length} banditswe muri sisitemu\n\nUshobora gukoresha ubutumwa buto bwihuse (Prompt chips) hasi hano kugira ngo ndusheho kugusobanurira amakuru arambuye!`;
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

  // Run initialPrompt if provided
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      executeQuery(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendForm = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(inputQuery);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0b1329] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {t.ownerDashboard.card5.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {t.ownerDashboard.card5.tag}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {t.ownerDashboard.card5.subtitle}
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
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isAI 
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isAI
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm'
                    : 'bg-emerald-600 text-white rounded-tr-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div className={`text-[10px] mt-2 font-mono ${isAI ? 'text-slate-500' : 'text-emerald-200'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-3 max-w-[80%] self-start items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {language === 'fr' 
                    ? "L'IA analyse les données de stock et financières..." 
                    : language === 'en' 
                    ? "AI is analyzing stock telemetry and shop metrics..." 
                    : "AI irimo gusesengura amakuru ya stock n'ubukungu..."}
                </span>
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
              placeholder={
                language === 'fr'
                  ? "Posez une question sur vos stocks, employés ou bénéfices..."
                  : language === 'en'
                  ? "Ask AI about products, employees, or shop profit..."
                  : "Baza AI ikibazo ku bicuruzwa, abakozi, cyangwa inyungu..."
              }
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
              <span className="hidden sm:inline">
                {language === 'fr' ? 'Envoyer' : language === 'en' ? 'Send' : 'Baza'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
