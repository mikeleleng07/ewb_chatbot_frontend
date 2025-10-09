import Webcam from 'react-webcam'
import { useRef, useState, useEffect, useCallback } from 'react'
import './camera.css'
import { getExtensionFromMimeType,getWorkingCameras } from "./utils";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
const LivenessDetection = ({
  activeItem = null,
  onClose = () => {},
  onSave = () => {},
}) => {
  // States
  const [recording, setRecording] = useState(false)
  const [videoURL, setVideoURL] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [loadingCameras, setLoadingCameras] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [permissionError, setPermissionError] = useState(null)
  const [permissionState, setPermissionState] = useState('requesting') // 'requesting', 'granted', 'denied'
  const [videoDetails, setVideoDetails] = useState(null)
  const [file, setFile] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState({ open: false, title: "", message: "", type: "success" });
  // Refs
  const webcamRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  // Timer functions
  const startTimer = (limit = 15) => {
    setSeconds(limit)
    timerRef.current = setInterval(() => setSeconds(prev => prev - 1), 1000)
  }

  const stopTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }

  // Stop stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (webcamRef.current && webcamRef.current.stream) {
      webcamRef.current.stream.getTracks().forEach(track => track.stop())
      webcamRef.current.stream = null
    }
  }

  // Utility function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Reset video
  const resetVideo = () => {
    setVideoURL(null)
    setVideoDetails(null)
    chunksRef.current = []
    setSeconds(0)
    stopTimer()
  }

  // Recording functions
  const handleRecordingStop = (recorder) => {
    const mimeType = recorder.mimeType
    const blob = new Blob(chunksRef.current, { type: mimeType })


    // Calculate video details
    const fileSize = blob.size
    const fileExtension = mimeType.split('/')[1] || 'webm'
    const fileType = mimeType.split('/')[0] || 'video'
    const ext = getExtensionFromMimeType(mimeType);
    const filename = `${(
      activeItem &&
      activeItem.userData &&
      activeItem.userData.table &&
      activeItem.userData.table.mobile
        ? activeItem.userData.table.mobile
        : ""
    )}_${Date.now()}_liveness.${ext}`;
    const newFile = new File([blob], filename, { type: mimeType });
    setFile(newFile);
    setVideoDetails({
      size: fileSize,
      formattedSize: formatFileSize(fileSize),
      extension: fileExtension,
      type: fileType,
      mimeType: mimeType,
      duration: 15 - seconds // Approximate duration based on timer
    })

    setVideoURL(URL.createObjectURL(blob))
    setRecording(false)
    stopTimer()
    stopStream()
  }

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    stopStream()
    setRecording(false)
  }, [])

//   const startRecording = async () => {
//   try {
//     const constraints = {
//       audio: true,
//       video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
//     };

//     const stream = await navigator.mediaDevices.getUserMedia(constraints);

//     const hasVideo = stream.getVideoTracks().length > 0;
//     const hasAudio = stream.getAudioTracks().length > 0;

//     console.log("Video track exists:", hasVideo);
//     console.log("Audio track exists:", hasAudio);

//     if (!hasVideo) throw new Error("No video track found");
//     if (!hasAudio) console.warn("No audio track found");

//     // --- VIDEO CHECK ---
//     if (hasVideo) {
//       const videoEl = document.createElement("video");
//       videoEl.srcObject = stream;
//       videoEl.muted = true;
//       videoEl.play();

//       const canvas = document.createElement("canvas");
//       const ctx = canvas.getContext("2d");

//       let blankFrames = 0;
//       const checkVideo = () => {
//         if (videoEl.readyState >= 2) {
//           canvas.width = videoEl.videoWidth;
//           canvas.height = videoEl.videoHeight;
//           ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

//           const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
//           const sum = frame.reduce((a, b) => a + b, 0);

//           if (sum === 0) blankFrames++;
//           else blankFrames = 0;

//           if (blankFrames > 5) {
//             console.warn("Video track seems blank/dummy");
//           }
//         }
//         if (recording) requestAnimationFrame(checkVideo);
//       };

//       checkVideo();
//     }

//     // --- AUDIO CHECK ---
//     if (hasAudio) {
//       const audioContext = new (window.AudioContext )();
//       const source = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();
//       source.connect(analyser);
//       analyser.fftSize = 256;

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       let silentFrames = 0;
//       const checkAudio = () => {
//         analyser.getByteFrequencyData(dataArray);
//         const sum = dataArray.reduce((a, b) => a + b, 0);
//         if (sum === 0) silentFrames++;
//         else silentFrames = 0;

//         if (silentFrames > 5) console.warn("Audio track seems silent (dummy stream)");

//         if (recording) requestAnimationFrame(checkAudio);
//       };

//       checkAudio();
//     }

//     // --- START RECORDING ---
//     streamRef.current = stream;
//     chunksRef.current = [];
//     const recorder = new MediaRecorder(stream);
//     recorderRef.current = recorder;

