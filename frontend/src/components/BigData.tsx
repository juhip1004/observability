import { useEffect, useState } from "react";
import { fetchLogs } from "../api/logs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";

const socket = io("http://localhost:6001");

export default function BigData() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Initial load
    fetchLogs(1, 50).then((res) => {
      const data = (res.logs || []).filter(
        (log: any) => log.service === "bigdata"
      );

      setLogs(data);
      updateChart(data);
    });

    // 🔥 REALTIME LISTENER
    socket.on("new_log", (newLog) => {
      if (newLog.service === "bigdata") {
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

  // 🔥 Replace random data with meaningful simulation
  const updateChart = (data: any[]) => {
  const pipelineData = data.map((_, i) => ({
    name: `Batch-${i}`,
    volume: data.filter((l) => l.service === "bigdata").length,
  }));

  setChartData(pipelineData);
};

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Big Data Pipelines</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
  <div className="p-4 border rounded-lg">
    <p className="text-sm">Throughput</p>
    <p className="text-xl font-bold">
      {logs.length * 10} events/sec
    </p>
  </div>

  <div className="p-4 border rounded-lg">
    <p className="text-sm">Failed Jobs</p>
    <p className="text-xl text-red-500">
      {logs.filter(l => l.level === "error").length}
    </p>
  </div>

  <div className="p-4 border rounded-lg">
    <p className="text-sm">Active Pipelines</p>
    <p className="text-xl">
      {new Set(logs.map(l => l.service)).size}
    </p>
  </div>
</div>

      {/* PIPELINE CHART */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Data Throughput</h3>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PIPELINE NODES */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Pipeline Nodes</h3>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log, i) => (
            <div
              key={i}
              className="flex justify-between p-3 border rounded-lg text-sm"
            >
              <div>
                <p className="font-medium">{log.app_name}</p>
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