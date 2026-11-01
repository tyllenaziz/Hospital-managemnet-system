export default function Salaries() {
  return (
    <div>
      <h2>Staff Salaries</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Role</th>
            <th>Amount (KES)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Mwangi</td>
            <td>Store Manager</td>
            <td>45,000</td>
          </tr>
          <tr>
            <td>Jane Wanjiku</td>
            <td>Accountant</td>
            <td>55,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
