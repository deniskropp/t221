import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full border-r border-slate-800/0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                msg.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600'
              }`}>
                {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Bot size={14} className="text-indigo-300" />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.authorName && msg.role !== 'user' && (
                  <span className="text-[10px] text-indigo-400 mb-1 font-mono font-bold tracking-widest uppercase opacity-80">
                    {msg.authorName}
                  </span>
                )}
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600/90 text-white rounded-tr-sm border border-indigo-500/50' 
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                }`}>
                  <ReactMarkdown 
                    components={{
                      code({node, className, children, ...props}) {
                        return (
                          <code className={`${className} bg-slate-950/50 border border-slate-700/50 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({children}) => <ul className="list-disc ml-4 mb-2 marker:text-indigo-400">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal ml-4 mb-2 marker:text-indigo-400">{children}</ol>,
                      blockquote: ({children}) => <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-slate-400 my-2">{children}</blockquote>
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <span className="text-[10px] text-slate-500/70 mt-1 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex w-full justify-start animate-pulse">
            <div className="flex max-w-[75%] gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                 <Sparkles size={14} className="text-indigo-400" />
              </div>
              <div className="bg-slate-800/60 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700/50 flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/50">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Input ⫻cmd or message..."
            className="w-full bg-slate-950/50 text-white placeholder-slate-500 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-800 transition-all font-sans tracking-wide"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-2">
           <span className="text-[10px] text-slate-600 font-mono">⫻mode: Fluid | ⫻agent: AR-00L UI v2.1</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;