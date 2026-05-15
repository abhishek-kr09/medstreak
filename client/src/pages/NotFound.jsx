import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const NotFound = () => (
  <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
    <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
    <Link to="/">
      <Button size="lg">Go home</Button>
    </Link>
  </div>
);

export default NotFound;
