import React, { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';

const CreateMeetingPage = () => {
  const [title, setTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    try {
      const response = await axios.post('http://localhost:5000/api/meetings/create', { title });
      const meetingLink = response.data.meeting.meetingLink;
      setMeetingLink(`${window.location.origin}/join/${meetingLink}`);
      setSuccess('Meeting created successfully!');
      // Show Join Meeting button instead of auto-redirect
      setMeetingLink(`${window.location.origin}/video-call?roomUrl=${encodeURIComponent(meetingLink)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
        <Typography variant="h4" gutterBottom>Create Meeting</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <TextField
          label="Meeting Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleCreate} disabled={!title}>
          Create Meeting
        </Button>
        {meetingLink && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1">Share this link to invite others:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', color: 'blue' }}>
              {meetingLink}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
              onClick={() => window.location.href = meetingLink}
            >
              Join Meeting
            </Button>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default CreateMeetingPage;
