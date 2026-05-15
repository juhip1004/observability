//WE CAN USE SERVER SIDE COMPONENTS TO REDUCE INITIAL LOAD.

import { useEffect, useState } from "react";
import { fetchStats, exportLogs, fetchLogs } from "../api/logs";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from "recharts";
import { Activity, AlertTriangle, CheckCircle, Download, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";


const COLORS = {
  error: "#ef4444",
  warn: "#eab308",
  info: "#3b82f6",
  success: "#22c55e",
  debug: "#a855f7"
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  type Log = {
  level: string;
  service: string;
  };

  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState({
  cpu: 0,
  memory: 0,
  requests: 0,
});

  const [history, setHistory] = useState<any[]>([]);

  const totalLogs = logs.length;
  const errorLogs = logs.filter(l => l.level === "error").length;

  const errorRate =
    totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(1) : 0;

  const networkLogs = logs.filter(l => l.service === "network");
  const dbLogs = logs.filter(l => l.service === "database");
  const bigDataLogs = logs.filter(l => l.service === "bigdata");
  const dbData = [
  { name: "Error", value: logs.filter(l => l.service === "database" && l.level === "error").length },
  { name: "Warn", value: logs.filter(l => l.service === "database" && l.level === "warn").length },
  { name: "Info", value: logs.filter(l => l.service === "database" && l.level === "info").length }
];

const safeDbData = dbData.every(d => d.value === 0)
  ? [{ name: "No Data", value: 1 }]
  : dbData;

  useEffect(() => {
    fetchLogs(1, 100).then((res) => {
      setLogs(res.rows || res.logs || []);
    });
  }, []);

  useEffect(() => {
  fetchStats().then(setStats);
}, []);

useEffect(() => {
  const fetchMetrics = async () => {
    try {
      const res = await fetch("http://localhost:6001/metrics");
      const data = await res.json();
      setMetrics(data);
      setHistory(prev => [
        ...prev.slice(-20), // keep last 20 points
  {
    time: new Date().toLocaleTimeString(),
    cpu: data.cpu,
    memory: data.memory,
    requests: data.requests,
  },
]);
    } catch (err) {
      console.error("Metrics fetch failed", err);
    }
  };

  fetchMetrics();
  const interval = setInterval(fetchMetrics, 2000);

  return () => clearInterval(interval);
}, []);

  if (!stats) return <div className="p-8">Loading stats...</div>;

  const pieData = [
  { name: "ERROR", value: stats?.errorCount || 0 },
  { name: "WARN", value: stats?.warnCount || 0 },
  { name: "INFO", value: (stats?.totalLogs || 0) - (stats?.errorCount || 0) - (stats?.warnCount || 0) }
];


  return (
  <div className="space-y-6 p-4">
    {parseFloat(stats.errorRate) > 20 && (
  <div className="mb-6 p-4 rounded-xl bg-red-100 border border-red-300">
    <p className="font-semibold text-red-700">🚨 System Alerts</p>
    <ul className="text-sm mt-2">
      <li>• High error rate detected ({stats.errorRate})</li>
      <li>• System instability possible</li>
    </ul>
  </div>
)}
    <div className="grid grid-cols-3 gap-4 mb-6">

  {/* CPU */}
  <div className="p-4 rounded-xl shadow bg-gradient-to-br from-purple-500/10 to-purple-500/5">
    <p className="text-sm text-gray-500">CPU Usage</p>
    <h2 className="text-2xl font-bold">{metrics.cpu}%</h2>

    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={history}>
        <Line type="monotone" dataKey="cpu" stroke="#a855f7" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* MEMORY */}
  <div className="p-4 rounded-xl shadow bg-gradient-to-br from-blue-500/10 to-blue-500/5">
    <p className="text-sm text-gray-500">Memory</p>
    <h2 className="text-2xl font-bold">{metrics.memory}%</h2>

    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={history}>
        <Line type="monotone" dataKey="memory" stroke="#3b82f6" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* REQUESTS */}
  <div className="p-4 rounded-xl shadow bg-gradient-to-br from-green-500/10 to-green-500/5">
    <p className="text-sm text-gray-500">Requests/sec</p>
    <h2 className="text-2xl font-bold">{metrics.requests}</h2>

    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={history}>
        <Line type="monotone" dataKey="requests" stroke="#22c55e" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>

</div>

    <div className="flex items-center justify-between">
  <h2 className="text-2xl font-bold">System Observability</h2>

  <div className="flex gap-2">
    <button
      onClick={() => exportLogs("csv")}
      className="px-3 py-1 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600"
    >
      Download CSV
    </button>

    <button
      onClick={() => exportLogs("json")}
      className="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600"
    >
      Download JSON
    </button>
  </div>
</div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[75vh]">

      {/* ================= NETWORK ================= */}
      <div
  onClick={() => navigate("/logs?service=network")}
  className="cursor-pointer rounded-2xl p-5 border flex flex-col justify-between h-full transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/20"
>
  {/* TOP */}
  <div>
    <h3 className="font-semibold text-lg mb-1">Network</h3>

    <p className="text-3xl font-bold">
      {logs.filter(l => l.service === "network").length}
    </p>
    <p className="text-xs text-muted-foreground">Requests</p>

    <p className="mt-2 text-sm">
      Error Rate:{" "}
      <span className="text-red-500 font-semibold">
        {(
          logs.filter(l => l.service === "network" && l.level === "error").length /
          (logs.filter(l => l.service === "network").length || 1) * 100
        ).toFixed(1)}%
      </span>
    </p>

    <div className="mt-1 text-xs">
      {logs.filter(l => l.service === "network" && l.level === "error").length > 2
        ? <span className="text-red-500">⚠ Unstable</span>
        : <span className="text-green-500">✅ Healthy</span>}
    </div>
  </div>

  {/* MINI GRAPH */}
  <div className="h-[80px] mt-3">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={history}>
      <defs>
        <linearGradient id="networkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
        </linearGradient>
      </defs>

      <Area
        type="monotone"
        dataKey="requests"
        stroke="#a855f7"
        fill="url(#networkGrad)"
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
</div>

  {/* FOOTER */}
  <div className="text-xs text-muted-foreground mt-2">
    View details →
  </div>
</div>

      {/* ================= BIG DATA ================= */}
      <div
  onClick={() => navigate("/logs?service=bigdata")}
  className="cursor-pointer rounded-2xl p-5 border flex flex-col justify-between h-full transition-all duration-300 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:scale-[1.03] hover:shadow-xl hover:shadow-green-500/20"
>
  <div>
    <h3 className="font-semibold text-lg mb-1">Big Data</h3>

    <p className="text-3xl font-bold">
      {logs.filter(l => l.service === "bigdata").length}
    </p>
    <p className="text-xs text-muted-foreground">Events</p>
  </div>

  <div className="h-[80px] mt-3">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={logs.filter(l => l.service === "bigdata").slice(-10).map((log, i) => ({
          time: i,
          value: log.level === "error" ? 2 : 1,
        }))}
      >
        <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>

  <div className="text-xs text-muted-foreground mt-2">
    View pipelines →
  </div>
</div>

      {/* ================= DATABASE ================= */}
<div
  onClick={() => navigate("/logs?service=database")}
  className="cursor-pointer rounded-2xl p-5 border flex flex-col justify-between h-full transition-all duration-300 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:scale-[1.03] hover:shadow-xl hover:shadow-cyan-500/20"
>
  <div>
    <h3 className="font-semibold text-lg mb-1">Database</h3>

    <p className="text-3xl font-bold">
      {logs.filter(l => l.service === "database").length}
    </p>
    <p className="text-xs text-muted-foreground">Queries</p>

    <p className="mt-2 text-sm">
      Failures:{" "}
      <span className="text-red-500 font-semibold">
        {logs.filter(l => l.service === "database" && l.level === "error").length}
      </span>
    </p>
  </div>

  <div className="h-[220px] mt-4 flex items-center justify-center">
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>

      <defs>
        <filter id="shadow">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="#60a5fa"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <Pie
        data={safeDbData}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius={55}
        outerRadius={85}
        paddingAngle={4}
        animationBegin={0}
        animationDuration={1200}
        animationEasing="ease-out"
        filter="url(#shadow)"
      >
        {safeDbData.map((_, index) => (
          <Cell
            key={index}
            fill={
              index === 0
                ? "#ef4444"
                : index === 1
                ? "#eab308"
                : "#3b82f6"
            }
          />
        ))}
      </Pie>

      <Tooltip />

    </PieChart>
  </ResponsiveContainer>
</div>
<div className="flex justify-center gap-4 text-xs mt-2">
  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded-full bg-red-500" />
    Error
  </div>

  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded-full bg-yellow-500" />
    Warn
  </div>

  <div className="flex items-center gap-1">
    <div className="w-3 h-3 rounded-full bg-blue-500" />
    Info
  </div>
</div>

  <div className="text-xs text-muted-foreground mt-2">
    View queries →
  </div>
</div>

      {/* ================= STORAGE ================= */}
<div
  onClick={() => navigate("/logs?service=storage")}
  className="cursor-pointer rounded-2xl p-5 border flex flex-col justify-between h-full transition-all duration-300 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 hover:scale-[1.03] hover:shadow-xl hover:shadow-yellow-500/20"
>
  <div>
    <h3 className="font-semibold text-lg mb-1">Storage</h3>

    <p className="text-3xl font-bold">
      {logs.length * 5} MB
    </p>
    <p className="text-xs text-muted-foreground">Usage</p>
  </div>

  {/* 🔥 IMPROVED CHART */}
  <div className="h-[120px] mt-3">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={[
        { name: "Used", value: logs.length * 5 },
        { name: "Free", value: 500 - logs.length * 5 }
      ]}
    >
      <XAxis dataKey="name" hide />
      <YAxis hide />
      <Tooltip />
      <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

  <div className="text-xs text-muted-foreground mt-2">
    View storage →
  </div>
</div>
</div> 

    <div className="mt-6 p-4 bg-white rounded-xl shadow">
  <p className="font-semibold mb-3">📊 System Load (Real-time)</p>

  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={history}>
      
      {/* 🔥 GRADIENTS (glow effect) */}
      <defs>
        <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
        </linearGradient>

        <linearGradient id="memGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>

        <linearGradient id="reqGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
        </linearGradient>
      </defs>

      {/* 🔥 AXIS + TOOLTIP */}
      <XAxis dataKey="time" hide />
      <YAxis />
      <Tooltip />

      {/* 🔥 ANIMATED AREAS */}
      <Area
        type="monotone"
        dataKey="cpu"
        stackId="1"
        stroke="#8b5cf6"
        fill="url(#cpuGlow)"
        strokeWidth={2}
        isAnimationActive={true}
        animationDuration={800}
      />

      <Area
        type="monotone"
        dataKey="memory"
        stackId="1"
        stroke="#3b82f6"
        fill="url(#memGlow)"
        strokeWidth={2}
        isAnimationActive={true}
        animationDuration={800}
      />

      <Area
        type="monotone"
        dataKey="requests"
        stackId="1"
        stroke="#22c55e"
        fill="url(#reqGlow)"
        strokeWidth={2}
        isAnimationActive={true}
        animationDuration={800}
      />

    </AreaChart>
  </ResponsiveContainer>
</div>
    <div className="mt-6 p-4 bg-white rounded-xl shadow">
  <p className="font-semibold mb-3">🌍 Traffic Distribution</p>

  <div className="grid grid-cols-3 gap-4 text-center text-sm">
    <div className="p-3 bg-blue-50 rounded-lg">
      <p className="text-lg font-bold">120</p>
      <p>US</p>
    </div>

    <div className="p-3 bg-green-50 rounded-lg">
      <p className="text-lg font-bold">200</p>
      <p>India</p>
    </div>

    <div className="p-3 bg-yellow-50 rounded-lg">
      <p className="text-lg font-bold">90</p>
      <p>EU</p>
    </div>
  </div>
</div>
  </div>
);
}