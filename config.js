// Load environment variables
const env = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || window.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || window.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || window.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || window.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || window.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || window.FIREBASE_APP_ID
};

// Validate required environment variables
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-u358M-Qm3BJpu-2uuGR2hVb8HNOCpaQ",
    authDomain: "person-groups-manager.firebaseapp.com",
    projectId: "person-groups-manager",
    storageBucket: "person-groups-manager.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef1234567890"
};

// Make config available globally
window.firebaseConfig = firebaseConfig; 