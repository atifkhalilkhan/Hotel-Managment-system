/* Collect a verified guest's review after checkout. */
import { useState } from "react";
import { Star } from "lucide-react";
import api from "../api/axios.js";
import { Alert, Button, Modal, Textarea } from "./UI.jsx";

export default function GuestFeedbackModal({ open, onClose, reservation, onCreated }) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!rating) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }
    if (!message.trim()) {
      setError("Please share a few words about your stay.");
      return;
    }

    setSubmitting(true);
    try {
      const feedback = await api.post("/feedback", { reservation: reservation._id, rating, message: message.trim() });
      setRating(0);
      setMessage("");
      onCreated(feedback);
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} title="Share feedback">
      <form className="space-y-4" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <p className="text-sm text-muted">How was your stay at {reservation?.bookingCode}?</p>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Your rating</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
                className="rounded-md p-1 text-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                key={value}
                onClick={() => setRating(value)}
                type="button"
              >
                <Star className={`h-7 w-7 ${value <= rating ? "fill-primary text-primary" : "text-line"}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <Textarea label="Your feedback" maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what went well or what we could improve." required rows={5} value={message} />
        <p className="text-xs text-muted">{message.length}/1000 characters. Your feedback will be reviewed before it can appear publicly.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={submitting} onClick={onClose} type="button" variant="outline">Cancel</Button>
          <Button loading={submitting} type="submit">Submit feedback</Button>
        </div>
      </form>
    </Modal>
  );
}
