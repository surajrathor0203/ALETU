import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Cookies from 'js-cookie';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const hasAuthCookie = Cookies.get('auth') || parseInt(Cookies.get('auth_chunks') || '0') > 0;
  
  if (!user && !hasAuthCookie) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;