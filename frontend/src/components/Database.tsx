import { useEffect, useState } from "react";
import { fetchLogs } from "../api/logs";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";

const socket = io("http://localhost:6001");

const COLORS = ["#22c55e", "#ef4444", "#eab308"];

export default function Database() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    fetchLogs(1, 50).then((res) => {
      const data = (res.logs || []).filter(
        (log: any) => log.service === "database"
      );

      setLogs(data);
      updateChart(data);
    });

    // 🔥 REALTIME LISTENER
    socket.on("new_log", (newLog) => {
      if (newLog.service === "database") {
        setLogs((prev) => {
          const updated = [newLog, ...prev.slice(0, 49)];
          updateChart(updated);
          return updated;
        });
      }
    });

    return () => {
      socket.off("new_log");
    };
  }, []);

  // 🔥 Chart updater
  const updateChart = (data: any[]) => {
    const counts = {
      success: 0,
      error: 0,
      warn: 0,
    };

    data.forEach((log: any) => {
      if (log.level === "error") counts.error++;
      else if (log.level === "warn") counts.warn++;
      else counts.success++;
    });

    setChartData([
      { name: "Success", value: counts.success },
      { name: "Errors", value: counts.error },
      { name: "Warnings", value: counts.warn },
    ]);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Database Monitoring</h2>


      {/* QUERY DISTRIBUTION */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Query Distribution</h3>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={chartData} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>


      <div className="p-4 border rounded-lg mb-6">
  <p>Avg Query Load: {logs.length * 2} ms</p>

  <p>
    Failure Rate: {
      logs.length > 0
        ? (
            logs.filter(l => l.level === "error").length /
            logs.length *
            100
          ).toFixed(1)
        : 0
    }%
  </p>
</div>

      {/* DATABASE NODES */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Database Nodes</h3>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex justify-between p-3 border rounded-lg text-sm"
            >
              <div>
                <p className="font-medium">{log.service}</p>
                <p className="text-xs text-muted-foreground">
                  {log.message}
                </p>
              </div>

              <span
                className={`text-xs px-2 py-1 rounded ${
                  log.level === "error"
                    ? "bg-red-500 text-white"
                    : log.level === "warn"
                    ? "bg-yellow-400"
                    : "bg-green-500 text-white"
                }`}
              >
                {log.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}