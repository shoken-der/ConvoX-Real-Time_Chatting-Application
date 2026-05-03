import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider } from "./contexts/ToastContext";
import Register from "./components/accounts/Register";
import Login from "./components/accounts/Login";
import EmailVerification from "./components/accounts/EmailVerification";

import WithPrivateRoute from "./utils/WithPrivateRoute";
import ChatLayout from "./components/layouts/ChatLayout";

import ProfileSetup from "./components/accounts/ProfileSetup";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ToastProvider>
          <div className="min-h-screen bg-background text-white">
            <Router>
              <Routes>
                <Route exact path="/register" element={<Register />} />
                <Route exact path="/login" element={<Login />} />
                <Route exact path="/verify-email" element={<EmailVerification />} />
                <Route
                  exact
                  path="/profile-setup"
                  element={
                    <WithPrivateRoute skipProfileCheck={true}>
                      <ProfileSetup />
                    </WithPrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/"
                  element={
                    <WithPrivateRoute>
                      <ChatLayout />
                    </WithPrivateRoute>
                  }
                />
              </Routes>
            </Router>
          </div>
        </ToastProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
