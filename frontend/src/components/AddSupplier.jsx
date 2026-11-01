export default function AddSupplier() {
  return (
    <div className="content">
      <h1>Add Supplier</h1>

      <form className="form">
        <div className="form-group">
          <label>Supplier Name</label>
          <input type="text" placeholder="e.g. ABC Tyres Ltd" required />
        </div>

        <div className="form-group">
          <label>Contact Person</label>
          <input type="text" placeholder="e.g. John Mwangi" />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" placeholder="e.g. 0712 345 678" required />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" placeholder="supplier@email.com" />
        </div>

        <div className="form-group">
          <label>Supplier Category</label>
          <select>
            <option>Tyres</option>
            <option>Batteries</option>
            <option>Lubricants</option>
            <option>Spare Parts</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Supplier
          </button>

          <button type="reset" className="btn btn-secondary">
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}
