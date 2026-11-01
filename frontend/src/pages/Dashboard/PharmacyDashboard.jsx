// ============================================
// PharmacyDashboard.jsx - Updated without Low Stock Alerts
// ============================================
import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Pill, Scan, Search, Eye, ShoppingCart, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    totalMedicines: 0
  });

  const [pharmacyQueue, setPharmacyQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPharmacyData();
    const interval = setInterval(fetchPharmacyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPharmacyData = async () => {
    try {
      // Fetch pharmacy queue
      const queueResponse = await authenticatedFetch(`${API_BASE_URL}/queue/pharmacy?status=waiting`);
      const queueData = await queueResponse.json();
      setPharmacyQueue(Array.isArray(queueData) ? queueData : []);

      const pendingPrescriptionsResponse = await authenticatedFetch(
        `${API_BASE_URL}/prescriptions/status/pending?limit=100`
      );
      const pendingPrescriptionsData = await pendingPrescriptionsResponse.json();
      const pendingPrescriptions = Array.isArray(pendingPrescriptionsData.prescriptions)
        ? pendingPrescriptionsData.prescriptions
        : [];

      // Fetch all medicines for total count
      const medicinesResponse = await authenticatedFetch(`${API_BASE_URL}/medicines`);
      const medicinesData = await medicinesResponse.json();

      setStats({
        pendingPrescriptions: pendingPrescriptions.length,
        dispensedToday: 0, // This would come from a separate endpoint
        totalMedicines: medicinesData.medicines?.length || medicinesData.length || 0
      });
    } catch (err) {
      console.error('Error fetching pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = pharmacyQueue.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.queue_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${color} bg-opacity-10 rounded-lg`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pharmacy Dashboard</h1>
            <p className="text-sm text-gray-600">Manage medicines and prescriptions</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/pharmacy/direct-sale"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <ShoppingCart size={18} />
              Direct Sale
            </Link>
            
          </div>
        </div>

        {/* Stats Grid - Now 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={Pill}
            title="Pending Prescriptions"
            value={stats.pendingPrescriptions}
            color="bg-yellow-500"
            bgColor="bg-white"
          />
          <StatCard
            icon={TrendingUp}
            title="Dispensed Today"
            value={stats.dispensedToday}
            color="bg-green-500"
            bgColor="bg-white"
          />
          <StatCard
            icon={Package}
            title="Total Medicines"
            value={stats.totalMedicines}
            color="bg-teal-500"
            bgColor="bg-white"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/pharmacy/medicines"
            className="bg-white rounded-lg p-4 border border-green-200 hover:border-green-400 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                <Package size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-gray-800 font-semibold">Inventory</h3>
                <p className="text-gray-600 text-xs">Manage stock</p>
              </div>
            </div>
          </Link>

          <Link
            to="/pharmacy/dispensed"
            className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                <FileText size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-gray-800 font-semibold">Dispensed List</h3>
                <p className="text-gray-600 text-xs">View & print receipts</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pharmacy Queue - Full Width */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-gray-800">Pharmacy Queue ({filteredQueue.length})</h2>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="p-4">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-12">
                <Pill className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 text-sm">No patients in queue</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredQueue.map((patient) => (
                  <div key={patient.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:border-teal-300 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-teal-600 font-mono font-semibold text-sm">{patient.queue_number}</span>
                        <h3 className="text-gray-800 font-medium">{patient.name}</h3>
                        <p className="text-gray-600 text-xs">{patient.age} yrs • {patient.gender}</p>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(patient.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/pharmacy/dispense/${patient.id}`)}
                      className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Dispense
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
