import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Snackbar,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

import { AgentManifestTemplate } from "./OtasAgentManifest";
import AgentManifestModal from "./AgentManifestModal";

interface AgentKey {
  id: string;
  prefix: string;
  expires_at?: string;
  active: boolean;
}

interface Agent {
  id: string;
  name: string;
  provider: string;
  created_at: string;
  is_active: boolean;
  agent_keys: AgentKey[];
}

interface Props {
  agents: Agent[];
  projectId: string | undefined;
  accessToken: string | undefined;
  refreshAgents: () => void;
}

export default function AgentDetailsList({
  agents,
  projectId,
  accessToken,
  refreshAgents,
}: Props) {
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [manifestOpen, setManifestOpen] = useState(false);
  const [manifestContent, setManifestContent] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCreateKey = async (agentId: string) => {
    setLoadingAgentId(agentId);

    function buildManifest(
      template: string,
      projectId: string,
      agentKey: string,
      projectDomain: string
    ) {
      return template
        .replace(/\{\{PROJECT_ID\}\}/g, projectId)
        .replace(/\{\{AGENT_KEY\}\}/g, agentKey)
        .replace(/\{\{PROJECT_DOMAIN\}\}/g, projectDomain);
    }

    try {
      const res = await fetch(
        "http://localhost:8000/api/agent/v1/agents/key/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-OTAS-USER-TOKEN": accessToken || "",
            "X-OTAS-PROJECT-ID": projectId || "",
          },
          body: JSON.stringify({
            agent_id: agentId,
            validity: 30,
          }),
        }
      );

      const data = await res.json();

      if (data.status === 1) {
        navigator.clipboard.writeText(data.response.agent_key.api_key);
        const rawKey = data.response.agent_key.api_key;

        const manifest = buildManifest(
          AgentManifestTemplate,
          projectId || "",
          rawKey,
          window.location.origin
        );

        setManifestContent(manifest);
        setManifestOpen(true);

        setManifestContent(manifest);
        setManifestOpen(true);
        setNewKey(rawKey);
        setSnackbar("New Agent Key created & copied.");
        refreshAgents();
      } else {
        setSnackbar("Failed to create key");
      }
    } catch (err) {
      console.error(err);
      setSnackbar("Error creating key");
    } finally {
      setLoadingAgentId(null);
    }
  };

  if (agents.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No agents created yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Agent Details
      </Typography>

      {/* ===== MOBILE VIEW ===== */}
      {isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", width: "100%", px: 1 }}>
          {agents.map((agent) => {
            const activeKey = agent.agent_keys?.find((k) => k.active);

            return (
              <Paper
                key={agent.id}
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: 3,
                  p: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {agent.name}
                  </Typography>

                  <Chip
                    label={agent.is_active ? "Active" : "Inactive"}
                    color={agent.is_active ? "success" : "default"}
                    size="small"
                  />
                </Box>

                {/* Meta Info */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    <b>Provider:</b> {agent.provider}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <b>Created:</b>{" "}
                    {new Date(agent.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                {/* Key Info */}
                {activeKey ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Expires
                      </Typography>
                      <Typography variant="body2">
                        {activeKey.expires_at
                          ? new Date(activeKey.expires_at).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </Box>

                    <Tooltip title="Copy key prefix">
                      <IconButton
                        onClick={() => {
                          navigator.clipboard.writeText(activeKey.prefix);
                          setSnackbar("Key prefix copied!");
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active key
                  </Typography>
                )}

                {/* Action Button */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<VpnKeyIcon />}
                  onClick={() => handleCreateKey(agent.id)}
                  disabled={loadingAgentId === agent.id}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {loadingAgentId === agent.id ? (
                    <CircularProgress size={18} />
                  ) : (
                    "Create New Key"
                  )}
                </Button>
              </Paper>
            );
          })}
        </Box>
      ) : (
        /* ===== DESKTOP TABLE ===== */
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Provider</b></TableCell>
              <TableCell><b>Created</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell><b>Active Key</b></TableCell>
              <TableCell><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {agents.map((agent) => {
              const activeKey = agent.agent_keys?.find(
                (k) => k.active
              );

              return (
                <TableRow key={agent.id}>
                  <TableCell>{agent.name}</TableCell>
                  <TableCell>{agent.provider}</TableCell>
                  <TableCell>
                    {new Date(
                      agent.created_at
                    ).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={
                        agent.is_active ? "Active" : "Inactive"
                      }
                      color={
                        agent.is_active ? "success" : "default"
                      }
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    {activeKey ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Copy key prefix">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                activeKey.prefix
                              );
                              setSnackbar(
                                "Key prefix copied!"
                              );
                            }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {activeKey.expires_at && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Expires:{" "}
                            {new Date(
                              activeKey.expires_at
                            ).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      "No active key"
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VpnKeyIcon />}
                      onClick={() =>
                        handleCreateKey(agent.id)
                      }
                      disabled={
                        loadingAgentId === agent.id
                      }
                    >
                      {loadingAgentId === agent.id ? (
                        <CircularProgress size={14} />
                      ) : (
                        "Create New Key"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />

      <AgentManifestModal
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        manifestContent={manifestContent}
        agentName="Agent"
        rawAgentKey={newKey ||""}
      />
    </Box>
  );
}