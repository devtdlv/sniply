import QRCode from "qrcode";

/** Server-side PNG buffer generator for QR downloads. */
export async function generateQrPngBuffer(shortUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(shortUrl, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#132029",
      light: "#FFFFFF",
    },
  });
}
