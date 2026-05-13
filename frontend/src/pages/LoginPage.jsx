import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loginApi } from "../api/authApi";
import "../styles/auth.css";

function LoginPage() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [errors, setErrors] = useState({
        username: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        setSubmitMessage("");
        setSubmitError("");
    };

    const validateForm = () => {
        const newErrors = {
            username: "",
            password: "",
        };

        let isValid = true;

        if (!formData.username.trim()) {
            newErrors.username = "Please enter your username.";
            isValid = false;
        }

        if (!formData.password.trim()) {
            newErrors.password = "Please enter your password.";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");
            await loginApi(formData.username.trim(), formData.password);
            setSubmitMessage("Logged in successfully.");
            window.location.assign("/home");
        } catch (error) {
            setSubmitError(error.message || "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page page-fade">
            <Navbar />

            <main className="auth-main">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-title">Log In</h1>

                    <div className="auth-field">
                        <label htmlFor="username" className="auth-label">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            className={`auth-input ${errors.username ? "input-error" : ""}`}
                            autoComplete="username"
                        />
                        {errors.username && <p className="auth-error">{errors.username}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password" className="auth-label">Password</label>

                        <div className="auth-password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                className={`auth-input ${errors.password ? "input-error" : ""}`}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        {errors.password && <p className="auth-error">{errors.password}</p>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Log In"}
                    </button>

                    {submitMessage && <p className="auth-success">{submitMessage}</p>}
                    {submitError && <p className="auth-error">{submitError}</p>}

                    <p className="auth-link auth-link-muted">
                        No account yet? <Link className="auth-link-inline" to="/register">Create one</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}

export default LoginPage;
