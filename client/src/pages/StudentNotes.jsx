import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toInputDate } from "../utils/dates";

const normalizeLink = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    if (value.startsWith("www.")) {
      return `https://${value}`;
    }
  }
  return null;
};

const StudentNotes = () => {
  const { user, token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const studentId = user?.role === "student" ? user._id : null;

  useEffect(() => {
    if (!studentId || !token) return;

    const loadNotes = async () => {
      try {
        setLoading(true);
        const response = await api.getNotes({ studentId, token });
        setNotes(response.notes || []);
        setError("");
      } catch (err) {
        setError(err.message || "Unable to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [studentId, token]);

  const noteCount = useMemo(() => notes.length, [notes]);

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Parent notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Notes shared by your linked parents appear here.</p>
          <p className="text-xs text-slate-500">Total notes: {noteCount}</p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="border border-white/70">
          <CardContent className="text-sm text-slate-600">Loading notes...</CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="border border-white/70">
          <CardContent className="text-sm text-slate-600">No notes yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => {
            const link = normalizeLink(note.contentOrLink || "");
            return (
              <Card key={note._id} className="border border-white/70">
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {note.title || "Note"}
                    </p>
                    <p className="text-xs text-slate-400">{toInputDate(note.createdAt)}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    From: {note.parent?.name || "Parent"}
                    {note.parent?.email ? ` · ${note.parent.email}` : ""}
                  </p>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                    >
                      {note.contentOrLink}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-600">{note.contentOrLink || "No content"}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentNotes;
