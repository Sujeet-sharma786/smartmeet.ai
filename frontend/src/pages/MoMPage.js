import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Typography, Box, Alert, CircularProgress, Button, TextField } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

const MoMPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailInputs, setEmailInputs] = useState({});
  const [emailStatus, setEmailStatus] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchMeetingsAndMoMs = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const meetingsRes = await axios.get('/api/meetings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meetingsData = meetingsRes.data.meetings || [];

        // For each meeting, fetch MoM. If not present, generate it.
        const meetingsWithMoMs = await Promise.all(
          meetingsData.map(async (meeting) => {
            let momText = 'No MoM available.';
            try {
              // 1. Try to fetch existing MoM
              const momRes = await axios.get(`/api/features/mom/${meeting._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              momText = momRes.data.mom?.momText || 'No MoM available.';
              console.log('this mom is from /mom/:meetingId: ',momText)
            } catch (err) {
              // 2. If not found (404), generate MoM by calling /mom
              if (err.response && err.response.status === 404) {
                try {
                  // Fetch transcript first
                  const transcriptRes = await axios.get(`/api/features/transcription/${meeting._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const transcript = transcriptRes.data.transcription?.transcriptText || '';
                  console.log('transcription for mom generation: --->',transcript)
                  if (transcript) {
                    // Generate and save MoM in backend
                    const momGenRes = await axios.post(
                      `/api/features/mom`,
                      {
                        meetingId: meeting._id,
                        momText: null // Let backend generate using transcript
                      },
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    momText = momGenRes.data.mom?.momText || 'No MoM available.';
                    console.log('this mom is from /mom: ',momText)
                  }
                } catch (genErr) {
                  momText = 'Failed to generate MoM.';
                }
              } else {
                momText = 'Failed to fetch MoM.';
              }
            }
            return { ...meeting, mom: momText };
          })
        );
        if (isMounted) setMeetings(meetingsWithMoMs);
      } catch (err) {
        if (isMounted) setError('Failed to load meetings or MoM');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMeetingsAndMoMs();

    return () => { isMounted = false; };
  }, []);

  const handleSendMoM = async (meetingId) => {
    const email = emailInputs[meetingId];
    setEmailStatus((prev) => ({ ...prev, [meetingId]: 'Sending...' }));
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/features/send-mom-email', {
        meetingId,
        email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStatus((prev) => ({ ...prev, [meetingId]: res.data.message }));
    } catch (err) {
      setEmailStatus((prev) => ({
        ...prev,
        [meetingId]: err.response?.data?.message || 'Failed to send email.'
      }));
    }
  };

  if (loading) return <Layout><CircularProgress /></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ fontSize: 40, mr: 1, color: '#00796b' }} />
          <Typography variant="h4" component="h2">Minutes of Meeting (MoM)</Typography>
        </Box>
        {meetings.map((meeting) => (
          <Box key={meeting._id} sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #1976d2' }}>
            <Typography variant="h6">{meeting.title}</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {new Date(meeting.startTime).toLocaleString()}
            </Typography>
            <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>{meeting.mom}</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Email"
                value={emailInputs[meeting._id] || ''}
                onChange={e => setEmailInputs(inputs => ({ ...inputs, [meeting._id]: e.target.value }))}
              />
              <Button
                variant="contained"
                onClick={() => handleSendMoM(meeting._id)}
              >
                Send to Email
              </Button>
              {emailStatus[meeting._id] && (
                <Typography variant="caption" color="primary">{emailStatus[meeting._id]}</Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Layout>
  );
};

export default MoMPage;
