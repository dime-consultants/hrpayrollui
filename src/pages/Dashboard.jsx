import PageHeader from "../components/PageHeader.jsx";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Spinner } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";
import { endpoints } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";
import "./Dashboard.css";

export default function Dashboard() {
  const { data, loading, error } = useFetch(
    () => endpoints.advertisements(),
    [],
  );
  const advertisements = Array.isArray(data) ? data : data?.results || [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="What's happening at Dime today."
      />

      <section
        className="dashboard-events"
        aria-labelledby="what-we-offer-title"
      >
        <div className="dashboard-events-heading">
          <div>
            <h2 id="what-we-offer-title">What we offer</h2>
            <p>Stay informed about the latest updates and opportunities.</p>
          </div>
          <span className="dashboard-events-count">
            {advertisements.length} posts
          </span>
        </div>

        {error && <Alert>{error.message}</Alert>}
        {loading ? (
          <div className="dashboard-events-loading">
            <Spinner className="h-8 w-8" />
          </div>
        ) : advertisements.length ? (
          <div className="dashboard-events-grid">
            {advertisements.map((post) => (
              <Card key={post.id} className="event-card">
                <Link
                  to={`/advertisements/${post.id}`}
                  className="event-card-link"
                >
                  <div className="event-card-image-wrap">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="event-card-image"
                    />
                  </div>
                  <div className="event-card-body">
                    <p className="event-card-date">
                      {formatDateTime(post.starts_at)}
                    </p>
                    <h3>{post.title}</h3>
                    <p className="event-card-description">{post.description}</p>
                    {post.location && (
                      <p className="event-card-location">{post.location}</p>
                    )}
                    {post.price_label && (
                      <p className="event-card-price">{post.price_label}</p>
                    )}
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="dashboard-events-empty">
            <h3>No offers yet</h3>
            <p>
              New announcements will appear here for everyone on the platform.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
