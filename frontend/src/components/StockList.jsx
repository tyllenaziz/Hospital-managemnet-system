export default function StockList() {
  return (
    <div>
      <h2>Stock List</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tyres</td>
            <td>12</td>
            <td>OK</td>
          </tr>
          <tr className="low">
            <td>Batteries</td>
            <td>4</td>
            <td>Low</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
