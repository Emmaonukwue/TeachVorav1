const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const db = require('./config/db');

// --- MIDDLEWARE SECTION ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Allow the browser to view uploaded files (CVs, Certificates, IDs)
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// SESSION
app.use(session({
    secret: process.env.SESSION_SECRET || 'teachvora_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/authRoutes');
const parentRoutes = require('./routes/parentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const schoolRoutes = require('./routes/schoolRoutes');

// --- USE ROUTES ---
app.use('/', authRoutes);
app.use('/parent', parentRoutes);
app.use('/teacher', teacherRoutes);
app.use('/admin', adminRoutes);
app.use('/school', schoolRoutes);

// --- PUBLIC PAGES (User defined globally to prevent crashes) ---
app.get('/', (req, res) => {
    res.render('pages/index', { user: req.session.user || null });
});

app.get('/find-tutor', (req, res) => {
    res.render('pages/find-tutor', { user: req.session.user || null });
});

app.get('/how-it-works', (req, res) => {
    res.render('pages/placeholder', { user: req.session.user || null, page: 'How It Works' });
});

app.get('/about', (req, res) => {
    res.render('pages/placeholder', { user: req.session.user || null, page: 'About Us' });
});

app.get('/contact', (req, res) => {
    res.render('pages/placeholder', { user: req.session.user || null, page: 'Contact Us' });
});

// --- JOBS BOARD (Database connection now works because of your fix!) ---
app.get('/jobs-board', async (req, res) => {
    try {
        const [jobs] = await db.execute(
            `SELECT id, subject, class_level, curriculum, location, teaching_mode, schedule, start_date 
             FROM jobs WHERE status = 'published'`
        );
        res.render('pages/jobs-board', { user: req.session.user || null, jobs: jobs || [] });
    } catch (err) {
        console.error(err);
        res.render('pages/jobs-board', { user: req.session.user || null, jobs: [] });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ TeachVora running on port ${PORT}`);
});