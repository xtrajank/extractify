import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './components/MainApp';
import ExportHelp from './help/ExportHelp';
import PasteHelp from './help/PasteHelp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/help/export" element={<ExportHelp />} />
        <Route path="/help/paste" element={<PasteHelp />} />
      </Routes>
    </Router>
  );
}

export default App;
