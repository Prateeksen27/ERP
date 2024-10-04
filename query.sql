CREATE TABLE assignment (
    id INT,
    name VARCHAR(25),
    section VARCHAR(2),
    subject VARCHAR(40),
    assignment_name VARCHAR(255),
    last_date VARCHAR(255),
    assignment_id SERIAL PRIMARY KEY
);

CREATE TABLE event (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    details VARCHAR(255),
    start_date VARCHAR(255),
    end_date VARCHAR(255),
    img_src VARCHAR(255),
    venue VARCHAR(255)
);

CREATE TABLE faculty (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    dept VARCHAR(40),
    password VARCHAR(40),
    type VARCHAR(255),
    section VARCHAR(10)
);

CREATE TABLE faculty_sub (
    id INT,
    section VARCHAR(2),
    subject VARCHAR(20),
    semester VARCHAR(2)
);

CREATE TABLE leave (
    student_name VARCHAR(255),
    rollno VARCHAR(10),
    section VARCHAR(2),
    start_date VARCHAR(255),
    end_date VARCHAR(255),
    reason VARCHAR(255),
    status VARCHAR(30) DEFAULT 'pending',
    leave_id SERIAL PRIMARY KEY
);

CREATE TABLE responce (
    rollno VARCHAR(20),
    name VARCHAR(255),
    assignment_id VARCHAR(50),
    faculty_id VARCHAR(30),
    file_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Not Submitted'
);

CREATE TABLE review (
    assignment_name VARCHAR(50),
    rollno VARCHAR(20),
    grade VARCHAR(30),
    review VARCHAR(30)
);

CREATE TABLE student (
    rollno VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255),
    password VARCHAR(40),
    type VARCHAR(50),
    section VARCHAR(10),
    semester VARCHAR(20)
);
INSERT INTO student (rollno, name, password, type, section, semester)
VALUES
('2023001', 'John Doe', 'password123', 'Regular', 'A', '3'),
('2023002', 'Jane Smith', 'abc@123', 'Regular', 'B', '3'),
('2023003', 'Alice Johnson', 'qwerty', 'Regular', 'A', '3');
INSERT INTO faculty (id, name, dept, password, type, section)
VALUES
(101, 'Dr. Smith', 'Computer Science', 'faculty123', 'Faculty', 'A'),
(102, 'Prof. Johnson', 'Electrical Engineering', 'faculty456', 'Faculty', 'B'),
(103, 'Dr. Parker', 'Mechanical Engineering', 'faculty789', 'Faculty', 'A');
INSERT INTO faculty_sub (id, section, subject, semester)
VALUES
(101, 'A', 'Computer Networks', 'Spring'),
(102, 'B', 'Digital Electronics', 'Fall'),
(103, 'A', 'Thermodynamics', 'Spring');
