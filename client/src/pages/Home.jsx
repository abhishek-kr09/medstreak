import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChartSpline,
  Crown,
  HeartHandshake,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const roleCards = [
  {
    title: "Student",
    icon: NotebookPen,
    points: [
      "Choose target NEET date and get auto-generated daily rows.",
      "Log what you studied and PCB question counts every day.",
      "Edit past days and view your curated subject dashboard."
    ]
  },
  {
    title: "Parent",
    icon: HeartHandshake,
    points: [
      "Track student progress in read-only mode.",
      "Send short notes or links that appear in the parent feed.",
      "Stay supportive without interrupting the streak."
    ]
  },
  {
    title: "Admin",
    icon: Crown,
    points: [
      "Manage students and parents in one place.",
      "Link or unlink parents, reset student codes, and review access.",
      "Full visibility across roles and activity."
    ]
  }
];

const flowSteps = [
  {
    title: "Set the target",
    body: "Students choose their NEET date and the platform prepares the full timeline.",
    icon: CalendarDays
  },
  {
    title: "Log daily",
    body: "Add what you did each day and track PCB question counts by subject.",
    icon: ChartSpline
  },
  {
    title: "Curated dashboard",
    body: "See totals by Physics, Chemistry, and Biology in a clean summary.",
    icon: ShieldCheck
  }
];

const featureCards = [
  {
    title: "Unique connect codes",
    body: "Every student gets a unique code for parent linking.",
    icon: Users
  },
  {
    title: "Multi-parent support",
    body: "A student can link with more than one parent.",
    icon: Sparkles
  },
  {
    title: "Notes feed",
    body: "Parents send notes or links that appear without realtime distractions.",
    icon: HeartHandshake
  }
];

const Home = () => (
  <div className="mx-auto flex max-w-6xl flex-col gap-12">
    <section className="grid gap-10 rounded-[36px] border border-white/70 bg-white/80 p-10 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.6)] lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Badge className="bg-teal-600 text-white">
          MedStreak platform
        </Badge>
        <h1 className="text-4xl font-semibold text-slate-900">
          NEET prep, structured by streaks and shared with the right people.
        </h1>
        <p className="text-lg text-slate-600">
          Students log daily prep, parents follow progress without editing, and admins manage
          everything in one place.
        </p>
        <p className="text-sm font-semibold text-slate-500">
          Use the navigation bar to login or register.
        </p>
      </div>
      <Card className="border border-white/80">
        <CardHeader>
          <CardTitle>
            What <span className="text-teal-600">MedStreak</span> tracks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
            Daily activity notes and study focus.
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
            PCB question counts by subject.
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
            Parent notes and curated dashboards.
          </div>
        </CardContent>
      </Card>
    </section>

    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Roles on the platform</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        {roleCards.map((role) => (
          <Card key={role.title} className="border border-white/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <role.icon size={18} />
                {role.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              {role.points.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-teal-600" />
                  {point}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      {flowSteps.map((step) => (
        <Card key={step.title} className="border border-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <step.icon size={18} />
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{step.body}</CardContent>
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      {featureCards.map((feature) => (
        <Card key={feature.title} className="border border-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <feature.icon size={18} />
              {feature.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{feature.body}</CardContent>
        </Card>
      ))}
    </section>
  </div>
);

export default Home;
