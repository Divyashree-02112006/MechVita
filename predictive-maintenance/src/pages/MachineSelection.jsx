import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle,
  Thermometer,
  Zap,
  Lock,
  Activity,
  Cpu,
} from "lucide-react";

import Sidebar from "../components/Sidebar";


const machines = [
  {
    id: "ring-frame",
    name: "Ring Frame",
    deviceId: "SPINNING_DEVICE_001",
    status: "Configured",
    available: true,
    description:
      "Continuous monitoring of vibration, temperature and electrical current.",
  },

  {
    id: "induction-motor",
    name: "Induction Motor",
    status: "Not Configured",
    available: false,
    description:
      "Sensor configuration and machine reference values are required.",
  },

  {
    id: "air-compressor",
    name: "Air Compressor",
    status: "Not Configured",
    available: false,
    description:
      "Sensor configuration and machine reference values are required.",
  },

  {
    id: "water-pump",
    name: "Water Pump",
    status: "Not Configured",
    available: false,
    description:
      "Sensor configuration and machine reference values are required.",
  },

  {
    id: "conveyor-motor",
    name: "Conveyor Motor",
    status: "Not Configured",
    available: false,
    description:
      "Sensor configuration and machine reference values are required.",
  },
];


function MachineSelection() {

  const navigate = useNavigate();

  const [selectedMachine, setSelectedMachine] = useState(null);


  const handleSelect = (machine) => {

    if (!machine.available) return;

    setSelectedMachine(machine);
  };


  return (

    <div className="dashboard-page machine-selection-layout">


      {/* ================= SHARED SIDEBAR ================= */}

      <Sidebar />


      {/* ================= MAIN ================= */}

      <main className="dashboard-main">


        {/* ================= TOP BAR ================= */}

        <header className="dashboard-topbar">

          <div className="topbar-heading">

            <h1>Machine Selection</h1>

            <p>
              Choose the machine you want MechVita to monitor.
            </p>

          </div>


          <div className="topbar-live">

            <span className="topbar-live">
                <span></span>
                LIVE
              </span>

          </div>

        </header>


        {/* ================= CONTENT ================= */}

        <div className="dashboard-content">


          {/* ================= PAGE INTRO ================= */}

          <section className="machine-selection-intro">

            <span className="section-label">
              MACHINE MONITORING
            </span>

            <h2>Select a Machine</h2>

            <p>
              Select a configured machine to begin real-time
              health monitoring and predictive analysis.
            </p>

          </section>


          {/* ================= MACHINE GRID ================= */}

          <section className="machine-grid">

            {machines.map((machine) => {

              const isSelected =
                selectedMachine?.id === machine.id;


              return (

                <button
                  key={machine.id}

                  className={`machine-card ${
                    isSelected
                      ? "machine-card-selected"
                      : ""
                  } ${
                    !machine.available
                      ? "machine-card-disabled"
                      : ""
                  }`}

                  onClick={() =>
                    handleSelect(machine)
                  }

                  disabled={!machine.available}
                >


                  {/* CARD TOP */}

                  <div className="machine-card-top">

                    <div className="machine-icon">

                      <Cpu size={24} />

                    </div>


                    <span
                      className={`machine-status ${
                        machine.available
                          ? "machine-status-configured"
                          : "machine-status-disabled"
                      }`}
                    >

                      {machine.available ? (

                        <>
                          <CheckCircle size={13} />
                          CONFIGURED
                        </>

                      ) : (

                        <>
                          <Lock size={13} />
                          NOT CONFIGURED
                        </>

                      )}

                    </span>

                  </div>


                  {/* CARD BODY */}

                  <div className="machine-card-body">

                    <h3>
                      {machine.name}
                    </h3>


                    <p>
                      {machine.description}
                    </p>


                    {machine.available && (

                      <div className="machine-sensor-preview">

                        <span>
                          <Activity size={14} />
                          Vibration
                        </span>


                        <span>
                          <Thermometer size={14} />
                          Temperature
                        </span>


                        <span>
                          <Zap size={14} />
                          Current
                        </span>

                      </div>

                    )}

                  </div>


                  {/* CARD FOOTER */}

                  <div className="machine-card-footer">

                    {isSelected ? (

                      <span className="selected-label">

                        <CheckCircle size={15} />

                        SELECTED

                      </span>

                    ) : machine.available ? (

                      <span className="select-label">

                        Click to select

                      </span>

                    ) : (

                      <span className="disabled-label">

                        Configuration required

                      </span>

                    )}

                  </div>


                </button>

              );

            })}

          </section>


          {/* ================= SELECTED MACHINE ================= */}

          <section className="selected-machine-panel">


            <div className="selected-machine-info">

              <span className="section-label">
                SELECTED MACHINE
              </span>


              {selectedMachine ? (

                <>

                  <h2>
                    {selectedMachine.name}
                  </h2>


                  <p>

                    Device ID:{" "}

                    <strong>
                      {selectedMachine.deviceId}
                    </strong>

                  </p>


                  <div className="selected-machine-details">


                    <div>

                      <Activity size={16} />

                      <span>
                        Vibration Monitoring
                      </span>

                    </div>


                    <div>

                      <Thermometer size={16} />

                      <span>
                        Temperature Monitoring
                      </span>

                    </div>


                    <div>

                      <Zap size={16} />

                      <span>
                        Current Monitoring
                      </span>

                    </div>


                  </div>

                </>

              ) : (

                <>

                  <h2>
                    No Machine Selected
                  </h2>


                  <p>
                    Select a configured machine above to
                    begin monitoring.
                  </p>

                </>

              )}

            </div>


            {/* ================= BUTTONS ================= */}

            <div className="machine-action-buttons">


              {/* OPEN DASHBOARD */}

              <button

                className="open-dashboard-button"

                onClick={() =>
                  navigate("/dashboard")
                }

                disabled={!selectedMachine}

              >

                Open Dashboard

                <ArrowRight size={18} />

              </button>


              {/* LIVE SENSORS */}

              <button

                className="live-sensors-button"

                onClick={() =>
                  navigate("/live-sensors")
                }

                disabled={!selectedMachine}

              >

                <Activity size={17} />

                Live Sensors

              </button>


            </div>

          </section>


          {/* ================= INFORMATION ================= */}

          <section className="machine-info-section">


            <div className="info-icon">

              <Cpu size={20} />

            </div>


            <div>

              <h3>
                How machine monitoring works
              </h3>


              <p>

                MechVita collects vibration, temperature
                and current readings from sensors attached
                to the machine. These readings are used to
                calculate the machine health score and
                identify abnormal operating conditions.

              </p>

            </div>


          </section>


        </div>

      </main>

    </div>

  );
}


export default MachineSelection;