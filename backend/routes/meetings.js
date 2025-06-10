const express = require('express');
const router = express.Router();
const axios = require('axios');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');




/*
// Removed authentication middleware to disable token auth
*/

// Create a new meeting
router.post('/create', async (req, res) => {
  try {
    const { title } = req.body;
    // Find or create default host user
    let hostUser = await User.findOne({ email: 'admin@smartmeet.com' });
    if (!hostUser) {
      hostUser = new User({
        name: 'Admin User',
        email: 'admin@smartmeet.com',
        password: 'admin1234',
      });
      await hostUser.save();
    }
    const host = hostUser._id;
    const meetingLink = uuidv4();

    const meeting = new Meeting({
      title,
      host,
      participants: [host],
      meetingLink,
    });

    await meeting.save();
    res.status(201).json({ meeting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join an existing meeting by meetingLink
router.post('/join', async (req, res) => {
  try {
    const { meetingLink } = req.body;
    // No userId since no auth
    const userId = null;

    const meeting = await Meeting.findOne({ meetingLink });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Without userId, cannot track participants
    res.status(200).json({ meeting });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all meetings (for meeting selection)
router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ startTime: -1 });
    res.status(200).json({ meetings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
