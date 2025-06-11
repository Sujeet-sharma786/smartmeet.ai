import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { initializeWebRTC, startAssemblyAITranscription, startRecording as startRecordingUtil, stopRecording as stopRecordingUtil } from '../utils/videoCallUtils';
import { Box, Button, IconButton, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CallEndIcon from '@mui/icons-material/CallEnd';
import TranscriptPage from './TranscriptPage';

const VideoCallPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [transcription, setTranscription] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoStreams, setVideoStreams] = useState([]); // Array of {id, stream, muted, videoOff, username}
  const [mainVideoId, setMainVideoId] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const videoRefs = useRef({}); // Map of video element refs keyed by stream id
  const recordingInterval = useRef(null);
  const [text, setText] = useState('');
  const {meetingId: paramMeetingId} = useParams();
  console.log('meeting id in video call page: ',paramMeetingId)

  const setVideoRef = useCallback((id) => (el) => {
    if (el) {
      videoRefs.current[id] = el;
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const room = searchParams.get('roomUrl');
    if (!room) {
      alert('No meeting room URL provided');
      return;
    }
    setMeetingLink(room);

    // Fetch all meetings and find the one with the matching meetingLink
    const token = localStorage.getItem('token');
    fetch('/api/meetings', {
      headers: { Authorization: token ? `Bearer ${token}` : '' }
    })
      .then(res => res.json())
      .then(data => {
        // data.meetings is an array
        const found = data.meetings.find(m => m.meetingLink === room);
        if (found && found._id) {
          setMeetingId(found._id);
        } else {
          alert('Meeting not found for this link');
        }
      })
      .catch(() => alert('Failed to fetch meetings'));

    // Initialize WebRTC and transcription
    initializeWebRTC(room, addOrUpdateStream, setSpeakers);
    startAssemblyAITranscription(room, setTranscription);

    return () => {
      // Cleanup on unmount
      stopRecording();
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [location]);

  // Add or update video stream in state
  const addOrUpdateStream = (streamObj) => {
    setVideoStreams((prev) => {
      const exists = prev.find(v => v.id === streamObj.id);
      if (exists) {
        return prev.map(v => v.id === streamObj.id ? streamObj : v);
      } else {
        return [...prev, streamObj];
      }
    });
    if (!mainVideoId) {
      setMainVideoId(streamObj.id);
    }
  };

  // Attach streams to video elements
  useEffect(() => {
    videoStreams.forEach(({id, stream}) => {
      const videoEl = videoRefs.current[id];
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
    });
  }, [videoStreams]);

  // Recording logic
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
    if (videoStreams.length > 0) {
      startRecordingUtil(videoStreams[0].stream, null, handleRecordingStop);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    setRecordingTime(0);
    stopRecordingUtil();
  };

  const handleRecordingStop = (blob) => {
    // Create a local URL for the recorded video blob to play immediately
    const videoUrl = URL.createObjectURL(blob);
    setRecordedVideoUrl(videoUrl);

    // Upload recording blob to backend
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');
    formData.append('meetingId', meetingLink);

    const token = localStorage.getItem('token');
    fetch('/api/features/recording', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('Recording uploaded:', data.transcript);
        setText(data.transcript);
        // After recording upload
        if (meetingId) {
          navigate(`/transcription/${meetingId}`);
        } else {
          alert('Meeting ID not found, cannot redirect to transcript.');
        }
      })
      .catch(error => {
        console.error('Error uploading recording:', error);
      });
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleMic = () => {
    setMicOn(!micOn);
    // Mute/unmute mic in WebRTC
    const localStream = videoStreams.find(v => v.id === mainVideoId)?.stream;
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !micOn;
      });
    }
  };

  const toggleVideo = () => {
    setVideoOn(!videoOn);
    // Enable/disable video in WebRTC
    const localStream = videoStreams.find(v => v.id === mainVideoId)?.stream;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoOn;
      });
    }
  };

  const hangUp = () => {
    // TODO: close connections and navigate away
    window.location.href = '/dashboard';
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', bgcolor: '#121212', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, display: 'flex', p: 1 }}>
        <Box sx={{ flex: 3, mr: 1, border: '2px solid #2196f3', borderRadius: 1, position: 'relative', maxHeight: '60vh' }}>
          {mainVideoId && (
            <video
              ref={setVideoRef(mainVideoId)}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 4,
                backgroundColor: '#000',
                transform: 'scaleX(-1)' // <-- Mirror the video
              }}
            />
          )}
          <Typography sx={{ position: 'absolute', bottom: 8, left: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', px: 1, borderRadius: 1 }}>
            {videoStreams.find(v => v.id === mainVideoId)?.username || 'Main User'}
          </Typography>
        </Box>
        <Box sx={{ flex: 2, display: 'flex', flexWrap: 'wrap', gap: 1, overflowY: 'auto', maxHeight: '60vh' }}>
          {videoStreams.filter(v => v.id !== mainVideoId).map(({id, username, muted, videoOff}) => (
            <Box
              key={id}
              sx={{ width: '48%', aspectRatio: '16/9', position: 'relative', borderRadius: 1, border: '1px solid #444', cursor: 'pointer', backgroundColor: '#000' }}
              onClick={() => setMainVideoId(id)}
            >
              <video
                ref={setVideoRef(id)}
                autoPlay
                playsInline
                muted={muted}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 4,
                  filter: videoOff ? 'grayscale(100%)' : 'none',
                  transform: 'scaleX(-1)' // <-- Mirror the video
                }}
              />
              <Typography sx={{ position: 'absolute', bottom: 4, left: 4, color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', px: 0.5, borderRadius: 1, fontSize: 12 }}>
                {username}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ height: 60, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <IconButton onClick={toggleMic} color="inherit">
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton onClick={toggleVideo} color="inherit">
          {videoOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <Button
          variant="contained"
          color={isRecording ? 'error' : 'primary'}
          startIcon={<FiberManualRecordIcon />}
          onClick={toggleRecording}
        >
          {isRecording ? `Recording ${formatTime(recordingTime)}` : 'Record'}
        </Button>
        <IconButton onClick={hangUp} color="error">
          <CallEndIcon />
        </IconButton>
      </Box>
      <Box sx={{ height: 100, bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', p: 1, overflowY: 'auto', fontSize: 14, fontFamily: 'monospace' }}>
        <Typography variant="subtitle1">Live Transcription</Typography>
        <Typography>{text}</Typography>
      </Box>
    </Box>
  );
};

export default VideoCallPage;
