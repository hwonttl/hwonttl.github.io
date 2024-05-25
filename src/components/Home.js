// src/components/Home.js
import React, { useState } from 'react';
import Roulette from './Roulette';
import './Home.css';

const Home = ({ candidates }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [remainingCandidates, setRemainingCandidates] = useState(candidates);

  const handleDraw = (winner) => {
    const selected = remainingCandidates.find(candidate => candidate.name === winner);
    setSelectedCandidate(selected);
    setRemainingCandidates(remainingCandidates.filter(candidate => candidate.name !== winner));
  };

  const handleRedraw = () => {
    if (selectedCandidate) {
      handleDraw();
    }
  };

  return (
    <div className="home-container">
      <h1>Lunch Roulette</h1>
      <Roulette candidates={remainingCandidates} onDraw={handleDraw} />
      {selectedCandidate && (
        <div className="selected-restaurant">
          <h2>Selected Restaurant</h2>
          <p>{selectedCandidate.name}</p>
          <p>{selectedCandidate.menu.join(', ')}</p>
          <a href={selectedCandidate.mapLink} target="_blank" rel="noopener noreferrer">Map</a>
        </div>
      )}
      <button onClick={handleRedraw} className="redraw-button">Redraw</button>
    </div>
  );
};

export default Home;
