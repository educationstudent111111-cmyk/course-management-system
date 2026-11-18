-- CR-008: Add indexes for server-side filtering, joins and sorting.
-- The migration is safe to run repeatedly.

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_enrollment_indexes //

CREATE PROCEDURE migrate_enrollment_indexes()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND INDEX_NAME = 'idx_users_full_name'
    ) THEN
        CREATE INDEX idx_users_full_name ON users(full_name);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND INDEX_NAME = 'idx_enrollments_course_id'
    ) THEN
        CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND INDEX_NAME = 'idx_enrollments_enrolled_at'
    ) THEN
        CREATE INDEX idx_enrollments_enrolled_at ON enrollments(enrolled_at);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'enrollments'
          AND INDEX_NAME = 'idx_enrollments_course_date'
    ) THEN
        CREATE INDEX idx_enrollments_course_date
            ON enrollments(course_id, enrolled_at);
    END IF;
END //

CALL migrate_enrollment_indexes() //
DROP PROCEDURE migrate_enrollment_indexes //

DELIMITER ;
