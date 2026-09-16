require('dotenv').config();

const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const adminRoutes = require('./routes/admin');
const Comic = require('./models/Comic');
const Artwork = require('./models/Artwork');
const Profile = require('./models/Profile');

const app = express();
const PORT = process.env.PORT || 3000;


// =========================
// CONNEXION MONGODB
// =========================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connecté');
    })
    .catch((error) => {
        console.error('❌ Erreur MongoDB :', error);
    });


// =========================
// CONFIGURATION EJS
// =========================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// =========================
// MIDDLEWARES
// =========================

app.use(express.urlencoded({ extended: true }));


// =========================
// SESSIONS ADMIN
// =========================

app.use(session({
    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),

    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));


// =========================
// FICHIERS STATIQUES
// =========================

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// =========================
// ACCUEIL
// =========================

app.get('/', async (req, res) => {

    try {

       const comics = await Comic.find({
    published: true
}).sort({
    createdAt: -1
});


const artworks = await Artwork.find({
    published: true
}).sort({
    createdAt: -1
});


const profile = await Profile.findOne();


res.render('index', {
    comics,
    artworks,
    profile
});

    } catch (error) {

        console.error(
            'Erreur lors du chargement de la page d’accueil :',
            error
        );

        res.status(500).send(
            'Erreur lors du chargement de la page'
        );
    }

});


// =========================
// PAGES LÉGALES
// =========================

app.get('/mentions-legales', (req, res) => {

    res.render('mentions-legales');

});


app.get('/confidentialite', (req, res) => {

    res.render('confidentialite');

});


// =========================
// ADMINISTRATION
// =========================

app.use('/admin', adminRoutes);


// =========================
// PAGE 404
// =========================

app.use((req, res) => {

    res.status(404).send(
        'Page introuvable'
    );

});


// =========================
// DÉMARRAGE DU SERVEUR
// =========================

app.listen(PORT, () => {

    console.log(
        `🚀 Portfolio lancé sur http://localhost:${PORT}`
    );

});