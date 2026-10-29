import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Join from './pages/Join.jsx';
import Me from './pages/Me.jsx';
import Admin from './pages/Admin.jsx';

// Static preview copies (`npm run build:static`) may be hosted in any folder
// with no server to answer /join etc., so they use #/join-style addresses.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/join" element={<Join />} />
        <Route path="/me" element={<Me />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
