import { useEffect, useState } from "react";
import { fetchLogs } from "../api/logs";
import { io, Socket } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Network() {
  const [logs, setLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Convert logs → chart
  const updateChart = (logData: any[]) => {
  const formatted = logData.map((log) => ({
    time: new Date(log.received_at).toLocaleTimeString(),
    latency:
      log.level === "error"
        ? 300
        : log.level === "warn"
        ? 150
        : 50,
  }));

  setChartData(formatted);
};

  useEffect(() => {
    // ✅ Initial fetch
    fetchLogs(1, 50).then((res) => {
      const logData = res.logs || [];
      setLogs(logData);
      updateChart(logData);
    });

    // ✅ Create socket INSIDE useEffect (important)
    const newSocket = io("http://localhost:6001");
    setSocket(newSocket);

    // ✅ Realtime listener
    newSocket.on("new_log", (newLog) => {
      setLogs((prev) => {
        const updated = [newLog, ...prev.slice(0, 49)];
        updateChart(updated);
        return updated;
      });
    });

    // ✅ Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Network Observability</h2>

      {/* LATENCY CHART */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Latency Trend</h3>

        <ResponsiveContainer width="100%" height={250}>
  <LineChart data={chartData}>
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line
      type="monotone"
      dataKey="latency"
      stroke="#8b5cf6"
      strokeWidth={3}
      dot={{ r: 4 }}
    />
  </LineChart>
</ResponsiveContainer>
</div>

      {/* ACTIVE NODES */}
      <div className="border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Active Nodes</h3>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {logs.map((log: any, i: number) => (
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
};