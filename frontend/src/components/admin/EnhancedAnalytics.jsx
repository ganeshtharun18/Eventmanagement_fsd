import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getEventAnalytics } from '../../services/api';
import './EnhancedAnalytics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedAnalytics = () => {
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const analytics = await getEventAnalytics(timeRange);
        setData(analytics || {}); // fallback to empty object
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>No data available</div>;

  // Ensure fallbacks for arrays to prevent map errors
  const eventsByTime = Array.isArray(data.events_by_time) ? data.events_by_time : [];
  const topUsers = Array.isArray(data.top_users) ? data.top_users : [];
  const categoryStats = Array.isArray(data.category_stats) ? data.category_stats : [];
  const locationStats = Array.isArray(data.location_stats) ? data.location_stats : [];

  return (
    <div className="enhanced-analytics">
      <div className="controls">
        <h2>Event Analytics</h2>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <h3>Total Events</h3>
          <p>{data.total_events ?? 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>{data.total_users ?? 'N/A'}</p>
        </div>
        <div className="stat-card">
          <h3>Categories Used</h3>
          <p>{data.total_categories ?? 'N/A'}</p>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container">
          <h3>Events by {timeRange}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventsByTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Top Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={topUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="events" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-container">
          <h3>Events by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Top Locations</h3>
          <ul className="location-list">
            {locationStats.map((loc, index) => (
              <li key={index}>
                <span>{loc.location}</span>
                <span>{loc.count} events</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
