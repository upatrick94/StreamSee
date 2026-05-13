import logo from "../assets/StreamSeeLogo.svg";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { clearAuthSession, hasPermission, readAuthSession } from "../api/authApi";
import "../styles/navbar.css";

function Navbar({ activePage }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const session = readAuthSession();
    const isAdmin = hasPermission(session, "AUDIT_VIEW");

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        clearAuthSession();
        window.location.assign("/login");
    };

    return (
        <nav className={`navbar ${isAdmin ? "navbar-admin" : ""}`}>
            <div ref={dropdownRef} className="logo-wrapper">
                <img
                    src={logo}
                    alt="Logo"
                    className="logo"
                    onClick={toggleDropdown}
                />

                {isOpen && (
                    <div className="logo-dropdown">
                        {session ? (
                            <>
                                <button type="button" onClick={() => navigate("/home")}>
                                    {session.displayName}
                                </button>
                                <button type="button" onClick={handleLogout}>
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => navigate("/login")}>
                                    Log In
                                </button>
                                <button type="button" onClick={() => navigate("/register")}>
                                    Register
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="nav-links">
                {session && (
                    <>
                        <Link className={activePage === "home" ? "active" : ""} to="/home">Home</Link>
                        <Link className={activePage === "playlists" ? "active" : ""} to="/playlists">Playlists</Link>
                        <Link className={activePage === "recommended" ? "active" : ""} to="/recommended">Recommended</Link>
                        <Link className={activePage === "stats" ? "active" : ""} to="/stats">Stats</Link>
                        <Link className={activePage === "chat" ? "active" : ""} to="/chat">Chat</Link>
                        {isAdmin && (
                            <Link className={activePage === "admin" ? "active" : ""} to="/admin">Admin</Link>
                        )}
                    </>
                )}

                <Link className={activePage === "about" ? "active" : ""} to="/about">
                    About Us
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;
