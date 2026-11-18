GET    /api/courses
GET    /api/courses/:id

POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id

POST   /api/enrollments
GET    /api/enrollments/my
GET    /api/enrollments
GET    /api/enrollments/course/:courseId
PATCH  /api/enrollments/:id/status  (admin only; approve or reject)
DELETE /api/enrollments/:id

GET    /api/users/username/:username
GET    /api/users/:id
GET    /api/users/me
PUT    /api/users/me
PUT    /api/users/me/password

The profile endpoints return only safe user fields. Password changes require the
current password, a matching new-password confirmation, and a new password of
8-72 UTF-8 bytes. After five incorrect current-password attempts, further
attempts for that account are blocked for 15 minutes within the running server
process. User lookups by ID or username are restricted to the account owner and
administrators.

Reporting endpoints:

GET    /api/reports/overview  (admin only)
GET    /api/reports/my        (student only; authenticated student's data only)

Enrollment requests start as `pending`; only `approved` rows count toward
course capacity and confirmed-enrollment reports. Admins may approve or reject
pending requests, and a rejection requires a reason. Students may cancel only
their pending requests. Rejected requests may be resubmitted, which reuses the
existing student/course row and clears the previous decision.

Reports count approved enrollments separately from pending requests. Existing
databases should apply `migrations/003_enrollment_approval.sql` after selecting
the `course_management` database. The migration adds the review fields,
converts existing rows to `approved`, and sets `pending` as the default for new
rows.
