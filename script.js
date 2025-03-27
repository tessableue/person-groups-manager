// Firebase configuration is now loaded from config.js
const firebaseConfig = window.firebaseConfig;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let selectedPerson = null;
let currentChatUser = null;
let chatListener = null;

// DOM Elements
const appContainer = document.getElementById('app-container');
const authContainer = document.getElementById('auth-container');
const userEmailElement = document.getElementById('user-email');
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
    document.getElementById('login-form').classList.toggle('hidden', form === 'register');
    document.getElementById('register-form').classList.toggle('hidden', form === 'login');
}

async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        await saveUserData();
        showApp();
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        await loadUserData();
        showApp();
    } catch (error) {
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
        alert('Logout failed: ' + error.message);
    }
}

// UI Functions
function showApp() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userEmailElement.textContent = currentUser.email;
    loadPeople();
    loadGroups();
    loadChatUsers();
}

function showAuth() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.querySelector(`.tab-button[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.remove('hidden');
}

// People Functions
async function addPerson() {
    const nameInput = document.getElementById('person-name');
    const linkedinInput = document.getElementById('person-linkedin');
    const jobTitleInput = document.getElementById('person-job-title');
    const industryInput = document.getElementById('person-industry');
    
    const name = nameInput.value.trim();
    const linkedin = linkedinInput.value.trim();
    const jobTitle = jobTitleInput.value.trim();
    const industry = industryInput.value;
    
    if (!name) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('people').add({
                name: name,
                linkedin: linkedin || null,
                jobTitle: jobTitle || null,
                industry: industry || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        nameInput.value = '';
        linkedinInput.value = '';
        jobTitleInput.value = '';
        industryInput.value = '';
        loadPeople();
    } catch (error) {
        console.error('Error adding person:', error);
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
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('people').doc(personId).delete();
        loadPeople();
    } catch (error) {
        console.error('Error deleting person:', error);
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
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('groups').doc(groupId).delete();
        loadGroups();
    } catch (error) {
        console.error('Error deleting group:', error);
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
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            // Load any additional user data if needed
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

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

async function loadChatMessages() {
    if (!currentChatUser) return;
    
    // Clear existing messages
    chatMessages.innerHTML = '';
    
    // Remove existing listener if any
    if (chatListener) {
        chatListener();
    }
    
    // Create chat room ID
    const chatRoomId = [currentUser.uid, currentChatUser.userId].sort().join('_');
    
    // Listen for new messages
    chatListener = db.collection('chats')
        .doc(chatRoomId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    displayMessage(message);
                }
            });
        });
}

function displayMessage(message) {
    const div = document.createElement('div');
    div.className = `chat-message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    div.textContent = message.text;
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
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        chatMessageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Add event listener for Enter key in chat
chatMessageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 