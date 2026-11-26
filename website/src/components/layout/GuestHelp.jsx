import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useEscapeKey from "../../hooks/useEscapeKey";
import { Bot, MessageCircle, Phone, Send, X, ArrowRight } from "lucide-react";
import { hotelInfo } from "../../lib/hotelInfo";
import knowledge from "../../data/hotelChatKnowledge.json";
import RoomCard from "../rooms/RoomCard";

import { API_BASE } from "../../lib/api";

function replyTo(message) {
  const query = message.toLowerCase();
  const match = knowledge.find(({ keys }) => keys.some((key) => query.includes(key)));
  return match?.answer || `I can help with bookings, room types, check-in and services. For anything else, please call reception at ${hotelInfo.phone}.`;
}

export default function GuestHelp() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([{ from: "bot", text: "Welcome to LuxuryStay. I can help you find a room, check arrival times, or learn about our guest services. What can I help with?" }]);
  const messagesRef = useRef(null);
  // Naya message aaye (ya chat khule) to neeche tak scroll, taake jawab nazar aaye
  useEffect(() => {
    const list = messagesRef.current;
    if (open && list) list.scrollTop = list.scrollHeight;
  }, [open, messages, rooms]);
  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (!open || rooms.length) return;
    fetch(`${API_BASE}/rooms/public?page=1&limit=3`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setRooms(data.rooms || [])).catch(() => setRooms([]));
  }, [open, rooms.length]);
  const send = (event) => {
    event.preventDefault();
    const question = text.trim();
    if (!question) return;
    const wantsRooms = /room|suite|single|double|deluxe|available|availability/i.test(question);
    setMessages((items) => [...items, { from: "you", text: question }, { from: "bot", text: replyTo(question), showRooms: wantsRooms }]);
    setText("");
  };
  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && <section aria-label="LuxuryStay chat assistant" className="flex h-[min(460px,72svh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_55px_rgba(17,17,17,.2)]">
        <header className="flex items-center justify-between bg-ink px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-primary text-ink"><Bot className="size-5" /></span><span><strong className="block text-sm">LuxuryStay assistant</strong><small className="mt-0.5 flex items-center gap-1.5 text-white/70"><i className="size-1.5 rounded-full bg-emerald-400" />Online · usually replies instantly</small></span></div><button onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10"><X className="size-4" /></button></header>
        <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto bg-soft p-4" aria-live="polite">{messages.map((message, index) => <div key={index} className={`flex flex-col ${message.from === "you" ? "items-end" : "items-start"}`}><p className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-5 shadow-sm ${message.from === "you" ? "rounded-br-md bg-primary text-ink" : "rounded-bl-md border border-line bg-white text-ink"}`}>{message.text}</p>{message.showRooms && <div className="mt-3 grid w-full gap-3">{rooms.slice(0, 2).map((room, roomIndex) => <RoomCard key={room._id || room.id || roomIndex} room={room} index={roomIndex} className="min-h-0" />)}{!rooms.length && <Link to="/rooms" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">Explore all rooms <ArrowRight className="size-4" /></Link>}</div>}</div>)}</div>
        <form onSubmit={send} className="flex items-center gap-2 border-t border-line bg-white p-3"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask about your stay…" aria-label="Type a message" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-[#fafaf8] px-4 text-sm outline-none transition focus:border-primary" /><button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-ink transition hover:bg-primary-dark"><Send className="size-4" /></button></form>
      </section>}
      <div className="flex flex-col items-center gap-2.5"><a href={`tel:${hotelInfo.phone.replace(/[^\d+]/g, "")}`} aria-label="Call hotel reception" title="Call reception" className="hidden size-12 place-items-center lg:grid rounded-full border border-line bg-white text-ink shadow-lg transition hover:-translate-y-0.5 hover:bg-soft sm:size-14"><Phone className="size-5" /></a><button onClick={() => setOpen((value) => !value)} aria-label={open ? "Close chat assistant" : "Open chat assistant"} title="Chat with us" className="grid size-14 place-items-center rounded-full bg-primary text-ink shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-dark sm:size-16"><MessageCircle className="size-6" /></button></div>
    </div>
  );
}
