import { Outlet } from "react-router-dom";
import Navbar from "./common/Navbar";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
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
