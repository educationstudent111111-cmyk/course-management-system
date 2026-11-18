-- CR-011: Add enrollment review workflow.
-- Existing rows are treated as approved to preserve current enrollments.
-- Safe to run repeatedly against databases with or without these columns.

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_enrollment_approval //

CREATE PROCEDURE migrate_enrollment_approval()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND COLUMN_NAME = 'status'
    ) THEN
        ALTER TABLE enrollments
            ADD COLUMN status ENUM('pending', 'approved', 'rejected')
                NOT NULL DEFAULT 'approved';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND COLUMN_NAME = 'reviewed_by'
    ) THEN
        ALTER TABLE enrollments
            ADD COLUMN reviewed_by INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND COLUMN_NAME = 'reviewed_at'
    ) THEN
        ALTER TABLE enrollments
            ADD COLUMN reviewed_at TIMESTAMP NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND COLUMN_NAME = 'decision_note'
    ) THEN
        ALTER TABLE enrollments
            ADD COLUMN decision_note TEXT NULL;
    END IF;

    UPDATE enrollments
    SET status = 'approved'
    WHERE status IS NULL;

    ALTER TABLE enrollments
        MODIFY COLUMN status ENUM('pending', 'approved', 'rejected')
            NOT NULL DEFAULT 'pending';

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND INDEX_NAME = 'idx_enrollments_status_course'
    ) THEN
        CREATE INDEX idx_enrollments_status_course
            ON enrollments(status, course_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND CONSTRAINT_NAME = 'fk_enrollments_reviewed_by'
    ) THEN
        ALTER TABLE enrollments
            ADD CONSTRAINT fk_enrollments_reviewed_by
            FOREIGN KEY (reviewed_by) REFERENCES users(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END //

CALL migrate_enrollment_approval() //
DROP PROCEDURE migrate_enrollment_approval //

DELIMITER ;
