import {
  Wallet,
  Users,
  Package,
  AlertTriangle
} from "lucide-react";

export default function DashboardCards() {
  const cards = [
    {
      title: "Total Expenses",
      value: "KES 185,000",
      icon: <Wallet size={22} />,
      color: "blue",
    },
    {
      title: "Staff Count",
      value: "12",
      icon: <Users size={22} />,
      color: "green",
    },
    {
      title: "Stock Items",
      value: "248",
      icon: <Package size={22} />,
      color: "purple",
    },
    {
      title: "Low Stock Alerts",
      value: "5",
      icon: <AlertTriangle size={22} />,
      color: "red",
    },
  ];

  return (
    <div className="cards">
      {cards.map((c, i) => (
        <div key={i} className={`card card-${c.color}`}>
          <div className="card-header">
            <span className="icon">{c.icon}</span>
            <h3>{c.title}</h3>
          </div>
          <p className="card-value">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
