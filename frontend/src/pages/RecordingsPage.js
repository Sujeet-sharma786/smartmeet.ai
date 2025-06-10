import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, TextField, Button, Alert } from '@mui/material';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const RecordingsPage = () => {
  const { meetingId } = useParams();
  const [recordingUrl, setRecordingUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    console.log('RecordingsPage meetingId:', meetingId);
    if (!meetingId) {
      setError('No meeting selected. Please select a meeting to view recordings.');
      setLoading(false);
      return;
    }
    const fetchRecording = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/features/recording/' + meetingId, {
          headers: { Authorization: 'Bearer ' + token },
        });
        setRecordingUrl(response.data.recording.recordingUrl);
      } catch (err) {
        console.error('Error fetching recording:', err);
        setError('Failed to load recording');
      } finally {
        setLoading(false);
      }
    };
    fetchRecording();
  }, [meetingId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/features/recording', {
        meetingId,
        recordingUrl,
      }, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setSuccess('Recording URL saved successfully');
      setError('');
    } catch (err) {
      setError('Failed to save recording URL');
      setSuccess('');
    }
  };

  if (loading) return <Layout><Typography>Loading recording...</Typography></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VideoLibraryIcon sx={{ fontSize: 40, mr: 1, color: '#d32f2f' }} />
          <Typography variant="h4" component="h2">Recording</Typography>
        </Box>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {recordingUrl && (
          <Box sx={{ mb: 2 }}>
            <video controls width="100%" src={recordingUrl} />
          </Box>
        )}
        <TextField
          fullWidth
          value={recordingUrl}
          onChange={(e) => setRecordingUrl(e.target.value)}
          variant="outlined"
          placeholder="Enter recording URL"
        />
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
          Save Recording URL
        </Button>
      </Box>
    </Layout>
  );
};

export default RecordingsPage;
