CREATE DATABASE teachvora_db;
USE teachvora_db;

-- Users Table (Polymorphic: Parent, School, Teacher)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('parent', 'school', 'teacher', 'admin') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher Profiles (Private, linked to user_id)
CREATE TABLE teacher_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    status ENUM('pending', 'under_review', 'verified', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    qualifications TEXT,
    experience TEXT,
    subjects TEXT,
    class_levels TEXT, -- EYFS, KS2, etc.
    curriculum TEXT, -- WAEC, NECO, IB, etc.
    teaching_mode ENUM('online', 'physical', 'hybrid'),
    state_area VARCHAR(100),
    expected_rate DECIMAL(10,2),
    availability TEXT,
    cv_path VARCHAR(255),
    cert_path VARCHAR(255),
    id_path VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Jobs (Requests from Parents/Schools)
CREATE TABLE jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- The parent/school who requested
    status ENUM('pending_review', 'approved', 'published', 'matched', 'completed') DEFAULT 'pending_review',
    subject VARCHAR(100),
    class_level VARCHAR(50),
    curriculum VARCHAR(50),
    location VARCHAR(100), -- General area only (for public)
    teaching_mode ENUM('online', 'physical', 'hybrid'),
    schedule TEXT,
    start_date DATE,
    budget DECIMAL(10,2),
    teacher_requirements TEXT, -- Mandatory/Optional degrees
    additional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Job Enquiries (Teachers expressing interest)
CREATE TABLE enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    teacher_id INT,
    message TEXT,
    status ENUM('pending', 'contacted', 'matched') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Audit Logs (For Admin Security)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    action VARCHAR(255),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);