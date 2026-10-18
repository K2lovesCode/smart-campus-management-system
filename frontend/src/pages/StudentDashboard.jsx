import { useEffect, useState } from 'react';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/attendance/me'),
      api.get('/api/timetable/me').catch(() => ({ data: { timetable: null } })),
      api.get('/api/notices'),
    ])
      .then(([a, t, n]) => {
        setAttendance(a.data);
        setTimetable(t.data.timetable);
        setNotices(n.data.notices);
      })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load data'));
  }, []);

  const overall = attendance?.overall;

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 22 }}>Student Dashboard</h1>
        {error && <div className="alert">{error}</div>}

        {/* Attendance shortage alert */}
        {overall?.shortage && (
          <div className="card" style={{ borderColor: 'var(--danger)', background: '#fff5f5' }}>
            <strong style={{ color: 'var(--danger)' }}>⚠ Attendance shortage!</strong>{' '}
            Your attendance is {overall.percentage}%, below the required {overall.threshold}%.
          </div>
        )}

        {/* Stats */}
        {overall && (
          <div className="stats" style={{ marginBottom: 20 }}>
            <div className="stat">
              <div className="value" style={{ color: overall.shortage ? 'var(--danger)' : 'var(--ok)' }}>
                {overall.percentage}%
              </div>
              <div className="label">Overall attendance</div>
            </div>
            <div className="stat">
              <div className="value">{overall.present}</div>
              <div className="label">Classes attended</div>
            </div>
            <div className="stat">
              <div className="value">{overall.total}</div>
              <div className="label">Total classes</div>
            </div>
            <div className="stat">
              <div className="value">{overall.threshold}%</div>
              <div className="label">Required minimum</div>
            </div>
          </div>
        )}

        <div className="grid grid-2">
          {/* Subject-wise attendance */}
          <div className="card">
            <h2>Attendance by subject</h2>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>%</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {attendance?.subjects?.map((s) => (
                  <tr key={s.subject}>
                    <td>{s.subject}</td>
                    <td>
                      {s.percentage}%{' '}
                      {s.shortage && <span className="badge danger">low</span>}
                    </td>
                    <td style={{ width: 140 }}>
                      <div className={`progress ${s.shortage ? 'low' : ''}`}>
                        <span style={{ width: `${s.percentage}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!attendance?.subjects?.length && (
                  <tr><td colSpan="3" className="muted">No attendance records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Timetable */}
          <div className="card">
            <h2>My timetable {timetable ? `· ${timetable.className}` : ''}</h2>
            <table>
              <thead>
                <tr><th>Day</th><th>Time</th><th>Subject</th><th>Room</th></tr>
              </thead>
              <tbody>
                {timetable?.slots?.map((slot, i) => (
                  <tr key={i}>
                    <td>{slot.day}</td>
                    <td>{slot.startTime}–{slot.endTime}</td>
                    <td>{slot.subject}</td>
                    <td>{slot.room || '—'}</td>
                  </tr>
                ))}
                {!timetable?.slots?.length && (
                  <tr><td colSpan="4" className="muted">No timetable published.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notices */}
        <div className="card">
          <h2>Notices &amp; announcements</h2>
          {notices.map((n) => (
            <div key={n._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="row">
                <strong>{n.title}</strong>
                <span className={`badge ${n.priority}`}>{n.priority}</span>
                <span className="spacer" />
                <span className="muted">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="muted" style={{ margin: '6px 0 0' }}>{n.body}</p>
            </div>
          ))}
          {!notices.length && <p className="muted">No notices yet.</p>}
        </div>
      </div>
    </>
  );
}
