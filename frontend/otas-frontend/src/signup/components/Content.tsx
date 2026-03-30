import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";

const items = [
  {
    icon: <DescriptionRoundedIcon fontSize="large" />,
    title: "One manifest file to get started",
    description:
      "Drop otas_agent_manifest.md into your agent and OTAS immediately starts capturing every API call it makes.",
  },
  {
    icon: <QueryStatsRoundedIcon fontSize="large" />,
    title: "Full session observability",
    description:
      "Track latency, error rates, and log counts across all your agent sessions — updated automatically.",
  },
  {
    icon: <AccountTreeRoundedIcon fontSize="large" />,
    title: "Session DAG replay",
    description:
      "Inspect any agent session as a step-by-step directed graph. See exactly what your agent did and when.",
  },
  {
    icon: <VpnKeyRoundedIcon fontSize="large" />,
    title: "Secure agent key management",
    description:
      "Generate, rotate, and revoke SDK keys per agent from the dashboard. Every project stays fully isolated.",
  },
];

export default function Content() {
  return (
    <Stack
      sx={{
        flexDirection: "column",
        alignSelf: "center",
        gap: 4,
        maxWidth: 450,
      }}
    >
      <Box sx={{ display: { xs: "none", md: "flex" } }}></Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2 }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: "medium" }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}
