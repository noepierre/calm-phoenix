const socket = io();

// Sélectionner les éléments du DOM
const pseudoContainer = document.getElementById('pseudo-container');
const chatContainer = document.getElementById('chat-container');
const pseudoInput = document.getElementById('pseudo-input');
const joinChatButton = document.getElementById('join-chat');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message');
const messagesDiv = document.getElementById('messages');

// Gestion du choix du pseudo
joinChatButton.addEventListener('click', () => {
    const pseudo = pseudoInput.value.trim();
    const fileInput = document.getElementById('profile-pic-input');
    const file = fileInput.files[0];

    if (pseudo) {
        const formData = new FormData();
        formData.append('pseudo', pseudo);
        if (file) {
            formData.append('profilePic', file);
        }

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            const profilePicUrl = data.profilePicUrl || '/uploads/default.jpg';

            localStorage.setItem('pseudo', pseudo);
            localStorage.setItem('profilePicUrl', profilePicUrl);

            socket.emit('new-user', { pseudo, profilePicUrl });
            pseudoContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
        })
        .catch(err => console.error('Erreur lors de l’envoi du fichier :', err));
    } else {
        alert('Veuillez entrer un pseudo.');
    }
});

// Envoi du message quand l'utilisateur appuie sur Entrée
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Envoi du message avec le bouton
sendMessageButton.addEventListener('click', sendMessage);

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('send-message', message);
        messageInput.value = ''; // Vide le champ de saisie
    }
}

// Réception des messages
socket.on('message', (data) => {
    const { pseudo, message, profilePicUrl } = data;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const isMine = pseudo === localStorage.getItem('pseudo');
    if (isMine) {
        messageDiv.classList.add('my-message');
    }

    const img = document.createElement('img');
    img.src = profilePicUrl || '/uploads/default.jpg';
    img.classList.add('profile-pic');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    const pseudoSpan = document.createElement('span');
    pseudoSpan.classList.add('pseudo');
    pseudoSpan.textContent = isMine ? "Moi" : pseudo;

    const messageSpan = document.createElement('span');
    messageSpan.classList.add('text');
    messageSpan.textContent = message;

    contentDiv.appendChild(pseudoSpan);
    contentDiv.appendChild(messageSpan);

    messageDiv.appendChild(img);
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Réception des messages système
socket.on('system-message', (message) => {
    const systemMessageDiv = document.createElement('div');
    systemMessageDiv.classList.add('system-message');
    systemMessageDiv.textContent = message;

    messagesDiv.appendChild(systemMessageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('background-changed', (data) => {
    const backgroundUrl = data.backgroundUrl;
    chatContainer.style.backgroundImage = `url(${backgroundUrl})`;
    chatContainer.style.backgroundSize = 'cover';
    chatContainer.style.backgroundPosition = 'center center';
});

const backgroundInput = document.getElementById('background-input');
const changeBackgroundButton = document.getElementById('change-background-button');

// Envoi de l'image de fond au serveur lorsque l'utilisateur clique sur le bouton
changeBackgroundButton.addEventListener('click', () => {
    const file = backgroundInput.files[0];
    
    if (file) {
        const formData = new FormData();
        formData.append('background', file);

        fetch('/upload-background', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            const backgroundUrl = data.backgroundUrl;
            // Envoyer à tous les clients la nouvelle URL de l'image de fond
            socket.emit('background-changed', { backgroundUrl });
        })
        .catch(err => console.error('Erreur lors de l’envoi du fichier :', err));
    } else {
        alert('Veuillez choisir une image.');
    }
});
