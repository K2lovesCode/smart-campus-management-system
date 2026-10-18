import Timetable from '../models/Timetable.js';

// Faculty creates or replaces a class timetable.
// Body: { className, department?, slots: [...] }
export async function upsertTimetable(req, res) {
  const { className, department, slots } = req.body;
  if (!className || !Array.isArray(slots)) {
    return res.status(400).json({ message: 'className and a slots array are required' });
  }

  const timetable = await Timetable.findOneAndUpdate(
    { className },
    { className, department, slots, updatedBy: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ timetable });
}

// Student sees their own class timetable; faculty can pass ?className=
export async function getTimetable(req, res) {
  const className = req.user.role === 'student' ? req.user.className : req.query.className;
  if (!className) {
    return res.status(400).json({ message: 'className is required' });
  }

  const timetable = await Timetable.findOne({ className });
  if (!timetable) return res.status(404).json({ message: `No timetable found for ${className}` });

  res.json({ timetable });
}

export async function listTimetables(req, res) {
  const timetables = await Timetable.find().select('className department updatedAt');
  res.json({ timetables });
}
