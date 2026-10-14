
import { useEffect, useState } from "react";
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Activity,
  Thermometer,
  Zap,
  Wrench,
  Clock,
  Cpu,
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

function getSeverity(status) {
  if (status === "DANGER" || status === "HIGH RISK") {
    return "critical";
  }

  if (status === "WARNING" || status === "ATTENTION") {
    return "warning";
  }

  return "normal";
}

function formatValue(value, decimals = 2) {
  return value === null ? "--" : value.toFixed(decimals);
}

function Alerts() {
  const [readings, setReadings] = useState({
    vibration: null,
    temperature: null,
    current: null,
  });

  const [lastUpdated, setLastUpdated] = useState(null);
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
          setLastUpdated(null);
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
            ? {
                value: Number(matching[0][field]),
                timestamp: Number(matching[0].timestamp),
              }
            : null;
        };

        const vibration = latestReading("vibration", "vibrationRMS");
        const temperature = latestReading("temperature", "temperature");
        const current = latestReading("current", "current");

        setReadings({
          vibration: vibration?.value ?? null,
          temperature: temperature?.value ?? null,
          current: current?.value ?? null,
        });

        const timestamps = [vibration, temperature, current]
          .filter(Boolean)
          .map((reading) => reading.timestamp);

        setLastUpdated(
          timestamps.length ? Math.max(...timestamps) : null
        );

        setFirebaseError(false);
      },
      (error) => {
        console.error("Alerts Firebase error:", error);
        setFirebaseError(true);
      }
    );

    return () => unsubscribe();
  }, []);

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
  const severity = getSeverity(healthStatus);

  const alerts = [];

  if (allReadingsAvailable) {
    if (healthStatus === "DANGER" || healthStatus === "HIGH RISK") {
      alerts.push({
        title: `Machine health is ${healthStatus}`,
        description: `The calculated health score is ${healthScore}%. Inspect the machine and verify the sensor readings promptly.`,
        severity: "critical",
      });
    } else if (
      healthStatus === "WARNING" ||
      healthStatus === "ATTENTION"
    ) {
      alerts.push({
        title: `Machine requires attention: ${healthStatus}`,
        description: `The calculated health score is ${healthScore}%. Check the machine condition and monitor the sensor readings.`,
        severity: "warning",
      });
    } else {
      alerts.push({
        title: "Machine health is normal",
        description: `The calculated health score is ${healthScore}%. Continue routine monitoring.`,
        severity: "normal",
      });
    }

    if (vibrationScore < 76) {
      alerts.push({
        title: "Vibration needs inspection",
        description:
          "The vibration component score is below 76%. Check sensor mounting and inspect for possible imbalance, looseness, or unusual vibration.",
        severity: vibrationScore < 60 ? "critical" : "warning",
      });
    }

    if (temperatureScore < 76) {
      alerts.push({
        title: "Temperature needs inspection",
        description:
          "The temperature component score is below 76%. Verify the temperature sensor placement and inspect for possible overheating.",
        severity: temperatureScore < 60 ? "critical" : "warning",
      });
    }

    if (currentScore < 76) {
      alerts.push({
        title: "Current reading needs inspection",
        description:
          "The current component score is below 76%. Verify the current sensor, its calibration, and the machine's electrical load.",
        severity: currentScore < 60 ? "critical" : "warning",
      });
    }
  }

  const criticalCount = alerts.filter(
    (alert) => alert.severity === "critical"
  ).length;

  const warningCount = alerts.filter(
    (alert) => alert.severity === "warning"
  ).length;

  const normalCount = alerts.filter(
    (alert) => alert.severity === "normal"
  ).length;

  const sensors = [
    {
      name: "Vibration",
      sensor: "MPU6050",
      icon: Activity,
      value: readings.vibration,
      unit: "m/s² RMS",
      score: vibrationScore,
    },
    {
      name: "Temperature",
      sensor: "LM35DZ",
      icon: Thermometer,
      value: readings.temperature,
      unit: "°C",
      score: temperatureScore,
    },
    {
      name: "Current",
      sensor: "ACS712",
      icon: Zap,
      value: readings.current,
      unit: "A",
      score: currentScore,
    },
  ];

  const suggestions = [];

  if (allReadingsAvailable) {
    if (healthStatus === "NORMAL") {
      suggestions.push({
        title: "Continue routine monitoring",
        description:
          "Keep monitoring vibration, temperature, and current. Follow the machine's regular maintenance schedule.",
      });
    } else {
      suggestions.push({
        title: "Inspect machine condition",
        description:
          "Review the current sensor readings and inspect the machine before deciding whether maintenance is required.",
      });
    }

    if (vibrationScore < 76) {
      suggestions.push({
        title: "Check vibration and mounting",
        description:
          "Ensure the MPU6050 is firmly mounted and check for looseness, imbalance, or unusual vibration.",
      });
    }

    if (temperatureScore < 76) {
      suggestions.push({
        title: "Check temperature and cooling",
        description:
          "Verify the LM35DZ placement and check the machine for possible overheating or cooling issues.",
      });
    }

    if (currentScore < 76) {
      suggestions.push({
        title: "Verify electrical load",
        description:
          "Check ACS712 wiring and calibration. Compare the measured current with the machine's rated operating current.",
      });
    }
  }

  const formatTimestamp = (timestamp) => {
    if (timestamp === null) return "No timestamp available";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "Invalid timestamp";
    }

    return date.toLocaleString();
  };

  return (
    <div className="dashboard-page alerts-page">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h1>Alerts &amp; Suggestions</h1>
            <p>
              Machine abnormalities, warnings, and recommended actions
            </p>
          </div>

          <div className="dashboard-live-badge">
            <span className="topbar-live">
              <span></span>
              LIVE
            </span>
          </div>
        </header>

        <section className="dashboard-content">
          {/* MONITORED MACHINE */}
          <div className="health-machine-card">
            <div className="health-machine-info">
              <div className="health-machine-icon">
                <Cpu size={24} />
              </div>

              <div>
                <span className="health-eyebrow">
                  MONITORED MACHINE
                </span>
                <h2>Ring Frame</h2>
                <p>{DEVICE_ID}</p>
              </div>
            </div>

            <span className="health-waiting-badge">
              <span></span>
              {firebaseError
                ? "Firebase connection error"
                : allReadingsAvailable
                ? `Status: ${healthStatus}`
                : "Awaiting all sensor data"}
            </span>
          </div>

          {/* ALERT SUMMARY */}
          <div className="health-section-heading">
            <div>
              <h2>Alerts Overview</h2>
              <p>Summary of the machine's current condition</p>
            </div>
          </div>

          <div className="alert-summary-grid">
            {[
              {
                label: "Critical",
                value: allReadingsAvailable ? criticalCount : "--",
                icon: ShieldAlert,
                color: "red",
              },
              {
                label: "Warnings",
                value: allReadingsAvailable ? warningCount : "--",
                icon: AlertTriangle,
                color: "yellow",
              },
              {
                label: "Normal",
                value: allReadingsAvailable ? normalCount : "--",
                icon: CheckCircle,
                color: "green",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="alert-summary-card" key={item.label}>
                  <div className={`alert-summary-icon ${item.color}`}>
                    <Icon size={22} />
                  </div>

                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MACHINE ALERTS */}
          <div className="health-section-heading">
            <div>
              <h2>Machine Alerts</h2>
              <p>Abnormal sensor readings and health warnings</p>
            </div>
          </div>

          {firebaseError ? (
            <div className="alerts-empty-card">
              <div className="alerts-empty-icon">
                <AlertTriangle size={27} />
              </div>
              <h3>Unable to load sensor data</h3>
              <p>
                Check your Firebase connection and Realtime Database
                security rules.
              </p>
            </div>
          ) : !allReadingsAvailable ? (
            <div className="alerts-empty-card">
              <div className="alerts-empty-icon">
                <BellRing size={27} />
              </div>
              <h3>Waiting for all sensor readings</h3>
              <p>
                Alerts will be calculated when valid vibration,
                temperature, and current readings are available.
              </p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert, index) => {
                const Icon =
                  alert.severity === "critical"
                    ? ShieldAlert
                    : alert.severity === "warning"
                    ? AlertTriangle
                    : CheckCircle;

                return (
                  <div
                    className={`alerts-empty-card alert-result-card ${alert.severity}`}
                    key={`${alert.title}-${index}`}
                  >
                    <div className="alerts-empty-icon">
                      <Icon size={25} />
                    </div>
                    <h3>{alert.title}</h3>
                    <p>{alert.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* SENSOR MONITORING */}
          <div className="health-section-heading">
            <div>
              <h2>Monitored Conditions</h2>
              <p>Live sensor readings and calculated component scores</p>
            </div>
          </div>

          <div className="alert-sensor-grid">
            {sensors.map((sensor) => {
              const Icon = sensor.icon;

              const sensorStatus =
                sensor.score === null
                  ? "Waiting for data"
                  : sensor.score >= 82
                  ? "Normal"
                  : sensor.score >= 60
                  ? "Needs attention"
                  : "Needs inspection";

              return (
                <div className="alert-sensor-card" key={sensor.name}>
                  <div className="component-health-icon">
                    <Icon size={21} />
                  </div>

                  <h3>{sensor.name}</h3>
                  <p>{sensor.sensor}</p>

                  <strong>
                    {formatValue(sensor.value, 3)}{" "}
                    {sensor.value === null ? "" : sensor.unit}
                  </strong>

                  <p>
                    Component score:{" "}
                    {sensor.score === null ? "--" : `${sensor.score}%`}
                  </p>

                  <span className="alert-pending-status">
                    <span></span>
                    {sensorStatus}
                  </span>
                </div>
              );
            })}
          </div>

          {/* SUGGESTIONS */}
          <div className="health-section-heading">
            <div>
              <h2>Suggestions &amp; Recommended Actions</h2>
              <p>Maintenance actions based on detected conditions</p>
            </div>
          </div>

          {!allReadingsAvailable ? (
            <div className="alerts-empty-card suggestions-empty-card">
              <div className="alerts-empty-icon">
                <Wrench size={27} />
              </div>

              <h3>Recommendations will appear here</h3>

              <p>
                MechVita needs all three sensor readings before generating
                condition-based suggestions.
              </p>
            </div>
          ) : (
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div
                  className="alerts-empty-card suggestions-empty-card"
                  key={`${suggestion.title}-${index}`}
                >
                  <div className="alerts-empty-icon">
                    <Wrench size={25} />
                  </div>
                  <h3>{suggestion.title}</h3>
                  <p>{suggestion.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* INFORMATION */}
          <div className="alert-information">
            <Clock size={18} />

            <p>
              {lastUpdated !== null
                ? `Latest sensor timestamp: ${formatTimestamp(lastUpdated)}. `
                : ""}
              Health scores and alerts use prototype baseline values.
              Confirm calibration and machine-specific thresholds before
              relying on them for industrial maintenance decisions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Alerts;
