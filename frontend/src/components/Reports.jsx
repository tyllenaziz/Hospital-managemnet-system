import { Download, Calendar } from "lucide-react";

export default function Reports() {
  return (
    <div className="content">
      {/* Header */}
      <div className="page-header">
        <h1>Finance Reports</h1>

        <div className="actions">
          <button className="btn btn-outline">
            <Calendar size={16} />
            Monthly
          </button>
          <button className="btn btn-outline">
            <Calendar size={16} />
            Yearly
          </button>
          <button className="btn btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cards">
        <div className="card highlight">
          <h3>Monthly Expenses</h3>
          <p>KES 85,000</p>
          <span className="muted">January 2026</span>
        </div>

        <div className="card">
          <h3>Yearly Expenses</h3>
          <p>KES 1,020,000</p>
          <span className="muted">2026</span>
        </div>

        <div className="card success">
          <h3>Approved Payments</h3>
          <p>KES 780,000</p>
          <span className="muted">Completed</span>
        </div>

        <div className="card warning">
          <h3>Pending Payments</h3>
          <p>KES 240,000</p>
          <span className="muted">Awaiting approval</span>
        </div>
      </div>
    </div>
  );
}
