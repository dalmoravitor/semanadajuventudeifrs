import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./header.css";
import logo from "../assets/icons/logo.jpeg";

export default function Header() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);

	const handleLogout = async () => {
		const result = await logout();
		if (result.success) {
			navigate("/");
		}
	};

	const closeMenu = () => setMenuOpen(false);

	return (
        <header className="home-header">
			<div className="home-header__brand">
				<img src={logo} alt="Semana da Juventude" className="home-header__logo" />
				<span className="home-header__title">XXIX Semana da Juventude</span>
			</div>
			<button
				className={`menu-toggle ${menuOpen ? 'is-open' : ''}`}
				aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
				aria-expanded={menuOpen}
				aria-controls="mobile-menu"
				onClick={() => setMenuOpen(v => !v)}
			>
				<span className="menu-toggle__icon" aria-hidden="true">
					{menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
				</span>
			</button>

			<nav className="home-header__nav" aria-label="Menu principal">
				<NavLink to="/" onClick={closeMenu} className={({ isActive }) => `home-nav__link ${isActive ? "is-active" : ""}`}>Início</NavLink>
				<NavLink to="/modalidades" onClick={closeMenu} className={({ isActive }) => `home-nav__link ${isActive ? "is-active" : ""}`}>Modalidades</NavLink>
				<NavLink to="/ranking" onClick={closeMenu} className={({ isActive }) => `home-nav__link ${isActive ? "is-active" : ""}`}>Ranking</NavLink>
				<NavLink to="/sobre" onClick={closeMenu} className={({ isActive }) => `home-nav__link ${isActive ? "is-active" : ""}`}>Sobre</NavLink>
				{user && (
					<NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => `home-nav__link ${isActive ? "is-active" : ""}`}>Admin</NavLink>
				)}
			</nav>
			<div className="home-header__cta">
				{user ? (
					<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
						<span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
							👤 Admin
						</span>
						<button 
							onClick={() => { handleLogout(); closeMenu(); }}
							className="btn"
							style={{
								backgroundColor: "rgba(239, 68, 68, 0.1)",
								border: "1px solid rgba(239, 68, 68, 0.3)",
								color: "#ef4444",
								fontSize: "0.875rem",
								padding: "8px 16px"
							}}
						>
							Sair
						</button>
					</div>
				) : (
					<Link to="/login" onClick={closeMenu} className="btn btn--primary">Login</Link>
				)}
			</div>

			{menuOpen && (
				<div id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true">
					<div className="mobile-menu__content">
						<div className="mobile-menu__links">
							<NavLink to="/" onClick={closeMenu} className={({ isActive }) => `mobile-link ${isActive ? 'is-active' : ''}`}>Início</NavLink>
							<NavLink to="/modalidades" onClick={closeMenu} className={({ isActive }) => `mobile-link ${isActive ? 'is-active' : ''}`}>Modalidades</NavLink>
							<NavLink to="/ranking" onClick={closeMenu} className={({ isActive }) => `mobile-link ${isActive ? 'is-active' : ''}`}>Ranking</NavLink>
							<NavLink to="/sobre" onClick={closeMenu} className={({ isActive }) => `mobile-link ${isActive ? 'is-active' : ''}`}>Sobre</NavLink>
							{user && (
								<NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => `mobile-link ${isActive ? 'is-active' : ''}`}>Admin</NavLink>
							)}
						</div>
						<div className="mobile-menu__cta">
							{user ? (
								<button onClick={() => { handleLogout(); closeMenu(); }} className="btn btn--ghost">Sair</button>
							) : (
								<Link to="/login" onClick={closeMenu} className="btn btn--primary" style={{ width: '100%' }}>Login</Link>
							)}
						</div>
					</div>
				</div>
			)}
		</header>
    );
}

