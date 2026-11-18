CREATE DATABASE IF NOT EXISTS course_management;

USE course_management;


-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    full_name VARCHAR(100) NOT NULL,

    role ENUM('admin', 'student') NOT NULL,

    -- CR-008: Student name and username search
    INDEX idx_users_full_name (full_name),
    INDEX idx_users_username (username)
);


-- =====================================================
-- COURSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(100) NOT NULL,

    category VARCHAR(50) NOT NULL,

    level VARCHAR(30) NOT NULL,

    duration VARCHAR(30) NOT NULL,

    price DECIMAL(10, 2) NOT NULL,

    image VARCHAR(500),

    description TEXT,

    -- CR-007
    -- NULL = Unlimited
    max_students INT NULL,

    -- Maximum students must be positive when provided
    CONSTRAINT chk_courses_max_students
        CHECK (
            max_students IS NULL
            OR max_students > 0
        )
);


-- =====================================================
-- ENROLLMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    course_id INT NOT NULL,

    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('pending', 'approved', 'rejected')
        NOT NULL DEFAULT 'pending',

    reviewed_by INT NULL,

    reviewed_at TIMESTAMP NULL,

    decision_note TEXT NULL,

    -- One enrollment request per student/course. A rejected request may be
    -- resubmitted by returning the existing row to pending.
    UNIQUE (student_id, course_id),

    -- Student account
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Course
    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- CR-008: Indexes for course/date filtering and sorting
    INDEX idx_enrollments_course_id (course_id),
    INDEX idx_enrollments_enrolled_at (enrolled_at),
    INDEX idx_enrollments_course_date (course_id, enrolled_at),
    INDEX idx_enrollments_status_course (status, course_id)
);


-- =====================================================
-- ADMINISTRATIVE AUDIT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    actor_username VARCHAR(50) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NULL,
    previous_data JSON NULL,
    new_data JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_actor
        FOREIGN KEY (actor_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_actor (actor_id, actor_username),
    INDEX idx_audit_logs_created_at (created_at)
);