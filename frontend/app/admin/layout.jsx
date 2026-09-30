import ProtectedRoute from '../../src/components/ProtectedRoute';
import Layout from '../../src/components/Layout';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
