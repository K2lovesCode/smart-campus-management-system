import { useEffect, useState, useCallback } from 'react';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';

const TABS = ['attendance', 'students', 'timetable', 'notices', 'shortage'];

export default function FacultyDashboard() {
  const [tab, setTab] = useState('attendance');
  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 22 }}>Faculty Dashboard</h1>
        <div className="row" style={{ marginBottom: 20 }}>
          {TABS.map((t) => (
            <button
              key={t}
              className={tab === t ? '' : 'ghost'}
              onClick={() => setTab(t)}
              style={{ textTransform: 'capitalize' }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'attendance' && <MarkAttendance />}
        {tab === 'students' && <StudentsManager />}
        {tab === 'timetable' && <ManageTimetable />}
        {tab === 'notices' && <ManageNotices />}
        {tab === 'shortage' && <ShortageList />}
      </div>
    </>
  );
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* --- Mark attendance --- */
function MarkAttendance() {
  const [className, setClassName] = useState('CSE-A');
  const [subject, setSubject] = useState('Data Structures');
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/api/users/students', { params: { className } });
      setStudents(res.data.students || []);
      // Default everyone to present.
      const init = {};
      (res.data.students || []).forEach((s) => { init[s._id] = 'present'; });
      setStatuses(init);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load students for this class.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [className]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  function setStatus(id, status) {
    setStatuses((s) => ({ ...s, [id]: status }));
  }
  function markAll(status) {
    const next = {};
    students.forEach((s) => { next[s._id] = status; });
    setStatuses(next);
  }

  async function submit() {
    setMsg('');
    setError('');
    setSaving(true);
    const records = students.map((s) => ({
      studentId: s._id,
      status: statuses[s._id] || 'present',
    }));
    try {
      const res = await api.post('/api/attendance/mark', { subject, date, records });
      setMsg(`${res.data.message}. Students will see the update on their dashboard.`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Mark attendance</h2>
      <div className="row">
        <div style={{ flex: 1, minWidth: 160 }}>
          <label>Class</label>
          <input value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
        </div>
      </div>

      {error && <div className="alert" style={{ marginTop: 12 }}>{error}</div>}
      {msg && <p style={{ marginTop: 12, color: 'var(--ok)', fontWeight: 600 }}>{msg}</p>}

      {!loading && students.length > 0 && (
        <div className="row" style={{ marginTop: 14 }}>
          <button className="ghost" onClick={() => markAll('present')}>Mark all present</button>
          <button className="ghost" onClick={() => markAll('absent')}>Mark all absent</button>
          <button className="ghost" onClick={loadStudents}>↻ Reload</button>
        </div>
      )}

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Roll</th><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.rollNumber || '—'}</td>
              <td>{s.name}</td>
              <td>
                <div className="row">
                  <button
                    className={(statuses[s._id] || 'present') === 'present' ? '' : 'ghost'}
                    onClick={() => setStatus(s._id, 'present')}
                  >
                    Present
                  </button>
                  <button
                    className={statuses[s._id] === 'absent' ? 'danger' : 'ghost'}
                    onClick={() => setStatus(s._id, 'absent')}
                  >
                    Absent
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {loading && (
            <tr><td colSpan="3" className="muted">Loading students…</td></tr>
          )}
          {!loading && !students.length && (
            <tr>
              <td colSpan="3" className="muted">
                No students in {className}. Add students in the “Students” tab first.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {students.length > 0 && (
        <button style={{ marginTop: 16 }} onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Save attendance'}
        </button>
      )}
    </div>
  );
}

/* --- Students manager (add / list / remove) --- */
function StudentsManager() {
  const empty = { name: '', email: '', password: '', rollNumber: '', className: 'CSE-A', department: 'CSE' };
  const [form, setForm] = useState(empty);
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users/students');
      setStudents(res.data.students || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function addStudent(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const res = await api.post('/api/users/students', form);
      setMsg(`Added ${res.data.student.name} (login: ${res.data.student.email})`);
      setForm({ ...empty, className: form.className, department: form.department });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add student');
    } finally {
      setSaving(false);
    }
  }

  async function removeStudent(id, name) {
    if (!window.confirm(`Remove ${name} and their attendance records?`)) return;
    setError('');
    try {
      await api.delete(`/api/users/students/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to remove student');
    }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <h2>Add a student</h2>
        {error && <div className="alert">{error}</div>}
        {msg && <p style={{ color: 'var(--ok)', fontWeight: 600 }}>{msg}</p>}
        <form onSubmit={addStudent}>
          <label>Full name</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          <label>Email (used to log in)</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          <label>Password (min 6 chars)</label>
          <input type="text" value={form.password} onChange={(e) => set('password', e.target.value)} minLength={6} required />
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Roll number</label>
              <input value={form.rollNumber} onChange={(e) => set('rollNumber', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Class</label>
              <input value={form.className} onChange={(e) => set('className', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Department</label>
              <input value={form.department} onChange={(e) => set('department', e.target.value)} />
            </div>
          </div>
          <button type="submit" style={{ marginTop: 16 }} disabled={saving}>
            {saving ? 'Adding…' : 'Add student'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Students ({students.length})</h2>
        {loading && <p className="muted">Loading…</p>}
        <table>
          <thead>
            <tr><th>Roll</th><th>Name</th><th>Email</th><th>Class</th><th></th></tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.rollNumber || '—'}</td>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.className || '—'}</td>
                <td><button className="danger" onClick={() => removeStudent(s._id, s.name)}>✕</button></td>
              </tr>
            ))}
            {!loading && !students.length && (
              <tr><td colSpan="5" className="muted">No students yet. Add one on the left.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --- Manage timetable --- */
function ManageTimetable() {
  const [className, setClassName] = useState('CSE-A');
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/timetable/me', { params: { className } });
      setSlots(res.data.timetable?.slots || []);
    } catch (e) {
      // 404 just means no timetable yet for this class.
      if (e.response?.status !== 404) {
        setError(e.response?.data?.message || 'Failed to load timetable');
      }
      setSlots([]);
    }
  }, [className]);

  useEffect(() => { load(); }, [load]);

  function addSlot() {
    setSlots((s) => [...s, { day: 'Monday', startTime: '09:00', endTime: '10:00', subject: '', room: '' }]);
  }
  function update(i, field, value) {
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, [field]: value } : slot)));
  }
  function remove(i) {
    setSlots((s) => s.filter((_, idx) => idx !== i));
  }

  async function save() {
    setMsg('');
    setError('');
    try {
      await api.post('/api/timetable', { className, slots });
      setMsg('Timetable saved.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="card">
      <h2>Manage timetable</h2>
      <label>Class</label>
      <input value={className} onChange={(e) => setClassName(e.target.value)} style={{ maxWidth: 200 }} />
      {error && <div className="alert" style={{ marginTop: 10 }}>{error}</div>}
      {msg && <p style={{ color: 'var(--ok)', fontWeight: 600 }}>{msg}</p>}

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Day</th><th>Start</th><th>End</th><th>Subject</th><th>Room</th><th></th></tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => (
            <tr key={i}>
              <td>
                <select value={slot.day} onChange={(e) => update(i, 'day', e.target.value)}>
                  {days.map((d) => <option key={d}>{d}</option>)}
                </select>
              </td>
              <td><input value={slot.startTime} onChange={(e) => update(i, 'startTime', e.target.value)} /></td>
              <td><input value={slot.endTime} onChange={(e) => update(i, 'endTime', e.target.value)} /></td>
              <td><input value={slot.subject} onChange={(e) => update(i, 'subject', e.target.value)} /></td>
              <td><input value={slot.room} onChange={(e) => update(i, 'room', e.target.value)} /></td>
              <td><button className="danger" onClick={() => remove(i)}>✕</button></td>
            </tr>
          ))}
          {!slots.length && (
            <tr><td colSpan="6" className="muted">No slots yet. Click “Add slot”.</td></tr>
          )}
        </tbody>
      </table>

      <div className="row" style={{ marginTop: 16 }}>
        <button className="ghost" onClick={addSlot}>+ Add slot</button>
        <button onClick={save}>Save timetable</button>
      </div>
    </div>
  );
}

/* --- Manage notices --- */
function ManageNotices() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal', audience: 'all' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/notices');
      setNotices(res.data.notices || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load notices');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function post() {
    setMsg('');
    setError('');
    try {
      await api.post('/api/notices', form);
      setForm({ title: '', body: '', priority: 'normal', audience: 'all' });
      setMsg('Notice published.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to post');
    }
  }
  async function del(id) {
    setError('');
    try {
      await api.delete(`/api/notices/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete');
    }
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <h2>Post a notice</h2>
        {error && <div className="alert">{error}</div>}
        {msg && <p style={{ color: 'var(--ok)', fontWeight: 600 }}>{msg}</p>}
        <label>Title</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>Body</label>
        <textarea rows="4" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Audience</label>
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">all</option>
              <option value="students">students</option>
              <option value="faculty">faculty</option>
            </select>
          </div>
        </div>
        <button style={{ marginTop: 16 }} onClick={post} disabled={!form.title || !form.body}>
          Publish notice
        </button>
      </div>

      <div className="card">
        <h2>Published notices</h2>
        {notices.map((n) => (
          <div key={n._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="row">
              <strong>{n.title}</strong>
              <span className={`badge ${n.priority}`}>{n.priority}</span>
              <span className="spacer" />
              <button className="danger" onClick={() => del(n._id)}>Delete</button>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>{n.body}</p>
          </div>
        ))}
        {!notices.length && <p className="muted">No notices.</p>}
      </div>
    </div>
  );
}

/* --- Shortage list --- */
function ShortageList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/attendance/shortage')
      .then((res) => setData(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  return (
    <div className="card">
      <h2>Attendance shortage list</h2>
      {error && <div className="alert">{error}</div>}
      {data && (
        <p className="muted">
          {data.count} student(s) below {data.threshold}%.
        </p>
      )}
      <table>
        <thead>
          <tr><th>Roll</th><th>Name</th><th>Class</th><th>Attendance</th></tr>
        </thead>
        <tbody>
          {data?.students?.map((s) => (
            <tr key={s.studentId}>
              <td>{s.rollNumber || '—'}</td>
              <td>{s.name}</td>
              <td>{s.className || '—'}</td>
              <td><span className="badge danger">{s.percentage}%</span></td>
            </tr>
          ))}
          {data && !data.students.length && (
            <tr><td colSpan="4" className="muted">No students below the threshold. 🎉</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
