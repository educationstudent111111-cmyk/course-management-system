-- CR-007: Add optional course capacity.
-- Existing courses receive NULL, which preserves unlimited capacity.

DELIMITER //

DROP PROCEDURE IF EXISTS migrate_course_capacity //

CREATE PROCEDURE migrate_course_capacity()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'courses'
          AND COLUMN_NAME = 'max_students'
    ) THEN
        ALTER TABLE courses
            ADD COLUMN max_students INT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'courses'
          AND CONSTRAINT_NAME = 'chk_courses_max_students'
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT chk_courses_max_students
            CHECK (
                max_students IS NULL
                OR max_students > 0
            );
    END IF;
END //

CALL migrate_course_capacity() //
DROP PROCEDURE migrate_course_capacity //

DELIMITER ;
