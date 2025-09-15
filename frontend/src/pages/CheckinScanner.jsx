// src/pages/CheckinScanner.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

// Robust lazy import that works whether the lib exports QrScanner, Scanner, or default
const QrScanner = React.lazy(() =>
  import("@yudiel/react-qr-scanner").then((mod) => ({
    default: mod.QrScanner || mod.Scanner || mod.default,
  }))
);

import { scanCheckin } from "@/api/checkinApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function parseQrPayload(text) {
  // Accept JSON payload OR simple key=val;key=val OR raw ref
  try {
    const j = JSON.parse(text);
    // expected: { orderId, ticketRef }  (or { order, ref })
    return {
      orderId: j.orderId || j.order,
      ticketRef: j.ticketRef || j.ref || j.code,
      eventId: j.eventId,
    };
  } catch (_) {
    // try key=value;key=value
    const kv = Object.fromEntries(
      String(text)
        .split(/[;,&\s]+/)
        .map((s) => s.split("=").map((x) => x.trim()))
        .filter((pair) => pair.length === 2 && pair[0] && pair[1])
    );
    if (kv.order || kv.orderId || kv.ORD || kv.o) {
      return {
        orderId: kv.orderId || kv.order || kv.ORD || kv.o,
        ticketRef: kv.ticketRef || kv.ref || kv.code || kv.c || kv.r,
      };
    }
    // fallback: treat as raw ticketRef
    return { orderId: "", ticketRef: text };
  }
}

function AttendeeCard({ data }) {
  // Support both minimal and rich responses
  const user = data?.attendee?.user || data?.user || null;
  const name = user?.fullName || data?.attendee?.fullName || "Attendee";
  const email = user?.email || data?.attendee?.email || "";
  const avatar = user?.avatar || data?.attendee?.avatar || "";
  const status = data?.alreadyUsed ? "already used" : "checked in";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted" />
        )}
        <div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {email && <div className="text-xs text-muted-foreground">{email}</div>}
        </div>
        <div className="ml-auto">
          <Badge variant={data?.alreadyUsed ? "destructive" : "default"}>{status}</Badge>
        </div>
      </CardHeader>
      {data?.ticketRef && (
        <CardContent className="text-sm text-muted-foreground">
          Ticket ref: <code>{data.ticketRef}</code>
          {data?.orderId && <> • Order: <code>{data.orderId}</code></>}
        </CardContent>
      )}
    </Card>
  );
}

export default function CheckinScanner() {
  const { eventId } = useParams();
  const [search] = useSearchParams();
  const initialOrderId = search.get("orderId") || "";
  const initialTicketRef = search.get("ticketRef") || "";

  const [cameraOn, setCameraOn] = useState(true);
  const [lastScan, setLastScan] = useState(null); // raw decoded string
  const [orderId, setOrderId] = useState(initialOrderId);
  const [ticketRef, setTicketRef] = useState(initialTicketRef);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // server response
  const [err, setErr] = useState(null);
  const debounceRef = useRef(0);
  const autoSubmittedRef = useRef(false); // avoid double auto-submit

  const canSubmit = useMemo(() => !!eventId && !!ticketRef && !!orderId && !busy, [eventId, ticketRef, orderId, busy]);

  const doSubmit = useCallback(
    async (oId, tRef) => {
      if (!eventId || !oId || !tRef) return;
      setBusy(true);
      setErr(null);
      setResult(null);
      try {
        const data = await scanCheckin(eventId, { orderId: oId, ticketRef: tRef });
        // augment for card display
        setResult({ ...data, orderId: oId, ticketRef: tRef });
        // freeze camera briefly so scanner doesn't immediately re-scan same code
        setCameraOn(false);
        setTimeout(() => setCameraOn(true), 1200);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Check-in failed");
      } finally {
        setBusy(false);
      }
    },
    [eventId]
  );

  // Auto-submit when initial query params are present (only once)
  useEffect(() => {
    if (!initialOrderId || !initialTicketRef || !eventId) return;
    // Avoid triggering multiple times due to re-renders
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    // small delay to let the UI mount
    const t = setTimeout(() => {
      doSubmit(initialOrderId, initialTicketRef);
    }, 200);
    return () => clearTimeout(t);
  }, [initialOrderId, initialTicketRef, eventId, doSubmit]);

  const handleDecode = useCallback(
    async (texts) => {
      // texts is an array of decoded strings (lib returns list)
      const raw = Array.isArray(texts) ? texts[0] : texts;
      if (!raw) return;

      // simple debounce so we don't fire multiple times
      const now = Date.now();
      if (now - debounceRef.current < 1200) return;
      debounceRef.current = now;

      setLastScan(raw);
      const parsed = parseQrPayload(raw);
      if (parsed.orderId) setOrderId(String(parsed.orderId));
      if (parsed.ticketRef) setTicketRef(String(parsed.ticketRef));

      // Auto-submit if both present
      if (parsed.orderId && parsed.ticketRef) {
        await doSubmit(parsed.orderId, parsed.ticketRef);
      }
    },
    [doSubmit]
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Event Check-in</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCameraOn((v) => !v)}>
            {cameraOn ? "Pause camera" : "Resume camera"}
          </Button>
        </div>
      </div>

      {/* Scanner */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border bg-black">
            {cameraOn ? (
              <Suspense fallback={<div className="h-[360px] grid place-items-center text-muted-foreground">Loading camera…</div>}>
                <QrScanner
                  onDecode={handleDecode}
                  onError={(e) => setErr(e?.message || "Camera error")}
                  constraints={{ facingMode: "environment" }}
                  containerStyle={{ width: "100%", height: 360 }}
                  videoStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Suspense>
            ) : (
              <div className="h-[360px] grid place-items-center text-muted-foreground">Camera paused</div>
            )}
          </div>

          {lastScan && (
            <div className="text-xs text-muted-foreground">
              Last scan:{" "}
              <code className="break-all">
                {String(lastScan).slice(0, 140)}
                {String(lastScan).length > 140 ? "…" : ""}
              </code>
            </div>
          )}
        </div>

        {/* Manual entry + result */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 68c1c251d89ca794a9e59fa7"
                />
              </div>
              <div>
                <Label htmlFor="ticketRef">Ticket Ref</Label>
                <Input
                  id="ticketRef"
                  value={ticketRef}
                  onChange={(e) => setTicketRef(e.target.value.toUpperCase())}
                  placeholder="e.g. 9JX3K2"
                />
              </div>

              <div className="flex gap-2">
                <Button disabled={!canSubmit} onClick={() => doSubmit(orderId, ticketRef)}>
                  {busy ? "Checking…" : "Check in"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResult(null);
                    setErr(null);
                    setLastScan(null);
                    // keep the inputs; if you want to clear inputs as well, uncomment:
                    // setOrderId(""); setTicketRef("");
                  }}
                >
                  Clear
                </Button>
              </div>

              {err && (
                <Alert variant="destructive">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {result && <AttendeeCard data={result} />}
        </div>
      </div>
    </div>
  );
}

