import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const roleOptions = [
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
  { label: "Admin", value: "admin" }
];

const Register = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    studentConnectCode: "",
    adminKey: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      let response;
      if (role === "student") {
        response = await api.registerStudent({
          name: form.name,
          email: form.email,
          password: form.password
        });
      }

      if (role === "parent") {
        response = await api.registerParent({
          name: form.name,
          email: form.email,
          password: form.password,
          studentConnectCode: form.studentConnectCode
        });
      }

      if (role === "admin") {
        response = await api.registerAdmin({
          name: form.name,
          email: form.email,
          password: form.password,
          adminKey: form.adminKey
        });
      }

      login(response.token, response.user);
      navigate(`/${response.user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-3">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    role === option.value
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    className="sr-only"
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                minLength={6}
                required
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {role === "parent" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="studentConnectCode">
                  Student connect code
                </label>
                <input
                  id="studentConnectCode"
                  type="text"
                  value={form.studentConnectCode}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, studentConnectCode: event.target.value }))
                  }
                  required
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}

            {role === "admin" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="adminKey">
                  Admin key
                </label>
                <input
                  id="adminKey"
                  type="password"
                  value={form.adminKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, adminKey: event.target.value }))}
                  required
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Already have an account? <Link to="/login" className="font-semibold text-slate-900">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
