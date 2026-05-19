import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import './Dashboard.css';

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [shiftRecords, setShiftRecords] = useState([]);
  const [cashSummary, setCashSummary] = useState([]);
  const [varianceAnalysis, setVarianceAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  const calculateVariance = (shifts, cash) => {
    if (!shifts || !cash || shifts.length === 0) return [];

    return shifts.map((shift) => {
      const expectedSales = parseFloat(shift.total || 0);
      const pumpCash = cash.find(
        (c) => c.pump_number === shift.pump_number && c.shift_type === shift.shift_type
      );
      const actualCash = pumpCash ? parseFloat(pumpCash.total_cash_sales || 0) : 0;
      
      let variance = 0;
      let variancePercent = 0;
      
      if (expectedSales !== 0) {
        variance = actualCash - expectedSales;
        variancePercent = (variance / expectedSales) * 100;
      }

      return {
        pump_number: shift.pump_number,
        shift_type: shift.shift_type,
        product: shift.product,
        expected_sales: expectedSales,
        actual_cash: actualCash,
        variance: variance,
        variance_percent: variancePercent,
        status: variance >= 0 ? 'gain' : 'loss'
      };
    });
  };

  const fetchData = async (date) => {
    setLoading(true);
    setError('');
    try {
      const [shiftsRes, cashRes] = await Promise.all([
        fetch(`http://localhost:5000/api/shift-records/${date}`),
        fetch(`http://localhost:5000/api/cash-summary/${date}`)
      ]);

      if (!shiftsRes.ok || !cashRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const shiftsData = await shiftsRes.json();
      const cashData = await cashRes.json();

      const shiftsArray = Array.isArray(shiftsData) ? shiftsData : [];
      const cashArray = Array.isArray(cashData) ? cashData : [];

      setShiftRecords(shiftsArray);
      setCashSummary(cashArray);
      
      // Calculate variance analysis
      const variance = calculateVariance(shiftsArray, cashArray);
      setVarianceAnalysis(variance);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      setShiftRecords([]);
      setCashSummary([]);
      setVarianceAnalysis([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const shiftColumns = [
    { key: 'pump_number', label: 'Pump #' },
    { key: 'shift_type', label: 'Shift Type' },
    { key: 'product', label: 'Product' },
    {
      key: 'throughput',
      label: 'Throughput (L)',
      render: (val) => parseFloat(val || 0).toFixed(2)
    },
    {
      key: 'net_sales',
      label: 'Net Sales (L)',
      render: (val) => parseFloat(val || 0).toFixed(2)
    },
    {
      key: 'total',
      label: 'Total Sales',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    }
  ];

  const cashColumns = [
    { key: 'pump_number', label: 'Pump #' },
    { key: 'shift_type', label: 'Shift Type' },
    {
      key: 'total_cash_sales',
      label: 'Cash Sales',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    },
    {
      key: 'banking',
      label: 'Banking',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    },
    {
      key: 'cash_to_account',
      label: 'Cash to Account',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    },
    {
      key: 'cash_over_under',
      label: 'Over/Under',
      render: (val) => {
        const amount = parseFloat(val || 0);
        return (
          <span className={amount >= 0 ? 'positive' : 'negative'}>
            ${amount.toFixed(2)}
          </span>
        );
      }
    }
  ];

  const varianceColumns = [
    { key: 'pump_number', label: 'Pump #' },
    { key: 'shift_type', label: 'Shift' },
    { key: 'product', label: 'Product' },
    {
      key: 'expected_sales',
      label: 'Expected Sales',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    },
    {
      key: 'actual_cash',
      label: 'Actual Cash',
      render: (val) => `$${parseFloat(val || 0).toFixed(2)}`
    },
    {
      key: 'variance',
      label: 'Variance',
      render: (val, row) => {
        const amount = parseFloat(val || 0);
        const className = amount >= 0 ? 'positive' : 'negative';
        return (
          <span className={className}>
            ${amount.toFixed(2)} ({row.variance_percent.toFixed(2)}%)
          </span>
        );
      }
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <div className="date-picker-section">
          <label htmlFor="date-picker">Select Date:</label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-picker"
          />
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        <div className="dashboard-content">
          <div className="tables-grid">
            <div className="table-section">
              <DataTable
                title="Shift Records"
                columns={shiftColumns}
                data={shiftRecords}
              />
            </div>
            <div className="table-section">
              <DataTable
                title="Cash Summary"
                columns={cashColumns}
                data={cashSummary}
              />
            </div>
          </div>

          {varianceAnalysis.length > 0 && (
            <div className="table-full">
              <DataTable
                title="Variance Analysis - Loss/Gain"
                columns={varianceColumns}
                data={varianceAnalysis}
              />
            </div>
          )}

          {shiftRecords.length > 0 && (
            <div className="summary-section">
              <div className="summary-card">
                <h3>Daily Summary</h3>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Throughput:</span>
                    <span className="stat-value">
                      {shiftRecords
                        .reduce((sum, record) => sum + parseFloat(record.throughput || 0), 0)
                        .toFixed(2)}{' '}
                      L
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Expected Sales:</span>
                    <span className="stat-value">
                      $
                      {shiftRecords
                        .reduce((sum, record) => sum + parseFloat(record.total || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Cash Received:</span>
                    <span className="stat-value">
                      $
                      {cashSummary
                        .reduce(
                          (sum, record) => sum + parseFloat(record.total_cash_sales || 0),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Variance:</span>
                    <span className={`stat-value ${
                      varianceAnalysis.reduce((sum, v) => sum + v.variance, 0) >= 0
                        ? 'positive'
                        : 'negative'
                    }`}>
                      $
                      {varianceAnalysis
                        .reduce((sum, v) => sum + v.variance, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
