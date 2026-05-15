import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toInputDate } from "../utils/dates";

const ParentDashboard = () => {
  const { user, token } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState({ title: "", contentOrLink: "" });
  const [error, setError] = useState("");

  const linkedStudents = useMemo(() => user?.studentsLinked || [], [user]);

  useEffect(() => {
    if (!token) return;

    const loadStudents = async () => {
      try {
        const response = await api.getParentStudents({ token });
        const list = response.students || [];
        setStudents(list);
        if (!selectedStudentId && list.length > 0) {
          setSelectedStudentId(String(list[0]._id));
        }
      } catch (err) {
        setError(err.message || "Unable to load linked students");
      }
    };

    loadStudents();
  }, [token, selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId || !token) return;

    const fetchData = async () => {
      try {
        const [notesResponse, summaryResponse] = await Promise.all([
          api.getNotes({ studentId: selectedStudentId, token }),
          api.getSummary({ studentId: selectedStudentId, token })
        ]);
        setNotes(notesResponse.notes || []);
        setSummary(summaryResponse.summary);
        setError("");
      } catch (err) {
        setError(err.message || "Unable to load student data");
      }
    };

    fetchData();
  }, [selectedStudentId, token]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedStudentId || !token) return;

    try {
      const response = await api.createNote({
        studentId: selectedStudentId,
        token,
        payload: {
          title: message.title,
          contentOrLink: message.contentOrLink
        }
      });
      setNotes((prev) => [response.note, ...prev]);
      setMessage({ title: "", contentOrLink: "" });
      setError("");
    } catch (err) {
      setError(err.message || "Unable to send note");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Parent dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="studentId">
              Linked students
            </label>
            <select
              id="studentId"
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Select a student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-500">
            Linked students count: {linkedStudents.length}
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Student totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Physics</span>
              <span className="font-semibold text-slate-900">{summary?.physicsQuestions ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Chemistry</span>
              <span className="font-semibold text-slate-900">{summary?.chemistryQuestions ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Biology</span>
              <span className="font-semibold text-slate-900">{summary?.biologyQuestions ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Send a note</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSend}>
              <input
                value={message.title}
                onChange={(event) => setMessage((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <textarea
                value={message.contentOrLink}
                onChange={(event) => setMessage((prev) => ({ ...prev, contentOrLink: event.target.value }))}
                placeholder="Short note or link"
                className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Button className="w-full" size="sm">
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">Parent notes feed</h2>
        {notes.length === 0 ? (
          <Card className="border border-white/70">
            <CardContent className="text-sm text-slate-600">
              No notes yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <Card key={note._id} className="border border-white/70">
                <CardContent className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{note.title || "Note"}</p>
                  <p className="text-sm text-slate-600">{note.contentOrLink}</p>
                  <p className="text-xs text-slate-400">
                    {toInputDate(note.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ParentDashboard;
