import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import SignalExplorer from "@/features/signals/SignalExplorer";
import {
  Activity, Bell, Bot, Building2, Check, ChevronDown, CircleHelp, Command,
  Database, LayoutDashboard, Menu, Moon, Plug, Radar, Search, Settings2,
  Sun, Target, Workflow, X,
} from "lucide-react";

type NavItem = { label: string; path: string; icon: typeof LayoutDashboard };
const primaryNav: NavItem[] = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Signal Explorer", path: "/signals", icon: Radar },
  { label: "Accounts", path: "/accounts", icon: Building2 },
  { label: "Opportunities", path: "/opportunities", icon: Target },
  { label: "AI Agents", path: "/agents", icon: Bot },
  { label: "Workflows", path: "/workflows", icon: Workflow },
  { label: "Analytics", path: "/analytics", icon: Activity },
];
const utilityNav: NavItem[] = [
  { label: "Integrations", path: "/integrations", icon: Plug },
  { label: "Settings & Billing", path: "/settings", icon: Settings2 },
];

function Sidebar({ close }: { close?: () => void }) {
  return <>
    <div className="brand-row">
      <span className="brand-mark" aria-hidden="true"><Activity size={18} strokeWidth={2.4} /></span>
      <span className="brand-name">Revenue workspace</span>
      {close && <button className="icon-button sidebar-close" onClick={close} aria-label="Close navigation"><X size={19} /></button>}
    </div>
    <button className="workspace-card" type="button" aria-label="Workspace: Northstar Labs">
      <span className="workspace-avatar">N</span><span className="workspace-copy"><strong>Northstar Labs</strong><small>Workspace</small></span><ChevronDown size={15} className="workspace-chevron" />
    </button>
    <nav className="side-nav" aria-label="Main navigation">
      <span className="nav-caption">WORKSPACE</span>
      {primaryNav.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === "/"} onClick={close} className={({ isActive }) => `nav-link${isActive ? " selected" : ""}`} aria-current={undefined}>
        <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Overview" && <span className="active-indicator" />}
      </NavLink>)}
      <span className="nav-caption nav-caption-spaced">CONFIGURE</span>
      {utilityNav.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={close} className={({ isActive }) => `nav-link${isActive ? " selected" : ""}`}>
        <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
      </NavLink>)}
    </nav>
    <div className="sidebar-footer"><span className="status-dot" /><span>Workspace setup</span><span className="setup-label">In progress</span></div>
  </>;
}

function Header({ onMenu, theme, toggleTheme, section }: { onMenu: () => void; theme: "light" | "dark"; toggleTheme: () => void; section: string }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{section}</strong></div>
    </div>
    <div className="topbar-actions">
      <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Open search"><Search size={16} /><span>Search anything</span><kbd><Command size={11} /> K</kbd></button>
      <span className="topbar-separator" />
      <div className="popover-wrap"><button className="icon-button" aria-label="Notifications" onClick={() => setHelpOpen(!helpOpen)}><Bell size={18} /></button>{helpOpen && <div className="popover-panel"><strong>Notifications</strong><p>You’re all caught up.</p></div>}</div>
      <button className="icon-button help-button" aria-label="Help" onClick={() => window.open("mailto:support@example.com", "_blank")}><CircleHelp size={18} /></button>
      <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
      <span className="topbar-separator profile-separator" />
      <div className="popover-wrap"><button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="profile-avatar">JM</span><span className="profile-name">Jordan Miller</span><ChevronDown size={14} /></button>{profileOpen && <div className="popover-panel profile-panel"><strong>Jordan Miller</strong><p>Workspace member</p><button onClick={() => setProfileOpen(false)}>Close menu</button></div>}</div>
    </div>
    {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search workspace" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}><div className="search-dialog"><div className="search-input-row"><Search size={19} /><input autoFocus placeholder="Search your workspace" aria-label="Search your workspace" onKeyDown={(e) => { if (e.key === "Escape") setSearchOpen(false); }} /><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></div><div className="search-empty"><Command size={18} /><span>Search across your workspace</span></div></div></div>}
  </header>;
}

const placeholderCards = [
  { icon: Activity, title: "Revenue signals", text: "Buying intent and account activity will appear here once your workspace is connected." },
  { icon: Target, title: "Team priorities", text: "Your next best actions will be organized here to help your team focus." },
  { icon: Database, title: "Pipeline overview", text: "A clear view of your revenue pipeline will be available when data is connected." },
];

function Overview() {
  return <>
    <div className="page-heading"><div><div className="eyebrow">REVENUE WORKSPACE</div><h1>Overview</h1><p className="page-description">A clear view of the signals and opportunities shaping your revenue.</p></div></div>
    <section className="welcome-panel" aria-labelledby="welcome-title"><div className="welcome-copy"><span className="welcome-kicker">YOUR REVENUE WORKSPACE</span><h2 id="welcome-title">Welcome to your workspace</h2><p>Bring your revenue signals together to understand where to focus and what to do next. Your workspace is ready for its first connection.</p><div className="welcome-note"><span className="note-icon"><Check size={15} /></span><span>No live data is connected yet. Your workspace is waiting for setup.</span></div></div><div className="welcome-art" aria-hidden="true"><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-center"><Activity size={28} /></div><span className="art-node node-one"/><span className="art-node node-two"/><span className="art-node node-three"/></div></section>
    <div className="section-heading"><div><h2>Workspace preview</h2><p>Places your team’s revenue context will come together.</p></div><span className="preview-badge"><span className="status-dot" />Awaiting setup</span></div>
    <section className="preview-grid" aria-label="Illustrative workspace areas">{placeholderCards.map(({ icon: Icon, title, text }) => <article className="preview-card" key={title}><span className="preview-icon"><Icon size={18} /></span><h3>{title}</h3><p>{text}</p><div className="placeholder-line"/><div className="placeholder-line short"/><span className="card-footnote">Available after setup</span></article>)}</section>
    <section className="setup-panel"><div className="setup-icon"><Database size={19} /></div><div className="setup-copy"><h2>Connect your revenue context</h2><p>Workspace setup and data connections will be introduced in a future module. Nothing is connected or reporting live data yet.</p></div><span className="coming-soon">COMING LATER</span></section>
    <footer className="page-footer">Illustrative workspace preview <span>·</span> No live revenue data</footer>
  </>;
}

function NotAvailable({ title }: { title: string }) {
  return <div className="unavailable"><span className="unavailable-icon"><LayoutDashboard size={22} /></span><span className="welcome-kicker">WORKSPACE</span><h1>{title}</h1><p>This area is part of your workspace navigation. Its functionality will be introduced in a future module.</p><span className="coming-soon">NOT YET AVAILABLE</span></div>;
}

const Index = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const dark = theme === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("signal-ledger-theme", theme);
  }, [theme]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  const current = [...primaryNav, ...utilityNav].find((item) => item.path === location.pathname);
  return <div className="app-shell">
    <aside className="desktop-sidebar"><Sidebar /></aside>
    {mobileOpen && <><button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay"/><aside className="mobile-sidebar"><Sidebar close={() => setMobileOpen(false)} /></aside></>}
    <div className="workspace-area"><Header onMenu={() => setMobileOpen(true)} theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} section={current?.label ?? "Workspace"} /><main className={`main-content${location.pathname === "/signals" ? " signals-main-content" : ""}`}>{location.pathname === "/" ? <Overview /> : location.pathname === "/signals" ? <SignalExplorer /> : <NotAvailable title={current?.label ?? "Workspace"} />}</main></div>
  </div>;
};

export default Index;
