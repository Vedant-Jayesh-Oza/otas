import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function getLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start: formatDate(start), end: formatDate(end) };
}

// Pivot [{path, data:[{date,count}]}] → [{date, "/path/a": n, "/path/b": n}]
function pivotPathData(
  paths: { path: string; data: { date: string; count: number }[] }[],
) {
  const dateMap: Record<string, Record<string, number>> = {};
  for (const { path, data } of paths) {
    for (const { date, count } of data) {
      if (!dateMap[date]) dateMap[date] = {};
      dateMap[date][path] = count;
    }
  }
  return Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
}

const LINE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

// ── TimeseriesChart ───────────────────────────────────────────────────────────

function TimeseriesChart({
  paths,
  height = 220,
}: {
  paths: { path: string; data: { date: string; count: number }[] }[];
  height?: number;
}) {
  const chartData = pivotPathData(paths);
  const allPaths = paths.map((p) => p.path);

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height,
          width: "100%",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data for this period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          labelFormatter={(l) => `Date: ${l}`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {allPaths.map((path, i) => (
          <Line
            key={path}
            type="monotone"
            dataKey={path}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── AnalyticsCard ─────────────────────────────────────────────────────────────

function AnalyticsCard({
  title,
  loading,
  expandedHeight = 420,
  children,
}: {
  title: string;
  loading: boolean;
  expandedHeight?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          position: "relative",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          bgcolor: "background.paper",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          minHeight: 280,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(true)} title="Expand">
            <OpenInFullIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
          }}
        >
          {loading ? <CircularProgress size={28} /> : children}
        </Box>
      </Box>

      {/* Expanded dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            // Re-render children with taller height for the expanded view
            <Box sx={{ pt: 1 }}>{children}</Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Analytics (page) ──────────────────────────────────────────────────────────

export default function Analytics({
  projectId,
  agents,
}: {
  projectId: string | undefined;
  agents: any[];
}) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── agent selection ──────────────────────────────────────────────────────
  const agentIdFromUrl = searchParams.get("agent_id");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const setAgentInUrl = (id: string, replace = false) => {
    const next = new URLSearchParams(searchParams);
    next.set("agent_id", id);
    navigate({ search: next.toString(), hash: "analytics" }, { replace });
  };

  useEffect(() => {
    if (agents.length === 0) return;
    if (agentIdFromUrl && agents.some((a) => a.id === agentIdFromUrl)) {
      setSelectedAgentId(agentIdFromUrl);
    } else {
      const firstId = agents[0].id;
      setSelectedAgentId(firstId);
      setAgentInUrl(firstId, true);
    }
  }, [agents, agentIdFromUrl]);

  const handleAgentChange = (newId: string) => {
    setSelectedAgentId(newId);
    setAgentInUrl(newId, true);
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  // ── timeseries data ──────────────────────────────────────────────────────
  const [timeseriesData, setTimeseriesData] = useState<
    { path: string; data: { date: string; count: number }[] }[]
  >([]);
  const [timeseriesLoading, setTimeseriesLoading] = useState(false);

  const { start, end } = getLast7Days();

  useEffect(() => {
    if (!accessToken || !projectId || !selectedAgentId) return;

    const fetchTimeseries = async () => {
      setTimeseriesLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8002/api/v1/agent/path-timeseries/?start_date=${start}&end_date=${end}`,
          {
            headers: {
              "X-OTAS-USER-TOKEN": accessToken,
              "X-OTAS-AGENT-ID": selectedAgentId,
              "X-OTAS-PROJECT-ID": projectId,
            },
          },
        );
        const result = await res.json();
        setTimeseriesData(result.status === 1 ? (result.paths ?? []) : []);
      } catch (err) {
        console.error("Failed to fetch timeseries", err);
        setTimeseriesData([]);
      } finally {
        setTimeseriesLoading(false);
      }
    };

    fetchTimeseries();
  }, [selectedAgentId, projectId, accessToken]);

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Analytics
      </Typography>

      {/* Agent selector */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="agent-select-label">Agent</InputLabel>
          <Select
            labelId="agent-select-label"
            value={selectedAgentId}
            label="Agent"
            onChange={(e) => handleAgentChange(e.target.value)}
            disabled={agents.length === 0}
          >
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{agent.name}</span>
                  <Chip
                    label={agent.provider}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", height: 18 }}
                  />
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedAgent && (
          <Typography variant="body2" color="text.secondary">
            {selectedAgent.description}
          </Typography>
        )}
      </Stack>

      {/* Chart grid — add more AnalyticsCard blocks here as you build them out */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        <AnalyticsCard
          title={`API Path Requests  ${start} → ${end}`}
          loading={timeseriesLoading}
        >
          <TimeseriesChart paths={timeseriesData} height={220} />
        </AnalyticsCard>
      </Box>
    </Box>
  );
}
