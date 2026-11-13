"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import type { ScanResult } from "@/app/api/scan/route";

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type CamState = "starting" | "on" | "denied" | "none";

const RESULT_MS = 2200;

function time(d: string) {
  return new Date(d).toLocaleTimeString("en-GB", { timeZone: "Africa/Lusaka", hour: "2-digit", minute: "2-digit" });
}

/** Short beep: high for admitted, low buzz for a problem. */
function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = ok ? "sine" : "square";
    o.frequency.value = ok ? 1046 : 220;
    g.gain.value = 0.12;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.15 : 0.4));
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* no audio: fine */
  }
  navigator.vibrate?.(ok ? 80 : [120, 80, 120]);
}

export function Scanner({ eventId, title, initialAdmitted, initialSold }: { eventId: string; title: string; initialAdmitted: number; initialSold: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busy = useRef(false);
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [cam, setCam] = useState<CamState>("starting");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [counts, setCounts] = useState({ admitted: initialAdmitted, sold: initialSold });
  const [manual, setManual] = useState("");

  const check = useCallback(
    async (raw: string) => {
      const now = Date.now();
      if (busy.current) return;
      if (raw === last.current.code && now - last.current.at < 4000) return; // same QR still in view
      busy.current = true;
      last.current = { code: raw, at: now };
      try {
        const r = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, code: raw }),
        });
        const data = (await r.json()) as ScanResult;
        setResult(data);
        if ("admitted" in data) setCounts({ admitted: data.admitted, sold: data.sold });
        beep(data.result === "admitted");
      } catch {
        setResult({ result: "error", message: "No connection. Check your data and scan again." });
        beep(false);
      }
      setTimeout(() => {
        setResult(null);
        busy.current = false;
      }, RESULT_MS);
    },
    [eventId]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let lastTick = 0;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector };
    const detector = W.BarcodeDetector ? new W.BarcodeDetector({ formats: ["qr_code"] }) : null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCam("none");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setCam("on");
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setCam(e instanceof DOMException && e.name === "NotAllowedError" ? "denied" : "none");
      }
    }

    async function tick(ts: number) {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (ts - lastTick < 180 || busy.current) return;
      lastTick = ts;
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      try {
        if (detector) {
          const found = await detector.detect(v);
          if (found[0]?.rawValue) check(found[0].rawValue);
          return;
        }
        const c = canvasRef.current!;
        const scale = Math.min(1, 640 / v.videoWidth);
        c.width = Math.round(v.videoWidth * scale);
        c.height = Math.round(v.videoHeight * scale);
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (hit?.data) check(hit.data);
      } catch {
        /* skip a bad frame */
      }
    }

    start();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [check]);

  const panel = result && {
    admitted: { bg: "bg-green-600", icon: "✓", head: "Admit" },
    used: { bg: "bg-amber-500", icon: "!", head: "Already used" },
    wrong_event: { bg: "bg-flag-red", icon: "✕", head: "Wrong event" },
    invalid: { bg: "bg-flag-red", icon: "✕", head: "Not a valid ticket" },
    error: { bg: "bg-zinc-700", icon: "?", head: "Try again" },
  }[result.result];

  return (
    <div className="flex min-h-[calc(100dvh-68px)] flex-col bg-flag-black text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow text-sun-300">Admitting guests</p>
          <p className="truncate font-display text-lg font-extrabold">{title}</p>
        </div>
        <div className="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-right">
          <p className="font-display text-2xl font-extrabold tabular-nums leading-none">
            {counts.admitted}<span className="text-base text-white/60">/{counts.sold}</span>
          </p>
          <p className="text-[0.65rem] uppercase tracking-wider text-white/60">in</p>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-md flex-none overflow-hidden bg-zinc-900">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {cam === "on" && !result && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] rounded-xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        )}
        {cam === "starting" && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white/80">Starting camera…</p>}
        {cam === "denied" && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center">
            Camera access was blocked. Allow the camera for zedtix.com in your browser settings, then reload this page.
          </p>
        )}
        {cam === "none" && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center">
            No camera found on this device. Type the ticket code below instead.
          </p>
        )}
        {result && panel && (
          <div role="status" aria-live="assertive" className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${panel.bg}`}>
            <p className="text-7xl font-black leading-none">{panel.icon}</p>
            <p className="mt-3 font-display text-3xl font-extrabold uppercase">{panel.head}</p>
            {(result.result === "admitted" || result.result === "used") && (
              <>
                <p className="mt-2 text-xl font-bold">{result.type}</p>
                <p className="text-lg text-white/90">{result.name}</p>
              </>
            )}
            {result.result === "used" && <p className="mt-2 text-lg font-semibold">Checked in at {time(result.at)}</p>}
            {result.result === "wrong_event" && <p className="mt-2 text-lg">This ticket is for {result.event}</p>}
            {result.result === "error" && <p className="mt-2 text-lg">{result.message}</p>}
            {"code" in result && result.code && <p className="mt-3 font-mono tracking-[0.2em] text-white/80">{result.code}</p>}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md px-4 py-5">
        <p className="text-center text-sm text-white/70">Point the camera at the QR code on the guest&apos;s ticket.</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) {
              last.current = { code: "", at: 0 };
              check(manual);
              setManual("");
            }
          }}
        >
          <label htmlFor="manual-code" className="sr-only">Ticket code</label>
          <input
            id="manual-code"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Or type the ticket code"
            autoCapitalize="characters"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-3.5 py-3 font-mono uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/50 focus:border-sun-400 focus:outline-none"
          />
          <button className="shrink-0 rounded-md bg-sun-400 px-5 font-bold text-flag-black">Check</button>
        </form>
        <Link href={`/organiser/events/${eventId}`} className="mt-6 block text-center text-sm font-semibold text-white/70 hover:text-white">
          ← Back to event dashboard
        </Link>
      </div>
    </div>
  );
}
