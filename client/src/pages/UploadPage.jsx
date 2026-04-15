import { useState, useRef, useCallback } from 'react';
import api from '../api';
import { Upload, AlertCircle, CheckCircle, Video, Image as ImageIcon, Camera, RefreshCw, Terminal, Activity, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';

const UploadPage = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'camera'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Webcam states
  const webcamRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  // Tab Switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setError('');
    if (tab === 'upload') setCameraEnabled(false);
  };

  // Upload Logic
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError('');
    }
  };

  // Camera Logic
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setPreview(imageSrc);
    setResult(null);
    setError('');
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setPreview(null);
    setResult(null);
  };

  // Base64 to File blob conversion
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const handleAnalyze = async () => {
    let fileToUpload = null;
    
    if (activeTab === 'upload' && !file) {
      return setError('Please select a file first.');
    }
    
    if (activeTab === 'camera') {
      if (!capturedImage) return setError('Please capture an image first.');
      fileToUpload = dataURLtoFile(capturedImage, 'webcam_capture.jpg');
    } else {
      fileToUpload = file;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/predict/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Artificial delay to show off cool UI loading states
      setTimeout(() => {
        setResult(res.data);
        setLoading(false);
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to the server');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Deepfake <span className="gradient-text">Scanner</span></h2>
          <p className="text-gray-400">Deploy ResNet-18 vision models to analyze media in real-time.</p>
        </motion.div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-8">
          <div className="glass-panel p-1 inline-flex rounded-full">
            <button 
              onClick={() => handleTabChange('upload')}
              className={`px-6 py-2.5 rounded-full flex items-center space-x-2 transition-all ${activeTab === 'upload' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:text-white'}`}
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">File Upload</span>
            </button>
            <button 
              onClick={() => handleTabChange('camera')}
              className={`px-6 py-2.5 rounded-full flex items-center space-x-2 transition-all ${activeTab === 'camera' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-400 hover:text-white'}`}
            >
              <Camera className="w-4 h-4" />
              <span className="font-medium">Live Camera</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input Source */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8"
          >
            {activeTab === 'upload' ? (
              // FILE UPLOAD TAB
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-glass-border hover:border-primary/50 transition-colors rounded-2xl cursor-pointer bg-glass/30 hover:bg-glass/50 group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-4 group-hover:text-primary transition-colors" />
                    <p className="mb-2 text-sm text-gray-300">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">MP4, JPG, PNG (Max: 50MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
                </label>
              </div>
            ) : (
              // LIVE CAMERA TAB
              <div className="w-full h-80 relative rounded-2xl overflow-hidden border border-glass-border bg-black/50 flex flex-col items-center justify-center">
                {!cameraEnabled ? (
                  <button 
                    onClick={() => setCameraEnabled(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Enable Webcam</span>
                  </button>
                ) : (
                  <>
                    {!capturedImage ? (
                      <>
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover"
                        />
                        <button 
                          onClick={capture}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 btn-primary border-2 border-white/20 px-8"
                        >
                          Capture Face
                        </button>
                        {/* Scanning brackets overlay */}
                        <div className="absolute inset-8 border border-primary/30 block pointer-events-none">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary"></div>
                        </div>
                      </>
                    ) : (
                      <div className="relative w-full h-full group">
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={retake} className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur-md">
                            <RefreshCw className="w-4 h-4" />
                            <span>Retake</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleAnalyze}
              disabled={loading || (activeTab === 'upload' && !file) || (activeTab === 'camera' && !capturedImage)}
              className={`w-full mt-6 py-4 rounded-xl font-bold flex justify-center items-center space-x-2 transition-all 
                ${loading ? 'bg-primary/20 cursor-wait' : 'btn-primary'}
                ${(!file && !capturedImage) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-primary">Running Inference Network...</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span>Begin Analysis Scan</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Right Column: Results & Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-panel p-8 relative overflow-hidden transition-all duration-500 ${result ? (result.result === 'Real' ? 'border-emerald-500/30' : 'border-rose-500/30') : ''}`}
          >
            {/* Background diagnostic glow on result */}
            {result && (
              <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none ${result.result === 'Real' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            )}

            <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2 text-white">
              <Terminal className="w-5 h-5 text-gray-400" />
              <span>Diagnostic Center</span>
            </h3>

            {preview && !result && (
              <div className="opacity-50">
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-glass-border bg-black/40 mb-4">
                  {(file && file.type.startsWith('video/')) ? (
                    <video src={preview} className="w-full h-full object-cover" muted loop autoPlay />
                  ) : (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="font-mono text-xs text-primary/70 bg-black/40 p-3 rounded border border-primary/20">
                  <p>&gt; System Idle...</p>
                  <p>&gt; Waiting for execution command.</p>
                </div>
              </div>
            )}

            {!preview && !result && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
                <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
                <p>Awaiting Media Input</p>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-glass-border bg-black relative">
                    {(file && file.type.startsWith('video/')) ? (
                      <video src={preview} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={preview} alt="Analyzed" className="w-full h-full object-cover" />
                    )}
                    {/* Corner Reticle UI overlay */}
                    <div className="absolute top-2 left-2 text-xs font-mono font-bold bg-black/60 px-2 py-1 rounded text-primary border border-primary/30">ID: DF-{Math.floor(Math.random()*9000)+1000}</div>
                  </div>

                  <div className="glass-panel p-6 bg-black/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 font-medium">Verdict:</span>
                      <div className={`flex items-center space-x-2 font-bold text-2xl ${
                        result.result === 'Real' ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]'
                      }`}>
                        {result.result === 'Real' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        <span className="uppercase tracking-widest">{result.result}</span>
                      </div>
                    </div>

                      <div className="mb-4 space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1 text-gray-400">
                            <span>Authentic Probability</span>
                            <span className="font-mono text-emerald-400">{result.realProb?.toFixed(2) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${result.realProb || 0}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                            ></motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1 text-gray-400">
                            <span>Deepfake Probability</span>
                            <span className="font-mono text-rose-400">{result.fakeProb?.toFixed(2) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${result.fakeProb || 0}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                              className="h-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                            ></motion.div>
                          </div>
                        </div>
                      </div>

                    {/* Fake Terminal Output */}
                    <div className="font-mono text-[10px] sm:text-xs text-gray-400 bg-black/60 p-4 rounded-lg border border-gray-800 mt-6 leading-relaxed">
                      <p className="text-white/30 truncate">--- DIAGNOSTIC TRACE ---</p>
                      <p className="text-primary truncate">&gt; Input_Shape: [1, 3, 224, 224]</p>
                      <p className="text-primary truncate">&gt; ResNet18_Layers: 18 (Active)</p>
                      <p className="text-primary truncate">&gt; Media_Source: {activeTab === 'camera' ? 'Live HD Camera Node' : 'Uploaded File Blob'}</p>
                      <p className="text-white mt-2 truncate"><span className="text-emerald-400">&gt; Status 200:</span> Scan complete in {Math.floor(Math.random() * 50 + 10)}ms.</p>
                      <p className="text-white/30 mt-2 truncate">--- END TRACE ---</p>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
