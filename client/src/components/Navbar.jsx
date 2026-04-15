import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, LogOut, LayoutDashboard, ShieldAlert, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed w-full top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none bg-glass/80 backdrop-blur-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-lg opacity-50 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <ShieldAlert className="w-8 h-8 text-white relative z-10" />
            </div>
            <span className="font-bold text-2xl tracking-wide text-white">
              Deep<span className="gradient-text">Sentinel</span>
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link to="/upload" className="text-gray-300 hover:text-white flex items-center space-x-2 transition-colors">
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="font-medium">Scanner</span>
                </Link>
                <Link to="/dashboard" className="text-gray-300 hover:text-white flex items-center space-x-2 transition-colors">
                  <LayoutDashboard className="w-5 h-5 text-secondary" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link to="/metrics" className="text-gray-300 hover:text-white flex items-center space-x-2 transition-colors">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">Metrics</span>
                </Link>
                <div className="h-6 w-[1px] bg-glass-border mx-2"></div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400 font-medium">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-full transition-all duration-200 border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">Exit</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/login" 
                  className="btn-primary flex items-center shadow-lg shadow-primary/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
