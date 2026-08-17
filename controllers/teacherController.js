const UserModel = require('../models/user');
const TeacherModel = require('../models/teacher');
const JobModel = require('../models/job');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Register a new Teacher
exports.registerTeacher = async (req, res) => {
    const { 
        full_name, email, phone, password, qualifications, experience, subjects, 
        class_levels, curriculum, teaching_mode, state_area, expected_rate, availability 
    } = req.body;
    
    try {
        // A. HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // B. CREATE THE USER
        const userId = await UserModel.create({ 
            role: 'teacher', 
            email, 
            password_hash: hashedPassword, 
            full_name, 
            phone 
        });

        // C. HANDLE FILE UPLOADS
        const cvPath = req.files?.cv?.[0]?.path || null;
        const certPath = req.files?.certificates?.[0]?.path || null;
        const idPath = req.files?.identification?.[0]?.path || null;

        // D. CREATE THE TEACHER PROFILE
        await TeacherModel.createProfile({ 
            user_id: userId, 
            qualifications, 
            experience, 
            subjects, 
            class_levels, 
            curriculum, 
            teaching_mode, 
            state_area, 
            expected_rate, 
            availability, 
            cv_path: cvPath, 
            cert_path: certPath, 
            id_path: idPath 
        });

        // ==========================================
        // E. SEND THE WELCOME EMAIL
        // ==========================================
        
        // 1. Configure the Email Transporter
        // IMPORTANT: Replace with your real Gmail credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'onukwueemma@gmail.com',      // <--- CHANGE THIS
                pass: 'bfqo gfmc mfno vyru'  // <--- CHANGE THIS
            }
        });

        // 2. Define the Email Content
        const mailOptions = {
            from: '"TeachVora Support" <no-reply@teachvora.com>', // <--- CHANGE THIS
            to: email,
            subject: 'Welcome to TeachVora! Your Registration is Pending',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #0056D2;">Welcome to the TeachVora Teacher Network!</h2>
                    <p>Hello <strong>${full_name}</strong>,</p>
                    <p>Thank you for registering with TeachVora. Your application has been submitted successfully!</p>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4 style="margin: 0; color: #856404;">⏳ Application Status: Pending Review</h4>
                        <p style="margin: 5px 0 0 0; font-size: 0.95rem;">Your qualifications and documents are currently being reviewed by our admin team.</p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>You will receive a <strong>second email</strong> once your profile has been verified.</li>
                        <li>Once verified, you will be able to log in and view the Job Board.</li>
                        <li>You can track your status by attempting to log in at any time.</li>
                    </ul>
                    
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 0.9rem; color: #666;">If you have any questions, please contact our support team via the Contact Us page.</p>
                    <br>
                    <p>Best regards,<br>The TeachVora Team</p>
                </div>
            `
        };

        // 3. Send the Email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Error sending teacher email:", error);
            } else {
                console.log("✅ Teacher welcome email sent successfully:", info.response);
            }
        });
        // ==========================================

        // F. REDIRECT TO LOGIN PAGE
        res.redirect('/login?msg=Registration+Complete.+Awaiting+Admin+Verification.+Check+your+email+for+confirmation.');

    } catch (err) {
        console.error("Teacher Registration Error:", err);
        res.status(500).send('Registration error. Email may already be in use.');
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

// Enquire About a Job
exports.enquireJob = async (req, res) => {
    try {
        const { jobId } = req.body;
        const teacherId = req.session.user.id;
        
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