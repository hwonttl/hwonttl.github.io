import React, { useState, useEffect } from "react";
import "./Modal.css";

const Modal = ({ isOpen, onClose, onSubmit, restaurant, setRestaurant }) => {
  const [localRestaurant, setLocalRestaurant] = useState({ ...restaurant });

  useEffect(() => {
    setLocalRestaurant({
      ...restaurant,
      menu: Array.isArray(restaurant.menu) ? restaurant.menu.join(', ') : restaurant.menu,
      suitableFor: Array.isArray(restaurant.suitableFor) ? restaurant.suitableFor.join(', ') : restaurant.suitableFor,
    });
  }, [restaurant]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedRestaurant = {
      ...localRestaurant,
      menu: localRestaurant.menu.split(',').map(item => item.trim()),
      suitableFor: localRestaurant.suitableFor.split(',').map(num => parseInt(num.trim(), 10)),
    };
    onSubmit(updatedRestaurant);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{localRestaurant.name ? "Edit Restaurant" : "Add Restaurant"}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <input type="text" name="name" value={localRestaurant.name} onChange={handleChange} required />
          </div>
          <div>
            <label>Menu (comma separated)</label>
            <input type="text" name="menu" value={localRestaurant.menu} onChange={handleChange} required />
          </div>
          <div>
            <label>Map Link</label>
            <input type="text" name="mapLink" value={localRestaurant.mapLink} onChange={handleChange} required />
          </div>
          <div>
            <label>Suitable For (comma separated min, max)</label>
            <input type="text" name="suitableFor" value={localRestaurant.suitableFor} onChange={handleChange} required />
          </div>
          <div>
            <label>URL</label>
            <input type="text" name="url" value={localRestaurant.url} onChange={handleChange} required />
          </div>
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default Modal;
