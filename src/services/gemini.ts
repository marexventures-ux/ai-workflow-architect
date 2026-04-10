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

export interface AutomationReport {
  jobAnalysis: JobAnalysis;
  priorityScores: PriorityScore[];
  startHere: StartHere;
  impactEstimate: ImpactEstimate;
  workflowIdeas: WorkflowIdea[];
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
}): Promise<AutomationReport> {
  const prompt = `
    As an AI Workflow Architect, analyze the following job details and provide a comprehensive, practical, and actionable automation report.
    
    User Input:
    - Job Role: ${userData.jobRole}
    - Industry: ${userData.industry}
    - Tools Currently Used (Optional): ${userData.toolsUsed || "Not specified, suggest common tools."}
    - Most Time-Consuming Task (Optional): ${userData.mostTimeConsumingTask || "Not specified."}
    
    Your goal is to create a practical blueprint that makes the user say "I can actually start this today."
    
    Follow this structure:
    1. JOB ANALYSIS: Daily Tasks and Common Tools.
    2. TASK BREAKDOWN: Automatable, AI-Enhanced, and Manual (Human-Centric) tasks.
    3. AUTOMATION PRIORITY SCORE: Rank tasks based on direct business impact (revenue/lost sales) and ease.
       Clearly explain the DIRECT business impact for each task (e.g., "Every missed message = lost sale") and emphasize urgency where applicable.
       Highest priority MUST reflect tasks that directly affect income, not just convenience.
    4. 🚀 START HERE: Recommend ONLY ONE workflow the user should begin with.
       Explain:
       - Why this is the best first step.
       - What immediate result they will see.
       This section must remove confusion and help the user take action immediately.
    5. TIME SAVED + BUSINESS IMPACT: Estimate hours saved and business value.
    6. WORKFLOWS: Create 2-4 detailed workflows with beginner and advanced steps.
       For each workflow, include a "SIMPLE FLOW" section before the steps.
       This must explain the workflow in plain, everyday language (e.g., "1. Customer sends message", "2. AI reads the message").
       Avoid technical terms in this section.
    7. AUTOMATION SYSTEM MAP: A simple, linear flow that prioritizes revenue-driving actions and the customer journey.
       Example: "Customer Message → AI Analysis → Lead Capture → Notification → Follow-up → Sale"
       Do NOT use generic labels like 'Input', 'Intelligence', or 'Output' as standalone steps.
       Every step must name the actual tool or action from this user's report.
       Provide this as a list of 4-6 steps that form a single linear revenue-driving chain.
    7. AI RISK & COMPETITIVE INSIGHT: Explain why AI won't replace them, but how it helps competitors.
    8. NEXT STEP ROADMAP: A 3-stage progression.
    9. IMPORTANT LIMITATIONS: Costs, restrictions, and assumptions.
    10. ESTIMATED MONTHLY COST: List each paid tool used in the workflows, its approximate monthly cost in USD, and a total range.
        Format:
        — [Tool Name]: $X/mo (reason: e.g. required for multi-step Zaps)
        — [Tool Name]: $X–Y/mo (usage-based)
        TOTAL ESTIMATE: $X–Y per month
        If a tool has a free tier that covers the workflow described, mark it as "Free (free tier sufficient)".
    11. 💰 COST VS VALUE: Explain the return on investment.
        - What the user gains in time and revenue.
        - Compare cost to potential return (e.g., "One extra sale per week can cover this cost").
        Make the cost feel like an investment, not an expense.
    12. PERSONALIZATION: If a most time-consuming task was provided, address it specifically.

    Use simple, clear language. Avoid technical overwhelm.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
              },
              required: ["name", "description", "skillLevel", "setupTime", "toolsRequired", "limitations", "beginnerSteps", "aiRole", "successIndicator"],
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
        required: ["jobAnalysis", "priorityScores", "startHere", "impactEstimate", "workflowIdeas", "systemMap", "aiRiskInsight", "roadmap", "limitations", "estimatedMonthlyCost", "costVsValue"],
      },
      systemInstruction: "You are an AI Workflow Architect. Your role is to help professionals analyze their job, find automation opportunities, and specifically design AI-powered workflows for Zapier. Your tone is professional, beginner-friendly, actionable, and encouraging.",
    },
  });

  return JSON.parse(response.text || "{}");
}
