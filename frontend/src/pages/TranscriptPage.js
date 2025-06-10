import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { Typography, Box, Alert } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

const TranscriptPage = () => {
  const { meetingId } = useParams();
  const [transcriptions, setTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("TranscriptonPage meetingId: ",meetingId)
    const fetchTranscription = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/features/transcription/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // If your API returns a single transcription object, wrap it in an array for consistency
        const data = response.data.transcription
          ? [response.data.transcription]
          : response.data.transcriptions || [];
        setTranscriptions(data);
      } catch (err) {
        setError('Failed to load transcription');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscription();
  }, [meetingId]);

  if (loading) return <Layout><Typography>Loading transcription...</Typography></Layout>;
  if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DescriptionIcon sx={{ fontSize: 40, mr: 1, color: '#1976d2' }} />
          <Typography variant="h4" component="h2">Transcriptions</Typography>
        </Box>
        {transcriptions.length === 0 && (
          <Alert severity="info">No transcription found for this meeting.</Alert>
        )}
        {transcriptions.map((t, idx) => (
          <Box
            key={t._id || idx}
            sx={{
              mb: 3,
              p: 2,
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              border: '1px solid #1976d2',
              boxShadow: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Meeting ID: <b>{t.meeting || meetingId}</b>
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', color: '#333' }}>
              {t.transcriptText || 'No transcript available.'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Layout>
  );
};

export default TranscriptPage;
