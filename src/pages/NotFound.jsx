import { Link } from "react-router-dom"
import { Button } from "../components/ui.jsx"
import "./NotFound.css"

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="not-found-code">404</p>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-desc">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="not-found-actions">
        <Button as={Link} to="/dashboard" variant="primary">Go to Dashboard</Button>
        <Button as={Link} to="/login" variant="secondary">Sign in</Button>
      </div>
    </div>
  )
}
