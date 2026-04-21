import React from 'react';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  ClipboardCheck, 
  ChevronRight, 
  Download, 
  Plus, 
  Trash2, 
  History, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layout,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Workflow,
  Target,
  BarChart3,
  Rocket,
  Sun,
  Moon,
  Database,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, getUserReports, deleteUserReport } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateAutomationReport, type AutomationReport, type WorkflowIdea } from './services/gemini';
import { jsPDF } from 'jspdf';
import { domToPng } from 'modern-screenshot';

// --- Components ---

const WorkflowDiagram = ({ diagram }: { diagram: any }) => {
  if (!diagram || !diagram.nodes) return null;
  
  return (
    <div className="bg-neutral-50 py-6 sm:py-8 px-4 sm:px-8 rounded-2xl border border-neutral-200 my-4 overflow-x-auto shadow-sm">
      <div className="flex items-center justify-start gap-4 sm:gap-6 min-w-max">
        {diagram.nodes.map((node: any, idx: number) => (
          <React.Fragment key={node.id}>
            <div className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center gap-2 min-w-[120px] sm:min-w-[140px] shadow-sm ${
              node.type === 'trigger' ? 'bg-blue-50 border-blue-200 text-blue-900' :
              node.type === 'ai' ? 'bg-purple-50 border-purple-200 text-purple-900' :
              node.type === 'action' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              'bg-white border-neutral-200 text-neutral-900'
            }`}>
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest opacity-60">{node.type}</span>
              <span className="text-xs sm:text-sm font-bold text-center leading-tight">{node.label}</span>
            </div>
            {idx < diagram.nodes.length - 1 && (
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-300 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const ROICalculator = ({ 
  analysis, 
  currency, 
  salary, 
  hourlyRate, 
  calcMode 
}: { 
  analysis: any, 
  currency: string,
  salary: number,
  hourlyRate: number,
  calcMode: 'monthly' | 'hourly'
}) => {
  const [showMath, setShowMath] = React.useState(false);
  
  if (!analysis) return null;

  const hasSalary = calcMode === 'monthly' ? salary > 0 : hourlyRate > 0;
  const displayHourlyRate = calcMode === 'monthly' ? (salary / 160) : hourlyRate;

  return (
    <div className="bg-emerald-50/50 p-6 sm:p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">ROI Value Blueprint</h3>
        </div>
        <button 
          onClick={() => setShowMath(!showMath)}
          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-black uppercase tracking-widest transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-emerald-100 shadow-sm self-start sm:self-auto"
        >
          {showMath ? "Hide Calculation details" : "How this was calculated"}
          <ChevronRight className={`w-3 h-3 transition-transform ${showMath ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {hasSalary ? (
          [
            { label: 'Monthly Value Saved', val: `${currency}${Math.round(analysis.hoursSavedPerMonth * displayHourlyRate).toLocaleString()}` },
            { label: 'Hours Recovered', val: `${analysis.hoursSavedPerMonth}h` },
            { label: 'Payback Period', val: analysis.paybackPeriod },
            { label: 'Labor Savings', val: `${currency}${Math.round(analysis.hoursSavedPerMonth * displayHourlyRate).toLocaleString()}` }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm transition-transform hover:scale-[1.02]">
              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tighter italic uppercase">{stat.val}</p>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">Hours Recovered</p>
              <p className="text-2xl font-black text-emerald-700 tracking-tighter italic uppercase">{analysis.hoursSavedPerMonth}h</p>
            </div>
            <div className="col-span-2 sm:col-span-3 flex items-center p-6 bg-white/50 border border-dashed border-emerald-200 rounded-3xl">
              <p className="text-xs font-bold text-emerald-800 italic uppercase tracking-tight">
                Enter your {calcMode} {calcMode === 'monthly' ? 'salary' : 'rate'} to calculate financial impact & payback period
              </p>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showMath && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 p-6 sm:p-8 bg-white rounded-3xl text-sm font-medium text-emerald-900 border border-emerald-100 shadow-inner">
              <div className="space-y-8">
                <div>
                  <h5 className="text-[10px] font-black uppercase text-neutral-400 mb-6 tracking-[0.2em]">Total Hours Saved Breakdown</h5>
                  <div className="grid gap-3">
                    {analysis.breakdown?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <span className="font-bold text-neutral-700 uppercase tracking-tight text-[11px] italic truncate mr-4">{item.taskName}</span>
                        <span className="shrink-0 font-black text-emerald-600 text-xs">{item.hoursSaved}h savings/mo</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-neutral-100 grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-neutral-400 mb-4 tracking-[0.2em]">Hourly Rate Logic</h5>
                    <p className="text-xs text-neutral-600 leading-relaxed italic">
                      {calcMode === 'monthly' 
                        ? `Hourly Rate = ${currency}${salary.toLocaleString()} Monthly ÷ 160 working hours = ${currency}${Math.round(displayHourlyRate).toLocaleString()}/hour`
                        : `Current Hourly Rate = ${currency}${hourlyRate}/hour`
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase text-neutral-400 mb-4 tracking-[0.2em]">Calculation Formula</h5>
                    <div className="bg-neutral-900 rounded-2xl p-6 text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
                      <p className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-widest">Monthly Value Savings</p>
                      <p className="font-mono text-xs mb-4 text-emerald-100/60 leading-relaxed uppercase tracking-widest">Hours Saved × Hourly Rate</p>
                      <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                        <span className="text-lg font-black italic uppercase tracking-tighter">
                          {analysis.hoursSavedPerMonth}h × {currency}{Math.round(displayHourlyRate).toLocaleString()} = {currency}{Math.round(analysis.hoursSavedPerMonth * displayHourlyRate).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-4">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-900 leading-relaxed uppercase italic">
                    This represents the theoretical value of time recovered from manual tasks, allowing for higher-impact strategic work. Not direct cash earnings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [fetchingHistory, setFetchingHistory] = React.useState(false);
  const [history, setHistory] = React.useState<any[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [report, setReport] = React.useState<AutomationReport | null>(null);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    jobRole: '',
    industry: '',
    workDescription: '',
    toolsUsed: '',
    mostTimeConsumingTask: '',
    currencySymbol: '₦',
    monthlySalary: 0,
    hourlyRate: 0,
    calcMode: 'monthly' as 'monthly' | 'hourly'
  });

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        fetchHistory(user.uid);
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    setFetchingHistory(true);
    try {
      const reports = await getUserReports(uid);
      setHistory(reports);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleDeleteHistory = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this blueprint? This action cannot be undone.")) return;
    
    try {
      const success = await deleteUserReport(reportId);
      if (success && user) {
        fetchHistory(user.uid);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
      setError("Failed to delete the report. Please try again.");
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setReport(null);
    setActiveTab('overview');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const generatedReport = await generateAutomationReport(formData);
      setReport(generatedReport);
      
      if (user) {
        await addDoc(collection(db, 'AI_Workflow_Architect'), {
          ...generatedReport,
          uid: user.uid,
          formData,
          timestamp: serverTimestamp()
        });
        fetchHistory(user.uid);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while generating the report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('full-report');
    if (!reportElement) return;

    try {
      const dataUrl = await domToPng(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AI_Implementation_Blueprint_${formData.jobRole.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  const handleDownloadTXT = () => {
    if (!report) return;

    const content = `
=========================================
      AI IMPLEMENTATION BLUEPRINT
=========================================
Client Role: ${formData.jobRole}
Industry:    ${formData.industry}
Date:        ${new Date().toLocaleDateString()}

-----------------------------------------
1. EXECUTIVE SUMMARY
-----------------------------------------
This blueprint outlines a strategic transition from manual overhead to an AI-augmented operational model. By implementing the recommended workflows, you can expect fundamental shifts in your daily productivity.

KEY OBJECTIVE: ${report.startHere.workflowName.toUpperCase()}
PRIMARY BENEFIT: Recovering ${report.roiAnalysis.hoursSavedPerMonth} hours monthly while generating ${formData.currencySymbol}${report.roiAnalysis.totalMonthlyValue?.toLocaleString()} in projected value.

Strategic Insight:
"${report.personalizationNote}"

-----------------------------------------
2. ROLE & TASK AUDIT
-----------------------------------------
CURRENT FOCUS AREAS:
${report.jobAnalysis.dailyTasks.map(t => `- ${t}`).join('\n')}

ESTABLISHED TOOL STACK:
${report.jobAnalysis.toolsUsed.join(', ')}

-----------------------------------------
3. AUTOMATION OPPORTUNITIES
-----------------------------------------
IMMEDIATE AUTOMATION (High Potential):
${report.jobAnalysis.tasksAutomated.map(t => `- ${t}`).join('\n')}

AI-AUGMENTED CO-PILOTING:
${report.jobAnalysis.tasksAI.map(t => `- ${t}`).join('\n')}

-----------------------------------------
4. ROI VALUE BLUEPRINT
-----------------------------------------
PROJECTED SAVINGS:
- Monthly Value Generated: ${formData.currencySymbol}${report.roiAnalysis.totalMonthlyValue?.toLocaleString()}
- Hours Recovered:         ${report.roiAnalysis.hoursSavedPerMonth}h
- Estimated Payback:       ${report.roiAnalysis.paybackPeriod}

AUDIT LOGIC:
${report.roiAnalysis.calculationLogic}

-----------------------------------------
5. STRATEGIC PRIORITIES
-----------------------------------------
${report.priorityScores.slice(0, 3).map((p, i) => `[Workflow ${i + 1}: ${p.score}] ${p.task}\nRationale: ${p.reason}`).join('\n\n')}

-----------------------------------------
6. RECOMMENDED AUTOMATION PLANS
-----------------------------------------
PHASE 1 STARTING POINT:
${report.startHere.workflowName}
Rationale: ${report.startHere.whyFirstStep}

DETAILED BLUEPRINTS:
${report.workflowIdeas.slice(0, 3).map((w, i) => `
--- BLUEPRINT ${i + 1}: ${w.name.toUpperCase()} (${w.skillLevel}) ---
Goal: ${w.description}

Setup Steps:
${w.implementationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Human Oversight Required:
${w.humanReviewPoints.map(p => `- ${p}`).join('\n')}

Common Errors & Fixes:
IF: ${w.failureHandling.commonErrors[0]}
THEN: ${w.failureHandling.correctionSteps}
`).join('\n')}

-----------------------------------------
7. SAFEGUARDS & CONSIDERATIONS
-----------------------------------------
SYSTEM LIMITS:
${report.limitations.map(l => `- ${l}`).join('\n')}

STRATEGIC SAFEGUARDS:
- Human Advantage: ${report.aiRiskInsight.whyNotReplace}
- Inaction Risk:   ${report.aiRiskInsight.doingNothingRisk}

-----------------------------------------
8. ESTIMATED SETUP COSTS
-----------------------------------------
REQUIRED TOOLING:
${report.estimatedMonthlyCost.items.map(i => `- ${i.toolName} (${i.costTier}): ${i.costRange}`).join('\n')}

FINANCIAL SUMMARY:
${report.costVsValue.gains}

-----------------------------------------
9. ROADMAP TO AUTONOMY
-----------------------------------------
STAGE 1 (Week 1): ${report.roadmap.stage1}
STAGE 2 (Week 2): ${report.roadmap.stage2}
STAGE 3 (Scaling): ${report.roadmap.stage3}

-----------------------------------------
10. HOW TO PROCEED (CONSULTANT HANDOFF)
-----------------------------------------
This document serves as a technical handoff for your IT team or an automation consultant.

Option A: Self-Implementation
Follow the detailed Blueprints in Section 6.

Option B: Professional Setup
Engage a specialized consultant to build, integrate, and test these systems for a 100% turnkey experience.

Next Action: Schedule a technical audit of your current API access (Zapier/Make/OpenAI) before launching Phase 1.

=========================================
© 2026 AI Architect Workflow Systems
=========================================
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consultation_Report_${formData.jobRole.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase leading-tight">AI Architect</h1>
              <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase opacity-80">Workflow Consulting</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setReport(null);
                    }}
                    className={`p-2 rounded-full transition-colors relative flex items-center gap-2 px-4 ${showHistory ? 'bg-emerald-600 text-white' : 'hover:bg-neutral-100 text-neutral-500'}`}
                    title="View History"
                  >
                    <History className="w-5 h-5" />
                    <span className="text-sm font-bold hidden sm:block">History</span>
                    {history.length > 0 && !showHistory && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-neutral-950"></span>
                    )}
                  </button>
                  <div className="h-4 w-[1px] bg-neutral-200 hidden sm:block"></div>
                  <button 
                    onClick={() => {
                      setReport(null);
                      setShowHistory(false);
                    }}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Blueprint
                  </button>
                  <button onClick={handleLogout} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
                    <LogOut className="w-5 h-5" />
                  </button>
                  <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border-2 border-emerald-500/20" />
                </div>
              ) : (
              <button 
                onClick={handleLogin}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showHistory ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight uppercase italic">Consultation History</h2>
                <p className="text-neutral-500 font-medium">Access your previously generated high-performance blueprints.</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="px-6 py-2 bg-neutral-200 rounded-full text-sm font-bold hover:bg-neutral-300 transition-all"
              >
                Back to Tool
              </button>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.length > 0 ? (
                history.map((rep, idx) => (
                  <div key={idx} className="relative group">
                    <button 
                      onClick={() => {
                        setReport(rep);
                        setShowHistory(false);
                      }}
                      className="p-8 bg-white border border-neutral-200 rounded-[2rem] text-left hover:border-emerald-500 transition-all group shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col h-full w-full"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-100">
                          {rep.timestamp?.toDate ? rep.timestamp.toDate().toLocaleDateString() : 'Draft'}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="font-black text-xl leading-tight group-hover:text-emerald-600 transition-colors uppercase italic truncate w-full">
                          {rep.formData?.jobRole || rep.jobAnalysis?.dailyTasks?.[0] || "Consulting Report"}
                        </p>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest opacity-60">
                          {rep.formData?.industry || "Enterprise Workflow"}
                        </p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 underline decoration-emerald-500/30">View Analysis</span>
                        <ArrowRight className="w-4 h-4 text-emerald-500 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteHistory(rep.id, e)}
                      className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white z-10"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center space-y-4">
                  <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                    <History className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-neutral-500 font-medium italic">No blueprints found. Generate your first one to start your history.</p>
                </div>
              )}
            </div>
          </div>
        ) : !report ? (
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-12 space-y-6">
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter leading-tight max-w-4xl">
                  Analyze Your Workflow. <br />
                  <span className="text-emerald-600">Automate Your Success.</span>
                </h2>
                <p className="text-xl text-neutral-500 max-w-2xl leading-relaxed">
                  The first AI-driven consulting tool that maps your specific job role into high-performance automation blueprints.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-neutral-200 shadow-xl space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide opacity-70">Job Role / Title</label>
                      <input 
                        required
                        placeholder="e.g. Senior Product Designer"
                        className="w-full bg-white text-neutral-900 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        value={formData.jobRole}
                        onChange={(e) => setFormData({...formData, jobRole: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide opacity-70">Industry</label>
                      <input 
                        required
                        placeholder="e.g. FinTech / SaaS"
                        className="w-full bg-white text-neutral-900 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        value={formData.industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide opacity-70">Tools Currently Used (Optional)</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. Google Sheets, HubSpot CRM, WhatsApp, Excel"
                        className="w-full bg-white text-neutral-900 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                        value={formData.toolsUsed}
                        onChange={(e) => setFormData({...formData, toolsUsed: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide opacity-70">Calculation Mode</label>
                      <div className="flex bg-neutral-100 p-1 rounded-xl gap-1">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, calcMode: 'monthly'})}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.calcMode === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >Monthly Salary</button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, calcMode: 'hourly'})}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.calcMode === 'hourly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >Hourly Rate</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 uppercase opacity-50">Currency</label>
                        <select 
                          className="w-full bg-white text-neutral-900 border border-neutral-200 p-3 rounded-lg text-sm"
                          value={formData.currencySymbol}
                          onChange={(e) => setFormData({...formData, currencySymbol: e.target.value})}
                        >
                          <option value="₦">₦ Naira (NGN)</option>
                          <option value="$">$ USD</option>
                          <option value="£">£ GBP</option>
                          <option value="€">€ EUR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 uppercase opacity-50">Value</label>
                        <input 
                          type="number"
                          className="w-full bg-white text-neutral-900 border border-neutral-200 p-3 rounded-lg text-sm"
                          value={formData.calcMode === 'monthly' ? formData.monthlySalary : formData.hourlyRate}
                          onChange={(e) => setFormData({
                            ...formData, 
                            [formData.calcMode === 'monthly' ? 'monthlySalary' : 'hourlyRate']: Number(e.target.value)
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase tracking-wide opacity-70">Describe your daily work</label>
                      <textarea 
                        rows={3}
                        placeholder="I spend 3 hours daily on emails, 2 hours on data entry..."
                        className="w-full bg-white text-neutral-900 border border-neutral-200 p-4 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                        value={formData.workDescription}
                        onChange={(e) => setFormData({...formData, workDescription: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-6">
                  <button 
                    disabled={loading}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Analyzing Workflow...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-6 h-6" /> Generate Blueprint
                      </>
                    )}
                  </button>
                  <p className="text-xs text-neutral-500 max-w-sm">
                    Our AI will analyze your inputs and generate a custom multi-tab report including ROI math and technical setup steps.
                  </p>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setReport(null)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <ArrowRight className="w-6 h-6 rotate-180" />
                </button>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">AI Implementation Blueprint</h2>
                  <p className="text-sm font-medium text-emerald-600 uppercase tracking-widest">{formData.jobRole} • {formData.industry}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleDownloadTXT}
                  className="flex items-center gap-2 bg-neutral-200 text-neutral-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-all border border-neutral-300"
                >
                  <Search className="w-4 h-4" /> View as Text (.txt)
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Blueprint (PDF)
                </button>
              </div>
            </div>
            
            <div className="flex bg-neutral-100 p-1.5 rounded-2xl gap-2 w-full max-w-2xl mx-auto mb-12 shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'implementation', label: 'Implementation' },
                { id: 'operations', label: 'Operations' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] sm:min-w-0 py-3 px-6 text-[10px] sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-white text-emerald-600 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Report Content - Vertical */}
            <div id="full-report" className="space-y-16 pb-32 max-w-5xl mx-auto">
              {activeTab === 'overview' && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* 1. Executive Summary */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">01</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Executive Summary</h3>
                    </div>
                    
                    <div className="p-8 bg-neutral-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5"><Brain className="w-64 h-64" /></div>
                      <div className="relative z-10 space-y-6">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Consultant's Strategic Brief</p>
                        <h4 className="text-3xl font-black leading-tight max-w-3xl italic">
                          "Implementing the ${report.startHere.workflowName} will recover ~{report.roiAnalysis.hoursSavedPerMonth} hours monthly, allowing you to reallocate human capital to high-value strategic growth."
                        </h4>
                        {report.personalizationNote && (
                          <p className="text-lg text-emerald-50/70 font-medium leading-relaxed max-w-2xl border-l-2 border-emerald-500 pl-6 py-2">
                            {report.personalizationNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* 2. Role & Task Audit */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-black">02</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Role Audit & Task Audit</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <Clock className="w-6 h-6 text-blue-500" />
                          <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-400">Primary Responsibilities</h4>
                        </div>
                        <ul className="space-y-3">
                          {report.jobAnalysis.dailyTasks.map((task, i) => (
                            <li key={i} className="text-sm text-neutral-600 flex gap-2">
                              <span className="text-blue-500 font-black">•</span> {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm font-medium">
                        <div className="flex items-center gap-3 mb-6">
                          <Layout className="w-6 h-6 text-purple-500" />
                          <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-400">Current Tool stack</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.jobAnalysis.toolsUsed.map((tool, i) => (
                            <span key={i} className="px-4 py-2 bg-neutral-50 rounded-lg text-xs font-bold border border-neutral-100">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-white rounded-3xl border border-neutral-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <Zap className="w-6 h-6 text-emerald-500" />
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-neutral-400">Automation Opportunities</h4>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-12">
                        <div className="space-y-4">
                          <p className="text-sm font-black uppercase tracking-tighter text-emerald-600">Immediate Automation</p>
                          <ul className="space-y-2">
                            {report.jobAnalysis.tasksAutomated.map((t, i) => <li key={i} className="text-xs font-medium text-neutral-600">• {t}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm font-black uppercase tracking-tighter text-purple-600">AI-Augmented Co-Piloting</p>
                          <ul className="space-y-2">
                            {report.jobAnalysis.tasksAI.map((t, i) => <li key={i} className="text-xs font-medium text-neutral-600">• {t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. ROI Value Blueprint */}
                  <section className="space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">03</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">ROI Value Blueprint</h3>
                    </div>
                    
                    <ROICalculator 
                      analysis={report.roiAnalysis} 
                      currency={formData.currencySymbol} 
                      salary={formData.monthlySalary}
                      hourlyRate={formData.hourlyRate}
                      calcMode={formData.calcMode}
                    />
                    
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                      <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                        <strong>Next Action:</strong> Based on the payback period of {report.roiAnalysis.paybackPeriod}, we recommend initiating implementation immediately to capture this quarter's efficiency gains.
                      </p>
                    </div>
                  </section>

                  {/* 4. Strategic Implementation Priority */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-black">04</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Strategic Implementation Priority</h3>
                    </div>
                    <div className="space-y-4">
                      {report.priorityScores.slice(0, 3).map((item, i) => (
                        <div key={i} className="p-6 bg-white rounded-2xl border border-neutral-200 hover:border-emerald-500 transition-all flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-sm">
                          <div className="shrink-0 w-32 h-16 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-100 px-4">
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Workflow {i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg tracking-tight mb-1">{item.task}</p>
                            <p className="text-sm text-neutral-500 leading-relaxed font-medium">{item.reason}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 bg-neutral-50 p-2 rounded-lg">
                            {[1,2,3,4,5].map(s => <div key={s} className={`w-2 h-2 rounded-full ${s <= (item.score.match(/⭐/g)?.length || 0) ? 'bg-emerald-500' : 'bg-neutral-200'}`}></div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 5. Recommended First Step */}
                  <div className="bg-emerald-600 text-white rounded-[2rem] p-10 mb-16 shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><Rocket className="w-48 h-48 rotate-12" /></div>
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black uppercase mb-4 tracking-[0.2em] text-emerald-200">Starting Point: Phase 1 Launch</h4>
                      <p className="text-2xl italic mb-8 leading-snug max-w-3xl font-black">"{report.startHere.whyFirstStep}"</p>
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-white text-emerald-600 rounded-2xl font-black uppercase text-sm shadow-xl">
                        <Plus className="w-5 h-5" /> {report.startHere.workflowName}
                      </div>
                    </div>
                  </div>

                  {/* 9. How to Proceed (Consultant Handoff) */}
                  <section className="pt-24">
                    <div className="bg-emerald-600 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-emerald-500/40">
                      <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Target className="w-64 h-64" /></div>
                      <div className="relative z-10 space-y-12">
                          <div className="space-y-6">
                            <h3 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase underline decoration-white/20">How to Proceed</h3>
                            <p className="text-xl text-emerald-50 font-medium max-w-2xl leading-relaxed">
                              This blueprint is designed for immediate handoff. You have two implementation tracks to choose from:
                            </p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-10 bg-white/10 border border-white/20 rounded-3xl hover:bg-white/20 transition-all group">
                              <h4 className="text-2xl font-black uppercase italic mb-4">Training</h4>
                              <p className="text-sm text-emerald-50/80 leading-relaxed font-medium mb-8">Learn how to build and manage this AI automation system yourself, even if you're starting from scratch. This is ideal if you want full control and long-term skill development.</p>
                              <button className="w-full py-4 bg-white text-emerald-600 font-black uppercase italic rounded-xl hover:bg-emerald-50 transition-all shadow-xl">
                                Get Started
                              </button>
                            </div>

                            <div className="p-10 bg-white text-neutral-900 rounded-3xl shadow-2xl relative">
                              <div className="absolute -top-4 right-8 px-4 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full shadow-lg">Professional Grade</div>
                              <h4 className="text-2xl font-black uppercase italic mb-4 text-emerald-600">Professional Setup</h4>
                              <p className="text-sm text-neutral-600 leading-relaxed font-medium mb-8">If you prefer speed and accuracy, we will handle the full setup, testing, and deployment of your AI workflow system for you.</p>
                              <button className="w-full py-4 bg-emerald-600 text-white font-black uppercase italic rounded-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">
                                Get Professional Setup
                              </button>
                            </div>
                          </div>

                          <div className="pt-12 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><ClipboardCheck className="w-6 h-6" /></div>
                              <p className="text-xs uppercase font-black tracking-widest">Client Hand-off Document • v2.1</p>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-white/60">© 2026 AI Architect Workflow Systems</p>
                          </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'implementation' && (
                <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full overflow-x-hidden">
                  {/* 5. Recommended Automation Plans */}
                  <section className="space-y-8 sm:space-y-12">
                    <div className="flex items-center gap-4 mb-4 px-4 sm:px-0">
                      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-black">05</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Recommended Automation Plans</h3>
                    </div>

                    <div className="space-y-16 sm:space-y-24">
                      {report.workflowIdeas.slice(0, 3).map((workflow, idx) => (
                        <div key={idx} className="space-y-8 sm:space-y-12 px-4 sm:px-0">
                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-8">
                            <div className="space-y-3">
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Blueprint {idx + 1}</span>
                              <h4 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic break-words">{workflow.name}</h4>
                              <p className="text-base sm:text-lg text-neutral-500 font-medium leading-relaxed max-w-full break-words overflow-hidden">{workflow.description}</p>
                            </div>
                            <span className="px-5 py-2 bg-neutral-100 border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest opacity-80 shrink-0 w-fit">{workflow.skillLevel} Implementation</span>
                          </div>

                          <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 w-full">
                            <div className="lg:col-span-12 space-y-4 w-full overflow-hidden">
                              <div className="flex items-center gap-3">
                                <Workflow className="w-5 h-5 text-emerald-500" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Architectural Logic Diagram</h5>
                              </div>
                              <div className="w-full">
                                <WorkflowDiagram diagram={workflow.diagram} />
                              </div>
                            </div>

                            <div className="lg:col-span-7 space-y-8 w-full overflow-hidden">
                              <div className="bg-white p-5 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm w-full">
                                <h5 className="text-[10px] font-black uppercase text-neutral-400 mb-8 tracking-widest">Step-by-Step Implementation</h5>
                                <div className="space-y-6">
                                  {workflow.implementationSteps.map((step, i) => (
                                    <div key={i} className="flex gap-4 sm:gap-5 group">
                                      <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-md">{i+1}</span>
                                      <p className="text-sm text-neutral-700 leading-relaxed font-medium pt-1 break-words overflow-wrap-anywhere whitespace-normal">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-neutral-900 text-white p-5 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden w-full">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><MessageSquare className="w-32 h-32" /></div>
                                <div className="relative z-10 w-full overflow-hidden">
                                  <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-6 px-3 py-1 bg-white/10 inline-block rounded-full">AI Prompt Engineering</h5>
                                  <p className="font-mono text-[11px] sm:text-xs text-neutral-300 leading-relaxed mb-6 bg-white/5 p-4 sm:p-6 rounded-xl border border-white/10 uppercase tracking-tight break-all overflow-wrap-anywhere whitespace-normal">
                                    {workflow.promptLogic.examplePrompt}
                                  </p>
                                  <p className="text-[10px] font-bold text-neutral-500 uppercase break-words">Next Action: Copy this prompt and test in ChatGPT or Gemini with your data.</p>
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-5 space-y-8 w-full overflow-hidden">
                              <div className="bg-neutral-50 p-5 sm:p-8 rounded-3xl border border-neutral-200 w-full overflow-hidden">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-8">Technical Requirements</h5>
                                <div className="space-y-8">
                                  <div className="w-full">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 mb-2">Primary Trigger Logic</p>
                                    <p className="text-sm font-black uppercase italic tracking-tight text-emerald-600 break-words">{workflow.architecture.trigger}</p>
                                  </div>
                                  <div className="w-full">
                                    <p className="text-[10px] font-bold uppercase text-neutral-400 mb-4">Required Data Extraction</p>
                                    <div className="flex flex-wrap gap-2 max-w-full overflow-hidden overflow-wrap-anywhere">
                                      {workflow.dataStructure.requiredFields.map((f, i) => <span key={i} className="text-[10px] px-3 py-1.5 bg-white rounded-lg border border-neutral-200 font-bold text-neutral-600 uppercase tracking-tight break-all">{f}</span>)}
                                    </div>
                                  </div>
                                  <div className="pt-8 border-t border-neutral-200 w-full">
                                    <p className="text-[10px] font-black uppercase text-orange-600 mb-6 tracking-widest">Zapier Quick-Connect</p>
                                    <div className="grid gap-3 sm:gap-4 w-full">
                                      {workflow.zapierTemplates?.map((zap, i) => (
                                        <a key={i} href={zap.url} target="_blank" rel="noopener noreferrer" className="p-4 bg-white border border-neutral-200 rounded-xl flex items-center justify-between group hover:border-orange-500 transition-all shadow-sm w-full overflow-hidden">
                                          <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-[10px] font-black">Z</div>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-neutral-700 truncate">{zap.name}</span>
                                          </div>
                                          <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform shrink-0" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-5 sm:p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl w-full">
                                <h5 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-6">Consultant Safety Check</h5>
                                <ul className="space-y-3 overflow-hidden">
                                    {workflow.humanReviewPoints.map((p, i) => (
                                      <li key={i} className="text-[11px] text-amber-900 font-medium flex gap-3 break-words overflow-wrap-anywhere overflow-hidden">
                                        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" /> <span className="break-words">{p}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>

                              <div className="p-5 sm:p-8 bg-red-500/5 border border-red-500/10 rounded-3xl w-full">
                                <h5 className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-6">Failure & Exception Handling</h5>
                                <div className="space-y-4 overflow-hidden">
                                  <p className="text-[11px] font-bold text-red-900 uppercase">Common Error Pattern:</p>
                                  <p className="text-[11px] text-neutral-600 font-medium leading-relaxed italic break-words overflow-wrap-anywhere">"{workflow.failureHandling.commonErrors[0] || 'Tool connection timeout'}"</p>
                                  <p className="text-[11px] font-bold text-red-900 uppercase mt-4">Correction Protocol:</p>
                                  <p className="text-[11px] text-neutral-600 font-medium leading-relaxed break-words overflow-wrap-anywhere">{workflow.failureHandling.correctionSteps}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'operations' && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* 6. Safeguards & Considerations */}
                  <section className="space-y-12">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-black">06</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Safeguards & Considerations</h3>
                    </div>
                    
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="p-6 sm:p-8 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-neutral-200 shadow-sm space-y-6">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-neutral-400">Implementation Risks</h4>
                          </div>
                          <div className="space-y-4">
                            {report.limitations.map((lim, i) => (
                              <div key={i} className="p-4 sm:p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                                <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">!</span>
                                <p className="text-xs text-neutral-600 font-medium leading-relaxed">{lim}</p>
                              </div>
                            ))}
                          </div>
                      </div>

                      <div className="p-6 sm:p-8 bg-emerald-900 text-white rounded-[2rem] sm:rounded-[2.5rem] shadow-xl space-y-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-12 opacity-5"><Target className="w-48 h-48" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-6">Strategic AI Governance</p>
                            <p className="text-lg sm:text-xl italic font-bold leading-tight mb-8">"{report.aiRiskInsight.whyNotReplace}"</p>
                            <p className="text-xs text-emerald-100/60 font-medium leading-relaxed pt-8 border-t border-white/10">
                              <strong>Consultant's Warning:</strong> {report.aiRiskInsight.doingNothingRisk}
                            </p>
                          </div>
                      </div>
                    </div>
                  </section>

                  {/* 7. Estimated Setup Costs */}
                  <section className="space-y-12">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-black">07</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Estimated Setup Costs</h3>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {report.estimatedMonthlyCost.items.map((item, idx) => (
                        <div key={idx} className="p-6 sm:p-8 bg-white rounded-3xl border border-neutral-200 flex flex-col justify-between group hover:border-emerald-500 transition-all shadow-sm">
                          <div>
                            <p className="text-[9px] text-neutral-400 uppercase font-black tracking-widest mb-4 italic">{item.costTier}</p>
                            <p className="font-black text-lg sm:text-xl mb-2 tracking-tighter uppercase italic">{item.toolName}</p>
                            <p className="text-xs text-neutral-500 font-medium leading-relaxed">{item.reason}</p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-emerald-600 mt-8 font-mono">{item.costRange}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-emerald-50 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12">
                      <div className="flex-1 space-y-6 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Cost-Value Analysis</p>
                        <h4 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight italic uppercase">{report.costVsValue.gains}</h4>
                        <p className="text-base sm:text-lg text-emerald-800/80 font-medium leading-relaxed">"{report.costVsValue.comparison}"</p>
                      </div>
                      <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40">
                        <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12" />
                      </div>
                    </div>
                  </section>

                  {/* 8. Roadmap to Autonomy */}
                  <section className="space-y-12">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">08</div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Roadmap to Autonomy</h3>
                    </div>
                    <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-6 sm:before:left-8 before:w-[1px] before:bg-neutral-200">
                      {[
                        { s: report.roadmap.stage1, l: 'Stage 1: Efficiency Baseline (Days 1-7)', c: 'bg-emerald-500', tc: 'text-emerald-500' },
                        { s: report.roadmap.stage2, l: 'Stage 2: Technical Scale (Days 8-14)', c: 'bg-blue-500', tc: 'text-blue-500' },
                        { s: report.roadmap.stage3, l: 'Stage 3: Full Autonomy (Post-14 Days)', c: 'bg-purple-500', tc: 'text-purple-500' }
                      ].map((stage, i) => (
                        <div key={i} className="relative pl-12 sm:pl-20 group">
                          <div className={`absolute left-3 sm:left-5 top-0 w-6 h-6 rounded-full border-4 border-white ${stage.c} z-10 transition-transform group-hover:scale-125`}></div>
                          <div className="p-6 sm:p-8 bg-white rounded-2xl sm:rounded-[2rem] border border-neutral-200 shadow-lg shadow-neutral-100 group-hover:border-emerald-500 transition-all">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${stage.tc} block mb-4`}>{stage.l}</span>
                            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-bold italic">"{stage.s}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed bottom-8 right-8 max-w-md bg-red-50 border border-red-200 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">System Error</p>
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <Plus className="w-4 h-4 rotate-45" />
          </button>
        </div>
      )}

      <footer className="py-12 border-t border-neutral-200 text-center">
        <div className="flex items-center justify-center gap-2 opacity-50 mb-4 scale-75">
          <Brain className="w-6 h-6" />
          <span className="font-black tracking-tighter uppercase">AI Architect</span>
        </div>
        <p className="text-xs text-neutral-400">
          © 2026 AI Architect Workflow Systems. High-Performance Digital Consulting.
        </p>
      </footer>
    </div>
  );
}
