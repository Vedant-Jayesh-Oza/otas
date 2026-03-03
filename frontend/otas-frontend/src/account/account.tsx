import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Divider,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import AppTheme from "../shared-ui-theme/AppTheme";
import { useAuth } from "../AuthContext";
import {
  USER_FIELDS_EDIT_V1_ENDPOINT,
  PASSWORD_UPDATE_V1_ENDPOINT,
  PROJECT_LIST_V1_ENDPOINT,
  AGENT_LIST_V1_ENDPOINT,
} from "../constants";
import ColorModeIconDropdown from "../shared-ui-theme/ColorModeIconDropdown";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import KeyIcon from "@mui/icons-material/Key";

export default function Account(props: { disableCustomTheme?: boolean }) {
  // TypeScript might underline 'accessToken' until you restart the TS Server
  const { user, accessToken, refreshAuth, clearAuth } = useAuth();
  const navigate = useNavigate();

  // Menu and General State
  const [selectedMenu, setSelectedMenu] = useState<"user" | "resetPassword" | "agentKeys">("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [snackBarSuccessValue, snackBarPromptSuccess] = useState<string | null>(null);
  const [snackBarErrorValue, snackBarPromptError] = useState<string | null>(null);

  // Profile State
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Agent Keys State
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Otas | Account Settings";
    if (user) {
      setFirstName(user.first_name);
      setMiddleName(user.middle_name ?? "");
      setLastName(user.last_name);
    }
  }, [user]);

  // Fetch projects when switching to Agent Keys tab
  useEffect(() => {
    if (selectedMenu === "agentKeys" && projects.length === 0) {
      fetchProjects();
    }
  }, [selectedMenu]);

  const fetchProjects = async () => {
    if (!accessToken) return;
    setIsLoadingData(true);
    try {
      const res = await fetch(PROJECT_LIST_V1_ENDPOINT, {
        method: "POST", // ProjectListView backend expects POST
        headers: { "X-OTAS-USER-TOKEN": accessToken },
      });
      const data = await res.json();
      if (data.status === 1) {
        setProjects(data.response_body.projects);
      } else {
        snackBarPromptError(data.status_description || "Failed to fetch projects");
      }
    } catch (err) {
      snackBarPromptError("Network error fetching projects");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleProjectSelection = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setAgents([]);
    if (!accessToken) return;

    setIsLoadingData(true);
    try {
      const res = await fetch(AGENT_LIST_V1_ENDPOINT, {
        method: "GET", // AgentListView backend expects GET
        headers: {
          "X-OTAS-USER-TOKEN": accessToken,
          "X-OTAS-PROJECT-ID": projectId,
        },
      });
      const data = await res.json();
      if (data.status === 1) {
        setAgents(data.response_body.agents);
      }
    } catch (err) {
      snackBarPromptError("Error fetching agents");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(USER_FIELDS_EDIT_V1_ENDPOINT, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "USER_TOKEN": accessToken },
        body: JSON.stringify({ first_name: firstName, middle_name: middleName, last_name: lastName }),
      });
      if (res.ok) {
        refreshAuth();
        snackBarPromptSuccess("Profile updated successfully!");
      }
    } catch (err) {
      snackBarPromptError("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 4, pt: 3 }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <ColorModeIconDropdown />
        </Box>

        <Container maxWidth="md" sx={{ display: "flex", py: 8 }}>
          {/* Sidebar */}
          <Box sx={{ pr: 3, borderRight: "1px solid", borderColor: "divider", minWidth: "220px" }}>
            <List component="nav">
              <ListItemButton selected={selectedMenu === "user"} onClick={() => setSelectedMenu("user")}>
                <ListItemText primary="User Profile" />
              </ListItemButton>
              <ListItemButton selected={selectedMenu === "resetPassword"} onClick={() => setSelectedMenu("resetPassword")}>
                <ListItemText primary="Security" />
              </ListItemButton>
              <Divider sx={{ my: 1 }} />
              <ListItemButton selected={selectedMenu === "agentKeys"} onClick={() => setSelectedMenu("agentKeys")}>
                <ListItemText primary="Agent API Keys" />
              </ListItemButton>
              <ListItemButton onClick={() => { clearAuth(); navigate("/"); }} sx={{ color: "error.main", mt: 4 }}>
                <LogoutRoundedIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
                <ListItemText primary="Logout" />
              </ListItemButton>
            </List>
          </Box>

          {/* Content Area */}
          <Box sx={{ flex: 1, pl: 5 }}>
            {selectedMenu === "user" && (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Personal Information</Typography>
                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField fullWidth label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <TextField fullWidth label="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                  <TextField fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <Button variant="contained" sx={{ width: "fit-content" }} onClick={handleSaveProfile} disabled={isSubmitting}>Update Profile</Button>
                </Box>
              </>
            )}

            {selectedMenu === "agentKeys" && (
              <>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Agent Management</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                  Select a project to manage API keys for specific agents.
                </Typography>
                
                <TextField
                  select
                  fullWidth
                  label="Project"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectSelection(e.target.value)}
                  sx={{ mb: 4 }}
                >
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>

                {isLoadingData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {agents.map((agent) => (
                      <Box key={agent.id} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                        <Typography variant="subtitle1" fontWeight="bold">{agent.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{agent.provider}</Typography>
                        <Divider sx={{ my: 2 }} />
                        <List dense>
                          {agent.agent_keys?.map((key: any) => (
                            <ListItem key={key.id} sx={{ px: 0, justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <KeyIcon sx={{ mr: 2, fontSize: '1rem', color: 'primary.main' }} />
                                <ListItemText 
                                  primary={`Prefix: ${key.prefix}`} 
                                  secondary={`Expires: ${new Date(key.expires_at).toLocaleDateString()}`} 
                                />
                              </Box>
                              <Button size="small" color="error" variant="text" disabled>Revoke</Button>
                            </ListItem>
                          ))}
                          {(!agent.agent_keys || agent.agent_keys.length === 0) && (
                            <Typography variant="body2" color="textSecondary">No active keys.</Typography>
                          )}
                        </List>
                      </Box>
                    ))}
                    {selectedProjectId && agents.length === 0 && (
                      <Typography align="center" color="textSecondary">No agents found in this project.</Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Container>

        <Snackbar open={!!snackBarSuccessValue} autoHideDuration={4000} onClose={() => snackBarPromptSuccess(null)}>
          <Alert severity="success" variant="filled">{snackBarSuccessValue}</Alert>
        </Snackbar>
        <Snackbar open={!!snackBarErrorValue} autoHideDuration={4000} onClose={() => snackBarPromptError(null)}>
          <Alert severity="error" variant="filled">{snackBarErrorValue}</Alert>
        </Snackbar>
      </Box>
    </AppTheme>
  );
}