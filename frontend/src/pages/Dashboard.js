import React from 'react';
import Layout from '../components/Layout';
import { Typography, Box, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';

const Dashboard = () => {
  const navigate = useNavigate();

  const cards = [
    { title: 'Create Meeting', description: 'Start a new meeting', path: '/create-meeting', icon: <MeetingRoomIcon sx={{ fontSize: 40, color: '#1976d2' }} /> },
    { title: 'Join Meeting', description: 'Join an existing meeting', path: '/join-meeting', icon: <GroupAddIcon sx={{ fontSize: 40, color: '#388e3c' }} /> },
    { title: 'Upcoming Meetings', description: 'View your upcoming meetings', path: '/upcoming-meetings', icon: <EventNoteIcon sx={{ fontSize: 40, color: '#f57c00' }} /> },
    { title: 'Recordings', description: 'Access your meeting recordings', path: '/meeting-selection', icon: <VideoLibraryIcon sx={{ fontSize: 40, color: '#d32f2f' }} /> },
    { title: 'Summary', description: 'View meeting summaries', path: '/summary', icon: <SummarizeIcon sx={{ fontSize: 40, color: '#7b1fa2' }} /> },
    { title: 'MoM', description: 'View minutes of meeting', path: '/mom', icon: <AssignmentIcon sx={{ fontSize: 40, color: '#00796b' }} /> },
    { title: 'Transcript', description: 'View meeting transcripts', path: '/meeting-selection?type=transcript', icon: <DescriptionIcon sx={{ fontSize: 40, color: '#512da8' }} /> },
  ];

  return (
    <Layout>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Dashboard
        </Typography>
        <Grid container spacing={4}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.2)',
                  },
                }}
                onClick={() => navigate(card.path)}
              >
                <Box sx={{ mb: 2 }}>{card.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium' }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                  {card.description}
                </Typography>
                <Button variant="contained" color="primary" sx={{ borderRadius: 5 }}>
                  Go
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;
