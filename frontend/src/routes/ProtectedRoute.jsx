/* Gate for pages that require an authenticated account. */
export default function ProtectedRoute({ user, children }) {
  return user ? children : null;
}
