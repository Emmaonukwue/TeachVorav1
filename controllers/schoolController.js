const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    const [jobs] = await db.execute('SELECT * FROM jobs WHERE user_id = ?', [req.session.user.id]);
    res.render('pages/school-dashboard', { user: req.session.user, jobs });
};

exports.submitRequest = async (req, res) => {
    const {
        subject, class_level, curriculum, location, teaching_mode,
        schedule, start_date, budget, teacher_requirements, additional_info
    } = req.body;

    try {
        await db.execute(
            `INSERT INTO jobs (user_id, status, subject, class_level, curriculum, location, 
                               teaching_mode, schedule, start_date, budget, teacher_requirements, additional_info)
             VALUES (?, 'pending_review', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.session.user.id, subject, class_level, curriculum, location, teaching_mode, 
             schedule, start_date, budget, teacher_requirements, additional_info]
        );
        res.redirect('/school/dashboard?msg=Request+submitted+for+review');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting request');
    }
};