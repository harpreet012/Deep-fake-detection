import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import UploadPage from './pages/UploadPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

import ModelMetrics from './pages/ModelMetrics';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/metrics" element={<PrivateRoute><ModelMetrics /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
