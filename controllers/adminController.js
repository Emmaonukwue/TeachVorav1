const UserModel = require('../models/user');
const JobModel = require('../models/job');
const TeacherModel = require('../models/teacher');
const AuditModel = require('../models/audit');

// 1. Render the Admin Dashboard
exports.getDashboard = async (req, res) => {
    try {
        // 1. Get ALL raw data from the models
        const allTeachers = await TeacherModel.getAll();
        const allJobs = await JobModel.getAll();

        // 2. Calculate stats directly from the raw arrays
        const totalTeachers = allTeachers ? allTeachers.length : 0;
        const verifiedTeachers = allTeachers ? allTeachers.filter(t => t.status === 'verified').length : 0;
        const pendingTeachers = allTeachers ? allTeachers.filter(t => t.status === 'pending').length : 0;
        
        const activeJobs = allJobs ? allJobs.filter(j => j.status === 'published').length : 0;
        const pendingRequests = allJobs ? allJobs.filter(j => j.status === 'pending_review').length : 0;

        // 3. Package the stats
        const stats = { 
            total_teachers: totalTeachers, 
            verified_teachers: verifiedTeachers, 
            pending_teachers: pendingTeachers, 
            active_jobs: activeJobs, 
            pending_requests: pendingRequests 
        };

        // 4. Fetch Pending Lists for the bottom section
        const pendingTeachersList = await TeacherModel.getPending() || [];
        const pendingJobsList = await JobModel.getPendingJobs() || [];

        console.log("DEBUG: Rendering Dashboard with Stats:", stats);

        // 5. Render the page
        res.render('pages/admin-dashboard', { 
            user: req.session.user, 
            stats: stats, 
            pendingTeachers: pendingTeachersList,
            pendingJobs: pendingJobsList
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.render('pages/admin-dashboard', { 
            user: req.session.user, 
            stats: { total_teachers:0, verified_teachers:0, pending_teachers:0, active_jobs:0, pending_requests:0 }, 
            pendingTeachers: [],
            pendingJobs: []
        });
    }
};

// 2. View Full Teacher Profile
exports.viewTeacher = async (req, res) => {
    const { teacherId } = req.params;
    try {
        const teacher = await TeacherModel.getFullProfile(teacherId);
        if (!teacher) return res.status(404).send('Teacher not found');

        res.render('pages/admin-view-teacher', { 
            user: req.session.user, 
            teacher 
        });
    } catch (err) {
        console.error("View Teacher Error:", err);
        res.status(500).send('Error loading teacher profile');
    }
};

// 3. List All Teachers
exports.listTeachers = async (req, res) => {
    try {
        const { status } = req.query;
        const records = await TeacherModel.getAll(status);
        const pageTitle = status ? `${status.charAt(0).toUpperCase() + status.slice(1)} Teachers` : 'All Teachers';
        
        res.render('pages/admin-list', { 
            user: req.session.user, 
            records, 
            pageTitle, 
            currentPage: 'teachers',
            type: 'teachers'
        });
    } catch (err) {
        console.error("List Teachers Error:", err);
        res.status(500).send('Error loading teachers');
    }
};

// 4. List All Jobs
exports.listJobs = async (req, res) => {
    try {
        const { status } = req.query;
        const records = await JobModel.getAll(status);
        const pageTitle = status ? `${status.replace('_', ' ').toUpperCase()} Jobs` : 'All Job Requests';
        
        res.render('pages/admin-list', { 
            user: req.session.user, 
            records, 
            pageTitle, 
            currentPage: 'jobs',
            type: 'jobs'
        });
    } catch (err) {
        console.error("List Jobs Error:", err);
        res.status(500).send('Error loading jobs');
    }
};

// 5. List All Parents & Schools
exports.listParents = async (req, res) => {
    try {
        const records = await UserModel.getAllParents();
        res.render('pages/admin-list', { 
            user: req.session.user, 
            records, 
            pageTitle: 'Parents & Schools', 
            currentPage: 'parents',
            type: 'parents'
        });
    } catch (err) {
        console.error("List Parents Error:", err);
        res.status(500).send('Error loading parents');
    }
};

// 6. Verify Teacher (Approve or Reject)
exports.verifyTeacher = async (req, res) => {
    const { teacherId, action } = req.body;
    try {
        const newStatus = action === 'approve' ? 'verified' : 'rejected';
        await TeacherModel.updateStatus(teacherId, newStatus);
        await AuditModel.log(req.session.user.id, `Teacher ${action}ed`, teacherId);

        // Inside exports.verifyTeacher, right before res.redirect('/admin/dashboard');

        // ... (after updating the status in the database) ...

        // Fetch the teacher's email so we can notify them
        const [teacherData] = await db.execute('SELECT email, full_name FROM users WHERE id = ?', [teacherId]);
        if (teacherData.length > 0) {
            const teacher = teacherData[0];
            
            // Configure email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'onukwueemma@gmail.com',
                    pass: 'bfqo gfmc mfno vyru'
                }
            });

            const statusMessage = newStatus === 'verified' 
                ? 'Congratulations! Your TeachVora profile has been <strong>VERIFIED</strong>. You can now log in and apply for jobs.'
                : 'Unfortunately, your TeachVora profile has been rejected. Please contact support for more information.';

            const mailOptions = {
                from: '"TeachVora Admin" <no-reply@teachvora.com>',
                to: teacher.email,
                subject: `TeachVora Profile ${newStatus === 'verified' ? 'Verified' : 'Rejected'}`,
                html: `
                    <h3>Hello ${teacher.full_name},</h3>
                    <p>${statusMessage}</p>
                    <p><a href="https://teachvora.com/login">Log in to your dashboard</a> to view your status.</p>
                `
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) console.error("Admin approval email failed:", error);
            });
}
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Verify Teacher Error:", err);
        res.status(500).send('Error verifying teacher');
    }
};

