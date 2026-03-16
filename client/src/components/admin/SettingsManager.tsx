import axios from "axios";

export default function SettingsManager({
  adminData,
  showModal,
}: {
  adminData: any;
  showModal: any;
}) {
  const {
    priceBw,
    setPriceBw,
    priceColor,
    setPriceColor,
    loadingSettings,
    setLoadingSettings,
  } = adminData;

  const handleSaveSettings = async () => {
    setLoadingSettings(true);
    try {
      await axios.post("/api/admin/settings", {
        pricePerPageBw: priceBw,
        pricePerPageColor: priceColor,
      });
      showModal("info", "Berhasil", "Pengaturan harga berhasil disimpan!");
    } catch (e) {
      showModal("alert", "Error", "Gagal menyimpan pengaturan.");
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-black p-8 max-w-4xl">
      <h3 className="text-lg font-bold text-black mb-8">
        Setting Harga Per Halaman
      </h3>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Harga Halaman BW (IDR)
          </label>
          <div className="flex border border-black rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-black px-4 bg-white h-12 items-center">
            <span className="font-medium text-gray-500 mr-2">Rp</span>
            <input
              type="number"
              value={priceBw}
              onChange={(e) => setPriceBw(Number(e.target.value))}
              className="flex-1 font-medium outline-none text-black bg-transparent w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            Harga Halaman Warna (IDR)
          </label>
          <div className="flex border border-black rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-black px-4 bg-white h-12 items-center">
            <span className="font-medium text-gray-500 mr-2">Rp</span>
            <input
              type="number"
              value={priceColor}
              onChange={(e) => setPriceColor(Number(e.target.value))}
              className="flex-1 font-medium outline-none text-black bg-transparent w-full"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={loadingSettings}
        className="w-full bg-white border border-black text-black py-3 rounded-full font-bold hover:bg-gray-50 transition disabled:opacity-50"
      >
        {loadingSettings ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}
