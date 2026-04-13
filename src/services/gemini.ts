import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface JobAnalysis {
  dailyTasks: string[];
  toolsUsed: string[];
  tasksAutomated: string[];
  tasksAI: string[];
  tasksManual: string[];
}

export interface PriorityScore {
  task: string;
  score: "High Priority ⭐⭐⭐⭐⭐" | "Medium ⭐⭐⭐" | "Low ⭐⭐";
  reason: string;
}

export interface ImpactEstimate {
  hoursSavedPerWeek: string;
  businessImpact: string;
}

export interface WorkflowIdea {
  name: string;
  description: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  setupTime: string;
  toolsRequired: { name: string; type: "Free" | "Paid"; alternative?: string }[];
  limitations: string[];
  simpleFlow: string[];
  beginnerSteps: string[];
  advancedSteps?: string[];
  aiRole: string;
  successIndicator: string;
}

export interface AIRiskInsight {
  whyNotReplace: string;
  competitorAdvantage: string;
  doingNothingRisk: string;
}

export interface Roadmap {
  stage1: string;
  stage2: string;
  stage3: string;
}

export interface CostItem {
  toolName: string;
  cost: string;
  reason: string;
}

export interface StartHere {
  workflowName: string;
  whyFirstStep: string;
  immediateResult: string;
}

export interface CostVsValue {
  gains: string;
  comparison: string;
}

export interface ROIAnalysis {
  estimatedMonthlySavings: number;
  estimatedYearlySavings: number;
  hoursSavedPerMonth: number;
  paybackPeriodMonths: number;
}

export interface ZapierTemplate {
  name: string;
  url: string;
  description: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: "trigger" | "action" | "ai" | "end";
}

export interface DiagramEdge {
  from: string;
  to: string;
}

export interface WorkflowDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface AutomationReport {
  jobAnalysis: JobAnalysis;
  priorityScores: PriorityScore[];
  startHere: StartHere;
  impactEstimate: ImpactEstimate;
  roiAnalysis: ROIAnalysis;
  workflowIdeas: (WorkflowIdea & { zapierTemplates: ZapierTemplate[]; diagram: WorkflowDiagram })[];
  systemMap: string[];
  aiRiskInsight: AIRiskInsight;
  roadmap: Roadmap;
  limitations: string[];
  personalizationNote?: string;
  estimatedMonthlyCost: {
    items: CostItem[];
    totalEstimate: string;
  };
  costVsValue: CostVsValue;
}

