// Load environment variables
const env = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || 'AIzaSyB-u358M-Qm3BJpu-2uuGR2hVb8HNOCpaQ',
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || 'quiz-app.firebaseapp.com',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'quiz-app',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'quiz-app.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || 'quiz-app',
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || 'quiz-app'
};

// Firebase configuration
const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID
};

// Make config available globally
window.firebaseConfig = firebaseConfig; 