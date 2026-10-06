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

    role ENUM('admin', 'student') NOT NULL
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

    -- A student cannot enroll in the same course twice
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
        ON UPDATE CASCADE
);