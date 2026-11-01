import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpensePie() {
  const data = {
    labels: ["Salaries", "Transport", "Utilities", "Misc"],
    datasets: [
      {
        data: [120000, 30000, 20000, 15000],
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#f59e0b",
          "#dc2626",
        ],
      },
    ],
  };

  return (
    <div style={{ maxWidth: "400px" }}>
      <h2>Expense Breakdown</h2>
      <Pie data={data} />
    </div>
  );
}
