/* Responsive housekeeping task board and mobile-first staff task workflow. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  ClipboardList,
  Eye,
  HandHelping,
  LoaderCircle,
  Phone,
  Play,
  Plus,
  RefreshCw,
  SprayCan,
  UserPlus,
  XCircle,
} from "lucide-react";
import api from "../api/axios.js";
import OperationTimeline from "../components/OperationTimeline.jsx";
import { HousekeepingStatusBadge, HousekeepingType, PriorityBadge } from "../components/OperationBadges.jsx";
import Pagination from "../components/Pagination.jsx";
import RoomPicker from "../components/RoomPicker.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import useAuth from "../context/useAuth.js";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Modal, PageHeader, Select, Table, Textarea } from "../components/UI.jsx";
import { formatDateTime, relativeTime } from "../lib/operationsUtils.js";

const taskTypes = [
  { value: "checkout-cleaning", label: "Checkout cleaning" },
  { value: "regular-cleaning", label: "Regular cleaning" },
  { value: "deep-cleaning", label: "Deep cleaning" },
  { value: "inspection", label: "Inspection" },
];
const priorities = [{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }];
const statuses = [{ value: "", label: "All statuses" }, { value: "pending", label: "Pending" }, { value: "in-progress", label: "In progress" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }];
const statusTiles = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function TaskActions({ task, role, busy, onView, onAssign, onAction, onCancel }) {
  const isManager = ["admin", "manager"].includes(role);
  return (
    <div className="flex items-center gap-2">
      <IconButton ariaLabel={`View Room ${task.room?.roomNumber} task`} onClick={onView} title="View"><Eye className="h-4 w-4" /></IconButton>
      {isManager && ["pending", "in-progress"].includes(task.status) && <IconButton ariaLabel={`Assign Room ${task.room?.roomNumber} task`} disabled={busy} onClick={onAssign} title="Assign">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}</IconButton>}
      {isManager && task.status === "pending" && <IconButton ariaLabel={`Start Room ${task.room?.roomNumber} task`} disabled={busy} onClick={() => onAction("start", task)} title="Start">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}</IconButton>}
      {isManager && ["pending", "in-progress"].includes(task.status) && <IconButton ariaLabel={`Complete Room ${task.room?.roomNumber} task`} disabled={busy} onClick={() => onAction("complete", task)} title="Complete">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}</IconButton>}
      {isManager && ["pending", "in-progress"].includes(task.status) && <IconButton ariaLabel={`Cancel Room ${task.room?.roomNumber} task`} className="text-red-600 hover:border-red-200 hover:bg-red-50" disabled={Boolean(busy)} onClick={() => onCancel(task)} title="Cancel"><XCircle className="h-4 w-4" /></IconButton>}
    </div>
  );
}

function TaskDetails({ task, role, busy, error, success, onAction, onAssign, onCancel, onClose }) {
  if (!task) return null;
  return (
    <Modal onClose={onClose} open={Boolean(task)} title={`Room ${task.room?.roomNumber || "-"}`}>
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <HousekeepingType type={task.type} />
          <HousekeepingStatusBadge status={task.status} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-3"><p className="text-xs text-muted">Room</p><p className="mt-1 font-medium">Room {task.room?.roomNumber || "-"}</p><p className="text-sm text-muted">{task.room?.type || "Room"} · Floor {task.room?.floor ?? "-"}</p><div className="mt-2">{task.room?.status && <StatusBadge status={task.room.status} />}</div></div>
          <div className="rounded-lg border border-line p-3"><p className="text-xs text-muted">Priority</p><div className="mt-2"><PriorityBadge priority={task.priority} /></div><p className="mt-3 text-xs text-muted">Assigned to</p><p className="mt-1 font-medium">{task.assignedTo?.name || "Unassigned"}</p>{task.assignedTo?.phone && <a className="mt-1 inline-flex items-center gap-2 text-sm text-primary-dark" href={`tel:${task.assignedTo.phone}`}><Phone className="h-4 w-4" />{task.assignedTo.phone}</a>}</div>
        </div>
        {task.notes && <div className="rounded-lg border border-line p-3"><h3 className="text-sm font-semibold">Notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{task.notes}</p></div>}
        <div className="rounded-lg border border-line p-4"><h3 className="mb-4 text-sm font-semibold">Timeline</h3><OperationTimeline events={[{ label: "Created", time: task.createdAt, icon: "created" }, { label: "Started", time: task.startedAt, icon: "started" }, { label: "Completed", time: task.completedAt, icon: "completed" }]} /></div>
        <div className="flex flex-wrap justify-end gap-2">
          {["admin", "manager"].includes(role) && ["pending", "in-progress"].includes(task.status) && <Button onClick={onAssign} type="button" variant="outline"><UserPlus className="h-4 w-4" />Assign</Button>}
          {["admin", "manager"].includes(role) && task.status === "pending" && <Button loading={busy} onClick={() => onAction("start", task)} type="button"><Play className="h-4 w-4" />Start</Button>}
          {["admin", "manager"].includes(role) && ["pending", "in-progress"].includes(task.status) && <Button loading={busy} onClick={() => onAction("complete", task)} type="button"><CheckCheck className="h-4 w-4" />Complete</Button>}
          {["admin", "manager"].includes(role) && ["pending", "in-progress"].includes(task.status) && <Button onClick={() => onCancel(task)} type="button" variant="danger"><XCircle className="h-4 w-4" />Cancel</Button>}
        </div>
      </div>
    </Modal>
  );
}

export default function Housekeeping() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === "housekeeping") return <MyTasks />;
  return <StaffHousekeeping role={role} />;
}

function StaffHousekeeping({ role }) {
  const canManage = ["admin", "manager"].includes(role);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({ pending: 0, "in-progress": 0, completed: 0, cancelled: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("status");
    return statuses.some((item) => item.value === requested) ? requested : "";
  });
  const [priority, setPriority] = useState("");
  const [type, setType] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [busy, setBusy] = useState("");
  const [formRoom, setFormRoom] = useState(null);
  const [formType, setFormType] = useState("regular-cleaning");
  const [formPriority, setFormPriority] = useState("normal");
  const [formStaff, setFormStaff] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const requestId = useRef(0);

  const loadTasks = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (type) params.set("type", type);
    if (assignedTo) params.set("assignedTo", assignedTo);
    if (debouncedSearch) params.set("search", debouncedSearch);
    try {
      const [payload, ...counts] = await Promise.all([
        api.get(`/housekeeping?${params}`),
        ...statusTiles.map((item) => api.get(`/housekeeping?status=${item.value}&limit=1`)),
      ]);
      if (requestId.current !== id) return;
      setTasks(payload.tasks || []);
      setTotal(Number(payload.total || 0));
      setTotalPages(Number(payload.pages || 1));
      setStats(Object.fromEntries(statusTiles.map((item, index) => [item.value, Number(counts[index]?.total || 0)])));
    } catch (requestError) {
      if (requestId.current === id) setError(requestError.message || "Unable to load housekeeping tasks.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [assignedTo, debouncedSearch, page, pageSize, priority, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadTasks(), 0);
    return () => window.clearTimeout(timer);
  }, [loadTasks]);

  useEffect(() => {
    if (!canManage) return undefined;
    let active = true;
    api.get("/users?role=housekeeping")
      .then((users) => { if (active) setStaff((users || []).filter((entry) => entry.isActive)); })
      .catch((requestError) => { if (active) setError(requestError.message || "Unable to load housekeeping staff."); });
    return () => { active = false; };
  }, [canManage]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!document.hidden) loadTasks(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadTasks]);

  const applyAction = async (action, task) => {
    setBusy(task._id);
    setError("");
    setSuccess("");
    try {
      const payload = await api.patch(`/housekeeping/${task._id}/${action}`, {});
      setSelected((current) => current?._id === task._id ? payload.task || { ...current, status: action === "start" ? "in-progress" : "completed" } : current);
      setSuccess(payload.message || (action === "start" ? "Task started." : "Task completed."));
      if (payload.roomStatus === "available") setSuccess(`${payload.message || "Task completed."} Room ${task.room?.roomNumber || ""} is now available.`);
      await loadTasks(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to update task.");
    } finally {
      setBusy("");
    }
  };

  const assignTask = async () => {
    if (!assignTarget) return;
    setBusy(assignTarget._id);
    setError("");
    try {
      const payload = await api.patch(`/housekeeping/${assignTarget._id}/assign`, { assignedTo: formStaff || null });
      setSuccess("Task assignment updated.");
      setAssignTarget(null);
      setSelected((current) => current?._id === assignTarget._id ? payload : current);
      await loadTasks(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to assign task.");
    } finally {
      setBusy("");
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (!formRoom) {
      setError("Select a room for the task.");
      return;
    }
    setBusy("create");
    setError("");
    try {
      const payload = await api.post("/housekeeping", { room: formRoom._id, type: formType, priority: formPriority, ...(formStaff ? { assignedTo: formStaff } : {}), notes: formNotes.trim() });
      setSuccess(`Housekeeping task created for Room ${formRoom.roomNumber}.`);
      setNewTaskOpen(false);
      setFormRoom(null);
      setFormType("regular-cleaning");
      setFormPriority("normal");
      setFormStaff("");
      setFormNotes("");
      setPage(1);
      if (page === 1) await loadTasks(true);
      else setPage(1);
      if (payload) setSelected(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to create task.");
    } finally {
      setBusy("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setType("");
    setAssignedTo("");
    setPage(1);
  };

  const taskRowActions = (task) => (
    <TaskActions task={task} role={role} busy={busy === task._id} onView={() => setSelected(task)} onAssign={() => { setAssignTarget(task); setFormStaff(task.assignedTo?._id || ""); }} onAction={applyAction} onCancel={setConfirmTarget} />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${total} housekeeping tasks`}
        icon={SprayCan}
        title="Housekeeping"
        action={<div className="flex gap-2"><Button disabled={refreshing} onClick={() => loadTasks(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>{canManage && <Button onClick={() => setNewTaskOpen(true)} type="button"><Plus className="h-4 w-4" />New Task</Button>}</div>}
      />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statusTiles.map((item) => (
          <button className={`rounded-lg border p-4 text-left shadow-sm transition-colors hover:border-primary ${status === item.value ? "border-primary bg-primary-soft" : "border-line bg-white"}`} key={item.value} onClick={() => { setStatus(status === item.value ? "" : item.value); setPage(1); }} type="button">
            <p className="text-sm text-muted">{item.label}</p><p className="mt-2 text-2xl font-semibold">{stats[item.value]}</p>
          </button>
        ))}
      </div>

      <Card className="space-y-3">
        <SearchInput ariaLabel="Search by room number" onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search room number" value={search} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select aria-label="Filter by status" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select aria-label="Filter by priority" onChange={(event) => { setPriority(event.target.value); setPage(1); }} value={priority}><option value="">All priorities</option>{priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select aria-label="Filter by task type" onChange={(event) => { setType(event.target.value); setPage(1); }} value={type}><option value="">All task types</option>{taskTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select aria-label="Filter by assignee" onChange={(event) => { setAssignedTo(event.target.value); setPage(1); }} value={assignedTo}><option value="">All assignees</option>{staff.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}</option>)}</Select>
          <Button onClick={clearFilters} type="button" variant="outline">Clear filters</Button>
        </div>
      </Card>

      {loading ? <Card className="space-y-3 p-0">{Array.from({ length: 5 }, (_, index) => <div className="flex h-14 animate-pulse gap-3 border-b border-line p-3" key={index}><div className="w-24 rounded bg-page" /><div className="flex-1 rounded bg-page" /><div className="w-20 rounded bg-page" /></div>)}</Card>
        : tasks.length ? (
          <>
            <Card className={`hidden overflow-hidden p-0 transition-opacity lg:block ${refreshing ? "opacity-70" : ""}`}>
              <Table headings={["Room", "Task", "Priority", "Assigned to", "Status", "Created", "Actions"]}>
                {tasks.map((task) => <tr key={task._id}>
                  <td className="px-4 py-3"><p className="font-medium">Room {task.room?.roomNumber || "-"}</p><p className="text-xs text-muted">{task.room?.type}</p><div className="mt-1">{task.room?.status && <StatusBadge status={task.room.status} />}</div></td>
                  <td className="max-w-56 px-4 py-3"><HousekeepingType type={task.type} />{task.notes && <p className="truncate text-xs text-muted">{task.notes}</p>}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3">{task.assignedTo?.name || <Badge tone="warning">Unassigned</Badge>}</td>
                  <td className="px-4 py-3"><HousekeepingStatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><time title={formatDateTime(task.createdAt)}>{relativeTime(task.createdAt)}</time></td>
                  <td className="px-4 py-3">{taskRowActions(task)}</td>
                </tr>)}
              </Table>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {tasks.map((task) => <Card className="space-y-4" key={task._id}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Room {task.room?.roomNumber || "-"}</h2><p className="text-sm text-muted">{task.room?.type} · Floor {task.room?.floor ?? "-"}</p></div><HousekeepingStatusBadge status={task.status} /></div>
                <div className="flex flex-wrap items-center gap-2"><HousekeepingType type={task.type} /><PriorityBadge priority={task.priority} /></div>
                <div className="flex items-center justify-between gap-3 text-sm"><span>{task.assignedTo?.name || <Badge tone="warning">Unassigned</Badge>}</span>{task.room?.status && <StatusBadge status={task.room.status} />}</div>
                {task.notes && <p className="line-clamp-2 text-sm text-muted">{task.notes}</p>}
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">{taskRowActions(task)}</div>
              </Card>)}
            </div>
            <Pagination itemLabel="tasks" onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} page={page} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} totalItems={total} totalPages={totalPages} />
          </>
        ) : <Card><EmptyState icon={SprayCan} title="No housekeeping tasks" description="There are no tasks matching these filters." /></Card>}

      <TaskDetails task={selected} role={role} busy={busy === selected?._id} error={selected && error} success={selected && success} onAction={applyAction} onAssign={() => { setAssignTarget(selected); setFormStaff(selected?.assignedTo?._id || ""); }} onCancel={setConfirmTarget} onClose={() => setSelected(null)} />

      <Modal onClose={() => setNewTaskOpen(false)} open={newTaskOpen} title="Create housekeeping task">
        <form className="space-y-4" onSubmit={createTask}>
          {error && <Alert>{error}</Alert>}
          <RoomPicker label="Room" onChange={setFormRoom} open={newTaskOpen} value={formRoom} />
          <Select label="Task type" onChange={(event) => setFormType(event.target.value)} value={formType}>{taskTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select label="Priority" onChange={(event) => setFormPriority(event.target.value)} value={formPriority}>{priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select label="Assign to (optional)" onChange={(event) => setFormStaff(event.target.value)} value={formStaff}><option value="">Leave unassigned (staff can claim it)</option>{staff.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}</option>)}</Select>
          <Textarea label="Notes (optional)" onChange={(event) => setFormNotes(event.target.value)} rows={3} value={formNotes} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button onClick={() => setNewTaskOpen(false)} type="button" variant="outline">Cancel</Button><Button loading={busy === "create"} type="submit">Create task</Button></div>
        </form>
      </Modal>

      <Modal onClose={() => setAssignTarget(null)} open={Boolean(assignTarget)} title="Assign housekeeping task">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm text-muted">Room {assignTarget?.room?.roomNumber}</p>
          <Select label="Housekeeping staff" onChange={(event) => setFormStaff(event.target.value)} value={formStaff}><option value="">Unassigned</option>{staff.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}{entry.phone ? ` · ${entry.phone}` : ""}</option>)}</Select>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button onClick={() => setAssignTarget(null)} type="button" variant="outline">Cancel</Button><Button loading={busy === assignTarget?._id} onClick={assignTask} type="button">Save assignment</Button></div>
        </div>
      </Modal>

      <ConfirmDialog loading={busy === confirmTarget?._id} onClose={() => setConfirmTarget(null)} onConfirm={async () => { const task = confirmTarget; setConfirmTarget(null); await applyAction("cancel", task); }} open={Boolean(confirmTarget)} title="Cancel housekeeping task">
        {error && <Alert>{error}</Alert>}
        Cancel the cleaning task for Room {confirmTarget?.room?.roomNumber}?
      </ConfirmDialog>
    </div>
  );
}

function MyTasks() {
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get("status") === "available" ? "available" : "mine");
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ mine: 0, available: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmTask, setConfirmTask] = useState(null);
  const requestId = useRef(0);

  const fetchTasks = useCallback(async (silent = false) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      const [mine, open, completed] = await Promise.all([
        api.get("/housekeeping/my"),
        api.get("/housekeeping/open"),
        api.get("/housekeeping/my?status=completed"),
      ]);
      if (requestId.current !== id) return;
      const activeTasks = (mine || []).filter((task) => ["pending", "in-progress"].includes(task.status));
      const sorted = [...activeTasks].sort((a, b) => (a.status === b.status ? Number(b.priority === "high") - Number(a.priority === "high") : a.status === "in-progress" ? -1 : 1));
      setCounts({ mine: activeTasks.length, available: (open || []).length, completed: (completed || []).length });
      setTasks(tab === "mine" ? sorted : tab === "available" ? open || [] : completed || []);
    } catch (requestError) {
      if (requestId.current === id) setError(requestError.message || "Unable to load your tasks.");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [tab]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchTasks(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    const interval = window.setInterval(() => { if (!document.hidden) fetchTasks(true); }, 30000);
    return () => window.clearInterval(interval);
  }, [fetchTasks]);

  const mutateTask = async (task, action) => {
    setBusy(task._id);
    setError("");
    setSuccess("");
    try {
      const payload = await api.patch(`/housekeeping/${task._id}/${action}`, {});
      setSuccess(payload.message || (action === "claim" ? "Task added to My Tasks." : action === "start" ? "Task started." : "Task completed."));
      if (action === "complete" && payload.roomStatus === "available") setSuccess(`${payload.message || "Task completed."} Room ${task.room?.roomNumber} is now available.`);
      await fetchTasks(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to update task.");
      if (action === "claim") await fetchTasks(true);
    } finally {
      setBusy("");
    }
  };

  const tabs = [
    { key: "mine", label: "My Tasks" },
    { key: "available", label: "Available" },
    { key: "completed", label: "Completed" },
  ];
  const emptyLabels = { mine: "No tasks assigned to you", available: "No tasks waiting", completed: "Nothing completed yet" };

  return (
    <div className="space-y-5">
      <PageHeader description="Your daily cleaning tasks and open work" icon={ClipboardList} title="My Tasks" action={<Button disabled={refreshing} onClick={() => fetchTasks(true)} type="button" variant="outline"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</Button>} />
      {error && <Alert onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert onClose={() => setSuccess("")} type="success">{success}</Alert>}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-white p-2 shadow-sm">
        {tabs.map((item) => <button aria-pressed={tab === item.key} className={`min-h-12 rounded-lg px-2 text-xs font-medium sm:text-sm ${tab === item.key ? "bg-primary text-white" : "text-muted hover:bg-page"}`} key={item.key} onClick={() => setTab(item.key)} type="button">{item.label}<span className="ml-1.5 opacity-80">{counts[item.key]}</span></button>)}
      </div>
      {loading ? <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Card className="h-64 animate-pulse bg-page" key={index} />)}</div>
        : tasks.length ? (
          <div className={`grid gap-4 ${refreshing ? "opacity-70" : ""} transition-opacity lg:grid-cols-2`}>
            {tasks.map((task) => (
              <Card className="space-y-4" key={task._id}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold">Room {task.room?.roomNumber || "-"}</h2><p className="mt-1 text-sm text-muted">{task.room?.type || "Room"} · Floor {task.room?.floor ?? "-"}</p></div><HousekeepingStatusBadge status={task.status} /></div>
                <div className="flex flex-wrap items-center gap-2"><HousekeepingType type={task.type} /><PriorityBadge priority={task.priority} /></div>
                {task.room?.status && <StatusBadge status={task.room.status} />}
                {task.notes && <p className="rounded-lg bg-page p-3 text-sm text-muted">{task.notes}</p>}
                {tab === "available" ? <Button className="w-full" loading={busy === task._id} onClick={() => mutateTask(task, "claim")} type="button"><HandHelping className="h-5 w-5" />Take this task</Button> : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {task.status === "pending" && <Button className="w-full" loading={busy === task._id} onClick={() => mutateTask(task, "start")} type="button"><Play className="h-5 w-5" />Start</Button>}
                    {["pending", "in-progress"].includes(task.status) && <Button className="w-full" loading={busy === task._id} onClick={() => setConfirmTask(task)} type="button"><CheckCheck className="h-5 w-5" />Complete</Button>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : <Card><EmptyState icon={SprayCan} title={emptyLabels[tab]} description={tab === "available" ? "Check back soon for new work." : "Your tasks will appear here."} /></Card>}
      <ConfirmDialog loading={busy === confirmTask?._id} onClose={() => setConfirmTask(null)} onConfirm={async () => { const task = confirmTask; setConfirmTask(null); await mutateTask(task, "complete"); }} open={Boolean(confirmTask)} title="Complete cleaning task">
        {error && <Alert>{error}</Alert>}
        Mark Room {confirmTask?.room?.roomNumber} as cleaned?
      </ConfirmDialog>
    </div>
  );
}
