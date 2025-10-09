import React, { useState } from "react";
import {
  Box,
  IconButton,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const MAX_SIZE_MB = 50; // adjust as needed
const LivenessDetection = ({
  activeItem = null,
  onClose = () => {},
  onSave = () => {},
  facebooklink=null
}) => {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState(""); // "success" | "error" | "messenger"
  const [uploadAttempts, setUploadAttempts] = useState(0);

  const uploadInChunks = async (file, activeItem) => {
    const baseendpoint =
      process.env.REACT_APP_ENV !== "development"
        ? "https://ewbservices.ewbconsumerlending.com"
        : "http://localhost:5000";

    const endpoint = `${baseendpoint}/uploadliveness`;
    activeItem["filename"] = file.name;
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("chunkIndex", "0"); // only 1 chunk
    formData.append("totalChunks", "1");
    formData.append("filename", file.name);
    formData.append("contentType", file.type);
    formData.append("chatbotdata", JSON.stringify(activeItem));

    try {
      setIsSubmitting(true);

      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (res.status !== 200) {
        throw new Error(
          `❌ Upload failed (HTTP ${res.status}): ${data.message || "Unknown error"}`
        );
      }

      return data;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (file, activeItem) => {
    if (!file) {
      alert("No video recorded.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Video exceeds ${MAX_SIZE_MB}MB limit`);
      return;
    }

    setIsSubmitting(true);
    let success = false;
    let attempts = 0;

    while (!success && attempts < 3) {
      try {
        attempts++;
        await uploadInChunks(file, activeItem);

        const UPLOADED_FILE =
        activeItem &&
        activeItem.userData &&
        activeItem.userData.table &&
        activeItem.userData.table.UPLOADED_FILE
          ? `${activeItem.filename},${activeItem.userData.table.UPLOADED_FILE}`
          : activeItem.filename;

        const activeData = {
          ...activeItem,
          nextaction: "success",
          UPLOADED_FILE,
        };

        setDialogTitle("Upload Complete");
        setDialogMessage("Your video was uploaded successfully.");
        setDialogType("success");
        setDialogOpen(true);

        setTimeout(() => {
          onSave({ status: "submit", newActiveItem: activeData });
        }, 3000);

        success = true;
      } catch (err) {
        console.error(`❌ Upload attempt ${attempts} failed:`, err);

        if (attempts >= 3) {
          setDialogTitle("Upload Failed");
          setDialogMessage(
            `Maximum trial limit reached (${attempts}/3). You can upload your video via Messenger.`
          );
          setDialogType("messenger");
          setDialogOpen(true);
        } else {
          setDialogTitle("Upload Failed");
          setDialogMessage(
            `${err.message || "Something went wrong."} (attempt ${attempts}/3). Retrying...`
          );
          setDialogType("error");
          setDialogOpen(true);

          await new Promise((res) => setTimeout(res, attempts * 2000));
        }
      }
    }

    setIsSubmitting(false);
    setUploadAttempts(attempts);
  };

  return (
    <div>
      {/* Loading backdrop */}
      <Backdrop sx={{ color: "#c7d624", zIndex: 2000 }} open={isSubmitting}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: "bold",
            color: dialogType === "success" ? "green" : "red",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src="/favicon.ico"
              alt="Header Icon"
              sx={{ width: 32, height: 32, mr: 1 }}
              variant="rounded"
            />
            {dialogTitle}
          </Box>
          {dialogType === "error" && (
            <IconButton aria-label="close" onClick={() => setDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body1">{dialogMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {dialogType === "messenger" && facebooklink && (
            <Button
              variant="contained"
              href={facebooklink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ backgroundColor: "#800050 !important" }}
            >
              Go to Messenger
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* File input for testing */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Upload a test video file
        </Typography>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            if (e.target.files[0]) {
              onSubmit(e.target.files[0], activeItem);
            }
          }}
        />
      </Box>
    </div>
  );
};

export default LivenessDetection;
