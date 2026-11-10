/* Room management listing with filtering, details, create, edit, status, and delete actions. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Banknote, BedDouble, FilterX, Plus, SlidersHorizontal } from "lucide-react";
import useAuth from "../context/useAuth.js";
import { Alert, Button, Card, ConfirmDialog, EmptyState, Input, Modal, Select } from "../components/UI.jsx";
import RoomCard from "../components/RoomCard.jsx";
import RoomDetailsModal from "../components/RoomDetailsModal.jsx";
import RoomFormModal from "../components/RoomFormModal.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import { getStatusOptionsForRole, roomTypeOptions, statusOptions } from "../lib/roomUtils.js";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:2008/api";

export default function Rooms() {
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const isGuest = user?.role === "guest";
  const [status, setStatus] = useState(isGuest ? "available" : "all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [statusRoom, setStatusRoom] = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [formMode, setFormMode] = useState("add");
  const [editingRoom, setEditingRoom] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleStatusOptions = useMemo(() => getStatusOptionsForRole(user?.role), [user?.role]);
  const canAddRoom = ["admin", "manager"].includes(user?.role);

  const hasFilters = search || type !== "all" || (!isGuest && status !== "all") || minPrice || maxPrice;

  const fetchRooms = useCallback(async () => {
    const token = localStorage.getItem("luxurystay-token");
    if (!token) return;

    const requestId = ++requestIdRef.current;
    setError("");
    setLoading((current) => (current ? current : true));
    setRefetching(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (search) params.set("search", search);
    if (type !== "all") params.set("type", type);
    if (!isGuest && status !== "all") params.set("status", status);
    if (minPrice) params.set("minPrice", String(minPrice));
    if (maxPrice) params.set("maxPrice", String(maxPrice));

    try {
      const response = await fetch(`${baseUrl}/rooms?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || "Failed to load rooms");
      if (requestId !== requestIdRef.current) return;
      setRooms(payload.rooms || []);
      setTotalPages(payload.pages || 1);
      setTotalItems(payload.total || 0);
    } catch (requestError) {
      if (requestId === requestIdRef.current) setError(requestError.message || "Unable to load rooms.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefetching(false);
      }
    }
  }, [isGuest, maxPrice, minPrice, page, pageSize, search, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRooms();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchRooms]);

  const openForm = (mode, room = null) => {
    setFormMode(mode);
    setEditingRoom(room);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRoom(null);
  };

  const handleSubmitRoom = async (payload, roomId) => {
    const token = localStorage.getItem("luxurystay-token");
    const method = roomId ? "PUT" : "POST";
    const response = await fetch(`${baseUrl}/rooms${roomId ? `/${roomId}` : ""}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || "Unable to save room.");
    setSuccessMessage(roomId ? "Room updated successfully." : "Room created successfully.");
    setPage(1);
    await fetchRooms();
  };

  const handleStatusUpdate = async (nextStatus) => {
    const token = localStorage.getItem("luxurystay-token");
    const response = await fetch(`${baseUrl}/rooms/${statusRoom._id}/status`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || "Unable to update room status.");
    setSuccessMessage("Room status updated.");
    setStatusRoom(null);
    await fetchRooms();
  };

  const handleDeleteRoom = async () => {
    const token = localStorage.getItem("luxurystay-token");
    const response = await fetch(`${baseUrl}/rooms/${deleteRoom._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message || "Unable to delete room.");
    setSuccessMessage("Room deleted successfully.");
    setDeleteRoom(null);
    await fetchRooms();
  };

  const clearFilters = () => {
    setSearch("");
    setType("all");
    setStatus(isGuest ? "available" : "all");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary-dark"><BedDouble className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Rooms</h1>
            <p className="mt-1 text-sm text-muted">{totalItems} rooms in the hotel</p>
          </div>
        </div>
        {canAddRoom && <Button onClick={() => openForm("add")} type="button"><Plus className="h-5 w-5" />Add Room</Button>}
      </div>

      {successMessage && <Alert className="mb-4" onClose={() => setSuccessMessage("")} type="success">{successMessage}</Alert>}
      {error && <Alert className="mb-4" onClose={() => setError("")}>{error}</Alert>}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 min-w-0"><SearchInput ariaLabel="Search rooms" onChange={(event) => { setSearch(event.target.value); setPage(1); }} onClear={() => { setSearch(""); setPage(1); }} placeholder="Search room or description" value={search} /></div>
            <div className="flex items-center gap-2 md:hidden">
              <Button className="flex-1" onClick={() => setShowFilters((current) => !current)} type="button" variant="outline"><SlidersHorizontal className="h-4 w-4" />Filters</Button>
              {hasFilters && <Button onClick={clearFilters} type="button" variant="outline"><FilterX className="h-4 w-4" /></Button>}
            </div>
          </div>

          {(showFilters || window.innerWidth >= 768) && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_180px_180px]">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 text-sm text-muted"><BedDouble className="h-4 w-4" /><Select aria-label="Filter by room type" className="border-0 bg-transparent px-0 text-sm shadow-none" onChange={(event) => { setType(event.target.value); setPage(1); }} value={type}><option value="all">All types</option>{roomTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>
              {!isGuest && (
                <div className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 text-sm text-muted"><Activity className="h-4 w-4" /><Select aria-label="Filter by room status" className="border-0 bg-transparent px-0 text-sm shadow-none" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="all">All statuses</option>{visibleStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 text-sm text-muted"><Banknote className="h-4 w-4" /><Input className="border-0 bg-transparent px-0 text-sm shadow-none" onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="Min" type="number" value={minPrice} /></div>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 text-sm text-muted"><Banknote className="h-4 w-4" /><Input className="border-0 bg-transparent px-0 text-sm shadow-none" onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="Max" type="number" value={maxPrice} /></div>
              {hasFilters && (
                <Button className="justify-center" onClick={clearFilters} type="button" variant="outline"><FilterX className="h-4 w-4" />Clear</Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Card className="p-0" key={index}><div className="aspect-[4/3] animate-pulse bg-page" /><div className="space-y-3 p-4"><div className="h-4 w-24 animate-pulse rounded bg-page" /><div className="h-4 w-20 animate-pulse rounded bg-page" /><div className="h-8 w-32 animate-pulse rounded bg-page" /></div></Card>)}
        </div>
      ) : error ? (
        <Card className="space-y-4"><Alert>{error}</Alert><Button onClick={fetchRooms} type="button">Retry</Button></Card>
      ) : rooms.length === 0 ? (
        <EmptyState description={canAddRoom ? "Add the first room to start managing inventory." : "Try broadening your filters."} title="No rooms found">
          {canAddRoom && <Button className="mt-4" onClick={() => openForm("add")} type="button"><Plus className="h-5 w-5" />Add your first room</Button>}
          {hasFilters && <Button className="mt-2" onClick={clearFilters} type="button" variant="outline"><FilterX className="h-4 w-4" />Clear filters</Button>}
        </EmptyState>
      ) : (
        <>
          <div className={`grid gap-4 ${refetching ? "opacity-70" : "opacity-100"} transition-opacity sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`}>
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                onDelete={() => setDeleteRoom(room)}
                onEdit={() => { setFormMode("edit"); setEditingRoom(room); setFormOpen(true); }}
                onStatusChange={() => setStatusRoom(room)}
                onView={() => setSelectedRoom(room)}
                role={user?.role}
                room={room}
              />
            ))}
          </div>
          <Pagination
            onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
            onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        </>
      )}

      <RoomDetailsModal
        open={Boolean(selectedRoom)}
        onClose={() => setSelectedRoom(null)}
        onDelete={() => { setDeleteRoom(selectedRoom); setSelectedRoom(null); }}
        onEdit={() => { setFormMode("edit"); setEditingRoom(selectedRoom); setSelectedRoom(null); setFormOpen(true); }}
        onStatusChange={() => { setStatusRoom(selectedRoom); setSelectedRoom(null); }}
        role={user?.role}
        room={selectedRoom}
      />

      <RoomFormModal
        mode={formMode}
        onClose={closeForm}
        onSubmit={handleSubmitRoom}
        open={formOpen}
        role={user?.role}
        room={editingRoom}
      />

      <Modal open={Boolean(statusRoom)} onClose={() => setStatusRoom(null)} title="Change room status">
        <div className="space-y-3">
          {statusOptions.map((option) => {
            const hidden = user?.role === "housekeeping" && option.value === "occupied";
            if (hidden) return null;
            return (
              <button className="flex w-full items-center justify-between rounded-lg border border-line bg-page px-3 py-2 text-left text-sm hover:border-primary" key={option.value} onClick={async () => { try { await handleStatusUpdate(option.value); } catch (requestError) { setError(requestError.message); setStatusRoom(null); } }} type="button">
                <span>{option.label}</span>
                {statusRoom?.status === option.value && <span className="text-primary">Current</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        loading={isSubmitting}
        onClose={() => setDeleteRoom(null)}
        onConfirm={async () => {
          setIsSubmitting(true);
          try {
            await handleDeleteRoom();
          } catch (requestError) {
            setError(requestError.message);
          } finally {
            setIsSubmitting(false);
          }
        }}
        open={Boolean(deleteRoom)}
        title="Delete room?"
      >
        Are you sure you want to delete Room {deleteRoom?.roomNumber}? This action cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
