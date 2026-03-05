import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { Box, Typography } from "@mui/material";

import HighlightedCard from "./HighlightedCard";
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useTheme, useColorScheme } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Tooltip from "@mui/material/Tooltip";
import CreateAgent from "./CreateAgent";
import CreateBackendSdkKey from "./CreateBackendSdkKey";
import { log } from "console";
import AgentDetails from "./AgentDetailsList";
import AgentDetailsList from "./AgentDetailsList";

export default function MainGrid({
  projectId,
  projectDomain,
  agents,
  agentsLoading,
  refreshAgents,
}: {
  projectId: string | undefined;
  projectDomain: string | null | undefined;
  agents: any[];
  agentsLoading: boolean;
  refreshAgents: () => void;
}) {
  const { user, accessToken } = useAuth();
  const [rows, setRows] = useState<Algorithm[]>([]);
  const navigate = useNavigate();
  
  
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;
  
  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Create Agent Section */}
      <Grid container spacing={2} columns={12}>
        <Box sx={{ width: "100%", maxWidth: "100%", mb: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create Agent
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <CreateAgent
              projectId={projectId}
              projectDomain={projectDomain}
              accessToken={accessToken || undefined}
              onAgentCreated={() => {
                refreshAgents();
                // optionally refresh agent list here
              }}
            />
            <CreateBackendSdkKey
              projectId={projectId}
              accessToken={accessToken || undefined}
            />
          </Box>
        </Box>
      </Grid>

      {/* Agent Details Section */}
      <Grid container spacing={2} columns={12} sx={{ width: "100%", mt: 2, maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box sx={{ width: "100%", maxWidth: "100%" }}>
          
          {
            agentsLoading ? (
              <Typography variant="body1">Loading agents...</Typography>
            ) : agents.length === 0 ? (
              <Typography variant="body1">No agents found. Create one to get started!</Typography>
            ) : (
                  <AgentDetailsList
                    agents={agents}
                    projectId={projectId}
                    accessToken={accessToken || undefined}
                    refreshAgents={refreshAgents}
                  />

            )
          }

        </Box>
      </Grid>
    </Box>
  );
}
