import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toInputDate } from "../utils/dates";

/* ----------------------------- URL HELPERS ----------------------------- */

const normalizeLink = (value) => {
  if (!value || typeof value !== "string") return null;

  let cleaned = value.trim();

  if (cleaned.startsWith("www.")) {
    cleaned = `https://${cleaned}`;
  }

  try {
    return new URL(cleaned).toString();
  } catch {
    return null;
  }
};

/* ----------------------------- PLATFORM CONFIG ----------------------------- */

const MEDIA_PLATFORMS = [
  {
    name: "youtube",
    patterns: [
      "youtube.com/watch",
      "youtube.com/shorts/",
      "youtube.com/embed/",
      "youtu.be/"
    ]
  },
  {
    name: "facebook",
    patterns: [
      "facebook.com/watch",
      "fb.watch/"
    ]
  }
];

/* ----------------------------- DETECT PLATFORM ----------------------------- */

const detectPlatform = (url) => {
  if (!url) return null;

  const lower = url.toLowerCase();

  for (const platform of MEDIA_PLATFORMS) {
    const matched = platform.patterns.some((pattern) =>
      lower.includes(pattern)
    );

    if (matched) {
      return platform.name;
    }
  }

  return null;
};

/* ----------------------------- EMBED URL ----------------------------- */

const getEmbedUrl = (url, platform) => {
  try {
    const parsed = new URL(url);

    /* ---------------- YOUTUBE ---------------- */

    if (platform === "youtube") {

      // youtu.be
      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.slice(1);

        return id
          ? `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`
          : null;
      }

      // youtube watch?v=
      const watchId = parsed.searchParams.get("v");

      if (watchId) {
        return `https://www.youtube.com/embed/${watchId}?modestbranding=1&rel=0`;
      }

      // shorts
      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1];

        return id
          ? `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`
          : null;
      }

      // already embed
      if (parsed.pathname.includes("/embed/")) {
        return url;
      }
    }

    /* ---------------- INSTAGRAM ---------------- */

    if (platform === "instagram") {
      return `${url}${url.endsWith("/") ? "" : "/"}embed`;
    }

    /* ---------------- FACEBOOK ---------------- */

    if (platform === "facebook") {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }

  } catch {
    return null;
  }

  return null;
};

/* ----------------------------- MEDIA TYPE ----------------------------- */

const getMediaType = (url) => {
  if (!url) return null;

  const lower = url.toLowerCase();

  // media platform
  if (detectPlatform(url)) {
    return "embed";
  }

  // pdf
  if (lower.includes(".pdf")) {
    return "pdf";
  }

  // video
  if (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".ogg") ||
    lower.includes("video")
  ) {
    return "video";
  }

  // audio
  if (
    lower.includes(".mp3") ||
    lower.includes(".wav") ||
    lower.includes(".m4a") ||
    lower.includes("audio")
  ) {
    return "audio";
  }

  return "link";
};

/* ----------------------------- SHORT DETECTION ----------------------------- */

const isVerticalMedia = (url) => {
  if (!url) return false;

  return (
    url.includes("/shorts/") ||
    url.includes("/reel/")
  );
};

/* ----------------------------- COMPONENT ----------------------------- */

const StudentNotes = () => {
  const { user, token } = useAuth();

  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const studentId =
    user?.role === "student"
      ? user._id
      : null;

  useEffect(() => {
    if (!studentId || !token) return;

    const loadNotes = async () => {
      try {
        setLoading(true);

        const response = await api.getNotes({
          studentId,
          token
        });

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

  const noteCount = useMemo(
    () => notes.length,
    [notes]
  );

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">

      {/* ---------------- HEADER ---------------- */}

      <Card className="border border-white/70">
        <CardHeader>
          <CardTitle>Parent notes</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            Notes shared by your linked parents appear here.
          </p>

          <p className="text-xs text-slate-500">
            Total notes: {noteCount}
          </p>
        </CardContent>
      </Card>

      {/* ---------------- ERROR ---------------- */}

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="text-sm text-red-700">
            {error}
          </CardContent>
        </Card>
      )}

      {/* ---------------- LOADING ---------------- */}

      {loading ? (
        <Card className="border border-white/70">
          <CardContent className="text-sm text-slate-600">
            Loading notes...
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card className="border border-white/70">
          <CardContent className="text-sm text-slate-600">
            No notes yet.
          </CardContent>
        </Card>
      ) : (

        <div className="grid gap-4">

          {notes.map((note) => {

            const link = normalizeLink(note.contentOrLink || "");

            const mediaType = getMediaType(link);

            const platform = detectPlatform(link);

            const embedUrl =
              platform
                ? getEmbedUrl(link, platform)
                : null;

            const isVertical =
              isVerticalMedia(link);

            return (
              <Card
                key={note._id}
                className="border border-white/70"
              >
                <CardContent className="space-y-3">

                  {/* ---------------- TITLE ---------------- */}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {note.title || "Note"}
                    </p>

                    <p className="text-xs text-slate-400">
                      {toInputDate(note.createdAt)}
                    </p>
                  </div>

                  {/* ---------------- PARENT ---------------- */}

                  <p className="text-xs text-slate-500">
                    From: {note.parent?.name || "Parent"}
                    {note.parent?.email
                      ? ` · ${note.parent.email}`
                      : ""}
                  </p>

                  {/* ---------------- CONTENT ---------------- */}

                  {link ? (
                    <>

                      {/* ---------------- EMBED PLATFORMS ---------------- */}

                      {mediaType === "embed" &&
                        platform &&
                        embedUrl && (

                          <div className="flex justify-center">

                            <div
                              className={
                                isVertical
                                  ? "w-full max-w-[260px] overflow-hidden rounded-2xl bg-black shadow-lg"
                                  : "w-full overflow-hidden rounded-2xl bg-black"
                              }
                            >

                              <iframe
                                className={
                                  isVertical
                                    ? "h-[460px] w-full"
                                    : "aspect-video w-full"
                                }
                                src={embedUrl}
                                title={note.title || "Media"}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                              />

                            </div>

                          </div>
                        )}

                      {/* ---------------- VIDEO ---------------- */}

                      {mediaType === "video" && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 p-3">

                          <video
                            className="w-full rounded-xl"
                            controls
                            preload="metadata"
                          >
                            <source
                              src={link}
                              type="video/mp4"
                            />

                            Your browser does not support video playback.
                          </video>

                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-medium underline"
                          >
                            Open video in new tab
                          </a>

                        </div>
                      )}

                      {/* ---------------- AUDIO ---------------- */}

                      {mediaType === "audio" && (
                        <div className="rounded-2xl border border-slate-200 bg-white/60 p-3">

                          <audio
                            className="w-full"
                            controls
                            preload="metadata"
                          >
                            <source
                              src={link}
                              type="audio/mpeg"
                            />

                            Your browser does not support audio playback.
                          </audio>

                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-medium underline"
                          >
                            Open audio in new tab
                          </a>

                        </div>
                      )}

                      {/* ---------------- PDF ---------------- */}

                      {mediaType === "pdf" && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                        >
                          Open PDF in new tab
                        </a>
                      )}

                      {/* ---------------- NORMAL LINK ---------------- */}

                      {mediaType === "link" && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 break-all"
                        >
                          {note.contentOrLink}
                        </a>
                      )}

                    </>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {note.contentOrLink || "No content"}
                    </p>
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