// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import { decodeData } from './utils/base64';
import { defaultRestaurants } from './data/restaurants';

const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get('data');
  const candidates = encodedData ? decodeData(encodedData) : defaultRestaurants;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home candidates={candidates} />} />
      </Routes>
    </Router>
  );
};

export default App;
