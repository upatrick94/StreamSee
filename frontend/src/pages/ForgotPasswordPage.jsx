import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { requestPasswordResetCodeApi } from "../api/authApi";
import "../styles/auth.css";

function ForgotPasswordPage() {
    const [formData, setFormData] = useState({
        username: "",
        securityAnswer: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setSubmitError("");
    };

    const validateForm = () => {
        const nextErrors = {};
        let valid = true;

        if (!formData.username.trim()) {
            nextErrors.username = "Please enter your username.";
            valid = false;
        }

        if (!formData.securityAnswer.trim()) {
            nextErrors.securityAnswer = "Please enter your security answer.";
            valid = false;
        }

        if (!formData.newPassword.trim()) {
            nextErrors.newPassword = "Please enter a new password.";
            valid = false;
        }

        if (!formData.confirmPassword.trim()) {
            nextErrors.confirmPassword = "Please confirm the new password.";
            valid = false;
        } else if (formData.newPassword !== formData.confirmPassword) {
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

            const result = await requestPasswordResetCodeApi(
                formData.username.trim(),
                formData.securityAnswer.trim(),
                formData.newPassword
            );

            const params = new URLSearchParams({
                flow: "reset",
                challengeId: result.challengeId,
                hint: result.deliveryHint || "",
            });

            window.location.assign(`/auth-code?${params.toString()}`);
        } catch (error) {
            setSubmitError(error.message || "Password reset failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page page-fade">
            <Navbar />

            <main className="auth-main">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-title">Reset Password</h1>

                    <div className="auth-field">
                        <label htmlFor="username" className="auth-label">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            className={`auth-input ${errors.username ? "input-error" : ""}`}
                        />
                        {errors.username && <p className="auth-error">{errors.username}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="securityAnswer" className="auth-label">Security Answer</label>
                        <input
                            id="securityAnswer"
                            name="securityAnswer"
                            type="text"
                            value={formData.securityAnswer}
                            onChange={handleChange}
                            className={`auth-input ${errors.securityAnswer ? "input-error" : ""}`}
                        />
                        {errors.securityAnswer && <p className="auth-error">{errors.securityAnswer}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="newPassword" className="auth-label">New Password</label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className={`auth-input ${errors.newPassword ? "input-error" : ""}`}
                        />
                        {errors.newPassword && <p className="auth-error">{errors.newPassword}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword" className="auth-label">Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`auth-input ${errors.confirmPassword ? "input-error" : ""}`}
                        />
                        {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? "Sending code..." : "Continue"}
                    </button>

                    {submitError && <p className="auth-error">{submitError}</p>}

                    <p className="auth-link auth-link-muted">
                        Back to <Link className="auth-link-inline" to="/login">Log in</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}

export default ForgotPasswordPage;