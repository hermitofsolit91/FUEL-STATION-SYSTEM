import React from 'react';
import ShiftForm from '../ShiftForm';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Shift Entry</h1>
        <p>Record shift details and fuel transactions</p>
      </div>
      <div className="home-content">
        <div className="form-container">
          <ShiftForm />
        </div>
      </div>
    </div>
  );
}

export default Home;
