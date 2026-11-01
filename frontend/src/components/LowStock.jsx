import { AlertTriangle } from "lucide-react";

export default function LowStock() {
  const lowStockItems = [
    { name: "Batteries", remaining: 4 },
    { name: "Engine Oil", remaining: 2 },
    { name: "Tyres", remaining: 3 },
    { name: "Brake Pads", remaining: 1 },
  ];

  return (
    <div className="lowstock-page">
      <h2>Low Stock Alerts</h2>

      <div className="lowstock-cards">
        {lowStockItems.map((item, index) => (
          <div key={index} className={`lowstock-card ${item.remaining <= 2 ? 'critical' : ''}`}>
            <AlertTriangle size={24} className="alert-icon" />
            <div className="item-info">
              <p className="item-name">{item.name}</p>
              <p className="item-remaining">{item.remaining} remaining</p>
            </div>
            <button className="reorder-btn">Reorder</button>
          </div>
        ))}
      </div>
    </div>
  );
}
