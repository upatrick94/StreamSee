import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { requestRegisterCodeApi, SECURITY_QUESTION_OPTIONS } from "../api/authApi";
import "../styles/auth.css";

function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
        email: "",
        password: "",
        confirmPassword: "",
        securityQuestion: SECURITY_QUESTION_OPTIONS[0],
        securityAnswer: "",
    });
    const [errors, setErrors] = useState({
        username: "",
        displayName: "",
        email: "",
        password: "",
        confirmPassword: "",
        securityQuestion: "",
        securityAnswer: "",
    });
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

        setSubmitError("");
    };

    const validateForm = () => {
        const nextErrors = {
            username: "",
            displayName: "",
            email: "",
            password: "",
            confirmPassword: "",
            securityQuestion: "",
            securityAnswer: "",
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

        if (!formData.email.trim()) {
            nextErrors.email = "Please enter an email.";
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

        if (!formData.securityQuestion.trim()) {
            nextErrors.securityQuestion = "Please select a security question.";
            valid = false;
        }

        if (!formData.securityAnswer.trim()) {
            nextErrors.securityAnswer = "Please enter a security answer.";
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

            const result = await requestRegisterCodeApi(
                formData.username.trim(),
                formData.displayName.trim(),
                formData.email.trim(),
                formData.password,
                formData.securityQuestion,
                formData.securityAnswer.trim()
            );

            const params = new URLSearchParams({
                flow: "register",
                challengeId: result.challengeId,
                hint: result.deliveryHint || "",
            });

            window.location.assign(`/auth-code?${params.toString()}`);
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
                        <label htmlFor="email" className="auth-label">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`auth-input ${errors.email ? "input-error" : ""}`}
                            autoComplete="email"
                        />
                        {errors.email && <p className="auth-error">{errors.email}</p>}
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

                    <div className="auth-field">
                        <label htmlFor="securityQuestion" className="auth-label">Security Question</label>
                        <select
                            id="securityQuestion"
                            name="securityQuestion"
                            value={formData.securityQuestion}
                            onChange={handleChange}
                            className={`auth-input ${errors.securityQuestion ? "input-error" : ""}`}
                        >
                            {SECURITY_QUESTION_OPTIONS.map((question) => (
                                <option key={question} value={question}>
                                    {question}
                                </option>
                            ))}
                        </select>
                        {errors.securityQuestion && <p className="auth-error">{errors.securityQuestion}</p>}
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
                            autoComplete="off"
                        />
                        {errors.securityAnswer && <p className="auth-error">{errors.securityAnswer}</p>}
                    </div>

                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? "Sending code..." : "Continue"}
                    </button>

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