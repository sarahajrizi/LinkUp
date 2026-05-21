import { useState } from "react";
import {
  Home, Lock, Heart, Stethoscope, ClipboardList, Activity,
  AlertTriangle, BarChart3, MessageSquare, Settings, Bell,
  Search, Shield, Baby, CheckCircle2, XCircle, Clock,
  ArrowRight, Phone, Wifi, WifiOff, Mic, Send,
  Plus, Download, User, Menu, X, TrendingUp,
  Globe, Eye, EyeOff, AlertCircle,
  ChevronRight, ChevronDown, Zap, Users, MoreHorizontal,
  Building2, Syringe, Info, Check, RefreshCw, MapPin,
  Star, FileText
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

type Page =
  | "landing" | "login" | "parent" | "nurse"
  | "visit" | "timeline" | "ai-risk" | "admin"
  | "messaging" | "settings";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  group: string;
}

const navItems: NavItem[] = [
  { id: "landing", label: "Platform Overview", icon: Home, group: "Explore" },
  { id: "login", label: "Login / Auth", icon: Lock, group: "Explore" },
  { id: "parent", label: "Family Portal", icon: Heart, group: "Portals" },
  { id: "nurse", label: "Nurse App", icon: Stethoscope, group: "Portals" },
  { id: "visit", label: "Home Visit Form", icon: ClipboardList, group: "Portals" },
  { id: "timeline", label: "Child Timeline", icon: Activity, group: "Clinical" },
  { id: "ai-risk", label: "AI Risk Detection", icon: AlertTriangle, group: "Clinical" },
  { id: "admin", label: "Admin Dashboard", icon: BarChart3, group: "Management" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, group: "Management" },
  { id: "settings", label: "Settings", icon: Settings, group: "Management" },
];

const vaccinationTrend = [
  { month: "Jan", rate: 88 }, { month: "Feb", rate: 89 },
  { month: "Mar", rate: 87 }, { month: "Apr", rate: 91 },
  { month: "May", rate: 93 }, { month: "Jun", rate: 92 },
  { month: "Jul", rate: 94 }, { month: "Aug", rate: 91 },
  { month: "Sep", rate: 95 }, { month: "Oct", rate: 93 },
  { month: "Nov", rate: 94 }, { month: "Dec", rate: 91 },
];

const municipalityData = [
  { name: "Pristina", coverage: 94, children: 12400 },
  { name: "Prizren", coverage: 91, children: 8200 },
  { name: "Ferizaj", coverage: 89, children: 4100 },
  { name: "Gjilan", coverage: 88, children: 5100 },
  { name: "Peja", coverage: 87, children: 4900 },
  { name: "Gjakova", coverage: 92, children: 3800 },
  { name: "Mitrovica", coverage: 83, children: 4700 },
];

const growthData = [
  { age: "3m", weight: 5.8, height: 60 },
  { age: "6m", weight: 7.5, height: 66 },
  { age: "9m", weight: 8.9, height: 71 },
  { age: "12m", weight: 9.8, height: 75 },
  { age: "15m", weight: 10.5, height: 79 },
  { age: "18m", weight: 11.2, height: 82 },
];

const riskDistribution = [
  { label: "Low Risk", value: 38420, color: "#10B981" },
  { label: "Medium Risk", value: 7200, color: "#F59E0B" },
  { label: "High Risk", value: 2212, color: "#EF4444" },
];

// ─── Shared UI primitives ────────────────────────────────────────────────────

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "muted" }) {
  const styles: Record<string, string> = {
    default: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    danger: "bg-red-50 text-red-700 border border-red-100",
    info: "bg-blue-50 text-blue-700 border border-blue-100",
    muted: "bg-slate-50 text-slate-600 border border-slate-100",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-black/[0.06] shadow-sm shadow-black/[0.03] ${className}`}>
      {children}
    </div>
  );
}

function KPICard({
  label, value, delta, icon: Icon, color = "indigo",
}: {
  label: string; value: string; delta?: string; icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; delta: string }> = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", delta: "text-indigo-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", delta: "text-emerald-600" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", delta: "text-amber-600" },
    red: { bg: "bg-red-50", icon: "text-red-600", delta: "text-red-600" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", delta: "text-blue-600" },
  };
  const c = colors[color] ?? colors.indigo;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {delta && <span className={`text-xs font-semibold ${c.delta}`}>{delta}</span>}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
      </div>
    </Card>
  );
}

function VaccineProgress({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">Vaccination Progress</span>
        <span className="text-sm font-bold text-indigo-700">{completed}/{total} doses</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1.5">{pct}% of scheduled immunizations complete</p>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  activePage, setActivePage, open,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
  open: boolean;
}) {
  const groups = ["Explore", "Portals", "Clinical", "Management"];
  return (
    <div
      className={`flex-shrink-0 flex flex-col h-full transition-all duration-300 overflow-hidden`}
      style={{
        width: open ? "240px" : "0px",
        background: "#1E1B4B",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-indigo-400 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-base leading-none tracking-tight">SAFE</p>
          <p className="text-indigo-300 text-[10px] mt-0.5 font-medium uppercase tracking-widest truncate">Child Health Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const items = navItems.filter((n) => n.group === group);
          return (
            <div key={group} className="mb-5">
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5">{group}</p>
              {items.map((item) => {
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 mb-0.5
                      ${active
                        ? "bg-indigo-500/20 text-white"
                        : "text-indigo-200 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-indigo-300" : "text-indigo-400"}`} />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {active && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-300" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t border-white/10 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">DS</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">Demo Session</p>
          <p className="text-indigo-300 text-[10px] truncate">Kosovo MoH</p>
        </div>
      </div>
    </div>
  );
}

// ─── Top bar ────────────────────────────────────────────────────────────────

