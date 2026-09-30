import ProtectedRoute from '../../src/components/ProtectedRoute';
import Layout from '../../src/components/Layout';

export default function KasirLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['petugas']}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}
