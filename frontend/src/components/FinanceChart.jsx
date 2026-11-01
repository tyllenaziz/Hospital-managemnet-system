import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function FinanceChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [
      {
        label: "Expenses (KES)",
        data: [45000, 38000, 52000, 41000],
      },
    ],
  };

  return (
    <div style={{ maxWidth: "600px" }}>
      <h2>Monthly Expenses</h2>
      <Bar data={data} />
    </div>
  );
}
