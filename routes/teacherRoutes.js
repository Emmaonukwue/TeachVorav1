const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

function isTeacher(req, res, next) {
    if (req.session.user && req.session.user.role === 'teacher') return next();
    res.redirect('/login');
}

router.get('/register', (req, res) => {
    res.render('pages/teacher-register', { user: req.session.user || null });
});

router.post('/register', upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'certificates', maxCount: 1 },
    { name: 'identification', maxCount: 1 }
]), teacherController.registerTeacher);

router.get('/dashboard', isTeacher, teacherController.getDashboard);
router.get('/jobs', isTeacher, teacherController.viewJobs);

// THIS LINE MUST MATCH THE CONTROLLER FUNCTION
router.post('/enquire', isTeacher, teacherController.enquireJob); 

module.exports = router;