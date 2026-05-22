import { useEffect, useRef, useState } from "react";
import {
  Home, Lock, Heart, Stethoscope, ClipboardList, Activity,
  AlertTriangle, BarChart3, MessageSquare, Settings, Bell,
  Search, Shield, Baby, CheckCircle2, XCircle, Clock,
  ArrowRight, Phone, Wifi, WifiOff, Mic, Send,
  Plus, Download, User, Menu, X, TrendingUp,
  Globe, Eye, EyeOff, AlertCircle,
  ChevronRight, ChevronDown, Zap, Users, MoreHorizontal,
  Building2, Syringe, Info, Check, RefreshCw, MapPin,
  Star, FileText, Mail, QrCode, ShieldCheck, Fingerprint,
  CalendarDays, Thermometer, AlertOctagon, ScanLine
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { apiRequest, clearSession, getStoredToken, getStoredUser, login, registerAccount, storeSession, type SafeUser } from "./lib/api";

type Page =
  | "landing" | "login" | "parent" | "nurse"
  | "visit" | "timeline" | "ai-risk" | "admin"
  | "messaging" | "settings" | "passport";

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
  { id: "passport", label: "Health Passport", icon: Shield, group: "Portals" },
  { id: "nurse", label: "Nurse App", icon: Stethoscope, group: "Portals" },
  { id: "visit", label: "Home Visit Form", icon: ClipboardList, group: "Portals" },
  { id: "timeline", label: "Child Timeline", icon: Activity, group: "Clinical" },
  { id: "ai-risk", label: "AI Risk Detection", icon: AlertTriangle, group: "Clinical" },
  { id: "admin", label: "Admin Dashboard", icon: BarChart3, group: "Management" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, group: "Management" },
  { id: "settings", label: "Settings", icon: Settings, group: "Management" },
];

const pagesByRole: Record<SafeUser["role"], Page[]> = {
  parent: ["parent", "passport", "timeline", "messaging", "settings"],
  doctor: ["nurse", "passport", "visit", "timeline", "ai-risk", "messaging", "settings"],
  admin: ["admin", "ai-risk", "nurse", "messaging", "settings"],
};

function allowedPagesFor(user: SafeUser | null): Page[] {
  if (!user) return ["landing", "login"];
  return pagesByRole[user.role];
}

function defaultPageFor(user: SafeUser | null): Page {
  if (!user) return "landing";
  if (user.role === "parent") return "parent";
  if (user.role === "doctor") return "nurse";
  return "admin";
}

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

const aiRiskDistribution = [
  { label: "Low Risk", value: 38420, color: "#10B981" },
  { label: "Medium Risk", value: 7200, color: "#F59E0B" },
  { label: "High Risk", value: 2212, color: "#EF4444" },
];

function formatDisplayDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function initialsFor(name?: string | null) {
  return (name || "SAFE User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SU";
}

function childAgeLabel(dateOfBirth?: string | null) {
  if (!dateOfBirth) return "Age not set";
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - dob.getFullYear()) * 12 + now.getMonth() - dob.getMonth());
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

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
  activePage, setActivePage, open, user, onLogout,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
  open: boolean;
  user: SafeUser | null;
  onLogout: () => void;
}) {
  const groups = ["Explore", "Portals", "Clinical", "Management"];
  const visiblePages = allowedPagesFor(user);
  const visibleNavItems = navItems.filter((item) => visiblePages.includes(item.id));
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
          const items = visibleNavItems.filter((n) => n.group === group);
          if (items.length === 0) return null;
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
          <span className="text-white text-xs font-bold">{user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "DS"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">{user?.name || "Demo Session"}</p>
          <p className="text-indigo-300 text-[10px] truncate">{user?.role || "Not signed in"}</p>
        </div>
        {user && (
          <button
            onClick={onLogout}
            title="Log out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Top bar ────────────────────────────────────────────────────────────────

function TopBar({
  activePage, sidebarOpen, setSidebarOpen, user,
}: {
  activePage: Page;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  user: SafeUser | null;
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const labels: Record<Page, string> = {
    landing: "Platform Overview",
    login: "Login & Authentication",
    parent: "Family Portal",
    nurse: "Provider Dashboard",
    visit: "Home Visit",
    timeline: "Child Health Timeline",
    "ai-risk": "AI Risk Detection",
    admin: "Admin Dashboard",
    messaging: "Secure Messaging",
    settings: "Settings & Profile",
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    apiRequest<{ notifications: any[] }>("/notifications")
      .then((data) => setNotifications(data.notifications))
      .catch(() => setNotifications([]));
  }, [user, activePage]);

  const unreadCount = notifications.filter((item) => item.status === "unread").length;

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
        <div className="relative">
        <button
          onClick={() => setShowNotifications((value) => !value)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors relative"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>}
        </button>
        {showNotifications && (
          <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              <span className="text-[10px] text-slate-400">{notifications.length} total</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 && <p className="p-4 text-sm text-slate-500">No notifications yet.</p>}
              {notifications.slice(0, 8).map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1 w-2 h-2 rounded-full ${item.status === "unread" ? "bg-indigo-500" : "bg-slate-300"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.body}</p>
                      {item.due_at && <p className="text-[10px] text-slate-400 mt-1">Due {formatDisplayDate(item.due_at)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-700 text-xs font-bold">{initialsFor(user?.name)}</span>
        </div>
      </div>
    </header>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────

function LandingPage({ setActivePage, user }: { setActivePage: (p: Page) => void; user: SafeUser | null }) {
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
                onClick={() => setActivePage(user ? defaultPageFor(user) : "login")}
                className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm"
              >
                <Baby className="w-4 h-4" /> Track Child Health
              </button>
              <button
                onClick={() => setActivePage(user?.role === "doctor" ? "nurse" : user?.role === "admin" ? "admin" : "login")}
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
                {[["Live", "Children"], ["API", "Vaccination"], ["SAFE", "Care Teams"]].map(([v, l]) => (
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
            { value: "Live", label: "Children Monitored", icon: Baby, color: "text-indigo-600" },
            { value: "API", label: "Vaccination Coverage", icon: Syringe, color: "text-emerald-600" },
            { value: "SAFE", label: "Municipalities Connected", icon: MapPin, color: "text-blue-600" },
            { value: "Team", label: "Active Providers", icon: Stethoscope, color: "text-indigo-600" },
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
          <p className="text-indigo-200 mb-8">Use SAFE with your real child health records, appointments, reminders, and provider dashboards.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setActivePage("login")} className="bg-white text-indigo-700 font-semibold px-7 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-sm">
              Get Started Today
            </button>
            <button onClick={() => setActivePage(user?.role === "admin" ? "admin" : "login")} className="bg-indigo-500/30 border border-white/30 text-white font-semibold px-7 py-3 rounded-lg hover:bg-indigo-500/40 transition-colors text-sm">
              View Live Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Login Page ──────────────────────────────────────────────────────────────

function LoginPage({
  setActivePage,
  onLogin,
}: {
  setActivePage: (p: Page) => void;
  onLogin: (user: SafeUser) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<"role" | "phone" | "otp">("role");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("parent@safe.test");
  const [password, setPassword] = useState("Password123!");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPhone, setShowPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

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

  const demoAccounts: Record<string, string> = {
    parent: "parent@safe.test",
    nurse: "doctor@safe.test",
    manager: "admin@safe.test",
    ministry: "admin@safe.test",
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEmail(demoAccounts[role] || "parent@safe.test");
    setAuthError("");
  };

  const handleLogin = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setAuthError("");
    try {
      const session = await login(email, password);
      onLogin(session.user);
      setActivePage(destination[selectedRole] ?? "parent");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
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
                    onClick={() => handleRoleSelect(r.id)}
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
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm mb-3"
              >
                {isSubmitting ? "Signing in..." : "Verify & Sign In"}
              </button>
              <p className="text-xs text-center text-slate-400">Didn't receive it? <button className="text-indigo-600 font-semibold">Resend code</button></p>
            </div>
          )}
        </Card>
        {authError && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

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

function AuthPage({
  setActivePage,
  onLogin,
}: {
  setActivePage: (p: Page) => void;
  onLogin: (user: SafeUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"parent" | "doctor" | "admin">("parent");
  const [name, setName] = useState("Demo Parent");
  const [email, setEmail] = useState("parent@safe.test");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const roleOptions = [
    { id: "parent", label: "Parent", icon: Heart, demoEmail: "parent@safe.test" },
    { id: "doctor", label: "Doctor", icon: Stethoscope, demoEmail: "doctor@safe.test" },
    { id: "admin", label: "Admin", icon: Building2, demoEmail: "admin@safe.test" },
  ] as const;

  const destinationFor = (userRole: SafeUser["role"]): Page => {
    if (userRole === "parent") return "parent";
    if (userRole === "doctor") return "nurse";
    return "admin";
  };

  const selectRole = (nextRole: typeof role) => {
    setRole(nextRole);
    setError("");
    setMessage("");
    const demo = roleOptions.find((item) => item.id === nextRole);
    if (mode === "login" && demo) setEmail(demo.demoEmail);
    if (mode === "register") setEmail("");
  };

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setError("");
    setMessage("");
    if (nextMode === "login") {
      const demo = roleOptions.find((item) => item.id === role);
      setEmail(demo?.demoEmail || "parent@safe.test");
      setPassword("Password123!");
    } else {
      if (role === "admin") setRole("parent");
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const session = mode === "login"
        ? await login(email, password)
        : await registerAccount(name, email, password, role === "admin" ? "doctor" : role);

      onLogin(session.user);
      setMessage(mode === "login" ? "Logged in successfully." : "Account created successfully.");
      setActivePage(destinationFor(session.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{mode === "login" ? "Sign in to SAFE" : "Create SAFE account"}</h1>
          <p className="text-slate-500 text-sm">Connected to the Express backend with JWT authentication</p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 mb-5">
            <button onClick={() => switchMode("login")} className={`py-2 rounded-lg text-sm font-semibold ${mode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>
              Login
            </button>
            <button onClick={() => switchMode("register")} className={`py-2 rounded-lg text-sm font-semibold ${mode === "register" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}>
              Sign up
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {roleOptions.map((item) => {
              const Icon = item.icon;
              const disabled = mode === "register" && item.id === "admin";
              return (
                <button
                  key={item.id}
                  disabled={disabled}
                  onClick={() => selectRole(item.id)}
                  className={`p-3 rounded-xl border text-center transition-all disabled:opacity-40 ${role === item.id ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"}`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required />
              </div>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg disabled:opacity-40 hover:bg-indigo-700 transition-colors text-sm">
              {isSubmitting ? "Please wait..." : mode === "login" ? "Login with backend" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-4 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
              Demo password for seeded accounts: <span className="font-semibold text-slate-700">Password123!</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

type ParentOverviewResponse = {
  overview: {
    childrenCount: number;
    highRiskChildren: number;
    children: Array<{
      child: {
        id: string;
        full_name: string;
        date_of_birth: string;
        gender: string;
      };
      riskScore: number;
      riskBand: string;
      upcomingCount: number;
      overdueCount: number;
      vaccinationCount: number;
      checkupCount: number;
      milestoneCount: number;
    }>;
  };
};

type ReminderResponse = {
  reminders: Array<{
    type: string;
    severity: string;
    dueDate: string;
    item: Record<string, string>;
  }>;
};

type MissedActionsResponse = {
  missedActions: Array<{
    type: string;
    severity: string;
    dueDate: string;
    item: Record<string, string>;
    child: { full_name: string };
  }>;
};

type TimelineResponse = {
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    date: string;
  }>;
};

type Appointment = {
  id: string;
  child_id: string;
  child_name: string;
  provider_name?: string;
  type: string;
  scheduled_at: string;
  location?: string;
  notes?: string;
  status: string;
  parent_response?: string;
  requested_time?: string;
};

type AppointmentsResponse = {
  appointments: Appointment[];
};

function ParentDashboard({ user, onLogout }: { user: SafeUser | null; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState<ParentOverviewResponse["overview"] | null>(null);
  const [backendReminders, setBackendReminders] = useState<ReminderResponse["reminders"]>([]);
  const [backendTimeline, setBackendTimeline] = useState<TimelineResponse["timeline"]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [missedActions, setMissedActions] = useState<MissedActionsResponse["missedActions"]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [newChild, setNewChild] = useState({ fullName: "", dateOfBirth: "", gender: "female" });

  // AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [childMessage, setChildMessage] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [selectedChildId, setSelectedChildId] = useState("");
  const tabs = ["overview", "appointments", "timeline", "messages"];

  const loadDashboard = async () => {
    if (!getStoredToken()) return;
    setLoading(true);
    setLoadError("");
    try {
      const overviewData = await apiRequest<ParentOverviewResponse>("/dashboard/parent/overview");
      setOverview(overviewData.overview);
      const remindersData = await apiRequest<ReminderResponse>("/dashboard/reminders/upcoming");
      setBackendReminders(remindersData.reminders);
      const appointmentsData = await apiRequest<AppointmentsResponse>("/appointments");
      setAppointments(appointmentsData.appointments);
      const missedData = await apiRequest<MissedActionsResponse>("/dashboard/actions/missed");
      setMissedActions(missedData.missedActions);

      const activeChildId = selectedChildId || overviewData.overview.children[0]?.child.id;
      if (activeChildId && !selectedChildId) setSelectedChildId(activeChildId);
      if (activeChildId) {
        const timelineData = await apiRequest<TimelineResponse>(`/dashboard/children/${activeChildId}/timeline`);
        setBackendTimeline(timelineData.timeline);
      } else {
        setBackendTimeline([]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedChildId]);

  const createChild = async (event: React.FormEvent) => {
    event.preventDefault();
    setChildMessage("");
    setLoadError("");
    try {
      const created = await apiRequest<{ child: { id: string } }>("/children", {
        method: "POST",
        body: newChild,
      });
      setNewChild({ fullName: "", dateOfBirth: "", gender: "female" });
      setSelectedChildId(created.child.id);
      setChildMessage("Child profile created.");
      await loadDashboard();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not create child");
    }
  };

  const respondToAppointment = async (appointmentId: string, action: "confirm" | "reschedule" | "cancel") => {
    setAppointmentMessage("");
    const body = action === "reschedule"
      ? {
        action,
        requestedTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        message: "Parent requested a later appointment time.",
      }
      : { action, message: action === "confirm" ? "Parent confirmed attendance." : "Parent cannot attend this appointment." };

    await apiRequest(`/appointments/${appointmentId}/respond`, { method: "PATCH", body });
    setAppointmentMessage(action === "confirm" ? "Appointment confirmed." : action === "reschedule" ? "New time requested." : "Appointment cancelled.");
    const data = await apiRequest<AppointmentsResponse>("/appointments");
    setAppointments(data.appointments);
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const next = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(next);
    setChatInput("");
    setChatLoading(true);
    try {
      const data = await apiRequest<{ reply: string }>("/chat", {
        method: "POST",
        body: { messages: next },
      });
      setChatMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages([...next, { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Could not reach the AI service."}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const upcomingVaccines: any[] = [];

  const timelineEvents: any[] = [];

  const statusColor: Record<string, string> = {
    completed: "text-emerald-600 bg-emerald-50 border-emerald-100",
    missed: "text-red-600 bg-red-50 border-red-100",
    upcoming: "text-blue-600 bg-blue-50 border-blue-100",
  };

  const childSummary = overview?.children[0];
  const selectedChildSummary = overview?.children.find((item) => item.child.id === selectedChildId) || childSummary;
  const child = selectedChildSummary?.child;
  const childName = child?.full_name || "No child selected";
  const initials = childName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const healthScore = selectedChildSummary ? Math.max(0, 100 - selectedChildSummary.riskScore) : 82;
  const visibleVaccines = backendReminders.length > 0
    ? backendReminders.filter((item) => item.type === "vaccination").map((item) => ({
      name: item.item.vaccine_name || "Vaccination",
      date: item.dueDate,
      status: item.severity,
    }))
    : upcomingVaccines;
  const visibleTimeline = backendTimeline.length > 0
    ? backendTimeline.map((event) => ({
      date: event.date,
      label: event.title,
      type: event.type,
      status: event.status,
      nurse: "SAFE backend",
    }))
    : timelineEvents;
  const childAppointments = selectedChildId ? appointments.filter((item) => item.child_id === selectedChildId) : appointments;
  const upcomingAppointments = childAppointments.filter((item) => !["completed", "cancelled", "missed"].includes(item.status));
  const pastAppointments = childAppointments.filter((item) => ["completed", "cancelled", "missed"].includes(item.status));
  const nextAppointment = upcomingAppointments[0] || appointments[0];
  const selectedMissedActions = missedActions.filter((item) => !selectedChildId || item.child?.full_name === childName);
  const nextReminder = backendReminders.find((item) => !selectedChildId || item.item.child_id === selectedChildId) || backendReminders[0];
  const vaccinationCompleted = selectedChildSummary?.vaccinationCount
    ? Math.max(0, selectedChildSummary.vaccinationCount - selectedChildSummary.overdueCount)
    : 0;
  const vaccinationTotal = selectedChildSummary?.vaccinationCount || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Child card */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
            {initials || "AK"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{childName}</h2>
            <p className="text-indigo-200 text-sm">{child ? `Born ${new Date(child.date_of_birth).toLocaleDateString()} · ${child.gender}` : "No child selected"}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">
                <span className="text-indigo-100 text-[10px] font-semibold">Health Score: {healthScore}/100</span>
              </Badge>
              {loading && <Badge variant="info">Loading backend data</Badge>}
              {loadError && <Badge variant="danger">Backend offline</Badge>}
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-indigo-200 text-xs">Signed in as</p>
            <p className="font-semibold text-sm">{user?.name || "Demo Session"}</p>
            <button onClick={onLogout} className="text-indigo-200 text-xs hover:text-white">Sign out</button>
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

      {overview && (
        <Card className="p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div>
              <div className="flex items-start gap-3 mb-3">
                <Baby className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">My Children</h3>
                  <p className="text-xs text-slate-500">Select a child profile or add another child.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {overview.children.map((summary) => (
                  <button
                    key={summary.child.id}
                    onClick={() => setSelectedChildId(summary.child.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedChildId === summary.child.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-200"
                    }`}
                  >
                    {summary.child.full_name}
                  </button>
                ))}
                {overview.children.length === 0 && <p className="text-xs text-slate-500">No child profiles yet.</p>}
              </div>
            </div>
            <form onSubmit={createChild} className="grid md:grid-cols-4 gap-3 flex-1">
              <input
                value={newChild.fullName}
                onChange={(event) => setNewChild((value) => ({ ...value, fullName: event.target.value }))}
                placeholder="Full name"
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                required
              />
              <input
                type="date"
                value={newChild.dateOfBirth}
                onChange={(event) => setNewChild((value) => ({ ...value, dateOfBirth: event.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                required
              />
              <select
                value={newChild.gender}
                onChange={(event) => setNewChild((value) => ({ ...value, gender: event.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
              <button className="bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                Add child
              </button>
            </form>
          </div>
          {childMessage && <p className="text-xs text-emerald-600 font-semibold mt-3">{childMessage}</p>}
        </Card>
      )}

      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {nextAppointment && (
              <Card className="p-5 border-indigo-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Next Appointment</p>
                    <h3 className="text-base font-bold text-slate-900 capitalize">{nextAppointment.type.replace("_", " ")}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(nextAppointment.scheduled_at).toLocaleString()} · {nextAppointment.location || "Location pending"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{nextAppointment.notes}</p>
                  </div>
                  <Badge variant={nextAppointment.status === "confirmed" ? "success" : nextAppointment.status === "missed" ? "danger" : "warning"}>
                    {nextAppointment.status.replace("_", " ")}
                  </Badge>
                </div>
                {nextAppointment.status === "scheduled" && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => respondToAppointment(nextAppointment.id, "confirm")} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100">
                      Confirm
                    </button>
                    <button onClick={() => respondToAppointment(nextAppointment.id, "reschedule")} className="px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100">
                      Request new time
                    </button>
                    <button onClick={() => respondToAppointment(nextAppointment.id, "cancel")} className="px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100">
                      Cannot attend
                    </button>
                  </div>
                )}
                {appointmentMessage && <p className="text-xs text-emerald-600 font-semibold mt-3">{appointmentMessage}</p>}
              </Card>
            )}
            <Card className="p-5">
              <VaccineProgress completed={vaccinationCompleted} total={Math.max(vaccinationTotal, 1)} />
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upcoming Vaccinations</p>
                {visibleVaccines.map((v) => (
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
              <p className="text-xs text-slate-600 leading-relaxed">
                {nextReminder
                  ? `${childName} has an upcoming ${nextReminder.type} due on ${new Date(nextReminder.dueDate).toLocaleDateString()}.`
                  : selectedMissedActions[0]
                    ? `${childName} has missed or delayed care that needs follow-up.`
                    : `${childName} currently has no urgent preventive care alerts.`}
              </p>
              <button className="mt-3 text-xs text-indigo-600 font-semibold hover:underline">Learn more →</button>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Alerts</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">{nextAppointment ? `${nextAppointment.type.replace("_", " ")} appointment · ${nextAppointment.status.replace("_", " ")}` : "No pending appointment"}</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{selectedMissedActions[0] ? `${selectedMissedActions[0].type} ${selectedMissedActions[0].severity} · due ${new Date(selectedMissedActions[0].dueDate).toLocaleDateString()}` : "No overdue care"}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Upcoming Appointments</h3>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 && <p className="text-sm text-slate-500">No upcoming appointments.</p>}
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800 capitalize">{appointment.type.replace("_", " ")}</p>
                      <p className="text-xs text-slate-500">{new Date(appointment.scheduled_at).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">{appointment.location}</p>
                    </div>
                    <Badge variant={appointment.status === "confirmed" ? "success" : appointment.status === "reschedule_requested" ? "warning" : "info"}>
                      {appointment.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {appointment.notes && <p className="text-xs text-slate-600 mt-2">{appointment.notes}</p>}
                  {appointment.status === "scheduled" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => respondToAppointment(appointment.id, "confirm")} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        Confirm
                      </button>
                      <button onClick={() => respondToAppointment(appointment.id, "reschedule")} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold">
                        Request new time
                      </button>
                      <button onClick={() => respondToAppointment(appointment.id, "cancel")} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                        Cannot attend
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Past Appointments</h3>
            <div className="space-y-3">
              {pastAppointments.length === 0 && <p className="text-sm text-slate-500">No past appointments yet.</p>}
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{appointment.type.replace("_", " ")}</p>
                      <p className="text-xs text-slate-500">{new Date(appointment.scheduled_at).toLocaleString()}</p>
                    </div>
                    <Badge variant={appointment.status === "missed" ? "danger" : appointment.status === "completed" ? "success" : "muted"}>
                      {appointment.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="relative pl-6 space-y-1">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
          {visibleTimeline.map((ev, i) => (
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
          <p className="text-xs text-slate-500 mt-1 mb-4">Care team</p>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Open Conversation
          </button>
        </Card>
      )}

      {/* AI Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" style={{ height: 480 }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600">
              <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">AI Health Assistant</p>
                <p className="text-xs text-indigo-200">Ask about your child's health</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
              {chatMessages.length === 0 && (
                <div className="text-center pt-8">
                  <Zap className="w-10 h-10 text-indigo-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Hi {user?.name?.split(" ")[0] || "there"}!</p>
                  <p className="text-xs text-slate-500 mt-1">Ask me anything about your child's vaccinations, appointments, or milestones.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {["Is my child's vaccination up to date?", "When is the next appointment?", "What milestones should I expect?"].map((q) => (
                      <button key={q} onClick={async () => {
                        const next = [...chatMessages, { role: "user" as const, content: q }];
                        setChatMessages(next);
                        setChatLoading(true);
                        try {
                          const data = await apiRequest<{ reply: string }>("/chat", { method: "POST", body: { messages: next } });
                          setChatMessages([...next, { role: "assistant", content: data.reply }]);
                        } catch {
                          setChatMessages([...next, { role: "assistant", content: "Sorry, I could not reach the AI service. Please try again." }]);
                        } finally {
                          setChatLoading(false);
                          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
                        }
                      }} className="text-left text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-100 bg-white flex gap-2">
              <input
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 transition-colors"
                placeholder="Type a message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setChatOpen((o) => !o)}
          className="w-14 h-14 rounded-full bg-indigo-600 shadow-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI health assistant"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}

// ─── Health Passport ──────────────────────────────────────────────────────────

type PassportData = {
  child: {
    id: string; full_name: string; date_of_birth: string; gender: string;
    parent_name: string; parent_phone: string; municipality: string;
  };
  vaccinations: { vaccine_name: string; status: string; recommended_date: string; scheduled_date: string; completed_date?: string }[];
  checkups: { checkup_type: string; status: string; scheduled_date: string; completed_date?: string; notes?: string }[];
  milestones: { title: string; status: string; expected_date: string; achieved_date?: string }[];
  recentVisits: { completed_at?: string; scheduled_at: string; nurse_name: string; nutrition_notes?: string; risk_notes?: string }[];
  appointments: { type: string; scheduled_at: string; status: string }[];
  risk: { score: number; level: string; reasons: string[] } | null;
};

function HealthPassport({ user }: { user: SafeUser | null }) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "vaccinations" | "visits" | "appointments">("overview");
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);

  useEffect(() => {
    apiRequest<{ children: any[] }>("/children").then((d) => {
      setChildren(d.children);
      if (d.children[0]) setSelectedChildId(d.children[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    setError("");
    setPassport(null);
    setQrDataUrl("");
    apiRequest<{ passport: PassportData }>(`/passport/${selectedChildId}`)
      .then((d) => setPassport(d.passport))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const generateQR = async () => {
    if (!selectedChildId) return;
    setQrLoading(true);
    try {
      const { token } = await apiRequest<{ token: string }>(`/passport/${selectedChildId}/token`, { method: "POST" });
      const verifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(token)}`;
      const QRCode = await import("qrcode");
      const url = await QRCode.toDataURL(verifyUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#1E1B4B", light: "#FFFFFF" },
      });
      setQrDataUrl(url);
      setTokenExpiry(new Date(Date.now() + 15 * 60 * 1000));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setQrLoading(false);
    }
  };

  const child = passport?.child;
  const dob = child?.date_of_birth ? new Date(child.date_of_birth) : null;
  const ageMonths = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;
  const ageLabel = ageMonths >= 24 ? `${Math.floor(ageMonths / 12)} yrs` : `${ageMonths} mo`;

  const vacCompleted = passport?.vaccinations.filter((v) => v.status === "completed").length ?? 0;
  const vacTotal = passport?.vaccinations.length ?? 0;
  const vacMissed = passport?.vaccinations.filter((v) => v.status === "missed").length ?? 0;

  const riskColor = {
    low: "text-emerald-600 bg-emerald-50 border-emerald-200",
    moderate: "text-amber-600 bg-amber-50 border-amber-200",
    high: "text-orange-600 bg-orange-50 border-orange-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  }[passport?.risk?.level ?? "low"] ?? "text-slate-600 bg-slate-50 border-slate-200";

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "text-emerald-700 bg-emerald-50 border border-emerald-200",
      missed: "text-red-700 bg-red-50 border border-red-200",
      pending: "text-blue-700 bg-blue-50 border border-blue-200",
      delayed: "text-amber-700 bg-amber-50 border border-amber-200",
    };
    return map[status] ?? "text-slate-600 bg-slate-50 border border-slate-200";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Health Passport
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Digital healthcare identity — Kosovo Child Health Platform</p>
        </div>
        {children.length > 1 && (
          <select
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-indigo-400"
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
          >
            {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {loading && <div className="text-center py-16 text-slate-400 text-sm">Loading passport…</div>}

      {passport && (
        <div className="space-y-6">
          {/* Passport Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)" }}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 border border-white/30">
                    <span className="text-white text-2xl font-bold">{child?.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Republic of Kosovo</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                    </div>
                    <h2 className="text-white text-2xl font-bold">{child?.full_name}</h2>
                    <p className="text-indigo-200 text-sm mt-0.5">{ageLabel} · {child?.gender} · {child?.municipality || "Kosovo"}</p>
                  </div>
                </div>
                {/* Passport ID badge */}
                <div className="text-right">
                  <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Passport ID</p>
                  <p className="text-white font-mono text-sm">{child?.id.split("-")[0].toUpperCase()}</p>
                  <div className="mt-2 flex items-center gap-1 justify-end">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="text-indigo-300 text-[10px]">Digitally Signed</span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Vaccines Done", value: `${vacCompleted}/${vacTotal}`, icon: Syringe, ok: vacMissed === 0 },
                  { label: "Risk Level", value: passport.risk?.level ?? "N/A", icon: AlertOctagon, ok: !["high", "critical"].includes(passport.risk?.level ?? "") },
                  { label: "Visits", value: String(passport.recentVisits.length), icon: CalendarDays, ok: true },
                ].map(({ label, value, icon: Icon, ok }) => (
                  <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${ok ? "text-emerald-300" : "text-red-300"}`} />
                      <span className="text-indigo-200 text-[10px] uppercase tracking-wide font-semibold">{label}</span>
                    </div>
                    <p className="text-white font-bold text-lg capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  Scan-to-Verify QR Code
                </h3>
                <p className="text-sm text-slate-500 mt-1">Generate a secure, time-limited QR code. Healthcare providers scan it to instantly view this child's full health record.</p>
                <ul className="mt-3 space-y-1.5">
                  {["Valid for 15 minutes only", "Cryptographically signed", "No account required to scan", "Audit-logged on every scan"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={generateQR}
                  disabled={qrLoading}
                  className="mt-4 flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  {qrLoading ? "Generating…" : qrDataUrl ? "Regenerate QR" : "Generate QR Code"}
                </button>
                {tokenExpiry && qrDataUrl && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires at {tokenExpiry.toLocaleTimeString()}
                  </p>
                )}
              </div>
              {qrDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-inner">
                    <img src={qrDataUrl} alt="Health Passport QR" width={160} height={160} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Scan with any camera<br />or QR reader</p>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-200" />
                </div>
              )}
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(["overview", "vaccinations", "visits", "appointments"] as const).map((s) => (
              <button key={s} onClick={() => setActiveSection(s)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all capitalize ${activeSection === s ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeSection === "overview" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Risk */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertOctagon className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-slate-800 text-sm">Preventive Risk</h4>
                </div>
                {passport.risk ? (
                  <>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border capitalize ${riskColor}`}>
                      {passport.risk.level} risk — {passport.risk.score}/100
                    </div>
                    {passport.risk.reasons?.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {passport.risk.reasons.map((r, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : <p className="text-sm text-slate-400">No assessment recorded</p>}
              </Card>

              {/* Milestones */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-slate-800 text-sm">Development Milestones</h4>
                </div>
                {passport.milestones.length === 0
                  ? <p className="text-sm text-slate-400">No milestones recorded</p>
                  : <div className="space-y-2">
                    {passport.milestones.slice(0, 4).map((m, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-700 truncate">{m.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(m.status)}`}>{m.status}</span>
                      </div>
                    ))}
                  </div>}
              </Card>

              {/* Parent info */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-slate-800 text-sm">Guardian Information</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{child?.parent_name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{child?.parent_phone || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Municipality</span><span className="font-medium text-slate-800">{child?.municipality || "—"}</span></div>
                </div>
              </Card>

              {/* Upcoming appointments */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-semibold text-slate-800 text-sm">Upcoming Appointments</h4>
                </div>
                {passport.appointments.filter((a) => a.status === "scheduled").length === 0
                  ? <p className="text-sm text-slate-400">No upcoming appointments</p>
                  : <div className="space-y-2">
                    {passport.appointments.filter((a) => a.status === "scheduled").slice(0, 3).map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-700">{a.type}</span>
                        <span className="text-[10px] text-slate-500">{new Date(a.scheduled_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>}
              </Card>
            </div>
          )}

          {/* Vaccinations */}
          {activeSection === "vaccinations" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Vaccination History</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Completed
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block ml-2" /> Missed
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block ml-2" /> Pending
                </div>
              </div>
              {passport.vaccinations.length === 0
                ? <Card className="p-6 text-center text-sm text-slate-400">No vaccination records</Card>
                : passport.vaccinations.map((v, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${v.status === "completed" ? "bg-emerald-400" : v.status === "missed" ? "bg-red-400" : "bg-blue-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{v.vaccine_name}</p>
                      <p className="text-xs text-slate-500">
                        Recommended: {v.recommended_date ? new Date(v.recommended_date).toLocaleDateString() : "—"}
                        {v.completed_date && ` · Done: ${new Date(v.completed_date).toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize ${statusBadge(v.status)}`}>{v.status}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Visits */}
          {activeSection === "visits" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Home Visit Records</h3>
              {passport.recentVisits.length === 0
                ? <Card className="p-6 text-center text-sm text-slate-400">No visit records</Card>
                : passport.recentVisits.map((v, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Home Visit</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(v.completed_at || v.scheduled_at).toLocaleDateString()} · Nurse: {v.nurse_name}
                        </p>
                        {v.nutrition_notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{v.nutrition_notes}</p>}
                      </div>
                      {v.nutrition_status && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Thermometer className="w-3 h-3" />
                          {v.nutrition_status}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}

          {/* Appointments */}
          {activeSection === "appointments" && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Appointment History</h3>
              {passport.appointments.length === 0
                ? <Card className="p-6 text-center text-sm text-slate-400">No appointments</Card>
                : passport.appointments.map((a, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
                    <CalendarDays className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800 capitalize">{a.type}</p>
                      <p className="text-xs text-slate-500">{new Date(a.scheduled_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize ${statusBadge(a.status)}`}>{a.status}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Nurse Dashboard ──────────────────────────────────────────────────────────

function NurseDashboard({ user }: { user: SafeUser | null }) {
  const [offlineMode] = useState(false);
  const [apiVisits, setApiVisits] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [visitError, setVisitError] = useState("");
  const [appointmentDraft, setAppointmentDraft] = useState({ childId: "", type: "vaccination", scheduledAt: "", location: "Pristina Family Medicine Center", notes: "" });
  const [appointmentNotice, setAppointmentNotice] = useState("");
  const fallbackVisits: any[] = [];

  useEffect(() => {
    apiRequest<{ visits: any[] }>("/visits")
      .then((data) => setApiVisits(data.visits))
      .catch((error) => setVisitError(error instanceof Error ? error.message : "Could not load visits"));
    apiRequest<AppointmentsResponse>("/appointments")
      .then((data) => setAppointments(data.appointments))
      .catch(() => setAppointments([]));
    apiRequest<{ children: any[] }>("/children")
      .then((data) => {
        setChildren(data.children);
        if (data.children[0]) setAppointmentDraft((draft) => ({ ...draft, childId: data.children[0].id }));
      })
      .catch(() => setChildren([]));
  }, []);

  const visits = apiVisits.length > 0
    ? apiVisits.map((visit) => ({
      id: visit.id,
      time: new Date(visit.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      family: visit.child_name?.split(" ").slice(-1)[0] || "Family",
      child: visit.child_name || "Child",
      address: visit.location || "Home visit location",
      status: visit.status === "scheduled" ? "pending" : visit.status.replace("_", "-"),
      risk: visit.risk_notes ? "high" : visit.status === "missed" ? "high" : "low",
    }))
    : fallbackVisits;

  const updateVisitStatus = async (visitId: string | undefined, status: string) => {
    if (!visitId) return;
    await apiRequest(`/visits/${visitId}`, {
      method: "PATCH",
      body: { status: status === "in-progress" ? "in_progress" : status, completedAt: status === "completed" ? new Date().toISOString() : undefined },
    });
    const data = await apiRequest<{ visits: any[] }>("/visits");
    setApiVisits(data.visits);
  };

  const createAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    setAppointmentNotice("");
    await apiRequest("/appointments", {
      method: "POST",
      body: appointmentDraft,
    });
    setAppointmentNotice("Appointment scheduled and parent notified.");
    setAppointmentDraft((draft) => ({ ...draft, scheduledAt: "", notes: "" }));
    const data = await apiRequest<AppointmentsResponse>("/appointments");
    setAppointments(data.appointments);
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name?.split(" ")[0] || "Provider"}</h1>
          {visitError && <p className="text-xs text-red-500 mt-1">{visitError}</p>}
          <p className="text-slate-500 text-sm">{new Date().toLocaleDateString()} · {user?.municipality || "Care team"}</p>
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
              <button
                onClick={() => updateVisitStatus(v.id, v.status === "completed" ? "completed" : "in-progress")}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex-shrink-0"
              >
                {v.status === "completed" ? "Review" : "Start Visit"}
              </button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Schedule Appointment</h3>
          <form onSubmit={createAppointment} className="space-y-3">
            <select
              value={appointmentDraft.childId}
              onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, childId: event.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
              required
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.full_name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={appointmentDraft.type}
                onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, type: event.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="vaccination">Vaccination</option>
                <option value="checkup">Check-up</option>
                <option value="home_visit">Home visit</option>
                <option value="dental">Dental</option>
                <option value="other">Other</option>
              </select>
              <input
                type="datetime-local"
                value={appointmentDraft.scheduledAt}
                onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, scheduledAt: event.target.value }))}
                className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <input
              value={appointmentDraft.location}
              onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, location: event.target.value }))}
              placeholder="Location"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"
            />
            <textarea
              value={appointmentDraft.notes}
              onChange={(event) => setAppointmentDraft((draft) => ({ ...draft, notes: event.target.value }))}
              placeholder="Notes for parent"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-20"
            />
            <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700">
              Schedule and notify parent
            </button>
            {appointmentNotice && <p className="text-xs text-emerald-600 font-semibold">{appointmentNotice}</p>}
          </form>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Appointment Responses</h3>
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{appointment.child_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{appointment.type.replace("_", " ")} · {new Date(appointment.scheduled_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={appointment.status === "confirmed" ? "success" : appointment.status === "reschedule_requested" ? "warning" : appointment.status === "missed" ? "danger" : "info"}>
                    {appointment.status.replace("_", " ")}
                  </Badge>
                </div>
                {appointment.parent_response && <p className="text-xs text-slate-600 mt-2">{appointment.parent_response}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
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
  return <LiveChildTimeline />;
}

function LiveChildTimeline() {
  const [filter, setFilter] = useState("all");
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const filters = ["all", "vaccinations", "check-ups", "milestones", "missed"];

  useEffect(() => {
    apiRequest<{ children: any[] }>("/children")
      .then((data) => {
        setChildren(data.children);
        setSelectedChildId(data.children[0]?.id || "");
      })
      .catch(() => setChildren([]));
  }, []);

  useEffect(() => {
    if (!selectedChildId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiRequest<{ timeline: any[] }>(`/dashboard/children/${selectedChildId}/timeline`)
      .then((data) => setEvents(data.timeline))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const child = children.find((item) => item.id === selectedChildId);
  const timeline = events.map((event) => ({
    date: formatDisplayDate(event.date || event.scheduled_date || event.completed_date),
    label: event.title || event.vaccine_name || event.checkup_type || event.name || "Health event",
    type: event.type === "checkup" ? "check-ups" : event.type === "vaccination" ? "vaccinations" : event.type || "milestones",
    status: event.status || "completed",
    detail: event.notes || event.description || event.provider_name || "Recorded in SAFE",
  }));
  const filtered = filter === "all"
    ? timeline
    : timeline.filter((event) => event.type === filter || (filter === "missed" && ["missed", "delayed", "overdue"].includes(event.status)));

  const dotColor: Record<string, string> = {
    completed: "bg-emerald-500 border-emerald-200",
    missed: "bg-red-500 border-red-200",
    delayed: "bg-red-500 border-red-200",
    overdue: "bg-red-500 border-red-200",
    pending: "bg-blue-400 border-blue-200",
    scheduled: "bg-blue-400 border-blue-200",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{child?.full_name || "Child Health Timeline"}</h1>
          <p className="text-sm text-slate-500">
            {child ? `${childAgeLabel(child.date_of_birth)} - Born ${formatDisplayDate(child.date_of_birth)}` : "Add a child profile to see health events"}
          </p>
        </div>
        {children.length > 0 && (
          <select
            value={selectedChildId}
            onChange={(event) => setSelectedChildId(event.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-300"
          >
            {children.map((item) => (
              <option key={item.id} value={item.id}>{item.full_name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${filter === item ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-100" />
        <div className="space-y-3">
          {loading && <Card className="p-4 text-sm text-slate-500">Loading timeline...</Card>}
          {!loading && filtered.length === 0 && <Card className="p-4 text-sm text-slate-500">No health events found for this filter.</Card>}
          {filtered.map((event, index) => (
            <div key={`${event.label}-${index}`} className="relative">
              <div className={`absolute -left-[21px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor[event.status] || "bg-slate-400 border-slate-200"}`} />
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{event.label}</p>
                    <p className="text-xs text-slate-500">{event.date}</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{event.detail}</p>
                  </div>
                  <Badge variant={["missed", "delayed", "overdue"].includes(event.status) ? "danger" : event.status === "completed" ? "success" : "info"}>
                    {event.status}
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

function AIRiskDashboard() {
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [riskMessage, setRiskMessage] = useState("");
  const highRiskChildren: any[] = [];

  const heatmapMunicipalities: any[] = [];

  const riskColor: Record<string, string> = {
    critical: "bg-red-100 border-red-300 text-red-800",
    high: "bg-orange-100 border-orange-300 text-orange-800",
    medium: "bg-amber-100 border-amber-300 text-amber-800",
    low: "bg-emerald-100 border-emerald-300 text-emerald-800",
  };

  useEffect(() => {
    apiRequest<{ alerts: any[] }>("/risk/alerts")
      .then((data) => setRiskAlerts(data.alerts))
      .catch(() => setRiskAlerts([]));
  }, []);

  const visibleHighRiskChildren = riskAlerts.length > 0
    ? riskAlerts.filter((item) => item.score >= 30).map((item) => ({
      name: item.child.full_name,
      age: childAgeLabel(item.child.date_of_birth),
      score: item.score,
      reason: item.reasons.join(", ") || "Preventive care follow-up required",
      municipality: item.child.municipality || "Not set",
      lastVisit: item.level,
    }))
    : highRiskChildren;

  const highRiskCount = visibleHighRiskChildren.filter((item) => item.score >= 60).length;
  const mediumRiskCount = visibleHighRiskChildren.filter((item) => item.score >= 30 && item.score < 60).length;
  const aiRiskDistribution = [
    { label: "Low Risk", value: Math.max(0, riskAlerts.length - highRiskCount - mediumRiskCount), color: "#10B981" },
    { label: "Medium Risk", value: mediumRiskCount, color: "#F59E0B" },
    { label: "High Risk", value: highRiskCount, color: "#EF4444" },
  ];
  const aiAlerts = riskAlerts.length > 0
    ? riskAlerts.slice(0, 4).map((item) => ({
      severity: item.level === "high" ? "critical" : item.level,
      text: `${item.child.full_name}: ${(item.reasons || []).join(", ") || "Preventive care follow-up required"}`,
      time: `Score ${item.score}`,
    }))
    : [];


  const recalculateRisk = async () => {
    await apiRequest("/risk/recalculate", { method: "POST" });
    const data = await apiRequest<{ alerts: any[] }>("/risk/alerts");
    setRiskAlerts(data.alerts);
    setRiskMessage("Risk scores recalculated.");
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
        <KPICard label="High-Risk Children" value={String(highRiskCount)} icon={AlertTriangle} color="red" delta="Live database" />
        <KPICard label="Medium Risk" value={String(mediumRiskCount)} icon={AlertCircle} color="amber" delta="Monitoring" />
        <KPICard label="Open Risk Alerts" value={String(riskAlerts.length)} icon={Zap} color="indigo" delta="Current records" />
        <KPICard label="Reviewed Children" value={String(visibleHighRiskChildren.length)} icon={TrendingUp} color="emerald" delta="From SAFE records" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Risk donut */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={aiRiskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                {aiRiskDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v.toLocaleString(), "children"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {aiRiskDistribution.map((d) => (
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
            {(aiAlerts.length > 0 ? aiAlerts : [{ severity: "low", text: "No active risk alerts from the current database.", time: "Live" }]).map((a, i) => {
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
          {visibleHighRiskChildren.map((c, i) => (
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
  const [stats, setStats] = useState<any | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [adminRiskAlerts, setAdminRiskAlerts] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminChildren, setAdminChildren] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentNotice, setAssignmentNotice] = useState("");
  const [assignmentDraft, setAssignmentDraft] = useState({
    parentId: "",
    providerId: "",
    childId: "",
    notes: "",
  });
  const nurseData: any[] = [];

  useEffect(() => {
    apiRequest<{ stats: any }>("/dashboard/provider/stats").then((data) => setStats(data.stats)).catch(() => setStats(null));
    apiRequest<{ visits: any[] }>("/visits").then((data) => setVisits(data.visits)).catch(() => setVisits([]));
    apiRequest<{ alerts: any[] }>("/risk/alerts").then((data) => setAdminRiskAlerts(data.alerts)).catch(() => setAdminRiskAlerts([]));
    refreshAdminDirectory();
  }, []);

  const refreshAdminDirectory = async () => {
    const [usersData, childrenData, assignmentsData] = await Promise.all([
      apiRequest<{ users: any[] }>("/users/care-team"),
      apiRequest<{ children: any[] }>("/children"),
      apiRequest<{ assignments: any[] }>("/users/assignments"),
    ]);
    setAdminUsers(usersData.users);
    setAdminChildren(childrenData.children);
    setAssignments(assignmentsData.assignments);
    setAssignmentDraft((draft) => ({
      ...draft,
      parentId: draft.parentId || usersData.users.find((item) => item.role === "parent")?.id || "",
      providerId: draft.providerId || usersData.users.find((item) => item.role === "doctor")?.id || "",
    }));
  };

  const liveNurseData = visits.length > 0
    ? Object.values(visits.reduce((acc: Record<string, any>, visit) => {
      const key = visit.nurse_name || "Unassigned provider";
      acc[key] ||= { name: key, zone: visit.location || "Care team", visits: 0, completed: 0, families: new Set() };
      acc[key].visits += 1;
      if (visit.status === "completed") acc[key].completed += 1;
      if (visit.child_name) acc[key].families.add(visit.child_name);
      return acc;
    }, {})).map((item: any) => ({
      name: item.name,
      zone: item.zone,
      visits: item.visits,
      completion: Math.round((item.completed / Math.max(item.visits, 1)) * 100),
      families: item.families.size,
    }))
    : nurseData;
  const parents = adminUsers.filter((item) => item.role === "parent");
  const providers = adminUsers.filter((item) => item.role === "doctor");
  const childrenForSelectedParent = adminChildren.filter((child) => child.parent_id === assignmentDraft.parentId);
  const createAssignment = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setAssignmentNotice("");
    try {
      await apiRequest("/users/assignments", {
        method: "POST",
        body: {
          parentId: assignmentDraft.parentId,
          providerId: assignmentDraft.providerId,
          childId: assignmentDraft.childId || undefined,
          relationship: "assigned_nurse",
          notes: assignmentDraft.notes || undefined,
        },
      });
      setAssignmentNotice("Nurse assigned successfully.");
      await refreshAdminDirectory();
    } catch (error) {
      setAssignmentNotice(error instanceof Error ? error.message : "Could not assign nurse");
    }
  };

  const endAssignment = async (assignmentId: string) => {
    setAssignmentNotice("");
    try {
      await apiRequest(`/users/assignments/${assignmentId}/end`, { method: "PATCH" });
      setAssignmentNotice("Assignment ended.");
      await refreshAdminDirectory();
    } catch (error) {
      setAssignmentNotice(error instanceof Error ? error.message : "Could not end assignment");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Municipal Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time public health intelligence from SAFE database</p>
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
        <KPICard label="Active Children" value={String(stats?.children_count ?? 0)} icon={Baby} color="indigo" delta={`${stats?.parents_count ?? 0} parents`} />
        <KPICard label="Vaccination Gaps" value={String(stats?.vaccination_gaps ?? 0)} icon={Syringe} color="emerald" delta={`${stats?.overdue_vaccinations ?? 0} overdue`} />
        <KPICard label="Overdue Check-ups" value={String(stats?.overdue_checkups ?? 0)} icon={Clock} color="amber" delta={`${stats?.checkup_gaps ?? 0} gaps`} />
        <KPICard label="Home Visits" value={String(stats?.home_visits_count ?? 0)} icon={Stethoscope} color="blue" delta={`${stats?.completed_home_visits ?? 0} completed`} />
        <KPICard label="Risk Alerts" value={String(adminRiskAlerts.filter((alert) => alert.score >= 60).length)} icon={AlertTriangle} color="red" delta="Live" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Assign Nurse</h3>
            <Badge variant="info">{assignments.length} active</Badge>
          </div>
          <form onSubmit={createAssignment} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Parent</label>
              <select
                value={assignmentDraft.parentId}
                onChange={(event) => setAssignmentDraft((draft) => ({ ...draft, parentId: event.target.value, childId: "" }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-300"
              >
                <option value="">Select parent</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>{parent.name} - {parent.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Child</label>
              <select
                value={assignmentDraft.childId}
                onChange={(event) => setAssignmentDraft((draft) => ({ ...draft, childId: event.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-300"
              >
                <option value="">Whole family</option>
                {childrenForSelectedParent.map((child) => (
                  <option key={child.id} value={child.id}>{child.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Nurse / Provider</label>
              <select
                value={assignmentDraft.providerId}
                onChange={(event) => setAssignmentDraft((draft) => ({ ...draft, providerId: event.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-300"
              >
                <option value="">Select provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name} - {provider.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Notes</label>
              <input
                value={assignmentDraft.notes}
                onChange={(event) => setAssignmentDraft((draft) => ({ ...draft, notes: event.target.value }))}
                placeholder="Zone, clinic, reason..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300"
              />
            </div>
            <button
              type="submit"
              disabled={!assignmentDraft.parentId || !assignmentDraft.providerId}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign Nurse
            </button>
            {assignmentNotice && (
              <p className={`text-xs font-semibold ${assignmentNotice.includes("Could") || assignmentNotice.includes("not") ? "text-red-600" : "text-emerald-600"}`}>
                {assignmentNotice}
              </p>
            )}
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Active Parent-Nurse Assignments</h3>
            <button onClick={refreshAdminDirectory} className="text-xs text-indigo-600 font-semibold hover:underline">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Parent</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Child</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nurse</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No active assignments yet.</td>
                  </tr>
                )}
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{assignment.parent_name}</p>
                      <p className="text-xs text-slate-400">{assignment.parent_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{assignment.child_name || "Whole family"}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{assignment.provider_name}</p>
                      <p className="text-xs text-slate-400">{assignment.provider_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDisplayDate(assignment.assigned_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => endAssignment(assignment.id)}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        End
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
          <button className="text-xs text-indigo-600 font-semibold hover:underline">View all providers</button>
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
              {liveNurseData.map((n, i) => (
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

function MessagingModule({ user }: { user: SafeUser | null }) {
  const [activeConv, setActiveConv] = useState(0);
  const [message, setMessage] = useState("");
  const [apiMessages, setApiMessages] = useState<any[]>([]);
  const [careTeam, setCareTeam] = useState<any[]>([]);

  const conversations = [
    { name: "SAFE Care Team", avatar: "SC", lastMessage: "No messages yet.", time: "Live", unread: 0, type: "system" },
  ];

  const messages = [
    { sender: "system", text: "Start a secure conversation with your care team.", time: "Live" },
  ];

  useEffect(() => {
    apiRequest<{ messages: any[] }>("/messages")
      .then((data) => setApiMessages(data.messages))
      .catch(() => setApiMessages([]));
    apiRequest<{ users: any[] }>("/users/care-team")
      .then((data) => setCareTeam(data.users))
      .catch(() => setCareTeam([]));
  }, []);

  const visibleMessages = apiMessages.length > 0
    ? apiMessages.map((item) => ({
      sender: item.sender_id === user?.id ? "parent" : "nurse",
      text: item.body,
      time: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))
    : messages;
  const visibleConversations = apiMessages.length > 0
    ? Array.from(new Map(apiMessages.map((item) => {
      const other = item.sender_id === user?.id ? item.recipient : item.sender;
      const name = other?.name || "SAFE Care Team";
      return [name, {
        name,
        avatar: initialsFor(name),
        lastMessage: item.body,
        time: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unread: 0,
        type: other?.role || "system",
      }];
    })).values())
    : conversations;

  const sendBackendMessage = async () => {
    const recipient = careTeam.find((item) => item.id !== user?.id);
    if (!recipient || !message.trim()) return;
    await apiRequest("/messages", {
      method: "POST",
      body: { recipientId: recipient.id, body: message },
    });
    setMessage("");
    const data = await apiRequest<{ messages: any[] }>("/messages");
    setApiMessages(data.messages);
  };

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
          {visibleConversations.map((c, i) => (
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
            {visibleConversations[Math.min(activeConv, visibleConversations.length - 1)].avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{visibleConversations[Math.min(activeConv, visibleConversations.length - 1)].name}</p>
            <p className="text-xs text-emerald-600 font-medium">● Online</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="success"><Shield className="w-2.5 h-2.5" /> End-to-end encrypted</Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {visibleMessages.map((m, i) => {
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
            <button
              onClick={sendBackendMessage}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage({ user, onUserUpdate }: { user: SafeUser | null; onUserUpdate: (user: SafeUser) => void }) {
  const [language, setLanguage] = useState("sq");
  const [notifications, setNotifications] = useState({ sms: true, push: true, email: false, reminders: true });
  const [settingsSaved, setSettingsSaved] = useState("");
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    municipality: user?.municipality || "",
    address: user?.address || "",
    password: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [settingsChildren, setSettingsChildren] = useState<any[]>([]);

  useEffect(() => {
    apiRequest<{ user: SafeUser }>("/users/me")
      .then((data) => {
        onUserUpdate(data.user);
        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          municipality: data.user.municipality || "",
          address: data.user.address || "",
          password: "",
        });
      })
      .catch(() => undefined);
    apiRequest<{ settings: any }>("/settings")
      .then((data) => {
        setLanguage(data.settings.language || "sq");
        setNotifications({
          sms: data.settings.sms_notifications,
          push: data.settings.push_notifications,
          email: data.settings.email_notifications,
          reminders: data.settings.reminder_notifications,
        });
      })
      .catch(() => undefined);
    apiRequest<{ children: any[] }>("/children")
      .then((data) => setSettingsChildren(data.children))
      .catch(() => setSettingsChildren([]));
  }, []);

  const saveProfile = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setProfileMessage("");
    try {
      const data = await apiRequest<{ user: SafeUser }>("/users/me", {
        method: "PATCH",
        body: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          municipality: profile.municipality,
          address: profile.address,
          password: profile.password || undefined,
        },
      });
      const token = getStoredToken();
      if (token) storeSession(token, data.user);
      onUserUpdate(data.user);
      setProfile((value) => ({ ...value, password: "" }));
      setProfileMessage("Profile saved");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save profile");
    }
  };

  const toggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      apiRequest("/settings", {
        method: "PATCH",
        body: {
          smsNotifications: next.sms,
          pushNotifications: next.push,
          emailNotifications: next.email,
          reminderNotifications: next.reminders,
        },
      }).then(() => setSettingsSaved("Settings saved")).catch(() => setSettingsSaved("Could not save settings"));
      return next;
    });
  };

  const saveLanguage = (code: string) => {
    setLanguage(code);
    apiRequest("/settings", { method: "PATCH", body: { language: code } })
      .then(() => setSettingsSaved("Settings saved"))
      .catch(() => setSettingsSaved("Could not save settings"));
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
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">{(profile.name || "SAFE").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="font-bold text-slate-900">{profile.name || "Profile"}</p>
            <p className="text-sm text-slate-500">{profile.role === "parent" ? "Parent / Guardian" : profile.role === "doctor" ? "Doctor / Provider" : "Admin"}{profile.municipality ? ` - ${profile.municipality}` : ""}</p>
            <Badge variant="success" ><Check className="w-2.5 h-2.5" /> Verified</Badge>
          </div>
          <button onClick={saveProfile} className="ml-auto px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Save Profile</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Full Name", value: profile.name },
            { label: "Phone", value: profile.phone },
            { label: "Municipality", value: profile.municipality },
            { label: "Address", value: profile.address },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-slate-400 font-semibold">{f.label}</label>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100">
          {[
            { key: "name", label: "Full Name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "municipality", label: "Municipality", type: "text" },
            { key: "address", label: "Address", type: "text" },
            { key: "password", label: "New Password", type: "password" },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs text-slate-400 font-semibold">{field.label}</label>
              <input
                type={field.type}
                value={profile[field.key as keyof typeof profile]}
                onChange={(event) => setProfile((value) => ({ ...value, [field.key]: event.target.value }))}
                placeholder={field.key === "password" ? "Leave blank to keep current password" : field.label}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
          ))}
        </div>
        {profileMessage && <p className={`text-xs font-semibold mt-3 ${profileMessage.includes("Could") || profileMessage.includes("exists") ? "text-red-600" : "text-emerald-600"}`}>{profileMessage}</p>}
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
          {settingsChildren.length === 0 && <p className="text-sm text-slate-500">No child profiles yet.</p>}
          {settingsChildren.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0">
                {c.full_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{c.full_name}</p>
                <p className="text-xs text-slate-500">{new Date(c.date_of_birth).toLocaleDateString()} · {c.gender}</p>
              </div>
              <Badge variant="success">active</Badge>
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
              onClick={() => saveLanguage(l.code)}
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
        {settingsSaved && <p className="text-xs text-emerald-600 font-semibold mb-3">{settingsSaved}</p>}
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

// ─── Passport QR Viewer (scanned by nurse / anyone) ──────────────────────────

function PassportViewer({ token }: { token: string }) {
  const [data, setData] = useState<{ passport: PassportData; scannedAt: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  useEffect(() => {
    fetch(`${API_URL}/passport/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error.message);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const p = data?.passport;
  const child = p?.child;
  const dob = child?.date_of_birth ? new Date(child.date_of_birth) : null;
  const ageMonths = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;
  const ageLabel = ageMonths >= 24 ? `${Math.floor(ageMonths / 12)} yrs` : `${ageMonths} mo`;
  const vacCompleted = p?.vaccinations.filter((v) => v.status === "completed").length ?? 0;
  const vacTotal = p?.vaccinations.length ?? 0;
  const vacMissed = p?.vaccinations.filter((v) => v.status === "missed").length ?? 0;
  const riskColor: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-800 border-emerald-300",
    moderate: "bg-amber-100 text-amber-800 border-amber-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Verified header bar */}
      <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold">
        <ShieldCheck className="w-4 h-4" />
        Verified Health Passport · Kosovo Child Health Platform
        {data && <span className="ml-4 text-emerald-200 text-xs font-normal">Scanned {new Date(data.scannedAt).toLocaleTimeString()}</span>}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {loading && (
          <div className="text-center py-20 text-slate-400">
            <ScanLine className="w-10 h-10 mx-auto mb-3 animate-pulse" />
            <p className="text-sm">Verifying passport…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-red-800 text-lg">Invalid or Expired QR Code</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <p className="text-slate-500 text-xs mt-3">Ask the parent to generate a new QR code from their Health Passport.</p>
          </div>
        )}

        {p && child && (
          <>
            {/* Identity card */}
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)" }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Republic of Kosovo · Child Health Passport</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl font-bold">{child.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h1 className="text-white text-xl font-bold">{child.full_name}</h1>
                    <p className="text-indigo-200 text-sm">{ageLabel} · {child.gender} · {child.municipality || "Kosovo"}</p>
                    <p className="text-indigo-300 text-xs font-mono mt-1">ID: {child.id.split("-")[0].toUpperCase()}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Vaccines", value: `${vacCompleted}/${vacTotal}`, alert: vacMissed > 0 },
                    { label: "Risk", value: p.risk?.level ?? "N/A", alert: ["high","critical"].includes(p.risk?.level ?? "") },
                    { label: "Visits", value: String(p.recentVisits.length), alert: false },
                  ].map(({ label, value, alert }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3 border border-white/20 text-center">
                      <p className="text-indigo-200 text-[10px] uppercase tracking-wide">{label}</p>
                      <p className={`text-lg font-bold capitalize ${alert ? "text-red-300" : "text-white"}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk alert banner */}
            {p.risk && ["high", "critical"].includes(p.risk.level) && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Preventive Risk Alert — {p.risk.level.toUpperCase()}</p>
                  <ul className="mt-1 space-y-0.5">
                    {p.risk.reasons?.map((r, i) => <li key={i} className="text-xs text-red-700">· {r}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* Vaccinations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Syringe className="w-4 h-4 text-indigo-600" /> Vaccination Status
              </h3>
              {p.vaccinations.length === 0
                ? <p className="text-sm text-slate-400">No records</p>
                : <div className="space-y-2">
                  {p.vaccinations.map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${v.status === "completed" ? "bg-emerald-400" : v.status === "missed" ? "bg-red-400" : "bg-blue-400"}`} />
                      <span className="text-sm text-slate-700 flex-1">{v.vaccine_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                        v.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : v.status === "missed" ? "text-red-700 bg-red-50 border-red-200"
                        : "text-blue-700 bg-blue-50 border-blue-200"
                      }`}>{v.status}</span>
                    </div>
                  ))}
                </div>}
            </div>

            {/* Recent visit */}
            {p.recentVisits[0] && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-indigo-600" /> Last Home Visit
                </h3>
                <p className="text-sm text-slate-700">{new Date(p.recentVisits[0].visited_at).toLocaleDateString()} · Nurse: {p.recentVisits[0].nurse_name}</p>
                {p.recentVisits[0].notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2">{p.recentVisits[0].notes}</p>}
              </div>
            )}

            {/* Guardian */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-indigo-600" /> Guardian Contact
              </h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{child.parent_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{child.parent_phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Municipality</span><span className="font-medium text-slate-800">{child.municipality || "—"}</span></div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 pb-4">
              This passport was verified at {new Date(data!.scannedAt).toLocaleString()} · SAFE Platform Kosovo
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Check if this is a QR scan verification URL
  const verifyToken = new URLSearchParams(window.location.search).get("verify");
  if (verifyToken) return <PassportViewer token={verifyToken} />;

  const [activePage, setActivePage] = useState<Page>("landing");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<SafeUser | null>(() => (getStoredToken() ? getStoredUser() : null));

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setActivePage("login");
  };

  useEffect(() => {
    if (!allowedPagesFor(user).includes(activePage)) {
      setActivePage(defaultPageFor(user));
    }
  }, [activePage, user]);

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} open={sidebarOpen} user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar activePage={activePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
        <main className="flex-1 overflow-auto">
          {activePage === "landing" && <LandingPage setActivePage={setActivePage} user={user} />}
          {activePage === "login" && <AuthPage setActivePage={setActivePage} onLogin={setUser} />}
          {activePage === "parent" && <ParentDashboard user={user} onLogout={handleLogout} />}
          {activePage === "passport" && <HealthPassport user={user} />}
          {activePage === "nurse" && <NurseDashboard user={user} />}
          {activePage === "visit" && <HomeVisitForm />}
          {activePage === "timeline" && <LiveChildTimeline />}
          {activePage === "ai-risk" && <AIRiskDashboard />}
          {activePage === "admin" && <AdminDashboard />}
          {activePage === "messaging" && <MessagingModule user={user} />}
          {activePage === "settings" && <SettingsPage user={user} onUserUpdate={setUser} />}
        </main>
      </div>
    </div>
  );
}
