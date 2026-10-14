
import { useEffect, useState } from "react";
import {
  UserRound,
  Cpu,
  HeartPulse,
  Activity,
  Sun,
  LockKeyhole,
  Save,
  RotateCcw,
  Thermometer,
  Zap,
  Info,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  ref,
  onValue,
  update,
  set,
} from "firebase/database";

import { auth, database } from "../firebase";
import Sidebar from "../components/Sidebar";

const DEFAULT_MACHINE = {
  machineName: "Ring Frame",
  deviceId: "SPINNING_DEVICE_001",
  vibrationBaseline: "1.00",
  temperatureBaseline: "45.00",
  currentBaseline: "2.00",
  minimumHealth: "82",
};

function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
  });

  const [machine, setMachine] = useState(DEFAULT_MACHINE);
  const [appearance] = useState("light");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configKey, setConfigKey] = useState(null);
  const [userId, setUserId] = useState(null);

  // Load the signed-in user's details.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);

        setProfile((previous) => ({
          ...previous,
          email: user.email || "",
        }));
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Load machine configuration from Firebase.
  useEffect(() => {
    const configRef = ref(database, "system_config");

    const unsubscribe = onValue(
      configRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setConfigKey(null);
          setLoading(false);
          setMessage(
            "No saved machine configuration found. Default values are shown."
          );
          setMessageType("info");
          return;
        }

        const data = snapshot.val();
        const entries = Object.entries(data);

        // Find the existing Ring Frame configuration.
        const found = entries.find(([key, item]) => {
          return (
            item?.deviceId === DEFAULT_MACHINE.deviceId ||
            item?.machineName === "Ring Frame" ||
            key === "dol7y6"
          );
        });

        if (found) {
          const [key, config] = found;

          setConfigKey(key);

          setMachine({
            machineName: config.machineName || "Ring Frame",
            deviceId:
              config.deviceId || DEFAULT_MACHINE.deviceId,
            vibrationBaseline: String(
              config.healthyVibrationBaseline ??
                config.vibrationBaseline ??
                DEFAULT_MACHINE.vibrationBaseline
            ),
            temperatureBaseline: String(
              config.healthyTemperatureBaseline ??
                config.temperatureBaseline ??
                DEFAULT_MACHINE.temperatureBaseline
            ),
            currentBaseline: String(
              config.healthyCurrentBaseline ??
                config.currentBaseline ??
                DEFAULT_MACHINE.currentBaseline
            ),
            minimumHealth: String(
              config.minimumGoodHealth ??
                config.minimumHealth ??
                DEFAULT_MACHINE.minimumHealth
            ),
          });

          setMessage("");
        } else {
          setConfigKey(null);
          setMachine(DEFAULT_MACHINE);
          setMessage(
            "Ring Frame configuration was not found. Default values are shown."
          );
          setMessageType("info");
        }

        setLoading(false);
      },
      (error) => {
        console.error("Settings Firebase read error:", error);
        setMessage(
          "Unable to load settings. Check your Firebase connection and database rules."
        );
        setMessageType("error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateProfile = (event) => {
    setProfile((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setMessage("");
  };

  const updateMachine = (event) => {
    setMachine((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));

    setMessage("");
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSave = async () => {
    if (saving) return;

    const vibration = Number(machine.vibrationBaseline);
    const temperature = Number(machine.temperatureBaseline);
    const current = Number(machine.currentBaseline);
    const minimumHealth = Number(machine.minimumHealth);

    if (
      !machine.deviceId.trim() ||
      !Number.isFinite(vibration) ||
      vibration <= 0 ||
      !Number.isFinite(temperature) ||
      temperature <= 0 ||
      !Number.isFinite(current) ||
      current <= 0 ||
      !Number.isFinite(minimumHealth) ||
      minimumHealth < 0 ||
      minimumHealth > 100
    ) {
      showMessage(
        "Enter a valid Device ID, positive baseline values, and a minimum health value between 0 and 100.",
        "error"
      );
      return;
    }

    if (!userId) {
      showMessage(
        "Please log in before saving machine settings.",
        "error"
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const key = configKey || "dol7y6";

      const configRef = ref(database, `system_config/${key}`);

      const savedConfig = {
        id: key,
        machineName: machine.machineName,
        deviceId: machine.deviceId.trim(),
        healthyVibrationBaseline: vibration,
        healthyTemperatureBaseline: temperature,
        healthyCurrentBaseline: current,
        minimumGoodHealth: minimumHealth,
        updatedAt: Date.now(),
      };

      await update(configRef, savedConfig);

      setConfigKey(key);

      // Save profile fields separately from machine configuration.
      await set(ref(database, `users/${userId}/profile`), {
        fullName: profile.fullName.trim(),
        username: profile.username.trim(),
        email: auth.currentUser?.email || profile.email,
      });

      showMessage(
        "Machine configuration and profile saved successfully to Firebase.",
        "success"
      );
    } catch (error) {
      console.error("Settings save error:", error);

      showMessage(
        "Could not save settings. Check Firebase Database rules and your connection.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMachine(DEFAULT_MACHINE);

    showMessage(
      "Default values restored in this form. Click Save Changes to save them to Firebase.",
      "info"
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      showMessage("Unable to sign out. Please try again.", "error");
    }
  };

  return (
    <div className="dashboard-page settings-page">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h1>Settings</h1>
            <p>
              Manage your profile and machine monitoring configuration
            </p>
          </div>
        </header>

        <section className="dashboard-content">
          {/* PROFILE */}
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <UserRound size={21} />
            </div>
            <div>
              <h2>Profile Settings</h2>
              <p>Your account information</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-form-grid">
              <label className="settings-field">
                Full Name
                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={updateProfile}
                  placeholder="Enter your full name"
                />
              </label>

              <label className="settings-field">
                Username
                <input
                  name="username"
                  value={profile.username}
                  onChange={updateProfile}
                  placeholder="Enter your username"
                />
              </label>

              <label className="settings-field settings-field-full">
                Email Address
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  readOnly
                  placeholder="Your signed-in email"
                />
              </label>
            </div>
          </div>

          {/* MACHINE CONFIGURATION */}
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Cpu size={21} />
            </div>
            <div>
              <h2>Machine Configuration</h2>
              <p>Reference values for the selected machine</p>
            </div>
          </div>

          <div className="settings-card">
            {loading ? (
              <p>Loading machine configuration from Firebase...</p>
            ) : (
              <>
                <div className="settings-form-grid">
                  <label className="settings-field">
                    Machine Type
                    <select
                      name="machineName"
                      value={machine.machineName}
                      onChange={updateMachine}
                    >
                      <option value="Ring Frame">Ring Frame</option>
                      <option value="Induction Motor" disabled>
                        Induction Motor — Not Configured
                      </option>
                      <option value="Air Compressor" disabled>
                        Air Compressor — Not Configured
                      </option>
                      <option value="Water Pump" disabled>
                        Water Pump — Not Configured
                      </option>
                      <option value="Conveyor Motor" disabled>
                        Conveyor Motor — Not Configured
                      </option>
                    </select>
                  </label>

                  <label className="settings-field">
                    Device ID
                    <input
                      name="deviceId"
                      value={machine.deviceId}
                      onChange={updateMachine}
                    />
                  </label>

                  <label className="settings-field">
                    Healthy Vibration Baseline (m/s² RMS)
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="vibrationBaseline"
                      value={machine.vibrationBaseline}
                      onChange={updateMachine}
                    />
                  </label>

                  <label className="settings-field">
                    Healthy Temperature Baseline (°C)
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      name="temperatureBaseline"
                      value={machine.temperatureBaseline}
                      onChange={updateMachine}
                    />
                  </label>

                  <label className="settings-field">
                    Healthy Current Baseline (A)
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="currentBaseline"
                      value={machine.currentBaseline}
                      onChange={updateMachine}
                    />
                  </label>

                  <label className="settings-field">
                    Minimum Good Health (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="minimumHealth"
                      value={machine.minimumHealth}
                      onChange={updateMachine}
                    />
                  </label>
                </div>

                <div className="settings-info-note">
                  <Info size={17} />
                  <p>
                    Configuration is stored in Firebase under
                    system_config. Changes will only affect the health
                    score after the Dashboard and Health Score pages
                    read these saved values. They do not automatically
                    update the ESP32 firmware.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* HEALTH WEIGHTS */}
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <HeartPulse size={21} />
            </div>
            <div>
              <h2>Health Score Configuration</h2>
              <p>Current component weighting</p>
            </div>
          </div>

          <div className="settings-card settings-weights">
            <div className="settings-weight-row">
              <div>
                <Activity size={19} />
                <span>Vibration</span>
              </div>
              <strong>40%</strong>
            </div>

            <div className="settings-weight-row">
              <div>
                <Thermometer size={19} />
                <span>Temperature</span>
              </div>
              <strong>30%</strong>
            </div>

            <div className="settings-weight-row">
              <div>
                <Zap size={19} />
                <span>Current</span>
              </div>
              <strong>30%</strong>
            </div>
          </div>

          {/* APPEARANCE */}
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <Sun size={21} />
            </div>
            <div>
              <h2>Appearance</h2>
              <p>Current interface appearance</p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-theme-options">
              <div className="settings-theme-option selected">
                <Sun size={22} />
                <span>Light Mode</span>
                <span>Selected</span>
              </div>
            </div>

            <p className="settings-muted-note">
              MechVita currently uses the light theme.
            </p>
          </div>

          {/* ACCOUNT */}
          <div className="settings-section-heading">
            <div className="settings-section-icon">
              <LockKeyhole size={21} />
            </div>
            <div>
              <h2>Account Settings</h2>
              <p>Account access and session controls</p>
            </div>
          </div>

          <div className="settings-card settings-account-card">
            <div>
              <h3>Sign out of MechVita</h3>
              <p>End your current authenticated session.</p>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          {/* ACTIONS */}
          <div className="settings-actions">
            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw size={16} />
              Reset Machine Form
            </button>

            <button
              type="button"
              className="settings-primary-button"
              onClick={handleSave}
              disabled={loading || saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {message && (
            <div
              className="settings-message"
              role="status"
              style={{
                color:
                  messageType === "error"
                    ? "#dc2626"
                    : messageType === "success"
                    ? "#15803d"
                    : undefined,
              }}
            >
              {message}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Settings;
