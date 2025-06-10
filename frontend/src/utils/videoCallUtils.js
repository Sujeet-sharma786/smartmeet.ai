let mediaRecorder;
let recordedChunks = [];
let assemblyAIWebSocket;

// New globals for audio upload
let bufferedAudioChunks = [];
let sendInterval = 5000;
let sendAudioIntervalId = null;

export async function initializeWebRTC(roomId, addOrUpdateStream, setSpeakers) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    addOrUpdateStream({ id: 'local', stream, muted: false, videoOff: false, username: 'You' });
    setSpeakers([{ name: 'Local User', language: 'Unknown' }]);
    console.log('WebRTC initialized with local stream for room:', roomId);
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
  }
}

export function startAssemblyAITranscription(roomId, setTranscription) {
  const token = 'bece091d5b274a95b71cf2f70c81f1b0';
  const url = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000';

  assemblyAIWebSocket = new WebSocket(url);

  let audioContext;
  let processor;
  let input;
  let globalStream;

  assemblyAIWebSocket.onopen = () => {
    console.log('AssemblyAI WebSocket connection opened');
    if (assemblyAIWebSocket.readyState === WebSocket.OPEN) {
      assemblyAIWebSocket.send(JSON.stringify({ type: 'StartStream', data: { language_code: 'en_us' } }));
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      globalStream = stream;
      input = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      input.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const floatSamples = e.inputBuffer.getChannelData(0);
        const int16Samples = convertFloat32ToInt16(floatSamples);

        if (assemblyAIWebSocket.readyState === WebSocket.OPEN) {
          assemblyAIWebSocket.send(int16Samples);
        }

        bufferedAudioChunks.push(new Float32Array(floatSamples));
      };

      startPeriodicAudioUpload();
    }).catch((err) => {
      console.error('Error accessing microphone for transcription:', err);
    });
  };

  assemblyAIWebSocket.onmessage = (message) => {
    const res = JSON.parse(message.data);
    if (res.message_type === 'FinalTranscript') {
      setTranscription(res.text);
    }
  };

  assemblyAIWebSocket.onerror = (error) => {
    console.error('AssemblyAI WebSocket error:', error);
  };

  assemblyAIWebSocket.onclose = (event) => {
    console.log('AssemblyAI WebSocket connection closed', event);
    if (processor) processor.disconnect();
    if (input) input.disconnect();
    if (audioContext) audioContext.close();
    if (globalStream) globalStream.getTracks().forEach(track => track.stop());
    stopPeriodicAudioUpload();
  };
}

function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
  }
  return buf.buffer;
}

export function stopAssemblyAITranscription() {
  if (assemblyAIWebSocket) {
    assemblyAIWebSocket.close();
  }
}

// 📤 Periodic uploader + console log
function startPeriodicAudioUpload() {
  if (sendAudioIntervalId) return;

  sendAudioIntervalId = setInterval(() => {
    if (bufferedAudioChunks.length === 0) return;

    const totalLength = bufferedAudioChunks.reduce((sum, arr) => sum + arr.length, 0);
    const mergedBuffer = new Float32Array(totalLength);
    let offset = 0;
    bufferedAudioChunks.forEach(chunk => {
      mergedBuffer.set(chunk, offset);
      offset += chunk.length;
    });

    const wavBlob = encodeWAV(mergedBuffer, 16000);

    // 🔍 Log Blob to console
    console.log('📦 Audio Blob to be sent:', wavBlob);

    // Send to backend
    const formData = new FormData();
    formData.append('audio', wavBlob, 'audio.wav');

    fetch('http://localhost:5000/api/transcript', {
      method: 'POST',
      body: formData,
    }).then(res => res.json())
      .then(data => {
        console.log('Backend transcription:', data);
      }).catch(err => {
        console.error('Error sending audio to backend:', err);
      });

    bufferedAudioChunks = [];
  }, sendInterval);
}

function stopPeriodicAudioUpload() {
  if (sendAudioIntervalId) {
    clearInterval(sendAudioIntervalId);
    sendAudioIntervalId = null;
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function startRecording(stream, onDataAvailable, onStop) {
  if (!stream) {
    console.error('No stream available for recording');
    return;
  }
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
      if (onDataAvailable) onDataAvailable(event.data);
    }
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    if (onStop) onStop(blob);
  };
  mediaRecorder.start();
  console.log('Recording started');
}

export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    console.log('Recording stopped');
  }
}