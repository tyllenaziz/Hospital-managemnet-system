import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, Clock, CheckCircle, Stethoscope, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NurseDashboard() {
  const navigate = useNavigate();
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const [stats, setStats] = useState({
    waiting: 0,
    inProgress: 0,
    completed: 0
  });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/nurse`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQueue(data);
        
        // Calculate stats
        const waiting = data.filter(q => q.status === 'waiting').length;
        const inProgress = data.filter(q => q.status === 'in_progress').length;
        const completed = data.filter(q => q.status === 'done').length;
        
        setStats({ waiting, inProgress, completed });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatient = async (queueId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/fetch`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        navigate(`/nurse/vitals/${queueId}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to fetch patient');
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      alert('Network error. Please try again.');
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-xl shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${bgColor}`}>
          <Icon size={32} className={color.replace('border-', 'text-')} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nurse Dashboard</h1>
        <p className="text-gray-600">Record patient vitals and manage patient care</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Clock}
          title="Waiting Patients"
          value={stats.waiting}
          color="border-yellow-500"
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={Activity}
          title="In Progress"
          value={stats.inProgress}
          color="border-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Today"
          value={stats.completed}
          color="border-green-500"
          bgColor="bg-green-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/nurse/patients')}
          className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-4 border border-gray-200"
        >
          <Users className="text-teal-600" size={32} />
          <div className="text-left">
            <div className="font-semibold text-gray-900">View All Patients</div>
            <div className="text-sm text-gray-600">Browse patient records</div>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/nurse/prescriptions')}
          className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-4 border border-gray-200"
        >
          <FileText className="text-purple-600" size={32} />
          <div className="text-left">
            <div className="font-semibold text-gray-900">Prescriptions</div>
            <div className="text-sm text-gray-600">View prescriptions</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/nurse/lab-results')}
          className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-4 border border-gray-200"
        >
          <Stethoscope className="text-blue-600" size={32} />
          <div className="text-left">
            <div className="font-semibold text-gray-900">Lab Results</div>
            <div className="text-sm text-gray-600">View test results</div>
          </div>
        </button>
      </div>

      {/* Patient Queue */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition"
          >
            Refresh
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No patients in queue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Queue #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-teal-600">{patient.queue_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{patient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.age} / {patient.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {patient.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        patient.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        patient.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {patient.status === 'waiting' ? 'Waiting' :
                         patient.status === 'in_progress' ? 'In Progress' : 'Done'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(patient.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.status === 'waiting' && (
                        <button
                          onClick={() => fetchPatient(patient.id)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
                        >
                          Record Vitals
                        </button>
                      )}
                      {patient.status === 'in_progress' && (
                        <button
                          onClick={() => navigate(`/nurse/vitals/${patient.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          Continue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}