
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Gauge,
  Cpu,
  Thermometer,
  Zap,
  CircleCheck,
  Clock3,
} from "lucide-react";

import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import Sidebar from "../components/Sidebar";

const DEVICE_ID = "SPINNING_DEVICE_001";

const BASELINES = {
  vibration: 1.0,
  temperature: 45.0,
  current: 2.0,
};

const WEIGHTS = {
  vibration: 0.4,
  temperature: 0.3,
  current: 0.3,
};

// Prototype score based on percentage deviation from the baseline.
function scoreFromDeviation(value, baseline) {
  if (
    value === null ||
    !Number.isFinite(value) ||
    !Number.isFinite(baseline) ||
    baseline <= 0
  ) {
    return null;
  }

  const deviation = (Math.abs(value - baseline) / baseline) * 100;

  const curve = [
    [0, 100],
    [5, 98],
    [10, 95],
    [20, 90],
    [30, 82],
    [40, 72],
    [50, 60],
    [60, 48],
    [75, 30],
    [100, 10],
  ];

  if (deviation >= 100) return 0;

  for (let i = 1; i < curve.length; i++) {
    const [previousDeviation, previousScore] = curve[i - 1];
    const [nextDeviation, nextScore] = curve[i];

    if (deviation <= nextDeviation) {
      const ratio =
        (deviation - previousDeviation) /
        (nextDeviation - previousDeviation);

      return Math.round(
        previousScore + ratio * (nextScore - previousScore)
      );
    }
  }

  return 0;
}

function getHealthStatus(score) {
  if (score === null) return "WAITING";
  if (score >= 82) return "NORMAL";
  if (score >= 76) return "ATTENTION";
  if (score >= 60) return "WARNING";
  if (score >= 50) return "HIGH RISK";
  return "DANGER";
}

