import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import CreateMeetingPage from './pages/CreateMeetingPage';
import JoinMeetingPage from './pages/JoinMeetingPage';
import UpcomingMeetingsPage from './pages/UpcomingMeetingsPage';
import RecordingsPage from './pages/RecordingsPage';
import SummaryPage from './pages/SummaryPage';
import MoMPage from './pages/MoMPage';
import TranscriptPage from './pages/TranscriptPage';
import VideoCallPage from './pages/VideoCallPage';
import MeetingSelectionPage from './pages/MeetingSelectionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-meeting" element={<CreateMeetingPage />} />
        <Route path="/join-meeting" element={<JoinMeetingPage />} />
        <Route path="/upcoming-meetings" element={<UpcomingMeetingsPage />} />
        <Route path="/meeting-selection" element={<MeetingSelectionPage />} />
        <Route path="/recordings/:meetingId?" element={<RecordingsPage />} />
        <Route path="/recordings" element={<Dashboard />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/mom" element={<MoMPage />} />
        <Route path="/transcription/:meetingId" element={<TranscriptPage />} />
        <Route path="/video-call" element={<VideoCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;
