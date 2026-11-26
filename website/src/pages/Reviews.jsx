import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Quote, Star, UserRound } from "lucide-react";
import Container from "../components/ui/Container";
import Section from "../components/ui/Section";

import { API_BASE } from "../lib/api";
const PAGE_SIZE = 6;

async function fetchReviewPage(page) {
  const response = await fetch(`${API_BASE}/feedback/public?page=${page}&limit=${PAGE_SIZE}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Reviews could not be loaded.");
  return data;
}

function Stars({ value, size = "size-4" }) {
  return <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`${size} ${index < value ? "fill-primary text-primary" : "text-line"}`} aria-hidden="true" />)}</span>;
}

function ReviewCard({ review }) {
  const date = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(review.createdAt));
  return (
    <article className="flex h-full flex-col border border-line border-t-2 border-t-primary bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-7">
      <div className="flex items-center justify-between gap-4"><Stars value={review.rating} /><Quote className="size-5 text-primary/70" aria-hidden="true" /></div>
      <blockquote className="mt-5 flex-1 text-base leading-7 text-ink">“{review.message}”</blockquote>
      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-soft text-muted"><UserRound className="size-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{review.displayName}</p><p className="mt-1 text-xs text-muted">{review.verifiedStay ? "Verified guest" : "Guest review"} · {date}</p></div>
      </div>
    </article>
  );
}

export default function Reviews() {
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  // Server se jawab aane par state bharo (sirf fetch ke baad chalta hai)
  const applyReviews = useCallback((data, requestedPage) => {
    setReviews(data.feedback || []);
    setSlide(0);
    setPage(data.page || requestedPage);
    setPages(Math.max(data.pages || 1, 1));
    setTotal(data.total || 0);
    setLoading(false);
  }, []);
  const applyError = useCallback((error) => {
    setLoadError(error.message || "Unable to connect to the reviews service.");
    setLoading(false);
  }, []);

  // Buttons (page badalna, dobara koshish): pehle loading dikhao, phir lao
  const loadReviews = (requestedPage = 1) => {
    setLoading(true);
    setLoadError("");
    fetchReviewPage(requestedPage).then((data) => applyReviews(data, requestedPage), applyError);
  };

  // Pehli dafa: loading pehle se true hai
  useEffect(() => {
    let active = true;
    fetchReviewPage(1).then(
      (data) => active && applyReviews(data, 1),
      (error) => active && applyError(error)
    );
    return () => { active = false; };
  }, [applyReviews, applyError]);

  const slideCount = Math.ceil(reviews.length / 3);
  useEffect(() => {
    if (paused || slideCount < 2 || loading || loadError) return undefined;
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % slideCount), 5500);
    return () => window.clearInterval(timer);
  }, [paused, slideCount, loading, loadError]);

  const submitReview = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormStatus(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = { displayName: formData.get("displayName"), rating: Number(rating), message: formData.get("message") };
    try {
      const response = await fetch(`${API_BASE}/feedback/public`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Your review could not be submitted.");
      setFormStatus({ success: true, message: data.message || "Thank you. Your review has been submitted for approval." });
      setRating(0);
      form.reset();
    } catch (error) {
      setFormStatus({ success: false, message: error.message || "Unable to submit your review right now. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        className="relative isolate overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=2000&q=85')", backgroundPosition: "center 58%" }}
      >
        <div className="absolute inset-0 -z-10 bg-black/60" aria-hidden="true" />
        <Container className="relative z-10 grid min-h-[390px] items-center gap-8 py-14 sm:min-h-[430px] lg:min-h-[470px] lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="max-w-3xl">
            <p className="type-eyebrow inline-flex items-center gap-3 text-white/85"><span className="h-px w-8 bg-primary" /> Guest stories</p>
            <h1 className="type-display mt-5 max-w-3xl text-white">A stay remembered.<br />A story <span className="text-primary">shared.</span></h1>
            <p className="type-body mt-5 max-w-2xl text-white">The little moments make a stay. Read what our guests remember, and share a moment of your own.</p>
          </div>
          <div className="max-w-xs border-l-2 border-primary bg-black/35 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">Guest feedback</p>
            {total > 0 ? <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white"><Star className="size-5 fill-primary text-primary" />{total}<span className="text-sm font-normal text-white/75">approved {total === 1 ? "review" : "reviews"}</span></p> : <p className="mt-2 font-semibold tracking-tight text-xl text-white">Thoughts from every stay.</p>}
            <a href="#share-review" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-primary">Share your experience <ArrowRight className="size-4" /></a>
          </div>
        </Container>
      </section>

      <Section spacing="py-12 sm:py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="type-eyebrow text-accent">Guest experiences</p><h2 className="type-h2 mt-3">Notes from the stay</h2></div>
          {total > 0 && <p className="text-sm text-muted">Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>}
        </div>

        {loading ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading reviews">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-64 animate-pulse border border-line bg-soft" />)}</div> : loadError ? (
          <div className="mt-8 border border-line bg-soft p-7 text-center"><p className="text-sm text-muted">{loadError}</p><button onClick={() => loadReviews(page)} className="mt-4 inline-flex min-h-10 items-center gap-2 border border-line bg-white px-4 text-sm font-semibold hover:border-primary">Try again <ArrowRight className="size-4" /></button></div>
        ) : reviews.length === 0 ? (
          <div className="mt-8 border border-line bg-soft px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-primary-dark"><Quote className="size-5" /></span><h3 className="type-h3 mt-4">Your story could be the first.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">We don’t have any approved reviews just yet. If you’ve stayed with us, we’d love to hear how it went.</p></div>
        ) : (
          <div className="mt-8" role="region" aria-label="Guest review slider" aria-live="off">
            <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3" key={slide}>
              {Array.from({ length: Math.min(3, reviews.length) }, (_, index) => reviews[(slide * 3 + index) % reviews.length]).map((review, index) => <div key={`${slide}-${review._id}`} className="reviews-slide-in h-full" style={{ animationDelay: `${index * 90}ms` }}><ReviewCard review={review} /></div>)}
            </div>
            {slideCount > 1 && <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous reviews" onClick={() => setSlide((slide - 1 + slideCount) % slideCount)} className="grid size-10 place-items-center border border-line bg-white transition-colors hover:border-ink"><ChevronLeft className="size-5" /></button>
                <button type="button" aria-label="Next reviews" onClick={() => setSlide((slide + 1) % slideCount)} className="grid size-10 place-items-center border border-line bg-white transition-colors hover:border-ink"><ChevronRight className="size-5" /></button>
                <button type="button" aria-label={paused ? "Play review slider" : "Pause review slider"} onClick={() => setPaused(!paused)} className="ml-1 grid size-10 place-items-center text-muted transition-colors hover:text-ink">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
              </div>
              <div className="flex items-center gap-2" aria-label={`Slide ${slide + 1} of ${slideCount}`}>
                {Array.from({ length: slideCount }, (_, index) => <button key={index} type="button" aria-label={`Show review slide ${index + 1}`} aria-current={slide === index ? "true" : undefined} onClick={() => setSlide(index)} className={`h-2.5 rounded-full transition-all ${slide === index ? "w-7 bg-primary" : "w-2.5 bg-line hover:bg-muted"}`} />)}
              </div>
              <p className="text-xs text-muted">{paused ? "Slider paused" : "Guest stories · changes every few seconds"}</p>
            </div>}
          </div>
        )}

        {!loading && !loadError && pages > 1 && <nav aria-label="Review pages" className="mt-8 flex items-center justify-center gap-3"><button disabled={page <= 1} onClick={() => loadReviews(page - 1)} className="inline-flex min-h-11 items-center gap-2 border border-line px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft className="size-4" />Previous</button><span className="px-2 text-sm text-muted">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => loadReviews(page + 1)} className="inline-flex min-h-11 items-center gap-2 border border-line px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40">Next<ArrowRight className="size-4" /></button></nav>}
      </Section>

      <Section id="share-review" tone="soft" spacing="py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><p className="type-eyebrow text-accent">Your experience matters</p><h2 className="type-h2 mt-3">Stayed with us?</h2><p className="type-body mt-4 text-muted">Tell us what made your visit memorable—or what we could make better. Our team reads every review.</p><p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-6 text-muted">Reviews appear publicly after a member of our hotel team has reviewed them.</p></div>
          <form onSubmit={submitReview} className="border border-line bg-white p-5 sm:p-8" aria-label="Write a guest review">
            <h3 className="type-h3">Share your stay</h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label htmlFor="review-name" className="text-sm font-medium">Your name<input id="review-name" name="displayName" autoComplete="name" required maxLength={80} placeholder="Name shown with your review" className="mt-2 min-h-12 w-full border border-line px-4 py-3 text-sm font-normal placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" /></label>
              <fieldset><legend className="text-sm font-medium">Your rating</legend><div className="mt-2 flex min-h-12 items-center gap-1">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="cursor-pointer rounded p-1 focus-within:outline-2 focus-within:outline-primary"><input className="sr-only" type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} required aria-label={`${value} star${value === 1 ? "" : "s"}`} /><Star className={`size-6 transition-colors ${value <= rating ? "fill-primary text-primary" : "text-line hover:text-primary"}`} aria-hidden="true" /></label>)}</div></fieldset>
            </div>
            <label htmlFor="review-message" className="mt-5 block text-sm font-medium">Your review<textarea id="review-message" name="message" required minLength={5} maxLength={1000} rows={5} placeholder="What would you like future guests to know?" className="mt-2 w-full resize-y border border-line px-4 py-3 text-sm font-normal placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" /></label>
            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="submit" disabled={submitting || rating === 0} className="inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Submitting…" : "Submit your review"}<ArrowRight className="size-4" /></button><p className="text-xs leading-5 text-muted">Your review is sent to our team for approval.</p></div>
            {formStatus && <p role="status" className={`mt-4 text-sm font-medium ${formStatus.success ? "text-green-700" : "text-red-700"}`}>{formStatus.message}</p>}
          </form>
        </div>
      </Section>
    </>
  );
}
