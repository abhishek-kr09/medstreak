import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { toInputDate } from "../utils/dates";
import { api } from "../services/api";

const StudentProfile = () => {
  const { user, token, updateUser } = useAuth();
  const [targetDate, setTargetDate] = useState(() => toInputDate(user?.targetExamDate));
  const [status, setStatus] = useState("");

  const profile = useMemo(() => ({
    name: user?.name || "",
    email: user?.email || "",
    targetExamDate: user?.targetExamDate || "",
    uniqueConnectCode: user?.uniqueConnectCode || ""
  }), [user]);

  const handleCopy = async () => {
    if (!profile.uniqueConnectCode) return;
    await navigator.clipboard.writeText(profile.uniqueConnectCode);
  };

  const handleSaveTarget = async () => {
    if (!token) return;
    try {
      const response = await api.updateTarget({
        token,
        payload: { targetExamDate: targetDate }
      });
      updateUser(response.user);
      setStatus("Target date saved.");
    } catch (err) {
      setStatus(err.message || "Unable to save target");
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
      setTargetDate("");
      setStatus("Target removed. Logs cleared.");
    } catch (err) {
      setStatus(err.message || "Unable to delete target");
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Student profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Name</p>
            <p className="text-base font-semibold text-slate-900">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
            <p className="text-base font-semibold text-slate-900">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target NEET date</p>
            <div className="mt-2 flex flex-col gap-3">
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="save" onClick={handleSaveTarget}>Save target</Button>
                <Button size="sm" variant="delete" onClick={handleDeleteTarget}>
                  Delete target
                </Button>
              </div>
              {status && <p className="text-xs text-slate-500">{status}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Parent connect code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center text-3xl font-semibold tracking-[0.35em] text-slate-900">
            {profile.uniqueConnectCode || "Pending"}
          </div>
          <p className="text-sm text-slate-600">
            Share this code with a parent so they can link to your account.
          </p>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            Copy code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfile;
