/* User directory with live filters and administrator-only account actions. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, UserRoundCheck, UserRoundX } from "lucide-react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Input, Loader, Modal, PageHeader, Select, Table } from "../components/UI.jsx";

const roles = ["admin", "manager", "receptionist", "housekeeping", "guest"];
const emptyForm = { name: "", email: "", password: "", phone: "", role: "receptionist" };

function RoleBadge({ role }) { return <Badge tone={role === "admin" ? "primary" : "neutral"}>{role}</Badge>; }
function StatusBadge({ active }) { return <Badge tone={active ? "success" : "error"}>{active ? "Active" : "Deactivated"}</Badge>; }

export default function Users() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setUsers(await api.get("/users")); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/users")
      .then((result) => { if (active) setUsers(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredUsers = useMemo(() => users.filter((entry) => {
    const query = search.trim().toLowerCase();
    return (!query || `${entry.name} ${entry.email}`.toLowerCase().includes(query))
      && (roleFilter === "all" || entry.role === roleFilter)
      && (statusFilter === "all" || (statusFilter === "active" ? entry.isActive : !entry.isActive));
  }), [users, search, roleFilter, statusFilter]);

  function openCreate() {
    setSelected(null); setForm(emptyForm); setModalError(""); setModal("create");
  }
  function openEdit(entry) {
    setSelected(entry); setForm({ name: entry.name || "", email: entry.email || "", password: "", phone: entry.phone || "", role: entry.role }); setModalError(""); setModal("edit");
  }
  function closeModal() { if (!saving) { setModal(""); setModalError(""); } }

  async function saveUser(event) {
    event.preventDefault();
    setModalError("");
    if (!form.name.trim()) return setModalError("Name is required.");
    if (modal === "create" && (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) return setModalError("Enter a valid email address.");
    if (modal === "create" && form.password.length < 6) return setModalError("Password must be at least 6 characters.");
    setSaving(true);
    try {
      if (modal === "create") {
        await api.post("/users", form);
        setSuccess("User created successfully.");
      } else {
        await api.put(`/users/${selected._id}`, { name: form.name, phone: form.phone, role: form.role });
        setSuccess("User updated successfully.");
      }
      setModal("");
      await loadUsers();
    } catch (requestError) { setModalError(requestError.message); } finally { setSaving(false); }
  }

  async function toggleStatus() {
    if (!confirmTarget) return;
    setToggling(true);
    try {
      const result = await api.patch(`/users/${confirmTarget._id}/status`);
      setSuccess(result.message || "User status updated.");
      setConfirmTarget(null);
      await loadUsers();
    } catch (requestError) {
      setConfirmTarget(null);
      setError(requestError.message);
    } finally { setToggling(false); }
  }

  function actions(entry) {
    if (!isAdmin) return null;
    return <div className="flex items-center gap-1">
      <Button aria-label={`Edit ${entry.name}`} className="w-11 px-0" onClick={() => openEdit(entry)} title="Edit" variant="outline"><Pencil className="h-5 w-5" /></Button>
      <Button aria-label={`${entry.isActive ? "Deactivate" : "Activate"} ${entry.name}`} className="w-11 px-0" onClick={() => setConfirmTarget(entry)} title={entry.isActive ? "Deactivate" : "Activate"} variant="outline">{entry.isActive ? <UserRoundX className="h-5 w-5" /> : <UserRoundCheck className="h-5 w-5" />}</Button>
    </div>;
  }

  return (
    <div>
      <PageHeader title="Users" description="Browse and manage LuxuryStay accounts." action={isAdmin && <Button className="w-full sm:w-auto" onClick={openCreate}><Plus className="h-5 w-5" />Add Staff</Button>} />
      {success && <Alert className="mb-4" onClose={() => setSuccess("")} type="success">{success}</Alert>}
      {error && <Alert className="mb-4" onClose={() => setError("")}>{error}</Alert>}
      <Card className="p-4 sm:p-5">
        <div className="mb-5 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px]">
          <div className="relative min-w-0"><Search aria-hidden="true" className="absolute left-3 top-3 h-5 w-5 text-muted" /><Input aria-label="Search users by name or email" className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" value={search} /></div>
          <Select aria-label="Filter by role" onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}><option value="all">All roles</option>{roles.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</Select>
          <Select aria-label="Filter by status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Deactivated</option></Select>
        </div>
        {loading ? <Loader label="Loading users" /> : filteredUsers.length === 0 ? <EmptyState title="No users found" description="Try changing your search or filters." /> : (
          <>
            <div className="hidden md:block">
              <Table headings={["Name", "Email", "Phone", "Role", "Status", ...(isAdmin ? ["Actions"] : [])]}>
                {filteredUsers.map((entry) => <tr key={entry._id}><td className="max-w-48 truncate px-4 py-3 font-medium">{entry.name}</td><td className="max-w-56 truncate px-4 py-3 text-muted">{entry.email}</td><td className="px-4 py-3 text-muted">{entry.phone || "—"}</td><td className="px-4 py-3"><RoleBadge role={entry.role} /></td><td className="px-4 py-3"><StatusBadge active={entry.isActive} /></td>{isAdmin && <td className="px-4 py-3">{actions(entry)}</td>}</tr>)}
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {filteredUsers.map((entry) => <article className="min-w-0 rounded-lg border border-line p-4" key={entry._id}>
                <div className="min-w-0"><h2 className="truncate font-medium">{entry.name}</h2><p className="break-all text-sm text-muted">{entry.email}</p><p className="mt-1 text-sm text-muted">{entry.phone || "No phone provided"}</p></div>
                <div className="mt-3 flex flex-wrap items-center gap-2"><RoleBadge role={entry.role} /><StatusBadge active={entry.isActive} /></div>
                {isAdmin && <div className="mt-3 flex gap-2">{actions(entry)}</div>}
              </article>)}
            </div>
          </>
        )}
      </Card>

      <Modal onClose={closeModal} open={Boolean(modal)} title={modal === "create" ? "Add staff account" : "Edit user"}>
        <form className="space-y-4" onSubmit={saveUser}>
          {modalError && <Alert>{modalError}</Alert>}
          <Input autoComplete="name" label="Full name" name="name" onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} />
          {modal === "create" && <Input autoComplete="email" label="Email address" name="email" onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} />}
          {modal === "create" && <Input autoComplete="new-password" label="Initial password" name="password" onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" value={form.password} />}
          <Input autoComplete="tel" label="Phone (optional)" name="phone" onChange={(event) => setForm({ ...form, phone: event.target.value })} type="tel" value={form.phone} />
          <Select label="Role" name="role" onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role}>{roles.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</Select>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button onClick={closeModal} type="button" variant="outline">Cancel</Button><Button loading={saving} type="submit">{modal === "create" ? "Create user" : "Save changes"}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog loading={toggling} onClose={() => !toggling && setConfirmTarget(null)} onConfirm={toggleStatus} open={Boolean(confirmTarget)} title={`${confirmTarget?.isActive ? "Deactivate" : "Activate"} account?`}>
        {confirmTarget?.isActive ? `Deactivate ${confirmTarget?.name}? They will no longer be able to sign in.` : `Reactivate ${confirmTarget?.name}? They will be able to sign in again.`}
      </ConfirmDialog>
    </div>
  );
}
