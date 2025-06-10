import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const LandingPage = () => {
  return (
    <Layout>
      <div style={{
        maxWidth: '600px',
        margin: '50px auto',
        padding: '40px',
        textAlign: 'center',
      }}>
        <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>Welcome to SmartMeet</h1>
        <p style={{ fontSize: '18px', color: '#555', marginBottom: '30px' }}>
          Your Zoom-like video call app with live transcription, summary, and MoM generation.
        </p>
        <div>
          <Link to="/login" style={{
            marginRight: '20px',
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}>Login</Link>
          <Link to="/signup" style={{
            padding: '10px 20px',
            backgroundColor: '#388e3c',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}>Signup</Link>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPage;
