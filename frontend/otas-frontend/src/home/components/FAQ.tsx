import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    id: "panel1",
    question: "How do I integrate OTAS into my agent?",
    answer:
      "Add the otas_agent_manifest.md file to your agent — that's it. OTAS will automatically begin capturing every API call your agent makes. No SDK wiring, no code changes to your agent logic required.",
  },
  {
    id: "panel2",
    question: "What exactly gets captured?",
    answer:
      "OTAS captures every API endpoint your agent hits, along with timestamps, latency, session context, and any error fields. You can replay any session as a step-by-step DAG and view aggregate analytics across all sessions.",
  },
  {
    id: "panel3",
    question: "Does OTAS work with any agent framework?",
    answer:
      "Yes. OTAS is framework-agnostic. As long as your agent is making HTTP API calls, OTAS will capture them. It works with any Python-based agent or backend service out of the box.",
  },
  {
    id: "panel4",
    question: "Is my agent's data kept private?",
    answer:
      "Yes. Your agent logs and session data are scoped to your project and are never shared or used to train any models. Each project and agent is fully isolated with its own SDK keys.",
  },
  {
    id: "panel5",
    question: "How do agent keys work?",
    answer:
      "When you create an agent in the dashboard, OTAS generates a unique SDK key for it. You can rotate or revoke keys at any time from the Accounts page. Keys are scoped per agent, so a compromised key never affects other agents or projects.",
  },
  {
    id: "panel6",
    question: "How do I contact support?",
    answer: (
      <>
        Reach our team at{" "}
        <Link href="mailto:support@otas.com">support@otas.com</Link> and we'll
        get back to you promptly.
      </>
    ),
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(
        isExpanded
          ? [...expanded, panel]
          : expanded.filter((item) => item !== panel),
      );
    };

  return (
    <Container
      id="faq"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: { xs: 3, sm: 6 },
      }}
    >
      <Typography
        component="h2"
        variant="h4"
        sx={{
          color: "text.primary",
          width: { sm: "100%", md: "60%" },
          textAlign: { sm: "left", md: "center" },
        }}
      >
        Frequently asked questions
      </Typography>
      <Box sx={{ width: "100%" }}>
        {faqs.map(({ id, question, answer }) => (
          <Accordion
            key={id}
            expanded={expanded.includes(id)}
            onChange={handleChange(id)}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${id}-content`}
              id={`${id}-header`}
            >
              <Typography component="span" variant="subtitle2">
                {question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                variant="body2"
                gutterBottom
                sx={{ maxWidth: { sm: "100%", md: "70%" } }}
              >
                {answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}
