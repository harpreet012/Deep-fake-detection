import { Link } from 'react-router-dom';
import { Shield, Zap, Search, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, opacity: 1, 
      transition: { type: "spring", stiffness: 100, damping: 12 }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
      
      {/* Background glowing blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

      <motion.div 
        className="max-w-7xl mx-auto w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-24">
          <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full glass-panel border-primary/30 bg-primary/5">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider flex items-center space-x-2">
              <Zap className="w-4 h-4" /> <span>Powered by ResNet-18</span>
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black mb-8 tracking-tight">
            Detect the <br />
            <span className="gradient-text drop-shadow-[0_0_30px_rgba(0,242,254,0.3)]">
              Undetectable
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Enterprise-grade deepfake detection powered by state-of-the-art vision models. 
            Authenticate media with pinpoint accuracy in real-time.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex justify-center gap-6">
            <Link to="/upload" className="btn-primary text-lg px-8 py-4 flex items-center space-x-3 group">
              <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Launch Scanner</span>
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-full font-semibold text-white glass-panel hover:bg-white/10 transition-colors flex items-center space-x-3">
              <Activity className="w-5 h-5" />
              <span>View Analytics</span>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Shield className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Military-Grade Accuracy</h3>
            <p className="text-gray-400 leading-relaxed">Trained on the elite UCI Deepfake dataset to identify synthetic manipulation at the pixel level.</p>
          </div>
          
          <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
              <Zap className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Inference</h3>
            <p className="text-gray-400 leading-relaxed">Asynchronous Fast-API architecture processes video frames natively returning confidence matrices instantly.</p>
          </div>

          <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
              <Activity className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Live Threat Analytics</h3>
            <p className="text-gray-400 leading-relaxed">Secure JSON Web Tokens tie your personal history logs, generating advanced diagnostic analytics charts.</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;
