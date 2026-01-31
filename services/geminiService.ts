import { GoogleGenAI, Type } from "@google/genai";
import { LearningGraphData, LearningStyle } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_TEXT = 'gemini-3-flash-preview';

/**
 * Generates the initial Knowledge Graph by simulating the GPTASe -> puTASe -> Lyra pipeline.
 * strictly adhering to the "Parallel TAS Extraction & Purification" flow.
 */
export const generateLearningGraph = async (objective: string): Promise<LearningGraphData> => {
  const systemPrompt = `
    You are the KickLang Swarm Orchestrator operating in ⫻mode:Fluid.
    Target Objective: "${objective}"

    ## EXECUTION FLOW: TAS PROCESSING
    1. **⫻cmd/exec:GPTASe**: Extract raw Task-Agnostic Steps (TAS) required to master this objective.
    2. **⫻cmd/exec:puTASe**: Purify these steps (refine, filter, structure) into ⫻data/ptas.
    3. **⫻cmd/exec:Lyra**: Architect a directed knowledge graph from the purified TAS.

    ## LYRA CONFIGURATION
    - **Nodes**: Represents the purified steps (ptas). 6-10 nodes max.
    - **Links**: Dependency flow (prerequisites first).
    - **Start**: Must have a node with id 'start'.
    - **Output**: Pure JSON matching the schema.

    Output ONLY the JSON for Lyra's final graph structure.
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
 * Main chat interaction using the detailed KickLang adaptive_tutoring_template.kl.
 */
export const sendKickLangMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  context: { objective: string; style: LearningStyle; currentNode: string; graph: LearningGraphData }
) => {
  
  const systemInstruction = `
    ⫻version: 2.1
    ⫻mode: Fluid
    ⫻context: "KickLang Adaptive Tutoring"
    
    ## CONFIGURATION
    ⫻data:
      ⫻obj: "${context.objective}"
      ⫻var:learning_style = "${context.style}"
      ⫻var:current_node = "${context.currentNode}"
      
    ## AGENT ROSTER (SWARM)
    - **AI_Tutor**: Primary instructor.
    - **DebuggAI**: Error analysis.
    - **ScopeGuard**: Prevents tangents.
    - **Lyra**: Knowledge graph architect.
    - **Dima**: Ethical oversight.
    - **Codein**: Implementation helper.
    - **AR-00L**: Visual aids.
    - **Kick_La_Metta**: Logic translator.
    - **WePlan**: Curriculum mapper.

    ## CORE FLOW (adaptive_tutoring_template.kl)
    1. **Clarify Focus**:
       "Current focus: [${context.currentNode}].
        Choose next step:
        A) Explain concept (uses AR-00L)
        B) Try it yourself (uses Codein/DebuggAI)
        C) Explore prerequisites (uses Lyra)"
    
    2. **Adapt Mode**:
       If style is Socratic -> Ask guiding questions.
       If style is Direct -> Explain clearly.

    3. **Handle Input**:
       - If user chooses A: **AI_Tutor** explains, **AR-00L** describes visuals.
       - If user chooses B: **Codein** sets challenge, **DebuggAI** fixes errors.
       - If user chooses C: **Lyra** navigates graph.

    4. **Guardrails**:
       - **ScopeGuard**: If user drifts, ask to save new goal.
       - **Dima**: Check for frustration or ethical risks.

    ## FORMATTING
    - Use Markdown.
    - Prefix agent changes with bold names (e.g., "**ScopeGuard:** ...").
    - Keep responses concise and flow-oriented.
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
    return "**SystemMonitor:** Neural core interrupt. Re-synchronizing swarm...";
  }
};
