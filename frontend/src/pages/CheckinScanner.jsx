// src/pages/CheckinScanner.jsx
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext"; 
import { useParams, useSearchParams, Link } from "react-router-dom";

// Lazy QR scanner
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
  try {
    const j = JSON.parse(text);
    return {
      orderId: j.orderId || j.order,
      ticketRef: j.ticketRef || j.ref || j.code,
      eventId: j.eventId,
    };
  } catch (_) {
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
    return { orderId: "", ticketRef: text };
  }
}

function AttendeeCard({ data }) {
  const user = data?.attendee?.user || data?.user || null;
  const name = user?.fullName || data?.attendee?.name || "Attendee";
  const email = user?.email || data?.attendee?.email || "";
  const status = data?.ticket?.status === "used" ? "already used" : "checked in";
  
   

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        {user?.avatar ? (
          <img src={user.avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted" />
        )}
        <div>
          <CardTitle className="text-lg">{name}</CardTitle>
          {email && <div className="text-xs text-muted-foreground">{email}</div>}
        </div>
        <div className="ml-auto">
          <Badge variant={data?.ticket?.status === "used" ? "destructive" : "default"}>{status}</Badge>
        </div>
      
      </CardHeader>
      {data?.ticket?.ref && (
        <CardContent className="text-sm text-muted-foreground">
          Ticket ref: <code>{data.ticket.ref}</code>
          {data?.orderId && <> • Order: <code>{data.orderId}</code></>}
        </CardContent>

      )}
    </Card>
  );
}

export default function CheckinScanner() {
  // const { eventId } = useParams();
  const [search] = useSearchParams();
  const { user } = useAuth(); // ⬅️ logged-in user from context/auth
    const { eventId } = useParams();

  // Only admins/organizers can use scanner
  const isOrganizer = user?.role === "admin" || user?.role === "organizer" || user?.isOrganizer;

  const initialOrderId = search.get("orderId") || "";
  const initialTicketRef = search.get("ticketRef") || "";

  const [cameraOn, setCameraOn] = useState(true);
  const [lastScan, setLastScan] = useState(null);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [ticketRef, setTicketRef] = useState(initialTicketRef);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [isSelfCheckin, setIsSelfCheckin] = useState(false);

  const debounceRef = useRef(0);
  const autoSubmittedRef = useRef(false);

  const canSubmit = useMemo(() => !!eventId && !!ticketRef && !!orderId && !busy, [eventId, ticketRef, orderId, busy]);

  const doSubmit = useCallback(
    async (oId, tRef) => {
      if (!eventId || !oId || !tRef) return;
      setBusy(true);
      setErr(null);
      setResult(null);
      try {
        const data = await scanCheckin(eventId, { orderId: oId, ticketRef: tRef });
        setResult({ ...data, orderId: oId, ticketRef: tRef });
        setIsSelfCheckin(!!data.selfCheckin);
        if (!data.selfCheckin && isOrganizer) {
          setCameraOn(false);
          setTimeout(() => setCameraOn(true), 1200);
        }
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Check-in failed");
      } finally {
        setBusy(false);
      }
    },
    [eventId, isOrganizer]
  );

  useEffect(() => {
    if (!initialOrderId || !initialTicketRef || !eventId) return;
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    const t = setTimeout(() => {
      doSubmit(initialOrderId, initialTicketRef);
    }, 200);
    return () => clearTimeout(t);
  }, [initialOrderId, initialTicketRef, eventId, doSubmit]);

  const handleDecode = useCallback(
    async (texts) => {
      const raw = Array.isArray(texts) ? texts[0] : texts;
      if (!raw) return;
      const now = Date.now();
      if (now - debounceRef.current < 1200) return;
      debounceRef.current = now;
      setLastScan(raw);
      const parsed = parseQrPayload(raw);
      if (parsed.orderId) setOrderId(String(parsed.orderId));
      if (parsed.ticketRef) setTicketRef(String(parsed.ticketRef));
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
        {isOrganizer && !isSelfCheckin && (
          <Button variant="outline" onClick={() => setCameraOn((v) => !v)}>
            {cameraOn ? "Pause camera" : "Resume camera"}
          </Button>
        )}
          <Button asChild variant="secondary">
          <Link to={`/events/${eventId}`}>Go back to event</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isOrganizer && !isSelfCheckin && (
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
        )}

        {/* Manual entry is always visible */}
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
