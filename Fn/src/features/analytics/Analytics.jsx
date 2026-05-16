import React from "react";
import { useSelector } from "react-redux";
import { useGetUserStatsQuery } from "../../services/analyticsAPI";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from "recharts";

const COLORS = ["#0dcaf0", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#fd7e14"];

function Analytics({ userId }) {
  const { user: currentUser } = useSelector((state) => state.userReducer);
  const effectiveUserId = userId || currentUser?.id;
  const { data: analyticsData, isLoading, error } = useGetUserStatsQuery(effectiveUserId, { skip: !effectiveUserId });

  if (isLoading) return <div className="text-center py-5">Loading analysis...</div>;
  if (error) return <div className="text-center py-5 text-danger">Error loading stats.</div>;
  if (!analyticsData) return null;

  return (
    <div className="row g-4">
      {/* Genre Chart */}
      <div className="col-md-7">
        <h6 className="text-info mb-3">Genre Distribution</h6>
        <div style={{ width: "100%", height: "300px" }}>
          {analyticsData.genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.genreData} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="name" 
                  stroke="#fff" 
                  fontSize={10} 
                  tick={{ fill: '#aaa' }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis stroke="#fff" fontSize={10} tick={{ fill: '#aaa' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#222", border: "1px solid #444", borderRadius: "8px" }}
                  itemStyle={{ color: "#0dcaf0" }}
                />
                <Bar dataKey="value" fill="#0dcaf0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data available</div>
          )}
        </div>
      </div>

      {/* Mix Chart */}
      <div className="col-md-5">
        <h6 className="text-info mb-3">Content Mix</h6>
        <div style={{ width: "100%", height: "250px" }}>
          {analyticsData.typeData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.typeData}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#222", border: "1px solid #444", borderRadius: "8px" }} />
                <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">No data available</div>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="col-12 mt-4">
        <h6 className="text-info mb-3">Completion Status</h6>
        <div className="row g-3">
          {analyticsData.statusData.map((status, index) => {
            const percentage = analyticsData.summary.totalItems > 0 ? ((status.value / analyticsData.summary.totalItems) * 100).toFixed(0) : 0;
            const colors = ["bg-warning", "bg-info", "bg-success"];
            return (
              <div key={status.name} className="col-md-4">
                <div className="d-flex justify-content-between mb-1 small">
                  <span>{status.name}</span>
                  <span className="text-info">{percentage}%</span>
                </div>
                <div className="progress bg-secondary bg-opacity-25" style={{ height: "6px" }}>
                  <div className={`progress-bar ${colors[index % colors.length]}`} role="progressbar" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="col-12 mt-4">
        <div className="p-3 bg-secondary bg-opacity-10 rounded border border-secondary border-opacity-50">
          <h6 className="text-info mb-3 small uppercase">Behavioral Insights</h6>
          <ul className="list-unstyled mb-0 small">
            <li className="mb-2 d-flex align-items-center">
              <i className="bi bi-info-circle text-info me-2"></i>
              <span>Favorite genre: <strong className="text-info">{[...analyticsData.genreData].sort((a,b) => b.value - a.value)[0]?.name || "N/A"}</strong>.</span>
            </li>
            <li className="mb-2 d-flex align-items-center">
              <i className="bi bi-check-circle text-success me-2"></i>
              <span>Completed <strong className="text-success">{analyticsData.summary.completedCount}</strong> titles.</span>
            </li>
            <li className="d-flex align-items-center">
              <i className="bi bi-lightning text-warning me-2"></i>
              <span>Plan to Watch list: {analyticsData.statusData.find(s => s.name === "Plan to Watch")?.value > 5 ? "Busy! Time to watch." : "Manageable."}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
