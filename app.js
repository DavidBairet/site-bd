require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connecté');
    })
    .catch((err) => {
        console.error('Erreur MongoDB :', err);
    });

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Accueil
app.get('/', (req, res) => {
    res.render('index');
});
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Site BD lancé sur http://localhost:${PORT}`);
});