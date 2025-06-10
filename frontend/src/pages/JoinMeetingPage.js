import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const JoinMeetingPage = () => {
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/meetings/join', { meetingLink });
      const meeting = response.data.meeting;
      if (meeting) {
        navigate(`/video-call?roomUrl=${encodeURIComponent(meeting.meetingLink)}`);
      } else {
        setError('Meeting room URL not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join meeting');
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
        <Typography variant="h4" gutterBottom>Join Meeting</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Meeting Link"
          fullWidth
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleJoin} disabled={!meetingLink}>
          Join Meeting
        </Button>
      </Box>
    </Layout>
  );
};

export default JoinMeetingPage;
