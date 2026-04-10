import React from "react";
import { 
  Zap, 
  Brain, 
  Hand, 
  Shield, 
  Wrench, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  LayoutDashboard, 
  Workflow, 
  BookOpen, 
  Lightbulb,
  ExternalLink,
  Download,
  TrendingUp,
  AlertTriangle,
  Map,
  ListChecks,
  Clock,
  DollarSign,
  AlertCircle,
  Target,
  Flag,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateAutomationReport, type AutomationReport } from "./services/gemini";
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, type User } from "./firebase";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<AutomationReport | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [formData, setFormData] = React.useState({
    jobRole: "",
    industry: "",
    toolsUsed: "",
    mostTimeConsumingTask: "",
  });

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("The sign-in window was closed before completion. Please try again and complete the sign-in process.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Sign-in request was cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("The sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setError("Failed to sign in with Google. Please ensure your Firebase configuration is correct and try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setReport(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please sign in to generate and save your report.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateAutomationReport(formData);
      setReport(result);

      // Save to Firestore
      const path = 'AI_Workflow_Architect';
      try {
        await addDoc(collection(db, path), {
          role: formData.jobRole,
          industry: formData.industry,
          tools: formData.toolsUsed || null,
          repetitive_tasks: formData.mostTimeConsumingTask || null,
          generated_report: result,
          timestamp: serverTimestamp(),
          uid: user.uid,
          user_email: user.email,
          user_name: user.displayName || null,
          user_id: user.uid
        });
        setSuccessMessage(`Report saved successfully for ${user.email}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, path);
      }
    } catch (err) {
      console.error("Error generating or saving report:", err);
      if (err instanceof Error && err.message.startsWith('{')) {
        throw err; // Re-throw for ErrorBoundary
      }
      setError("Failed to generate your automation plan. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const content = `
AI WORKFLOW ARCHITECT REPORT
==========================
Role: ${formData.jobRole}
Industry: ${formData.industry}
${formData.mostTimeConsumingTask ? `Most Time-Consuming Task: ${formData.mostTimeConsumingTask}` : ""}

${report.personalizationNote ? `NOTE: ${report.personalizationNote}\n` : ""}

1. JOB ANALYSIS
---------------
Daily Tasks:
${report.jobAnalysis.dailyTasks.map(t => `- ${t}`).join('\n')}

Common Tools:
${report.jobAnalysis.toolsUsed.join(', ')}

2. TASK BREAKDOWN
-----------------
Automatable Tasks:
${report.jobAnalysis.tasksAutomated.map(t => `- ${t}`).join('\n')}

AI-Enhanced Tasks:
${report.jobAnalysis.tasksAI.map(t => `- ${t}`).join('\n')}

Manual Tasks:
${report.jobAnalysis.tasksManual.map(t => `- ${t}`).join('\n')}

3. AUTOMATION PRIORITY SCORE
---------------------------
${report.priorityScores.map(p => `${p.score} - ${p.task}\nReason: ${p.reason}`).join('\n\n')}

4. 🚀 START HERE
---------------
Recommended Workflow: ${report.startHere.workflowName}
Why this is the best first step: ${report.startHere.whyFirstStep}
Immediate result: ${report.startHere.immediateResult}

5. TIME SAVED + BUSINESS IMPACT
-------------------------------
Hours Saved Per Week: ${report.impactEstimate.hoursSavedPerWeek}
Business Impact: ${report.impactEstimate.businessImpact}

6. WORKFLOWS
------------
${report.workflowIdeas.map((wf, i) => `
Workflow ${i + 1}: ${wf.name}
Description: ${wf.description}
Skill Level: ${wf.skillLevel}
Setup Time: ${wf.setupTime}
AI Role: ${wf.aiRole}
Success Indicator: ${wf.successIndicator}

Simple Flow:
${wf.simpleFlow.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}

Tools Required:
${wf.toolsRequired.map(t => `- ${t.name} (${t.type})${t.alternative ? ` (Alt: ${t.alternative})` : ""}`).join('\n')}

Beginner Steps:
${wf.beginnerSteps.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}

${wf.advancedSteps ? `Advanced Steps:\n${wf.advancedSteps.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}` : ""}

Limitations:
${wf.limitations.map(l => `- ${l}`).join('\n')}
`).join('\n')}

7. AUTOMATION SYSTEM MAP
------------------------
${report.systemMap.join(' → ')}

8. AI RISK & COMPETITIVE INSIGHT
--------------------------------
Why AI cannot fully replace this role:
${report.aiRiskInsight.whyNotReplace}

Where AI gives competitors an advantage:
${report.aiRiskInsight.competitorAdvantage}

What happens if you do nothing:
${report.aiRiskInsight.doingNothingRisk}

9. NEXT STEP ROADMAP
--------------------
Stage 1: ${report.roadmap.stage1}
Stage 2: ${report.roadmap.stage2}
Stage 3: ${report.roadmap.stage3}

10. IMPORTANT LIMITATIONS
------------------------
${report.limitations.map(l => `- ${l}`).join('\n')}

11. ESTIMATED MONTHLY COST
--------------------------
${report.estimatedMonthlyCost.items.map(item => `— ${item.toolName}: ${item.cost} (reason: ${item.reason})`).join('\n')}
TOTAL ESTIMATE: ${report.estimatedMonthlyCost.totalEstimate}

12. 💰 COST VS VALUE
--------------------
Gains: ${report.costVsValue.gains}
Comparison: ${report.costVsValue.comparison}

🚀 WANT THIS SET UP FOR YOU?
---------------------------
This report is your blueprint, but you don't have to build it alone.

Option 1: Training
Learn how to build and manage these AI workflows yourself with our expert-led training.

Option 2: Done-For-You
Skip the learning curve. We'll set up, test, and launch your entire automation system for you.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Automation_Report_${formData.jobRole.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                AI Workflow<span className="text-emerald-600">Architect</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-500 mr-4 border-r border-neutral-200 pr-6">
                <a href="#analysis" className="hover:text-neutral-900 transition-colors">Analysis</a>
                <a href="#workflows" className="hover:text-neutral-900 transition-colors">Workflows</a>
                <a href="#instructions" className="hover:text-neutral-900 transition-colors">Instructions</a>
              </nav>
              {isAuthReady && (
                user ? (
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-neutral-200" referrerPolicy="no-referrer" />
                    <button onClick={handleLogout} className="hidden sm:block text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-red-600 transition-colors">Sign Out</button>
                  </div>
                ) : (
                  <button onClick={handleLogin} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
                    Sign In
                  </button>
                )
              )}
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-3">
                  Architect Your AI Workflow
                </h2>
                <p className="text-neutral-500 leading-relaxed">
                  Enter your role and industry. Our AI will analyze your tasks and build custom AI-powered Zapier workflows for you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Job Role</label>
                  <input
                    required
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={handleInputChange}
                    placeholder="e.g. Admin Officer"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Industry</label>
                  <input
                    required
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g. School"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Tools Used (Optional)</label>
                  <input
                    name="toolsUsed"
                    value={formData.toolsUsed}
                    onChange={handleInputChange}
                    placeholder="e.g. Gmail, Excel, Slack"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50"
                  />
                  <p className="text-[10px] text-neutral-400">Leave blank to let AI suggest common tools.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Most Time-Consuming Task (Optional)</label>
                  <input
                    name="mostTimeConsumingTask"
                    value={formData.mostTimeConsumingTask}
                    onChange={handleInputChange}
                    placeholder="e.g. Responding to customer emails"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50"
                  />
                  <p className="text-[10px] text-neutral-400">Helps AI prioritize what to automate first.</p>
                </div>

                {!user ? (
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/20"
                  >
                    <Shield className="w-5 h-5" />
                    Sign In to Generate Plan
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Role...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Automation Plan
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-red-900 font-bold mb-2">Something went wrong</h3>
                  <p className="text-red-700 text-sm mb-4">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 underline underline-offset-4"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-emerald-900 font-bold mb-2">Success</h3>
                  <p className="text-emerald-700 text-sm mb-4">{successMessage}</p>
                  <button 
                    onClick={() => setSuccessMessage(null)}
                    className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {!report && !loading && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50"
                >
                  <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                    <LayoutDashboard className="w-12 h-12 text-neutral-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Architect?</h3>
                  <p className="text-neutral-500 max-w-xs">
                    Enter your role and industry to see your personalized automation analysis and workflows.
                  </p>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-12 space-y-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-t-emerald-600 rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Architecting your future...</h3>
                    <p className="text-neutral-500 text-sm">Generating tasks, triggers, and AI opportunities</p>
                  </div>
                </motion.div>
              )}

              {report && !loading && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  {report.personalizationNote && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex gap-3 items-start">
                      <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-800 italic">{report.personalizationNote}</p>
                    </div>
                  )}

                  {/* Job Analysis */}
                  <section id="analysis" className="scroll-mt-24">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <Brain className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">1. Job Analysis</h3>
                      </div>
                      <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Daily Tasks</h4>
                        <ul className="space-y-2">
                          {report.jobAnalysis.dailyTasks.map((task, i) => (
                            <li key={i} className="text-sm text-neutral-600 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-neutral-300" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Common Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.jobAnalysis.toolsUsed.map((tool, i) => (
                            <span key={i} className="px-2.5 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Task Breakdown */}
                  <section id="breakdown" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ListChecks className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">2. Task Breakdown</h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600 font-semibold text-sm uppercase tracking-wider">
                          <Zap className="w-4 h-4" />
                          Automatable
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksAutomated.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold text-sm uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          AI-Enhanced
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksAI.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              </div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-orange-600 font-semibold text-sm uppercase tracking-wider">
                          <Hand className="w-4 h-4" />
                          Manual
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksManual.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                              <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                              </div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* Priority Score */}
                  <section id="priority" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Target className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">3. 🚀 Automation Priority Score</h3>
                    </div>
                    <div className="grid gap-4">
                      {report.priorityScores.map((p, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 mb-1">{p.task}</h4>
                            <p className="text-sm text-neutral-500">{p.reason}</p>
                          </div>
                          <div className="px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100 text-sm font-bold text-neutral-700 whitespace-nowrap">
                            {p.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Start Here */}
                  <section id="start-here" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">4. 🚀 START HERE</h3>
                    </div>
                    <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Recommended First Step</div>
                          <h4 className="text-2xl font-black text-neutral-900 mb-4">{report.startHere.workflowName}</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Why this is the best first step</div>
                              <p className="text-sm text-neutral-600 leading-relaxed">{report.startHere.whyFirstStep}</p>
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Immediate Result</div>
                              <p className="text-sm text-neutral-600 leading-relaxed font-medium text-emerald-700">{report.startHere.immediateResult}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm shrink-0 w-full md:w-64">
                          <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Quick Win</span>
                          </div>
                          <p className="text-xs text-neutral-500">This workflow is designed to give you the fastest return on investment with the least technical friction.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Impact Estimate */}
                  <section id="impact" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">5. ⏱ Time Saved + 💰 Business Impact</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-xl shadow-emerald-600/20 flex flex-col items-center text-center">
                        <Clock className="w-10 h-10 mb-4 opacity-80" />
                        <div className="text-4xl font-black mb-2">{report.impactEstimate.hoursSavedPerWeek}</div>
                        <div className="text-emerald-100 font-medium uppercase tracking-widest text-xs">Hours Saved Per Week</div>
                      </div>
                      <div className="bg-neutral-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-center text-center">
                        <DollarSign className="w-10 h-10 mb-4 text-emerald-400" />
                        <div className="text-lg font-bold mb-2 leading-tight">{report.impactEstimate.businessImpact}</div>
                        <div className="text-neutral-400 font-medium uppercase tracking-widest text-xs">Potential Business Impact</div>
                      </div>
                    </div>
                  </section>

                  {/* Workflows */}
                  <section id="workflows" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Workflow className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">6. Workflows</h3>
                    </div>

                    <div className="space-y-8">
                      {report.workflowIdeas.map((wf, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                          <div className="bg-neutral-50 px-8 py-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xl font-bold text-neutral-900">{wf.name}</h4>
                              <p className="text-sm text-neutral-500">{wf.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                wf.skillLevel === "Beginner" ? "bg-emerald-100 text-emerald-700" :
                                wf.skillLevel === "Intermediate" ? "bg-blue-100 text-blue-700" :
                                "bg-purple-100 text-purple-700"
                              }`}>
                                {wf.skillLevel}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-neutral-400">
                                <Clock className="w-3 h-3" />
                                {wf.setupTime}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-8 grid lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <Workflow className="w-3 h-3" /> Simple Flow
                                </h5>
                                <div className="space-y-3">
                                  {wf.simpleFlow.map((step, j) => (
                                    <div key={j} className="flex gap-3 items-center">
                                      <div className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {j + 1}
                                      </div>
                                      <p className="text-sm text-neutral-600 font-medium">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <Wrench className="w-3 h-3" /> Tools Required
                                </h5>
                                <div className="grid gap-3">
                                  {wf.toolsRequired.map((tool, j) => (
                                    <div key={j} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-700">{tool.name}</span>
                                        {tool.alternative && <span className="text-[10px] text-neutral-400">Alt: {tool.alternative}</span>}
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tool.type === "Free" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        {tool.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" /> AI Role
                                </h5>
                                <p className="text-sm text-neutral-600 leading-relaxed bg-blue-50 p-4 rounded-2xl border border-blue-100 italic">
                                  "{wf.aiRole}"
                                </p>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3" /> Success Indicator
                                </h5>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                  {wf.successIndicator}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <ListChecks className="w-3 h-3" /> Beginner Setup Steps
                                </h5>
                                <div className="space-y-4">
                                  {wf.beginnerSteps.map((step, j) => (
                                    <div key={j} className="flex gap-4">
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                        {j + 1}
                                      </div>
                                      <p className="text-sm text-neutral-600 leading-relaxed">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {wf.advancedSteps && (
                                <div>
                                  <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Advanced Setup (Optional)
                                  </h5>
                                  <div className="space-y-4">
                                    {wf.advancedSteps.map((step, j) => (
                                      <div key={j} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                          {j + 1}
                                        </div>
                                        <p className="text-sm text-neutral-500 leading-relaxed">{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {wf.limitations.length > 0 && (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Limitations
                                  </h5>
                                  <ul className="space-y-1">
                                    {wf.limitations.map((lim, j) => (
                                      <li key={j} className="text-xs text-amber-800 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-amber-400" />
                                        {lim}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* System Map */}
                  <section id="map" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-neutral-100 p-2 rounded-lg">
                        <Map className="w-6 h-6 text-neutral-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">7. 🧠 Automation System Map</h3>
                    </div>
                    <div className="bg-neutral-900 p-12 rounded-3xl">
                      <div className="flex flex-col gap-2 text-white font-bold tracking-tight max-w-3xl mx-auto">
                        {report.systemMap.map((step, i) => (
                          <React.Fragment key={i}>
                            <div className="flex items-center gap-6 group">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors shrink-0 font-black">
                                {i + 1}
                              </div>
                              <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex-1 text-left">
                                {step.trim()}
                              </div>
                            </div>
                            {i < report.systemMap.length - 1 && (
                              <div className="flex justify-center py-2">
                                <ArrowDown className="w-6 h-6 text-neutral-700" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* AI Risk Insight */}
                  <section id="risk" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">8. 🛡️ AI Risk & Competitive Insight</h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Why AI Can't Replace You</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">{report.aiRiskInsight.whyNotReplace}</p>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Competitor Advantage</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed">{report.aiRiskInsight.competitorAdvantage}</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-4">Risk of Doing Nothing</h4>
                        <p className="text-sm text-red-900 leading-relaxed font-medium">{report.aiRiskInsight.doingNothingRisk}</p>
                      </div>
                    </div>
                  </section>

                  {/* Roadmap */}
                  <section id="roadmap" className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Flag className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">9. 🚀 Next Step Roadmap</h3>
                    </div>
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-100 hidden sm:block" />
                      <div className="space-y-8">
                        {[
                          { stage: "Stage 1: Implementation", content: report.roadmap.stage1, color: "bg-emerald-600" },
                          { stage: "Stage 2: Next Level", content: report.roadmap.stage2, color: "bg-blue-600" },
                          { stage: "Stage 3: Scaling", content: report.roadmap.stage3, color: "bg-purple-600" }
                        ].map((step, i) => (
                          <div key={i} className="relative flex flex-col sm:flex-row gap-8 items-start">
                            <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg z-10 mx-auto sm:mx-0`}>
                              {i + 1}
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex-1">
                              <h4 className="font-black text-neutral-900 mb-2">{step.stage}</h4>
                              <p className="text-sm text-neutral-600 leading-relaxed">{step.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Limitations */}
                  <section id="limitations" className="scroll-mt-24 pb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-neutral-100 p-2 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-neutral-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">10. ⚠️ Important Limitations</h3>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
                      <ul className="grid sm:grid-cols-2 gap-4">
                        {report.limitations.map((lim, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-neutral-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            {lim}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {/* Estimated Monthly Cost */}
                  <section id="costs" className="scroll-mt-24 pb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">11. 💰 Estimated Monthly Cost</h3>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm mb-8">
                      <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Breakdown</div>
                        <div className="space-y-3">
                          {report.estimatedMonthlyCost.items.map((item, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                              <div>
                                <div className="font-bold text-neutral-900">— {item.toolName}</div>
                                <div className="text-xs text-neutral-500 italic">reason: {item.reason}</div>
                              </div>
                              <div className="font-mono font-bold text-emerald-600">{item.cost}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between">
                          <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Total Estimate</div>
                          <div className="text-2xl font-black text-neutral-900">{report.estimatedMonthlyCost.totalEstimate}</div>
                        </div>
                      </div>
                    </div>

                    {/* Cost vs Value */}
                    <div className="bg-neutral-900 text-white p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 uppercase tracking-widest text-xs">
                          <Sparkles className="w-4 h-4" />
                          <span>12. 💰 Cost vs Value</span>
                        </div>
                        <h4 className="text-2xl font-black mb-6 leading-tight">The Investment Case</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <div className="text-emerald-400 font-bold text-sm">What You Gain</div>
                            <p className="text-neutral-300 text-sm leading-relaxed">{report.costVsValue.gains}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="text-emerald-400 font-bold text-sm">The ROI Comparison</div>
                            <p className="text-neutral-300 text-sm leading-relaxed font-medium italic">"{report.costVsValue.comparison}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* CTA Section */}
                  <section className="mt-12 pb-24">
                    <div className="bg-emerald-600 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden text-center">
                      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                      </div>
                      
                      <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                          <Target className="w-4 h-4" />
                          <span>Next Steps</span>
                        </div>
                        
                        <h3 className="text-4xl font-black mb-6 leading-tight">🚀 WANT THIS SET UP FOR YOU?</h3>
                        <p className="text-emerald-50 text-lg mb-12 leading-relaxed">
                          This report is your blueprint, but you don't have to build it alone. 
                          Whether you want to master these tools yourself or have us handle the technical heavy lifting, we're here to help.
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="bg-white/10 p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-bold mb-3 text-white">Option 1: Training</h4>
                            <p className="text-emerald-100 text-sm mb-6">Learn how to build and manage these AI workflows yourself with our expert-led training.</p>
                            <button className="w-full py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                              Learn More
                            </button>
                          </div>
                          
                          <div className="bg-white/10 p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all group">
                            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                              <Zap className="w-6 h-6" />
                            </div>
                            <h4 className="text-xl font-bold mb-3 text-white">Option 2: Done-For-You</h4>
                            <p className="text-emerald-100 text-sm mb-6">Skip the learning curve. We'll set up, test, and launch your entire automation system for you.</p>
                            <button className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-colors border border-emerald-400">
                              Get Started
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-neutral-900 p-1 rounded">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">AI Workflow Architect</span>
          </div>
          <p className="text-neutral-400 text-sm">
            Empowering professionals to work smarter, not harder. Built with Google AI.
          </p>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
