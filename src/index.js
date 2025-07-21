import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // or Tailwind if used
import VehicleMap from './App'; // App.jsx is automatically resolved

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<VehicleMap />);