// 7. Publish a Job Request
exports.publishJob = async (req, res) => {
    const { jobId } = req.body;
    try {
        await JobModel.publish(jobId);
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Publish Job Error:", err);
        res.status(500).send('Error publishing job');
    }
};

// View Enquiries for a specific Job (Admin Manual Review)
exports.viewJobEnquiries = async (req, res) => {
    const { jobId } = req.params;
    try {
        // 1. Get the Job details
        const db = require('../config/db');
        const [jobRows] = await db.execute('SELECT * FROM jobs WHERE id = ?', [jobId]);
        const job = jobRows[0];

        if (!job) return res.status(404).send('Job not found');

        // 2. Get all teachers who enquired for this job
        const enquiries = await JobModel.getEnquiriesForJob(jobId);

        res.render('pages/admin-job-enquiries', { 
            user: req.session.user, 
            job: job,
            enquiries: enquiries || []
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading enquiries');
    }
};

// Manually Match a Teacher to a Job (Admin WhatsApp action)
exports.matchTeacher = async (req, res) => {
    const { jobId, teacherId } = req.body;
    try {
        const db = require('../config/db');

        // 1. Update the job status to 'matched'
        await db.execute('UPDATE jobs SET status = "matched" WHERE id = ?', [jobId]);

        // 2. Update the specific enquiry to 'matched'
        await db.execute('UPDATE enquiries SET status = "matched" WHERE job_id = ? AND teacher_id = ?', [jobId, teacherId]);

        // 3. Log the audit
        await db.execute('INSERT INTO audit_logs (admin_id, action, target_id) VALUES (?, ?, ?)', 
            [req.session.user.id, `Matched Job ${jobId} to Teacher ${teacherId}`, jobId]);

        res.redirect('/admin/dashboard?msg=Teacher+successfully+matched!+Contact+them+via+WhatsApp.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error matching teacher');
    }
};