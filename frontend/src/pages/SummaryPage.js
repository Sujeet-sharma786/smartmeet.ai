import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Typography, Box, Alert, CircularProgress, Button, TextField } from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';

const SummaryPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailInputs, setEmailInputs] = useState({}); // {meetingId: email}
  const [emailStatus, setEmailStatus] = useState({}); // {meetingId: status}

  useEffect(() => {
    let isMounted = true;

    const fetchMeetingsAndSummaries = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const meetingsRes = await axios.get('/api/meetings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meetingsData = meetingsRes.data.meetings || [];

        const meetingsWithSummaries = await Promise.all(
          meetingsData.map(async (meeting) => {
            let summaryText = 'No summary available.';
            try {
              // Try to fetch existing summary
              const summaryRes = await axios.get(`/api/features/summary/${meeting._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              summaryText = summaryRes.data.summary?.summaryText || 'No summary available.';
            } catch (err) {
              // If not found, generate summary by calling /summary
              if (err.response && err.response.status === 404) {
                try {
                  const summaryGenRes = await axios.post(
                    `/api/features/summary`,
                    { meetingId: meeting._id, summaryText: null },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  summaryText = summaryGenRes.data.summary?.summaryText || 'No summary available.';
                } catch (genErr) {
                  summaryText = 'Failed to generate summary.';
                }
              } else {
                summaryText = 'Failed to fetch summary.';
              }
            }
            return { ...meeting, summary: summaryText };
          })
        );
        if (isMounted) setMeetings(meetingsWithSummaries);
      } catch (err) {
        if (isMounted) setError('Failed to load meetings or summaries');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMeetingsAndSummaries();

    return () => { isMounted = false; };
  }, []);

  const handleSendSummary = async (meetingId) => {
    const email = emailInputs[meetingId];
    setEmailStatus((prev) => ({ ...prev, [meetingId]: 'Sending...' }));
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/features/send-summary-email', {
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
          <SummarizeIcon sx={{ fontSize: 40, mr: 1, color: '#7b1fa2' }} />
          <Typography variant="h4" component="h2">Meeting Summaries</Typography>
        </Box>
        {meetings.map((meeting) => (
          <Box key={meeting._id} sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #7b1fa2' }}>
            <Typography variant="h6">{meeting.title}</Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {new Date(meeting.startTime).toLocaleString()}
            </Typography>
            <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>{meeting.summary}</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Email"
                value={emailInputs[meeting._id] || ''}
                onChange={e => setEmailInputs(inputs => ({ ...inputs, [meeting._id]: e.target.value }))}
              />
              <Button
                variant="contained"
                onClick={() => handleSendSummary(meeting._id)}
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

export default SummaryPage;