function Dashboard() {
  const navigate = useNavigate();

  const [readings, setReadings] = useState({
    vibration: null,
    temperature: null,
    current: null,
  });

  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    const sensorRef = ref(database, "sensor_readings");

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setReadings({
            vibration: null,
            temperature: null,
            current: null,
          });
          setFirebaseError(false);
          return;
        }

        const records = Object.values(snapshot.val()).filter(
          (record) => record?.deviceId === DEVICE_ID
        );

        const latestReading = (sensorType, field) => {
          const matching = records
            .filter(
              (record) =>
                record.sensorType === sensorType &&
                record[field] !== undefined &&
                record[field] !== null &&
                Number.isFinite(Number(record[field])) &&
                Number.isFinite(Number(record.timestamp))
            )
            .sort(
              (a, b) =>
                Number(b.timestamp) - Number(a.timestamp)
            );

          return matching.length
            ? Number(matching[0][field])
            : null;
        };

        setReadings({
          vibration: latestReading("vibration", "vibrationRMS"),
          temperature: latestReading("temperature", "temperature"),
          current: latestReading("current", "current"),
        });

        setFirebaseError(false);
      },
      (error) => {
        console.error("Dashboard Firebase error:", error);
        setFirebaseError(true);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleMachineSelection = () => {
    navigate("/machine-selection");
  };

  const formatValue = (value, decimals = 2) =>
    value === null ? "--" : value.toFixed(decimals);

  const hasSensorData = Object.values(readings).some(
    (value) => value !== null
  );

  const allReadingsAvailable = Object.values(readings).every(
    (value) => value !== null && Number.isFinite(value)
  );

  const vibrationScore = scoreFromDeviation(
    readings.vibration,
    BASELINES.vibration
  );

  const temperatureScore = scoreFromDeviation(
    readings.temperature,
    BASELINES.temperature
  );

  const currentScore = scoreFromDeviation(
    readings.current,
    BASELINES.current
  );

  const healthScore = allReadingsAvailable
    ? Math.round(
        vibrationScore * WEIGHTS.vibration +
          temperatureScore * WEIGHTS.temperature +
          currentScore * WEIGHTS.current
      )
    : null;

  const healthStatus = getHealthStatus(healthScore);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="dashboard-main">
        {/* TOP BAR */}
        <header className="dashboard-topbar">
          <div className="topbar-heading">
            <div className="topbar-title-row">
              <h1>Machine Health Dashboard</h1>
              <span className="topbar-live">
                <span></span>
                LIVE
              </span>
            </div>
            <p>Real-time monitoring and machine condition analysis</p>
          </div>

          <div className="dashboard-user">
            <div className="dashboard-user-icon">A</div>
            <div className="dashboard-user-info">
              <strong>Admin</strong>
              <span>Monitoring User</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* MACHINE OVERVIEW */}
          <section className="machine-overview">
            <div className="machine-overview-left">
              <div className="machine-icon">
                <Cpu size={27} />
              </div>

              <div>
                <span className="dashboard-section-label">
                  SELECTED MACHINE
                </span>
                <h2>Ring Frame</h2>
                <p>{DEVICE_ID}</p>
              </div>
            </div>

            <button
              className="dashboard-select-machine-button"
              onClick={handleMachineSelection}
            >
              <Cpu size={17} />
              Select Machine
            </button>
          </section>

          {/* SUMMARY CARDS */}
          <section className="dashboard-summary-grid">
            <div className="summary-card machine-card">
              <div className="summary-card-top">
                <div className="summary-icon">
                  <Cpu size={21} />
                </div>
                <span className="summary-tag">CONFIGURED</span>
              </div>

              <div className="summary-card-content">
                <span>Machine</span>
                <strong>Ring Frame</strong>
                <small>{DEVICE_ID}</small>
              </div>
            </div>

            <div className="summary-card health-card">
              <div className="summary-card-top">
                <div className="summary-icon">
                  <Gauge size={21} />
                </div>
                <span className="summary-tag waiting">
                  {allReadingsAvailable ? "CALCULATED" : "WAITING"}
                </span>
              </div>

              <div className="summary-card-content">
                <span>Health Score</span>
                <strong>
                  {healthScore === null ? "--%" : `${healthScore}%`}
                </strong>
                <small>
                  {healthScore === null
                    ? "Waiting for all three sensor readings"
                    : "Calculated from vibration, temperature and current"}
                </small>
              </div>
            </div>

            <div className="summary-card status-card">
              <div className="summary-card-top">
                <div className="summary-icon">
                  <Activity size={21} />
                </div>
                <span className="summary-tag waiting">
                  {firebaseError
                    ? "ERROR"
                    : allReadingsAvailable
                    ? "ANALYZED"
                    : hasSensorData
                    ? "RECEIVING"
                    : "WAITING"}
                </span>
              </div>

              <div className="summary-card-content">
                <span>Machine Status</span>
                <strong>{healthStatus}</strong>
                <small>
                  {firebaseError
                    ? "Unable to read Firebase"
                    : healthScore === null
                    ? "Waiting for all sensor readings"
                    : "Based on the calculated health score"}
                </small>
              </div>
            </div>
          </section>

          {/* LIVE SENSOR READINGS */}
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <span className="dashboard-section-label">
                  REAL-TIME DATA
                </span>
                <h2>Live Sensor Readings</h2>
                <p>
                  Current measurements from connected machine sensors
                </p>
              </div>

              <div className="sensor-live-status">
                <span></span>
                {firebaseError ? "Connection Error" : "Firebase"}
              </div>
            </div>

            <section className="sensor-reading-grid">
              <div className="sensor-reading-card vibration-card">
                <div className="sensor-card-top">
                  <div className="reading-icon">
                    <Activity size={23} />
                  </div>
                  <div className="sensor-status">
                    <span></span>
                    {readings.vibration === null ? "WAITING" : "RECEIVED"}
                  </div>
                </div>

                <span className="sensor-name">Vibration</span>

                <div className="reading-value">
                  {formatValue(readings.vibration, 3)}
                  <small>m/s² RMS</small>
                </div>

                <div className="sensor-card-footer">
                  <span>MPU6050</span>
                  <span>Vibration Sensor</span>
                </div>
              </div>

              <div className="sensor-reading-card temperature-card">
                <div className="sensor-card-top">
                  <div className="reading-icon">
                    <Thermometer size={23} />
                  </div>
                  <div className="sensor-status">
                    <span></span>
                    {readings.temperature === null ? "WAITING" : "RECEIVED"}
                  </div>
                </div>

                <span className="sensor-name">Temperature</span>

                <div className="reading-value">
                  {formatValue(readings.temperature, 2)}
                  <small>°C</small>
                </div>

                <div className="sensor-card-footer">
                  <span>LM35DZ</span>
                  <span>Temperature Sensor</span>
                </div>
              </div>

              <div className="sensor-reading-card current-card">
                <div className="sensor-card-top">
                  <div className="reading-icon">
                    <Zap size={23} />
                  </div>
                  <div className="sensor-status">
                    <span></span>
                    {readings.current === null ? "WAITING" : "RECEIVED"}
                  </div>
                </div>

                <span className="sensor-name">Current</span>

                <div className="reading-value">
                  {formatValue(readings.current, 3)}
                  <small>A</small>
                </div>

                <div className="sensor-card-footer">
                  <span>ACS712</span>
                  <span>Current Sensor</span>
                </div>
              </div>
            </section>

            {firebaseError && (
              <p role="alert">
                Unable to read sensor data. Check Firebase connection and
                database security rules.
              </p>
            )}
          </section>

          {/* HEALTH OVERVIEW */}
          <section className="health-panel">
            <div className="dashboard-section-header">
              <div>
                <span className="dashboard-section-label">
                  MACHINE CONDITION
                </span>
                <h2>Overall Health</h2>
                <p>Combined machine health based on sensor analysis</p>
              </div>
              <Clock3 size={21} />
            </div>

            <div className="health-score-content">
              <div
  className="health-score-circle"
  style={{
    background:
      healthScore === null
        ? "#edf0f4"
        : `conic-gradient(${
            healthScore >= 82
              ? "#16a34a"
              : healthScore >= 60
              ? "#eab308"
              : "#dc2626"
          } ${healthScore}%, #edf0f4 ${healthScore}% 100%)`,
  }}
