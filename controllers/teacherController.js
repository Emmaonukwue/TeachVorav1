const UserModel = require('../models/user');
const TeacherModel = require('../models/teacher');
const JobModel = require('../models/job');
const bcrypt = require('bcryptjs');

// Register a new Teacher
exports.registerTeacher = async (req, res) => {
    const { 
        full_name, email, phone, password, qualifications, experience, subjects, 
        class_levels, curriculum, teaching_mode, state_area, expected_rate, availability 
    } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await UserModel.create({ role: 'teacher', email, password_hash: hashedPassword, full_name, phone });

        const cvPath = req.files?.cv?.[0]?.path || null;
        const certPath = req.files?.certificates?.[0]?.path || null;
        const idPath = req.files?.identification?.[0]?.path || null;

        await TeacherModel.createProfile({ 
            user_id: userId, qualifications, experience, subjects, class_levels, curriculum, 
            teaching_mode, state_area, expected_rate, availability, 
            cv_path: cvPath, cert_path: certPath, id_path: idPath 
        });

        res.redirect('/login?msg=Registration+Complete.+Awaiting+Admin+Verification');
    } catch (err) {
        console.error(err);
        res.status(500).send('Registration error');
    }
};

// Teacher Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const profile = await TeacherModel.findByUserId(req.session.user.id);
        res.render('pages/teacher-dashboard', { user: req.session.user, profile: profile || null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dashboard error');
    }
};

// View Jobs Board
exports.viewJobs = async (req, res) => {
    try {
        const jobs = await JobModel.getPublishedJobs();
        res.render('pages/jobs-board', { user: req.session.user, jobs: jobs || [] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading jobs');
    }
};

// --- THIS WAS MISSING AND CAUSING THE CRASH ---
// Enquire About a Job
exports.enquireJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const teacherId = req.session.user.id;
        
        // Check if already enquired
        const db = require('../config/db');
        const [existing] = await db.execute(
            'SELECT * FROM enquiries WHERE job_id = ? AND teacher_id = ?',
            [jobId, teacherId]
        );
        
        if (existing.length > 0) {
            return res.redirect('/teacher/jobs?msg=You+have+already+enquired+about+this+job');
        }

        await db.execute(
            'INSERT INTO enquiries (job_id, teacher_id, status) VALUES (?, ?, "pending")',
            [jobId, teacherId]
        );
        
        res.redirect('/teacher/dashboard?msg=Enquiry+Sent.+Check+WhatsApp+for+updates');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting enquiry');
    }
};
// -------------------------------------------------