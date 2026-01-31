import React, { useState } from 'react';
import { Target, ChevronRight, Loader2 } from 'lucide-react';

interface SetupModalProps {
  onStart: (objective: string) => void;
  isLoading: boolean;
}

const SetupModal: React.FC<SetupModalProps> = ({ onStart, isLoading }) => {
  const [objective, setObjective] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (objective.trim()) {
      onStart(objective);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6 text-indigo-400">
            <Target size={32} />
            <h1 className="text-2xl font-bold text-white tracking-tight">KickLang Tutor</h1>
        </div>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          Welcome to the adaptive tutoring protocol. Please define your learning objective. 
          I will instantiate the <strong>Lyra</strong> agent to build your knowledge graph and <strong>AI_Tutor</strong> to guide you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-slate-300 mb-2">
              What do you want to learn today?
            </label>
            <input
              id="objective"
              type="text"
              autoFocus
              disabled={isLoading}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g., Master linear algebra, Learn Python recursion..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={!objective.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Instantiating Agents...</span>
              </>
            ) : (
              <>
                <span>Initialize Session</span>
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>
        
        {isLoading && (
            <div className="mt-4 text-center">
                <p className="text-xs text-indigo-400 animate-pulse font-mono">⫻cmd/exec:Lyra → generating knowledge_graph...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SetupModal;
