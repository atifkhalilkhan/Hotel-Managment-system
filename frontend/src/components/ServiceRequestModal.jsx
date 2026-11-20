/* Request a hotel service for an active reservation. */
import { useState } from "react";
import api from "../api/axios.js";
import { Alert, Button, Input, Modal, Select, Textarea } from "./UI.jsx";

const serviceTypes = [
  { value: "room-service", label: "Room service" },
  { value: "wake-up-call", label: "Wake-up call" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

export default function ServiceRequestModal({ open, onClose, reservations, onCreated, initialReservationId = "" }) {
  const [reservationId, setReservationId] = useState(initialReservationId);
  const [type, setType] = useState("room-service");
  const [details, setDetails] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const needsDetails = ["room-service", "transportation", "other"].includes(type);
  const needsSchedule = ["wake-up-call", "transportation"].includes(type);

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    if (!reservationId) {
      setError("Choose your current stay.");
      return;
    }
    if (needsDetails && !details.trim()) {
      setError("Please describe your request.");
      return;
    }
    if (needsSchedule && !scheduledFor) {
      setError("Choose the requested date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const request = await api.post("/services", {
        reservation: reservationId,
        type,
        ...(details.trim() ? { details: details.trim() } : {}),
        ...(needsSchedule ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      });
      setDetails("");
      setScheduledFor("");
      setType("room-service");
      onCreated(request);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your service request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request a service">
      <form className="space-y-4" onSubmit={submitRequest}>
        {error && <Alert>{error}</Alert>}
        <Select label="Stay / reservation" onChange={(event) => setReservationId(event.target.value)} required value={reservationId}>
          <option value="">Select an active stay</option>
          {reservations.map((reservation) => (
            <option key={reservation._id} value={reservation._id}>
              {reservation.bookingCode} · Room {reservation.room?.roomNumber || "-"}
              {reservation.guest?.name ? ` · ${reservation.guest.name}` : ""}
            </option>
          ))}
        </Select>
        <Select label="Service type" onChange={(event) => setType(event.target.value)} value={type}>
          {serviceTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
        {needsDetails && (
          <Textarea label="What do you need?" maxLength={500} onChange={(event) => setDetails(event.target.value)} placeholder={type === "room-service" ? "Describe your room service request" : "Add details for the staff"} required rows={4} value={details} />
        )}
        {needsSchedule && (
          <Input label={type === "wake-up-call" ? "Wake-up time" : "Pickup date and time"} onChange={(event) => setScheduledFor(event.target.value)} required type="datetime-local" value={scheduledFor} />
        )}
        <p className="text-xs text-muted">Requests are available only during an active checked-in stay.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={submitting} onClick={onClose} type="button" variant="outline">Cancel</Button>
          <Button loading={submitting} type="submit">Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}
