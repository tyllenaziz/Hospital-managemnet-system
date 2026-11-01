import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Package,
  FileText,
  Eye,
  RefreshCw,
  Stethoscope,
  Pill,
  Microscope
} from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { authenticatedFetch } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    todayAppointments: 0,
    revenue: 0,
    presentStaff: 0,
    activeUsers: 0,
    totalRevenue: 0,
    systemStatus: 'Active'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState({
    main: true,
    activity: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(prev => ({ ...prev, main: true, activity: true }));

      // Fetch main dashboard stats
      const statsResponse = await authenticatedFetch(API_ENDPOINTS.ADMIN_DASHBOARD_STATS);
      const statsData = await statsResponse.json();

      if (statsData.success && statsData.stats) {
        const stats = statsData.stats;
        setDashboardStats({
          totalPatients: stats.totalPatients || 0,
          totalStaff: stats.totalStaff || 0,
          todayAppointments: stats.todayAppointments || 0,
          revenue: stats.todayRevenue || 0,
          todayExpenses: stats.todayExpenses || 0,
          todayProfit: stats.todayProfit || 0,
          presentStaff: stats.presentStaff || 0,
          activeUsers: stats.activeUsers || 0,
          totalRevenue: stats.totalRevenue || 0,
          totalExpenses: stats.totalExpenses || 0,
          totalProfit: stats.totalProfit || 0,
          systemStatus: stats.systemStatus || 'Active'
        });

        // Set recent activity
        if (stats.recentActivity) {
          setRecentActivity(stats.recentActivity);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setStatsLoading(prev => ({ ...prev, main: false, activity: false }));
      setLoading(false);
    }
  };

  const refreshAllData = () => {
    setLoading(true);
    setStatsLoading({ main: true, activity: true });
    fetchDashboardData();
  };

  const StatCard = ({ icon: Icon, title, value, change, color, loading, subtitle, trend }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
          )}
          {trend && !loading && (
            <div className={`flex items-center gap-1 text-sm font-medium mt-2 ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
              <TrendingUp size={14} className={trend < 0 ? 'transform rotate-180' : ''} />
              <span>{trend > 0 ? '+' : ''}{trend}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} ml-4`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, link, buttonText, color }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
          <Link to={link}>
            <button className={`px-5 py-2.5 rounded-xl text-white font-semibold hover:shadow-lg transition-all duration-300 ${color.replace('bg-', 'bg-').replace('/20', '')} hover:scale-105`}>
              {buttonText}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  const SystemStatusCard = ({ title, status, value, description, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-gray-900 font-bold">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-800' :
          status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
          {status}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={refreshAllData}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          title="Total Patients"
          value={dashboardStats.totalPatients.toLocaleString()}
          trend={8}
          color="bg-blue-600"
          loading={statsLoading.main}
          subtitle="Registered patients"
        />
        <StatCard
          icon={UserCheck}
          title="Total Staff"
          value={dashboardStats.totalStaff}
          trend={5}
          color="bg-green-600"
          loading={statsLoading.main}
          subtitle="Medical team"
        />
        <StatCard
          icon={Calendar}
          title="Today's Appointments"
          value={dashboardStats.todayAppointments}
          trend={-2}
          color="bg-purple-600"
          loading={statsLoading.main}
          subtitle="Scheduled visits"
        />
        <StatCard
          icon={DollarSign}
          title="Revenue Today"
          value={`KES ${dashboardStats.revenue.toLocaleString()}`}
          trend={12}
          color="bg-blue-600"
          loading={statsLoading.main}
          subtitle={`Total: KES ${dashboardStats.totalRevenue.toLocaleString()}`}
        />
        <StatCard
          icon={TrendingUp}
          title="Expenses Today"
          value={`KES ${dashboardStats.todayExpenses?.toLocaleString() || '0'}`}
          color="bg-red-500"
          loading={statsLoading.main}
          subtitle={`Total: KES ${dashboardStats.totalExpenses?.toLocaleString() || '0'}`}
        />
        <StatCard
          icon={Activity}
          title="Net Profit Today"
          value={`KES ${dashboardStats.todayProfit?.toLocaleString() || '0'}`}
          color={dashboardStats.todayProfit >= 0 ? "bg-emerald-600" : "bg-orange-600"}
          loading={statsLoading.main}
          subtitle={`Total Profit: KES ${dashboardStats.totalProfit?.toLocaleString() || '0'}`}
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <QuickActionCard
              icon={UserCheck}
              title="Manage Staff"
              description="Add new staff members or manage existing team members"
              link="/admin/add-staff"
              buttonText="Manage Staff"
              color="bg-teal-500"
            />
            <QuickActionCard
              icon={Package}
              title="Inventory Dashboard"
              description="Manage hospital inventory, medicines and equipment"
              link="/admin/inventory/dashboard"
              buttonText="View Inventory"
              color="bg-blue-500"
            />
            <QuickActionCard
              icon={FileText}
              title="View Reports"
              description="Generate and view comprehensive system reports"
              link="/admin/reports"
              buttonText="View Reports"
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="space-y-4">
              {statsLoading.activity ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 p-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className={`p-2 rounded-lg ${activity.type === 'patient' ? 'bg-blue-100' :
                      activity.type === 'appointment' ? 'bg-purple-100' :
                        activity.type === 'payment' ? 'bg-green-100' :
                          'bg-gray-100'
                      }`}>
                      <Activity size={16} className={
                        activity.type === 'patient' ? 'text-blue-600' :
                          activity.type === 'appointment' ? 'text-purple-600' :
                            activity.type === 'payment' ? 'text-green-600' :
                              'text-gray-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium text-sm">{activity.action}</p>
                      <p className="text-gray-500 text-xs">
                        {activity.user} • {activity.time}
                        {activity.details && ` • ${activity.details}`}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-lg">No recent activity</p>
                  <p className="text-gray-400 text-sm">Activities will appear here as they happen</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link to="/admin/activity">
                <button className="w-full py-3 text-blue-600 hover:text-blue-700 transition-colors text-sm font-semibold hover:bg-blue-50 rounded-xl">
                  View All Activity
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SystemStatusCard
            icon={Activity}
            title="System Health"
            status={dashboardStats.systemStatus}
            value="All Systems Operational"
            description="Overall system status"
            color="bg-green-500"
          />

          <SystemStatusCard
            icon={Users}
            title="Active Users"
            status="Active"
            value={`${dashboardStats.activeUsers} Online`}
            description="Currently active staff"
            color="bg-blue-500"
          />

          <SystemStatusCard
            icon={UserCheck}
            title="Staff Present"
            status="Normal"
            value={`${dashboardStats.presentStaff}/${dashboardStats.totalStaff}`}
            description="Today's attendance"
            color="bg-teal-500"
          />
        </div>
      </div>

      {/* Department Status */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Department Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Stethoscope size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Doctor's Office</h3>
                <p className="text-blue-100 text-sm">Ready for consultations</p>
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold">{dashboardStats.todayAppointments} Appointments</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Pill size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Pharmacy</h3>
                <p className="text-green-100 text-sm">Stock available</p>
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold">Ready</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Microscope size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Laboratory</h3>
                <p className="text-purple-100 text-sm">Tests processing</p>
              </div>
            </div>
            <div className="mt-4 text-2xl font-bold">Operational</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;