/* Shared issue form for maintenance reports from staff, guests, and housekeeping. */
import { useEffect, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import api from "../api/axios.js";
import { Alert, Button, Input, Modal, Textarea } from "./UI.jsx";
import RoomPicker from "./RoomPicker.jsx";

export default function ReportIssueModal({ open, onClose, role, initialRoom = null, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placeType, setPlaceType] = useState(initialRoom ? "room" : "room");
  const [room, setRoom] = useState(initialRoom);
  const [location, setLocation] = useState("");
  const [blocksRoom, setBlocksRoom] = useState(false);
  const [guestRooms, setGuestRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [guestRoomError, setGuestRoomError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isGuest = role === "guest";
  const canBlockRoom = ["admin", "manager", "receptionist"].includes(role);

  useEffect(() => {
    if (!open || !isGuest) return undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      setRoomsLoading(true);
      setGuestRoomError("");
      api.get("/reservations/my?status=checked-in")
        .then((reservations) => {
          if (active) {
            const rooms = (reservations || []).map((reservation) => reservation.room).filter(Boolean);
            setGuestRooms(rooms);
            if (!initialRoom && rooms.length) setRoom(rooms[0]);
          }
        })
        .catch((requestError) => {
          if (active) setGuestRoomError(requestError.message || "Unable to load your current room.");
        })
        .finally(() => { if (active) setRoomsLoading(false); });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [initialRoom, isGuest, open]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPlaceType("room");
    setRoom(initialRoom);
    setLocation("");
    setBlocksRoom(false);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isGuest && !room) {
      setError("You need an active checked-in room to report an issue.");
      return;
    }
    if (!isGuest && placeType === "room" && !room) {
      setError("Select a room or choose another place.");
      return;
    }
    if (!isGuest && placeType === "location" && !location.trim()) {
      setError("Enter where the issue is located.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      ...(placeType === "room" || isGuest ? { room: room?._id } : { location: location.trim() }),
      ...(canBlockRoom && placeType === "room" ? { blocksRoom } : {}),
    };
    setSubmitting(true);
    try {
      const created = await api.post("/maintenance", payload);
      onCreated?.(created);
      close();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit the issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Report an issue">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert onClose={() => setError("")}>{error}</Alert>}
        {isGuest && guestRoomError && <Alert>{guestRoomError}</Alert>}
        {isGuest && !roomsLoading && !guestRooms.length && !guestRoomError && <Alert type="info">You can report an issue once you are checked in.</Alert>}
        <Input autoFocus disabled={submitting} label="Title" maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="Briefly describe the issue" required value={title} />
        <Textarea disabled={submitting} label="Description" onChange={(event) => setDescription(event.target.value)} placeholder="Add helpful details (optional)" rows={4} value={description} />

        {!isGuest && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Where is the issue?</p>
            <div className="grid grid-cols-2 gap-2">
              <button aria-pressed={placeType === "room"} className={`min-h-11 rounded-lg border px-3 text-sm font-medium ${placeType === "room" ? "border-primary bg-primary-soft text-primary-dark" : "border-line hover:bg-page"}`} onClick={() => setPlaceType("room")} type="button">A room</button>
              <button aria-pressed={placeType === "location"} className={`min-h-11 rounded-lg border px-3 text-sm font-medium ${placeType === "location" ? "border-primary bg-primary-soft text-primary-dark" : "border-line hover:bg-page"}`} onClick={() => setPlaceType("location")} type="button"><MapPin className="mr-1 inline h-4 w-4" />Another place</button>
            </div>
          </div>
        )}

        {isGuest || placeType === "room" ? (
          isGuest ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" htmlFor="guest-issue-room">Checked-in room</label>
              <select className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm" disabled={!guestRooms.length || submitting || roomsLoading} id="guest-issue-room" onChange={(event) => setRoom(guestRooms.find((item) => item._id === event.target.value) || null)} value={room?._id || ""}>
                <option value="">{roomsLoading ? "Loading rooms..." : "Select your room"}</option>
                {guestRooms.map((item) => <option key={item._id} value={item._id}>Room {item.roomNumber} · Floor {item.floor ?? "-"}</option>)}
              </select>
            </div>
          ) : <RoomPicker disabled={submitting} label="Room" onChange={setRoom} open={open} value={room} />
        ) : (
          <Input disabled={submitting} label="Location" onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Lobby, lift, or restaurant" value={location} />
        )}

        {canBlockRoom && placeType === "room" && (
          <label className="flex items-start gap-3 rounded-lg border border-line bg-page p-3 text-sm">
            <input checked={blocksRoom} className="mt-0.5 h-4 w-4 accent-primary" disabled={submitting} onChange={(event) => setBlocksRoom(event.target.checked)} type="checkbox" />
            <span><span className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4 text-primary-dark" />Room is not usable (block it)</span><span className="mt-1 block text-xs text-muted">The room will be marked as under maintenance when possible.</span></span>
          </label>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={submitting} onClick={close} type="button" variant="outline">Cancel</Button>
          <Button loading={submitting} disabled={isGuest && (!guestRooms.length || roomsLoading)} type="submit">Submit report</Button>
        </div>
      </form>
    </Modal>
  );
}
