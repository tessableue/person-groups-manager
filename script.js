// Firebase configuration is now loaded from config.js
const firebaseConfig = window.firebaseConfig;

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let currentUser = null;
let selectedPerson = null;
let currentChatUser = null;
let chatListener = null;

// DOM Elements
const appContainer = document.getElementById('app-container');
const authContainer = document.getElementById('auth-container');
const userEmailElement = document.getElementById('user-email');
const userNameElement = document.getElementById('user-name');
const peopleList = document.getElementById('people-list');
const groupsList = document.getElementById('groups-list');
const groupDetail = document.getElementById('group-detail');
const groupTitle = document.getElementById('group-title');
const groupMembers = document.getElementById('group-members');
const personModal = document.getElementById('person-modal');
const availableGroups = document.getElementById('available-groups');
const chatUsers = document.getElementById('chat-users');
const chatMessages = document.getElementById('chat-messages');
const chatMessageInput = document.getElementById('chat-message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const chatWithUser = document.getElementById('chat-with-user');

// Auth Functions
function toggleAuth(form) {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.auth-tab[onclick="toggleAuth('${form}')"]`).classList.add('active');
    
    document.getElementById('login-form').classList.toggle('hidden', form === 'register');
    document.getElementById('register-form').classList.toggle('hidden', form === 'login');
}

async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        await saveUserData();
        showApp();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        await loadUserData();
        showApp();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function logout() {
    try {
        if (chatListener) {
            chatListener();
        }
        await auth.signOut();
        currentUser = null;
        currentChatUser = null;
        showAuth();
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

// UI Functions
function showApp() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userEmailElement.textContent = currentUser.email;
    loadCategories();
}

function showAuth() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

// Navigation Functions
function showCategory(category) {
    document.getElementById('categories-page').classList.remove('active');
    document.getElementById('category-people-page').classList.add('active');
    document.getElementById('category-title').textContent = category;
    loadCategoryPeople(category);
}

function backToCategories() {
    document.getElementById('category-people-page').classList.remove('active');
    document.getElementById('categories-page').classList.add('active');
}

function showProfile(personId) {
    document.getElementById('category-people-page').classList.remove('active');
    document.getElementById('profile-page').classList.add('active');
    loadProfile(personId);
}

function backToCategoryPeople() {
    document.getElementById('profile-page').classList.remove('active');
    document.getElementById('category-people-page').classList.add('active');
}

// Data Loading Functions
async function loadCategories() {
    const categories = [
        'Healthcare', 'Education', 'Information Technology', 'Engineering',
        'Business and Finance', 'Marketing and Sales'
    ];
    
    const categoriesGrid = document.querySelector('.categories-grid');
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card" onclick="showCategory('${category}')">
            <h3>${category}</h3>
        </div>
    `).join('');
}

