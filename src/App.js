// src/App.js
import React, { useState, useEffect } from "react";
import Roulette from "./components/Roulette.js";
import Modal from "./components/Modal";
import {defaultRestaurants} from "./data/restaurants";
import "./App.css";

const utf8ToBase64 = (str) => {
  return window.btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const base64ToUtf8 = (str) => {
  str = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(str.length + (str.length % 4), '=');
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

  const [winner, setWinner] = useState(null);

  const handleDraw = () => {
    let suitableCandidates;
    if (suitablePeople) {
      suitableCandidates = candidates.filter(candidate => {
        const [min, max] = candidate.suitableFor;
        return suitablePeople >= min && suitablePeople <= max;
      });
    } else {
      suitableCandidates = candidates;
    }

    if (suitableCandidates.length > 0) {
      setWinner(null);
      // 룰렛 컴포넌트에 필터링된 후보 전달
    } else {
      alert('No suitable restaurants found for the given number of people.');
    }
  };

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
        <button onClick={handleOpenModal}>Add Restaurant</button>
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
            Suitable People:
            <input
              type="number"
              value={suitablePeople}
              onChange={(e) => setSuitablePeople(parseInt(e.target.value, 10) || '')}
            />
          </label>
          <button onClick={handleDraw}>Draw</button>
        </div>
      </div>
      <div className="roulette-container">
        <Roulette candidates={candidates.filter(candidate => {
          const [min, max] = candidate.suitableFor;
          return suitablePeople === '' || (suitablePeople >= min && suitablePeople <= max);
        })} onDraw={(winnerName) => setWinner(winnerName)} />
        {winner && (
          <div className="winner-announcement">
            <h2>Congratulations!</h2>
            <p>{winner} has been selected!</p>
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
