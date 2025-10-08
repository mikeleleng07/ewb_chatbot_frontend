function getExtensionFromMimeType(mimeType = "") {
  const type = mimeType.toLowerCase().trim();

  // Direct MIME → Extension mapping
  const mimeMap = {
    // --- Video formats ---
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/x-msvideo": "avi",
    "video/x-ms-wmv": "wmv",
    "video/x-flv": "flv",
    "video/quicktime": "mov",
    "video/mpeg": "mpeg",
    "video/3gpp": "3gp",
    "video/3gpp2": "3g2",
    "video/x-matroska": "mkv",

    // --- Audio formats ---
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/mp4": "m4a",
    "audio/x-matroska": "mka",

    // --- Subtitles / playlists ---
    "application/vnd.apple.mpegurl": "m3u8",
    "application/x-mpegurl": "m3u8",
    "application/x-subrip": "srt",
    "application/x-matroska": "mks"
  };

  if (mimeMap[type]) {
    return mimeMap[type];
  }

  // Heuristic fallback: check for keywords
  const knownExts = [
    "webm", "mp4", "ogg", "ogv", "mpeg", "3g2", "3gp",
    "mkv", "avi", "mov", "flv", "wmv", "wav", "aac",
    "flac", "m4a", "mp3", "m3u8", "srt"
  ];

  for (const ext of knownExts) {
    if (type.includes(ext)) return ext;
  }

  // Final fallback
  if (type.includes("audio")) return "mp3";
  if (type.includes("video")) return "mp4";

  return "dat"; // default for unknown types
}




const getWorkingCameras = async () => {
  // Check basic support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn("Camera API not supported in this browser.");
    return { supported: false, cameras: [], reason: "Camera API not supported" };
  }

  try {
    // Request minimal permission to check access
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    tempStream.getTracks().forEach(track => track.stop());

    // Enumerate devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");
      const deviceIds = videoDevices.map(d => d.deviceId).join('\n');

    let workingCameras = [];

    for (const device of videoDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
       
          video: { deviceId: device.deviceId ? { exact: device.deviceId } : undefined }
        });

        if (stream.getVideoTracks().length > 0) {
          workingCameras.push(device);
        }
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn(`Skipping camera ${device.label}:`, err.message);
      }
    }

    if (workingCameras.length === 0) {
      return { supported: true, cameras: [], reason: "No working cameras found" };
    }

    return { supported: true, cameras: workingCameras };
  } catch (err) {
    if (err instanceof DOMException) {
      let reason = "";
      switch (err.name) {
        case "NotAllowedError":
          reason = "Permission denied or dismissed";
          break;
        case "NotFoundError":
          reason = "No camera found";
          break;
        case "NotReadableError":
          reason = "Camera already in use";
          break;
        default:
          reason = err.message;
      }
      return { supported: false, cameras: [], reason };
    } else {
      console.error("Unknown error accessing camera:", err);
      return { supported: false, cameras: [], reason: "Unknown error" };
    }
  }
};



export { getExtensionFromMimeType,getWorkingCameras };
