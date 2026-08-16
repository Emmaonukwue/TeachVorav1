const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

// Middleware to ensure only parents/schools can access
function isParent(req, res, next) {
    if (req.session.user && (req.session.user.role === 'parent' || req.session.user.role === 'school')) {
        return next();
    }
    res.redirect('/login');
}

router.get('/dashboard', isParent, parentController.getDashboard);
router.post('/submit-request', isParent, parentController.submitRequest);

module.exports = router;