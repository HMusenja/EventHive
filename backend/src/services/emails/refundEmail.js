// emails/refundEmail.js
export function refundEmailTemplate({ eventName, refs }) {
  const list = refs.map(r => `<li style="margin:4px 0">Ref: <code>${r}</code> — revoked</li>`).join("");
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.5">
      <h2>Your ${eventName} ticket${refs.length>1?"s":""} were refunded</h2>
      <p>These ticket references have been revoked and can no longer be used for check-in:</p>
      <ul>${list}</ul>
      <p style="color:#666">If you believe this was in error, please contact the organizer.</p>
    </div>
  `;
}