export async function generateAutomationReport(userData: {
  jobRole: string;
  industry: string;
  toolsUsed?: string;
  mostTimeConsumingTask?: string;
  currencySymbol?: string;
}): Promise<AutomationReport> {
  const currency = userData.currencySymbol || "$";
  const prompt = `
    As an AI Workflow Architect, analyze the following job details and provide a comprehensive, practical, and actionable automation report.
    
    User Input:
    - Job Role: ${userData.jobRole}
    - Industry: ${userData.industry}
    - Tools Currently Used (Optional): ${userData.toolsUsed || "Not specified, suggest common tools."}
    - Most Time-Consuming Task (Optional): ${userData.mostTimeConsumingTask || "Not specified."}
    - Preferred Currency: ${currency}
    
    Your goal is to create a practical blueprint that makes the user say "I can actually start this today."
    
    IMPORTANT: All financial estimates, costs, and savings MUST be provided in the user's preferred currency (${currency}). If you need to convert from USD, use current approximate exchange rates.
    
    Follow this structure:
    1. JOB ANALYSIS: Daily Tasks and Common Tools.
    2. TASK BREAKDOWN: Automatable, AI-Enhanced, and Manual (Human-Centric) tasks.
    3. AUTOMATION PRIORITY SCORE: Rank tasks based on direct business impact (revenue/lost sales) and ease.
    4. 🚀 START HERE: Recommend ONLY ONE workflow the user should begin with.
    5. ROI ANALYSIS: Provide numerical estimates for:
       - estimatedMonthlySavings (Number, in ${currency})
       - estimatedYearlySavings (Number, in ${currency})
       - hoursSavedPerMonth (Number)
       - paybackPeriodMonths (Number, usually 1-3)
    6. WORKFLOWS: Create 2-4 detailed workflows. For each:
       - Include a "zapierTemplates" array with 1-2 realistic Zapier template ideas (name, description, and a placeholder URL like "https://zapier.com/apps/google-sheets/integrations").
       - Include a "diagram" object with "nodes" and "edges" to represent the flow visually.
         - Nodes should have unique IDs and labels.
         - Types: "trigger", "action", "ai", "end".
    7. TIME SAVED + BUSINESS IMPACT: Estimate hours saved and business value.
    8. AUTOMATION SYSTEM MAP: A simple, linear flow chain.
    9. AI RISK & COMPETITIVE INSIGHT: Why AI won't replace them, but how it helps competitors.
    10. NEXT STEP ROADMAP: A 3-stage progression.
    11. ESTIMATED MONTHLY COST: List paid tools and costs.
    12. 💰 COST VS VALUE: Explain the return on investment.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      jobAnalysis: {
        type: Type.OBJECT,
        properties: {
          dailyTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          toolsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasksAutomated: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasksAI: { type: Type.ARRAY, items: { type: Type.STRING } },
          tasksManual: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["dailyTasks", "toolsUsed", "tasksAutomated", "tasksAI", "tasksManual"],
      },
      priorityScores: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING },
            score: { type: Type.STRING, enum: ["High Priority ⭐⭐⭐⭐⭐", "Medium ⭐⭐⭐", "Low ⭐⭐"] },
            reason: { type: Type.STRING },
          },
          required: ["task", "score", "reason"],
        },
      },
      startHere: {
        type: Type.OBJECT,
        properties: {
          workflowName: { type: Type.STRING },
          whyFirstStep: { type: Type.STRING },
          immediateResult: { type: Type.STRING },
        },
        required: ["workflowName", "whyFirstStep", "immediateResult"],
      },
      impactEstimate: {
        type: Type.OBJECT,
        properties: {
          hoursSavedPerWeek: { type: Type.STRING },
          businessImpact: { type: Type.STRING },
        },
        required: ["hoursSavedPerWeek", "businessImpact"],
      },
      roiAnalysis: {
        type: Type.OBJECT,
        properties: {
          estimatedMonthlySavings: { type: Type.NUMBER },
          estimatedYearlySavings: { type: Type.NUMBER },
          hoursSavedPerMonth: { type: Type.NUMBER },
          paybackPeriodMonths: { type: Type.NUMBER },
        },
        required: ["estimatedMonthlySavings", "estimatedYearlySavings", "hoursSavedPerMonth", "paybackPeriodMonths"],
      },
      workflowIdeas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            skillLevel: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            setupTime: { type: Type.STRING },
            toolsRequired: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Free", "Paid"] },
                  alternative: { type: Type.STRING },
                },
                required: ["name", "type"],
              },
            },
            limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            simpleFlow: { type: Type.ARRAY, items: { type: Type.STRING } },
            beginnerSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            advancedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiRole: { type: Type.STRING },
            successIndicator: { type: Type.STRING },
            zapierTemplates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  url: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["name", "url", "description"],
              },
            },
            diagram: {
              type: Type.OBJECT,
              properties: {
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING, enum: ["trigger", "action", "ai", "end"] },
                    },
                    required: ["id", "label", "type"],
                  },
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      from: { type: Type.STRING },
                      to: { type: Type.STRING },
                    },
                    required: ["from", "to"],
                  },
                },
              },
              required: ["nodes", "edges"],
            },
          },
          required: ["name", "description", "skillLevel", "setupTime", "toolsRequired", "limitations", "beginnerSteps", "aiRole", "successIndicator", "zapierTemplates", "diagram"],
        },
      },
      systemMap: { type: Type.ARRAY, items: { type: Type.STRING } },
      aiRiskInsight: {
        type: Type.OBJECT,
        properties: {
          whyNotReplace: { type: Type.STRING },
          competitorAdvantage: { type: Type.STRING },
          doingNothingRisk: { type: Type.STRING },
        },
        required: ["whyNotReplace", "competitorAdvantage", "doingNothingRisk"],
      },
      roadmap: {
        type: Type.OBJECT,
        properties: {
          stage1: { type: Type.STRING },
          stage2: { type: Type.STRING },
          stage3: { type: Type.STRING },
        },
        required: ["stage1", "stage2", "stage3"],
      },
      limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
      personalizationNote: { type: Type.STRING },
      estimatedMonthlyCost: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                toolName: { type: Type.STRING },
                cost: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["toolName", "cost", "reason"],
            },
          },
          totalEstimate: { type: Type.STRING },
        },
        required: ["items", "totalEstimate"],
      },
      costVsValue: {
        type: Type.OBJECT,
        properties: {
          gains: { type: Type.STRING },
          comparison: { type: Type.STRING },
        },
        required: ["gains", "comparison"],
      },
    },
    required: ["jobAnalysis", "priorityScores", "startHere", "impactEstimate", "roiAnalysis", "workflowIdeas", "systemMap", "aiRiskInsight", "roadmap", "limitations", "estimatedMonthlyCost", "costVsValue"],
  };

  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          systemInstruction: "You are an AI Workflow Architect. Your role is to help professionals analyze their job, find automation opportunities, and specifically design AI-powered workflows for Zapier. Your tone is professional, beginner-friendly, actionable, and encouraging. You MUST return a valid JSON object matching the requested schema.",
        },
      });

      const text = response.text?.trim() || "{}";
      if (text === "{}") throw new Error("Empty AI response");
      
      return JSON.parse(text);
    } catch (e) {
      console.error(`Attempt ${attempt} failed:`, e);
      lastError = e;
      if (attempt < 3) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error("Failed to generate report after 3 attempts");
}
