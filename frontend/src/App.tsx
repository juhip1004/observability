import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import LogTable from "./components/LogTable";
import Dashboard from "./components/Dashboard";
import { LayoutDashboard, List, Menu, X } from "lucide-react";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import Network from "./components/Network";
import Database from "./components/Database";
import BigData from "./components/BigData";
import Storage from "./components/Storage";
import { Activity, Server, CheckCircle, AlertTriangle } from "lucide-react";

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/network", label: "Network", icon: Activity },
  { to: "/bigdata", label: "Big Data", icon: Server },
  { to: "/database", label: "Database", icon: List },
  { to: "/storage", label: "Storage", icon: CheckCircle },
  { to: "/logs", label: "Logs", icon: AlertTriangle },
];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-600 to-pink-500 text-white flex flex-col">

  {/* HEADER */}
  <div className="p-6 text-xl font-bold tracking-wide">
    Observability
  </div>

  {/* NAV */}
  <nav className="flex-1 px-3 space-y-2">
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
            isActive
              ? "bg-white/20 backdrop-blur"
              : "hover:bg-white/10"
          )
        }
      >
        <item.icon className="w-5 h-5" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
</aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-4"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">
            System Monitoring
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div className="w-full p-6">  
            <Routes>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/logs" element={<LogTable />} />

  {/* NEW PAGES */}
  <Route path="/network" element={<Network />} />
  <Route path="/bigdata" element={<BigData />} />
  <Route path="/database" element={<Database />} />
  <Route path="/storage" element={<Storage />} />
</Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}