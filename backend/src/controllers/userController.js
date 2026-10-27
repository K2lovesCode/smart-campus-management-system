import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// Faculty lists students, optionally filtered by class.
// Includes the login email so faculty can share credentials.
export async function listStudents(req, res) {
  const filter = { role: 'student' };
  if (req.query.className) filter.className = req.query.className;
  if (req.query.department) filter.department = req.query.department;

  const students = await User.find(filter)
    .select('name email rollNumber className department createdAt')
    .sort({ rollNumber: 1, name: 1 });

  res.json({ count: students.length, students });
}

// Faculty creates a new student account.
// Body: { name, email, password, rollNumber?, className?, department? }
export async function createStudent(req, res) {
  const { name, email, password, rollNumber, className, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'password must be at least 6 characters' });
  }

  const normalisedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalisedEmail });
  if (existing) {
    return res.status(409).json({ message: `A user with email ${normalisedEmail} already exists` });
  }

  try {
    const student = await User.create({
      name: name.trim(),
      email: normalisedEmail,
      password,
      role: 'student',
      rollNumber: rollNumber?.trim(),
      className: className?.trim(),
      department: department?.trim(),
    });
    return res.status(201).json({ student: student.toSafeJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A user with that email already exists' });
    }
    throw err;
  }
}

// Faculty deletes a student (and their attendance records).
export async function deleteStudent(req, res) {
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    return res.status(404).json({ message: 'Student not found' });
  }
  await Attendance.deleteMany({ student: student._id });
  await student.deleteOne();
  res.json({ message: 'Student removed' });
}
