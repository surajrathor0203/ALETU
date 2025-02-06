
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Redirect to appropriate dashboard based on user type
    const userType = user.userType?.toLowerCase() || '';
    return <Navigate to={`/dashboard/${userType}`} />;
  }

  return children;
};

export default PublicRoute;