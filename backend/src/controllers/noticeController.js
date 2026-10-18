import Notice from '../models/Notice.js';

// Faculty posts a notice.
export async function createNotice(req, res) {
  const { title, body, priority, audience, department } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'title and body are required' });
  }

  const notice = await Notice.create({
    title,
    body,
    priority,
    audience,
    department,
    postedBy: req.user._id,
  });

  res.status(201).json({ notice });
}

// Anyone authenticated sees notices relevant to their role.
export async function listNotices(req, res) {
  const audienceFilter =
    req.user.role === 'student'
      ? { audience: { $in: ['all', 'students'] } }
      : { audience: { $in: ['all', 'faculty'] } };

  const notices = await Notice.find(audienceFilter)
    .sort({ priority: -1, createdAt: -1 })
    .populate('postedBy', 'name role')
    .limit(100);

  res.json({ count: notices.length, notices });
}

export async function deleteNotice(req, res) {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: 'Notice not found' });

  // Only the author may delete.
  if (String(notice.postedBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only delete your own notices' });
  }

  await notice.deleteOne();
  res.json({ message: 'Notice deleted' });
}
