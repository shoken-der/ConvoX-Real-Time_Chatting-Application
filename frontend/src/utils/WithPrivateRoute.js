import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const WithPrivateRoute = ({ children, skipProfileCheck = false }) => {
  const { currentUser } = useAuth();

  // 1. If not logged in, go to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in but NOT verified (OTP bypassed), force back to verification
  // Note: Backend ensures only verified users get a token, but this prevents UI bypass
  if (!currentUser.enabled) {
    return <Navigate to="/verify-email" replace state={{ email: currentUser.email }} />;
  }

  // 3. If verified but profile NOT completed, force to profile setup
  if (!currentUser.profileCompleted && !skipProfileCheck) {
    return <Navigate to="/profile-setup" replace />;
  }

  // 4. All checks passed, let them through
  return children;
};

export default WithPrivateRoute;