function TopBar({
  activePage, sidebarOpen, setSidebarOpen,
}: {
  activePage: Page;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const labels: Record<Page, string> = {
    landing: "Platform Overview",
    login: "Login & Authentication",
    parent: "Family Portal — Ardit Krasniqi",
    nurse: "Nurse App — Mirela Berisha",
    visit: "Home Visit — Krasniqi Family",
    timeline: "Child Health Timeline",
    "ai-risk": "AI Risk Detection",
    admin: "Admin Dashboard — Pristina Region",
    messaging: "Secure Messaging",
    settings: "Settings & Profile",
  };
  return (
    <header className="flex-shrink-0 h-14 bg-white border-b border-black/[0.06] flex items-center px-4 gap-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Menu className="w-4 h-4 text-slate-500" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{labels[activePage]}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors relative">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-700 text-xs font-bold">MH</span>
        </div>
      </div>
    </header>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────

function LandingPage({ setActivePage }: { setActivePage: (p: Page) => void }) {
  const features = [
    { icon: FileText, title: "Digital Child Health Records", desc: "Comprehensive electronic records from birth through adolescence, accessible across all care settings.", color: "indigo" },
    { icon: Syringe, title: "Smart Vaccination Reminders", desc: "Automated, multilingual reminders ensure no child misses a scheduled immunization.", color: "blue" },
    { icon: Zap, title: "AI-Powered Preventive Alerts", desc: "Machine learning flags at-risk children before conditions deteriorate, enabling early intervention.", color: "amber" },
    { icon: Stethoscope, title: "Home Visiting Nurse Support", desc: "Structured digital workflows guide nurses through evidence-based home visit protocols.", color: "emerald" },
    { icon: BarChart3, title: "Real-Time Health Dashboards", desc: "Municipality and ministry officials gain live visibility into coverage gaps and programme performance.", color: "indigo" },
  ];

  const impacts = [
    { role: "Parents", icon: Heart, items: ["Track all vaccinations and health milestones in one place", "Get timely reminders for check-ups and vaccines", "Communicate securely with your family nurse"] },
    { role: "Nurses", icon: Stethoscope, items: ["Manage daily visit schedules from a mobile device", "Complete structured digital forms with offline support", "Receive AI alerts for high-risk families"] },
    { role: "Municipalities", icon: Building2, items: ["Monitor vaccination coverage by neighbourhood", "Compare nurse performance and workload distribution", "Export reports for Ministry submissions"] },
    { role: "Ministry of Health", icon: Globe, items: ["National coverage maps updated in real time", "Predictive analytics for public health planning", "Standardised data for WHO and UNICEF reporting"] },
  ];

  const [activeImpact, setActiveImpact] = useState(0);

  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #6366F1 0%, transparent 60%)" }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-indigo-200 text-xs font-semibold tracking-wide">Kosovo Ministry of Health · Certified Platform</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Protecting Kosovo's<br />
              <span className="text-indigo-300">Children,</span> Intelligently.
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed mb-8 max-w-lg">
              SAFE digitises child health records, coordinates Home Visiting nurses, and uses AI to detect risk before it becomes harm — for every child, in every municipality.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActivePage("parent")}
                className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm"
              >
                <Baby className="w-4 h-4" /> Track Child Health
              </button>
              <button
                onClick={() => setActivePage("nurse")}
                className="bg-indigo-500/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-indigo-500/40 transition-colors flex items-center gap-2 text-sm border border-white/20"
              >
                <Stethoscope className="w-4 h-4" /> For Healthcare Providers
              </button>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/40 text-xs ml-2 font-mono">safe.gov.ks — Admin Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[["47,832", "Children"], ["91.4%", "Vaccination"], ["612", "Nurses"]].map(([v, l]) => (
                  <div key={l} className="bg-white/10 rounded-lg p-2.5">
                    <p className="text-white font-bold text-base">{v}</p>
                    <p className="text-indigo-200 text-[10px]">{l}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-indigo-200 text-[10px] font-semibold mb-2 uppercase tracking-wide">Vaccination Coverage</p>
                <div className="flex items-end gap-1 h-12">
                  {municipalityData.map((m) => (
                    <div key={m.name} className="flex-1 flex flex-col justify-end">
                      <div
                        className="bg-indigo-400 rounded-t"
                        style={{ height: `${(m.coverage / 100) * 48}px` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {[
                  { label: "⚠ High-risk alert — Mitrovica North", color: "amber" },
                  { label: "✓ Vaccination batch confirmed — Pristina", color: "emerald" },
                ].map((a) => (
                  <div key={a.label} className={`text-[10px] px-2 py-1.5 rounded ${a.color === "amber" ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500/20 text-emerald-200"}`}>
                    {a.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: "47,832", label: "Children Monitored", icon: Baby, color: "text-indigo-600" },
            { value: "91.4%", label: "Vaccination Coverage", icon: Syringe, color: "text-emerald-600" },
            { value: "38", label: "Municipalities Connected", icon: MapPin, color: "text-blue-600" },
            { value: "612", label: "Active Nurses", icon: Stethoscope, color: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-2">How SAFE Works</p>
          <h2 className="text-3xl font-bold text-slate-900">Prevention-first child health infrastructure</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Register & Connect", desc: "Families enroll via a local nurse or clinic. Child health records are created digitally and linked to the national system.", icon: Users },
            { step: "02", title: "Monitor & Alert", desc: "AI continuously analyses health data against WHO benchmarks. At-risk children receive priority nurse visits.", icon: Zap },
            { step: "03", title: "Coordinate & Act", desc: "Nurses, parents, and health managers are connected in real time. Every intervention is logged and measured.", icon: Check },
          ].map((s) => (
            <Card key={s.step} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-black text-slate-100">{s.step}</span>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-2">Platform Features</p>
            <h2 className="text-3xl font-bold text-slate-900">Built for every stakeholder in the health system</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const colorMap: Record<string, string> = { indigo: "bg-indigo-50 text-indigo-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600" };
              return (
                <Card key={f.title} className="p-5 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-lg ${colorMap[f.color]} flex items-center justify-center mb-4`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-2">Impact By Role</p>
          <h2 className="text-3xl font-bold text-slate-900">Designed for every person in the care chain</h2>
        </div>
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {impacts.map((im, i) => (
            <button
              key={im.role}
              onClick={() => setActiveImpact(i)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeImpact === i ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-200"}`}
            >
              {im.role}
            </button>
          ))}
        </div>
        <Card className="max-w-2xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              {(() => { const Im = impacts[activeImpact].icon; return <Im className="w-6 h-6 text-indigo-600" />; })()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">For {impacts[activeImpact].role}</h3>
              <p className="text-sm text-slate-500">How SAFE makes a difference</p>
            </div>
          </div>
          <ul className="space-y-3">
            {impacts[activeImpact].items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-700 to-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to modernise child health in Kosovo?</h2>
          <p className="text-indigo-200 mb-8">Join 38 municipalities and 612 nurses already using SAFE to protect the health of 47,832 children.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setActivePage("login")} className="bg-white text-indigo-700 font-semibold px-7 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm">
              Get Started Today
            </button>
            <button onClick={() => setActivePage("admin")} className="bg-indigo-500/30 border border-white/30 text-white font-semibold px-7 py-3 rounded-lg hover:bg-indigo-500/40 transition-colors text-sm">
              View Live Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────

function LoginPage({ setActivePage }: { setActivePage: (p: Page) => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<"role" | "phone" | "otp">("role");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPhone, setShowPhone] = useState(false);

  const roles = [
    { id: "parent", label: "Parent / Guardian", icon: Heart, desc: "Access your child's health records", color: "emerald" },
    { id: "nurse", label: "Home Visiting Nurse", icon: Stethoscope, desc: "Manage your daily visit schedule", color: "blue" },
    { id: "manager", label: "Health Manager", icon: Building2, desc: "Monitor municipal health programmes", color: "indigo" },
    { id: "ministry", label: "Ministry Official", icon: Globe, desc: "National public health intelligence", color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const destination: Record<string, Page> = {
    parent: "parent", nurse: "nurse", manager: "admin", ministry: "admin",
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in to SAFE</h1>
          <p className="text-slate-500 text-sm">Kosovo Child Health Intelligence Platform</p>
        </div>

        <Card className="p-6">
          {step === "role" && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-4">Select your role to continue</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === r.id ? colorMap[r.color] + " border-current" : "border-slate-100 bg-slate-50 hover:border-slate-200"}`}
                  >
                    <r.icon className={`w-5 h-5 mb-2 ${selectedRole === r.id ? "" : "text-slate-400"}`} />
                    <p className={`text-xs font-bold leading-tight ${selectedRole === r.id ? "" : "text-slate-700"}`}>{r.label}</p>
                    <p className={`text-[10px] mt-0.5 ${selectedRole === r.id ? "opacity-70" : "text-slate-400"}`}>{r.desc}</p>
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedRole}
                onClick={() => setStep("phone")}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors text-sm"
              >
                Continue <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          )}

          {step === "phone" && (
            <div>
              <button onClick={() => setStep("role")} className="flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-700">
                <ChevronRight className="w-3 h-3 rotate-180" /> Back
              </button>
              <p className="text-sm font-semibold text-slate-700 mb-1.5">Enter your phone number</p>
              <p className="text-xs text-slate-500 mb-4">We'll send a verification code via SMS</p>
              <div className="flex gap-2 mb-4">
                <div className="w-16 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">🇽🇰 +383</div>
                <div className="flex-1 relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPhone ? "text" : "tel"}
                    placeholder="44 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button onClick={() => setShowPhone(!showPhone)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPhone ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep("otp")}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm mb-3"
              >
                Send Verification Code
              </button>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center">
                <Shield className="w-3 h-3" />
                <span>End-to-end encrypted · GDPR compliant</span>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div>
              <button onClick={() => setStep("phone")} className="flex items-center gap-1 text-xs text-slate-500 mb-4 hover:text-slate-700">
                <ChevronRight className="w-3 h-3 rotate-180" /> Back
              </button>
              <p className="text-sm font-semibold text-slate-700 mb-1">Verification code</p>
              <p className="text-xs text-slate-500 mb-5">Sent to +383 {phone || "44 *** ***"}</p>
              <div className="flex gap-2 mb-6">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={v}
                    onChange={(e) => {
                      const next = [...otp];
                      next[i] = e.target.value.slice(-1);
                      setOtp(next);
                    }}
                    className="flex-1 h-12 text-center text-lg font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                ))}
              </div>
              <button
                onClick={() => selectedRole && setActivePage(destination[selectedRole] ?? "parent")}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm mb-3"
              >
                Verify & Sign In
              </button>
              <p className="text-xs text-center text-slate-400">Didn't receive it? <button className="text-indigo-600 font-semibold">Resend code</button></p>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Login</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Gov-Certified</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Privacy Protected</span>
        </div>
      </div>
    </div>
  );
}

// ─── Parent Dashboard ─────────────────────────────────────────────────────────

function ParentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "timeline", "messages"];

  const upcomingVaccines = [
    { name: "MMR (Measles-Mumps-Rubella)", date: "June 12, 2025", status: "upcoming" },
    { name: "DTaP Booster", date: "August 3, 2025", status: "upcoming" },
  ];

  const timelineEvents = [
    { date: "Apr 15", label: "18-month check-up", type: "checkup", status: "completed", nurse: "Mirela Berisha" },
    { date: "Mar 2", label: "MMR — 1st dose", type: "vaccine", status: "completed", nurse: "Mirela Berisha" },
    { date: "Jan 20", label: "Weight & height measurement", type: "milestone", status: "completed", nurse: "Mirela Berisha" },
    { date: "Dec 5", label: "Vitamin D assessment", type: "checkup", status: "missed", nurse: "Mirela Berisha" },
  ];

  const statusColor: Record<string, string> = {
    completed: "text-emerald-600 bg-emerald-50 border-emerald-100",
    missed: "text-red-600 bg-red-50 border-red-100",
    upcoming: "text-blue-600 bg-blue-50 border-blue-100",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Child card */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
            AK
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Ardit Krasniqi</h2>
            <p className="text-indigo-200 text-sm">Born November 12, 2023 · 18 months</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">
                <span className="text-indigo-100 text-[10px] font-semibold">Health Score: 82/100</span>
              </Badge>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-indigo-200 text-xs">Assigned Nurse</p>
            <p className="font-semibold text-sm">Mirela Berisha</p>
            <p className="text-indigo-200 text-xs">Pristina Zone 3</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-slate-100 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === t ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5">
              <VaccineProgress completed={7} total={12} />
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upcoming Vaccinations</p>
                {upcomingVaccines.map((v) => (
                  <div key={v.name} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Syringe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{v.name}</p>
                      <p className="text-xs text-blue-600">{v.date}</p>
                    </div>
                    <Badge variant="info">Scheduled</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Growth Chart</h3>
                <Badge variant="success"><TrendingUp className="w-3 h-3" /> Healthy range</Badge>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Line type="monotone" dataKey="weight" stroke="#4338CA" strokeWidth={2} dot={{ r: 3, fill: "#4338CA" }} name="Weight (kg)" />
                  <Line type="monotone" dataKey="height" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: "#10B981" }} name="Height (cm)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="space-y-2">
                {[
                  { label: "Message Nurse", icon: MessageSquare, color: "indigo" },
                  { label: "Confirm Appointment", icon: Check, color: "emerald" },
                  { label: "View Health Record", icon: FileText, color: "blue" },
                ].map((a) => {
                  const colorCls: Record<string, string> = {
                    indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  };
                  return (
                    <button key={a.label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${colorCls[a.color]} transition-colors`}>
                      <a.icon className="w-4 h-4" />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-slate-700">AI Preventive Insight</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Ardit is due for a dental assessment at 18 months. Untreated early decay can affect speech development. Schedule with your paediatrician.</p>
              <button className="mt-3 text-xs text-indigo-600 font-semibold hover:underline">Learn more →</button>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alerts</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">Nurse visit pending confirmation — June 5</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">Vitamin D check overdue by 47 days</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="relative pl-6 space-y-1">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
          {timelineEvents.map((ev, i) => (
            <div key={i} className="relative mb-4">
              <div className={`absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-white ${ev.status === "completed" ? "bg-emerald-500" : ev.status === "missed" ? "bg-red-500" : "bg-blue-500"}`} />
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ev.date} · {ev.nurse}</p>
                  </div>
                  <Badge variant={ev.status === "completed" ? "success" : ev.status === "missed" ? "danger" : "info"}>
                    {ev.status}
                  </Badge>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {activeTab === "messages" && (
        <Card className="p-6 text-center">
          <MessageSquare className="w-10 h-10 text-indigo-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Message your nurse directly</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Mirela Berisha · Pristina Zone 3</p>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Open Conversation
          </button>
        </Card>
      )}
    </div>
  );
}

// ─── Nurse Dashboard ──────────────────────────────────────────────────────────

function NurseDashboard() {
  const [offlineMode] = useState(false);
  const visits = [
    { time: "08:30", family: "Krasniqi", child: "Ardit, 18mo", address: "Rruga Dardania 14", status: "completed", risk: "low" },
    { time: "10:00", family: "Berisha", child: "Lena, 6mo", address: "Rruga UÇK 7", status: "completed", risk: "medium" },
    { time: "11:30", family: "Gashi", child: "Besnik, 2mo", address: "Rruga Nëna Terezë 22", status: "completed", risk: "high" },
    { time: "13:15", family: "Hoxha", child: "Fjolla, 12mo", address: "Rruga Ismail Qemali 5", status: "in-progress", risk: "low" },
    { time: "14:45", family: "Osmani", child: "Valdrin, 9mo", address: "Rruga Agim Ramadani 3", status: "pending", risk: "low" },
    { time: "16:00", family: "Rama", child: "Blerta, 4mo", address: "Rruga Fehmi Agani 11", status: "pending", risk: "medium" },
    { time: "17:00", family: "Mustafa", child: "Lirim, 15mo", address: "Rruga Bill Clinton 8", status: "overdue", risk: "high" },
  ];

  const statusStyles: Record<string, string> = {
    completed: "text-emerald-700 bg-emerald-50 border-emerald-100",
    "in-progress": "text-blue-700 bg-blue-50 border-blue-100",
    pending: "text-slate-600 bg-slate-50 border-slate-100",
    overdue: "text-red-700 bg-red-50 border-red-100",
  };

  const riskStyles: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-red-100 text-red-700",
  };

  const completed = visits.filter((v) => v.status === "completed").length;
  const total = visits.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, Mirela</h1>
          <p className="text-slate-500 text-sm">Thursday, May 22, 2025 · Pristina Zone 3</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${offlineMode ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
          {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          {offlineMode ? "Offline — syncing when connected" : "Online · Synced 2 min ago"}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="Visits Today" value={`${completed}/${total}`} icon={CheckCircle2} color="emerald" delta={`+${completed} done`} />
        <KPICard label="Pending Follow-ups" value="23" icon={Clock} color="amber" delta="3 urgent" />
        <KPICard label="Missed Vaccines" value="7" icon={Syringe} color="red" delta="This week" />
        <KPICard label="Assigned Families" value="142" icon={Users} color="indigo" />
      </div>

      {/* Progress bar */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-800">Today's Visit Progress</p>
          <span className="text-sm font-bold text-indigo-700">{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400" />{completed} completed</span>
          <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-400" />1 in progress</span>
          <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-300" />{visits.filter((v) => v.status === "pending").length} pending</span>
          <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-400" />{visits.filter((v) => v.status === "overdue").length} overdue</span>
        </div>
      </Card>

      {/* Visit list */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Today's Schedule</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search families..." className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-300 w-40" />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {visits.map((v, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors ${v.status === "in-progress" ? "bg-blue-50/50" : ""}`}>
              <span className="font-mono text-xs text-slate-400 w-10 flex-shrink-0">{v.time}</span>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riskStyles[v.risk].includes("emerald") ? "bg-emerald-400" : riskStyles[v.risk].includes("amber") ? "bg-amber-400" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{v.family} — <span className="font-normal text-slate-600">{v.child}</span></p>
                <p className="text-xs text-slate-400 truncate">{v.address}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyles[v.status]}`}>
                {v.status.replace("-", " ")}
              </span>
              <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex-shrink-0">
                {v.status === "completed" ? "Review" : "Start Visit"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Home Visit Form ──────────────────────────────────────────────────────────

function HomeVisitForm() {
  const [activeSection, setActiveSection] = useState("nutrition");
  const [isRecording, setIsRecording] = useState(false);
  const sections = ["nutrition", "vaccination", "development", "environment", "risk"];

  const sectionLabels: Record<string, string> = {
    nutrition: "Nutrition", vaccination: "Vaccination", development: "Development",
    environment: "Home Environment", risk: "Risk Notes",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Family header */}
      <Card className="p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-lg font-black text-indigo-600">GH</div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900">Gashi Family</h2>
            <p className="text-sm text-slate-500">Besnik Gashi · 2 months old · Male</p>
            <p className="text-xs text-slate-400 mt-0.5">Rruga Nëna Terezë 22, Pristina</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-600">Medium Risk</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Visit #3</p>
          </div>
        </div>
      </Card>

      {/* Sync status */}
      <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700">Online — form will auto-sync on save</span>
        <button className="ml-auto text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Sync now
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeSection === s ? "bg-indigo-600 text-white" : "bg-white text-slate-500 border border-slate-100 hover:border-indigo-200"}`}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </div>

      {/* Form */}
      <Card className="p-5 mb-4">
        {activeSection === "nutrition" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Nutrition Assessment</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Breastfeeding status</label>
              <div className="flex gap-2">
                {["Exclusive", "Mixed", "Formula only", "Weaned"].map((opt) => (
                  <button key={opt} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Current weight (kg)</label>
              <input type="number" placeholder="e.g. 5.2" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Iron supplementation</label>
              <div className="flex gap-2">
                {["Yes, as prescribed", "Yes, OTC", "No", "Unknown"].map((opt) => (
                  <button key={opt} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nutrition notes</label>
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Observations about feeding patterns, appetite, and caregiver practices..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none pr-10"
                />
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`absolute right-2.5 bottom-2.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isRecording ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600"}`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 mt-1.5 text-red-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Recording… tap mic to stop
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "vaccination" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Vaccination Status</h3>
            {[
              { name: "BCG", due: "At birth", status: "completed" },
              { name: "Hepatitis B (1st dose)", due: "At birth", status: "completed" },
              { name: "DTP-Hib-IPV (1st dose)", due: "2 months", status: "pending" },
              { name: "Pneumococcal (1st dose)", due: "2 months", status: "pending" },
            ].map((v) => (
              <div key={v.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${v.status === "completed" ? "bg-emerald-100" : "bg-slate-200"}`}>
                  {v.status === "completed" ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="text-xs text-slate-500">Due: {v.due}</p>
                </div>
                <Badge variant={v.status === "completed" ? "success" : "muted"}>{v.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {(activeSection === "development" || activeSection === "environment" || activeSection === "risk") && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">{sectionLabels[activeSection]}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">General observations</label>
                <textarea rows={4} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none" placeholder="Enter your observations..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Risk level assessed</label>
                <div className="flex gap-2">
                  {["Low", "Medium", "High"].map((r) => (
                    <button key={r} className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${r === "Low" ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : r === "Medium" ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-red-200 text-red-700 hover:bg-red-50"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Save Draft
        </button>
        <button className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          Submit Visit Record
        </button>
      </div>
    </div>
  );
}

// ─── Child Timeline ───────────────────────────────────────────────────────────

function ChildTimeline() {
  const [filter, setFilter] = useState("all");
  const filters = ["all", "vaccinations", "check-ups", "milestones", "missed"];

  const events = [
    { date: "May 15, 2025", label: "18-month developmental check-up", type: "check-ups", status: "completed", nurse: "Mirela Berisha", detail: "Height: 82cm · Weight: 11.2kg · All milestones met" },
    { date: "Mar 2, 2025", label: "MMR — 1st dose administered", type: "vaccinations", status: "completed", nurse: "Mirela Berisha", detail: "Lot: KSV-4421 · No adverse reactions noted" },
    { date: "Jan 20, 2025", label: "First steps milestone confirmed", type: "milestones", status: "completed", nurse: "Mirela Berisha", detail: "Parent-reported and nurse-verified at 13 months" },
    { date: "Dec 5, 2024", label: "Vitamin D assessment overdue", type: "missed", status: "missed", nurse: "—", detail: "Scheduled but family was unavailable. Rescheduled for Jan" },
    { date: "Nov 12, 2024", label: "12-month developmental check-up", type: "check-ups", status: "completed", nurse: "Mirela Berisha", detail: "Height: 75cm · Weight: 9.8kg" },
    { date: "Sep 4, 2024", label: "DTaP — 3rd dose", type: "vaccinations", status: "completed", nurse: "Mirela Berisha", detail: "Lot: KSV-3819" },
    { date: "Jun 12, 2025", label: "MMR — 2nd dose scheduled", type: "vaccinations", status: "upcoming", nurse: "Mirela Berisha", detail: "Reminder sent to family via SMS" },
  ];

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter || (filter === "missed" && e.status === "missed"));

  const dotColor: Record<string, string> = {
    completed: "bg-emerald-500 border-emerald-200",
    missed: "bg-red-500 border-red-200",
    upcoming: "bg-blue-400 border-blue-200",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ardit Krasniqi — Health Timeline</h1>
          <p className="text-sm text-slate-500">All health events from birth · Born Nov 12, 2023</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Completed</div>
          <div className="flex items-center gap-1 text-red-600"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Missed</div>
          <div className="flex items-center gap-1 text-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Scheduled</div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${filter === f ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100" />
        <div className="space-y-3">
          {filtered.sort((a, b) => {
            const order = { upcoming: 0, completed: 1, missed: 2 };
            return (order[a.status as keyof typeof order] ?? 1) - (order[b.status as keyof typeof order] ?? 1);
          }).map((ev, i) => (
            <div key={i} className="relative">
              <div className={`absolute -left-[21px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor[ev.status]}`} />
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-slate-900">{ev.label}</p>
                    </div>
                    <p className="text-xs text-slate-500">{ev.date} · {ev.nurse}</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ev.detail}</p>
                  </div>
                  <Badge variant={ev.status === "completed" ? "success" : ev.status === "missed" ? "danger" : "info"}>
                    {ev.status}
                  </Badge>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Risk Detection Dashboard ──────────────────────────────────────────────

function AIRiskDashboard() {
  const highRiskChildren = [
    { name: "Lirim Mustafa", age: "15mo", score: 87, reason: "Missed 3 vaccinations + underweight", municipality: "Mitrovica", lastVisit: "42 days ago" },
    { name: "Sara Bajraktari", age: "8mo", score: 81, reason: "Low birth weight + no follow-up nurse visit", municipality: "Mitrovica North", lastVisit: "67 days ago" },
    { name: "Besnik Gashi", age: "2mo", score: 74, reason: "Premature birth, incomplete vaccination schedule", municipality: "Pristina", lastVisit: "11 days ago" },
    { name: "Vlera Kelmendi", age: "6mo", score: 69, reason: "No breastfeeding, maternal health risk factors", municipality: "Gjakova", lastVisit: "28 days ago" },
    { name: "Donat Rexhepi", age: "11mo", score: 63, reason: "Overdue DTaP and developmental check-up", municipality: "Ferizaj", lastVisit: "35 days ago" },
  ];

  const heatmapMunicipalities = [
    { name: "Mitrovica", risk: "critical", children: 4700, highRisk: 312 },
    { name: "Peja", risk: "high", children: 4900, highRisk: 198 },
    { name: "Gjilan", risk: "high", children: 5100, highRisk: 174 },
    { name: "Ferizaj", risk: "medium", children: 4100, highRisk: 121 },
    { name: "Gjakova", risk: "medium", children: 3800, highRisk: 89 },
    { name: "Prizren", risk: "low", children: 8200, highRisk: 67 },
    { name: "Pristina", risk: "low", children: 12400, highRisk: 54 },
  ];

  const riskColor: Record<string, string> = {
    critical: "bg-red-100 border-red-300 text-red-800",
    high: "bg-orange-100 border-orange-300 text-orange-800",
    medium: "bg-amber-100 border-amber-300 text-amber-800",
    low: "bg-emerald-100 border-emerald-300 text-emerald-800",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Risk Detection</h1>
          <p className="text-sm text-slate-500">Predictive analytics · Updated 4 hours ago</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">AI Model: SAFE-Predict v2.1</span>
        </div>
      </div>

      {/* Risk overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="High-Risk Children" value="2,212" icon={AlertTriangle} color="red" delta="↑ 47 this week" />
        <KPICard label="Medium Risk" value="7,200" icon={AlertCircle} color="amber" delta="Monitoring" />
        <KPICard label="Interventions Today" value="89" icon={Zap} color="indigo" delta="34 completed" />
        <KPICard label="Risk Reduced (30d)" value="412" icon={TrendingUp} color="emerald" delta="↓ from high risk" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Risk donut */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {riskDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v.toLocaleString(), "children"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {riskDistribution.map((d) => (
              <div key={d.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-600">{d.label}</span>
                </div>
                <span className="font-semibold text-slate-800">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Alerts */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4">AI-Generated Alerts · Priority Queue</h3>
          <div className="space-y-2.5">
            {[
              { severity: "critical", text: "Mitrovica North: 312 children overdue for MMR — 23% above national average. Immediate nurse deployment recommended.", time: "2h ago" },
              { severity: "high", text: "Peja Region: Cluster of 18 underweight infants detected in Zones 4-6. Nutrition intervention required.", time: "4h ago" },
              { severity: "medium", text: "Gjilan: 47 families have not responded to appointment reminders. Escalate to community health workers.", time: "6h ago" },
              { severity: "low", text: "Pristina Zone 3: Vaccination coverage dipped to 91% — 1.4% below monthly target. No action required yet.", time: "9h ago" },
            ].map((a, i) => {
              const sevStyle: Record<string, string> = {
                critical: "border-red-200 bg-red-50",
                high: "border-orange-200 bg-orange-50",
                medium: "border-amber-200 bg-amber-50",
                low: "border-slate-200 bg-slate-50",
              };
              const sevBadge: Record<string, string> = {
                critical: "text-red-700 bg-red-100",
                high: "text-orange-700 bg-orange-100",
                medium: "text-amber-700 bg-amber-100",
                low: "text-slate-600 bg-slate-100",
              };
              return (
                <div key={i} className={`p-3 rounded-lg border ${sevStyle[a.severity]}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0 mt-0.5 ${sevBadge[a.severity]}`}>{a.severity}</span>
                    <p className="text-xs text-slate-700 leading-relaxed flex-1">{a.text}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* High-risk children table */}
      <Card className="mb-5">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">High-Risk Children — Priority Intervention List</h3>
          <button className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {highRiskChildren.map((c, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 flex-shrink-0">
                {c.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{c.name} <span className="text-slate-400 font-normal">· {c.age}</span></p>
                <p className="text-xs text-slate-500 truncate">{c.reason}</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-xs text-slate-400">Municipality</p>
                <p className="text-xs font-semibold text-slate-700">{c.municipality}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Risk Score</p>
                <p className={`text-sm font-black ${c.score >= 80 ? "text-red-600" : c.score >= 70 ? "text-orange-600" : "text-amber-600"}`}>{c.score}</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-xs text-slate-400">Last visit</p>
                <p className="text-xs font-semibold text-slate-700">{c.lastVisit}</p>
              </div>
              <button className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors flex-shrink-0">
                Assign Nurse
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Heatmap */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Municipality Risk Heatmap</h3>
        <div className="grid grid-cols-4 gap-3">
          {heatmapMunicipalities.map((m) => (
            <div key={m.name} className={`p-4 rounded-xl border-2 ${riskColor[m.risk]}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold">{m.name}</p>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${m.risk === "critical" ? "bg-red-200" : m.risk === "high" ? "bg-orange-200" : m.risk === "medium" ? "bg-amber-200" : "bg-emerald-200"}`}>{m.risk}</span>
              </div>
              <p className="text-lg font-black">{m.highRisk}</p>
              <p className="text-[10px] opacity-70">high-risk of {m.children.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const nurseData = [
    { name: "Mirela Berisha", zone: "Pristina 3", visits: 142, completion: 96, families: 148 },
    { name: "Besarta Kelmendi", zone: "Pristina 1", visits: 138, completion: 94, families: 151 },
    { name: "Lirie Osmani", zone: "Prizren South", visits: 131, completion: 91, families: 142 },
    { name: "Fatmire Hoxha", zone: "Gjilan Central", visits: 127, completion: 89, families: 145 },
    { name: "Vjosa Aliu", zone: "Mitrovica North", visits: 98, completion: 74, families: 139 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Municipal Dashboard — Pristina Region</h1>
          <p className="text-sm text-slate-500">Real-time public health intelligence · May 2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
            Share to Ministry
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <KPICard label="Active Children" value="47,832" icon={Baby} color="indigo" delta="↑ 412 this month" />
        <KPICard label="Vaccination Rate" value="91.4%" icon={Syringe} color="emerald" delta="↑ 1.2% vs last month" />
        <KPICard label="Overdue Interventions" value="1,847" icon={Clock} color="amber" delta="↓ 23 resolved today" />
        <KPICard label="Active Nurses" value="612" icon={Stethoscope} color="blue" delta="94% visit rate" />
        <KPICard label="High-Risk Alerts" value="2,212" icon={AlertTriangle} color="red" delta="89 actioned today" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        {/* Coverage by municipality */}
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Vaccination Coverage by Municipality</h3>
            <Badge variant="success">WHO Target: 90%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={municipalityData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip formatter={(v) => [`${v}%`, "Coverage"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="coverage" radius={[4, 4, 0, 0]}>
                {municipalityData.map((m, i) => (
                  <Cell key={i} fill={m.coverage >= 90 ? "#10B981" : m.coverage >= 87 ? "#F59E0B" : "#EF4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly trend */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Coverage Trend — 2025</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={vaccinationTrend}>
              <defs>
                <linearGradient id="coverageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4338CA" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4338CA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis domain={[84, 97]} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip formatter={(v) => [`${v}%`, "Coverage"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }} />
              <Area type="monotone" dataKey="rate" stroke="#4338CA" strokeWidth={2} fill="url(#coverageGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Nurse performance table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Nurse Performance — This Month</h3>
          <button className="text-xs text-indigo-600 font-semibold hover:underline">View all 612 nurses</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nurse</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zone</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visits</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completion</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Families</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {nurseData.map((n, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {n.name.split(" ").map((x) => x[0]).join("")}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{n.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{n.zone}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 text-right">{n.visits}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${n.completion >= 90 ? "bg-emerald-400" : n.completion >= 80 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${n.completion}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${n.completion >= 90 ? "text-emerald-600" : n.completion >= 80 ? "text-amber-600" : "text-red-600"}`}>{n.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 text-right">{n.families}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="text-xs text-indigo-600 font-semibold hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Messaging Module ─────────────────────────────────────────────────────────

function MessagingModule() {
  const [activeConv, setActiveConv] = useState(0);
  const [message, setMessage] = useState("");

  const conversations = [
    { name: "Mirela Berisha (Nurse)", avatar: "MB", lastMessage: "Ardit's next visit is confirmed for June 5", time: "2m ago", unread: 2, type: "nurse" },
    { name: "Pristina Health Center", avatar: "PH", lastMessage: "Your vaccination reminder: MMR due June 12", time: "1h ago", unread: 0, type: "system" },
    { name: "Dr. Adnan Hoxha", avatar: "AH", lastMessage: "Please bring Ardit's health record booklet", time: "Yesterday", unread: 0, type: "doctor" },
    { name: "SAFE Platform", avatar: "SP", lastMessage: "New AI insight available for Ardit", time: "2d ago", unread: 1, type: "system" },
  ];

  const messages = [
    { sender: "nurse", text: "Good morning! I wanted to confirm Ardit's 18-month check-up for June 5 at 10:00 AM. Will this time work for the family?", time: "09:14" },
    { sender: "parent", text: "Yes, that works perfectly. We will be home all morning.", time: "09:22" },
    { sender: "nurse", text: "Excellent. Please make sure Ardit has not eaten for at least 2 hours before the blood draw. Also, bring his yellow vaccination booklet.", time: "09:24" },
    { sender: "parent", text: "Understood, thank you Mirela. One question — he has had a mild cough for 2 days. Should we still go ahead?", time: "09:31" },
    { sender: "nurse", text: "A mild cough is fine as long as he does not have a fever above 38°C. If he develops fever today, please message me and we can reschedule.", time: "09:35" },
    { sender: "system", text: "⚑ Appointment confirmed for June 5, 10:00 AM · Pristina Zone 3 Home Visit", time: "09:36" },
    { sender: "parent", text: "Perfect. Thank you so much!", time: "09:38" },
  ];

  return (
    <div className="h-full flex overflow-hidden" style={{ maxHeight: "calc(100vh - 56px)" }}>
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300 bg-slate-50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {conversations.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveConv(i)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors ${activeConv === i ? "bg-indigo-50" : ""}`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${activeConv === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold truncate ${activeConv === i ? "text-indigo-700" : "text-slate-800"}`}>{c.name}</p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{c.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
                  {c.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* Chat header */}
        <div className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
            {conversations[activeConv].avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{conversations[activeConv].name}</p>
            <p className="text-xs text-emerald-600 font-medium">● Online</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="success"><Shield className="w-2.5 h-2.5" /> End-to-end encrypted</Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.map((m, i) => {
            if (m.sender === "system") {
              return (
                <div key={i} className="text-center">
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-100 px-3 py-1 rounded-full">{m.text}</span>
                </div>
              );
            }
            const isParent = m.sender === "parent";
            return (
              <div key={i} className={`flex ${isParent ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-sm ${isParent ? "" : ""}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isParent ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                  <p className={`text-[10px] text-slate-400 mt-1 ${isParent ? "text-right" : ""}`}>{m.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a secure message..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50"
            />
            <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage() {
  const [language, setLanguage] = useState("sq");
  const [notifications, setNotifications] = useState({ sms: true, push: true, email: false, reminders: true });

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const languages = [
    { code: "sq", label: "Albanian (Shqip)", flag: "🇽🇰" },
    { code: "sr", label: "Serbian (Srpski)", flag: "🇷🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Family profile */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Family Information</h3>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">FK</div>
          <div>
            <p className="font-bold text-slate-900">Fatmir Krasniqi</p>
            <p className="text-sm text-slate-500">Parent / Guardian · Pristina</p>
            <Badge variant="success" ><Check className="w-2.5 h-2.5" /> Verified</Badge>
          </div>
          <button className="ml-auto px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Edit Profile</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Full Name", value: "Fatmir Krasniqi" },
            { label: "Phone", value: "+383 44 512 788" },
            { label: "Municipality", value: "Pristina" },
            { label: "Address", value: "Rruga Dardania 14" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-slate-400 font-semibold">{f.label}</label>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Child profiles */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Child Profiles</h3>
          <button className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add child
          </button>
        </div>
        <div className="space-y-3">
          {[
            { initials: "AK", name: "Ardit Krasniqi", detail: "18 months · Male · Health Score 82", status: "active" },
            { initials: "MK", name: "Mimoza Krasniqi", detail: "4 years · Female · Health Score 94", status: "active" },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0">{c.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">{c.detail}</p>
              </div>
              <Badge variant="success">{c.status}</Badge>
              <button className="text-xs text-indigo-600 font-semibold hover:underline">Manage</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Language */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Language / Gjuha / Jezik</h3>
        <div className="space-y-2">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${language === l.code ? "border-indigo-300 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}
            >
              <span className="text-lg">{l.flag}</span>
              <span className={`text-sm font-semibold ${language === l.code ? "text-indigo-700" : "text-slate-700"}`}>{l.label}</span>
              {language === l.code && <Check className="w-4 h-4 text-indigo-600 ml-auto" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Notification Preferences</h3>
        <div className="space-y-3">
          {[
            { key: "sms" as const, label: "SMS Reminders", desc: "Vaccination and appointment reminders via SMS" },
            { key: "push" as const, label: "Push Notifications", desc: "App notifications for nurse messages and alerts" },
            { key: "email" as const, label: "Email Updates", desc: "Monthly health summary reports" },
            { key: "reminders" as const, label: "AI Health Insights", desc: "Preventive care recommendations from SAFE AI" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-slate-800">{n.label}</p>
                <p className="text-xs text-slate-500">{n.desc}</p>
              </div>
              <button
                onClick={() => toggle(n.key)}
                className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${notifications[n.key] ? "bg-indigo-600" : "bg-slate-200"}`}
                style={{ width: 40, height: 22 }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${notifications[n.key] ? "translate-x-[18px]" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Privacy & Healthcare Consent</h3>
        <div className="space-y-3">
          {[
            { label: "Share data with Kosovo Ministry of Health", granted: true },
            { label: "Allow anonymised data for national health research", granted: true },
            { label: "Share child records with assigned nurse", granted: true },
            { label: "Allow SAFE AI to analyse health patterns", granted: true },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <p className="text-sm text-slate-700">{c.label}</p>
              <Badge variant={c.granted ? "success" : "muted"}>{c.granted ? "Granted" : "Denied"}</Badge>
            </div>
          ))}
        </div>
        <button className="mt-4 text-xs text-red-600 font-semibold hover:underline">Revoke all consent & delete data</button>
      </Card>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [activePage, setActivePage] = useState<Page>("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} open={sidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar activePage={activePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto">
          {activePage === "landing" && <LandingPage setActivePage={setActivePage} />}
          {activePage === "login" && <LoginPage setActivePage={setActivePage} />}
          {activePage === "parent" && <ParentDashboard />}
          {activePage === "nurse" && <NurseDashboard />}
          {activePage === "visit" && <HomeVisitForm />}
          {activePage === "timeline" && <ChildTimeline />}
          {activePage === "ai-risk" && <AIRiskDashboard />}
          {activePage === "admin" && <AdminDashboard />}
          {activePage === "messaging" && <MessagingModule />}
          {activePage === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
