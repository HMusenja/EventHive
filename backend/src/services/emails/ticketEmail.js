// emails/ticketEmail.js
export function ticketEmailTemplate({ eventName, tickets, downloadBaseUrl }) {
  const items = tickets.map(t => `
    <div style="display:flex;gap:12px;align-items:center;margin:10px 0;">
      <img alt="QR" src="${t.qrDataUrl}" width="128" height="128" style="border:1px solid #eee;border-radius:8px"/>
      <div>
        <div style="font-weight:600">Ticket Ref: ${t.ref}</div>
        <div style="font-size:12px;color:#666">Show this QR at the entrance.</div>
        <div style="margin-top:6px">
          <a href="${downloadBaseUrl}?ref=${encodeURIComponent(t.ref)}"
             style="display:inline-block;padding:8px 12px;background:#111;color:#fff;text-decoration:none;border-radius:6px">
            Download ticket
          </a>
        </div>
      </div>
    </div>
  `).join("");

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
      <h2>Your tickets for ${eventName}</h2>
      ${items}
      <p style="margin-top:16px;color:#444">Keep this email handy. See you at the event!</p>
    </div>
  `;
}
