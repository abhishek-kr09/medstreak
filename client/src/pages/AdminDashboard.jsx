import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("student");
  const [link, setLink] = useState({ parentId: "", studentId: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    const loadUsers = async () => {
      try {
        const response = await api.listUsers({ token, role });
        setUsers(response.users || []);
        setMessage("");
      } catch (err) {
        setMessage(err.message || "Unable to load users");
      }
    };

    loadUsers();
  }, [token, role]);

  const handleReset = async (studentId) => {
    if (!token) return;
    try {
      const response = await api.resetStudentCode({ token, studentId });
      setMessage(`New code: ${response.uniqueConnectCode}`);
    } catch (err) {
      setMessage(err.message || "Unable to reset code");
    }
  };

  const handleLink = async (event, unlink = false) => {
    event.preventDefault();
    if (!token) return;

    try {
      if (unlink) {
        await api.unlinkParent({ token, payload: link });
        setMessage("Unlinked successfully");
      } else {
        await api.linkParent({ token, payload: link });
        setMessage("Linked successfully");
      }
      setLink({ parentId: "", studentId: "" });
    } catch (err) {
      setMessage(err.message || "Unable to update link");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Admin control room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>Manage students, parents, and their links from here.</p>
          {message && <p className="text-slate-900">{message}</p>}
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[0.6fr_1fr]">
        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Link parent to student</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleLink}>
              <input
                value={link.parentId}
                onChange={(event) => setLink((prev) => ({ ...prev, parentId: event.target.value }))}
                placeholder="Parent ID"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <input
                value={link.studentId}
                onChange={(event) => setLink((prev) => ({ ...prev, studentId: event.target.value }))}
                placeholder="Student ID"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" type="submit">Link</Button>
                <Button size="sm" variant="outline" onClick={(event) => handleLink(event, true)}>
                  Unlink
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Students", value: "student" },
                { label: "Parents", value: "parent" },
                { label: "Admins", value: "admin" }
              ].map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={role === option.value ? "default" : "outline"}
                  onClick={() => setRole(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {users.length === 0 ? (
              <p className="text-sm text-slate-600">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-500">Role: {user.role}</p>
                    {user.role === "student" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => handleReset(user._id)}
                      >
                        Reset connect code
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;
