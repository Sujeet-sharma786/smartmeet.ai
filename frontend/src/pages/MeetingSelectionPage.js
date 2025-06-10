import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';

const MeetingSelectionPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const type = query.get('type'); // 'transcript' or undefined

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/meetings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetings(response.data.meetings);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleSelect = (meetingId) => {
    if (type === 'transcript') {
      navigate(`/transcription/${meetingId}`);
    } else {
      navigate(`/recordings/${meetingId}`);
    }
  };

  if (loading) return <Layout><CircularProgress /></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {type === 'transcript' ? 'Select a Meeting to View Transcripts' : 'Select a Meeting to View Recordings'}
        </Typography>
        <List>
          {meetings.map((meeting) => (
            <ListItem button key={meeting._id} onClick={() => handleSelect(meeting._id)}>
              <ListItemText primary={meeting.title} secondary={`Start: ${new Date(meeting.startTime).toLocaleString()}`} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Layout>
  );
};

export default MeetingSelectionPage;
