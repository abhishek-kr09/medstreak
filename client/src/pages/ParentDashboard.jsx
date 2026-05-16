import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { createDateRange, toDateKey, toInputDate } from "../utils/dates";

const emptyRow = {
  activityDescription: "",
  physicsQuestions: 0,
  chemistryQuestions: 0,
  biologyQuestions: 0
};

const ParentDashboard = () => {
  const { user, token } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState({});
  const [message, setMessage] = useState({ title: "", contentOrLink: "" });
  const [error, setError] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editMessage, setEditMessage] = useState({ title: "", contentOrLink: "" });
  const [noteToDelete, setNoteToDelete] = useState(null);

  const isMessageEmpty = !message.title.trim() && !message.contentOrLink.trim();
  const selectedStudent = students.find((student) => String(student._id) === selectedStudentId);

  const [today, setToday] = useState(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  });

  const todayKey = toDateKey(today);

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
        const end = toInputDate(today);
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        const [notesResponse, summaryResponse, trendsResponse] = await Promise.all([
          api.getNotes({ studentId: selectedStudentId, token }),
          api.getSummary({ studentId: selectedStudentId, token }),
          api.getTrends({ studentId: selectedStudentId, token, start: toInputDate(start), end })
        ]);
        const mappedTrends = (trendsResponse.trends || []).reduce((acc, item) => {
          acc[item.date] = item;
          return acc;
        }, {});
        setNotes(notesResponse.notes || []);
        setSummary(summaryResponse.summary);
        setTrends(mappedTrends);
        setError("");
      } catch (err) {
        setError(err.message || "Unable to load student data");
      }
    };

    fetchData();
  }, [selectedStudentId, token, today]);

  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const timeout = next.getTime() - now.getTime();

    const timer = setTimeout(() => {
      const updated = new Date();
      updated.setHours(0, 0, 0, 0);
      setToday(updated);
    }, timeout);

    return () => clearTimeout(timer);
  }, [todayKey]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedStudentId || !token) return;
    if (isMessageEmpty) {
      setError("Add a title or a note/link before sending.");
      return;
    }

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

  const handleEditStart = (note) => {
    setEditingNoteId(note._id);
    setEditMessage({
      title: note.title || "",
      contentOrLink: note.contentOrLink || ""
    });
    if (error) setError("");
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditMessage({ title: "", contentOrLink: "" });
  };

  const handleEditSave = async (noteId) => {
    if (!selectedStudentId || !token) return;
    const isEmpty = !editMessage.title.trim() && !editMessage.contentOrLink.trim();
    if (isEmpty) {
      setError("Add a title or a note/link before saving.");
      return;
    }

    try {
      const response = await api.updateNote({
        studentId: selectedStudentId,
        noteId,
        token,
        payload: {
          title: editMessage.title,
          contentOrLink: editMessage.contentOrLink
        }
      });
      setNotes((prev) => prev.map((note) => (note._id === noteId ? response.note : note)));
      setEditingNoteId(null);
      setEditMessage({ title: "", contentOrLink: "" });
      setError("");
    } catch (err) {
      setError(err.message || "Unable to update note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!selectedStudentId || !token) return;
    try {
      await api.deleteNote({ studentId: selectedStudentId, noteId, token });
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
      if (editingNoteId === noteId) {
        handleEditCancel();
      }
      setNoteToDelete(null);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to delete note");
    }
  };

  const chartDates = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return createDateRange(start, today);
  }, [today]);

  const chartData = chartDates.map((date) => {
    const key = toDateKey(date);
    const row = trends[key] || emptyRow;
    const physics = Number(row.physicsQuestions || 0);
    const chemistry = Number(row.chemistryQuestions || 0);
    const biology = Number(row.biologyQuestions || 0);
    const total = physics + chemistry + biology;
    return {
      key,
      label: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      total,
      physics,
      chemistry,
      biology
    };
  });

  const maxTotal = chartData.reduce((max, item) => Math.max(max, item.total), 0) || 1;
  const totalQuestions = chartData.reduce((sum, item) => sum + item.total, 0);
  const activeDays = chartData.filter((item) => item.total > 0).length;
  const avgPerDay = chartData.length > 0 ? Math.round(totalQuestions / chartData.length) : 0;

  return (
    <>
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

      <section className="grid gap-6 lg:grid-cols-3">
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

        <Card className="border border-white/70 lg:col-span-2">
          <CardHeader>
            <CardTitle>Daywise question trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 overflow-x-auto">
              <div
                className="flex h-full items-end gap-4 pr-4"
                style={{ minWidth: `${chartData.length * 48}px` }}
              >
                {chartData.map((item) => (
                  <div key={item.key} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-900">
                      {item.total}
                    </span>
                    <div
                      className="flex w-9 flex-col overflow-hidden rounded-full bg-slate-100"
                      style={{ height: "160px" }}
                      title={`P:${item.physics} C:${item.chemistry} B:${item.biology}`}
                    >
                      <div
                        className="bg-sky-500"
                        style={{ height: `${(item.physics / maxTotal) * 100}%` }}
                      />
                      <div
                        className="bg-emerald-500"
                        style={{ height: `${(item.chemistry / maxTotal) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{ height: `${(item.biology / maxTotal) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />Physics</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Chemistry</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />Biology</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Send a note</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSend}>
              <input
                value={message.title}
                onChange={(event) => {
                  setMessage((prev) => ({ ...prev, title: event.target.value }));
                  if (error) setError("");
                }}
                placeholder="Title"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <textarea
                value={message.contentOrLink}
                onChange={(event) => {
                  setMessage((prev) => ({ ...prev, contentOrLink: event.target.value }));
                  if (error) setError("");
                }}
                placeholder="Short note or link"
                className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <Button className="w-full" size="sm" disabled={isMessageEmpty}>
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
                  {editingNoteId === note._id ? (
                    <div className="space-y-3">
                      <input
                        value={editMessage.title}
                        onChange={(event) => {
                          setEditMessage((prev) => ({ ...prev, title: event.target.value }));
                          if (error) setError("");
                        }}
                        placeholder="Title"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <textarea
                        value={editMessage.contentOrLink}
                        onChange={(event) => {
                          setEditMessage((prev) => ({ ...prev, contentOrLink: event.target.value }));
                          if (error) setError("");
                        }}
                        placeholder="Short note or link"
                        className="h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="save" type="button" onClick={() => handleEditSave(note._id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" type="button" onClick={handleEditCancel}>
                          Cancel
                        </Button>
                        <Button size="sm" variant="delete" type="button" onClick={() => setNoteToDelete(note._id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{note.title || "Note"}</p>
                      <p className="text-sm text-slate-600">{note.contentOrLink}</p>
                      <p className="text-xs text-slate-400">
                        {toInputDate(note.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button size="sm" variant="edit" type="button" onClick={() => handleEditStart(note)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="delete" type="button" onClick={() => setNoteToDelete(note._id)}>
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
      {noteToDelete && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-6">
        <Card className="max-w-md border border-white/70">
          <CardHeader>
            <CardTitle>Delete this note?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <p>This note will be removed for this student.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" type="button" onClick={() => setNoteToDelete(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="delete" type="button" onClick={() => handleDeleteNote(noteToDelete)}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </>
  );
};

export default ParentDashboard;
