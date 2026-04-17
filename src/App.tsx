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
  ShieldAlert,
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

function ROICalculator({ 
  roi, 
  hourlyRate, 
  setHourlyRate, 
  currencySymbol, 
  setCurrencySymbol,
  calcMode,
  setCalcMode,
  monthlySalary,
  setMonthlySalary
}: { 
  roi: any, 
  hourlyRate: number, 
  setHourlyRate: (val: number) => void,
  currencySymbol: string,
  setCurrencySymbol: (val: string) => void,
  calcMode: 'hourly' | 'monthly',
  setCalcMode: (mode: 'hourly' | 'monthly') => void,
  monthlySalary: number,
  setMonthlySalary: (val: number) => void
}) {
  const [showMath, setShowMath] = React.useState(false);
  const effectiveHourlyRate = calcMode === 'hourly' ? hourlyRate : (monthlySalary / 160);
  const laborValue = roi.hoursSavedPerMonth * effectiveHourlyRate;
  const directValue = roi.directExpensesSavings || 0;
  const monthlyValue = laborValue + directValue;
  const timeRecoveredPercent = Math.min(100, Math.round((roi.hoursSavedPerMonth / 160) * 100));
  const extraDaysPerMonth = (roi.hoursSavedPerMonth / 8).toFixed(1);

  const commonCurrencies = [
    { label: "Naira", symbol: "₦" },
    { label: "Dollar", symbol: "$" },
    { label: "Pound", symbol: "£" },
    { label: "Euro", symbol: "€" }
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2rem] border-2 border-emerald-500/20 dark:border-emerald-500/10 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <TrendingUp className="w-48 h-48" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight dark:text-white">ROI Value Blueprint</h3>
              <p className="text-sm text-neutral-500">Calculate the actual financial impact of your time.</p>
            </div>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
            <button 
              onClick={() => setCalcMode('hourly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${calcMode === 'hourly' ? 'bg-white dark:bg-neutral-800 text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Hourly Rate
            </button>
            <button 
              onClick={() => setCalcMode('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${calcMode === 'monthly' ? 'bg-white dark:bg-neutral-800 text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              Monthly Salary
            </button>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 block text-center lg:text-left">1. Select Your Currency</label>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              {commonCurrencies.map((c) => (
                <button
                  key={c.symbol}
                  onClick={() => setCurrencySymbol(c.symbol)}
                  className={`px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 group ${
                    currencySymbol === c.symbol 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-md' 
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="text-2xl font-black">{c.symbol}</span>
                  <span className="font-bold">{c.label}</span>
                </button>
              ))}
              <div className="relative group">
                <input 
                  type="text" 
                  value={commonCurrencies.some(c => c.symbol === currencySymbol) ? "" : currencySymbol} 
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="Other"
                  className="w-24 px-4 py-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-transparent text-center font-bold dark:text-white outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                2. Enter Your {calcMode === 'hourly' ? 'Hourly Rate' : 'Monthly Salary'}
              </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-neutral-300">{currencySymbol}</div>
                <input 
                  type="number" 
                  value={calcMode === 'hourly' ? hourlyRate : monthlySalary} 
                  onChange={(e) => calcMode === 'hourly' ? setHourlyRate(Number(e.target.value)) : setMonthlySalary(Number(e.target.value))}
                  className="w-full pl-14 pr-6 py-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 text-4xl font-black text-black dark:text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>
              <p className="text-xs text-neutral-500 italic">
                {calcMode === 'hourly' 
                  ? "Based on what you charge or earn per hour of work." 
                  : "Based on your total fixed monthly take-home pay."}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="p-6 bg-emerald-500 rounded-[2rem] text-white shadow-lg shadow-emerald-500/30 flex flex-col justify-center relative group">
                <button 
                  onClick={() => setShowMath(!showMath)}
                  className="absolute top-4 right-4 text-[9px] uppercase font-black bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition-all"
                >
                  {showMath ? "Hide Math" : "Show Math"}
                </button>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-2">Estimated Monthly Value</p>
                <p className="text-4xl font-black mb-1">~{currencySymbol}{Math.round(monthlyValue).toLocaleString()}</p>
                
                {showMath && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-3 pt-2 border-t border-white/20 flex flex-col gap-1"
                  >
                    <div className="flex justify-between text-[10px] items-center">
                      <span className="opacity-70">Labor Savings:</span>
                      <span className="font-bold">~{roi.hoursSavedPerMonth}h × {currencySymbol}{Math.round(effectiveHourlyRate)}/h</span>
                    </div>
                    {directValue > 0 && (
                      <div className="flex justify-between text-[10px] items-center">
                        <span className="opacity-70">Tools/Expense:</span>
                        <span className="font-bold">{currencySymbol}{directValue.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[9px] mt-1 p-2 bg-white/10 rounded italic opacity-90 border border-white/5">
                      <span>{roi.calculationLogic}</span>
                    </div>
                    <div className="text-[8px] uppercase tracking-tighter opacity-50 mt-1">Values are strategic estimates based on typical labor productivity.</div>
                  </motion.div>
                )}

                <div className="flex items-center gap-2 text-[10px] font-bold bg-white/20 w-fit px-2 py-1 rounded-full uppercase">
                  <ArrowRight className="w-3 h-3" />
                  {currencySymbol}{Math.round(monthlyValue * 12).toLocaleString()} / Year
                </div>
              </div>

              <div className="grid grid-rows-3 gap-2">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                  <Clock className="absolute -bottom-2 -right-2 w-12 h-12 opacity-5 rotate-12 group-hover:scale-110 transition-transform" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Time Reclaimed</p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white">~{timeRecoveredPercent}%</p>
                  <p className="text-[9px] text-neutral-500 leading-tight">monthly recovery</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                  <TrendingUp className="absolute -bottom-2 -right-2 w-12 h-12 opacity-10 -rotate-12 group-hover:scale-110 transition-transform" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">Payback Period</p>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{roi.paybackPeriod}</p>
                </div>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
                  <Target className="absolute -bottom-2 -right-2 w-12 h-12 opacity-5 -rotate-12 group-hover:scale-110 transition-transform" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Productivity Bonus</p>
                  <p className="text-xl font-black text-neutral-900 dark:text-white">~{extraDaysPerMonth} Days</p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-12">
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-700">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-500" /> 
                Estimated Time Savings Breakdown
              </h4>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                {roi.breakdown?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate">{item.taskName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{item.hoursSaved}h</span>
                      <span className="text-[10px] text-neutral-400">/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lightbulb className="w-12 h-12 text-emerald-600" />
          </div>
          <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            What does this mean?
          </h4>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
            By automating these tasks, you aren't just saving time—you're <strong>buying back your life.</strong> 
            {calcMode === 'monthly' 
              ? ` Since you earn a fixed salary, you're essentially getting one week's worth of free time every month to focus on promotion-earning projects or your side business.` 
              : ` Every hour automated is money earned back into your pocket. This system pays for itself in value almost immediately.`}
          </p>
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-neutral-100 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group hover:rotate-12 transition-transform">
            <Zap className="w-7 h-7 text-white fill-current" />
          </div>
          <div>
            <h4 className="text-lg font-black dark:text-white">Ready to reclaim your time?</h4>
            <p className="text-xs text-neutral-500 font-medium tracking-wide">Take the first step toward working 100% smarter.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            const element = document.getElementById('next-steps');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-10 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-black rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 group active:scale-95"
        >
          Implement Now
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
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
  const [monthlySalary, setMonthlySalary] = React.useState(250000);
  const [calcMode, setCalcMode] = React.useState<'hourly' | 'monthly'>('monthly');
  const [currencySymbol, setCurrencySymbol] = React.useState("₦");
  const [formData, setFormData] = React.useState({
    jobRole: "",
    industry: "",
    workDescription: "",
    toolsUsed: "",
    mostTimeConsumingTask: "",
  });

  React.useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setError("Configuration Error: VITE_FIREBASE_API_KEY is missing from Secrets. Please add it in the Settings menu.");
    }

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
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("The sign-in window was closed before completion. Please try again and complete the sign-in process.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("A sign-in request was already in progress. Please wait a moment and try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("The sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.message && (err.message.includes('identitytoolkit') || err.code === 'auth/internal-error')) {
        setError("Firebase Configuration Error: The Identity Toolkit API is blocked. Please ensure: 1. 'Identity Toolkit API' AND 'Firebase Management API' are enabled in Google Cloud. 2. This app's domain is in 'Authorized Domains' in Firebase Console. 3. Your API key has no 'Application restrictions' (Referrer/IP).");
      } else {
        setError("Failed to sign in with Google. Please ensure your Firebase configuration and VITE_FIREBASE_API_KEY secret are correct.");
      }
    } finally {
      setIsLoggingIn(false);
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
      const result = await generateAutomationReport({ 
        ...formData, 
        currencySymbol,
        monthlySalary,
        hourlyRate,
        calcMode
      });
      setReport(result);

      // Save to Firestore
      const path = 'AI_Workflow_Architect';
      try {
        await addDoc(collection(db, path), {
          role: formData.jobRole,
          industry: formData.industry,
          work_description: formData.workDescription || null,
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
    setLoading(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper for new page
      const checkNewPage = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Header
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text("STRATEGIC AI IMPLEMENTATION BLUEPRINT", margin, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("EXECUTIVE CONSULTING DELIVERABLE", margin, 28);
      doc.setFontSize(9);
      doc.text(`Prepared for: ${formData.jobRole} | ${formData.industry}`, margin, 34);
      y = 55;

      // Section Title Helper
      const sectionTitle = (title: string) => {
        checkNewPage(20);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin, y);
        y += 8;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      };

      // 1. Executive Summary
      sectionTitle("1. Executive Summary");
      doc.setTextColor(64, 64, 64);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summary = `This report outlines a strategic automation roadmap for a ${formData.jobRole} in the ${formData.industry} industry. By implementing the recommended AI-powered workflows, you can save approximately ${report.roiAnalysis.hoursSavedPerMonth} hours per month, resulting in an estimated yearly value of ${currencySymbol}${Math.round(currentMonthlyValue * 12).toLocaleString()}.`;
      const splitSummary = doc.splitTextToSize(summary, contentWidth);
      doc.text(splitSummary, margin, y);
      y += (splitSummary.length * 5) + 15;

      // 2. ROI Analysis
      sectionTitle("2. ROI Analysis");
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(12);
      doc.text(`${currencySymbol}${Math.round(currentMonthlyValue).toLocaleString()}`, margin + 10, y + 12);
      doc.text(`${report.roiAnalysis.hoursSavedPerMonth} Hours`, margin + contentWidth/2 + 10, y + 12);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text("ESTIMATED MONTHLY VALUE", margin + 10, y + 20);
      doc.text("HOURS SAVED PER MONTH", margin + contentWidth/2 + 10, y + 20);

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Logic: ${report.roiAnalysis.calculationLogic}`, margin + 10, y + 28);
      doc.text(`Estimated Payback: ${report.roiAnalysis.paybackPeriod}`, margin + contentWidth/2 + 10, y + 28);

      y += 50;

      // 3. Automation Priority
      sectionTitle("3. Automation Priority Score");
      report.priorityScores.forEach((item) => {
        checkNewPage(15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(item.task, margin, y);
        doc.setTextColor(16, 185, 129);
        doc.text(item.score, pageWidth - margin - 40, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const reason = doc.splitTextToSize(item.reason, contentWidth);
        doc.text(reason, margin, y);
        y += (reason.length * 5) + 8;
      });

      // 4. Workflows (DEEP BLUEPRINTS)
      sectionTitle("4. Implementation Blueprints");
      report.workflowIdeas.forEach((wf, i) => {
        checkNewPage(120);
        
        // Workflow Header Box
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`BLUEPRINT #${i + 1}: ${wf.name}`, margin + 5, y + 13);
        y += 28;

        // Skill level & time
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(10);
        doc.text(`Skill Level: ${wf.skillLevel || "N/A"} (${wf.skillLevelExplanation || ""})`, margin, y);
        y += 6;
        if (wf.setupTimeBreakdown) {
          const timeArr = wf.setupTimeBreakdown.map(b => `${b.phase}: ${b.duration}`);
          doc.text(`Setup Breakdown: ${timeArr.join(' | ')}`, margin, y);
          y += 12;
        } else {
          doc.text(`Estimated Setup: ${wf.setupTime || "Varies"}`, margin, y);
          y += 12;
        }

        // 4.1 Architecture
        if (wf.architecture) {
          doc.setTextColor(40, 40, 40);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text("1. ARCHITECTURE", margin, y);
          y += 6;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Trigger: ${wf.architecture.trigger}`, margin + 5, y);
          y += 5;
          doc.text(`Data Source: ${wf.architecture.inputData}`, margin + 5, y);
          y += 5;
          doc.text(`Output: ${wf.architecture.output} (Target: ${wf.architecture.storage})`, margin + 5, y);
          y += 10;
        }

        // 4.2 Implementation
        if (wf.implementationSteps) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text("2. IMPLEMENTATION STEPS", margin, y);
          y += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          wf.implementationSteps.forEach((step, si) => {
            checkNewPage(10);
            const sText = doc.splitTextToSize(`[ ] Step ${si + 1}: ${step}`, contentWidth - 10);
            doc.text(sText, margin + 5, y);
            y += (sText.length * 5);
          });
          y += 8;
        }

        // 4.3 Prompt Logic
        if (wf.promptLogic) {
          checkNewPage(40);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text("3. CRITICAL PROMPT LOGIC", margin, y);
          y += 7;
          doc.setFillColor(245, 247, 250);
          const promptText = doc.splitTextToSize(`"${wf.promptLogic.examplePrompt}"`, contentWidth - 10);
          doc.rect(margin, y - 4, contentWidth, (promptText.length * 5) + 8, 'F');
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.text(promptText, margin + 5, y + 2);
          y += (promptText.length * 5) + 10;
        }

        // 4.4 Human Review & Failure
        if (wf.humanReviewPoints || wf.failureHandling) {
          checkNewPage(40);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text("Human Review Protocol:", margin, y);
          y += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          (wf.humanReviewPoints || []).forEach(p => {
            doc.text(`• ${p}`, margin + 5, y);
            y += 5;
          });
          y += 5;
          
          if (wf.failureHandling) {
            doc.setFont('helvetica', 'bold');
            doc.text("Failure Handling:", margin, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.text(`Common Errors: ${(wf.failureHandling.commonErrors || []).join(', ')}`, margin + 5, y);
            y += 5;
            doc.text(`Recovery: ${wf.failureHandling.correctionSteps}`, margin + 5, y);
            y += 15;
          }
        }
      });

      // 5. Estimated Costs
      if (report.estimatedMonthlyCost) {
        sectionTitle("5. Estimated Monthly Cost");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Overall Setup Level: ${report.estimatedMonthlyCost.overallCostTier}`, margin, y);
        y += 10;
  
        (report.estimatedMonthlyCost.items || []).forEach((item) => {
          checkNewPage(15);
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(item.toolName, margin + 5, y + 8);
          
          doc.setTextColor(16, 185, 129);
          doc.text(item.costRange, pageWidth - margin - 5, y + 8, { align: 'right' });
          y += 15;
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(120, 120, 120);
          doc.text(`(${item.costTier}) - ${item.reason}`, margin + 5, y - 5);
          y += 5;
        });
      }

      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`STRATEGIC AI BLUEPRINT | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        if (i === pageCount) {
          doc.setFontSize(7);
          const disclaimer = "CONFIDENTIAL CONSULTING DOCUMENT: The recommendations and ROI calculations within this blueprint are strategic estimates based on typical labor productivity indices. Actual performance may vary based on specific implementation quality and organizational adoption rates. This document is intended as an implementation roadmap, not a financial guarantee.";
          const discLines = doc.splitTextToSize(disclaimer, contentWidth);
          doc.text(discLines, margin, pageHeight - 20);
        }
      }

      doc.save(`Strategic_AI_Blueprint_${formData.jobRole.replace(/\s+/g, '_')}.pdf`);
      setSuccessMessage("Professional PDF Report downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate professional PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const effectiveHourlyRate = calcMode === 'hourly' ? hourlyRate : (monthlySalary / 160);
  const currentMonthlyValue = report 
    ? (report.roiAnalysis.hoursSavedPerMonth * effectiveHourlyRate) + (report.roiAnalysis.directExpensesSavings || 0)
    : 0;

  const emailReport = () => {
    if (!report || !user) return;
    
    const subject = encodeURIComponent(`AI Workflow Blueprint: ${formData.jobRole}`);
    const body = encodeURIComponent(`
Hi, here is your AI Workflow Blueprint for ${formData.jobRole}.

HOURS SAVED PER MONTH: ${report.roiAnalysis.hoursSavedPerMonth}
ESTIMATED MONTHLY VALUE: ${currencySymbol}${Math.round(currentMonthlyValue).toLocaleString()}
ESTIMATED PAYBACK PERIOD: ${report.roiAnalysis.paybackPeriod}
LOGIC: ${report.roiAnalysis.calculationLogic}

View the full report in the AI Workflow Architect app.
    `.trim());
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    setSuccessMessage("Opening your email client...");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const downloadText = () => {
    if (!report) return;

    const content = `
STRATEGIC AI IMPLEMENTATION BLUEPRINT: EXECUTIVE CONSULTING DELIVERABLE
======================================================================
Prepared for: ${formData.jobRole}
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
Estimated Monthly Value: ${currencySymbol}${Math.round(currentMonthlyValue)}
Hours Saved Per Month: ${report.roiAnalysis.hoursSavedPerMonth}
Logic: ${report.roiAnalysis.calculationLogic}
Payback Period: ${report.roiAnalysis.paybackPeriod}

4. AUTOMATION PRIORITY SCORE
---------------------------
${report.priorityScores ? `4. AUTOMATION PRIORITY SCORE
---------------------------
${report.priorityScores.map(p => `${p.score} - ${p.task}\nReason: ${p.reason}`).join('\n\n')}\n` : ""}

5. RECOMMENDED FIRST STEP
-------------------------
Workflow: ${report.startHere.workflowName}
Rationale: ${report.startHere.whyFirstStep}
Expected Result: ${report.startHere.immediateResult}

6. IMPLEMENTATION BLUEPRINTS (DETAILED)
--------------------------------------
${report.workflowIdeas?.map((wf, i) => `
WORKFLOW BLUEPRINT #${i + 1}: ${wf.name || wf.title}
=======================================
Skill Level Required: ${wf.skillLevel || "N/A"} (${wf.skillLevelExplanation || ""})
Setup Commitment: ${wf.setupTimeBreakdown ? wf.setupTimeBreakdown.map(b => `${b.phase} (${b.duration})`).join(', ') : (wf.setupTime || "Varies")}

${wf.architecture ? `1. ARCHITECTURE
- Trigger: ${wf.architecture.trigger}
- Input Data: ${wf.architecture.inputData}
- Processing Steps:
${wf.architecture.logic?.map((l, j) => `  ${j + 1}. ${l}`).join('\n')}
- System Output: ${wf.architecture.output}
- Final Storage: ${wf.architecture.storage}` : ""}

${wf.implementationSteps ? `2. IMPLEMENTATION STEPS (STEP-BY-STEP)
${wf.implementationSteps.map((s, j) => `[ ] Step ${j + 1}: ${s}`).join('\n')}` : ""}

${wf.promptLogic ? `3. CRITICAL PROMPT LOGIC
- Example Prompt: "${wf.promptLogic.examplePrompt}"
- Dynamic Variables: ${wf.promptLogic.variables?.join(', ')}
- Logic Structure: ${wf.promptLogic.structure}` : ""}

${wf.dataStructure ? `4. DATA STRUCTURE & FORMAT
- Required Fields: ${wf.dataStructure.requiredFields?.join(', ')}
- Storage Format: ${wf.dataStructure.format}` : ""}

${wf.humanReviewPoints ? `5. HUMAN REVIEW PROTOCOL
${wf.humanReviewPoints.map(p => `(!) REQUIREMENT: ${p}`).join('\n')}` : ""}

${wf.failureHandling ? `6. FAILURE & EXCEPTION HANDLING
- Common Errors: ${wf.failureHandling.commonErrors?.join(', ')}
- Corrective Action: ${wf.failureHandling.correctionSteps}` : ""}

${wf.expectedOutputExample ? `7. EXPECTED SAMPLE OUTPUT
-------------------------
${wf.expectedOutputExample}` : ""}

${wf.zapierTemplates && wf.zapierTemplates.length > 0 ? `8. ZAPIER TEMPLATES (CLIENT READY)
${wf.zapierTemplates.map(t => `- ${t.name}: ${t.url}`).join('\n')}` : ""}
------------------------------------------------------
`).join('\n\n')}

${report.systemMap ? `7. AUTOMATION SYSTEM MAP
------------------------
${report.systemMap.join(' → ')}\n` : ""}

${report.aiRiskInsight ? `8. AI RISK & COMPETITIVE INSIGHT
--------------------------------
Why AI cannot fully replace this role:
${report.aiRiskInsight.whyNotReplace}

Where AI gives competitors an advantage:
${report.aiRiskInsight.competitorAdvantage}

What happens if you do nothing:
${report.aiRiskInsight.doingNothingRisk}\n` : ""}

${report.roadmap ? `9. NEXT STEP ROADMAP
--------------------
Stage 1: ${report.roadmap.stage1}
Stage 2: ${report.roadmap.stage2}
Stage 3: ${report.roadmap.stage3}\n` : ""}

10. IMPORTANT LIMITATIONS
------------------------
${report.limitations?.map(l => `- ${l}`).join('\n')}

11. ESTIMATED MONTHLY COST
--------------------------
${report.estimatedMonthlyCost.items?.map(item => `— ${item.toolName}: ${item.costTier} (${item.costRange}) (reason: ${item.reason})`).join('\n')}
Estimated Cost Range: ${report.estimatedMonthlyCost.overallCostTier}

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

CONFIDENTIALITY NOTICE: This document is a strategic consulting deliverable. Recommendations are based on strategic indices. ROI figures are estimates based on standard productivity models.
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Work Description / Specific Tasks (Optional)</label>
                  <textarea
                    name="workDescription"
                    value={formData.workDescription}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe your daily workflow or list specific tasks you want to automate..."
                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-neutral-50/50 dark:bg-neutral-800/50 dark:text-white resize-none"
                  />
                  <p className="text-[10px] text-neutral-400">Providing specific tasks allows for a much more accurate automation plan.</p>
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
                    disabled={isLoggingIn}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Shield className="w-5 h-5" />
                    )}
                    {isLoggingIn ? "Connecting..." : "Sign In to Generate Plan"}
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
                    {/* Professional Badge */}
                    <div className="flex justify-center sm:justify-start">
                      <div className="px-4 py-1.5 bg-neutral-900 dark:bg-neutral-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-xl border border-white/10">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        Executive Consulting Deliverable
                      </div>
                    </div>

                    {/* ROI Calculator */}
                    <ROICalculator 
                      roi={report.roiAnalysis} 
                      hourlyRate={hourlyRate} 
                      setHourlyRate={setHourlyRate} 
                      currencySymbol={currencySymbol} 
                      setCurrencySymbol={setCurrencySymbol} 
                      calcMode={calcMode}
                      setCalcMode={setCalcMode}
                      monthlySalary={monthlySalary}
                      setMonthlySalary={setMonthlySalary}
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
                        <div className="text-4xl font-black mb-2">~{report.impactEstimate.hoursSavedPerWeek}</div>
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
                                {wf.setupTimeBreakdown?.[0]?.duration || wf.setupTime || "Varies"}
                              </span>
                            </div>
                          </div>
                          
                          {wf.architecture && (
                            <div className="p-8 grid lg:grid-cols-2 gap-12">
                              <div className="space-y-8">
                                {/* Workflow Architecture Card */}
                                <div className="p-6 bg-neutral-900 text-white rounded-3xl shadow-xl overflow-hidden relative">
                                  <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <LayoutDashboard className="w-16 h-16" />
                                  </div>
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                    <Workflow className="w-3 h-3" /> 1. Workflow Architecture
                                  </h5>
                                  <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                                    <div className="space-y-4">
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                        <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Trigger Event</p>
                                        <p className="text-sm font-bold text-emerald-400">{wf.architecture.trigger}</p>
                                      </div>
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                        <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Input Data Source</p>
                                        <p className="text-sm font-bold">{wf.architecture.inputData}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                        <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Processing Logic</p>
                                        <ul className="space-y-1">
                                          {wf.architecture.logic?.map((l, idx) => (
                                            <li key={`logic-${idx}`} className="text-xs flex items-start gap-2">
                                              <span className="text-emerald-400">•</span> {l}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Output & Storage</p>
                                            <p className="text-xs font-bold text-emerald-400">{wf.architecture.output}</p>
                                            <p className="text-[10px] text-white/60">Stored in: {wf.architecture.storage}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Detailed Implementation Steps */}
                                {wf.implementationSteps && (
                                  <div className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
                                      <ListChecks className="w-3 h-3 text-blue-500" /> 2. Detailed Implementation
                                    </h5>
                                    <div className="space-y-4">
                                      {wf.implementationSteps.map((step, idx) => (
                                        <div key={`step-${idx}`} className="flex gap-4 group">
                                          <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            {idx + 1}
                                          </div>
                                          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">{step}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {wf.setupTimeBreakdown && (
                                      <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                                        <h6 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                          <Clock className="w-3 h-3 text-emerald-500" /> Setup Time Breakdown
                                        </h6>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                          {wf.setupTimeBreakdown.map((bt, idx) => (
                                            <div key={`bt-${idx}`} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                                              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter truncate mb-1">{bt.phase}</p>
                                              <p className="text-base font-black text-neutral-900 dark:text-white">{bt.duration}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Prompt Logic & Data Structure */}
                                <div className="grid sm:grid-cols-2 gap-8">
                                  {wf.promptLogic && (
                                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                                      <h5 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> 3. Strategic AI Framework
                                      </h5>
                                      <div className="bg-neutral-900 p-6 rounded-2xl border border-indigo-500/30 mb-6 shadow-inner ring-1 ring-white/5">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-3 tracking-tighter">High-Performance Prompt Template</p>
                                        <div className="relative">
                                          <p className="text-base font-serif text-white leading-relaxed italic pr-4">
                                            <span className="text-indigo-500 text-2xl absolute -left-2 -top-2 opacity-50">"</span>
                                            {wf.promptLogic.examplePrompt}
                                            <span className="text-indigo-500 text-2xl absolute -right-0 bottom-0 translate-y-2 opacity-50">"</span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">
                                          {wf.promptLogic.variables?.map((v, idx) => (
                                            <span key={`var-${idx}`} className="px-3 py-1 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-indigo-300 text-xs font-black rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm">
                                              # {v}
                                            </span>
                                          ))}
                                        </div>
                                        <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
                                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Logic Architecture</p>
                                          <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium leading-tight">{wf.promptLogic.structure}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {wf.dataStructure && (
                                    <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2rem] border-2 border-neutral-200 dark:border-neutral-800 shadow-sm">
                                      <h5 className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6 flex items-center gap-2">
                                        <History className="w-4 h-4" /> 4. Data Asset Structure
                                      </h5>
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3">
                                          {wf.dataStructure.requiredFields?.map((f, idx) => (
                                            <div key={`field-${idx}`} className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xs flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                                              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{f}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-neutral-100 dark:border-neutral-700 shadow-sm">
                                          <p className="text-[10px] font-black text-neutral-400 uppercase mb-2 tracking-widest">Standard Format</p>
                                          <p className="text-sm text-neutral-900 dark:text-white font-black">{wf.dataStructure.format}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-8">
                                {/* Visual Diagram */}
                                {wf.diagram && (
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                      <Target className="w-3 h-3" /> System Logic Map
                                    </p>
                                    <WorkflowDiagram diagram={wf.diagram} />
                                  </div>
                                )}

                                {/* Zapier Templates */}
                                {wf.zapierTemplates && wf.zapierTemplates.length > 0 && (
                                  <div className="space-y-4">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Zapier Connector Blueprints</p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                      {wf.zapierTemplates.map((template, idx) => (
                                        <a 
                                          key={`zap-${i}-${idx}`}
                                          href={template.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group shadow-sm"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <Zap className="w-4 h-4 text-emerald-600" />
                                            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                                          </div>
                                          <p className="text-sm font-bold dark:text-white mb-1 leading-tight">{template.name}</p>
                                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{template.description}</p>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Specialized Sections */}
                                <div className="grid sm:grid-cols-2 gap-8">
                                  {wf.humanReviewPoints && (
                                    <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border-2 border-amber-200 dark:border-amber-900/40 shadow-sm">
                                      <h5 className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-6 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" /> 5. Critical Human Review Points
                                      </h5>
                                      <div className="space-y-4">
                                        {wf.humanReviewPoints.map((point, idx) => (
                                          <div key={`hr-${idx}`} className="flex gap-4 p-5 bg-white dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-sm hover:border-amber-400 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-amber-500/20">
                                              !
                                            </div>
                                            <p className="text-sm text-black dark:text-amber-100 font-bold leading-relaxed">{point}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {wf.failureHandling && (
                                    <div className="p-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] border-2 border-rose-200 dark:border-rose-900/40 shadow-sm">
                                      <h5 className="text-xs font-black uppercase tracking-widest text-rose-700 dark:text-rose-400 mb-6 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> 6. System Failure Protocols
                                      </h5>
                                      <div className="space-y-6">
                                        <div className="bg-white dark:bg-rose-950/20 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                                          <p className="text-[10px] font-black text-rose-500 uppercase mb-3 tracking-widest">Common Error Vectors</p>
                                          <ul className="space-y-2">
                                            {wf.failureHandling.commonErrors?.map((err, idx) => (
                                              <li key={`err-${idx}`} className="text-xs text-rose-900 dark:text-rose-200 font-black flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {err}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="p-6 bg-rose-600 rounded-2xl shadow-xl shadow-rose-600/20 relative overflow-hidden group">
                                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          <p className="text-[10px] font-black text-white/50 uppercase mb-2 tracking-widest relative z-10">Standard Correction Action</p>
                                          <p className="text-base text-white font-black leading-relaxed relative z-10">{wf.failureHandling.correctionSteps}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Sample Output Example */}
                                {wf.expectedOutputExample && (
                                  <div className="p-6 bg-neutral-900 text-white rounded-3xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                      <Lightbulb className="w-3 h-3" /> 10. Expected Output Example
                                    </h5>
                                    <div className="p-5 bg-white hidden dark:block dark:bg-white/5 rounded-2xl border border-white/10 font-mono text-sm leading-relaxed text-blue-200">
                                      {wf.expectedOutputExample}
                                    </div>
                                    <div className="p-5 bg-neutral-800 block dark:hidden rounded-2xl border border-neutral-700 font-mono text-sm leading-relaxed text-blue-300 shadow-inner">
                                      {wf.expectedOutputExample}
                                    </div>
                                    <p className="text-[9px] mt-4 opacity-50 uppercase tracking-widest text-center">Customization Level: {wf.customizationOptions}</p>
                                  </div>
                                )}

                                <div className="p-5 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl text-center">
                                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-1 italic">Skill Level Needed: {wf.skillLevel}</p>
                                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium px-4">{wf.skillLevelExplanation}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* System Map */}
                  {report.systemMap && (
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
                            <React.Fragment key={`system-step-${i}`}>
                              <div className="flex items-center gap-6 group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors shrink-0 font-black">
                                  {i + 1}
                                </div>
                                <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors flex-1 text-left">
                                  {step.trim()}
                                </div>
                              </div>
                              {i < (report.systemMap?.length || 0) - 1 && (
                                <div className="flex justify-center py-2">
                                  <ArrowDown className="w-6 h-6 text-neutral-700" />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* AI Risk Insight */}
                  {report.aiRiskInsight && (
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
                  )}

                  {/* Roadmap */}
                  {report.roadmap && (
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
                  )}

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
                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{item.costTier}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">reason: {item.reason}</div>
                              </div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.costRange}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Estimated Cost Range</div>
                          <div className="text-xl font-black text-neutral-900 dark:text-white px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">{report.estimatedMonthlyCost.overallCostTier}</div>
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
                  <section id="next-steps" className="mt-12 pb-24">
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
