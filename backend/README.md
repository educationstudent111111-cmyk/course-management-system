GET    /api/courses
GET    /api/courses/:id

POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id

POST   /api/enrollments
GET    /api/enrollments/my
GET    /api/enrollments
GET    /api/enrollments/course/:courseId
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

Reports aggregate enrollment rows in SQL. The current enrollment schema has no
status field, so all existing enrollments are included in totals and category
breakdowns.
