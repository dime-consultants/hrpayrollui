import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { Alert, Button, Card, Spinner } from "../components/ui.jsx";
import { endpoints } from "../lib/api.js";
import { useFetch } from "../lib/useFetch.js";
import { formatDateTime } from "../lib/format.js";
import "./AdvertisementDetail.css";

export default function AdvertisementDetail() {
  const { id } = useParams();
  const {
    data: post,
    loading,
    error,
  } = useFetch(() => endpoints.advertisement(id), [id]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading) {
    return (
      <div className="advertisement-detail-loading">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (error) return <Alert>{error.message}</Alert>;
  if (!post) return null;

  const slides = post.subposts?.length ? post.subposts : [post];
  const active = slides[activeIndex] || slides[0];
  const previous = () =>
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  const next = () => setActiveIndex((index) => (index + 1) % slides.length);

  return (
    <div>
      <PageHeader
        title={post.title}
        subtitle="Explore the details and related offers."
        actions={
          <Button as={Link} to="/dashboard" variant="secondary">
            Back to dashboard
          </Button>
        }
      />
      <Card className="advertisement-detail-card">
        <div className="advertisement-carousel-viewport">
          <div
            className="advertisement-carousel-track"
            style={{ "--carousel-index": activeIndex }}
          >
            {slides.map((slide) => (
              <article className="advertisement-slide" key={slide.id}>
                <img src={slide.image_url} alt={slide.title} />
                <div className="advertisement-slide-shade" />
                <div className="advertisement-slide-copy">
                  <p>{formatDateTime(slide.starts_at)}</p>
                  <h2>{slide.title}</h2>
                  {slide.location && <span>{slide.location}</span>}
                  {slide.price_label && <strong>{slide.price_label}</strong>}
                </div>
              </article>
            ))}
          </div>
          {slides.length > 1 && (
            <>
              <button
                className="advertisement-carousel-button previous"
                onClick={previous}
                aria-label="Previous post"
              >
                ‹
              </button>
              <button
                className="advertisement-carousel-button next"
                onClick={next}
                aria-label="Next post"
              >
                ›
              </button>
            </>
          )}
        </div>
        <p className="advertisement-detail-description">{active.description}</p>
      </Card>
      <div className="advertisement-carousel-meta">
        <span>
          {activeIndex + 1} / {slides.length}
        </span>
        <div className="advertisement-carousel-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={index === activeIndex ? "active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show post ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
