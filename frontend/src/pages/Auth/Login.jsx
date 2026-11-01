import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, ExternalLink, Building2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/appConfig';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
  clearStoredHospitalContext,
  resolveHospitalCode,
  setStoredHospitalContext,
} from '../../utils/tenantContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hospital } = useParams();
  const resolvedHospitalCode = resolveHospitalCode(hospital || searchParams.get('hospital'));
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hospitalBranding, setHospitalBranding] = useState(null);
  const [loadingBranding, setLoadingBranding] = useState(false);

  useEffect(() => {
    if (resolvedHospitalCode) {
      setStoredHospitalContext(resolvedHospitalCode);
      fetchHospitalBranding(resolvedHospitalCode);
      return;
    }

    clearStoredHospitalContext();
    setHospitalBranding(null);
  }, [resolvedHospitalCode]);

  const fetchHospitalBranding = async (code) => {
    setLoadingBranding(true);

    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/hospital-branding/${code}`);
      const data = await response.json();
      setHospitalBranding(data.success ? data.hospital : null);
    } catch (fetchError) {
      console.error('Failed to fetch hospital branding:', fetchError);
      setHospitalBranding(null);
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password, {
        hospitalCode: resolvedHospitalCode,
      });

      if (result.success) {
        const roleRoutes = {
          superadmin: '/superadmin/dashboard',
          admin: '/admin/dashboard',
          supervisor: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          nurse: '/nurse/dashboard',
          receptionist: '/receptionist/dashboard',
          reception: '/receptionist/dashboard',
          pharmacy: '/pharmacy/dashboard',
          lab: '/lab/dashboard',
          radiologist: '/radiologist/dashboard',
        };

        navigate(roleRoutes[result.user.role] || '/dashboard', { replace: true });
        return;
      }

      setError(result.error || 'Login failed. Please try again.');
    } catch (loginError) {
      console.error('Login error:', loginError);
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError('');
  };

  const handleNextViJoClick = () => {
    window.open('https://www.nextvijo.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}logo2.jpg)` }}
      ></div>
      <div className="relative z-10 w-full flex flex-col items-center px-4">
        <div className="flex flex-col items-center mb-8 w-full">
          {loadingBranding ? (
            <div className="bg-white/80 backdrop-blur rounded-full p-4 shadow-xl border border-gray-200 h-24 w-24 flex items-center justify-center mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : hospitalBranding ? (
            <div className="flex flex-col md:flex-row items-center gap-6 bg-white/95 backdrop-blur-md px-8 py-5 rounded-2xl md:rounded-full shadow-2xl border border-white/50 animate-in fade-in slide-in-from-top-4 duration-700 max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                {hospitalBranding.logo_path ? (
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-teal-50 flex-shrink-0 bg-white shadow-sm">
                    <img
                      src={resolveAssetUrl(hospitalBranding.logo_path)}
                      alt={hospitalBranding.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                    <Building2 size={32} />
                  </div>
                )}
                <div className="flex flex-col">
                  <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 uppercase tracking-tight leading-tight">
                    {hospitalBranding.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="hidden md:block w-8 h-px bg-gray-400"></span>
                    <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider font-medium">
                      Hospital Information System
                    </p>
                    <span className="hidden md:block w-8 h-px bg-gray-400"></span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block h-16 w-px bg-gray-300 transform scale-y-90"></div>

              <div className="flex flex-col md:flex-row items-center gap-3 pl-0 md:pl-2">
                <span className="text-sm text-gray-500 italic font-medium">powered by</span>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    className="h-6 w-auto"
                    alt="Vijomedix"
                  />
                  <span className="text-lg font-bold text-teal-700 tracking-tight">Vijomedix</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6 w-40 h-40 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <img
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="Vijomedix"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur px-6 py-2 rounded-full border border-gray-200/50">
                <span className="text-gray-500 font-medium">Welcome to</span>
                <span className="text-xl font-bold text-gray-800">
                  Vijomedix <span className="text-teal-600">HMIS</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-base">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-teal-600 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="text-gray-600 text-sm mb-6">
            <p>(c) 2026 NextViJo HMIS. All rights reserved.</p>
          </div>

          <div
            onClick={handleNextViJoClick}
            className="group cursor-pointer inline-flex items-center gap-2 bg-gray-100 rounded-full px-5 py-2.5 border border-gray-200 hover:bg-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <span className="text-gray-700 text-sm font-medium group-hover:text-gray-900 transition-colors">
              Powered by
            </span>
            <span className="text-teal-600 font-semibold text-sm group-hover:text-teal-700 transition-colors">
              NexViJo
            </span>
            <ExternalLink
              size={14}
              className="text-gray-600 group-hover:text-gray-800 group-hover:translate-x-0.5 transition-all"
            />
          </div>

          <p className="text-gray-500 text-xs mt-3 font-light">
            Crafting digital experiences that matter
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
