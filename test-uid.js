import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

// Firebase Admin init (copied from server.js)
const serviceAccount = JSON.parse(
  readFileSync(new URL('./swim-app-cfb89-firebase-adminsdk-fbsvc-d712ee60dd.json', import.meta.url), 'utf-8')
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const UID_TO_CHECK = 'R28JB778TUfxz6y2yHeev3idy1t2';  // Replace if needed

async function checkUid() {
  try {
    const user = await admin.auth().getUser(UID_TO_CHECK);
    console.log('User exists in Firebase Auth:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime
    });
  } catch (err) {
    console.error('User not found in Firebase Auth:', {
      uid: UID_TO_CHECK,
      error: err.message,
      code: err.code
    });
    // Optional: Create the user if missing (uncomment if desired)
    /*
    const newUser = await admin.auth().createUser({
      uid: UID_TO_CHECK,
      email: 'natetmaxwell@icloud.com',  // From your Firestore doc
      displayName: 'Nathan Maxwell',
      password: 'tempPassword123!'  // Set a temp password; force reset on first login
    });
    console.log('Created new Auth user:', newUser.uid);
    */
  }
}

checkUid().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});