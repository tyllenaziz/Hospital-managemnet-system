export default function Expenses() {
  return (
    <div>
      <h2>Miscellaneous Expenses</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount (KES)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-01-10</td>
            <td>Internet</td>
            <td>3,000</td>
          </tr>
          <tr>
            <td>2026-01-15</td>
            <td>Office Supplies</td>
            <td>2,200</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
