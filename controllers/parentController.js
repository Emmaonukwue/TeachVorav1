const UserModel = require('../models/user');
const JobModel = require('../models/job');
const bcrypt = require('bcryptjs');   
const nodemailer = require('nodemailer');

// 1. Render the Parent/School Dashboard
exports.getDashboard = async (req, res) => {
    try {
        // DOUBLE-CHECK: Do we have a valid user?
        if (!req.session.user || !req.session.user.id) {
            console.error("Dashboard Error: No user ID found in session");
            return res.redirect('/login');
        }

        // Fetch all jobs submitted by this specific user
        const jobs = await JobModel.findByUserId(req.session.user.id);

        // Render the page with the jobs (or an empty array if none)
        res.render('pages/dashboard', { 
            user: req.session.user, 
            jobs: jobs || [] 
        });

    } catch (err) {
        console.error("Dashboard Error Details:", err.message);
        // Instead of crashing, render the dashboard with empty data
        res.render('pages/dashboard', { 
            user: req.session.user, 
            jobs: [] 
        });
    }
};

// 2. Submit a new Tutor Request
exports.submitRequest = async (req, res) => {
    try {
        const { 
            full_name, email, phone, // Account details
            subject, class_level, curriculum, location, 
            teaching_mode, schedule, start_date, budget, 
            teacher_requirements, additional_info, role // Job details + role
        } = req.body;

        // A. GENERATE A RANDOM PASSWORD
        const randomPassword = Math.random().toString(36).slice(-8); // 8 char string
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // B. CREATE THE USER ACCOUNT (Parent or School)
        const userId = await UserModel.create({
            role: role || 'parent',
            email: email,
            password_hash: hashedPassword,
            full_name: full_name,
            phone: phone
        });

        // C. CREATE THE JOB REQUEST using the new User ID
        await JobModel.create({
            user_id: userId,
            subject: subject,
            class_level: class_level,
            curriculum: curriculum,
            location: location,
            teaching_mode: teaching_mode,
            schedule: schedule,
            start_date: start_date,
            budget: budget,
            teacher_requirements: teacher_requirements,
            additional_info: additional_info
        });

        // ==========================================
        // D. SEND THE EMAIL (RESTORED)
        // ==========================================
        
        // 1. Configure the Email Transporter
        // IMPORTANT: Replace 'your-email@gmail.com' and 'your-app-password' with your real credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'onukwueemma@gmail.com',      // <--- CHANGE THIS
                pass: 'bfqo gfmc mfno vyru'  // <--- CHANGE THIS
            }
        });

        // 2. Define the Email Content
        const mailOptions = {
            from: '"TeachVora Support" <onukwueemma@gmail.com>', // <--- CHANGE THIS
            to: email,
            subject: 'Welcome to TeachVora! Your Account Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #0056D2;">Welcome to TeachVora!</h2>
                    <p>Hello <strong>${full_name}</strong>,</p>
                    <p>Your account has been successfully created. Your tutor request has been submitted for review.</p>
                    <p><strong>Your Login Credentials:</strong></p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Email (Username):</strong> ${email}</p>
                        <p><strong>Password:</strong> ${randomPassword}</p>
                    </div>
                    <p style="color: #dc3545; font-size: 0.9rem;"><strong>Important:</strong> For security reasons, please change your password immediately after logging in.</p>
                    <p>You can <a href="https://teachvora.com/login">log in</a> to your dashboard to track the status of your request at any time.</p>
                    <br>
                    <p>Best regards,<br>The TeachVora Team</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p style="font-size: 0.8rem; color: #666;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `
        };

        // 3. Send the Email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Error sending email:", error);
            } else {
                console.log("✅ Email sent successfully:", info.response);
            }
        });
        // ==========================================

        // E. LOG THE USER IN AUTOMATICALLY
        req.session.user = {
            id: userId,
            email: email,
            full_name: full_name,
            role: role || 'parent'
        };

        // F. FORCE THE SESSION TO SAVE BEFORE REDIRECTING
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).send('Error saving session');
            }
            // G. REDIRECT TO DASHBOARD (302 prevents form resubmission issues)
            res.redirect(302, '/parent/dashboard?msg=Account+created+and+request+submitted!+Check+your+email+for+login+credentials.');
        });

    } catch (err) {
        console.error("Full Error Details:", err); // Log the real error to your terminal
        
        // Check if it's a duplicate email error (MySQL error code 1062)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.render('pages/find-tutor', { 
                user: null, 
                error: 'This email is already registered. Please login or use a different email.',
            });
        }

        // Generic error fallback
        res.status(500).send('Error processing request. Please try again later.');
    }
};