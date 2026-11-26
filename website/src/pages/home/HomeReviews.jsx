import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import Container from "../../components/ui/Container";
import Reveal from "../../components/ui/Reveal";
import { API_BASE } from "../../lib/api";

// Reviews na milein to poora section chhup jata hai (khaali dabba nahi dikhta)
export default function HomeReviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/feedback/public?page=1&limit=3`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Reviews unavailable"))))
      .then((data) => setReviews(data.feedback || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!reviews.length) return null;

  return (
    <section className="bg-ink py-16 text-white sm:py-20" aria-labelledby="home-reviews-title">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="type-eyebrow text-primary">Guest reviews</p>
            <h2 id="home-reviews-title" className="type-h2 mt-3 text-white">The stay, in their words.</h2>
          </div>
          <Link to="/reviews" className="inline-flex min-h-10 items-center gap-2 border-b border-white/40 pb-1 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
            Read all reviews <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {reviews.map((review, index) => (
            <Reveal as="figure" key={review._id} delay={index * 100} className="flex flex-col rounded-md bg-white p-6 text-ink">
              <div className="flex items-center gap-1" role="img" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`size-4 ${i < review.rating ? "fill-primary text-primary" : "text-line"}`} aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-4 line-clamp-5 flex-1 text-sm leading-6">“{review.message}”</blockquote>
              <figcaption className="mt-5 border-t border-line pt-4 text-sm font-semibold">
                {review.displayName}
                <span className="mt-1 block text-xs font-normal text-muted">
                  {review.verifiedStay ? "Verified guest" : "Guest review"}
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