//     recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data);
//     recorder.onstop = () => handleRecordingStop(recorder);

//     recorder.start();
//     setRecording(true);
//     startTimer();

//   } catch (err) {
    
//     setRecording(false);
//   }
// };


  const startRecording = async () => {
    try {
      const constraints = {
        audio: true,
        video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (!stream.getVideoTracks().length) throw new Error("No video track found")

      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
      recorder.onstop = () => handleRecordingStop(recorder)

      recorder.start()
      setRecording(true)
      startTimer()
    } catch (err) {
      alert(err.message)
      setRecording(false)
    }
  }

  // Switch camera
  const switchCamera = () => {
    stopStream()
    const idx = cameras.findIndex(cam => cam.deviceId === selectedDeviceId)
    const next = cameras[(idx + 1) % cameras.length].deviceId
    setSelectedDeviceId(next)
    resetVideo()
  }


  // Get available cameras
  const detectCameras = async () => {
      setLoadingCameras(true);
      setPermissionError(null);
      setPermissionState('requesting');

  const timeout = setTimeout(() => {
    setLoadingCameras(false);
    setPermissionState('denied');
    setPermissionError('Camera access timed out. Please try again.');
  }, 10000);

  try {
    const result = await getWorkingCameras();

    if (result.supported && result.cameras.length > 0) {
      setCameras(result.cameras);
      setSelectedDeviceId(result.cameras[0].deviceId);
      setPermissionState('granted');
    } else {
      setPermissionState('denied');
      setPermissionError(result.reason || 'No working cameras found.');
    }
  } catch (err) {
    setPermissionState('denied');
    setPermissionError(err.message);
  } finally {
    clearTimeout(timeout);
    setLoadingCameras(false);
  }
};

  useEffect(() => {
    detectCameras()
  }, [])

  // Auto-stop recording when timer reaches 0
  useEffect(() => {
    if (recording && seconds <= 0) {
      stopRecording()
    }
  }, [seconds, recording, stopRecording])

  useEffect(() => () => stopTimer(), [])

const uploadInChunks = async (file, item) => {
    const baseUrl = process.env.REACT_APP_ENV !== "development"
      ? "https://ewbservices.ewbconsumerlending.com"
      : "http://localhost:5000";

    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("chunkIndex", "0");
    formData.append("totalChunks", "1");
    formData.append("filename", file.name);
    formData.append("contentType", file.type);
    formData.append("chatbotdata", JSON.stringify(item));

    try {
      const res = await fetch(`${baseUrl}/uploadliveness`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };


  const onSubmit = async () => {
    if (!file) return alert("No video recorded.");

    setIsSubmitting(true);
    let success = false, trial = 0;

    while (!success && trial < 3) {
      trial++;
      const result = await uploadInChunks(file, activeItem);

      if (result.success) {
        const uploaded = activeItem.userData.table.UPLOADED_FILE
          ? `${activeItem.filename},${activeItem.userData.table.UPLOADED_FILE}`
          : activeItem.filename;

        onSave({ status: "submit", newActiveItem: { ...activeItem, nextaction: "success", UPLOADED_FILE: uploaded } });
        
        setDialog({ open: true, title: "Upload Complete", message: "Your video was uploaded successfully.", type: "success" });
        setPermissionState('submitting')
        success = true;
      } else if (trial >= 3) {
        setDialog({ open: true, title: "Upload Failed", message: "Max attempts reached. Redirecting to Messenger.", type: "messenger" });
      } else {
        
        setDialog({ open: true, title: "Upload Failed", message: `(attempt ${trial}/3). Retrying...`, type: "error" });
        setPermissionState('submitting')
        await new Promise(r => setTimeout(r, trial * 2000));
      }
    }
    
    setIsSubmitting(false);
    setAttempts(trial);
  };

  return (
    <div className="app-container">
        <Backdrop sx={{ color: "#c7d624", zIndex: 2000 }} open={isSubmitting || loadingCameras}>
        <CircularProgress color="inherit" />
        </Backdrop>
       {/* Status Screen (replaces Dialog) */}
     
      {/* Loading Screen */}
      {loadingCameras && (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-title">
            {permissionState === 'requesting' ? 'Requesting Camera Access' : 'Initializing Camera'}
          </div>
          <div className="loading-subtitle">
            {permissionState === 'requesting'
              ? 'Please allow camera and microphone access when prompted'
              : 'Setting up your camera...'
            }
          </div>
        </div>
      )}
     {!isSubmitting && permissionState === 'denied' && (
        <div className="permission-denied-screen">
          <div className="permission-icon">📷</div>
            <div className="permission-title" style={{ display: "flex", alignItems: "center" }}>
               <Avatar src="/favicon.ico" sx={{ width: 32, height: 32, mr: 1 }} />
            <span>Camera Access Required</span>
            </div>
          <div className="permission-message">
            {permissionError || 'Camera access is required to use this application.'}
          </div>
          <div className="permission-instructions">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <span>Click the camera icon in your browser's address bar</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <span>Select "Allow" for camera and microphone access</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <span>Refresh this page to continue</span>
            </div>
          </div>
          <button
            onClick={detectCameras}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      )}
      {/* Permission Denied Screen */}
      {!loadingCameras && permissionState === 'submitting' && (
        <div className="permission-denied-screen">
          <div className="permission-icon">📷</div>

          <div className="permission-title" style={{ display: "flex", alignItems: "center" }}>
            <Avatar src="/favicon.ico" sx={{ width: 32, height: 32, mr: 1 }} />
            <span>{dialog.title}</span>
          </div>

          <div className="permission-message">
            {dialog.message}
          </div>

          {dialog.type === "messenger" && attempts >= 3 &&  (
            <button
              onClick={() => window.open(activeItem.fblink, "_blank")}
              className="retry-button"
            >
              Go to Messenger
            </button>
          )}
        </div>
      )}


      {/* Main Camera Interface */}
      {!loadingCameras && permissionState === 'granted' && (
        <>
          {/* Camera Feed */}
          {!videoURL && (
            <div className="camera-container">
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.5)", // plain white transparent
                        color: "#800050",
                        padding: "16px 12px",
                        textAlign: "center",
                        zIndex: 2100,
                        borderBottom: "3px solid #e3078fff",
                        boxShadow: "0 4px 16px 0 rgba(128,0,80,0.12)",
                        animation: "fadeInScale 1s cubic-bezier(.4,0,.2,1)"
                    }}
                    >
                    <style>
                        {`
                        @keyframes fadeInScale {
                            0% { opacity: 0; transform: scale(0.95);}
                            100% { opacity: 1; transform: scale(1);}
                        }
                        `}
                    </style>
                    <Typography
                        variant="subtitle2"
                        sx={{
                        fontWeight: "bold",
                        fontSize: "1.3rem",
                        letterSpacing: 1,
                        textShadow: "1px 1px 3px rgba(255,255,255,0.6)" // still helps readability
                        }}
                    >
                        Please submit a selfie video stating the following:
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                        mt: 1,
                        fontSize: "1.1rem",
                        textShadow: "1px 1px 3px rgba(255,255,255,0.6)"
                        }}
                    >
                        My name is: <b>First Name, Middle Name, Last Name, Suffix</b>. My
                        birthdate is <b>Month/Date/Year</b>; and I am applying for an
                        <b> EASTWEST {activeItem.userData.PRODUCTNAME}</b>.
                    </Typography>
                    </Box>
              <Webcam
                key={selectedDeviceId}
                ref={webcamRef}
                audio
                muted
               videoConstraints={
                selectedDeviceId
                  ? { deviceId: { exact: selectedDeviceId } }
                  : undefined  // ✅ Safari-safe: use empty object, not 'true'
              }
                className="webcam-video"
              />

            
            </div>
          )}

          {/* Video Preview */}
          {videoURL && (
            <div className="video-preview-container">
              <video
                src={videoURL}
                controls
                className="video-preview"
              />

              {/* Video Details */}
              {videoDetails && (
                <div className="video-details">
                  <div className="video-details-header">
                    <h3>Video Details</h3>
                  </div>
                  <div className="video-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">File Size</span>
                      <span className="detail-value">{videoDetails.formattedSize}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Format</span>
                      <span className="detail-value">{videoDetails.extension.toUpperCase()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{videoDetails.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{videoDetails.duration}s</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">MIME Type</span>
                      <span className="detail-value">{videoDetails.mimeType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Raw Size</span>
                      <span className="detail-value">{videoDetails.size.toLocaleString()} bytes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control Panel */}
          <div className="control-panel">
            <div className="controls-container">
              {/* Video Controls */}
              {videoURL && !recording ? (
                <>
                        <button onClick={onSubmit} className="btn-secondary">
                        Submit
                        </button>
                        <button onClick={resetVideo} className="btn-secondary">
                        Record Again
                        </button>
                    </>
              ) : (
                /* Recording Controls */
                cameras.length > 0 && (
                  <>
                    {!recording ? (
                      <button
                        onClick={startRecording}
                        className="btn-primary"
                      >
                        <div className="record-button" />
                      </button>
                    ) : (
                      <>
                      {recording && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: "red",
                                borderRadius: "50%"
                              }}
                            />
                            <span>
                              REC {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                              {String(seconds % 60).padStart(2, "0")}
                            </span>
                          </div>
                        )}

                        <button onClick={stopRecording} className="btn-primary">
                          <div
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: "red",
                              borderRadius: "50%"
                            }}
                          />
                        </button>
                    </>
                    )}

                    {/* Camera Switch */}
                    {!recording && cameras.length > 1 && (
                         <IconButton onClick={switchCamera}>
                                                  <FlipCameraIosIcon fontSize="large" sx={{ color: "white" }} />
                          </IconButton>
                     
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}


export default LivenessDetection;