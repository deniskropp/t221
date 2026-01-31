import React, { useState, useCallback, useRef } from 'react';
import { generateLearningGraph, sendKickLangMessage } from './services/geminiService';
import { 
    KickLangState, 
    LearningGraphData, 
    LearningStyle, 
    Message, 
    INITIAL_GRAPH 
} from './types';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import SetupModal from './components/SetupModal';
import { 
    BrainCircuit, 
    Settings, 
    Activity, 
    ShieldCheck, 
    BookOpen 
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const [kickLangState, setKickLangState] = useState<KickLangState>({
    objective: '',
    learningStyle: LearningStyle.Socratic,
    currentNodeId: 'start',
    difficulty: 'intermediate'
  });

  const [graphData, setGraphData] = useState<LearningGraphData>(INITIAL_GRAPH);
  
  const [messages, setMessages] = useState<Message[]>([]);

  // Refs for history tracking across re-renders
  const chatHistoryRef = useRef<{ role: string; parts: { text: string }[] }[]>([]);

  // Handlers
  const handleStartSession = async (obj: string) => {
    setIsLoading(true);
    try {
      // 1. Generate Graph via Lyra
      const graph = await generateLearningGraph(obj);
      setGraphData(graph);
      
      const startNode = graph.nodes.length > 0 ? graph.nodes[0].id : 'start';

      // Update State
      setKickLangState(prev => ({ 
        ...prev, 
        objective: obj,
        currentNodeId: startNode
      }));

      // 2. Initial Tutor Message
      const initialMessage: Message = {
        id: 'init-1',
        role: 'model',
        authorName: 'AI_Tutor',
        text: `Welcome! I've loaded the knowledge graph for **${obj}**. We are starting at **${graph.nodes[0]?.label || 'Start'}**. \n\nShould we dive right in with an example (Direct) or explore the concept together (Socratic)?`,
        timestamp: Date.now()
      };
      
      setMessages([initialMessage]);
      chatHistoryRef.current = [{
          role: 'model',
          parts: [{ text: initialMessage.text }]
      }];
      
      setHasStarted(true);
    } catch (e) {
      console.error(e);
      alert("Failed to initialize session. Please check your API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Optimistic User Message
    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Update History
    chatHistoryRef.current.push({ role: 'user', parts: [{ text }] });

    try {
        const responseText = await sendKickLangMessage(
            chatHistoryRef.current,
            text,
            {
                objective: kickLangState.objective,
                style: kickLangState.learningStyle,
                currentNode: graphData.nodes.find(n => n.id === kickLangState.currentNodeId)?.label || 'Unknown',
                graph: graphData
            }
        );

        // Parse Response for Role (Simple heuristic based on bold prefix e.g., **ScopeGuard:**)
        let author = 'AI_Tutor';
        if (responseText.includes('**ScopeGuard')) author = 'ScopeGuard';
        else if (responseText.includes('**DebuggAI')) author = 'DebuggAI';
        else if (responseText.includes('**Dima')) author = 'Dima';

        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            authorName: author,
            text: responseText,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMsg]);
        chatHistoryRef.current.push({ role: 'model', parts: [{ text: responseText }] });

    } catch (error) {
        console.error(error);
    } finally {
        setIsTyping(false);
    }
  };

  const handleNodeClick = useCallback((nodeId: string) => {
      setKickLangState(prev => ({ ...prev, currentNodeId: nodeId }));
      // Optionally trigger a Lyra message here to context switch
      const switchMsg = `⫻cmd/exec:Lyra → switching context to node ID: ${nodeId}`;
      console.log(switchMsg);
  }, []);

  const toggleStyle = () => {
      setKickLangState(prev => ({
          ...prev,
          learningStyle: prev.learningStyle === LearningStyle.Socratic ? LearningStyle.Direct : LearningStyle.Socratic
      }));
  };

  if (!hasStarted) {
      return <SetupModal onStart={handleStartSession} isLoading={isLoading} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT: Main Chat */}
      <div className="w-full md:w-3/5 lg:w-1/2 flex flex-col h-full border-r border-slate-800 shadow-2xl z-10">
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-3">
                <BrainCircuit className="text-indigo-500" />
                <div>
                    <h2 className="font-semibold text-white leading-tight">{kickLangState.objective}</h2>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isTyping ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                        Online
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleStyle}
                    className="text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                >
                    <Settings size={12} />
                    ⫻mode:{kickLangState.learningStyle}
                </button>
            </div>
        </header>
        <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
        />
      </div>

      {/* RIGHT: Visuals & Tools */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/2 flex-col h-full bg-slate-950">
        
        {/* Top: Knowledge Graph */}
        <div className="h-2/3 p-4 relative">
             <KnowledgeGraph 
                data={graphData} 
                currentNodeId={kickLangState.currentNodeId}
                onNodeClick={handleNodeClick}
             />
        </div>

        {/* Bottom: Agents & Metrics Panel */}
        <div className="flex-1 border-t border-slate-800 bg-slate-900/50 p-6 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={16} /> Active Agents
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                        <BookOpen size={16} />
                        <span className="font-bold text-sm">AI_Tutor</span>
                    </div>
                    <p className="text-xs text-slate-400">Driving instruction via {kickLangState.learningStyle} method.</p>
                </div>

                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <ShieldCheck size={16} />
                        <span className="font-bold text-sm">ScopeGuard</span>
                    </div>
                    <p className="text-xs text-slate-400">Monitoring topic drift. Deviation: 0%.</p>
                </div>
                
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-amber-400">
                        <Activity size={16} />
                        <span className="font-bold text-sm">Dima</span>
                    </div>
                    <p className="text-xs text-slate-400">Cognitive load: Optimal.</p>
                </div>

                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <BrainCircuit size={16} />
                        <span className="font-bold text-sm">Lyra</span>
                    </div>
                    <p className="text-xs text-slate-400">Graph nodes: {graphData.nodes.length}.</p>
                </div>
            </div>
            
            <div className="mt-6">
                <h4 className="text-xs font-mono text-slate-500 mb-2">⫻data/meta_skills</h4>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[35%]"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Session Progress</span>
                    <span>35%</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
