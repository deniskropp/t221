export enum LearningStyle {
  Socratic = "Socratic",
  Direct = "Direct",
  Hybrid = "Hybrid"
}

export interface GraphNode {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  group?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface LearningGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  authorName?: string; // e.g., "AI_Tutor", "ScopeGuard"
  text: string;
  timestamp: number;
}

export interface KickLangState {
  objective: string;
  learningStyle: LearningStyle;
  currentNodeId: string;
  difficulty: string;
}

export interface SwarmAgent {
  name: string;
  role: string;
  status: string;
  color: string;
}

// Initial/Empty State constants
export const INITIAL_GRAPH: LearningGraphData = {
  nodes: [],
  links: []
};
