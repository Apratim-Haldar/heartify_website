import React from 'react';
import './App.css';
import Dashboard from './views/Dashboard';
import Landing from './views/Landing';
import Analytics from './views/Analytics';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import ProtectedRoute from'./components/ProtectedRoute';

function App() {
  return (
    <CookiesProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
    </CookiesProvider>
  );
}

export default App;