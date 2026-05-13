import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { registerApi } from "../api/authApi";
import "../styles/auth.css";

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({
        username: "",
        displayName: "",
        password: "",
        confirmPassword: "",
    });
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

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
        const nextErrors = {
            username: "",
            displayName: "",
            password: "",
            confirmPassword: "",
        };

        let valid = true;

        if (!formData.username.trim()) {
            nextErrors.username = "Please enter a username.";
            valid = false;
        }

        if (!formData.displayName.trim()) {
            nextErrors.displayName = "Please enter a display name.";
            valid = false;
        }

        if (!formData.password.trim()) {
            nextErrors.password = "Please enter a password.";
            valid = false;
        }

        if (!formData.confirmPassword.trim()) {
            nextErrors.confirmPassword = "Please confirm your password.";
            valid = false;
        } else if (formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
            valid = false;
        }

        setErrors(nextErrors);
        return valid;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");
            await registerApi(
                formData.username.trim(),
                formData.displayName.trim(),
                formData.password
            );
            setSubmitMessage("Account created successfully.");
            window.location.assign("/home");
        } catch (error) {
            setSubmitError(error.message || "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page page-fade">
            <Navbar />

            <main className="auth-main">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-title">Register</h1>

                    <div className="auth-field">
                        <label htmlFor="displayName" className="auth-label">Display Name</label>
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            value={formData.displayName}
                            onChange={handleChange}
                            className={`auth-input ${errors.displayName ? "input-error" : ""}`}
                            autoComplete="name"
                        />
                        {errors.displayName && <p className="auth-error">{errors.displayName}</p>}
                    </div>

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
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`auth-input ${errors.password ? "input-error" : ""}`}
                            autoComplete="new-password"
                        />
                        {errors.password && <p className="auth-error">{errors.password}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`auth-input ${errors.confirmPassword ? "input-error" : ""}`}
                            autoComplete="new-password"
                        />
                        {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Account"}
                    </button>

                    {submitMessage && <p className="auth-success">{submitMessage}</p>}
                    {submitError && <p className="auth-error">{submitError}</p>}

                    <p className="auth-link auth-link-muted">
                        Already have an account? <Link className="auth-link-inline" to="/login">Log in</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}

export default RegisterPage;
