
import React, { useEffect, useState } from "react";
import {
  Activity,
  Thermometer,
  Zap,
  Cpu,
  HeartPulse,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
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

// Reference score curve based on percentage deviation from baseline.
// This is a prototype scoring rule, not an industrially validated model.
const SCORE_CURVE = [
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

  if (deviation >= 100) return 0;

  for (let i = 1; i < SCORE_CURVE.length; i++) {
    const [upperDeviation, upperScore] = SCORE_CURVE[i];
    const [lowerDeviation, lowerScore] = SCORE_CURVE[i - 1];

    if (deviation <= upperDeviation) {
      const ratio =
        (deviation - lowerDeviation) /
        (upperDeviation - lowerDeviation);

      return Math.round(
        lowerScore + ratio * (upperScore - lowerScore)
      );
    }
  }

  return 0;
}

function getHealthStatus(score) {
  if (score === null || score === undefined) return "Waiting";
  if (score >= 82) return "NORMAL";
  if (score >= 76) return "ATTENTION";
  if (score >= 60) return "WARNING";
  if (score >= 50) return "HIGH RISK";
  return "DANGER";
}

function HealthScore() {
  const [readings, setReadings] = useState({
    vibration: null,
    temperature: null,
    current: null,
  });

  const [firebaseError, setFirebaseError] = useState(false);

  
  useEffect(() => {
    const sensorRef = ref(database, "sensor_readings");

    const normalizeTimestamp = (value) => {
      if (value === undefined || value === null) return 0;

      const numeric = Number(value);

      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric < 1e12 ? numeric * 1000 : numeric;
      }

      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const getSensorType = (record) => {
      const type = String(
        record.sensorType ?? record.sensor ?? record.type ?? ""
      ).toLowerCase();

      if (type.includes("vibration") || type.includes("mpu6050")) {
        return "vibration";
      }

      if (
        type.includes("temperature") ||
        type.includes("temp") ||
        type.includes("lm35")
      ) {
        return "temperature";
      }

      if (type.includes("current") || type.includes("acs712")) {
        return "current";
      }

      return null;
    };

    const getSensorValue = (record, type) => {
      const fields = {
        vibration: [
          "vibrationRMS",
          "vibration",
          "vibrationValue",
          "rms",
        ],
        temperature: [
          "temperature",
          "temperatureC",
          "temperatureValue",
          "temp",
        ],
        current: [
          "current",
          "currentA",
          "currentValue",
          "currentAmps",
        ],
      };

      for (const field of fields[type]) {
        const value = record[field];

        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          Number.isFinite(Number(value))
        ) {
          return Number(value);
        }
      }

      return null;
    };

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

        const data = snapshot.val();

        const records = Object.values(data)
          .filter(
            (record) =>
              record &&
              typeof record === "object" &&
              (!record.deviceId ||
                record.deviceId === DEVICE_ID)
          )
          .map((record) => ({
            record,
            timestamp: normalizeTimestamp(record.timestamp),
          }))
          .sort((a, b) => b.timestamp - a.timestamp);

        const latestValue = (type) => {
          for (const item of records) {
            const record = item.record;
            const detectedType = getSensorType(record);

            if (detectedType === type) {
              const value = getSensorValue(record, type);
              if (value !== null) return value;
            }

            // Also support records containing all three readings.
            const value = getSensorValue(record, type);

            if (
              detectedType === null &&
              value !== null
            ) {
              return value;
            }
          }

          return null;
        };

        const nextReadings = {
          vibration: latestValue("vibration"),
          temperature: latestValue("temperature"),
          current: latestValue("current"),
        };

        console.log("Health Score Firebase update:", {
          recordCount: records.length,
          readings: nextReadings,
        });

        setReadings(nextReadings);
        setFirebaseError(false);
      },
      (error) => {
        console.error("Health Score Firebase error:", error);
        setFirebaseError(true);
      }
    );

    return () => unsubscribe();
  }, []);


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

  const allReadingsAvailable =
    readings.vibration !== null &&
    readings.temperature !== null &&
    readings.current !== null;

  const healthScore = allReadingsAvailable
    ? Math.round(
        vibrationScore * WEIGHTS.vibration +
        temperatureScore * WEIGHTS.temperature +
        currentScore * WEIGHTS.current
      )
    : null;

  const status = getHealthStatus(healthScore);
  const StatusIcon =
    status === "NORMAL"
      ? CheckCircle
      : status === "ATTENTION" || status === "WARNING"
      ? AlertTriangle
      : status === "HIGH RISK" || status === "DANGER"
      ? ShieldAlert
      : HeartPulse;

  const ledStates = [
    {
      name: "Green LED",
      condition: "NORMAL",
      description: "Machine operating within its normal health range",
      color: "green",
      active: healthScore !== null && healthScore >= 82,
    },
    {
      name: "Yellow LED",
      condition: "ATTENTION / WARNING",
      description: "Machine health needs attention",
      color: "yellow",
      active:
        healthScore !== null &&
        healthScore >= 60 &&
        healthScore < 82,
    },
    {
      name: "Red LED",
      condition: "HIGH RISK / DANGER",
      description: "Machine health is critically low",
      color: "red",
      active: healthScore !== null && healthScore < 60,
    },
  ];

  const componentScores = [
    {
      name: "Vibration",
      sensor: "MPU6050",
      weight: "40%",
      score: vibrationScore,
      reading: readings.vibration,
      unit: "m/s² RMS",
      icon: Activity,
    },
    {
      name: "Temperature",
      sensor: "LM35DZ",
      weight: "30%",
      score: temperatureScore,
      reading: readings.temperature,
      unit: "°C",
      icon: Thermometer,
    },
    {
      name: "Current",
      sensor: "ACS712",
      weight: "30%",
      score: currentScore,
      reading: readings.current,
      unit: "A",
      icon: Zap,
    },
  ];

  const formatReading = (value, decimals = 2) =>
    value === null ? "--" : value.toFixed(decimals);

  return (
    <div className="dashboard-page health-score-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-topbar">
          <div>
            <h1>Machine Health Score</h1>
            <p>
              Overall machine health calculated from sensor measurements
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
          {/* 1. SELECTED MACHINE */}
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
                ? "Firebase error"
                : allReadingsAvailable
                ? "Sensor readings available"
                : "Awaiting sensor data"}
            </span>
          </div>

          {/* 2. HEALTH SCORE */}
          <div className="overall-health-card">
            <div className="overall-health-heading">
              <div>
                <span className="health-eyebrow">
                  OVERALL MACHINE HEALTH
                </span>
                <h2>Health Score</h2>
              </div>

              <div className="overall-health-icon">
                <HeartPulse size={25} />
              </div>
            </div>

            <div className="health-score-display">
              <div className="health-score-number">
                {healthScore === null ? "--" : healthScore}
                <span>%</span>
              </div>

              <div className="health-status-label">
                <StatusIcon size={18} />
                {status}
              </div>

              <p>
                {firebaseError
                  ? "Unable to read sensor data from Firebase."
                  : healthScore === null
                  ? "All three sensor readings are required to calculate health."
                  : `Current calculated machine health is ${healthScore}%.`}
              </p>
            </div>

            <div className="health-score-scale">
              <span>0</span>
              <div className="health-scale-track">
                <div
                  className="health-scale-marker"
                  style={{
                    left: `${healthScore ?? 0}%`,
                  }}
                ></div>
              </div>
              <span>100%</span>
            </div>
          </div>

          {/* 3. LED STATUS */}
          <div className="health-section-heading">
            <div>
              <h2>Machine LED Status</h2>
              <p>
                Visual indicators for the current machine health condition
              </p>
            </div>
          </div>

          <div className="health-led-panel health-led-horizontal">
            {ledStates.map((led) => (
              <div className="health-led-item" key={led.name}>
                <span
                  className={`health-led-light ${led.color} ${
                    led.active ? "led-active" : "led-inactive"
                  }`}
                ></span>

                <h3>{led.name}</h3>
                <span className="health-led-condition">
                  {led.condition}
                </span>

                <span
                  className={`health-led-state ${
                    led.active ? `state-${led.color}` : ""
                  }`}
                >
                  {healthScore === null
                    ? "INACTIVE"
                    : led.active
                    ? "ACTIVE"
                    : "OFF"}
                </span>
              </div>
            ))}

            <div className="health-led-note">
              <AlertTriangle size={17} />
              <p>
                These are website indicators. Physical ESP32 LEDs require
                corresponding firmware logic and hardware connections.
              </p>
            </div>
          </div>

          {/* 4. HEALTH ASSESSMENT */}
          <div className="health-section-heading">
            <div>
              <h2>Component Health Scores</h2>
              <p>
                Individual sensor scores and their contribution to machine
                health
              </p>
            </div>
          </div>

          <div className="component-health-grid">
            {componentScores.map((component) => {
              const Icon = component.icon;

              return (
                <div
                  className="component-health-card"
                  key={component.name}
                >
                  <div className="component-health-top">
                    <div className="component-health-icon">
                      <Icon size={21} />
                    </div>

                    <span className="component-weight">
                      Weight: {component.weight}
                    </span>
                  </div>

                  <h3>{component.name}</h3>

                  <p className="component-sensor-name">
                    {component.sensor}
                  </p>

                  <div className="component-score-value">
                    {component.score === null
                      ? "--"
                      : component.score}
                    <span>%</span>
                  </div>

                  <p className="component-sensor-name">
                    Reading: {formatReading(component.reading, 3)}{" "}
                    {component.unit}
                  </p>

                  <div className="component-progress-track">
                    <div
                      className="component-progress-fill"
                      style={{
                        width: `${component.score ?? 0}%`,
                      }}
                    ></div>
                  </div>

                  <span className="component-waiting-text">
                    {component.score === null
                      ? "Waiting for sensor data"
                      : "Score calculated from baseline deviation"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 5. HEALTH CLASSIFICATION */}
          <div className="health-section-heading">
            <div>
              <h2>Health Classification</h2>
              <p>Health score ranges used by MechVita</p>
            </div>
          </div>

          <div className="health-classification-grid">
            <div className="classification-item">
              <span className="classification-dot green"></span>
              <div>
                <strong>NORMAL</strong>
                <span>82–100%</span>
              </div>
            </div>

            <div className="classification-item">
              <span className="classification-dot blue"></span>
              <div>
                <strong>ATTENTION</strong>
                <span>76–81%</span>
              </div>
            </div>

            <div className="classification-item">
              <span className="classification-dot yellow"></span>
              <div>
                <strong>WARNING</strong>
                <span>60–75%</span>
              </div>
            </div>

            <div className="classification-item">
              <span className="classification-dot orange"></span>
              <div>
                <strong>HIGH RISK</strong>
                <span>50–59%</span>
              </div>
            </div>

            <div className="classification-item">
              <span className="classification-dot red"></span>
              <div>
                <strong>DANGER</strong>
                <span>0–49%</span>
              </div>
            </div>
          </div>

          {/* SCORING INFORMATION */}
          <div className="health-scoring-note">
            <h3>Health Score Calculation</h3>
            <p>
              Vibration contributes 40%, temperature contributes 30%, and
              current contributes 30% to the overall health score.
            </p>
            <p>
              Component scores are estimated from the percentage deviation
              from each configured healthy baseline. These reference
              baselines and the scoring curve should be calibrated against
              actual machine operating data before industrial use.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HealthScore;
