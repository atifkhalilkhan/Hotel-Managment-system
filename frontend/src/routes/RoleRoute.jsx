/* Gate for pages restricted to selected account roles. */
export default function RoleRoute({ user, roles, children }) {
  return user && roles.includes(user.role) ? children : null;
}
