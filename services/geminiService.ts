import { GoogleGenAI, Type } from "@google/genai";
import { LearningGraphData, LearningStyle } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_TEXT = 'gemini-3-flash-preview';

/**
 * Generates the initial Knowledge Graph based on the user's objective using JSON schema.
 */
export const generateLearningGraph = async (objective: string): Promise<LearningGraphData> => {
  const systemPrompt = `
    You are Lyra, the Knowledge Graph Architect from the KickLang protocol.
    Your task is to decompose the user's learning objective into a directed graph of concepts.
    Objective: "${objective}"
    
    Rules:
    1. Create a logical progression starting from a 'start' node.
    2. Ensure dependency chains make sense (prerequisites first).
    3. Keep node labels concise (1-3 words).
    4. Limit to 6-10 key concepts for this session.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['pending', 'active', 'completed'] },
                },
                required: ['id', 'label', 'status']
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING }
                },
                required: ['source', 'target']
              }
            }
          },
          required: ['nodes', 'links']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LearningGraphData;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Failed to generate graph:", error);
    // Fallback graph
    return {
        nodes: [{ id: 'start', label: 'Start', status: 'active' }],
        links: []
    };
  }
};

/**
 * Main chat interaction using the KickLang persona.
 */
export const sendKickLangMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  context: { objective: string; style: LearningStyle; currentNode: string; graph: LearningGraphData }
) => {
  
  const systemInstruction = `
    ⫻version: 2.0
    ⫻mode: Fluid
    
    ## ROLES
    You are the "Orchestrator" running the KickLang Adaptive Tutoring Protocol.
    You will simulate the following agents dynamically:
    - **AI_Tutor**: Primary instructor. Styles: ${context.style}.
    - **DebuggAI**: Analyzes errors if user makes mistakes.
    - **ScopeGuard**: Keeps focus on "${context.objective}".
    - **Dima**: Checks emotional state and ethics.
    
    ## CONTEXT
    Current Objective: "${context.objective}"
    Current Concept Node: "${context.currentNode}"
    Learning Style: "${context.style}"
    
    ## GRAPH
    Nodes: ${context.graph.nodes.map(n => n.label).join(', ')}
    
    ## RULES
    1. Reply in markdown.
    2. Use the persona names as prefixes if switching roles (e.g., "**ScopeGuard:** We are drifting...").
    3. If the user masters the current node, suggest moving to the next linked node in the graph.
    4. Be concise but helpful. 
    5. If style is Socratic, ask questions. If Direct, explain clearly.
  `;

  // Filter history to map to Gemini format
  const formattedHistory = history.map(h => ({
    role: h.role === 'model' ? 'model' : 'user',
    parts: h.parts
  }));

  try {
    const chat = ai.chats.create({
      model: MODEL_TEXT,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      history: formattedHistory
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (e) {
    console.error("Chat error", e);
    return "I apologize, I'm having trouble connecting to the neural core. Please try again.";
  }
};
