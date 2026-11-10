/* Reservation booking wizard for staff and guests. */
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import api from "../api/axios.js";
import useAuth from "../context/useAuth.js";
import Link from "../components/Link.jsx";
import { Alert, Badge, Button, Card, EmptyState, Input, Select, Textarea } from "../components/UI.jsx";
import { formatDate, formatPrice, nightsLabel } from "../lib/reservationUtils.js";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservationForm() {
  const { user } = useAuth();
  const isGuest = user?.role === "guest";
  const steps = isGuest ? ["Dates", "Room", "Review"] : ["Dates", "Room", "Guest", "Review"];
  const [currentStep, setCurrentStep] = useState(0);
  const [checkIn, setCheckIn] = useState(getTodayString());
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [roomType, setRoomType] = useState("any");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState("");
  const [guestOptions, setGuestOptions] = useState([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00Z`);
    const end = new Date(`${checkOut}T00:00:00Z`);
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const roomStepIndex = 1;
  const isValidDates = Boolean(checkIn && checkOut && nights > 0 && new Date(`${checkIn}T00:00:00Z`) >= new Date(`${getTodayString()}T00:00:00Z`));

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    const start = new Date(`${checkIn}T00:00:00Z`);
    const end = new Date(`${checkOut}T00:00:00Z`);
    if (end <= start) return;

    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guestsCount),
    });
    if (roomType !== "any") query.set("type", roomType);

    let active = true;

    api.get(`/rooms/available?${query.toString()}`)
      .then((rooms) => {
        if (!active) return;
        setAvailableRooms(rooms || []);
        const roomId = new URLSearchParams(window.location.search).get("room");
        if (roomId && Array.isArray(rooms) && rooms.some((room) => room._id === roomId)) {
          setSelectedRoom(rooms.find((room) => room._id === roomId) || null);
        } else if (!rooms.some((room) => room._id === selectedRoom?._id)) {
          setSelectedRoom(null);
        }
      })
      .catch(() => {
        if (active) setAvailableRooms([]);
      })
      .finally(() => {
        if (active) setLoadingRooms(false);
      });

    return () => { active = false; };
  }, [checkIn, checkOut, guestsCount, roomType, selectedRoom?._id]);

  useEffect(() => {
    if (isGuest) return;
    api.get("/users?role=guest")
      .then((users) => {
        setGuestOptions(users || []);
        if (users?.[0]?._id) setSelectedGuest(users[0]._id);
      })
      .catch(() => setGuestOptions([]));
  }, [isGuest]);

  const handleNext = () => {
    if (!isValidDates) {
      setError("Select a valid check-in and check-out range before continuing.");
      return;
    }
    if (currentStep === 0 && !isValidDates) return;
    if (currentStep === 1 && !selectedRoom) {
      setError("Choose a room to continue.");
      return;
    }
    if (!isGuest && currentStep === 2 && !selectedGuest) {
      setError("Select a guest to continue.");
      return;
    }
    setError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (!selectedRoom) {
      setError("Select a room to complete the booking.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        room: selectedRoom._id,
        checkIn,
        checkOut,
        guestsCount,
        specialRequests,
      };
      if (!isGuest) payload.guest = selectedGuest;
      const result = await api.post("/reservations", payload);
      setReservation(result);
      setCurrentStep(steps.length - 1);
    } catch (requestError) {
      setError(requestError.message || "Unable to confirm the booking.");
      setCurrentStep(roomStepIndex);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = selectedRoom ? selectedRoom.pricePerNight * nights : 0;
  const stepperLabel = `Step ${currentStep + 1} of ${steps.length}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{reservation ? "Booking confirmed" : "New reservation"}</h1>
          <p className="mt-1 text-sm text-muted">{reservation ? "Your booking details are ready." : "Create a new reservation in a few steps."}</p>
        </div>
        {!reservation && (
          <Badge tone="primary">{stepperLabel}</Badge>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {!reservation ? (
        <>
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted">
                <CalendarCheck className="h-4 w-4" />
                <span>{stepperLabel}</span>
              </div>
              <div className="hidden gap-2 sm:flex">
                {steps.map((step, index) => (
                  <div className="flex items-center gap-2" key={step}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium ${index === currentStep ? "border-primary bg-primary-soft text-primary-dark" : index < currentStep ? "border-green-200 bg-green-100 text-green-700" : "border-line bg-white text-muted"}`}>
                      {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < steps.length - 1 && <div className="h-px w-5 bg-line" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-page">
              <div className="h-full rounded-full bg-primary" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
            </div>
          </Card>

          {currentStep === 0 && (
            <Card className="space-y-5 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input id="checkin" label="Check-in" min={getTodayString()} onChange={(event) => setCheckIn(event.target.value)} type="date" value={checkIn} />
                <Input id="checkout" label="Check-out" min={checkIn ? new Date(new Date(`${checkIn}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) : getTodayString()} onChange={(event) => setCheckOut(event.target.value)} type="date" value={checkOut} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink">Guests</label>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-white px-2">
                    <button aria-label="Decrease guests" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-page" onClick={() => setGuestsCount((count) => Math.max(1, count - 1))} type="button"><Minus className="h-4 w-4" /></button>
                    <span className="text-base font-medium">{guestsCount}</span>
                    <button aria-label="Increase guests" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-page" onClick={() => setGuestsCount((count) => count + 1)} type="button"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <Select id="room-type" label="Room type" onChange={(event) => setRoomType(event.target.value)} value={roomType}>
                  <option value="any">Any</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                </Select>
              </div>
              <div className="rounded-lg border border-line bg-page p-3 text-sm text-muted">
                <span className="font-medium text-ink">Stay length:</span> {nights > 0 ? `${nights} night${nights === 1 ? "" : "s"}` : "Select valid dates"}
              </div>
            </Card>
          )}

          {currentStep === 1 && (
            <Card className="p-4 sm:p-5">
              {loadingRooms ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div className="h-56 animate-pulse rounded-lg border border-line bg-page" key={index} />
                  ))}
                </div>
              ) : availableRooms.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {availableRooms.map((room) => (
                    <button className={`rounded-lg border p-3 text-left transition-colors ${selectedRoom?._id === room._id ? "border-primary bg-primary-soft" : "border-line bg-white hover:bg-page"}`} key={room._id} onClick={() => setSelectedRoom(room)} type="button">
                      <div className="overflow-hidden rounded-md border border-line bg-page">
                        {room.images?.[0]?.url ? <img alt={room.roomNumber} className="h-32 w-full object-cover" src={room.images[0].url} /> : <div className="flex h-32 items-center justify-center text-sm text-muted">No image</div>}
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">Room {room.roomNumber}</p>
                          <p className="text-sm text-muted">{room.type}</p>
                        </div>
                        {selectedRoom?._id === room._id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {room.amenities?.slice(0, 3).map((amenity) => <Badge key={amenity}>{amenity}</Badge>)}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted">Floor {room.floor}</span>
                        <span className="font-medium">{formatPrice(room.pricePerNight)} / night</span>
                      </div>
                      <div className="mt-2 text-right font-semibold">Total: {formatPrice(room.pricePerNight * nights)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState description="Change the dates or room filters to find a different option." title="No rooms free for these dates" />
              )}
            </Card>
          )}

          {!isGuest && currentStep === 2 && (
            <Card className="space-y-4 p-4 sm:p-5">
              <Select id="guest-select" label="Guest" onChange={(event) => setSelectedGuest(event.target.value)} value={selectedGuest}>
                {guestOptions.map((guest) => <option key={guest._id} value={guest._id}>{guest.name} ({guest.email})</option>)}
              </Select>
            </Card>
          )}

          {((!isGuest && currentStep === 3) || (isGuest && currentStep === 2)) && (
            <Card className="space-y-5 p-4 sm:p-5">
              <div className="overflow-hidden rounded-lg border border-line bg-page">
                {selectedRoom?.images?.[0]?.url ? <img alt={selectedRoom.roomNumber} className="h-52 w-full object-cover" src={selectedRoom.images[0].url} /> : <div className="flex h-52 items-center justify-center text-sm text-muted">No room image</div>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-line p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Stay</p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <span>{formatDate(checkIn)} → {formatDate(checkOut)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{nightsLabel(nights)} · {guestsCount} guest{guestsCount > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-lg border border-line p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Room</p>
                  <p className="mt-2 font-medium">Room {selectedRoom?.roomNumber}</p>
                  <p className="text-sm text-muted">{selectedRoom?.type}</p>
                </div>
              </div>

              {!isGuest && (
                <div className="rounded-lg border border-line p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">Guest details</p>
                  <p className="mt-2 font-medium">{guestOptions.find((guest) => guest._id === selectedGuest)?.name}</p>
                  <p className="text-sm text-muted">{guestOptions.find((guest) => guest._id === selectedGuest)?.email}</p>
                </div>
              )}

              <div className="rounded-lg border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Price per night</span>
                  <span className="font-medium">{formatPrice(selectedRoom?.pricePerNight || 0)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{nightsLabel(nights)}</span>
                  <span className="font-medium">{formatPrice(totalAmount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-semibold text-primary-dark">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <Textarea id="special-requests" label="Special requests" onChange={(event) => setSpecialRequests(event.target.value)} placeholder="Any preferences or notes?" value={specialRequests} />
            </Card>
          )}

          <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-page/95 p-3 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button className="sm:min-w-[120px]" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} type="button" variant="outline">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStep < steps.length - 1 ? (
                <Button className="sm:min-w-[120px]" onClick={handleNext} type="button">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="sm:min-w-[136px]" loading={isSubmitting} onClick={handleSubmit} type="button">
                  Confirm booking
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <Card className="print-card p-5 sm:p-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Booking confirmed</h2>
              <div className="mt-3 rounded-lg border border-line bg-white px-4 py-3 text-lg font-semibold text-primary-dark">{reservation.bookingCode}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-line p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Guest</p>
                <p className="mt-2 font-medium">{reservation.guest?.name}</p>
                <p className="text-sm text-muted">{reservation.guest?.email}</p>
              </div>
              <div className="rounded-lg border border-line p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Room</p>
                <p className="mt-2 font-medium">Room {reservation.room?.roomNumber}</p>
                <p className="text-sm text-muted">{reservation.room?.type}</p>
              </div>
            </div>

            <div className="rounded-lg border border-line p-4">
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>Check-in</span>
                <span className="font-medium text-ink">{formatDate(reservation.checkIn)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
                <span>Check-out</span>
                <span className="font-medium text-ink">{formatDate(reservation.checkOut)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
                <span>Guests</span>
                <span className="font-medium text-ink">{reservation.guestsCount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted">
                <span>Nights</span>
                <span className="font-medium text-ink">{nightsLabel(reservation.nights || 0)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-base font-semibold">Total</span>
                <span className="text-xl font-semibold text-primary-dark">{formatPrice(reservation.totalAmount || 0)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.print()} type="button" variant="outline">Print confirmation</Button>
              <Link className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark" href={isGuest ? "/my-bookings" : "/reservations"}>View bookings</Link>
              <Link className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-page" href="/reservations/new">New booking</Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
