const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.redirect('/login');
}

// Dashboard
router.get('/dashboard', isAdmin, adminController.getDashboard);

// View Single Teacher Profile
router.get('/teacher/:teacherId', isAdmin, adminController.viewTeacher);

// --- LIST PAGES ---
router.get('/teachers', isAdmin, adminController.listTeachers);
router.get('/jobs', isAdmin, adminController.listJobs);
router.get('/parents', isAdmin, adminController.listParents);
// ------------------

// Actions
router.post('/verify-teacher', isAdmin, adminController.verifyTeacher);
router.post('/publish-job', isAdmin, adminController.publishJob);

module.exports = router;