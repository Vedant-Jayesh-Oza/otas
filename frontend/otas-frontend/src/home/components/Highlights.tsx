import { Box, Card, Container, Stack, Typography } from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import { useColorScheme } from "@mui/material/styles";

const items = [
  {
    icon: <DescriptionRoundedIcon fontSize="large" />,
    title: "One manifest file",
    description:
      "Drop otas_agent_manifest.md into your agent. No SDK wiring, no config overhead. That's the entire integration.",
  },
  {
    icon: <QueryStatsRoundedIcon fontSize="large" />,
    title: "Automatic API capture",
    description:
      "Every API endpoint your agent hits is captured and logged automatically — zero instrumentation required.",
  },
  {
    icon: <AccountTreeRoundedIcon fontSize="large" />,
    title: "Session DAG replay",
    description:
      "Replay any agent session as a step-by-step directed graph. See exactly what actions fired and in what order.",
  },
  {
    icon: <BugReportRoundedIcon fontSize="large" />,
    title: "Error rate tracking",
    description:
      "Monitor per-day error rates over a rolling 7-day window. Non-null error fields are counted and surfaced automatically.",
  },
  {
    icon: <SpeedRoundedIcon fontSize="large" />,
    title: "Latency distribution",
    description:
      "Quartile graphs across all sessions show you where your agent is slow before it becomes a production problem.",
  },
  {
    icon: <VpnKeyRoundedIcon fontSize="large" />,
    title: "Agent key management",
    description:
      "Create, rotate, and revoke agent SDK keys from the dashboard. Each agent and project is fully isolated.",
  },
];

export default function Highlights() {
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;

  const isDark = resolvedMode === "dark";

  return (
    <Box
      id="highlights"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        color: isDark ? "grey.100" : "grey.900",
        bgcolor: "background.default",
      }}
    >
      <Container
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 3, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: { sm: "100%", md: "60%" },
            textAlign: { sm: "left", md: "center" },
          }}
        >
          <Typography component="h2" variant="h4" gutterBottom>
            Everything you need to trust your agents in production
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: isDark ? "grey.400" : "grey.600" }}
          >
            OTAS gives engineering teams full visibility into how their AI
            agents behave — without changing how agents are built.
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}
        >
          {items.map((item, index) => (
            <Box key={index}>
              <Stack
                direction="column"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{
                  color: "inherit",
                  p: 3,
                  height: "100%",
                  borderColor: isDark ? "hsla(220, 25%, 25%, 0.3)" : "grey.200",
                  backgroundColor: isDark ? "grey.800" : "grey.100",
                }}
              >
                <Box
                  sx={{
                    opacity: 0.6,
                    color: isDark ? "grey.300" : "primary.main",
                  }}
                >
                  {item.icon}
                </Box>
                <div>
                  <Typography gutterBottom sx={{ fontWeight: "medium" }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: isDark ? "grey.400" : "grey.700" }}
                  >
                    {item.description}
                  </Typography>
                </div>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
