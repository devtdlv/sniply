import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: "M" as const,
  color: {
    dark: "#132029",
    light: "#FFFFFF",
  },
};

/** Browser-safe data URL generator for QR previews. */
export async function generateQrDataUrl(shortUrl: string): Promise<string> {
  return QRCode.toDataURL(shortUrl, QR_OPTIONS);
}
