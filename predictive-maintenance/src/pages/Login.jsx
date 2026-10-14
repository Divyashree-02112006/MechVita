import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import logo from "../assets/mechvita-navbar.png";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      // Firebase login
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Login successful
      navigate("/dashboard");

    } catch (error) {
      console.error(error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Unable to login. Please try again.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <img src={logo} alt="MechVita" />
        </div>

        {/* Heading */}
        <div className="login-heading">

          <h1>Welcome Back</h1>

          <p>
            Sign in to access the MechVita machine health
            monitoring dashboard.
          </p>

        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
          <div className="input-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="input-wrapper">

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

          {/* Password */}
          <div className="input-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <LockKeyhole size={18} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Sign Up */}
          <div className="login-signup-link">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>

          </div>

        </form>

        {/* Footer */}
        <div className="login-footer">

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

export default Login;