import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
    verifyLoginCodeApi,
    verifyPasswordResetCodeApi,
    verifyRegisterCodeApi,
} from "../api/authApi";
import "../styles/auth.css";

function getFlowDetails(flow) {
    switch (flow) {
        case "login":
            return {
                title: "Verify Login",
                button: "Verify and Log In",
            };
        case "register":
            return {
                title: "Verify Account Creation",
                button: "Verify and Create Account",
            };
        case "reset":
            return {
                title: "Verify Password Reset",
                button: "Verify and Reset Password",
            };
        default:
            return {
                title: "Verify Code",
                button: "Verify Code",
            };
    }
}

function AuthCodePage() {
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const flow = params.get("flow") || "";
    const challengeId = params.get("challengeId") || "";
    const hint = params.get("hint") || "";

    const details = getFlowDetails(flow);

    const [code, setCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!challengeId) {
            setErrorMessage("Verification challenge is missing.");
            return;
        }

        if (!/^\d{6}$/.test(code.trim())) {
            setErrorMessage("Please enter the 6-digit code from your email.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");

            if (flow === "login") {
                await verifyLoginCodeApi(challengeId, code.trim());
                window.location.assign("/home");
                return;
            }

            if (flow === "register") {
                await verifyRegisterCodeApi(challengeId, code.trim());
                window.location.assign("/home");
                return;
            }

            if (flow === "reset") {
                await verifyPasswordResetCodeApi(challengeId, code.trim());
                setSuccessMessage("Password reset successfully. Redirecting to log in...");
                window.setTimeout(() => {
                    window.location.assign("/login");
                }, 1200);
                return;
            }

            setErrorMessage("Unknown verification flow.");
        } catch (error) {
            setErrorMessage(error.message || "Verification failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page page-fade">
            <Navbar />

            <main className="auth-main">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
                    <h1 className="auth-title">{details.title}</h1>

                    <p className="auth-link auth-link-muted">
                        Enter the 6-digit code sent to {hint || "your email"}.
                    </p>

                    <div className="auth-field">
                        <label htmlFor="code" className="auth-label">Verification Code</label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                                setErrorMessage("");
                                setSuccessMessage("");
                            }}
                            className={`auth-input ${errorMessage ? "input-error" : ""}`}
                            autoComplete="one-time-code"
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? "Verifying..." : details.button}
                    </button>

                    {successMessage && <p className="auth-success">{successMessage}</p>}
                    {errorMessage && <p className="auth-error">{errorMessage}</p>}

                    <p className="auth-link auth-link-muted">
                        Back to <Link className="auth-link-inline" to="/login">Log in</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}

export default AuthCodePage;