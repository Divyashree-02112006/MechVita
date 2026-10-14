import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  LockKeyhole,
  Activity,
} from "lucide-react";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import logo from "../assets/mechvita-navbar.png";

function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    // Check password length
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Create Firebase account
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Signup successful
      navigate("/login");

    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else {
        setError("Unable to create account. Please try again.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-card">

        {/* Logo */}
        <div className="signup-logo">
          <img src={logo} alt="MechVita" />
        </div>

        {/* Heading */}
        <div className="signup-heading">
          <h1>Create Account</h1>

          <p>
            Create your MechVita account to monitor machine health.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignUp}>

          {/* Full Name */}
          <div className="signup-input-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <div className="signup-input-wrapper">

              <User size={18} />

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

            </div>

          </div>

          {/* Email */}
          <div className="signup-input-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="signup-input-wrapper">

              <Mail size={18} />

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

          </div>

          {/* Username */}
          <div className="signup-input-group">

            <label htmlFor="username">
              Username
            </label>

            <div className="signup-input-wrapper">

              <User size={18} />

              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

            </div>

          </div>

          {/* Password */}
          <div className="signup-input-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="signup-input-wrapper">

              <LockKeyhole size={18} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Confirm Password */}
          <div className="signup-input-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="signup-input-wrapper">

              <LockKeyhole size={18} />

              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          {/* Sign Up Button */}
          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <div className="signup-login-link">

            <span>Already have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

          </div>

        </form>

        {/* Footer */}
        <div className="signup-footer">

          <span>
            MechVita
          </span>

          <p>
            IoT-Based Machine Health Monitoring System
          </p>

        </div>

      </div>

    </div>
  );
}

export default SignUp;