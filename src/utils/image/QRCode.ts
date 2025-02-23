import QRCode from "qrcode";

//產製 QRCode
export function GenQRCode(
  text: string,
  fileName: string = "C:/temp/qrcode.png"
) {
  QRCode.toFile(
    fileName,
    text,
    {
      color: {dark: "#000", light: "#FFF"},
    },
    (err) => {
      if (err) console.error("Error generating QR Code file:", err);
      else console.log("QR Code saved as qrcode.png");
    }
  );
}
