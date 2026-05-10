import { Outlet } from "react-router-dom";
import Navbar from "./common/Navbar";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      {/* Navbar stays at the very top, outside any bordered boxes */}
      <Navbar />

      <div className="container-fluid px-4">
        {/* Main Content Area */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default App;
