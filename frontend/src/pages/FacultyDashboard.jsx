import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';

export default function FacultyDashboard() {
  const [tab, setTab] = useState('attendance');
  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 22 }}>Faculty Dashboard</h1>
        <div className="row" style={{ marginBottom: 20 }}>
          {['attendance', 'timetable', 'notices', 'shortage'].map((t) => (
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
        {tab === 'timetable' && <ManageTimetable />}
        {tab === 'notices' && <ManageNotices />}
        {tab === 'shortage' && <ShortageList />}
      </div>
    </>
  );
}

/* --- Mark attendance --- */
function MarkAttendance() {
  const [className, setClassName] = useState('CSE-A');
  const [subject, setSubject] = useState('Data Structures');
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [msg, setMsg] = useState('');

  async function loadStudents() {
    // Load the roster for the selected class so faculty can mark each student.
    try {
      const res = await api.get('/api/users/students', { params: { className } });
      setStudents(res.data.students);
    } catch {
      setMsg('Could not load students for this class.');
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  function setStatus(id, status) {
    setStatuses((s) => ({ ...s, [id]: status }));
  }

  async function submit() {
    setMsg('');
    const records = students.map((s) => ({
      studentId: s._id,
      status: statuses[s._id] || 'present',
    }));
    try {
      const res = await api.post('/api/attendance/mark', { subject, records });
      setMsg(res.data.message);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to mark attendance');
    }
  }

  return (
    <div className="card">
      <h2>Mark attendance</h2>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Class</label>
          <input value={className} onChange={(e) => setClassName(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>

      {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr><th>Roll</th><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td>{s.rollNumber}</td>
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
          {!students.length && (
            <tr><td colSpan="3" className="muted">No students found for this class.</td></tr>
          )}
        </tbody>
      </table>

      {students.length > 0 && (
        <button style={{ marginTop: 16 }} onClick={submit}>
          Save attendance
        </button>
      )}
    </div>
  );
}

/* --- Manage timetable --- */
function ManageTimetable() {
  const [className, setClassName] = useState('CSE-A');
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const res = await api.get('/api/timetable/me', { params: { className } });
      setSlots(res.data.timetable.slots || []);
    } catch {
      setSlots([]);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

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
    try {
      await api.post('/api/timetable', { className, slots });
      setMsg('Timetable saved.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to save');
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="card">
      <h2>Manage timetable</h2>
      <label>Class</label>
      <input value={className} onChange={(e) => setClassName(e.target.value)} style={{ maxWidth: 200 }} />
      {msg && <p className="muted">{msg}</p>}

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

  async function load() {
    const res = await api.get('/api/notices');
    setNotices(res.data.notices);
  }
  useEffect(() => { load(); }, []);

  async function post() {
    setMsg('');
    try {
      await api.post('/api/notices', form);
      setForm({ title: '', body: '', priority: 'normal', audience: 'all' });
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to post');
    }
  }
  async function del(id) {
    await api.delete(`/api/notices/${id}`);
    await load();
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <h2>Post a notice</h2>
        {msg && <p className="muted">{msg}</p>}
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
              <td>{s.rollNumber}</td>
              <td>{s.name}</td>
              <td>{s.className}</td>
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
