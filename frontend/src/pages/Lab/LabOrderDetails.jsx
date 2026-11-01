import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, FlaskConical, AlertCircle, CheckCircle, Send, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const LabOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/orders/${id}`);
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test) => {
    // Navigate to the dedicated test results entry page
    navigate(`/lab/orders/${id}/test/${test.item_id}`);
  };

  const handleStartOrder = async () => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/lab/orders/${id}/start`,
        { method: 'PUT' }
      );

      const data = await response.json();
      if (data.success) {
        await fetchOrderDetails();
      }
    } catch (err) {
      console.error('Error starting order:', err);
      setError(err.message || 'Failed to start order');
    }
  };

  const handleCompleteOrder = async () => {
    const allTestsCompleted = order.tests?.every(test => test.item_status === 'completed');

    if (!allTestsCompleted) {
      toast.error('Please complete all test results before sending back to doctor');
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/lab/orders/${id}/complete`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );

      const rawBody = await response.text();
      const data = rawBody ? JSON.parse(rawBody) : {};

      if (data.success) {
        toast.success('Lab order completed. Patient sent back to doctor.');
        navigate('/lab/dashboard');
      } else {
        setError(data.error || 'Failed to complete order');
      }
    } catch (err) {
      console.error('Error completing order:', err);
      setError(err.message || 'Failed to complete order');
    } finally {
      setCompleting(false);
    }
  };

  const allTestsHaveResults = () => {
    return order?.tests?.every(test => test.item_status === 'completed');
  };

  const getTestStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">COMPLETED</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">PENDING</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-slate-600 mt-4">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-slate-800 font-semibold mb-2">Order not found</h3>
          <p className="text-slate-600 mb-4">{error || 'Unable to load order'}</p>
          <button
            onClick={() => navigate('/lab/dashboard')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/lab/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="bg-teal-500 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Lab Order #{order.id}</h1>
                <p className="text-teal-100 text-sm">Patient: {order.patient_name}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={18} />
              </div>
              <div>
                <p className="text-slate-600 text-xs">Patient Info</p>
                <p className="text-slate-800 font-semibold text-sm">{order.age} yrs • {order.gender}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={18} />
              </div>
              <div>
                <p className="text-slate-600 text-xs">Order Date</p>
                <p className="text-slate-800 font-semibold text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={18} />
              </div>
              <div>
                <p className="text-slate-600 text-xs">Ordered By</p>
                <p className="text-slate-800 font-semibold text-sm">Dr. {order.doctor_name}</p>
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-md p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Clinical Notes</h2>
            <p className="text-slate-700 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Start Order Button - Show when order is pending */}
        {order.status === 'pending' && (
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200 shadow-md p-4">
            <div className="flex items-center gap-3 mb-3">
              <FlaskConical className="text-blue-600" size={24} />
              <div>
                <h3 className="text-blue-800 font-semibold">Order Ready for Processing</h3>
                <p className="text-blue-700 text-sm">Click below to start processing this lab order</p>
              </div>
            </div>
            <button
              onClick={handleStartOrder}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <FlaskConical size={16} />
              <span>Start Processing Order</span>
            </button>
          </div>
        )}

        {/* Complete Order Button - Show when all tests completed */}
        {order.status === 'in_progress' && allTestsHaveResults() && (
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200 shadow-md p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h3 className="text-green-800 font-semibold">All Tests Completed</h3>
                <p className="text-green-700 text-sm">Ready to send results back to doctor</p>
              </div>
            </div>
            <button
              onClick={handleCompleteOrder}
              disabled={completing}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {completing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending to Doctor...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Complete Order & Send to Doctor</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lab Tests as Clickable Cards */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
          <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FlaskConical className="text-teal-600" size={20} />
              Lab Tests ({order.tests?.length || 0})
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {order.status === 'pending'
                ? 'Start processing the order to enter test results'
                : 'Click on a test to enter or update results'}
            </p>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {order.tests?.map((test) => (
              <button
                key={test.item_id}
                onClick={() => order.status !== 'pending' && handleTestClick(test)}
                disabled={order.status === 'pending'}
                className={`p-4 rounded-xl border-2 transition text-left group ${order.status === 'pending'
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75'
                  : test.item_status === 'completed'
                    ? 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md'
                    : 'border-gray-200 bg-white hover:border-teal-400 hover:shadow-md'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className={`font-semibold transition ${order.status === 'pending' ? 'text-gray-500' : 'text-gray-800 group-hover:text-teal-700'
                      }`}>
                      {test.test_name}
                    </h3>
                    <p className="text-xs text-gray-500">{test.category} • {test.test_code}</p>
                  </div>
                  {getTestStatusBadge(test.item_status)}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    {test.parameters?.length || 0} parameter(s)
                  </p>
                  {order.status === 'pending' ? (
                    <span className="text-xs text-gray-400">
                      Start order first
                    </span>
                  ) : test.item_status === 'completed' ? (
                    <span className="text-xs text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Edit2 size={12} />
                      Click to edit
                    </span>
                  ) : (
                    <span className="text-xs text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      Click to enter results
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default LabOrderDetails;
