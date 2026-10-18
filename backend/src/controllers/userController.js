import User from '../models/User.js';

// Faculty lists students, optionally filtered by class.
export async function listStudents(req, res) {
  const filter = { role: 'student' };
  if (req.query.className) filter.className = req.query.className;
  if (req.query.department) filter.department = req.query.department;

  const students = await User.find(filter)
    .select('name rollNumber className department')
    .sort({ rollNumber: 1 });

  res.json({ count: students.length, students });
}
