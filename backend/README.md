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

Reporting endpoints:

GET    /api/reports/overview  (admin only)
GET    /api/reports/my        (student only; authenticated student's data only)

Reports aggregate enrollment rows in SQL. The current enrollment schema has no
status field, so all existing enrollments are included in totals and category
breakdowns.
