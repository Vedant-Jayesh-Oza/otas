import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "../../AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AGENT_SESSION_EVENTS_ENDPOINT,
  AGENT_SESSION_LIST_V1_ENDPOINT,
} from "../../constants";

export interface SessionLogEvent {
  event_id: string;
  event_time: string;
  event_date: string | null;
  project_id: string;
  agent_id: string | null;
  agent_session_id: string | null;
  path: string;
  method: string;
  status_code: number;
  latency_ms: number;
  request_size_bytes: number;
  response_size_bytes: number;
  request_headers: string | null;
  request_body: string | null;
  query_params: string | null;
  post_data: string | null;
  response_headers: string | null;
  response_body: string | null;
  request_content_type: string | null;
  response_content_type: string | null;
  custom_properties: unknown;
  error: string | null;
  metadata: unknown;
  created_at: string;
}

function statusChipColor(
  status: number,
): "success" | "warning" | "error" | "default" {
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  if (status >= 200 && status < 300) return "success";
  return "default";
}

export default function SessionTimeline({
  projectId,
  agents = [],
}: {
  projectId: string | undefined;
  agents: { id: string; name: string; provider?: string }[];
}) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const agentIdFromUrl = searchParams.get("agent_id");
  const sessionIdFromUrl = searchParams.get("session_id");

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const setTimelineParams = useCallback(
    (agentId: string, sessionId: string | null, replace = false) => {
      const next = new URLSearchParams(searchParams);
      next.set("agent_id", agentId);
      if (sessionId) next.set("session_id", sessionId);
      else next.delete("session_id");
      navigate({ search: next.toString(), hash: "timeline" }, { replace });
    },
    [navigate, searchParams],
  );

  useEffect(() => {
    if (agents.length === 0) {
      setSelectedAgentId("");
      return;
    }
    if (agentIdFromUrl && agents.some((a) => a.id === agentIdFromUrl)) {
      setSelectedAgentId(agentIdFromUrl);
    } else {
      const firstId = agents[0].id;
      setSelectedAgentId(firstId);
      setTimelineParams(firstId, null, true);
    }
  }, [agents, agentIdFromUrl, setTimelineParams]);

  const [sessions, setSessions] = useState<
    { id: string; created_at: string; meta?: Record<string, unknown> }[]
  >([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (!accessToken || !projectId || !selectedAgentId) {
      setSessions([]);
      return;
    }

    const load = async () => {
      setSessionsLoading(true);
      try {
        const res = await fetch(
          `${AGENT_SESSION_LIST_V1_ENDPOINT}?agent_id=${selectedAgentId}`,
          {
            headers: {
              "X-OTAS-USER-TOKEN": accessToken,
              "X-OTAS-PROJECT-ID": projectId,
            },
          },
        );
        const data = await res.json();
        if (data.status === 1) {
          const list = data.response?.sessions ?? [];
          setSessions(list);
          const ids = new Set(list.map((s: { id: string }) => s.id));
          if (sessionIdFromUrl && ids.has(sessionIdFromUrl)) {
            setSelectedSessionId(sessionIdFromUrl);
          } else if (list.length > 0) {
            const pick = list[0].id;
            setSelectedSessionId(pick);
            setTimelineParams(selectedAgentId, pick, true);
          } else {
            setSelectedSessionId("");
            setTimelineParams(selectedAgentId, null, true);
          }
        } else {
          setSessions([]);
          setSelectedSessionId("");
        }
      } catch {
        setSessions([]);
        setSelectedSessionId("");
      } finally {
        setSessionsLoading(false);
      }
    };

    load();
  }, [accessToken, projectId, selectedAgentId]);

  useEffect(() => {
    if (!sessionIdFromUrl || sessions.length === 0) return;
    if (sessions.some((s) => s.id === sessionIdFromUrl)) {
      setSelectedSessionId(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl, sessions]);

  const [events, setEvents] = useState<SessionLogEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!accessToken || !projectId || !selectedAgentId || !selectedSessionId) {
      setEvents([]);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    try {
      const url = new URL(AGENT_SESSION_EVENTS_ENDPOINT);
      url.searchParams.set("session_id", selectedSessionId);
      url.searchParams.set("limit", "200");

      const res = await fetch(url.toString(), {
        headers: {
          "X-OTAS-USER-TOKEN": accessToken,
          "X-OTAS-AGENT-ID": selectedAgentId,
          "X-OTAS-PROJECT-ID": projectId,
        },
      });
      const data = await res.json();
      if (data.status === 1) {
        setEvents(data.events ?? []);
      } else {
        setEvents([]);
        setEventsError(data.status_description ?? "Failed to load events");
      }
    } catch {
      setEvents([]);
      setEventsError("Network error");
    } finally {
      setEventsLoading(false);
    }
  }, [accessToken, projectId, selectedAgentId, selectedSessionId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAgentChange = (newId: string) => {
    setSelectedAgentId(newId);
    setSelectedSessionId("");
    setEvents([]);
    setTimelineParams(newId, null, true);
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setTimelineParams(selectedAgentId, sessionId, true);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: 960 } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Session log timeline
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose an agent and session to see captured logs in time order (Brain).
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="tl-agent-label">Agent</InputLabel>
          <Select
            labelId="tl-agent-label"
            value={selectedAgentId}
            label="Agent"
            onChange={(e) => handleAgentChange(e.target.value)}
            disabled={agents.length === 0}
          >
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel id="tl-session-label">Session</InputLabel>
          <Select
            labelId="tl-session-label"
            value={selectedSessionId}
            label="Session"
            onChange={(e) => handleSessionChange(e.target.value)}
            disabled={sessions.length === 0 || sessionsLoading}
          >
            {sessions.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Stack>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {s.id.slice(0, 8)}…
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(s.created_at).toLocaleString()}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="outlined" size="small" onClick={() => fetchEvents()} disabled={eventsLoading || !selectedSessionId}>
          Refresh
        </Button>
      </Stack>

      {sessionsLoading && (
        <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!sessionsLoading && sessions.length === 0 && selectedAgentId && (
        <Typography variant="body2" color="text.secondary">
          No sessions for this agent yet. Create a session from your agent integration, then log events.
        </Typography>
      )}

      {eventsError && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {eventsError}
        </Typography>
      )}

      {eventsLoading && !sessionsLoading && (
        <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!eventsLoading && selectedSessionId && events.length === 0 && !eventsError && (
        <Typography variant="body2" color="text.secondary">
          No log events for this session. Emit logs with the SDK or agent manifest while this session is active.
        </Typography>
      )}

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {events.map((ev) => (
          <Accordion key={ev.event_id} disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ py: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  {new Date(ev.event_time).toLocaleString()}
                </Typography>
                <Chip label={ev.method} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                <Typography variant="body2" sx={{ wordBreak: "break-all", flex: 1, minWidth: 120 }}>
                  {ev.path}
                </Typography>
                <Chip
                  label={ev.status_code}
                  size="small"
                  color={statusChipColor(ev.status_code)}
                />
                <Typography variant="caption" color="text.secondary">
                  {ev.latency_ms} ms
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {ev.error && (
                  <Typography variant="body2" color="error.main" sx={{ whiteSpace: "pre-wrap" }}>
                    {ev.error}
                  </Typography>
                )}
                {(ev.request_body || ev.response_body || ev.request_headers || ev.response_headers) && (
                  <Stack spacing={0.5}>
                    {ev.request_headers && (
                      <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
                        <strong>Request headers</strong>
                        {"\n"}
                        {ev.request_headers}
                      </Typography>
                    )}
                    {ev.request_body && (
                      <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
                        <strong>Request body</strong>
                        {"\n"}
                        {ev.request_body}
                      </Typography>
                    )}
                    {ev.response_headers && (
                      <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
                        <strong>Response headers</strong>
                        {"\n"}
                        {ev.response_headers}
                      </Typography>
                    )}
                    {ev.response_body && (
                      <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", bgcolor: "action.hover", p: 1, borderRadius: 1 }}>
                        <strong>Response body</strong>
                        {"\n"}
                        {ev.response_body}
                      </Typography>
                    )}
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary">
                  event_id: {ev.event_id}
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}
