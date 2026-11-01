import { useState } from "react";

export default function AddStock() {
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");

  const submitStock = (e) => {
    e.preventDefault();
    console.log("Stock Added:", item, qty);
    alert("Stock saved (demo)");
  };

  return (
    <div>
      <h2>Add Stock</h2>

      <form onSubmit={submitStock} className="form">
        <input
          type="text"
          placeholder="Item name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
        />
        <button type="submit">Add Stock</button>
      </form>
    </div>
  );
}
