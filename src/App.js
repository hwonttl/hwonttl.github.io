import React, { useState, useEffect } from "react";
import Roulette from "./components/Roulette.js";
import Modal from "./components/Modal";
import {defaultRestaurants} from "./data/restaurants";

import "./App.css";

const utf8ToBase64 = (str) => {
  return window.btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
};

const base64ToUtf8 = (str) => {
  str = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return decodeURIComponent(escape(window.atob(str)));
};

const App = () => {
  const [candidates, setCandidates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState({ name: "", menu: "", mapLink: "", suitableFor: "", url: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [suitablePeople, setSuitablePeople] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get("data");

    if (encodedData) {
      try {
        debugger;
        const decodedData = JSON.parse(base64ToUtf8(encodedData));
        setCandidates(decodedData);
      } catch (error) {
        console.error("Failed to decode data", error);
      }
    } else {
      const encodedDefaultData = utf8ToBase64(JSON.stringify(defaultRestaurants));
      debugger;
      window.location.replace(`${window.location.pathname}?data=${encodedDefaultData}`);
    }
  }, []);

  const [winner, setwinner] = useState(null);

  const handleOpenModal = () => {
    setSelectedRestaurant({ name: "", menu: "", mapLink: "", suitableFor: "", url: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRestaurant({ name: "", menu: "", mapLink: "", suitableFor: "", url: "" });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleAddRestaurant = (restaurant) => {
    if (isEditing && editingIndex !== null) {
      const updatedCandidates = [...candidates];
      updatedCandidates[editingIndex] = restaurant;
      setCandidates(updatedCandidates);
      updateUrl(updatedCandidates);
    } else {
      setCandidates((prev) => [...prev, restaurant]);
      updateUrl([...candidates, restaurant]);
    }
    handleCloseModal();
  };

  const handleEditRestaurant = (index) => {
    setSelectedRestaurant(candidates[index]);
    setIsEditing(true);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleRemoveRestaurant = (index) => {
    const updatedCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(updatedCandidates);
    updateUrl(updatedCandidates);
  };

  const updateUrl = (data) => {
    const encodedData = utf8ToBase64(JSON.stringify(data));
    window.history.replaceState(null, "", `${window.location.pathname}?data=${encodedData}`);
  };

  return (
    <div className="App">
      <div className="control-panel">
        <h1>Lunch Roulette</h1>
        <button className="add-button" onClick={handleOpenModal}>식당 추가</button>
        <ul>
          {candidates.map((candidate, index) => (
            <li key={index} className="restaurant-item">
              <button className="restaurant-button" onClick={() => handleEditRestaurant(index)}>
                {candidate.name} ({candidate.suitableFor[0]}~{candidate.suitableFor[1]}명)
              </button>
              <button className="remove-button" onClick={() => handleRemoveRestaurant(index)}>X</button>
            </li>
          ))}
        </ul>
        <div>
          <label>
            몇 명이 먹기 적합한 식당을 찾으시나요?
            <br/>(입력하지 않으면 모든 식당이 대상입니다):
            <input
              type="number"
              value={suitablePeople}
              onChange={(e) => setSuitablePeople(parseInt(e.target.value, 10) || '')}
            />
          </label>
        </div>
      </div>
      <div className="roulette-container">
        <Roulette candidates={candidates.filter(candidate => {
          const [min, max] = candidate.suitableFor;
          return suitablePeople === '' || (suitablePeople >= min && suitablePeople <= max);
        })} onDraw={(winner) => setwinner(winner)} />
        {winner && (
          <div className="winner-announcement">
            <h2>축하합니다!</h2>
            <p>오늘 점심은 <span style={{fontWeight: 'bold'}}>{winner.name}</span> 입니다!</p>
            {winner.mapLink && <p onClick={() => window.open(winner.mapLink)}>{winner.mapLink}</p>}
            {winner.mapLink && <button className="copy-map-link" onClick={() => navigator.clipboard.writeText(winner.mapLink)}>Copy Map Link</button>}
            <button id="reset-button" className="reset-button">
              Reset
            </button>
          </div>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddRestaurant}
        restaurant={selectedRestaurant}
        setRestaurant={setSelectedRestaurant}
      />
    </div>
  );
};

export default App;
