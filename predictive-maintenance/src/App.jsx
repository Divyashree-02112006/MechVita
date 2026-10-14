import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import MachineSelection from "./pages/MachineSelection";
import LiveSensors from "./pages/LiveSensors";
import HealthScore from "./pages/HealthScore";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/machine-selection" element={<MachineSelection />} />
        <Route path="/live-sensors" element={<LiveSensors />} />
        <Route path="/health-score" element={<HealthScore />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;