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
  skillLevelExplanation: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  setupTimeBreakdown: { phase: string; duration: string }[];
  toolsRequired: { name: string; type: "Free" | "Paid"; alternative?: string }[];
  architecture: {
    trigger: string;
    inputData: string;
    logic: string[];
    output: string;
    storage: string;
  };
  implementationSteps: string[];
  promptLogic: {
    examplePrompt: string;
    variables: string[];
    structure: string;
  };
  dataStructure: {
    requiredFields: string[];
    format: string;
  };
  humanReviewPoints: string[];
  failureHandling: {
    commonErrors: string[];
    correctionSteps: string;
  };
  customizationOptions: string;
  expectedOutputExample: string;
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
  costTier: 'Low Cost' | 'Medium Cost' | 'High Cost';
  costRange: string;
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

export interface ROIBreakdownItem {
  taskName: string;
  hoursSaved: number;
}

export interface ROIAnalysis {
  estimatedLaborSavings: number;
  directExpensesSavings: number;
  totalMonthlyValue: number;
  hoursSavedPerMonth: number;
  paybackPeriod: string;
  calculationLogic: string;
  breakdown: ROIBreakdownItem[];
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
    overallCostTier: 'Low Setup' | 'Medium Setup' | 'High Setup';
  };
  costVsValue: CostVsValue;
}

