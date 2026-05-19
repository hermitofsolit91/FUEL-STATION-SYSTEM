import React, { useState, useEffect } from 'react';
import './ShiftForm.css';

function ShiftForm() {
  const [formData, setFormData] = useState({
    shift_date: '',
    shift_type: 'DAY',
    pump_id: '',
    product_id: '',
    opening_meter: '',
    closing_meter: '',
    throughput: '',
    credit: '',
    rtt: '',
    net_sales: '',
    price: '',
    total: ''
  });

  const [pumps, setPumps] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch pumps and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pumpsRes, productsRes] = await Promise.all([
          fetch('http://localhost:5000/api/pumps'),
          fetch('http://localhost:5000/api/products')
        ]);

        if (!pumpsRes.ok || !productsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const pumpsData = await pumpsRes.json();
        const productsData = await productsRes.json();

        setPumps(pumpsData);
        setProducts(productsData);
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to load pumps and products' });
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  // Auto-calculate throughput
  useEffect(() => {
    if (formData.opening_meter && formData.closing_meter) {
      const throughput = parseFloat(formData.closing_meter) - parseFloat(formData.opening_meter);
      setFormData(prev => ({ ...prev, throughput: throughput.toFixed(2) }));
    }
  }, [formData.opening_meter, formData.closing_meter]);

  // Auto-calculate net_sales
  useEffect(() => {
    if (formData.throughput) {
      const rtt = formData.rtt ? parseFloat(formData.rtt) : 0;
      const net_sales = parseFloat(formData.throughput) - rtt;
      setFormData(prev => ({ ...prev, net_sales: Math.max(0, net_sales).toFixed(2) }));
    }
  }, [formData.throughput, formData.rtt]);

  // Auto-calculate total
  useEffect(() => {
    if (formData.net_sales && formData.price) {
      const total = parseFloat(formData.net_sales) * parseFloat(formData.price);
      setFormData(prev => ({ ...prev, total: total.toFixed(2) }));
    }
  }, [formData.net_sales, formData.price]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' }); // Clear message on input change
  };

  const validateForm = () => {
    const required = ['shift_date', 'shift_type', 'pump_id', 'product_id', 'opening_meter', 'closing_meter', 'price'];
    
    for (let field of required) {
      if (!formData[field]) {
        setMessage({ type: 'error', text: `${field.replace(/_/g, ' ')} is required` });
        return false;
      }
    }

    if (parseFloat(formData.closing_meter) <= parseFloat(formData.opening_meter)) {
      setMessage({ type: 'error', text: 'Closing meter must be greater than opening meter' });
      return false;
    }

    if (parseFloat(formData.price) <= 0) {
      setMessage({ type: 'error', text: 'Price must be greater than 0' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/shift-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shift_date: formData.shift_date,
          shift_type: formData.shift_type,
          pump_id: formData.pump_id,
          product_id: formData.product_id,
          opening_meter: parseFloat(formData.opening_meter),
          closing_meter: parseFloat(formData.closing_meter),
          throughput: parseFloat(formData.throughput),
          credit: formData.credit ? parseFloat(formData.credit) : 0,
          rtt: formData.rtt ? parseFloat(formData.rtt) : 0,
          net_sales: parseFloat(formData.net_sales),
          price: parseFloat(formData.price),
          total: parseFloat(formData.total)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setMessage({ type: 'success', text: 'Shift record submitted successfully!' });
      
      // Reset form
      setFormData({
        shift_date: '',
        shift_type: 'DAY',
        pump_id: '',
        product_id: '',
        opening_meter: '',
        closing_meter: '',
        throughput: '',
        credit: '',
        rtt: '',
        net_sales: '',
        price: '',
        total: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit form' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      shift_date: '',
      shift_type: 'DAY',
      pump_id: '',
      product_id: '',
      opening_meter: '',
      closing_meter: '',
      throughput: '',
      credit: '',
      rtt: '',
      net_sales: '',
      price: '',
      total: ''
    });
    setMessage({ type: '', text: '' });
  };

  if (fetchingData) {
    return <div className="form-container"><p>Loading...</p></div>;
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h1>Fuel Station Shift Entry</h1>
        <p>Record daily shift information</p>
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Date and Shift Type */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="shift_date">Shift Date *</label>
            <input
              type="date"
              id="shift_date"
              name="shift_date"
              value={formData.shift_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="shift_type">Shift Type *</label>
            <select
              id="shift_type"
              name="shift_type"
              value={formData.shift_type}
              onChange={handleChange}
            >
              <option value="DAY">DAY</option>
              <option value="NIGHT">NIGHT</option>
            </select>
          </div>
        </div>

        {/* Pump and Product */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pump_id">Pump *</label>
            <select
              id="pump_id"
              name="pump_id"
              value={formData.pump_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a pump</option>
              {pumps.map(pump => (
                <option key={pump.id} value={pump.id}>
                  {pump.name || `Pump ${pump.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="product_id">Product *</label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name || `Product ${product.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meter Readings */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="opening_meter">Opening Meter *</label>
            <input
              type="number"
              id="opening_meter"
              name="opening_meter"
              value={formData.opening_meter}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="closing_meter">Closing Meter *</label>
            <input
              type="number"
              id="closing_meter"
              name="closing_meter"
              value={formData.closing_meter}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="throughput">Throughput</label>
            <input
              type="number"
              id="throughput"
              name="throughput"
              value={formData.throughput}
              readOnly
              step="0.01"
            />
          </div>
        </div>

        {/* Optional Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="credit">Credit (Optional)</label>
            <input
              type="number"
              id="credit"
              name="credit"
              value={formData.credit}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="rtt">RTT - Return to Tank (Optional)</label>
            <input
              type="number"
              id="rtt"
              name="rtt"
              value={formData.rtt}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="net_sales">Net Sales</label>
            <input
              type="number"
              id="net_sales"
              name="net_sales"
              value={formData.net_sales}
              readOnly
              step="0.01"
            />
          </div>
        </div>

        {/* Price and Total */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="total">Total</label>
            <input
              type="number"
              id="total"
              name="total"
              value={formData.total}
              readOnly
              step="0.01"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Shift Record'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default ShiftForm;
