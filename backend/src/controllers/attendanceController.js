import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const threshold = () => Number(process.env.ATTENDANCE_THRESHOLD || 75);

// Faculty marks attendance for one or many students.
// Body: { subject, date?, records: [{ studentId, status }] }
export async function markAttendance(req, res) {
  const { subject, date, records } = req.body;
  if (!subject || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'subject and a non-empty records array are required' });
  }

  const day = date ? new Date(date) : new Date();
  // Normalise to midnight so the unique index works per-day.
  day.setHours(0, 0, 0, 0);

  const results = [];
  for (const r of records) {
    if (!r.studentId || !['present', 'absent'].includes(r.status)) continue;
    const doc = await Attendance.findOneAndUpdate(
      { student: r.studentId, subject, date: day },
      { status: r.status, markedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    results.push(doc);
  }

  res.status(201).json({ message: `Marked ${results.length} record(s)`, records: results });
}

function summarise(records) {
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
  return { total, present, absent: total - present, percentage };
}

// A student views their own attendance; faculty can pass ?studentId=
export async function getMyAttendance(req, res) {
  const studentId = req.user.role === 'student' ? req.user._id : req.query.studentId;
  if (!studentId) {
    return res.status(400).json({ message: 'studentId query parameter is required for faculty' });
  }

  const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

  // Per-subject breakdown
  const bySubject = {};
  for (const r of records) {
    bySubject[r.subject] = bySubject[r.subject] || [];
    bySubject[r.subject].push(r);
  }
  const subjects = Object.entries(bySubject).map(([subject, recs]) => ({
    subject,
    ...summarise(recs),
  }));

  const overall = summarise(records);
  const limit = threshold();

  res.json({
    overall: { ...overall, threshold: limit, shortage: overall.percentage < limit },
    subjects: subjects.map((s) => ({ ...s, shortage: s.percentage < limit })),
    records,
  });
}

// Faculty: list students whose attendance is below the threshold.
export async function getShortageList(req, res) {
  const limit = threshold();
  const students = await User.find({ role: 'student' });
  const result = [];

  for (const student of students) {
    const records = await Attendance.find({ student: student._id });
    if (records.length === 0) continue;
    const { percentage, total, present } = summarise(records);
    if (percentage < limit) {
      result.push({
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        className: student.className,
        percentage,
        total,
        present,
      });
    }
  }

  res.json({ threshold: limit, count: result.length, students: result });
}
