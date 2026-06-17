import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles, Orbit, Landmark, FileText, CheckCircle2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Copilot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to Carbon Bridge. I'm your CBAM Regulatory Assistant. Ask me anything about EU compliance, carbon tariffs, target trajectories, or verifying your satellite trace measurements.",
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fallback checks
  const copilotUrl = (import.meta as any).env?.VITE_COPILOT_URL || '';
  const isWired = !!copilotUrl;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (isWired) {
      try {
        const response = await fetch(copilotUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatHistory: [...messages, userMsg] }),
        });
        const resData = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: resData.choices?.[0]?.message?.content || resData.reply || 'No response returned.' }
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Connection timed out. Offline regulatory model activated to protect your data.' }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const query = input.toLowerCase();
        let reply = "I am currently running in offline diagnostic mode. You can ask me about tariffs, default penalties, verification pools, or remote sensing satellite audits!";
        
        if (query.includes('payment') || query.includes('obligation') || query.includes('when') || query.includes('timeline')) {
          reply = "Under the current EU CBAM timeline (Reg. EU 2025/2083), financial purchase obligations representing certificate payments begin September 30, 2027. Importers must log direct and indirect carbon performance starting January 2026. Use the Simulator workspace to model these liabilities.";
        } else if (query.includes('default') || query.includes('punitive') || query.includes('penalty') || query.includes('benchmark')) {
          reply = "If an importer fails to verify actual facility emissions, carbon taxes are calculated using country-specific defaults with punitive 30% markups (Reg. EU 2025/2621). This adds immense premiums compared to actual satellite-audited measurements.";
        } else if (query.includes('pool') || query.includes('share') || query.includes('cooperative')) {
          reply = "The Shared Pool approach allows any single importer-verified facility record to be contributed to our pooled database. For example, once POSCO Gwangyang is verified, all secondary importers sharing that route benefit instantly from those same verified coordinates, eliminating redundant auditing friction.";
        } else if (query.includes('satellite') || query.includes('trace') || query.includes('coordinate') || query.includes('radar')) {
          reply = "We use independent satellite + ML emissions estimates from Climate TRACE as a check on supplier self-reports. They're modelled at regional resolution (not a per-facility fingerprint), so we always carry them as a range + confidence and treat divergence as a private 'recommend verification' signal — never a public accusation or compliance verdict.";
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply }
        ]);
        setIsLoading(false);
      }, 700);
    }
  };

  return (
    <div id="carbon-copilot-container" className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      
      {/* Floating Glassmorphic Chat Window */}
      {isOpen && (
        <div className="w-[360px] h-[500px] backdrop-blur-3xl bg-white/80 border border-white/50 shadow-[0_25px_60px_rgba(0,0,0,0.18)] rounded-3xl flex flex-col mb-4 overflow-hidden transition-all duration-300 animate-fade-in text-left">
          
          {/* Glowing Animated Gradient Aura at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10B981] via-[#0EA5E9] to-[#b24c30] animate-pulse" />

          {/* Premium Header */}
          <div className="bg-stone-950/95 text-[#f5f5f7] p-4.5 flex justify-between items-center border-b border-white/10 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg relative">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 absolute top-1 right-1 animate-ping" />
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h5 className="font-sans text-xs font-semibold tracking-wide">Workspace Copilot</h5>
                <span className="font-mono text-[8.5px] text-stone-400 block uppercase mt-0.5">Compliant Intelligent Agent</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[8.5px] text-stone-400 bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                ● Ready
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-100 cursor-pointer p-1 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 p-4.5 overflow-y-auto space-y-4 max-h-[350px] scrollbar-thin">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
              >
                <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest mb-1 block">
                  {msg.role === 'user' ? 'DECLARANT / IMPORTER' : 'COPILOT ASSIST'}
                </span>
                <div 
                  className={`px-4 py-3 leading-relaxed text-xs shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-stone-900 text-[#F5F5F7] rounded-2xl rounded-tr-xs border border-stone-850' 
                      : 'bg-white/90 border border-stone-200/50 text-[#1C1E1B] rounded-2xl rounded-tl-xs font-light'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest mb-1 block">
                  COPILOT ANALYZING...
                </span>
                <div className="px-4 py-3 bg-white/90 border border-stone-200/50 text-[#1C1E1B] rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-sm text-xs">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Suggestion Chips */}
          <div className="px-4 pb-2 pt-1 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none text-[9.5px]">
            <button 
              onClick={() => setInput("What is the CBAM payment timeline?")}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-605 rounded-full cursor-pointer transition-all shrink-0 font-medium"
            >
              Timeline?
            </button>
            <button 
              onClick={() => setInput("Explain unverified penalty defaults.")}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-605 rounded-full cursor-pointer transition-all shrink-0 font-medium"
            >
              Penalties?
            </button>
            <button 
              onClick={() => setInput("How does the shared verification pool work?")}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-605 rounded-full cursor-pointer transition-all shrink-0 font-medium"
            >
              Shared Pool?
            </button>
          </div>

          {/* Form Input Area */}
          <form 
            onSubmit={handleSend}
            className="p-3.5 bg-stone-50/60 border-t border-stone-150 backdrop-blur-md flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tariffs, satellite monitoring..."
              className="flex-1 font-sans text-xs bg-white border border-stone-200 px-3.5 py-2 rounded-full focus:outline-hidden focus:border-[#2E4A3F] focus:ring-1 focus:ring-[#2E4A3F]/20"
            />
            <button
              type="submit"
              className="bg-stone-900 hover:bg-black text-[#F5F5F7] p-2 rounded-full transition-all cursor-pointer shadow-md inline-flex items-center justify-center shrink-0 w-8.5 h-8.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Premium Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 bg-gradient-to-tr from-stone-950 via-[#1C1D1B] to-stone-900 text-[#F5F5F7] rounded-full flex items-center justify-center shadow-xl hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] hover:scale-[1.04] transition-all cursor-pointer border border-white/10 ring-1 ring-black/5"
        title="Open CBAM Assistant Copilot"
      >
        <MessageSquare className="w-5.5 h-5.5 text-emerald-400 animate-pulse" />
      </button>

    </div>
  );
}