export async function generateAutomationReport(userData: {
  jobRole: string;
  industry: string;
  toolsUsed?: string;
  mostTimeConsumingTask?: string;
  workDescription?: string;
  currencySymbol?: string;
  monthlySalary?: number;
  hourlyRate?: number;
  calcMode?: 'hourly' | 'monthly';
}): Promise<AutomationReport> {
  const currency = userData.currencySymbol || "$";
  const salaryText = userData.calcMode === 'monthly' ? `Monthly Salary: ${currency}${userData.monthlySalary}` : `Hourly Rate: ${currency}${userData.hourlyRate}`;
  
  const prompt = `
    As an AI Workflow Architect, analyze the following job details and provide a comprehensive, practical, and actionable automation report.
    
    User Context:
    - Job Role: ${userData.jobRole}
    - Industry: ${userData.industry}
    - Financial Context: ${salaryText}
    - Detailed Work Description/Tasks (Optional): ${userData.workDescription || "Not specified."}
    - Tools Currently Used (Optional): ${userData.toolsUsed || "Not specified, suggest common tools."}
    - Most Time-Consuming Task (Optional): ${userData.mostTimeConsumingTask || "Not specified."}
    - Preferred Currency: ${currency}
    
    ROI CALCULATION PROTOCOL (MANDATORY):
    Step 1: Identify "Hours Saved Per Month" by summing the breakdown of 3-5 specific tasks.
    Step 2: Calculate "Hourly Value" strictly using: 
       If Monthly Salary provided: Hourly Value = Monthly Salary ÷ 160
       If Hourly Rate provided: Hourly Value = Hourly Rate
    Step 3: Compute "Labor Savings" = Hours Saved × Hourly Value.
    Step 4: Identify "Direct Expenses Savings" (e.g., cutting old software costs) ONLY if applicable.
    Step 5: Compute "Total Monthly Value" = Labor Savings + Direct Expenses Savings.

    Your goal is to create a practical blueprint that makes the user say "I can actually start this today."
    If the user provided a "Detailed Work Description/Tasks", prioritize analyzing those specific tasks for automation.
    
    IMPORTANT: All financial estimates, costs, and savings MUST be provided in the user's preferred currency (${currency}). If you need to convert from USD, use current approximate exchange rates.
    
    Follow this structure:
    1. JOB ANALYSIS: Daily Tasks and Common Tools.
    2. TASK BREAKDOWN: Automatable, AI-Enhanced, and Manual (Human-Centric) tasks.
    3. AUTOMATION PRIORITY SCORE: Rank tasks based on direct business impact (revenue/lost sales) and ease.
    4. 🚀 START HERE: Recommend ONLY ONE workflow the user should begin with.
    5. ROI ANALYSIS: Numerical estimates strictly derived from the ROI CALCULATION PROTOCOL.
       - estimatedLaborSavings (Number, in ${currency})
       - directExpensesSavings (Number, in ${currency}, default to 0)
       - totalMonthlyValue (Number, in ${currency})
       - hoursSavedPerMonth (Number)
       - paybackPeriod (String) - MUST be a range (e.g., "~2.4 – 3.6 weeks").
       - calculationLogic (String) - Explain the math (e.g., "12 hrs saved x ${currency}625/hr labor value").
       - breakdown: A list of 3-5 specific tasks and hours saved for each.
    6. WORKFLOWS: Create 2-4 COMPLETE IMPLEMENTATION BLUEPRINTS. Do NOT summarize. Provide depth for real-world deployment.
       For each workflow, include:
       - architecture: Map out Trigger -> Input -> Logic -> Output -> Storage.
       - implementationSteps: Detailed, actionable list of setup instructions (no vague advice).
       - promptLogic: A complete, reusable AI prompt with variables (e.g., "[Client_Name]").
       - dataStructure: Define required fields and required format (e.g., Google Sheet columns).
       - humanReviewPoints: Where manual intervention or approval is mandatory.
       - failureHandling: List of common errors and precise correction steps.
       - setupTimeBreakdown: Breakdown of time by phase (e.g., "Phase 1: Tool Connection - 30m").
       - customizationOptions: How to adjust tone, format, or depth.
       - skillLevelExplanation: Describe what a user at this level needs to know or do.
       - expectedOutputExample: A specific "Sample Result" showing what the automation produces.
       - zapierTemplates: Realistic Zapier template ideas.
       - diagram: Nodes (trigger, ai, action, end) and edges.
    7. TIME SAVED + BUSINESS IMPACT: Estimate hours saved and business value.
    8. AUTOMATION SYSTEM MAP: A simple, linear flow chain.
    9. AI RISK & COMPETITIVE INSIGHT: Why AI won't replace them, but how it helps competitors.
    10. NEXT STEP ROADMAP: A 3-stage progression.
    11. ESTIMATED MONTHLY COST: Categorize required tools into cost tiers.
        - Low Cost: 0 - ${currency}10,000 monthly equivalent.
        - Medium Cost: ${currency}10,000 - ${currency}50,000 monthly equivalent.
        - High Cost: ${currency}50,000+ monthly equivalent.
        - CRITICAL: Use ranges for cost (e.g., "${currency}20,000 - ${currency}40,000/mo"). 
        - NEVER output a single exact total for all tools combined. Instead, classify the "overallCostTier" as "Low Setup", "Medium Setup", or "High Setup".
        - items: A list of products (toolName, costTier, costRange, reason).
        - overallCostTier: An overall summary label.
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
          estimatedLaborSavings: { type: Type.NUMBER },
          directExpensesSavings: { type: Type.NUMBER },
          totalMonthlyValue: { type: Type.NUMBER },
          hoursSavedPerMonth: { type: Type.NUMBER },
          paybackPeriod: { type: Type.STRING },
          calculationLogic: { type: Type.STRING },
          breakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskName: { type: Type.STRING },
                hoursSaved: { type: Type.NUMBER },
              },
              required: ["taskName", "hoursSaved"],
            },
          },
        },
        required: ["estimatedLaborSavings", "directExpensesSavings", "totalMonthlyValue", "hoursSavedPerMonth", "paybackPeriod", "calculationLogic", "breakdown"],
      },
      workflowIdeas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            skillLevelExplanation: { type: Type.STRING },
            skillLevel: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            setupTimeBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  duration: { type: Type.STRING },
                },
              },
            },
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
            architecture: {
              type: Type.OBJECT,
              properties: {
                trigger: { type: Type.STRING },
                inputData: { type: Type.STRING },
                logic: { type: Type.ARRAY, items: { type: Type.STRING } },
                output: { type: Type.STRING },
                storage: { type: Type.STRING },
              },
            },
            implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            promptLogic: {
              type: Type.OBJECT,
              properties: {
                examplePrompt: { type: Type.STRING },
                variables: { type: Type.ARRAY, items: { type: Type.STRING } },
                structure: { type: Type.STRING },
              },
            },
            dataStructure: {
              type: Type.OBJECT,
              properties: {
                requiredFields: { type: Type.ARRAY, items: { type: Type.STRING } },
                format: { type: Type.STRING },
              },
            },
            humanReviewPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            failureHandling: {
              type: Type.OBJECT,
              properties: {
                commonErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctionSteps: { type: Type.STRING },
              },
            },
            customizationOptions: { type: Type.STRING },
            expectedOutputExample: { type: Type.STRING },
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
          required: [
            "name", "description", "skillLevel", "skillLevelExplanation",
            "setupTimeBreakdown", "toolsRequired", "architecture",
            "implementationSteps", "promptLogic", "dataStructure",
            "humanReviewPoints", "failureHandling", "customizationOptions",
            "expectedOutputExample", "aiRole", "successIndicator", 
            "zapierTemplates", "diagram"
          ],
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
                costTier: { type: Type.STRING, enum: ["Low Cost", "Medium Cost", "High Cost"] },
                costRange: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["toolName", "costTier", "costRange", "reason"],
            },
          },
          overallCostTier: { type: Type.STRING, enum: ["Low Setup", "Medium Setup", "High Setup"] },
        },
        required: ["items", "overallCostTier"],
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
          systemInstruction: `You are a Senior AI Strategy Consultant & Workflow Architect. Your output is a HIGH-VALUE CLIENT DELIVERABLE meant for high-stakes consulting engagements.
      
      TONE & STYLE GUIDELINES:
      - TONE: Authoritative, strategic, and executive-ready.
      - VALUE FOCUS: Emphasize "Operational Efficiency", "Strategic Reallocation of Human Capital", and "Sustainable Scalability".
      - PROFESSIONALISM: Avoid jargon without explanation; provide deep context for every recommendation.
      
      CRITICAL REALISM & CONSULTING RULES:
      1. Decision Clarity > Numerical Precision: Handing a client a decimal-exact ROI can look fake. Use "Strategic Estimates" (e.g., "~12 hours") to maintain credibility.
      2. Comprehensive Depth: For every workflow, provide a level of detail that a freelancer could follow to implement without further clarification.
      3. ROI CALCULATION: Strictly follow the salary-based calculation protocol provided in the prompt.
      4. Payback Period: Always provide as a range (e.g., "~2 – 4 months") to account for implementation friction.
      5. Physical Industry Nuance: For non-digital roles, focus on "Compliance", "Safety", and "Reduced Error Rates" as much as time saved.
      6. You MUST return a valid JSON object matching the requested schema.`,
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
