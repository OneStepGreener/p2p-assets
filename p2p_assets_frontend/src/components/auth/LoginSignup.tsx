import React, { useState, useRef, useEffect } from 'react';
import videoSrc from '../../assets/assetmanagement_video.mp4';
import tciLogo from '../../assets/TCI_Logo.jpg';
import { login } from '../../api/auth';

const USER_STORAGE_KEY = 'user';

interface LoginSignupProps {
  onLogin: () => void;
}

export const LoginSignup: React.FC<LoginSignupProps> = ({ onLogin }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      let animationFrameId: number;
      
      // Use requestAnimationFrame for smooth, frame-perfect looping
      const checkLoop = () => {
        if (video.duration && !video.paused) {
          // Restart at the exact end frame for seamless loop
          if (video.currentTime >= video.duration - 0.016) { // ~1 frame at 60fps
            video.currentTime = 0;
          }
        }
        animationFrameId = requestAnimationFrame(checkLoop);
      };
      
      const handleLoadedMetadata = () => {
        // Start the loop checker once video metadata is loaded
        animationFrameId = requestAnimationFrame(checkLoop);
      };
      
      const handleEnded = () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleEnded);
      
      // Start playing
      video.play().catch((error) => {
        console.log('Video autoplay failed:', error);
      });
      
      // If metadata already loaded, start immediately
      if (video.readyState >= 1) {
        animationFrameId = requestAnimationFrame(checkLoop);
      }
      
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !password) {
      setLoginError('Please enter employee code and password.');
      return;
    }
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await login(employeeCode.trim(), password);
      if (res.access_token) {
        localStorage.setItem('access_token', res.access_token);
        if (res.user) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        }
        localStorage.setItem('p2p_asset_auth', '1');
        onLogin();
      } else {
        setLoginError('Login failed.');
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Video */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-50 overflow-hidden items-center justify-start">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full"
          style={{ 
            objectFit: 'contain',
            objectPosition: 'left center',
            width: 'auto',
            height: '100%',
            maxWidth: '100%'
          }}
          onCanPlay={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.log('Video play error:', err);
              });
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.log('Video play error:', err);
              });
            }
          }}
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.play().catch((err) => {
                console.log('Video play error:', err);
              });
            }
          }}
          onEnded={() => {
            if (videoRef.current) {
              const video = videoRef.current;
              video.currentTime = 0;
              video.play().catch(() => {});
            }
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={tciLogo}
                alt="TCI"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-2xl font-bold text-gray-900">
              Transport Corporation of India
            </h1>
            <p className="text-sm text-gray-600">Asset Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code
              </label>
              <input
                type="text"
                id="employeeCode"
                inputMode="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Enter employee code (e.g. 3456R)"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-sm text-red-600" role="alert">
                {loginError}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
