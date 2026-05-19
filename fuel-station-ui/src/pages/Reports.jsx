import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Reports.css';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  // Format number
  const formatNumber = (num) => parseFloat(num || 0).toFixed(2);

  // Generates Daily Report
  const generateDailyReport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setDailyData([]);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/daily/${selectedDate}`);
      const data = response.data?.records || response.data || [];
      setDailyData(Array.isArray(data) ? data : []);
      setSuccess('Daily report generated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch daily report.');
    } finally {
      setLoading(false);
    }
  };

  // Generates Monthly Report
  const generateMonthlyReport = async () => {
    if (!selectedMonth) {
      setError('Please select a month');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setMonthlyData([]);
    
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await axios.get(`http://localhost:5000/api/reports/monthly/${year}/${month}`);
      const data = response.data?.records || response.data || [];
      setMonthlyData(Array.isArray(data) ? data : []);
      setSuccess('Monthly report generated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch monthly report.');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = (data, filename) => {
    if (!data.length) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Export CSV buttons
  const handleDailyExport = () => exportToCSV(dailyData, `daily-report-${selectedDate}.csv`);
  const handleMonthlyExport = () => exportToCSV(monthlyData, `monthly-report-${selectedMonth}.csv`);

  // Daily Report summary stats
  const totalDailyThroughput = dailyData.reduce((acc, curr) => acc + parseFloat(curr.total_throughput || 0), 0);
  const totalDailySales = dailyData.reduce((acc, curr) => acc + parseFloat(curr.total_sales || 0), 0);

  // Monthly Report summary stats
  const totalMonthlyLiters = monthlyData.reduce((acc, curr) => acc + parseFloat(curr.total_liters || 0), 0);
  const totalMonthlySales = monthlyData.reduce((acc, curr) => acc + parseFloat(curr.total_sales || 0), 0);

  // Prepare Daily Charts Data
  const dailyChartData = dailyData.map(item => ({
    name: `Pump ${item.pump_number} (${item.shift_type})`,
    sales: parseFloat(item.total_sales || 0),
    throughput: parseFloat(item.total_throughput || 0)
  }));

  // Prepare Monthly Charts Data
  const monthlyChartData = monthlyData.reduce((acc, item) => {
    const existing = acc.find(x => x.date === item.date);
    const sales = parseFloat(item.total_sales || 0);
    if (existing) {
      existing.sales += sales;
    } else {
      acc.push({ date: item.date, sales });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>📉 Reports</h1>
      </div>

      <div className="report-controls">
        <div className="report-tabs">
          <button 
            className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => { setActiveTab('daily'); setError(''); setSuccess(''); }}
          >
            Daily Report
          </button>
          <button 
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => { setActiveTab('monthly'); setError(''); setSuccess(''); }}
          >
            Monthly Report
          </button>
        </div>

        {activeTab === 'daily' && (
          <div className="report-inputs">
            <div className="input-group">
              <label htmlFor="dailyDate">Select Date:</label>
              <input 
                id="dailyDate" 
                type="date" 
                className="input-field"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
              />
            </div>
            <button className="btn-primary" onClick={generateDailyReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            {dailyData.length > 0 && (
              <button className="btn-export" onClick={handleDailyExport}>
                Export to CSV
              </button>
            )}
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="report-inputs">
            <div className="input-group">
              <label htmlFor="monthlyDate">Select Month:</label>
              <input 
                id="monthlyDate" 
                type="month" 
                className="input-field"
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
              />
            </div>
            <button className="btn-primary" onClick={generateMonthlyReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            {monthlyData.length > 0 && (
              <button className="btn-export" onClick={handleMonthlyExport}>
                Export to CSV
              </button>
            )}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <div className="report-content">
        {/* Daily Report View */}
        {activeTab === 'daily' && dailyData.length > 0 && (
          <>
            <div className="summary-section">
              <div className="summary-card">
                <h3>Daily Summary Stats</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Throughput (L)</span>
                    <span className="summary-value">{formatNumber(totalDailyThroughput)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Sales ($)</span>
                    <span className="summary-value">${formatNumber(totalDailySales)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Sales by Pump and Shift</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(val) => `$${formatNumber(val)}`} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales ($)" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Throughput Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(val) => `${formatNumber(val)} L`} />
                    <Legend />
                    <Line type="monotone" dataKey="throughput" name="Throughput (L)" stroke="#764ba2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="table-responsive">
              <table className="datatable">
                <thead>
                  <tr>
                    <th>Pump Number</th>
                    <th>Shift Type</th>
                    <th>Code</th>
                    <th>Transactions</th>
                    <th>Total Throughput (L)</th>
                    <th>Total Sales ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                      <td>{row.pump_number}</td>
                      <td>{row.shift_type}</td>
                      <td>{row.code || 'N/A'}</td>
                      <td>{row.transactions || 0}</td>
                      <td>{formatNumber(row.total_throughput)}</td>
                      <td>${formatNumber(row.total_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Monthly Report View */}
        {activeTab === 'monthly' && monthlyData.length > 0 && (
          <>
            <div className="summary-section">
              <div className="summary-card">
                <h3>Monthly Summary Stats</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Liters</span>
                    <span className="summary-value">{formatNumber(totalMonthlyLiters)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Sales ($)</span>
                    <span className="summary-value">${formatNumber(totalMonthlySales)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="charts-grid-full">
              <div className="chart-container">
                <h3>Daily Sales Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(val) => `$${formatNumber(val)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" name="Daily Sales ($)" stroke="#667eea" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="table-responsive">
              <table className="datatable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pump Number</th>
                    <th>Transactions</th>
                    <th>Total Liters</th>
                    <th>Total Sales ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                      <td>{row.date}</td>
                      <td>{row.pump_number}</td>
                      <td>{row.transactions || 0}</td>
                      <td>{formatNumber(row.total_liters)}</td>
                      <td>${formatNumber(row.total_sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Empty States */}
        {!loading && activeTab === 'daily' && dailyData.length === 0 && selectedDate && !error && !success && (
          <div className="empty-state">No daily data found. Click "Generate Report" to fetch data.</div>
        )}
        {!loading && activeTab === 'monthly' && monthlyData.length === 0 && selectedMonth && !error && !success && (
          <div className="empty-state">No monthly data found. Click "Generate Report" to fetch data.</div>
        )}
      </div>
    </div>
  );
}
