console.log('--- SERVER.JS EXECUTING ---');
import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = data.user; // Supabase user object
    console.log("authenticateUser: req.user.id=", req.user.id, "req.user.email=", req.user.email);
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(403).send('Invalid token');
  }
};

const requireAdmin = async (req, res, next) => {
  const uid = req.user.id; // Supabase user object has 'id'
  console.log("requireAdmin: Checking role for uid=", uid);
  try {
    const { data: user, error } = await supabase.from('users').select('isAdmin').eq('UID', uid).single();
    if (error) throw error;
    console.log("requireAdmin: Fetched user data=", user);
    if (user && user.isAdmin) {
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
  const uid = req.user.id; // Supabase user object has 'id'
  console.log("requireAdminOrCoach: Checking role for uid=", uid);
  try {
    const { data: user, error } = await supabase.from('users').select('isAdmin, userType').eq('UID', uid).single();
    if (error) throw error;
    console.log("requireAdminOrCoach: Fetched user data=", user);
    if (user && (user.isAdmin || user.userType === 'coach')) {
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
    console.log(`Callback hit for uid: ${uid}`);
    const { data: userData, error: fetchError } = await supabase.from('users').select('stravaClientId, stravaClientSecret').eq('UID', uid).single();
    if (fetchError) throw fetchError;
    if (!userData) throw new Error('User data not found');

    console.log(`Callback debug for uid ${uid}:`, {
      hasStravaClientId: !!userData.stravaClientId,
      hasStravaClientSecret: !!userData.stravaClientSecret,
      stravaClientId: userData.stravaClientId ? 'PRESENT' : 'MISSING',
      stravaClientSecret: userData.stravaClientSecret ? 'PRESENT (length: ' + userData.stravaClientSecret.length + ')' : 'MISSING',
      allKeys: Object.keys(userData)
    });

    if (!userData.stravaClientId || !userData.stravaClientSecret) {
      throw new Error('Strava client ID/Secret not configured for this user');
    }

    const tokenRes = await axios.post('https://www.strava.com/api/v3/oauth/token', {
      client_id: userData.stravaClientId,
      client_secret: userData.stravaClientSecret,
      code,
      grant_type: 'authorization_code'
    });

    const { error: updateError } = await supabase.from('users').update({
      stravaAccessToken: tokenRes.data.access_token,
      stravaRefreshToken: tokenRes.data.refresh_token,
      stravaTokenExpiresAt: Date.now() + tokenRes.data.expires_in * 1000
    }).eq('UID', uid);
    if (updateError) throw updateError;

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
    let { data: userData, error: fetchError } = await supabase.from('users').select('*').eq('UID', uid).single();
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw fetchError;
    }

    if (!userData) {
      console.log(`Creating new user doc for UID: ${uid}...`);
      // Assuming user is already authenticated with Supabase, get email from auth
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.admin.getUserById(uid);
      if (authError) throw authError;
      if (!supabaseUser) throw new Error('Supabase user not found for UID');

      const newUser = {
        UID: uid,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        isAdmin: false,
        userType: 'swimmer',
        // createdAt: new Date().toISOString() // Supabase handles timestamps automatically
      };
      const { data: newUserData, error: insertError } = await supabase.from('users').insert(newUser).select().single();
      if (insertError) throw insertError;
      userData = newUserData;
      console.log(`Created new user doc for UID: ${uid} with email: ${userData.email}`);
    } else {
      console.log(`Using existing user doc for UID: ${uid}, email: ${userData.email}`);
    }

    if (!userData.stravaClientId || !userData.stravaClientSecret) {
      console.error(`Missing Strava creds for UID: ${uid}. Fields: stravaClientId=${!!userData.stravaClientId}, stravaClientSecret=${!!userData.stravaClientSecret}`);
      return res.status(400).send('Strava client ID/Secret not configured for this user');
    }

    const authUrl =
      `https://www.strava.com/oauth/authorize?client_id=${userData.stravaClientId}` +
      `&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force` +
      `&scope=read,activity:read_all&state=${encodeURIComponent(uid)}`;

    console.log(`Redirecting to Strava OAuth for UID: ${uid}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Strava auth:', error);
    res.status(500).send('Authentication failed');
  }
});

app.post('/strava/token', authenticateUser, async (req, res) => {
  console.log('--- /strava/token route handler reached ---');
  const uid = req.user.id;
  try {
    const { data: userData, error: fetchError } = await supabase.from('users').select('stravaClientId, stravaClientSecret, stravaRefreshToken').eq('UID', uid).single();
    if (fetchError) throw fetchError;
    if (!userData || !userData.stravaRefreshToken || !userData.stravaClientId || !userData.stravaClientSecret) {
      return res.status(400).send('Strava refresh token or client credentials not found for user');
    }

    const tokenRes = await axios.post('https://www.strava.com/api/v3/oauth/token', {
      client_id: userData.stravaClientId,
      client_secret: userData.stravaClientSecret,
      grant_type: 'refresh_token',
      refresh_token: userData.stravaRefreshToken,
    });

    const { error: updateError } = await supabase.from('users').update({
      stravaAccessToken: tokenRes.data.access_token,
      stravaRefreshToken: tokenRes.data.refresh_token,
      stravaTokenExpiresAt: Date.now() + tokenRes.data.expires_in * 1000,
    }).eq('UID', uid);
    if (updateError) throw updateError;

    res.json({ access_token: tokenRes.data.access_token });
  } catch (error) {
    console.error('Error refreshing Strava access token:', error);
    res.status(500).send('Failed to refresh Strava access token');
  }
});

/* ------------------------------------------------------------- */
/* 3.  Fetch Strava swims (unchanged logic)                     */
/* ------------------------------------------------------------- */
app.get('/strava/swims', authenticateUser, async (req, res) => {
  const uid = req.user.id; // Supabase user object has 'id'
  try {
    const { data: userData, error: fetchError } = await supabase.from('users').select('stravaAccessToken').eq('UID', uid).single();
    if (fetchError) throw fetchError;
    if (!userData) return res.status(404).send('User not found');

    const { stravaAccessToken } = userData;
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

    // --- NEW: Cache the detailed swims in Supabase ---
    const sessionsToInsert = detailedSwims.map(swim => ({
      id: String(swim.id),
      name: swim.name,
      distance: swim.distance,
      moving_time: swim.moving_time,
      elapsed_time: swim.elapsed_time,
      start_date: swim.start_date,
      average_heartrate: swim.average_heartrate,
      max_heartrate: swim.max_heartrate,
      swimmerEmail: req.user.email, // Use Supabase user email
    }));

    const { error: insertError } = await supabase.from('strava_sessions').upsert(sessionsToInsert, { onConflict: 'id' });
    if (insertError) throw insertError;

    console.log(`Cached ${detailedSwims.length} Strava swims for ${req.user.email}`);
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
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;
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
    const { error } = await supabase.from('users').update({ name, email, isAdmin }).eq('UID', id);
    if (error) throw error;
    res.status(200).send(`User ${id} updated`);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Failed to update user');
  }
});

app.delete('/api/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error: deleteUserError } = await supabase.from('users').delete().eq('UID', id);
    if (deleteUserError) throw deleteUserError;
    // Supabase authentication user deletion
    const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(id);
    if (deleteAuthUserError) throw deleteAuthUserError;
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
server.on('error', (err) => {
  console.error('--- SERVER ERROR ---', err);
});
server.keepAliveTimeout = 120_000;
server.headersTimeout  = 120_000;