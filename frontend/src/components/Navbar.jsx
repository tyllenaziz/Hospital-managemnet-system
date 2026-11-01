import { Menu, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';

const Navbar = ({ onMenuClick }) => {
  const { user, logout, API_BASE_URL } = useAuth();

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      doctor: 'bg-blue-100 text-blue-800 border-blue-200',
      receptionist: 'bg-green-100 text-green-800 border-green-200',
      reception: 'bg-green-100 text-green-800 border-green-200',
      pharmacy: 'bg-teal-100 text-teal-800 border-teal-200',
      lab: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSettingsClick = () => {
    window.location.href = '/settings';
  };

  // Check if sidebar should be hidden (for receptionist)
  const showMenuButton = user?.role !== 'receptionist' && user?.role !== 'reception';

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Only show menu button if not receptionist */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900"
              >
                <Menu size={24} />
              </button>
            )}

            {/* Branding Section (Left) */}
            <div className="flex items-center gap-4">
              {/* Vijomedix Logo (Always Visible) */}
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Vijomedics Medical"
                className="h-14 w-auto"
              />
              <span className="hidden md:block text-2xl font-bold text-teal-700 tracking-tight">Vijomedix</span>

              {/* Mobile View - Simplified */}
              <div className="md:hidden flex flex-col pl-2">
                <span className="text-gray-900 font-bold text-sm">{user?.hospital_name || 'VIJOMEDIX'}</span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">

            {/* Hospital Branding (Desktop Center/Right) */}
            {user?.hospital_name && (
              <div className="hidden md:flex items-center gap-3 mr-4 pr-4 border-r border-gray-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gray-500">Vijomedix has customized this system for</span>
                  <span className="text-sm font-bold text-gray-800 leading-tight">{user.hospital_name}</span>
                </div>
                {user.hospital_logo && (
                  <img
                    src={resolveAssetUrl(user.hospital_logo)}
                    alt={user.hospital_name}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                  />
                )}
              </div>
            )}
            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-gray-900 text-sm font-medium">{user?.username}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>

              <div className="relative group">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-blue-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-gray-900 text-sm font-medium">{user?.username}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>

                  {/* Settings Option - Only for Admin */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleSettingsClick}
                      className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <Settings size={16} />
                      System Settings
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-gray-50 rounded-b-lg transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