>
                <div className="health-score-inner">
                  <strong>
                    {healthScore === null ? "--" : healthScore}
                  </strong>
                  <span>Health Score</span>
                </div>
              </div>

              <div className="health-analysis">
                <div className="health-waiting">
                  <CircleCheck size={20} />
                  <span>
                    {healthScore === null
                      ? "Health calculation pending"
                      : `Machine health: ${healthStatus}`}
                  </span>
                </div>

                <h3>
                  {healthScore === null
                    ? "Waiting for sensor readings"
                    : `Machine status: ${healthStatus}`}
                </h3>

                <p>
                  {healthScore === null
                    ? "MechVita needs valid vibration, temperature, and current readings to calculate the machine health score."
                    : "The score is calculated using the current sensor readings, configured baseline values, and weighted component scores. This is a prototype estimate and should be calibrated before industrial use."}
                </p>

                <div className="health-factors">
                  <div>
                    <span>Vibration Score (40%)</span>
                    <strong>
                      {vibrationScore === null
                        ? "--"
                        : `${vibrationScore}%`}
                    </strong>
                  </div>
                  <div>
                    <span>Temperature Score (30%)</span>
                    <strong>
                      {temperatureScore === null
                        ? "--"
                        : `${temperatureScore}%`}
                    </strong>
                  </div>
                  <div>
                    <span>Current Score (30%)</span>
                    <strong>
                      {currentScore === null ? "--" : `${currentScore}%`}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ALERTS */}
          <section className="dashboard-section alerts-section">
            <div className="dashboard-section-header">
              <div>
                <span className="dashboard-section-label">
                  MACHINE INSIGHTS
                </span>
                <h2>Alerts &amp; Suggestions</h2>
                <p>
                  Maintenance recommendations based on machine condition
                </p>
              </div>
              <Bell size={21} />
            </div>

            <div className="alert-empty">
              <div className="alert-empty-icon">
                <Bell size={23} />
              </div>

              <div>
                <h3>
                  {healthScore === null
                    ? "No calculated alerts yet"
                    : healthStatus === "NORMAL"
                    ? "Machine condition is normal"
                    : `Machine status: ${healthStatus}`}
                </h3>
                <p>
                  {healthScore === null
                    ? "Alerts and maintenance suggestions will appear after MechVita evaluates all three real sensor readings."
                    : healthStatus === "NORMAL"
                    ? "The calculated score is currently in the normal range. Continue monitoring the live sensor readings."
                    : "The calculated score is outside the normal range. Check the sensor readings and inspect the machine as appropriate."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
