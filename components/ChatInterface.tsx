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
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-indigo-600'
              }`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.authorName && msg.role !== 'user' && (
                  <span className="text-xs text-indigo-400 mb-1 font-mono font-bold tracking-wide">
                    {msg.authorName}
                  </span>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
                }`}>
                  <ReactMarkdown 
                    components={{
                      code({node, className, children, ...props}) {
                        return (
                          <code className={`${className} bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono text-xs`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex w-full justify-start animate-pulse">
            <div className="flex max-w-[75%] gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                 <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
              </div>
            </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Type your answer or question..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-2">
           <span className="text-[10px] text-slate-500 font-mono">⫻mode: Fluid | ⫻lang: en | powered by Gemini</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
