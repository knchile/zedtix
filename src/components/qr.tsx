import QRCode from "qrcode";

/** Server-rendered QR code as inline SVG. */
export async function QR({ value, size = 220 }: { value: string; size?: number }) {
  const svg = await QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return (
    <div
      role="img"
      aria-label="Ticket QR code"
      style={{ width: size, height: size }}
      className="[&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
