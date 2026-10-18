import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="navbar">
      <div className="inner">
        <div className="brand">🎓 Smart Campus</div>
        <div className="nav-user">
          <span>
            {user?.name} · <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>
          </span>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
