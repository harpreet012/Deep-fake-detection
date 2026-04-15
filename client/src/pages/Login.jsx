import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="bg-slate-900 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:text-blue-300 font-medium">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
