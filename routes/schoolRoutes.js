const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');

function isSchool(req, res, next) {
    if (req.session.user && req.session.user.role === 'school') {
        return next();
    }
    res.redirect('/login');
}

router.get('/dashboard', isSchool, schoolController.getDashboard);
router.post('/submit-request', isSchool, schoolController.submitRequest);

module.exports = router;