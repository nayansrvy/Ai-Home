import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home'; // Naya component import karo
import PrivacyHelp from "./pages/PrivacyHelp";
import SharedChat from './pages/SharedChat'; // Ye naya page hum banayenge

function App() {
  return (
    <Router>
      <Routes>
        {/* User pehle Login par jayega */}
        <Route path="/login" element={<Login />} />
        
        {/* Login hone ke baad Main Home Page */}
        <Route path="/" element={<Home />} />
        <Route path="/share/:sessionId" element={<SharedChat />} />
        <Route path="/privacy-help" element={<PrivacyHelp />} />
      </Routes>
    </Router>
  );
}

export default App;