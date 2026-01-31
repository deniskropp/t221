import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, Loader2, Sparkles } from 'lucide-react';

interface SetupModalProps {
  onStart: (objective: string) => void;
  isLoading: boolean;
}

const SetupModal: React.FC<SetupModalProps> = ({ onStart, isLoading }) => {
  const [objective, setObjective] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Steps matching the "Parallel TAS Processing" flow
  const loadingMessages = [
    "⫻cmd/exec:GPTASe → extracting raw TAS...",
    "⫻cmd/exec:puTASe → purifying logic (⫻data/ptas)...",
    "⫻cmd/exec:Lyra → structuring ⫻data/spec...",
    "⫻flow/ocs/swarm → initializing agent swarm..."
  ];

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1000);
      return () => clearInterval(interval);
    } else {
        setLoadingStep(0);
    }
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (objective.trim()) {
      onStart(objective);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-6 text-indigo-400 relative z-10">
            <Target size={32} />
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">KickLang Tutor</h1>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Fluid Mode • Swarm v2.1</span>
            </div>
        </div>
        
        <p className="text-slate-400 mb-8 leading-relaxed relative z-10">
          Define your learning objective. The <strong>Swarm</strong> will execute parallel TAS extraction to build your personalized curriculum.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-slate-300 mb-2">
              What is your learning objective?
            </label>
            <input
              id="objective"
              type="text"
              autoFocus
              disabled={isLoading}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g., Master Linear Algebra, Build a React App..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600 font-mono text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!objective.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing TAS...</span>
              </>
            ) : (
              <>
                <span>Initialize Swarm</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
        
        {isLoading && (
            <div className="mt-6 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Sparkles size={12} />
                    <span>Parallel Execution Active</span>
                </div>
                <p className="text-slate-400 animate-pulse">
                    {loadingMessages[loadingStep]}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SetupModal;
