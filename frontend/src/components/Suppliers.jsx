import { Plus, Search } from "lucide-react";

export default function Suppliers() {
  const suppliers = [
    {
      name: "ABC Tyres Ltd",
      contact: "0723 456 789",
      category: "Tyres",
      status: "Active",
    },
    {
      name: "Battery World Kenya",
      contact: "0712 987 654",
      category: "Batteries",
      status: "Active",
    },
    {
      name: "Lubricants Africa",
      contact: "0701 222 333",
      category: "Lubricants",
      status: "Inactive",
    },
  ];

  return (
    <div className="content">
      {/* Header */}
      <div className="page-header">
        <h1>Suppliers</h1>

        <div className="actions">
          <button className="btn btn-primary">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="table-toolbar">
        <div className="search">
          <Search size={16} />
          <input placeholder="Search suppliers..." />
        </div>
      </div>

      {/* Table */}
      <table className="table">
        <thead>
          <tr>
            <th>Supplier Name</th>
            <th>Contact</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((s, i) => (
            <tr key={i}>
              <td>{s.name}</td>
              <td>{s.contact}</td>
              <td>{s.category}</td>
              <td>
                <span className={`badge ${s.status.toLowerCase()}`}>
                  {s.status}
                </span>
              </td>
              <td>
                <button className="btn-link">View</button>
                <button className="btn-link danger">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
