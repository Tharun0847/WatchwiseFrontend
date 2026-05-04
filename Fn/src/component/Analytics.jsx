import React from "react";
import { useSelector } from "react-redux";
import { useGetUserStatsQuery } from "../services/analyticsAPI";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from "recharts";

const COLORS = ["#0dcaf0", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

function Analytics() {
  const { user } = useSelector((state) => state.userReducer);
  const { data, isLoading, error } = useGetUserStatsQuery(user.id);

  if (isLoading) return <div className="text-center mt-5 text-light">Loading analysis...</div>;
  if (error) return <div className="text-center mt-5 text-danger">Error loading stats.</div>;

  const { genreData, statusData, typeData, summary } = data;

  return (
    <div className="container py-4">
      <h2 className="text-light mb-4">Your Viewing Insights</h2>

      {/* Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card bg-dark text-light border-info border-start border-4 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-light opacity-75 uppercase small">Total Items</h6>
              <h2 className="fw-bold text-info mb-0">{summary.totalItems}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark text-light border-success border-start border-4 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-light opacity-75 uppercase small">Completed</h6>
              <h2 className="fw-bold text-success mb-0">{summary.completedCount}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark text-light border-warning border-start border-4 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-light opacity-75 uppercase small">Avg. Rating</h6>
              <h2 className="fw-bold text-warning mb-0">{summary.avgRating} ★</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-dark text-light border-info border-start border-4 shadow-sm h-100">
            <div className="card-body text-center">
              <h6 className="text-light opacity-75 uppercase small">Favorites</h6>
              <h2 className="fw-bold text-info mb-0">{summary.favoriteCount} <i className="bi bi-heart-fill ms-1"></i></h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Genre Distribution - Bar Chart */}
        <div className="col-md-8">
          <div className="card bg-dark text-light border-secondary shadow h-100">
            <div className="card-body">
              <h5 className="mb-4 text-info">Genre Distribution</h5>
              <div style={{ width: "100%", height: 300, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <BarChart data={genreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#fff" fontSize={12} tick={{ fill: '#aaa' }} />
                    <YAxis stroke="#fff" fontSize={12} tick={{ fill: '#aaa' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#222", border: "1px solid #444", borderRadius: "8px" }}
                      itemStyle={{ color: "#0dcaf0" }}
                    />
                    <Bar dataKey="value" fill="#0dcaf0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Content Type - Pie Chart */}
        <div className="col-md-4">
          <div className="card bg-dark text-light border-secondary shadow h-100">
            <div className="card-body">
              <h5 className="mb-4 text-info">Content Mix</h5>
              <div style={{ width: "100%", height: 300, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: "#222", border: "1px solid #444", borderRadius: "8px" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown - Progress Bars */}
        <div className="col-md-12">
          <div className="card bg-dark text-light border-secondary shadow">
            <div className="card-body">
              <h5 className="mb-4 text-info">Completion Tracking</h5>
              <div className="row g-4">
                {statusData.map((status, index) => {
                  const percentage = ((status.value / summary.totalItems) * 100).toFixed(0);
                  const colors = ["bg-warning", "bg-info", "bg-success"];
                  return (
                    <div key={status.name} className="col-md-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span>{status.name}</span>
                        <span className="text-info">{percentage}%</span>
                      </div>
                      <div className="progress bg-secondary bg-opacity-25" style={{ height: "10px" }}>
                        <div 
                          className={`progress-bar ${colors[index]}`} 
                          role="progressbar" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Insights List */}
        <div className="col-md-12 mb-5">
          <div className="card bg-dark text-light border-secondary shadow">
            <div className="card-body p-4">
              <h5 className="text-info mb-3">Behavioral Insights</h5>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex align-items-center">
                  <i className="bi bi-info-circle text-info me-3"></i>
                  Your favorite genre seems to be <strong className="text-light ms-1">{[...genreData].sort((a,b) => b.value - a.value)[0]?.name || "N/A"}</strong>.
                </li>
                <li className="mb-3 d-flex align-items-center">
                  <i className="bi bi-check-circle text-success me-3"></i>
                  You've successfully completed <strong className="text-light mx-1">{summary.completedCount}</strong> titles so far!
                </li>
                <li className="mb-0 d-flex align-items-center">
                  <i className="bi bi-lightning text-warning me-3"></i>
                  Your "Plan to Watch" list is {statusData.find(s => s.name === "Plan to Watch")?.value > 5 ? "Getting full! Time to start watching." : "Looking good."}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
