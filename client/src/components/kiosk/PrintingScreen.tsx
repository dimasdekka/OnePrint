export default function PrintingScreen({
  printProgress,
}: {
  printProgress: number;
}) {
  return (
    <div className="w-full flex items-center justify-center p-12">
      <div className="max-w-md w-full bg-white border border-black shadow-sm rounded-xl p-10 text-center">
        <h2 className="text-2xl font-bold text-black mb-4">
          {printProgress >= 100 ? "Selesai!" : "Mencetak..."}
        </h2>
        <p className="text-sm text-gray-600 mb-8">
          {printProgress >= 100
            ? "Dokumen berhasil dicetak. Terima kasih!"
            : "Pembayaran berhasil! Mengirim ke printer..."}
        </p>

        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden border border-black">
          <div
            className="bg-black h-full transition-all duration-700"
            style={{ width: `${printProgress}%` }}
          />
        </div>
        <div className="text-sm font-bold text-gray-700">{printProgress}%</div>
      </div>
    </div>
  );
}
