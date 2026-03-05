import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    Tooltip,
    Chip,
    Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ReactMarkdown from "react-markdown";

interface Props {
    open: boolean;
    onClose: () => void;
    manifestContent: string | null;
    agentName?: string;
    rawAgentKey: string;
}

export default function AgentManifestModal({
    open,
    onClose,
    manifestContent,
    agentName,
    rawAgentKey,
}: Props) {
    const handleCopy = () => {
        if (manifestContent) {
            navigator.clipboard.writeText(manifestContent);
        }
    };
    console.log(rawAgentKey);
    

    const handleDownload = () => {
        if (!manifestContent) return;
        const blob = new Blob([manifestContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `OTAS_AGENT_MANIFEST_${agentName || "agent"}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{ display: "flex", justifyContent: "space-between" }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography fontWeight={700}>Agent Key & Manifest</Typography>
                    <Chip
                        icon={<CheckCircleOutlineIcon />}
                        label="Success"
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                </Box>

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    borderRadius: 2,
                    borderColor: "success.light",
                    bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                            ? "rgba(46,125,50,0.08)"
                            : "rgba(46,125,50,0.05)",
                }}
            >
                <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight={700}
                    sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}
                >
                    Agent Key — store this securely
                </Typography>
                <Box
                    sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: "action.selected",
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        wordBreak: "break-all",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                    }}
                >
                    <span>{rawAgentKey}</span>
                    <Tooltip title="Copy key">
                        <IconButton
                            size="small"
                            onClick={() => {
                                navigator.clipboard.writeText(
                                    rawAgentKey,
                                );
                                // setSnackbar("Agent key copied!");
                            }}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Box
                    sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: "background.paper",
                        maxHeight: 500,
                        overflowY: "auto",

                        "& h1, & h2, & h3": { mt: 2, mb: 1 },
                        "& code": {
                            bgcolor: "action.selected",
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 1,
                            fontFamily: "monospace",
                        },
                        "& pre": {
                            bgcolor: "action.selected",
                            p: 2,
                            borderRadius: 2,
                            overflowX: "auto",
                        },
                    }}
                >
                    <ReactMarkdown>{manifestContent || ""}</ReactMarkdown>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions>
                <Tooltip title="Copy markdown">
                    <Button
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopy}
                    >
                        Copy
                    </Button>
                </Tooltip>

                <Tooltip title="Download .md file">
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                    >
                        Download
                    </Button>
                </Tooltip>

                <Button onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
}