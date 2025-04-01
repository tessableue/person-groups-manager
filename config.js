// Load environment variables
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make config available globally
window.firebaseConfig = firebaseConfig; 