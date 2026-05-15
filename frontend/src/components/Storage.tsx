import { useEffect, useState } from "react";
import { fetchLogs } from "../api/logs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";

const socket = io("http://localhost:6001");

export default function Storage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    fetchLogs(1, 50).then((res) => {
      const data = (res.logs || []).filter(
        (log: any) => log.service === "storage"
      );

      setLogs(data);
      updateChart(data);
    });

    // 🔥 REALTIME LISTENER
    socket.on("new_log", (newLog) => {
      if (newLog.service === "storage") {
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

  // 🔥 Chart logic (no random anymore)
  const updateChart = (data: any[]) => {
  const usage = data.map((_, i) => ({
    time: i,
    usage: data.length * 5,
  }));

  setChartData(usage);
};

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">💾 Storage Monitoring</h2>

      {/* USAGE GRAPH */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Disk Usage</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usage" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-4 border rounded-lg mb-6">
  <p className="mb-2">Disk Usage</p>

  <div className="w-full bg-gray-200 h-4 rounded">
    <div
      className="bg-purple-500 h-4 rounded"
      style={{
        width: `${Math.min(logs.length * 5, 100)}%`,
      }}
    />
  </div>

  <p className="text-sm mt-2">
    {logs.length * 5} MB used
  </p>
</div>

      {/* STORAGE NODES */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Storage Nodes</h3>

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