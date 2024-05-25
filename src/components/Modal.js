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
        <h2>식당 정보</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>이름(<span style={{color: "red"}}>*</span>)</label>
            <input type="text" name="name" value={localRestaurant.name} onChange={handleChange} required />
          </div>
          <div>
            <label>메뉴 (콤마구분)</label>
            <input type="text" name="menu" value={localRestaurant.menu} onChange={handleChange} />
          </div>
          <div>
            <label>지도 링크</label>
            <input type="text" name="mapLink" value={localRestaurant.mapLink} onChange={handleChange} />
          </div>
          <div>
            <label>적정 인원 (콤마구분 최소, 최대)</label>
            <input type="text" name="suitableFor" value={localRestaurant.suitableFor} onChange={handleChange} required />
          </div>
          <div>
            <label>기타 링크</label>
            <input type="text" name="url" value={localRestaurant.url} onChange={handleChange} />
          </div>
          <button type="submit">제출</button>
          <button type="button" onClick={onClose}>취소</button>
        </form>
      </div>
    </div>
  );
};

export default Modal;
