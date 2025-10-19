import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

/* ----------  Firebase Admin init (unchanged)  ---------- */
const serviceAccount = JSON.parse(
  readFileSync(new URL('./swim-app-cfb89-firebase-adminsdk-fbsvc-d712ee60dd.json', import.meta.url), 'utf-8')
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});
const db = admin.firestore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
const IS_PROD = process.env.NODE_ENV === 'production';
const BASE_URL = IS_PROD ? process.env.RENDER_EXTERNAL_URL : 'http://localhost:10000';
const FRONTEND_URL = IS_PROD ? BASE_URL : 'http://localhost:5173';
const REDIRECT_URI = `${BASE_URL}/auth/strava/callback`;

/* ----------  JWT verification middleware (unchanged)  ---------- */
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).send('Authentication required');
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(403).send('Invalid token');
  }
};

const requireAdmin = async (req, res, next) => {
  const { uid } = req.user;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data().isAdmin) {
      next();
    } else {
      res.status(403).send('Admin access required');
    }
  } catch (error) {
    console.error('Error verifying admin status:', error);
    res.status(500).send('Internal server error');
  }
};

const requireAdminOrCoach = async (req, res, next) => {
  const { uid } = req.user;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists && (userDoc.data().isAdmin || userDoc.data().userType === 'coach')) {
      next();
    } else {
      res.status(403).send('Admin or Coach access required');
    }
  } catch (error) {
    console.error('Error verifying admin/coach status:', error);
    res.status(500).send('Internal server error');
  }
};

/* ------------------------------------------------------------- */
/* 2.  Strava callback – fetch doc by uid from state, pull creds from Firestore */
/*     MOVED BEFORE INIT TO AVOID ROUTE CONFLICT                  */
/* ------------------------------------------------------------- */
app.get('/auth/strava/callback', async (req, res) => {
  const { code, state } = req.query;
  const uid = decodeURIComponent(state);

  try {
    console.log(`Callback hit for uid: ${uid}`);  // Debug: Confirm route match
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) throw new Error('User doc vanished');

    const data = userDoc.data();
    console.log(`Callback debug for uid ${uid}:`, {  // Debug log
      hasStravaClientId: !!data.stravaClientId,
      hasStravaClientSecret: !!data.stravaClientSecret,
      stravaClientId: data.stravaClientId ? 'PRESENT' : 'MISSING',
      stravaClientSecret: data.stravaClientSecret ? 'PRESENT (length: ' + data.stravaClientSecret.length + ')' : 'MISSING',
      allKeys: Object.keys(data)
    });

    if (!data.stravaClientId || !data.stravaClientSecret) {
      throw new Error('Strava client ID/Secret not configured for this user');
    }

    // Use /api/v3/ endpoint
    const tokenRes = await axios.post('https://www.strava.com/api/v3/oauth/token', {
      client_id: data.stravaClientId,
      client_secret: data.stravaClientSecret,
      code,
      grant_type: 'authorization_code'
    });

    await userDoc.ref.update({
      stravaAccessToken: tokenRes.data.access_token,
      stravaRefreshToken: tokenRes.data.refresh_token,
      stravaTokenExpiresAt: Date.now() + tokenRes.data.expires_in * 1000
    });

    console.log(`Strava tokens stored for uid: ${uid}`);
    res.redirect(`${FRONTEND_URL}/strava`);
  } catch (error) {
    console.error('Error exchanging Strava auth code:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      uid
    });
    res.status(500).send('Authentication failed');
  }
});