async function loadCategoryPeople(category) {
    try {
        const snapshot = await db.collection('users')
            .where('industry', '==', category)
            .get();
        
        const peopleGrid = document.getElementById('category-people-list');
        peopleGrid.innerHTML = '';
        
        snapshot.forEach(doc => {
            const person = doc.data();
            const div = document.createElement('div');
            div.className = 'person-card';
            div.innerHTML = `
                <img src="${person.photoURL || 'default-avatar.png'}" alt="${person.displayName}">
                <h3>${person.displayName}</h3>
                <p>${person.jobTitle || ''}</p>
            `;
            div.onclick = () => showProfile(doc.id);
            peopleGrid.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading category people:', error);
    }
}

async function loadProfile(personId) {
    try {
        const doc = await db.collection('users').doc(personId).get();
        if (!doc.exists) return;
        
        const person = doc.data();
        document.getElementById('profile-name').textContent = person.displayName;
        document.getElementById('profile-job-title').textContent = person.jobTitle || '';
        document.getElementById('profile-industry').textContent = person.industry || '';
        document.getElementById('profile-picture').src = person.photoURL || 'default-avatar.png';
        
        // Load posts
        loadPosts(personId);
        
        // Set up chat
        currentChatUser = { userId: personId, name: person.displayName };
        document.getElementById('chat-with-name').textContent = person.displayName;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadPosts(personId) {
    try {
        const snapshot = await db.collection('users')
            .doc(personId)
            .collection('posts')
            .orderBy('timestamp', 'desc')
            .get();
        
        const postsContainer = document.getElementById('posts-container');
        postsContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = 'post';
            div.innerHTML = `
                <img src="${post.imageUrl}" alt="Work photo">
                <p>${post.caption || ''}</p>
                <small>${new Date(post.timestamp.toDate()).toLocaleDateString()}</small>
            `;
            postsContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Post Functions
async function uploadPost(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const storageRef = storage.ref(`posts/${currentUser.uid}/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        const imageUrl = await storageRef.getDownloadURL();
        
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('posts')
            .add({
                imageUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                caption: prompt('Add a caption to your post:') || ''
            });
        
        loadPosts(currentUser.uid);
    } catch (error) {
        console.error('Error uploading post:', error);
        alert('Failed to upload post. Please try again.');
    }
}

// Chat Functions
function toggleChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.classList.toggle('hidden');
    if (!chatContainer.classList.contains('hidden')) {
        loadChatMessages();
    }
}

async function loadChatMessages() {
    if (!currentChatUser) return;
    
    const chatRoomId = [currentUser.uid, currentChatUser.userId].sort().join('_');
    
    // Mark messages as read
    const unreadMessages = await db.collection('chats')
        .doc(chatRoomId)
        .collection('messages')
        .where('read', '==', false)
        .where('senderId', '!=', currentUser.uid)
        .get();
    
    const batch = db.batch();
    unreadMessages.forEach(doc => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    
    // Listen for messages
    if (chatListener) {
        chatListener();
    }
    
    chatListener = db.collection('chats')
        .doc(chatRoomId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                displayMessage(message);
            });
        });
}

function displayMessage(message) {
    const div = document.createElement('div');
    div.className = `chat-message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const timestamp = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : '';
    const readStatus = message.senderId === currentUser.uid 
        ? `<div class="message-status ${message.read ? 'read' : 'sent'}">
            ${message.read ? '✓✓' : '✓'}
           </div>`
        : '';
    
    div.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-timestamp">${timestamp}</div>
        ${readStatus}
    `;
    
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    if (!currentChatUser || !chatMessageInput.value.trim()) return;
    
    const messageText = chatMessageInput.value.trim();
    const chatRoomId = [currentUser.uid, currentChatUser.userId].sort().join('_');
    
    try {
        await db.collection('chats')
            .doc(chatRoomId)
            .collection('messages')
            .add({
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        
        chatMessageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Event Listeners
document.getElementById('post-image-input').addEventListener('change', uploadPost);
document.getElementById('chat-message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserData();
        showApp();
    } else {
        currentUser = null;
        showAuth();
    }
});

// People Functions
async function addPerson() {
    const nameInput = document.getElementById('person-name');
    const linkedinInput = document.getElementById('person-linkedin');
    const jobTitleInput = document.getElementById('person-job-title');
    const industryInput = document.getElementById('person-industry');
    const addButton = document.querySelector('.add-person-form button');
    
    const name = nameInput.value.trim();
    const linkedin = linkedinInput.value.trim();
    const jobTitle = jobTitleInput.value.trim();
    const industry = industryInput.value;
    
    // Validation
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    if (name.length > 100) {
        alert('Name is too long (max 100 characters)');
        return;
    }
    
    if (linkedin && !linkedin.includes('linkedin.com')) {
        alert('Please enter a valid LinkedIn URL');
        return;
    }
    
    if (jobTitle && jobTitle.length > 100) {
        alert('Job title is too long (max 100 characters)');
        return;
    }
    
    try {
        setLoading(addButton, true);
        addButton.textContent = 'Adding...';
        
        await db.collection('users').doc(currentUser.uid)
            .collection('people').add({
                name: name,
                linkedin: linkedin || null,
                jobTitle: jobTitle || null,
                industry: industry || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
        // Clear form
        nameInput.value = '';
        linkedinInput.value = '';
        jobTitleInput.value = '';
        industryInput.value = '';
        
        // Refresh list
        await loadPeople();
        
        // Show success message
        alert('Person added successfully!');
    } catch (error) {
        console.error('Error adding person:', error);
        alert('Failed to add person. Please try again.');
    } finally {
        setLoading(addButton, false);
        addButton.textContent = 'Add Person';
    }
}

async function loadPeople() {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('people').get();
        
        peopleList.innerHTML = '';
        snapshot.forEach(doc => {
            const person = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            
            const linkedinHtml = person.linkedin 
                ? `<a href="${person.linkedin}" target="_blank" class="person-linkedin">${person.linkedin}</a>`
                : '';
            
            const jobTitleHtml = person.jobTitle 
                ? `<span class="person-job-title">${person.jobTitle}</span>`
                : '';
            
            const industryHtml = person.industry 
                ? `<span class="person-industry">${person.industry}</span>`
                : '';
            
            div.innerHTML = `
                <div class="person-info">
                    <span class="person-name">${person.name}</span>
                    ${jobTitleHtml}
                    ${industryHtml}
                    ${linkedinHtml}
                </div>
                <div class="actions">
                    <button onclick="showAddToGroupModal('${doc.id}', '${person.name}')">Add to Group</button>
                    <button onclick="deletePerson('${doc.id}')">Delete</button>
                </div>
            `;
            peopleList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading people:', error);
    }
}

function filterByIndustry() {
    const selectedIndustry = document.getElementById('industry-filter').value;
    const items = peopleList.getElementsByClassName('list-item');
    
    Array.from(items).forEach(item => {
        const industryElement = item.querySelector('.person-industry');
        const industry = industryElement ? industryElement.textContent : '';
        
        if (!selectedIndustry || industry === selectedIndustry) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function deletePerson(personId) {
    if (!confirm('Are you sure you want to delete this person? This action cannot be undone.')) {
        return;
    }
    
    const deleteButton = event.target;
    try {
        setLoading(deleteButton, true);
        deleteButton.textContent = 'Deleting...';
        
        await db.collection('users').doc(currentUser.uid)
            .collection('people').doc(personId).delete();
            
        await loadPeople();
        alert('Person deleted successfully!');
    } catch (error) {
        console.error('Error deleting person:', error);
        alert('Failed to delete person. Please try again.');
    } finally {
        setLoading(deleteButton, false);
        deleteButton.textContent = 'Delete';
    }
}

// Groups Functions
async function addGroup() {
    const nameInput = document.getElementById('group-name');
    const name = nameInput.value.trim();
    
    if (!name) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('groups').add({
                name: name,
                members: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        nameInput.value = '';
        loadGroups();
    } catch (error) {
        console.error('Error adding group:', error);
    }
}

async function loadGroups() {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('groups').get();
        
        groupsList.innerHTML = '';
        snapshot.forEach(doc => {
            const group = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <span>${group.name}</span>
                <div class="actions">
                    <button onclick="showGroupDetail('${doc.id}', '${group.name}')">View</button>
                    <button onclick="deleteGroup('${doc.id}')">Delete</button>
                </div>
            `;
            groupsList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

async function deleteGroup(groupId) {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Show loading state
        const deleteButton = event.target;
        const originalText = deleteButton.textContent;
        deleteButton.textContent = 'Deleting...';
        deleteButton.disabled = true;
        
        await db.collection('users').doc(currentUser.uid)
            .collection('groups').doc(groupId).delete();
            
        await loadGroups();
        alert('Group deleted successfully!');
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group. Please try again.');
    } finally {
        // Reset button state
        const deleteButton = event.target;
        deleteButton.textContent = originalText;
        deleteButton.disabled = false;
    }
}

// Group Detail Functions
async function showGroupDetail(groupId, groupName) {
    groupTitle.textContent = groupName;
    groupDetail.classList.remove('hidden');
    document.getElementById('groups-tab').classList.add('hidden');
    
    try {
        const groupDoc = await db.collection('users').doc(currentUser.uid)
            .collection('groups').doc(groupId).get();
        
        const group = groupDoc.data();
        groupMembers.innerHTML = '';
        
        for (const personId of group.members) {
            const personDoc = await db.collection('users').doc(currentUser.uid)
                .collection('people').doc(personId).get();
            
            if (personDoc.exists) {
                const person = personDoc.data();
                const linkedinHtml = person.linkedin 
                    ? `<a href="${person.linkedin}" target="_blank" class="person-linkedin">${person.linkedin}</a>`
                    : '';
                
                const jobTitleHtml = person.jobTitle 
                    ? `<span class="person-job-title">${person.jobTitle}</span>`
                    : '';
                
                const industryHtml = person.industry 
                    ? `<span class="person-industry">${person.industry}</span>`
                    : '';
                
                const div = document.createElement('div');
                div.className = 'list-item';
                div.innerHTML = `
                    <div class="person-info">
                        <span class="person-name">${person.name}</span>
                        ${jobTitleHtml}
                        ${industryHtml}
                        ${linkedinHtml}
                    </div>
                    <button onclick="removeFromGroup('${groupId}', '${personId}')">Remove</button>
                `;
                groupMembers.appendChild(div);
            }
        }
    } catch (error) {
        console.error('Error loading group detail:', error);
    }
}

function backToGroups() {
    groupDetail.classList.add('hidden');
    document.getElementById('groups-tab').classList.remove('hidden');
}

// Modal Functions
async function showAddToGroupModal(personId, personName) {
    selectedPerson = { id: personId, name: personName };
    personModal.classList.remove('hidden');
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('groups').get();
        
        availableGroups.innerHTML = '';
        snapshot.forEach(doc => {
            const group = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <span>${group.name}</span>
                <button onclick="addToGroup('${doc.id}')">Add</button>
            `;
            availableGroups.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading available groups:', error);
    }
}

async function addToGroup(groupId) {
    try {
        const groupRef = db.collection('users').doc(currentUser.uid)
            .collection('groups').doc(groupId);
        
        await groupRef.update({
            members: firebase.firestore.FieldValue.arrayUnion(selectedPerson.id)
        });
        
        closeModal();
        loadGroups();
    } catch (error) {
        console.error('Error adding person to group:', error);
    }
}

async function removeFromGroup(groupId, personId) {
    try {
        const groupRef = db.collection('users').doc(currentUser.uid)
            .collection('groups').doc(groupId);
        
        await groupRef.update({
            members: firebase.firestore.FieldValue.arrayRemove(personId)
        });
        
        showGroupDetail(groupId, groupTitle.textContent);
    } catch (error) {
        console.error('Error removing person from group:', error);
    }
}

function closeModal() {
    personModal.classList.add('hidden');
    selectedPerson = null;
}

// Firestore Functions
async function saveUserData() {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Update the user's display name in Firebase Auth
        if (!currentUser.displayName) {
            await currentUser.updateProfile({
                displayName: currentUser.email.split('@')[0]
            });
        }
    } catch (error) {
        console.error('Error saving user data:', error);
        alert('Error saving user data. Please try again.');
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            // Update the UI with user data
            userEmailElement.textContent = userData.email;
            if (userData.displayName) {
                document.getElementById('user-name').textContent = userData.displayName;
            }
        } else {
            // If user data doesn't exist, create it
            await saveUserData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user data. Please try again.');
    }
}

// Add loading state helper function
function setLoading(element, isLoading) {
    if (isLoading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// Chat Functions
async function loadChatUsers() {
    try {
        const snapshot = await db.collection('users').get();
        chatUsers.innerHTML = '';
        
        snapshot.forEach(doc => {
            if (doc.id !== currentUser.uid) {
                const userData = doc.data();
                const peopleSnapshot = await doc.ref.collection('people').get();
                
                peopleSnapshot.forEach(personDoc => {
                    const person = personDoc.data();
                    const div = document.createElement('div');
                    div.className = 'chat-user-item';
                    div.innerHTML = `
                        <div class="user-info">
                            <span class="user-name">${person.name}</span>
                            ${person.jobTitle ? `<span class="user-job-title">${person.jobTitle}</span>` : ''}
                            ${person.industry ? `<span class="user-industry">${person.industry}</span>` : ''}
                        </div>
                    `;
                    div.dataset.userId = doc.id;
                    div.dataset.personId = personDoc.id;
                    div.dataset.name = person.name;
                    div.dataset.jobTitle = person.jobTitle || '';
                    div.dataset.industry = person.industry || '';
                    div.onclick = () => selectChatUser(doc.id, personDoc.id, person.name);
                    chatUsers.appendChild(div);
                });
            }
        });
    } catch (error) {
        console.error('Error loading chat users:', error);
    }
}

function filterChatUsers() {
    const selectedIndustry = document.getElementById('chat-industry-filter').value;
    const jobTitleFilter = document.getElementById('chat-job-title-filter').value.toLowerCase();
    const items = chatUsers.getElementsByClassName('chat-user-item');
    
    Array.from(items).forEach(item => {
        const industry = item.dataset.industry;
        const jobTitle = item.dataset.jobTitle.toLowerCase();
        
        const industryMatch = !selectedIndustry || industry === selectedIndustry;
        const jobTitleMatch = !jobTitleFilter || jobTitle.includes(jobTitleFilter);
        
        item.style.display = industryMatch && jobTitleMatch ? 'block' : 'none';
    });
}

function selectChatUser(userId, personId, name) {
    currentChatUser = { userId, personId, name };
    
    // Update UI
    document.querySelectorAll('.chat-user-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    chatWithUser.textContent = `Chat with ${name}`;
    chatMessageInput.disabled = false;
    sendMessageBtn.disabled = false;
    
    // Load messages
    loadChatMessages();
}

// Update chat message display with read receipts
function displayMessage(message) {
    const div = document.createElement('div');
    div.className = `chat-message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    // Format timestamp
    const timestamp = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : '';
    
    // Add read receipt for sent messages
    const readStatus = message.senderId === currentUser.uid 
        ? `<div class="message-status ${message.read ? 'read' : 'sent'}">
            ${message.read ? '✓✓' : '✓'}
           </div>`
        : '';
    
    div.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-timestamp">${timestamp}</div>
        ${readStatus}
    `;
    
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Update sendMessage function to handle read receipts
async function sendMessage() {
    if (!currentChatUser || !chatMessageInput.value.trim()) return;
    
    const messageText = chatMessageInput.value.trim();
    if (messageText.length > 1000) {
        alert('Message is too long (max 1000 characters)');
        return;
    }
    
    const chatRoomId = [currentUser.uid, currentChatUser.userId].sort().join('_');
    const sendButton = document.getElementById('send-message-btn');
    
    try {
        setLoading(sendButton, true);
        sendButton.textContent = 'Sending...';
        
        const messageRef = await db.collection('chats')
            .doc(chatRoomId)
            .collection('messages')
            .add({
                text: messageText,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });
        
        // Set up read receipt listener
        db.collection('chats')
            .doc(chatRoomId)
            .collection('messages')
            .doc(messageRef.id)
            .onSnapshot(doc => {
                if (doc.exists && doc.data().read) {
                    // Update the message display to show read status
                    const messageElement = chatMessages.querySelector(`[data-message-id="${messageRef.id}"]`);
                    if (messageElement) {
                        const statusElement = messageElement.querySelector('.message-status');
                        if (statusElement) {
                            statusElement.classList.remove('sent');
                            statusElement.classList.add('read');
                            statusElement.textContent = '✓✓';
                        }
                    }
                }
            });
        
        chatMessageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    } finally {
        setLoading(sendButton, false);
        sendButton.textContent = 'Send';
    }
}

// Add event listener for Enter key in chat
chatMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 