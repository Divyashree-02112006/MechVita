import { useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  Menu,
  X,
  Thermometer,
  Zap,
  Vibrate,
  ArrowRight,
  LogIn,
  Wifi,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import mechvitaLogo from "../assets/mechvita-navbar.png";
import mpu6050Image from "../assets/mpu6050.png";
import lm35dzImage from "../assets/lm35dz.png";
import acs712Image from "../assets/acs712.png";

import "../index.css";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMenuOpen(false);
  };

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}

      <header className="navbar">
        <div className="nav-container">

          <div className="logo">
            <img
              src={mechvitaLogo}
              alt="MechVita - IoT Based Machine Health Monitoring System"
            />
          </div>

          {/* Desktop Navigation */}

          <nav
            className={`nav-links ${
              menuOpen ? "mobile-open" : ""
            }`}
          >

            <button onClick={() => scrollToSection("about")}>
              About Project
            </button>

            <button onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>

            <button onClick={() => scrollToSection("sensors")}>
              Sensors
            </button>

            <button onClick={() => scrollToSection("thresholds")}>
              Threshold Values
            </button>

            <button
              className="login-nav-button"
              onClick={() => navigate("/login")}
            >
              <LogIn size={17} />
              Login
            </button>

          </nav>

          {/* Mobile Menu */}

          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>

        </div>
      </header>


      {/* ================= MAIN ================= */}

      <main>

        {/* ================= HERO ================= */}

        <section className="hero-section">

          <div className="hero-content">

            <div className="hero-badge">
              <span className="status-dot"></span>

              IoT-Based Machine Health Monitoring
            </div>


            <h1>
              IoT Based
              <span>
                Machine Health Monitoring System
              </span>
            </h1>


            <p>
              MechVita continuously monitors machine vibration,
              temperature and current to understand machine health,
              identify abnormal conditions and support timely
              maintenance decisions.
            </p>


            <button
              className="primary-button"
              onClick={() => navigate("/login")}
            >
              Explore MechVita

              <ArrowRight size={18} />
            </button>

          </div>


          {/* Product Visual */}

          <div className="product-visual">

            <div className="product-card">

              <div className="product-card-header">

                <span>
                  MECHVITA MONITORING UNIT
                </span>

                <span className="online-badge">
                  IoT READY
                </span>

              </div>


              <div className="device-illustration">

                <div className="device-box">

                  <div className="device-display">

                    <span>
                      MACHINE HEALTH
                    </span>

                    <strong>
                      0–100%
                    </strong>

                    <small>
                      HEALTH SCORE
                    </small>

                  </div>


                  <div className="device-board">

                    <div className="board-chip"></div>

                    <div className="board-chip small"></div>

                    <div className="sensor-pin pin-1"></div>

                    <div className="sensor-pin pin-2"></div>

                    <div className="sensor-pin pin-3"></div>

                  </div>

                </div>

              </div>


              <div className="product-label">

                <Cpu size={17} />

                ESP32 Monitoring Unit

              </div>

            </div>

          </div>

        </section>


        {/* ================= ABOUT ================= */}

        <section
          id="about"
          className="content-section about-section"
        >

          <div className="section-heading">

           

            <h2>
              About the Project
            </h2>

          </div>


          <div className="about-grid">

            <div className="about-text">

              <h3>
                Understanding machine health before failure.
              </h3>


              <p>
                Industrial machines operate continuously and their
                internal components can gradually deteriorate without
                immediately showing visible signs of failure.
              </p>


              <p>
                MechVita continuously monitors important machine
                parameters using vibration, temperature and current
                sensors. The collected data is processed by an ESP32
                and sent to Firebase for real-time monitoring.
              </p>


              <p>
                The sensor conditions are evaluated to generate a
                machine health score, helping identify abnormal
                behaviour and supporting timely maintenance decisions.
              </p>

            </div>


            <div className="about-features">

              <div className="feature-card">

                <Activity />

                <div>

                  <h4>
                    Continuous Monitoring
                  </h4>

                  <p>
                    Monitor machine condition using multiple
                    physical parameters.
                  </p>

                </div>

              </div>


              <div className="feature-card">

                <Wifi />

                <div>

                  <h4>
                    IoT Connectivity
                  </h4>

                  <p>
                    Send machine readings through ESP32
                    for real-time cloud monitoring.
                  </p>

                </div>

              </div>


              <div className="feature-card">

                <BarChart3 />

                <div>

                  <h4>
                    Health Analysis
                  </h4>

                  <p>
                    Combine sensor conditions to understand
                    overall machine health.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ================= HOW IT WORKS ================= */}

        <section
          id="how-it-works"
          className="content-section how-section"
        >

          <div className="section-heading">

           

            <h2>
              How MechVita Works
            </h2>

          </div>


          <p className="section-description how-intro">

            MechVita follows a continuous monitoring pipeline where
            machine condition is sensed, processed, stored and
            transformed into meaningful health information.

          </p>


          {/* Process Flow */}

          <div className="process-visual">

            <div className="process-step">

              <div className="process-number">
                01
              </div>

              <div className="process-icon">
                <Activity size={28} />
              </div>

              <h3>
                Sensors
              </h3>

              <p>
                Sense
              </p>

            </div>


            <div className="process-line"></div>


            <div className="process-step">

              <div className="process-number">
                02
              </div>

              <div className="process-icon">
                <Cpu size={28} />
              </div>

              <h3>
                ESP32
              </h3>

              <p>
                Process
              </p>

            </div>


            <div className="process-line"></div>


            <div className="process-step">

              <div className="process-number">
                03
              </div>

              <div className="process-icon">
                <Database size={28} />
              </div>

              <h3>
                Firebase
              </h3>

              <p>
                Store
              </p>

            </div>


            <div className="process-line"></div>


            <div className="process-step">

              <div className="process-number">
                04
              </div>

              <div className="process-icon">
                <BarChart3 size={28} />
              </div>

              <h3>
                Health Analysis
              </h3>

              <p>
                Evaluate
              </p>

            </div>


            <div className="process-line"></div>


            <div className="process-step">

              <div className="process-number">
                05
              </div>

              <div className="process-icon">
                <ShieldCheck size={28} />
              </div>

              <h3>
                Dashboard
              </h3>

              <p>
                Monitor
              </p>

            </div>

          </div>


          {/* Explanation */}

          <div className="how-explanation">

            <div className="explanation-card">

              <span>01</span>

              <div>

                <h3>
                  Machine Condition Sensing
                </h3>

                <p>
                  The MPU6050, LM35DZ and ACS712 sensors collect
                  vibration, temperature and current information
                  from the machine.
                </p>

              </div>

            </div>


            <div className="explanation-card">

              <span>02</span>

              <div>

                <h3>
                  ESP32 Processing
                </h3>

                <p>
                  The ESP32 reads the sensor measurements and
                  prepares the machine data for monitoring.
                </p>

              </div>

            </div>


            <div className="explanation-card">

              <span>03</span>

              <div>

                <h3>
                  Real-Time Firebase Storage
                </h3>

                <p>
                  The sensor readings are sent to Firebase,
                  where they are available for the MechVita
                  monitoring dashboard.
                </p>

              </div>

            </div>


            <div className="explanation-card">

              <span>04</span>

              <div>

                <h3>
                  Machine Health Evaluation
                </h3>

                <p>
                  Sensor values are compared with the selected
                  machine's healthy baseline to calculate
                  individual condition scores and the overall
                  health score.
                </p>

              </div>

            </div>


            <div className="explanation-card">

              <span>05</span>

              <div>

                <h3>
                  Dashboard & Maintenance Insight
                </h3>

                <p>
                  The dashboard presents machine condition,
                  health status, alerts and maintenance
                  suggestions.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ================= SENSORS ================= */}

        <section
          id="sensors"
          className="content-section sensors-section"
        >

          <div className="section-heading">

            

            <h2>
              Monitoring Sensors
            </h2>

          </div>


          <p className="section-description sensor-intro">

            MechVita uses three key parameters to understand
            machine operating condition.

          </p>


          <div className="sensor-grid">


            {/* VIBRATION */}

            <div className="sensor-card">

              <div className="sensor-image">

                <img
                  src={mpu6050Image}
                  alt="MPU6050 vibration sensor"
                />

              </div>


              <div className="sensor-icon">

                <Vibrate />

              </div>


              <h3>
                Vibration
              </h3>


              <strong>
                MPU6050
              </strong>


              <p>
                Measures machine vibration and acceleration to
                identify abnormal mechanical behaviour such as
                increased vibration, imbalance or developing
                mechanical problems.
              </p>

            </div>


            {/* TEMPERATURE */}

            <div className="sensor-card">

              <div className="sensor-image">

                <img
                  src={lm35dzImage}
                  alt="LM35DZ temperature sensor"
                />

              </div>


              <div className="sensor-icon">

                <Thermometer />

              </div>


              <h3>
                Temperature
              </h3>


              <strong>
                LM35DZ
              </strong>


              <p>
                Measures machine temperature and helps identify
                abnormal heating conditions that may indicate
                excessive load or developing machine problems.
              </p>

            </div>


            {/* CURRENT */}

            <div className="sensor-card">

              <div className="sensor-image">

                <img
                  src={acs712Image}
                  alt="ACS712 current sensor"
                />

              </div>


              <div className="sensor-icon">

                <Zap />

              </div>


              <h3>
                Current
              </h3>


              <strong>
                ACS712
              </strong>


              <p>
                Measures electrical current behaviour and helps
                identify changes in machine load and abnormal
                electrical operating conditions.
              </p>

            </div>


          </div>

        </section>


        {/* ================= THRESHOLDS ================= */}

        <section
          id="thresholds"
          className="content-section"
        >

          <div className="section-heading">

            

            <h2>
              Threshold Values
            </h2>

          </div>


          <p className="section-description">

            Reference values used by MechVita for the currently
            configured machine. Values for machines that have
            not yet been configured are shown as pending.

          </p>


          <div className="threshold-wrapper">


            <div className="machine-label">

              Machine Health Reference Configuration

            </div>


            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Machine Type
                    </th>

                    <th>
                      Vibration
                    </th>

                    <th>
                      Temperature
                    </th>

                    <th>
                      Current
                    </th>

                    <th>
                      Health Score
                    </th>

                  </tr>

                </thead>


                <tbody>

                  <tr>

                    <td>
                      <strong>
                        Ring Frame
                      </strong>
                    </td>

                    <td>
                      1.00 m/s² RMS
                    </td>

                    <td>
                      45°C
                    </td>

                    <td>
                      2.00 A
                    </td>

                    <td className="health-value">
                      ≥ 82%
                    </td>

                  </tr>


                  <tr>

                    <td>
                      Induction Motor
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      —
                    </td>

                  </tr>


                  <tr>

                    <td>
                      Air Compressor
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      —
                    </td>

                  </tr>


                  <tr>

                    <td>
                      Water Pump
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      —
                    </td>

                  </tr>


                  <tr>

                    <td>
                      Conveyor Motor
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      Not configured
                    </td>

                    <td>
                      —
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </section>

      </main>


      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div>

          <strong>
            MechVita
          </strong>

          <p>
            IoT Based Machine Health Monitoring System
          </p>

        </div>


        <span>
          © 2026 MechVita | IoT Project
        </span>

      </footer>

    </div>
  );
}

export default Home;