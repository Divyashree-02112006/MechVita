
import { useEffect, useState } from "react";
import {
  Activity,
  Thermometer,
  Zap,
  Radio,
  Cpu,
  Clock3,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import Sidebar from "../components/Sidebar";

const DEVICE_ID = "SPINNING_DEVICE_001";

const EMPTY_READINGS = {
  vibration: null,
  temperature: null,
  current: null,
};

function normalizeTimestamp(value) {
  if (value === undefined || value === null || value === "") {
    return Date.now();
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric) && numeric > 0) {
    // Convert Unix seconds to milliseconds when necessary.
    return numeric < 100000000000 ? numeric * 1000 : numeric;
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function getNumericValue(record, fields) {
  for (const field of fields) {
    const value = record?.[field];

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
}

function normalizeSensorType(record) {
  const type = String(
    record?.sensorType ??
      record?.sensor ??
      record?.type ??
      ""
  )
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (
    type.includes("vibration") ||
    type.includes("mpu6050")
  ) {
    return "vibration";
  }

  if (
    type.includes("temperature") ||
    type.includes("temp") ||
    type.includes("lm35")
  ) {
    return "temperature";
  }

  if (
    type.includes("current") ||
    type.includes("acs712")
  ) {
    return "current";
  }

  return null;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LiveSensors() {
  const [readings, setReadings] = useState(EMPTY_READINGS);

  const [vibrationData, setVibrationData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [currentData, setCurrentData] = useState([]);

  const [firebaseError, setFirebaseError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionState, setConnectionState] = useState("connecting");

  useEffect(() => {
    const sensorRef = ref(database, "sensor_readings");

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setReadings(EMPTY_READINGS);
          setVibrationData([]);
          setTemperatureData([]);
          setCurrentData([]);
          setLastUpdated(null);
          setFirebaseError("");
          setConnectionState("waiting");
          return;
        }

        const rawData = snapshot.val();

        const records = Object.entries(rawData).map(
          ([key, value]) => ({
            ...(
              value && typeof value === "object"
                ? value
                : {}
            ),
            _key: key,
          })
        );

        // Support records with a device ID and records where the
        // device ID is stored under a slightly different property.
        const deviceRecords = records.filter((record) => {
          const recordDeviceId =
            record.deviceId ??
            record.device_id ??
            record.deviceID;

          // Do not display records explicitly belonging to another device.
          return (
            recordDeviceId === undefined ||
            recordDeviceId === null ||
            recordDeviceId === "" ||
            recordDeviceId === DEVICE_ID
          );
        });

        const sensorRecords = [];

        deviceRecords.forEach((record) => {
          const type = normalizeSensorType(record);

          const timestamp = normalizeTimestamp(
            record.timestamp ??
              record.createdAt ??
              record.updatedAt ??
              record.time
          );

          // Individual vibration record.
          const vibration = getNumericValue(record, [
            "vibrationRMS",
            "vibration",
            "vibrationValue",
            "rms",
          ]);

          // Individual temperature record.
          const temperature = getNumericValue(record, [
            "temperature",
            "temperatureC",
            "temperatureValue",
            "temp",
          ]);

          // Individual current record.
          const current = getNumericValue(record, [
            "current",
            "currentA",
            "currentValue",
            "currentAmps",
          ]);

          if (type === "vibration" && vibration !== null) {
            sensorRecords.push({
              type: "vibration",
              value: vibration,
              timestamp,
              key: record._key,
            });
          } else if (
            type === "temperature" &&
            temperature !== null
          ) {
            sensorRecords.push({
              type: "temperature",
              value: temperature,
              timestamp,
              key: record._key,
            });
          } else if (type === "current" && current !== null) {
            sensorRecords.push({
              type: "current",
              value: current,
              timestamp,
              key: record._key,
            });
          } else {
            // Also support a single record containing all three
            // sensor readings instead of separate sensor records.
            if (vibration !== null) {
              sensorRecords.push({
                type: "vibration",
                value: vibration,
                timestamp,
                key: record._key,
              });
            }

            if (temperature !== null) {
              sensorRecords.push({
                type: "temperature",
                value: temperature,
                timestamp,
                key: record._key,
              });
            }

            if (current !== null) {
              sensorRecords.push({
                type: "current",
                value: current,
                timestamp,
                key: record._key,
              });
            }
          }
        });

        const getRecords = (type) =>
          sensorRecords
            .filter((record) => record.type === type)
            .sort((a, b) => a.timestamp - b.timestamp);

        const vibrationRecords = getRecords("vibration");
        const temperatureRecords = getRecords("temperature");
        const currentRecords = getRecords("current");

        const getLatest = (records) =>
          records.length ? records[records.length - 1] : null;

        const latestVibration = getLatest(vibrationRecords);
        const latestTemperature = getLatest(temperatureRecords);
        const latestCurrent = getLatest(currentRecords);

        setReadings({
          vibration: latestVibration,
          temperature: latestTemperature,
          current: latestCurrent,
        });

        const timestamps = [
          latestVibration,
          latestTemperature,
          latestCurrent,
        ]
          .filter(Boolean)
          .map((record) => record.timestamp);

        setLastUpdated(
          timestamps.length ? Math.max(...timestamps) : null
        );

        const toChartData = (records) =>
          records.slice(-20).map((record) => ({
            time: formatTime(record.timestamp),
            value: record.value,
            timestamp: record.timestamp,
          }));

        setVibrationData(toChartData(vibrationRecords));
        setTemperatureData(toChartData(temperatureRecords));
        setCurrentData(toChartData(currentRecords));

        setFirebaseError("");
        setConnectionState(
          sensorRecords.length ? "connected" : "waiting"
        );

        console.log("Live Sensors Firebase update:", {
          totalRecords: records.length,
          matchedRecords: deviceRecords.length,
          vibrationRecords: vibrationRecords.length,
          temperatureRecords: temperatureRecords.length,
          currentRecords: currentRecords.length,
          latestReadings: {
            vibration: latestVibration?.value ?? null,
            temperature: latestTemperature?.value ?? null,
            current: latestCurrent?.value ?? null,
          },
        });
      },
      (error) => {
        console.error("Firebase sensor read failed:", error);
        setFirebaseError(
          "Unable to read sensor data. Check Firebase connection and database rules."
        );
        setConnectionState("error");
      }
    );

    return () => unsubscribe();
  }, []);

  const formatReading = (reading, decimals = 2) =>
    reading === null ? "--" : reading.value.toFixed(decimals);

  const sensorStatus = (reading) =>
    reading === null ? "Waiting" : "Receiving";

  const renderChart = (data, color, unit) => {
    if (!data.length) {
      return (
        <div className="chart-empty">
          <Activity size={30} />
          <span>Waiting for sensor data</span>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: -15, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            width={48}
            domain={["auto", "auto"]}
          />
          <Tooltip
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value) => [`${value} ${unit}`, "Reading"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderSensorCard = ({
    title,
    sensor,
    icon: Icon,
    reading,
    decimals,
    unit,
    baseline,
  }) => (
    <div className="live-sensor-card" key={title}>
      <div className="live-sensor-card-top">
        <div className="live-sensor-icon">
          <Icon size={22} />
        </div>

        <span
          className={`sensor-status ${
            reading === null ? "waiting" : "normal"
          }`}
        >
          {sensorStatus(reading)}
        </span>
      </div>

      <div className="live-sensor-title">
        <h3>{title}</h3>
        <p>{sensor}</p>
      </div>

      <div className="live-sensor-value">
        {formatReading(reading, decimals)}
        <span>{unit}</span>
      </div>

      <div className="sensor-baseline">
        Baseline: <strong>{baseline}</strong>
      </div>
    </div>
  );

  const sensorStatusCard = ({
    title,
    sensor,
    icon: Icon,
    reading,
  }) => (
    <div className="sensor-status-card" key={title}>
      <div className="sensor-status-left">
        <Icon size={20} />
        <div>
          <strong>{title}</strong>
          <span>{sensor}</span>
        </div>
      </div>

      <div
        className={
          reading === null
            ? "status-waiting"
            : "status-waiting sensor-receiving"
        }
      >
        <span></span>
        {sensorStatus(reading)}
      </div>
    </div>
  );

  return (
    <div className="dashboard-page live-sensors-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-topbar">
          <div>
            <h1>Live Sensor Monitoring</h1>
            <p>
              Real-time sensor readings from the selected machine
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
          <div className="live-machine-card">
            <div className="live-machine-info">
              <div className="live-machine-icon">
                <Cpu size={24} />
              </div>

              <div>
                <span className="section-label">
                  MONITORED MACHINE
                </span>
                <h2>Ring Frame</h2>
                <p>{DEVICE_ID}</p>
              </div>
            </div>

            <div className="connection-status">
              <span className="connection-dot"></span>
              {firebaseError
                ? "Connection error"
                : connectionState === "connected"
                ? "Receiving Firebase data"
                : connectionState === "connecting"
                ? "Connecting to Firebase"
                : "Waiting for sensor data"}
            </div>
          </div>

          {firebaseError && (
            <div className="alert-information" role="alert">
              <AlertTriangle size={18} />
              <p>{firebaseError}</p>
            </div>
          )}

          {/* LIVE SENSOR CARDS */}
          <div className="live-sensor-grid">
            {renderSensorCard({
              title: "Vibration",
              sensor: "MPU6050",
              icon: Activity,
              reading: readings.vibration,
              decimals: 3,
              unit: "m/s² RMS",
              baseline: "1.00 m/s² RMS",
            })}

            {renderSensorCard({
              title: "Temperature",
              sensor: "LM35DZ",
              icon: Thermometer,
              reading: readings.temperature,
              decimals: 2,
              unit: "°C",
              baseline: "45°C",
            })}

            {renderSensorCard({
              title: "Current",
              sensor: "ACS712",
              icon: Zap,
              reading: readings.current,
              decimals: 3,
              unit: "A",
              baseline: "2.00 A",
            })}
          </div>

          {/* SENSOR TRENDS */}
          <div className="live-section-header">
            <div>
              <h2>Sensor Trends</h2>
              <p>
                Timestamped sensor readings received from Firebase
              </p>
            </div>
          </div>

          <div className="sensor-chart-grid">
            <div className="sensor-chart-card">
              <div className="chart-header">
                <div>
                  <h3>Vibration Trend</h3>
                  <p>m/s² RMS</p>
                </div>
                <Activity size={19} />
              </div>

              <div className="sensor-chart">
                {renderChart(vibrationData, "#3563a9", "m/s² RMS")}
              </div>
            </div>

            <div className="sensor-chart-card">
              <div className="chart-header">
                <div>
                  <h3>Temperature Trend</h3>
                  <p>°C</p>
                </div>
                <Thermometer size={19} />
              </div>

              <div className="sensor-chart">
                {renderChart(temperatureData, "#e58a2b", "°C")}
              </div>
            </div>

            <div className="sensor-chart-card">
              <div className="chart-header">
                <div>
                  <h3>Current Trend</h3>
                  <p>A</p>
                </div>
                <Zap size={19} />
              </div>

              <div className="sensor-chart">
                {renderChart(currentData, "#16a085", "A")}
              </div>
            </div>
          </div>

          {/* SENSOR STATUS */}
          <div className="live-section-header">
            <div>
              <h2>Sensor Status</h2>
              <p>Availability of sensor readings in Firebase</p>
            </div>
          </div>

          <div className="sensor-status-grid">
            {sensorStatusCard({
              title: "Vibration",
              sensor: "MPU6050",
              icon: Activity,
              reading: readings.vibration,
            })}

            {sensorStatusCard({
              title: "Temperature",
              sensor: "LM35DZ",
              icon: Thermometer,
              reading: readings.temperature,
            })}

            {sensorStatusCard({
              title: "Current",
              sensor: "ACS712",
              icon: Zap,
              reading: readings.current,
            })}
          </div>

          {/* MEASUREMENT INFORMATION */}
          <div className="live-section-header">
            <div>
              <h2>Measurement Information</h2>
              <p>Current monitoring configuration</p>
            </div>
          </div>

          <div className="measurement-info-grid">
            <div className="measurement-item">
              <Clock3 size={19} />
              <div>
                <span>Last Firebase update</span>
                <strong>
                  {lastUpdated ? formatTime(lastUpdated) : "--"}
                </strong>
              </div>
            </div>

            <div className="measurement-item">
              <Activity size={19} />
              <div>
                <span>Vibration sensor</span>
                <strong>MPU6050</strong>
              </div>
            </div>

            <div className="measurement-item">
              <Thermometer size={19} />
              <div>
                <span>Temperature sensor</span>
                <strong>LM35DZ</strong>
              </div>
            </div>

            <div className="measurement-item">
              <Zap size={19} />
              <div>
                <span>Current sensor</span>
                <strong>ACS712</strong>
              </div>
            </div>

            <div className="measurement-item">
              <Radio size={19} />
              <div>
                <span>Device</span>
                <strong>ESP32</strong>
              </div>
            </div>

            <div className="measurement-item">
              <CheckCircle size={19} />
              <div>
                <span>Device ID</span>
                <strong>{DEVICE_ID}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LiveSensors;
