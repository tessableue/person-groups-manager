# Person Groups Manager

A web application for managing people and groups with real-time chat functionality. Built with Firebase and vanilla JavaScript.

## Features

- User authentication (sign up, login, logout)
- Add and manage people with their job titles and industries
- Create and manage groups
- Real-time chat with other users
- Filter users by industry and job title
- Responsive design

## Prerequisites

- A Firebase account and project
- Modern web browser with JavaScript enabled

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/person-groups-manager.git
   cd person-groups-manager
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your Firebase configuration values:
     ```
     FIREBASE_API_KEY=AIzaSyB-u358M-Qm3BJpu-2uuGR2hVb8HNOCpaQ
     FIREBASE_AUTH_DOMAIN=person-groups-manager.firebaseapp.com
     FIREBASE_PROJECT_ID=person-groups-manager
     FIREBASE_STORAGE_BUCKET=person-groups-manager.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=1234567890
     FIREBASE_APP_ID=1:1234567890:web:abcdef1234567890
     ```

3. Set up Firebase:
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy your Firebase configuration values to the `.env` file

4. Deploy the application:
   - You can use any static hosting service (Firebase Hosting, Netlify, Vercel, etc.)
   - Make sure to set up the environment variables in your hosting platform

## Project Structure

```
person-groups-manager/
├── index.html          # Main HTML file
├── styles.css          # Main stylesheet
├── script.js           # Main JavaScript file
├── config.js           # Firebase configuration
├── .env               # Environment variables (not in repo)
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore rules
└── firestore.rules    # Firestore security rules
```

## Security

- Environment variables are used to protect sensitive information
- Firebase security rules are implemented to protect data
- User authentication is required for all operations
- Each user can only access their own data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for providing the backend services
- All contributors who help improve this project 