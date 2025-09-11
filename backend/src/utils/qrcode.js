// utils/qrcode.js
import QRCode from "qrcode";

export async function qrPngDataUrl(ref) {
  return QRCode.toDataURL(ref, { errorCorrectionLevel: "M", margin: 1, scale: 6 });
}
