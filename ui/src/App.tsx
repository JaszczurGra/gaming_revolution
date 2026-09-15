/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import GameProfile from './pages/GameProfile';
import Chatbot from './pages/Chatbot';
import PlayAi from './pages/PlayAi';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="game/:gameId" element={<GameProfile />} />
            <Route path="game/:gameId/chat" element={<Chatbot />} />
            <Route path="game/:gameId/play" element={<PlayAi />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
