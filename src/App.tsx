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
  ArrowDown,
  Moon,
  Sun,
  History,
  Plus,
  Mail,
  FileText,
  Calculator,
  Share2,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { domToCanvas } from "modern-screenshot";
import { generateAutomationReport, type AutomationReport } from "./services/gemini";
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, getUserReports, type User } from "./firebase";
import ErrorBoundary from "./components/ErrorBoundary";

function WorkflowDiagram({ diagram }: { diagram: any }) {
  if (!diagram || !diagram.nodes) return null;
  
  return (
    <div className="relative p-8 bg-neutral-900 rounded-3xl overflow-hidden min-h-[300px] flex items-center justify-center">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative flex flex-wrap justify-center gap-8 items-center">
        {diagram.nodes.map((node: any, i: number) => (
          <React.Fragment key={`node-${node.id || 'id'}-${i}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`px-4 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg ${
                node.type === 'trigger' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                node.type === 'ai' ? 'bg-purple-500/10 border-purple-500 text-purple-400' :
                node.type === 'action' ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
                'bg-neutral-500/10 border-neutral-500 text-neutral-400'
              }`}
            >
              {node.type === 'trigger' && <Zap className="w-3 h-3" />}
              {node.type === 'ai' && <Brain className="w-3 h-3" />}
              {node.type === 'action' && <Wrench className="w-3 h-3" />}
              {node.label}
            </motion.div>
            {i < diagram.nodes.length - 1 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 24 }}
                transition={{ delay: i * 0.1 + 0.05 }}
                className="h-[2px] bg-neutral-700"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ROICalculator({ roi, hourlyRate, setHourlyRate, currencySymbol, setCurrencySymbol }: { 
  roi: any, 
  hourlyRate: number, 
  setHourlyRate: (val: number) => void,
  currencySymbol: string,
  setCurrencySymbol: (val: string) => void
}) {
  const monthlyValue = (roi.hoursSavedPerMonth * hourlyRate) + (roi.estimatedMonthlySavings || 0);
  
  return (
    <div className="bg-white dark:bg-neutral-800 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
          <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold tracking-tight dark:text-white">Interactive ROI Calculator</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Currency</label>
              <input 
                type="text" 
                value={currencySymbol} 
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-center font-bold dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Hourly Rate</label>
              <input 
                type="number" 
                value={hourlyRate} 
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-600 text-xl font-black text-black dark:text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
              />
            </div>
          </div>
          <p className="text-xs text-neutral-500 italic">Adjust these to see your personalized savings in your local currency.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Monthly Value</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{currencySymbol}{monthlyValue.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Yearly Value</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{currencySymbol}{(monthlyValue * 12).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<AutomationReport | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [view, setView] = React.useState<"create" | "history">("create");
  const [history, setHistory] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [hourlyRate, setHourlyRate] = React.useState(50);
  const [currencySymbol, setCurrencySymbol] = React.useState("$");
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
      if (currentUser) {
        fetchHistory(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    setLoadingHistory(true);
    try {
      const reports = await getUserReports(uid);
      setHistory(reports || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

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
      const result = await generateAutomationReport({ ...formData, currencySymbol });
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

  const downloadPDF = async () => {
    if (!report) return;
    const element = document.getElementById('report-content');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await domToCanvas(element, {
        scale: 2,
        backgroundColor: darkMode ? "#171717" : "#ffffff",
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AI_Workflow_Report_${formData.jobRole.replace(/\s+/g, '_')}.pdf`);
      setSuccessMessage("PDF Report downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF. Please try the text download instead.");
    } finally {
      setLoading(false);
    }
  };

  const emailReport = () => {
    if (!report || !user) return;
    
    const subject = encodeURIComponent(`AI Workflow Blueprint: ${formData.jobRole}`);
    const body = encodeURIComponent(`
Hi, here is your AI Workflow Blueprint for ${formData.jobRole}.

HOURS SAVED PER MONTH: ${report.roiAnalysis.hoursSavedPerMonth}
ESTIMATED YEARLY SAVINGS: ${currencySymbol}${report.roiAnalysis.estimatedYearlySavings}

View the full report in the AI Workflow Architect app.
    `.trim());
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    setSuccessMessage("Opening your email client...");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const downloadText = () => {
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
Daily Tasks: ${report.jobAnalysis.dailyTasks.join(', ')}
Tools Used: ${report.jobAnalysis.toolsUsed.join(', ')}

2. TASK BREAKDOWN
-----------------
Automatable: ${report.jobAnalysis.tasksAutomated.join(', ')}
AI-Enhanced: ${report.jobAnalysis.tasksAI.join(', ')}
Manual: ${report.jobAnalysis.tasksManual.join(', ')}

3. ROI ANALYSIS
---------------
Estimated Monthly Savings: ${currencySymbol}${report.roiAnalysis.estimatedMonthlySavings}
Estimated Yearly Savings: ${currencySymbol}${report.roiAnalysis.estimatedYearlySavings}
Hours Saved Per Month: ${report.roiAnalysis.hoursSavedPerMonth}
Payback Period: ${report.roiAnalysis.paybackPeriodMonths} months

4. AUTOMATION PRIORITY SCORE
---------------------------
${report.priorityScores?.map(p => `${p.score} - ${p.task}\nReason: ${p.reason}`).join('\n\n')}

5. 🚀 START HERE
---------------
Recommended Workflow: ${report.startHere.workflowName}
Why this is the best first step: ${report.startHere.whyFirstStep}
Immediate result: ${report.startHere.immediateResult}

6. WORKFLOWS
------------
${report.workflowIdeas?.map((wf, i) => `
Workflow ${i + 1}: ${wf.name}
Description: ${wf.description}
Skill Level: ${wf.skillLevel}
Setup Time: ${wf.setupTime}
AI Role: ${wf.aiRole}
Success Indicator: ${wf.successIndicator}

Simple Flow:
${wf.simpleFlow?.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}

Tools Required:
${wf.toolsRequired?.map(t => `- ${t.name} (${t.type})${t.alternative ? ` (Alt: ${t.alternative})` : ""}`).join('\n')}

Zapier Templates:
${wf.zapierTemplates?.map(t => `- ${t.name}: ${t.url}`).join('\n')}

Beginner Steps:
${wf.beginnerSteps?.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}

${wf.advancedSteps ? `Advanced Steps:\n${wf.advancedSteps?.map((s, j) => `   ${j + 1}. ${s}`).join('\n')}` : ""}

Limitations:
${wf.limitations?.map(l => `- ${l}`).join('\n')}
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
${report.limitations?.map(l => `- ${l}`).join('\n')}

11. ESTIMATED MONTHLY COST
--------------------------
${report.estimatedMonthlyCost.items?.map(item => `— ${item.toolName}: ${item.cost} (reason: ${item.reason})`).join('\n')}
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
      <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-neutral-950 text-neutral-100 dark' : 'bg-neutral-50 text-neutral-900'}`}>
        {/* Header */}
        <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${darkMode ? 'bg-neutral-900/80 border-neutral-800 backdrop-blur-md' : 'bg-white/80 border-neutral-200 backdrop-blur-md'}`}>
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
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              {isAuthReady && user && (
                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setView("create")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "create" ? 'bg-white dark:bg-neutral-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                  >
                    <Plus className="w-3 h-3 inline mr-1" /> New
                  </button>
                  <button 
                    onClick={() => setView("history")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === "history" ? 'bg-white dark:bg-neutral-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
                  >
                    <History className="w-3 h-3 inline mr-1" /> History
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 ml-2">
                {isAuthReady && (
                  user ? (
                    <div className="flex items-center gap-3">
                      <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700" referrerPolicy="no-referrer" />
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
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {view === "history" ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight dark:text-white">Your Report History</h2>
                  <p className="text-neutral-500 dark:text-neutral-400">Access all your previously generated AI workflow blueprints.</p>
                </div>
                <button 
                  onClick={() => setView("create")}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus className="w-5 h-5" /> Create New Report
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                  <p className="text-neutral-500 font-medium">Loading your history...</p>
                </div>
              ) : history.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history?.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => {
                        setReport(item.generated_report);
                        setFormData({
                          jobRole: item.role,
                          industry: item.industry,
                          toolsUsed: item.tools || "",
                          mostTimeConsumingTask: item.repetitive_tasks || ""
                        });
                        setView("create");
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          {item.timestamp?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold mb-1 dark:text-white group-hover:text-emerald-600 transition-colors">{item.role}</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{item.industry}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        View Report <ArrowRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 p-12 rounded-[40px] border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                  <div className="bg-neutral-100 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 dark:text-white">No reports found</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-6">You haven't generated any reports yet. Start by creating your first blueprint!</p>
                  <button 
                    onClick={() => setView("create")}
                    className="px-8 py-3 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-2xl font-bold hover:opacity-90 transition-all"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-12 gap-12"
            >
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

              <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Job Role</label>
                  <input
                    required
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={handleInputChange}
                    placeholder="e.g. Admin Officer"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Tools Used (Optional)</label>
                  <input
                    name="toolsUsed"
                    value={formData.toolsUsed}
                    onChange={handleInputChange}
                    placeholder="e.g. Gmail, Excel, Slack"
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white"
                  />
                  <p className="text-[10px] text-neutral-400">Helps AI prioritize what to automate first.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Preferred Currency Symbol</label>
                  <div className="flex gap-4">
                    <input
                      name="currencySymbol"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="$"
                      maxLength={5}
                      className="w-24 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white text-center font-bold"
                    />
                    <div className="flex-1 flex items-center text-[10px] text-neutral-400 leading-tight">
                      Enter your local currency symbol (e.g. ₦, £, €). AI will use this for all financial estimates.
                    </div>
                  </div>
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
                  key="error"
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
                  key="success"
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
                  key="empty-state"
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
                  key="loading-state"
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
                  key="report-content-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                >
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mb-8">
                    <button 
                      onClick={downloadPDF}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <FileText className="w-4 h-4" /> Download PDF
                    </button>
                    <button 
                      onClick={downloadText}
                      className="flex items-center gap-2 px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-2xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Text
                    </button>
                    <button 
                      onClick={emailReport}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      <Mail className="w-4 h-4" /> Email Report
                    </button>
                  </div>

                  <div id="report-content" className="space-y-12">
                    {/* ROI Calculator */}
                    <ROICalculator 
                    roi={report.roiAnalysis} 
                    hourlyRate={hourlyRate} 
                    setHourlyRate={setHourlyRate} 
                    currencySymbol={currencySymbol}
                    setCurrencySymbol={setCurrencySymbol}
                  />
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
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                          <Brain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight dark:text-white">1. Job Analysis</h3>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Daily Tasks</h4>
                        <ul className="space-y-2">
                          {report.jobAnalysis.dailyTasks?.map((task, i) => (
                            <li key={`daily-task-${i}`} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Common Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.jobAnalysis.toolsUsed?.map((tool, i) => (
                            <span key={`tool-used-${i}`} className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
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
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                          <Zap className="w-4 h-4" />
                          Automatable
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksAutomated?.map((task, i) => (
                            <li key={`auto-task-${i}`} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          AI-Enhanced
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksAI?.map((task, i) => (
                            <li key={`ai-task-${i}`} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                              </div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-400 font-semibold text-sm uppercase tracking-wider">
                          <Hand className="w-4 h-4" />
                          Manual
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.tasksManual?.map((task, i) => (
                            <li key={`manual-task-${i}`} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                              <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mt-0.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400" />
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
                      {report.priorityScores?.map((p, i) => (
                        <div key={`priority-${i}`} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 dark:text-white mb-1">{p.task}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">{p.reason}</p>
                          </div>
                          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
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
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border-2 border-emerald-500 shadow-xl">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                          <div className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Recommended First Step</div>
                          <h4 className="text-3xl font-black text-black dark:text-white mb-4">{report.startHere.workflowName}</h4>
                          <div className="space-y-6">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 italic">Why this is the best first step</div>
                              <p className="text-base text-black dark:text-white leading-relaxed font-medium">{report.startHere.whyFirstStep}</p>
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 italic">Immediate Result</div>
                              <p className="text-lg leading-relaxed font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">{report.startHere.immediateResult}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm shrink-0 w-full md:w-64">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Quick Win</span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">This workflow is designed to give you the fastest return on investment with the least technical friction.</p>
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
                      {report.workflowIdeas?.map((wf, i) => (
                        <div key={`workflow-${i}`} className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
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
                              {/* Visual Diagram */}
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Workflow Visualization</p>
                                <WorkflowDiagram diagram={wf.diagram} />
                              </div>

                              {/* Zapier Templates */}
                              <div className="space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Zapier Templates</p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                  {wf.zapierTemplates?.map((template, idx) => (
                                    <a 
                                      key={`zap-${i}-${idx}`}
                                      href={template.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <Zap className="w-4 h-4 text-emerald-600" />
                                        <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                                      </div>
                                      <p className="text-sm font-bold dark:text-white mb-1">{template.name}</p>
                                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{template.description}</p>
                                    </a>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <Workflow className="w-3 h-3" /> Simple Flow
                                </h5>
                                <div className="space-y-3">
                                  {wf.simpleFlow?.map((step, j) => (
                                    <div key={`flow-${i}-${j}`} className="flex gap-3 items-center">
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
                                  {wf.toolsRequired?.map((tool, j) => (
                                    <div key={`tool-${i}-${j}`} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
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
                                <p className="text-sm text-black dark:text-white leading-relaxed bg-neutral-50 dark:bg-neutral-800 p-5 rounded-2xl border-l-4 border-blue-500 shadow-sm italic font-medium">
                                  "{wf.aiRole}"
                                </p>
                              </div>

                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-3 h-3" /> Success Indicator
                                </h5>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
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
                                  {wf.beginnerSteps?.map((step, j) => (
                                    <div key={`begin-${i}-${j}`} className="flex gap-4">
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                        {j + 1}
                                      </div>
                                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{step}</p>
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
                                    {wf.advancedSteps?.map((step, j) => (
                                      <div key={`adv-${i}-${j}`} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                          {j + 1}
                                        </div>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{step}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {wf.limitations.length > 0 && (
                                <div className="p-5 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-l-4 border-amber-500 shadow-sm">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Limitations
                                  </h5>
                                  <ul className="space-y-2">
                                    {wf.limitations?.map((lim, j) => (
                                      <li key={`wf-lim-${i}-${j}`} className="text-xs text-black dark:text-white flex items-center gap-2 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
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
                        {report.systemMap?.map((step, i) => (
                          <React.Fragment key={`system-step-${i}`}>
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
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-300 dark:border-neutral-700 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Why AI Can't Replace You</h4>
                        <p className="text-sm text-black dark:text-white leading-relaxed font-medium">{report.aiRiskInsight.whyNotReplace}</p>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-300 dark:border-neutral-700 shadow-sm">
                        <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Competitor Advantage</h4>
                        <p className="text-sm text-black dark:text-white leading-relaxed font-medium">{report.aiRiskInsight.competitorAdvantage}</p>
                      </div>
                      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border-2 border-red-500 shadow-xl">
                        <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 mb-4">Risk of Doing Nothing</h4>
                        <p className="text-base text-black dark:text-white leading-relaxed font-black">{report.aiRiskInsight.doingNothingRisk}</p>
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
                          <div key={`roadmap-step-${i}`} className="relative flex flex-col sm:flex-row gap-8 items-start">
                            <div className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center text-xl font-black shrink-0 shadow-lg z-10 mx-auto sm:mx-0`}>
                              {i + 1}
                            </div>
                            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex-1">
                              <h4 className="font-black text-neutral-900 dark:text-white mb-2">{step.stage}</h4>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{step.content}</p>
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
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                      <ul className="grid sm:grid-cols-2 gap-4">
                        {report.limitations?.map((lim, i) => (
                          <li key={`final-lim-${i}`} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
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
                        <Coins className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight">11. 💰 Estimated Monthly Cost</h3>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm mb-8">
                      <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Breakdown</div>
                        <div className="space-y-3">
                          {report.estimatedMonthlyCost.items?.map((item, i) => (
                            <div key={`cost-item-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                              <div>
                                <div className="font-bold text-neutral-900 dark:text-white">— {item.toolName}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">reason: {item.reason}</div>
                              </div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.cost}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                          <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Total Estimate</div>
                          <div className="text-2xl font-black text-neutral-900 dark:text-white">{report.estimatedMonthlyCost.totalEstimate}</div>
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
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
