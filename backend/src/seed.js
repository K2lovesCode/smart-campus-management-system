import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Attendance from './models/Attendance.js';
import Timetable from './models/Timetable.js';
import Notice from './models/Notice.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_campus';

async function seed() {
  await connectDB(MONGO_URI);
  console.log('[seed] clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Attendance.deleteMany({}),
    Timetable.deleteMany({}),
    Notice.deleteMany({}),
  ]);

  // --- Faculty ---
  const faculty = await User.create({
    name: 'Dr. Priya Raman',
    email: 'faculty@campus.edu',
    password: 'password123',
    role: 'faculty',
    facultyId: 'FAC001',
    department: 'CSE',
  });

  // --- Students ---
  const studentsData = [
    { name: 'Arun Kumar', email: 'arun@campus.edu', rollNumber: 'CSE001' },
    { name: 'Divya Shankar', email: 'divya@campus.edu', rollNumber: 'CSE002' },
    { name: 'Karthik Rao', email: 'karthik@campus.edu', rollNumber: 'CSE003' },
    { name: 'Student Demo', email: 'student@campus.edu', rollNumber: 'CSE004' },
  ];
  const students = [];
  for (const s of studentsData) {
    students.push(
      await User.create({
        ...s,
        password: 'password123',
        role: 'student',
        department: 'CSE',
        className: 'CSE-A',
      })
    );
  }

  // --- Timetable ---
  await Timetable.create({
    className: 'CSE-A',
    department: 'CSE',
    updatedBy: faculty._id,
    slots: [
      { day: 'Monday', startTime: '09:00', endTime: '10:00', subject: 'Data Structures', faculty: 'Dr. Priya Raman', room: 'A101' },
      { day: 'Monday', startTime: '10:00', endTime: '11:00', subject: 'DBMS', faculty: 'Dr. Priya Raman', room: 'A101' },
      { day: 'Tuesday', startTime: '09:00', endTime: '10:00', subject: 'Operating Systems', faculty: 'Prof. Mohan', room: 'A102' },
      { day: 'Wednesday', startTime: '11:00', endTime: '12:00', subject: 'Computer Networks', faculty: 'Prof. Latha', room: 'A103' },
      { day: 'Thursday', startTime: '09:00', endTime: '10:00', subject: 'Data Structures', faculty: 'Dr. Priya Raman', room: 'A101' },
      { day: 'Friday', startTime: '10:00', endTime: '11:00', subject: 'DBMS', faculty: 'Dr. Priya Raman', room: 'A101' },
    ],
  });

  // --- Attendance (10 days per subject, some low to trigger shortage) ---
  const subjects = ['Data Structures', 'DBMS', 'Operating Systems'];
  const presentRatios = [0.9, 0.95, 0.6, 0.5]; // last two students fall short
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const ratio = presentRatios[i];
    for (const subject of subjects) {
      for (let d = 0; d < 10; d++) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);
        await Attendance.create({
          student: student._id,
          subject,
          date,
          status: Math.random() < ratio ? 'present' : 'absent',
          markedBy: faculty._id,
        });
      }
    }
  }

  // --- Notices ---
  await Notice.create([
    {
      title: 'Internal Assessment I Schedule',
      body: 'IA-I exams begin Monday next week. Check the timetable for subject-wise slots.',
      priority: 'high',
      audience: 'students',
      department: 'CSE',
      postedBy: faculty._id,
    },
    {
      title: 'Guest Lecture on Cloud Native DevOps',
      body: 'A guest lecture will be held on Friday at 2 PM in the seminar hall. All are welcome.',
      priority: 'normal',
      audience: 'all',
      postedBy: faculty._id,
    },
    {
      title: 'Attendance Shortage Warning',
      body: 'Students with attendance below 75% must meet their mentor this week.',
      priority: 'high',
      audience: 'students',
      postedBy: faculty._id,
    },
  ]);

  console.log('[seed] done.');
  console.log('------------------------------------------------');
  console.log('Faculty login : faculty@campus.edu / password123');
  console.log('Student login : student@campus.edu / password123');
  console.log('------------------------------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});