/* ------------------------------------------------------------- */
/* 1.  Start Strava auth – fetch/create doc by uid, pull creds from Firestore */
/*     Pass the *uid* in state so callback can use it             */
/* ------------------------------------------------------------- */
app.get('/auth/strava/:uid', async (req, res) => {
  const uid = req.params.uid;

  try {
    let userDoc = await db.collection('users').doc(uid).get();
    console.log(`Firestore doc exists for ${uid}: ${userDoc.exists}`);  // Debug log

    let data;

    if (!userDoc.exists) {
      console.log(`Creating new doc for ${uid}...`);  // Debug log
      const firebaseUser = await admin.auth().getUser(uid);
      data = {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        isAdmin: false,
        createdAt: FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(uid).set(data);
      console.log(`Created new user doc for uid: ${uid} with email: ${data.email}`);
      userDoc = await db.collection('users').doc(uid).get();
      data = userDoc.data();
    } else {
      data = userDoc.data();
      console.log(`Using existing doc for ${uid}, email: ${data.email}`);  // Debug log
    }

    if (!data.stravaClientId || !data.stravaClientSecret) {
      console.error(`Missing Strava creds for uid: ${uid}. Fields: stravaClientId=${!!data.stravaClientId}, stravaClientSecret=${!!data.stravaClientSecret}`);  // Enhanced log
      return res.status(400).send('Strava client ID/Secret not configured for this user');
    }

    const authUrl =
      `https://www.strava.com/oauth/authorize?client_id=${data.stravaClientId}` +
      `&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force` +
      `&scope=read,activity:read_all&state=${encodeURIComponent(uid)}`;

    console.log(`Redirecting to Strava OAuth for uid: ${uid}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Strava auth:', error);
    res.status(500).send('Authentication failed');
  }
});

/* ------------------------------------------------------------- */
/* 3.  Fetch Strava swims (unchanged logic)                     */
/* ------------------------------------------------------------- */
app.get('/strava/swims', authenticateUser, async (req, res) => {
  const { uid } = req.user;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).send('User not found');

    const { stravaAccessToken } = userDoc.data();
    if (!stravaAccessToken) return res.status(401).send('Not authenticated with Strava');

    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${stravaAccessToken}` },
      params: { per_page: 30, page: 1 }
    });

    const swims = response.data.filter(a => a.sport_type === 'Swim');

    const detailedSwims = await Promise.all(swims.map(async (swim) => {
      const activityDetails = await axios.get(`https://www.strava.com/api/v3/activities/${swim.id}`,
        {
          headers: { Authorization: `Bearer ${stravaAccessToken}` },
        }
      );
      return activityDetails.data;
    }));

    // --- NEW: Cache the detailed swims in Firestore ---
    const batch = db.batch();
    const sessionsCollection = db.collection('strava_sessions');
    const userEmail = req.user.email;

    detailedSwims.forEach(swim => {
      const docRef = sessionsCollection.doc(String(swim.id));
      const sessionData = {
        id: String(swim.id),
        name: swim.name,
        distance: swim.distance,
        moving_time: swim.moving_time,
        elapsed_time: swim.elapsed_time,
        start_date: swim.start_date,
        average_heartrate: swim.average_heartrate,
        max_heartrate: swim.max_heartrate,
        swimmerEmail: userEmail, // Add the user's email
      };
      batch.set(docRef, sessionData, { merge: true });
    });

    await batch.commit();
    console.log(`Cached ${detailedSwims.length} Strava swims for ${userEmail}`);
    // --- END NEW --- 

    res.json(detailedSwims);
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    res.status(500).send('Failed to fetch Strava activities');
  }
});

// User Management API
app.get('/api/users', authenticateUser, requireAdminOrCoach, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Failed to fetch users');
  }
});

app.put('/api/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isAdmin } = req.body;
    await db.collection('users').doc(id).update({ name, email, isAdmin });
    res.status(200).send(`User ${id} updated`);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Failed to update user');
  }
});

app.delete('/api/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('users').doc(id).delete();
    await admin.auth().deleteUser(id);
    res.status(200).send(`User ${id} deleted`);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Failed to delete user');
  }
});


/* ----------  static & catch-all (unchanged)  ---------- */
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const port = process.env.PORT || 10000;
const server = app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
server.keepAliveTimeout = 120_000;
server.headersTimeout  = 120_000;