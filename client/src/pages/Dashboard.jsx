import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/api/predict/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        setError('Failed to fetch prediction history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Analytics Calculations
  const totalScans = history.length;
  const fakeCount = history.filter(h => h.result === 'Fake').length;
  const realCount = history.filter(h => h.result === 'Real').length;
  const avgThreatProbability = totalScans > 0 
    ? (history.reduce((acc, curr) => acc + (curr.fakeProb || 0), 0) / totalScans).toFixed(1) 
    : 0;

  const chartData = [
    { name: 'Authentic Media', value: realCount, color: '#10b981' }, // Emerald
    { name: 'Deepfakes Detected', value: fakeCount, color: '#f43f5e' } // Rose
  ];

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-2">Security <span className="gradient-text">Analytics</span></h2>
          <p className="text-gray-400">Welcome back, {user?.name}. Here is your deepfake threat overview.</p>
        </motion.div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Top Metrics Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 border-l-4 border-l-primary">
            <h3 className="text-gray-400 font-medium mb-1 flex items-center"><Activity className="w-4 h-4 mr-2" /> Total Scans</h3>
            <p className="text-4xl font-bold text-white">{totalScans}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 border-l-4 border-l-rose-500">
            <h3 className="text-gray-400 font-medium mb-1 flex items-center"><ShieldAlert className="w-4 h-4 mr-2" /> Threats Detected</h3>
            <p className="text-4xl font-bold text-rose-400">{fakeCount}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-l-4 border-l-secondary">
            <h3 className="text-gray-400 font-medium mb-1 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Avg Threat Probability</h3>
            <p className="text-4xl font-bold text-secondary">{avgThreatProbability}%</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 lg:col-span-1 border border-glass-border">
            <h3 className="text-xl font-semibold text-white mb-6">Threat Distribution</h3>
            {totalScans > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(17, 25, 40, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-gray-500">No data to display</div>
            )}
          </motion.div>

          {/* Table Section */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 lg:col-span-2 border border-glass-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Scan History Log</h3>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">LIVE DB</span>
            </div>
            
            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <p className="text-gray-400 py-8 text-center bg-black/20 rounded-xl border border-glass-border border-dashed">No media has been analyzed yet.</p>
              ) : (
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="pb-3 px-4 font-semibold">Media Original Name</th>
                      <th className="pb-3 px-4 font-semibold">Diagnosis</th>
                      <th className="pb-3 px-4 font-semibold">Deepfake Prob</th>
                      <th className="pb-3 px-4 font-semibold">Real Prob</th>
                      <th className="pb-3 px-4 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {history.map((record) => (
                      <tr key={record._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-gray-300 font-medium truncate max-w-[200px]" title={record.originalName}>
                          {record.originalName}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            record.result === 'Real' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {record.result?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-rose-400 font-mono">
                          {record.fakeProb?.toFixed(2) || 0}%
                        </td>
                        <td className="py-4 px-4 text-emerald-400 font-mono">
                          {record.realProb?.toFixed(2) || 0}%
                        </td>
                        <td className="py-4 px-4 text-gray-500 text-sm flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(record.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
