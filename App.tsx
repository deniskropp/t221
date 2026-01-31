import React, { useState, useCallback, useRef } from 'react';
import { generateLearningGraph, sendKickLangMessage } from './services/geminiService';
import { 
    KickLangState, 
    LearningGraphData, 
    LearningStyle, 
    Message, 
    INITIAL_GRAPH,
    SwarmAgent
} from './types';
import ChatInterface from './components/ChatInterface';
import KnowledgeGraph from './components/KnowledgeGraph';
import SetupModal from './components/SetupModal';
import { 
    BrainCircuit, 
    Settings, 
    Activity, 
    ShieldCheck, 
    BookOpen,
    Code,
    PenTool,
    Map,
    Terminal
} from 'lucide-react';

const SWARM_AGENTS: SwarmAgent[] = [
    { name: "AI_Tutor", role: "Instructor", status: "Active", color: "text-indigo-400" },
    { name: "WePlan", role: "Strategist", status: "Planning", color: "text-blue-400" },
    { name: "Codein", role: "Implementation", status: "Standby", color: "text-amber-400" },
    { name: "ScopeGuard", role: "Focus", status: "Monitoring", color: "text-emerald-400" },
    { name: "Lyra", role: "Architect", status: "Graphing", color: "text-purple-400" },
    { name: "Dima", role: "Ethics", status: "Oversight", color: "text-red-400" },
    { name: "AR-00L", role: "Visuals", status: "Standby", color: "text-pink-400" },
    { name: "Kick_La_Metta", role: "Formalizer", status: "Standby", color: "text-slate-400" },
];

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
      // 1. Generate Graph via Lyra (simulating GPTASe -> puTASe -> Lyra)
      const graph = await generateLearningGraph(obj);
      setGraphData(graph);
      
      const startNode = graph.nodes.length > 0 ? graph.nodes[0].id : 'start';

      // Update State
      setKickLangState(prev => ({ 
        ...prev, 
        objective: obj,
        currentNodeId: startNode
      }));

      // 2. Initial Tutor Message strictly following template
      const initialMessage: Message = {
        id: 'init-1',
        role: 'model',
        authorName: 'AI_Tutor',
        text: `**⫻flow/adaptive_tutoring** initiated.\n\n**Lyra** has mapped the curriculum for **${obj}**. We are starting at **${graph.nodes[0]?.label || 'Start'}**.\n\nCurrent focus: **${graph.nodes[0]?.label || 'Start'}**.\n\nChoose next step:\nA) Explain concept (Direct Mode)\nB) Try it yourself (Interactive)\nC) Explore prerequisites`,
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

        // Parse Response for Role
        let author = 'AI_Tutor';
        if (responseText.includes('**Orchestrator')) author = 'Orchestrator';
        else if (responseText.includes('**ScopeGuard')) author = 'ScopeGuard';
        else if (responseText.includes('**DebuggAI')) author = 'DebuggAI';
        else if (responseText.includes('**Dima')) author = 'Dima';
        else if (responseText.includes('**WePlan')) author = 'WePlan';
        else if (responseText.includes('**Codein')) author = 'Codein';
        else if (responseText.includes('**AR-00L')) author = 'AR-00L';
        else if (responseText.includes('**Kick_La_Metta')) author = 'Kick_La_Metta';

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
                        Fluid Mode Active
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
        <div className="h-3/5 p-4 relative border-b border-slate-800">
             <KnowledgeGraph 
                data={graphData} 
                currentNodeId={kickLangState.currentNodeId}
                onNodeClick={handleNodeClick}
             />
        </div>

        {/* Bottom: Swarm Agents & Metrics Panel */}
        <div className="flex-1 bg-slate-900/50 p-6 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} /> Swarm Status
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
                {SWARM_AGENTS.map(agent => (
                    <div key={agent.name} className="bg-slate-800/50 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                        <div className={`flex items-center gap-2 mb-1 ${agent.color}`}>
                            {getAgentIcon(agent.name)}
                            <span className="font-bold text-xs">{agent.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400">{agent.role}</span>
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded">{agent.status}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-mono text-slate-500 mb-2">⫻data/metrics</h4>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                    <span>Ethics Compliance (Dima)</span>
                    <span className="text-emerald-500">Pass</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Graph Traversal (Lyra)</span>
                    <span>{(graphData.nodes.length > 0 ? (1 / graphData.nodes.length * 100).toFixed(0) : 0)}%</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

function getAgentIcon(name: string) {
    switch (name) {
        case 'AI_Tutor': return <BookOpen size={14} />;
        case 'WePlan': return <Map size={14} />;
        case 'Codein': return <Code size={14} />;
        case 'ScopeGuard': return <ShieldCheck size={14} />;
        case 'Lyra': return <BrainCircuit size={14} />;
        case 'Dima': return <Activity size={14} />;
        case 'AR-00L': return <PenTool size={14} />;
        case 'Kick_La_Metta': return <Terminal size={14} />;
        default: return <BrainCircuit size={14} />;
    }
}

export default App;
