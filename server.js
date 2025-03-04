const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Sert les fichiers statiques (HTML, CSS, JS)

io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    socket.pseudo = 'Anonyme'; // Pseudo par défaut
    socket.profilePicUrl = '/uploads/default.png'; // Image par défaut

    // Gestion de l'arrivée d'un nouvel utilisateur
    socket.on('new-user', (userData) => {
        socket.pseudo = userData.pseudo || 'Anonyme';
        socket.profilePicUrl = userData.profilePicUrl || '/uploads/default.png';

        console.log(`${socket.pseudo} a rejoint le chat`);
        io.emit('system-message', `${socket.pseudo} a rejoint le chat !`);
    });

    // Gestion de l'envoi de messages
    socket.on('send-message', (message) => {
        if (message.trim() !== '') {
            io.emit('message', {
                pseudo: socket.pseudo,
                message: message,
                profilePicUrl: socket.profilePicUrl
            });
        }
    });

    // Lorsque le serveur reçoit un changement de fond
    socket.on('change-bg', (bgClass) => {
        io.emit('change-bg', bgClass); // Diffuse à tous les utilisateurs
    });

    let currentBackground = '/uploads/default-background.jpg'; // Valeur par défaut

    // Envoi de l'image de fond actuelle au nouvel utilisateur
    socket.emit('background-changed', { backgroundUrl: currentBackground });

    // Gestion du changement de fond d'écran
    socket.on('background-changed', (data) => {
        currentBackground = data.backgroundUrl;
        io.emit('background-changed', { backgroundUrl: currentBackground });
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        console.log(`${socket.pseudo} s'est déconnecté`);
        io.emit('system-message', `${socket.pseudo} a quitté le chat.`);
    });
});

// Configuration de l'upload de fichier
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

app.post('/upload', upload.single('profilePic'), (req, res) => {
    const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/default.jpg';
    res.json({ profilePicUrl });
});

// Configuration de l'upload de l'image de fond
app.post('/upload-background', upload.single('background'), (req, res) => {
    const backgroundUrl = req.file ? `/uploads/${req.file.filename}` : null;
    res.json({ backgroundUrl });
});

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});