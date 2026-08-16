const UserModel = require('../models/user');
const TeacherModel = require('../models/teacher');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    res.render('pages/login', { user: req.session.user || null, error: null, query: req.query });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.render('pages/login', { user: null, error: 'Invalid email or password', query: req.query });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.render('pages/login', { user: null, error: 'Invalid email or password', query: req.query });
        }

        if (user.role === 'teacher') {
            const profile = await TeacherModel.findByUserId(user.id);
            if (profile && profile.status === 'rejected') {
                return res.render('pages/login', { user: null, error: 'Your account has been rejected.', query: req.query });
            }
            if (profile && profile.status === 'pending') {
                return res.render('pages/login', { user: null, error: 'Your account is pending admin verification.', query: req.query });
            }
        }

        req.session.user = { id: user.id, email: user.email, full_name: user.full_name, role: user.role };

        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        if (user.role === 'teacher') return res.redirect('/teacher/dashboard');
        if (user.role === 'parent' || user.role === 'school') return res.redirect('/parent/dashboard');

    } catch (err) {
        console.error(err);
        res.render('pages/login', { user: null, error: 'Server error', query: req.query });
    }
};

exports.postRegister = async (req, res) => {
    const { full_name, email, phone, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({ role, email, password_hash: hashedPassword, full_name, phone });
        res.redirect('/login?msg=Account+created+successfully');
    } catch (err) {
        console.error(err);
        res.render('pages/login', { user: null, error: 'Email may already exist.', query: req.query });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect('/'));
};