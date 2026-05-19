const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

//database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

//database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Connected to PostgreSQL');
  }
});

//PRODUCTS ENDPOINTS 
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUMPS ENDPOINTS 

// Get all pumps
app.get('/api/pumps', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pumps ORDER BY pump_number');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SHIFT RECORDS ENDPOINTS

// Get all shift records for a date
app.get('/api/shift-records/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const result = await pool.query(
      `SELECT sr.*, p.pump_number, pr.code as product_code, pr.name as product_name
       FROM shift_records sr
       JOIN pumps p ON sr.pump_id = p.id
       JOIN products pr ON sr.product_id = pr.id
       WHERE sr.shift_date = $1
       ORDER BY p.pump_number, pr.code, sr.shift_type`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/shift-records', async (req, res) => {
  const { pump_id, product_id, shift_date, shift_type, opening_meter, closing_meter, throughput, net_sales, total } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO shift_records (pump_id, product_id, shift_date, shift_type, opening_meter, closing_meter, throughput, net_sales, total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [pump_id, product_id, shift_date, shift_type, opening_meter, closing_meter, throughput, net_sales, total]
    );
    console.log('✅ Shift record created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating shift record:', err);
    res.status(500).json({ error: err.message });
  }
});

// CASH SUMMARY ENDPOINTS

// Get cash summary for a date
app.get('/api/cash-summary/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const result = await pool.query(
      `SELECT cs.*, p.pump_number
       FROM cash_summary cs
       JOIN pumps p ON cs.pump_id = p.id
       WHERE cs.shift_date = $1
       ORDER BY p.pump_number, cs.shift_type`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REPORTS ENDPOINTS 

// Daily report
app.get('/api/reports/daily/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const shifts = await pool.query(
      `SELECT 
        p.pump_number,
        sr.shift_type,
        pr.code,
        COUNT(*) as transactions,
        SUM(sr.throughput) as total_throughput,
        SUM(sr.net_sales) as total_liters,
        SUM(sr.total) as total_sales
       FROM shift_records sr
       JOIN pumps p ON sr.pump_id = p.id
       JOIN products pr ON sr.product_id = pr.id
       WHERE sr.shift_date = $1
       GROUP BY p.pump_number, sr.shift_type, pr.code
       ORDER BY p.pump_number, sr.shift_type, pr.code`,
      [date]
    );

    const cash = await pool.query(
      `SELECT 
        p.pump_number,
        cs.shift_type,
        cs.total_cash_sales,
        cs.banking,
        cs.cash_to_account,
        cs.physical_cash_counted,
        cs.cash_over_under
       FROM cash_summary cs
       JOIN pumps p ON cs.pump_id = p.id
       WHERE cs.shift_date = $1
       ORDER BY p.pump_number, cs.shift_type`,
      [date]
    );

    res.json({
      date,
      shift_summary: shifts.rows,
      cash_summary: cash.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly report
app.get('/api/reports/monthly/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  try {
    const result = await pool.query(
      `SELECT 
        DATE(sr.shift_date) as date,
        p.pump_number,
        COUNT(*) as transactions,
        SUM(sr.net_sales) as total_liters,
        SUM(sr.total) as total_sales
       FROM shift_records sr
       JOIN pumps p ON sr.pump_id = p.id
       WHERE EXTRACT(YEAR FROM sr.shift_date) = $1 
         AND EXTRACT(MONTH FROM sr.shift_date) = $2
       GROUP BY DATE(sr.shift_date), p.pump_number
       ORDER BY DATE(sr.shift_date) DESC, p.pump_number`,
      [year, month]
    );
    
    res.json({
      period: `${year}-${String(month).padStart(2, '0')}`,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  HEALTH CHECK 

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fuel Station API is running',
    time: new Date().toISOString()
  });
});

// ERROR HANDLER 
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Ready!`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/health`);
});