
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user || user.userType !== 'Admin') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default AdminRoute;