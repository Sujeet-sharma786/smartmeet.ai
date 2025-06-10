const Meeting = require('../models/Meeting');
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const Transcription = require('../models/Transcription');
const Summary = require('../models/Summary');
const MoM = require('../models/MoM');
const Recording = require('../models/Recording');

const ffmpeg = require('fluent-ffmpeg');

const axios = require('axios');

const dotenv = require('dotenv').config();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Create or update transcription for a meeting
router.post('/transcription', authenticate, async (req, res) => {
  try {
    const { meetingId, transcriptText } = req.body;
    let transcription = await Transcription.findOne({ meeting: meetingId });
    if (transcription) {
      transcription.transcriptText = transcriptText;
    } else {
      transcription = new Transcription({ meeting: meetingId, transcriptText });
    }
    await transcription.save();
    res.status(200).json({ transcription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transcription for a meeting
router.get('/transcription/:meetingId', authenticate, async (req, res) => {
  try {
    const transcription = await Transcription.findOne({ meeting: req.params.meetingId });
    if (!transcription) {
      return res.status(404).json({ message: 'Transcription not found' });
    }
    res.status(200).json({ transcription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update summary for a meeting
router.post('/summary', authenticate, async (req, res) => {
  try {
    const { meetingId, summaryText } = req.body;
    let finalSummaryText = summaryText;

    if (!finalSummaryText) {
      const transcription = await Transcription.findOne({ meeting: meetingId });
      if (!transcription || !transcription.transcriptText) {
        console.error('Transcript not found for meeting:', meetingId);
        return res.status(400).json({ message: 'Transcript not found for summary generation.' });
      }
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterApiKey) {
        console.error('OPENROUTER_API_KEY is missing!');
        return res.status(500).json({ message: 'OpenRouter API key missing.' });
      }
      try {
        const openrouterRes = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4o', // or another supported model
            messages: [
              { role: 'system', content: 'Summarize the following meeting transcript in concise bullet points:' },
              { role: 'user', content: transcription.transcriptText }
            ],
            max_tokens: 512,
            temperature: 0.5,
          },
          {
            headers: {
              'Authorization': `Bearer ${openrouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'SmartMeet.ai'
            },
          }
        );
        finalSummaryText = openrouterRes.data.choices[0].message.content.trim();
      } catch (openrouterErr) {
        console.error('OpenRouter API error:', openrouterErr.response?.data || openrouterErr.message);
        return res.status(500).json({ message: 'OpenRouter API error', details: openrouterErr.response?.data || openrouterErr.message });
      }
    }

    let summary = await Summary.findOne({ meeting: meetingId });
    if (summary) {
      summary.summaryText = finalSummaryText;
    } else {
      summary = new Summary({ meeting: meetingId, summaryText: finalSummaryText });
    }
    await summary.save();
    res.status(200).json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// Create or update MoM for a meeting
router.post('/mom', authenticate, async (req, res) => {
  try {
    const { meetingId, momText } = req.body;
    let finalMomText = momText;

    if (!finalMomText) {
      const transcription = await Transcription.findOne({ meeting: meetingId });
      if (!transcription || !transcription.transcriptText) {
        console.error('Transcript not found for meeting:', meetingId);
        return res.status(400).json({ message: 'Transcript not found for MoM generation.' });
      }
      const openrouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterApiKey) {
        console.error('OPENROUTER_API_KEY is missing!');
        return res.status(500).json({ message: 'OpenRouter API key missing.' });
      }
      try {
        const openrouterRes = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-4o', // or another supported model
            messages: [
              { role: 'system', content: 'Extract the main action items and decisions from the following meeting transcript as bullet points:' },
              { role: 'user', content: transcription.transcriptText }
            ],
            max_tokens: 512,
            temperature: 0.5,
          },
          {
            headers: {
              'Authorization': `Bearer ${openrouterApiKey}`,
              'Content-Type': 'application/json',
              // Optional, but recommended for OpenRouter analytics/ranking:
              'HTTP-Referer': 'http://localhost:3000', // or your deployed site
              'X-Title': 'SmartMeet.ai'
            },
          }
        );
        finalMomText = openrouterRes.data.choices[0].message.content.trim();
      } catch (openrouterErr) {
        console.error('OpenRouter API error:', openrouterErr.response?.data || openrouterErr.message);
        return res.status(500).json({ message: 'OpenRouter API error', details: openrouterErr.response?.data || openrouterErr.message });
      }
    }

    let mom = await MoM.findOne({ meeting: meetingId });
    if (mom) {
      mom.momText = finalMomText;
    } else {
      mom = new MoM({ meeting: meetingId, momText: finalMomText });
    }
    await mom.save();
    res.status(200).json({ mom });
  } catch (err) {
    console.error('General error in /mom:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

// const mongoose = require('mongoose');

// Create or update recording for a meeting with file upload
// router.post('/recording', authenticate, upload.single('file'), async (req, res) => {
//   try {
//     const meetingLink = req.body.meetingId;
//     console.log('Recording upload request for meetingLink:', meetingLink, 'Type:', typeof meetingLink);
//     if (!req.file) {
//       console.log('No file uploaded');
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
//     console.log('Uploaded file:', req.file);
//     const recordingUrl = `/uploads/${req.file.filename}`;

//     // Find meeting by meetingLink
//     const meeting = await Meeting.findOne({ meetingLink });
//     if (!meeting) {
//       console.log('Meeting not found for meetingLink:', meetingLink);
//       return res.status(400).json({ message: 'Invalid meetingLink' });
//     }

//     let recording = await Recording.findOne({ meeting: meeting._id });
//     if (recording) {
//       recording.recordingUrl = recordingUrl;
//     } else {
//       recording = new Recording({ meeting: meeting._id, recordingUrl });
//     }
//     await recording.save();
//     console.log('Recording saved to DB:', recording);
//     res.status(200).json({ recording });
//   } catch (err) {
//     console.error('Error in recording upload:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Get recording for a meeting
router.get('/recording/:meetingId', authenticate, async (req, res) => {
  try {
    const recording = await Recording.findOne({ meeting: req.params.meetingId });
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    res.status(200).json({ recording });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/recordings', authenticate, async (req, res) => {
  try {
    const recordings = await Recording.find().populate('meeting');
    res.status(200).json({ recordings });
  } catch (err) {
    console.error('Error fetching recordings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Create or update recording for a meeting with file upload
router.post('/recording', authenticate, upload.single('file'), async (req, res) => {
  try {
    const meetingLink = req.body.meetingId;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const recordingUrl = `/uploads/${req.file.filename}`;

    // Find meeting by meetingLink
    const meeting = await Meeting.findOne({ meetingLink });
    if (!meeting) {
      return res.status(400).json({ message: 'Invalid meetingLink' });
    }

    let recording = await Recording.findOne({ meeting: meeting._id });
    if (recording) {
      recording.recordingUrl = recordingUrl;
    } else {
      recording = new Recording({ meeting: meeting._id, recordingUrl });
    }
    await recording.save();

    // --- AUDIO EXTRACTION LOGIC ---
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const audioDir = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir);
    }
    const videoPath = path.join(uploadsDir, req.file.filename);
    const audioFilename = path.parse(req.file.filename).name + '.mp3';
    const audioPath = path.join(audioDir, audioFilename);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(audioPath)
      .on('end', () => {
        // --- WHISPER TRANSCRIPTION LOGIC ---
        const outputDir = path.join(__dirname, '..', 'transcripts');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }
        const WhisperPath = `"C:\\Users\\svish\\AppData\\Local\\Packages\\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\\LocalCache\\local-packages\\Python312\\Scripts\\whisper.exe"`;
        const command = `${WhisperPath} "${audioPath}" --model base --output_dir "${outputDir}" --language en --fp16 False`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("Transcription error:", error);
            return res.status(500).json({ error: "Failed to transcribe audio." });
          }

          // Whisper creates .txt file named after audio
          const transcriptPath = path.join(
            outputDir,
            path.parse(audioFilename).name + ".txt"
          );

          fs.readFile(transcriptPath, "utf8", async (err, data) => {
            if (err) {
              console.error("Failed to read transcript:", err);
              return res.status(500).json({ error: "Transcript not found." });
            }

            // Console log the transcript text
            console.log("Transcript text:", data);

            // Store transcript in DB using /transcription endpoint
            try {
              await axios.post(
                'http://localhost:5000/api/features/transcription',
                {
                  meetingId: meeting._id,
                  transcriptText: data
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.auth_key}`
                  }
                }
              );
              console.log('Transcript saved to DB');
            } catch (saveErr) {
              console.error('Failed to save transcript to DB:', saveErr.message);
              // Optionally, you can still return the transcript to the client
            }

            res.status(200).json({
              recording,
              audio: `/audio/${audioFilename}`,
              transcript: data
            });
          });
        });
        // --- END WHISPER LOGIC ---
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
        res.status(500).json({ message: 'Error extracting audio' });
      });
    // --- END AUDIO EXTRACTION LOGIC ---
  } catch (err) {
    console.error('Error in recording upload:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
