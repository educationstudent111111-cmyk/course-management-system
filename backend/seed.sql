-- Seed Courses
INSERT INTO courses
(title, category, level, duration, price, image, description, max_students)
VALUES

(
    'HTML & CSS',
    'Frontend',
    'Beginner',
    '8 Weeks',
    15000,
    'https://placehold.co/300x180?text=HTML+%26+CSS',
    'Learn the fundamentals of HTML5 and CSS3 to build modern, responsive websites.',
    30
),

(
    'JavaScript',
    'Frontend',
    'Intermediate',
    '10 Weeks',
    18000,
    'https://placehold.co/300x180?text=JavaScript',
    'Master JavaScript, the DOM, events, ES6 features, and asynchronous programming.',
    25
),

(
    'Node.js',
    'Backend',
    'Intermediate',
    '12 Weeks',
    22000,
    'https://placehold.co/300x180?text=Node.js',
    'Build fast and scalable server-side applications using Node.js.',
    NULL
),

(
    'Express.js',
    'Backend',
    'Advanced',
    '8 Weeks',
    20000,
    'https://placehold.co/300x180?text=Express.js',
    'Create RESTful APIs and web applications using the Express framework.',
    NULL
),

(
    'MongoDB',
    'Database',
    'Intermediate',
    '6 Weeks',
    17000,
    'https://placehold.co/300x180?text=MongoDB',
    'Learn NoSQL database design, CRUD operations, and MongoDB integration.',
    20
),

(
    'MySQL',
    'Database',
    'Beginner',
    '6 Weeks',
    16000,
    'https://placehold.co/300x180?text=MySQL',
    'Understand relational databases, SQL queries, joins, and database normalization.',
    NULL
),

(
    'React',
    'Frontend',
    'Advanced',
    '10 Weeks',
    25000,
    'https://placehold.co/300x180?text=React',
    'Develop modern single-page applications using React components and hooks.',
    15
),

(
    'Full Stack Web Development',
    'Full Stack',
    'Advanced',
    '20 Weeks',
    45000,
    'https://placehold.co/300x180?text=Full+Stack',
    'Combine frontend, backend, databases, authentication, and deployment into one complete project.',
    10
);