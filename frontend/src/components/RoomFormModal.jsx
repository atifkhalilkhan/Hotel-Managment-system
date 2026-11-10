/* Reusable room form for add and edit actions. */
import { Banknote, Hash, Layers3, Plus, UploadCloud, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { amenityOptions, getStatusOptionsForRole, roomTypeOptions } from "../lib/roomUtils.js";
import { Alert, Button, Input, Modal, Select, Textarea } from "./UI.jsx";

const emptyForm = {
  roomNumber: "",
  type: "single",
  pricePerNight: "",
  floor: "",
  capacity: "",
  status: "available",
  description: "",
  amenities: [],
};

function buildInitialForm(mode, room) {
  if (mode === "edit" && room) {
    return {
      roomNumber: room.roomNumber || "",
      type: room.type || "single",
      pricePerNight: room.pricePerNight ?? "",
      floor: room.floor ?? "",
      capacity: room.capacity ?? "",
      status: room.status || "available",
      description: room.description || "",
      amenities: room.amenities || [],
    };
  }
  return emptyForm;
}

function RoomFormContent({ mode, room, role, onClose, onSubmit }) {
  const [form, setForm] = useState(() => buildInitialForm(mode, room));
  const [customAmenity, setCustomAmenity] = useState("");
  const [files, setFiles] = useState([]);
  const [removeExisting, setRemoveExisting] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusOptionsForRole = useMemo(() => getStatusOptionsForRole(role), [role]);

  const toggleAmenity = (item) => {
    setForm((current) => ({ ...current, amenities: current.amenities.includes(item) ? current.amenities.filter((value) => value !== item) : [...current.amenities, item] }));
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!form.amenities.includes(trimmed)) {
      setForm((current) => ({ ...current, amenities: [...current.amenities, trimmed] }));
    }
    setCustomAmenity("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const parsedPrice = Number(form.pricePerNight);
    const parsedFloor = Number(form.floor);
    const parsedCapacity = Number(form.capacity);

    if (!form.roomNumber || !form.type || !form.pricePerNight || !form.floor || !form.capacity) {
      return setSubmitError("Room number, type, price, floor and capacity are required.");
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) return setSubmitError("Price per night must be a valid number.");
    if (Number.isNaN(parsedFloor)) return setSubmitError("Floor must be a valid number.");
    if (Number.isNaN(parsedCapacity) || parsedCapacity < 1) return setSubmitError("Capacity must be at least 1.");
    if (files.length + Math.max((room?.images || []).length - removeExisting.length, 0) > 5) return setSubmitError("A room can have at most 5 photos total.");

    const payload = new FormData();
    payload.append("roomNumber", form.roomNumber);
    payload.append("type", form.type);
    payload.append("pricePerNight", String(parsedPrice));
    payload.append("floor", String(parsedFloor));
    payload.append("capacity", String(parsedCapacity));
    payload.append("description", form.description || "");
    payload.append("amenities", form.amenities.join(", "));
    if (mode === "add") payload.append("status", form.status || "available");
    if (removeExisting.length) payload.append("removeImages", JSON.stringify(removeExisting));
    Array.from(files).forEach((file) => payload.append("images", file));

    setSubmitting(true);
    try {
      await onSubmit(payload, mode === "edit" ? room?._id : null);
      onClose();
    } catch (error) {
      setSubmitError(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError && <Alert>{submitError}</Alert>}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Basic info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Input icon={<Hash className="h-4 w-4" />} label="Room number" name="roomNumber" onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} value={form.roomNumber} />
          <Select label="Type" name="type" onChange={(event) => setForm({ ...form, type: event.target.value })} value={form.type}>{roomTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
          <Input icon={<Banknote className="h-4 w-4" />} label="Price per night" name="pricePerNight" onChange={(event) => setForm({ ...form, pricePerNight: event.target.value })} type="number" value={form.pricePerNight} />
          <Input icon={<Layers3 className="h-4 w-4" />} label="Floor" name="floor" onChange={(event) => setForm({ ...form, floor: event.target.value })} type="number" value={form.floor} />
          <Input icon={<Users className="h-4 w-4" />} label="Capacity" name="capacity" onChange={(event) => setForm({ ...form, capacity: event.target.value })} type="number" value={form.capacity} />
          {mode === "add" && (
            <Select label="Status" name="status" onChange={(event) => setForm({ ...form, status: event.target.value })} value={form.status}>{statusOptionsForRole.map((statusItem) => <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>)}</Select>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Amenities</h3>
        <div className="flex flex-wrap gap-2">
          {amenityOptions.map((amenity) => (
            <button className={`rounded-full border px-2.5 py-1.5 text-xs font-medium ${form.amenities.includes(amenity) ? "border-primary bg-primary-soft text-primary-dark" : "border-line bg-white text-muted"}`} key={amenity} onClick={() => toggleAmenity(amenity)} type="button">{amenity}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input className="flex-1" onChange={(event) => setCustomAmenity(event.target.value)} placeholder="Add custom amenity" value={customAmenity} />
          <Button onClick={addCustomAmenity} type="button" variant="outline">Add</Button>
        </div>
      </div>

      <Textarea label="Description" name="description" onChange={(event) => setForm({ ...form, description: event.target.value })} value={form.description} />

      <div className="space-y-4">
        <h3 className="text-base font-semibold">Photos</h3>
        <div className="rounded-lg border border-dashed border-line bg-page p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted"><UploadCloud className="h-4 w-4" />Add up to 5 photos</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(room?.images || []).filter((image) => !removeExisting.includes(image.publicId)).map((image) => (
              <div className="relative overflow-hidden rounded-lg border border-line bg-white" key={image.publicId}>
                <img alt={image.publicId} className="h-24 w-full object-cover" src={image.url} />
                <button aria-label="Remove current photo" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white" onClick={() => setRemoveExisting((current) => [...current, image.publicId])} type="button"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {files.map((file) => (
              <div className="relative overflow-hidden rounded-lg border border-line bg-white" key={`${file.name}-${file.lastModified}-${file.size}`}>
                <img alt={file.name} className="h-24 w-full object-cover" src={URL.createObjectURL(file)} />
                <button aria-label="Remove new photo" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white" onClick={() => setFiles((current) => current.filter((entry) => entry !== file))} type="button"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <input accept="image/*" className="hidden" id="room-upload" multiple onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 5 - current.length - ((room?.images || []).length - removeExisting.length)))} type="file" />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium" htmlFor="room-upload"><Plus className="h-4 w-4" />Choose photos</label>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onClose} type="button" variant="outline">Cancel</Button>
        <Button loading={submitting} type="submit">{mode === "add" ? "Add room" : "Save room"}</Button>
      </div>
    </form>
  );
}

export default function RoomFormModal({ open, mode = "add", room, role, onClose, onSubmit }) {
  const formKey = `${open ? "open" : "closed"}-${mode}-${room?._id ?? "new"}`;

  return (
    <Modal open={open} onClose={onClose} title={mode === "add" ? "Add room" : "Edit room"}>
      <RoomFormContent key={formKey} mode={mode} onClose={onClose} onSubmit={onSubmit} role={role} room={room} />
    </Modal>
  );
}
