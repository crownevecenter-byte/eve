// Legacy path — customer portal uses /my/book-service
import { Navigate } from 'react-router-dom';

export default function Appointments() {
  return <Navigate to="/my/book-service" replace />;
}
