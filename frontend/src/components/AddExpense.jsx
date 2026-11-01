import { useState } from "react";

export default function AddExpense() {
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Expense Added:", form);
    alert("Expense saved (demo)");
  };

  return (
    <div>
      <h2>Add Expense</h2>

      <form onSubmit={handleSubmit} className="form">
        <input type="date" name="date" onChange={handleChange} required />
        <input
          type="text"
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount (KES)"
          onChange={handleChange}
          required
        />
        <button type="submit">Save Expense</button>
      </form>
    </div>
  );
}
