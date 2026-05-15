import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { createDateRange, toDateKey, toInputDate } from "../utils/dates";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const emptyRow = {
  activityDescription: "",
  physicsQuestions: "",
  chemistryQuestions: "",
  biologyQuestions: ""
};

const StudentDashboard = () => {
  const { user, token, updateUser } = useAuth();
  const [logs, setLogs] = useState({});
  const [summary, setSummary] = useState(null);
  const [savingDate, setSavingDate] = useState(null);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isEditingToday, setIsEditingToday] = useState(true);

  const studentId = user?.role === "student" ? user._id : null;

  const [today, setToday] = useState(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  });

  const todayKey = toDateKey(today);

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

  const chartDates = useMemo(() => {
    if (!user?.targetExamDate) return [];
    const start = today;
    const end = new Date(user.targetExamDate);
    if (end < start) return createDateRange(end, end);
    return createDateRange(start, end);
  }, [user, today]);

  const previousDates = useMemo(() => {
    if (!user?.targetExamDate) return [];
    const start = user.createdAt ? new Date(user.createdAt) : today;
    const end = new Date(today);
    end.setDate(end.getDate() - 1);
    if (end < start) return [];
    return createDateRange(start, end);
  }, [user, today]);

  useEffect(() => {
    if (!studentId || !token) return;
    if (!user?.targetExamDate) {
      setLogs({});
      setSummary({ physicsQuestions: 0, chemistryQuestions: 0, biologyQuestions: 0 });
      setError("");
      return;
    }

    const fetchData = async () => {
      try {
        const [logsResponse, summaryResponse] = await Promise.all([
          api.getLogs({ studentId, token, end: toInputDate(today) }),
          api.getSummary({ studentId, token })
        ]);

        const mappedLogs = (logsResponse.logs || []).reduce((acc, log) => {
          const key = toDateKey(log.date);
          acc[key] = log;
          return acc;
        }, {});

        setLogs(mappedLogs);
        setSummary(summaryResponse.summary);
        setIsEditingToday(!mappedLogs[todayKey]?._id);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load logs");
      }
    };

    fetchData();
  }, [studentId, token, user?.targetExamDate, today]);


  const handleChange = (dateKey, field, value) => {
    setLogs((prev) => {
      const existing = prev[dateKey] || { ...emptyRow };
      return {
        ...prev,
        [dateKey]: { ...existing, [field]: value }
      };
    });
  };

  const handleSave = async (date) => {
    if (!studentId || !token) return;
    const dateKey = toDateKey(date);
    const current = logs[dateKey] || emptyRow;

    try {
      setSavingDate(dateKey);
      const payload = {
        date: toInputDate(date),
        activityDescription: current.activityDescription || "",
        physicsQuestions: Number(current.physicsQuestions || 0),
        chemistryQuestions: Number(current.chemistryQuestions || 0),
        biologyQuestions: Number(current.biologyQuestions || 0)
      };

      let response;
      if (current._id) {
        response = await api.updateLog({
          studentId,
          logId: current._id,
          token,
          payload
        });
      } else {
        response = await api.createLog({ studentId, token, payload });
      }

      setLogs((prev) => ({
        ...prev,
        [dateKey]: response.log
      }));

      const summaryResponse = await api.getSummary({ studentId, token });
      setSummary(summaryResponse.summary);
      setIsEditingToday(false);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to save");
    } finally {
      setSavingDate(null);
    }
  };

  const handleDeleteTarget = async () => {
    if (!token) return;
    try {
      const response = await api.updateTarget({
        token,
        payload: { targetExamDate: null }
      });
      updateUser(response.user);
      setLogs({});
      setSummary({ physicsQuestions: 0, chemistryQuestions: 0, biologyQuestions: 0 });
      setError("");
    } catch (err) {
      setError(err.message || "Unable to delete target");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return null;
  }

  const chartData = chartDates.map((date) => {
    const key = toDateKey(date);
    const row = logs[key] || emptyRow;
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

  const daysLeft = useMemo(() => {
    if (!user?.targetExamDate) return null;
    const end = new Date(user.targetExamDate);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    return diff;
  }, [user, today]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Target NEET date
              <Badge className="bg-teal-600 text-white">Student</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-semibold text-slate-900">
              {toInputDate(user.targetExamDate) || "Not set"}
            </p>
            {daysLeft !== null && (
              <p className="text-sm font-semibold text-red-500">
                {daysLeft >= 0 ? `${daysLeft} days left` : "Target date passed"}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link to="/student/profile">
                <Button size="sm" variant={user.targetExamDate ? "edit" : "default"}>
                  {user.targetExamDate ? "Edit target" : "Set target"}
                </Button>
              </Link>
              {user.targetExamDate && (
                <Button
                  size="sm"
                  variant="delete"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete target
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Deleting the target clears all logs for this journey.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-white/70">
          <CardHeader>
            <CardTitle>Question trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52 overflow-x-auto">
              <div
                className="flex h-full items-end gap-3 pr-4"
                style={{ minWidth: `${chartData.length * 36}px` }}
              >
                {chartData.map((item) => (
                  <div key={item.key} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-900">
                      {item.total}
                    </span>
                    <div
                      className="flex w-7 flex-col overflow-hidden rounded-full bg-slate-100"
                      style={{ height: "140px" }}
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
                    <span className="text-[10px] text-slate-400">{item.label}</span>
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

        <Card className="border border-white/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-sky-100/70 px-4 py-3">
              <span className="font-semibold text-slate-900">Physics</span>
              <span className="text-lg font-semibold text-slate-900">{summary?.physicsQuestions ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-emerald-100/70 px-4 py-3">
              <span className="font-semibold text-slate-900">Chemistry</span>
              <span className="text-lg font-semibold text-slate-900">{summary?.chemistryQuestions ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-amber-100/70 px-4 py-3">
              <span className="font-semibold text-slate-900">Biology</span>
              <span className="text-lg font-semibold text-slate-900">{summary?.biologyQuestions ?? "-"}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">Daily logs</h2>
          <Button size="sm" variant="outline" onClick={() => setShowAll((prev) => !prev)}>
            {showAll ? "Hide all" : "See all"}
          </Button>
        </div>
        {!user.targetExamDate ? (
          <Card className="border border-white/70">
            <CardContent className="text-sm text-slate-600">
              Set a target NEET date to generate your daily rows.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border border-white/70">
              <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.4fr_0.4fr_0.4fr_0.4fr_0.4fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{today.toDateString()}</p>
                  <textarea
                    value={(logs[todayKey] || emptyRow).activityDescription || ""}
                    onChange={(event) => handleChange(todayKey, "activityDescription", event.target.value)}
                    placeholder="What did you study today?"
                    readOnly={!isEditingToday}
                    className="mt-2 h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                {[
                  { key: "physicsQuestions", label: "Physics" },
                  { key: "chemistryQuestions", label: "Chemistry" },
                  { key: "biologyQuestions", label: "Biology" }
                ].map((item) => (
                  <div key={item.key}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <input
                      type="number"
                      min="0"
                      value={(logs[todayKey] || emptyRow)[item.key] ?? ""}
                      onChange={(event) => handleChange(todayKey, item.key, event.target.value)}
                      readOnly={!isEditingToday}
                      className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                ))}
                <div className="flex flex-col items-end gap-2">
                  <Button
                    size="sm"
                    variant="edit"
                    onClick={() => setIsEditingToday(true)}
                    disabled={isEditingToday}
                  >
                    Edit
                  </Button>
                  <Button
                    className="w-full"
                    size="sm"
                    variant="save"
                    onClick={() => handleSave(today)}
                    disabled={savingDate === todayKey || !isEditingToday}
                  >
                    {savingDate === todayKey ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showAll && (
              <div className="space-y-4">
                {previousDates.length === 0 ? (
                  <Card className="border border-white/70">
                    <CardContent className="text-sm text-slate-600">
                      No previous logs yet.
                    </CardContent>
                  </Card>
                ) : (
                  previousDates.map((date) => {
                    const dateKey = toDateKey(date);
                    const log = logs[dateKey];
                    return (
                      <Card key={dateKey} className="border border-white/70">
                        <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1.4fr_0.4fr_0.4fr_0.4fr_0.4fr]">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              {date.toDateString()}
                            </p>
                            <textarea
                              value={log?.activityDescription || ""}
                              readOnly
                              placeholder="No study logged"
                              className="mt-2 h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                            />
                          </div>
                          {[
                            { key: "physicsQuestions", label: "Physics" },
                            { key: "chemistryQuestions", label: "Chemistry" },
                            { key: "biologyQuestions", label: "Biology" }
                          ].map((item) => (
                            <div key={item.key}>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                              <input
                                type="number"
                                value={log?.[item.key] ?? ""}
                                readOnly
                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                              />
                            </div>
                          ))}
                          <div className="flex items-end">
                            <Button size="sm" variant="outline" disabled>
                              Locked
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-6">
          <Card className="max-w-md border border-white/70">
            <CardHeader>
              <CardTitle>Delete target date?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>This will remove the target date and delete all daily logs.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="delete" onClick={handleDeleteTarget}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
