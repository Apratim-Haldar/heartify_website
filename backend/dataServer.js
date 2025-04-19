import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
const app = express();
import connectDb from './config/db.js'
import HeartRate from "./models/heartRateMonitor.js"
import Users from "./models/Users.js"
import http from 'http'
import {Server} from 'socket.io'
import mongoose from 'mongoose'

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

connectDb();
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ["http://localhost:5173"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Set up MongoDB change stream
const setupChangeStream = async () => {
  try {
    // Watch the HeartRateMonitor collection for changes
    const changeStream = HeartRate.watch([], { fullDocument: 'updateLookup' });
    
    changeStream.on('change', async (change) => {
      console.log('Change detected:', change.operationType);
      
      if (change.operationType === 'insert') {
        const newHeartRate = change.fullDocument;
        
        // Emit the new heart rate data to all connected clients
        io.emit('heartRateUpdate', {
          maxBPM: newHeartRate.maxBPM,
          avgBPM: newHeartRate.avgBPM,
          minBPM: newHeartRate.minBPM,
          timestamp: newHeartRate.createdAt,
          operation: 'insert'
        });
        
        console.log('New heart rate data inserted:', newHeartRate.maxBPM);
      } 
      else if (change.operationType === 'update') {
        // For updates, we need to fetch the updated document
        const updatedHeartRate = change.fullDocument;
        
        if (updatedHeartRate) {
          io.emit('heartRateUpdate', {
            maxBPM: updatedHeartRate.maxBPM,
            avgBPM: updatedHeartRate.avgBPM,
            minBPM: updatedHeartRate.minBPM,
            timestamp: updatedHeartRate.createdAt,
            operation: 'update'
          });
          
          console.log('Heart rate data updated:', updatedHeartRate.maxBPM);
        }
      }
      else if (change.operationType === 'delete') {
        // For deletes, we only have the document ID
        const deletedDocumentId = change.documentKey._id;
        
        io.emit('heartRateUpdate', {
          documentId: deletedDocumentId.toString(),
          operation: 'delete'
        });
        
        console.log('Heart rate data deleted, ID:', deletedDocumentId);
        
        // Fetch the latest record after deletion
        const latestRecord = await HeartRate.findOne().sort({ createdAt: -1 });
        
        if (latestRecord) {
          io.emit('heartRateUpdate', {
            maxBPM: latestRecord.maxBPM,
            avgBPM: latestRecord.avgBPM,
            minBPM: latestRecord.minBPM,
            timestamp: latestRecord.createdAt,
            operation: 'latest'
          });
        }
      }
    });
    
    console.log('MongoDB change stream established');
  } catch (error) {
    console.error('Error setting up change stream:', error);
  }
};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start change stream after MongoDB connection is established
mongoose.connection.once('open', () => {
  console.log('MongoDB connection ready, setting up change stream');
  setupChangeStream();
});

// Middleware to verify authentication
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get("/maxHR", async (req, res) => {
  try {
    const maxHR = await HeartRate.find().sort({ createdAt: -1 }).limit(1);
    res.json(maxHR);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Modified insertData endpoint to associate data with user
app.post("/insertData", /* authenticateToken, */ async (req, res) => {
  try {
    const { maxbpm, av6, minbpm } = req.body;
    if (maxbpm && av6 && minbpm) {
      const newHeartRate = new HeartRate({
        maxBPM: maxbpm,
        avgBPM: av6,
        minBPM: minbpm,
        /* userId: req.user._id, */
        /* heartifyID: req.user.heartifyID */
      });
      await newHeartRate.save();
      res.status(201).json({ message: "Data inserted successfully" });
    } else {
      res.status(400).json({ message: "Invalid data" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get daily heart rate data
app.get("/api/heart-rate/daily", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const heartRateData = await HeartRate.find({
      /* userId: req.user._id, */
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: 1 });
    
    res.json(heartRateData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly heart rate data
app.get("/api/heart-rate/weekly", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);
    
    const heartRateData = await HeartRate.find({
      /* userId: req.user._id, */
      createdAt: { $gte: lastWeek, $lte: today }
    }).sort({ createdAt: 1 });
    
    // Group by day
    const groupedData = {};
    heartRateData.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          maxBPM: 0,
          avgBPM: 0,
          minBPM: 0,
          count: 0
        };
      }
      
      groupedData[date].maxBPM = Math.max(groupedData[date].maxBPM, record.maxBPM);
      groupedData[date].avgBPM += record.avgBPM;
      groupedData[date].minBPM = groupedData[date].minBPM === 0 ? 
        record.minBPM : Math.min(groupedData[date].minBPM, record.minBPM);
      groupedData[date].count++;
    });
    
    // Calculate averages
    const result = Object.values(groupedData).map(day => ({
      date: day.date,
      maxBPM: day.maxBPM,
      avgBPM: Math.round(day.avgBPM / day.count),
      minBPM: day.minBPM
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly heart rate data
app.get("/api/heart-rate/monthly", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setHours(0, 0, 0, 0);
    
    const heartRateData = await HeartRate.find({
      /* userId: req.user._id, */
      createdAt: { $gte: lastMonth, $lte: today }
    }).sort({ createdAt: 1 });
    
    // Group by week
    const groupedData = {};
    heartRateData.forEach(record => {
      const recordDate = new Date(record.createdAt);
      const weekNumber = Math.ceil((recordDate.getDate() + 
        new Date(recordDate.getFullYear(), recordDate.getMonth(), 1).getDay()) / 7);
      
      const weekKey = `${recordDate.getFullYear()}-${recordDate.getMonth()+1}-W${weekNumber}`;
      
      if (!groupedData[weekKey]) {
        groupedData[weekKey] = {
          week: weekKey,
          maxBPM: 0,
          avgBPM: 0,
          minBPM: 0,
          count: 0
        };
      }
      
      groupedData[weekKey].maxBPM = Math.max(groupedData[weekKey].maxBPM, record.maxBPM);
      groupedData[weekKey].avgBPM += record.avgBPM;
      groupedData[weekKey].minBPM = groupedData[weekKey].minBPM === 0 ? 
        record.minBPM : Math.min(groupedData[weekKey].minBPM, record.minBPM);
      groupedData[weekKey].count++;
    });
    
    // Calculate averages
    const result = Object.values(groupedData).map(week => ({
      week: week.week,
      maxBPM: week.maxBPM,
      avgBPM: Math.round(week.avgBPM / week.count),
      minBPM: week.minBPM
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, heartifyID } = req.body;
    
    // Add input validation
    if (!username || !email || !password || !heartifyID) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure password is a string
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid password format' });
    }

    // Check if email already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Check if heartifyID already exists
    const existingHeartifyID = await Users.findOne({ heartifyID });
    if (existingHeartifyID) {
      return res.status(400).json({ error: 'Heartify ID already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Users.create({
      username,
      email,
      password: hashedPassword,
      heartifyID
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.cookie('authToken', token, { httpOnly: true, secure: false, maxAge: 86400000 });
    res.json({ user: { id: user._id, name: username } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.json({ user: { id: user._id, name: user.username, heartifyID: user.heartifyID } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token route
app.get('/api/verify-token', async (req, res) => {
  try {
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({ authenticated: true, user: { id: user._id, name: user.username, heartifyID: user.heartifyID } });
  } catch (error) {
    res.status(401).json({ authenticated: false, error: error.message });
  }
});

// Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true });
});

app.get('/api/verify-auth', async (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id);
    res.json({ role: user.role, user:user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});