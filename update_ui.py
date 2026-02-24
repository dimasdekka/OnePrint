import re

file_path = r"c:\Users\Unicodes\Documents\CODESPACE\OnePrint\client\src\app\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add Script import and window.snap types if not exists
if 'import Script from "next/script";' not in content:
    content = content.replace('import axios from "axios";', 'import axios from "axios";\nimport Script from "next/script";\n\ndeclare global {\n  interface Window {\n    snap: any;\n  }\n}')

# Ensure loadingPayment state is there
if "const [loadingPayment, setLoadingPayment] = useState(false);" not in content:
    content = content.replace('const [printProgress, setPrintProgress] = useState(0);', 'const [printProgress, setPrintProgress] = useState(0);\n  const [loadingPayment, setLoadingPayment] = useState(false);')

# Replace handleContinueToPayment with handlePayment
handle_payment_code = """  const handlePayment = async () => {
    if (!sessionId) return;
    setLoadingPayment(true);

    try {
      const apiProto = window.location.protocol;
      const apiHost = window.location.hostname;
      const apiUrl = `${apiProto}//${apiHost}:3001`;

      const pricePerPage = colorMode === "color" ? priceColor : priceBw;
      const totalAmount = copies * estimatedPages * pricePerPage + 1000;

      const paymentData: any = {
        sessionId,
        amount: totalAmount,
        colorMode,
        copies,
        pageCount: estimatedPages,
      };

      const { data } = await axios.post(
        `${apiUrl}/api/order/token`,
        paymentData,
      );

      // Save settings to LS
      localStorage.setItem("oneprint_amount", totalAmount.toString());
      localStorage.setItem("oneprint_session", sessionId || "");
      localStorage.setItem(
        "oneprint_settings",
        JSON.stringify({ copies, pageRange, estimatedPages, colorMode }),
      );

      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          console.log("Payment Success:", result);
          await axios.post(`${apiUrl}/api/order/complete`, {
            sessionId,
            orderId: data.orderId,
          });
          setState("printing");
        },
        onPending: function (result: any) {
          console.log("Payment Pending:", result);
          setLoadingPayment(false);
        },
        onError: function (result: any) {
          console.log("Payment Error:", result);
          setLoadingPayment(false);
        },
        onClose: function () {
          console.log("Payment Modal Closed");
          setLoadingPayment(false);
        },
      });
    } catch (error: any) {
      console.error("Payment Init Failed", error);
      alert(
        "Failed to initialize payment: " +
          (error.response?.data?.message || error.message),
      );
      setLoadingPayment(false);
    }
  };"""

content = re.sub(r'const handleContinueToPayment = \(\) => \{.+?router\.push\("/payment"\);\n  \};', handle_payment_code, content, flags=re.DOTALL)

# Now replace the return statement with the new wireframe-accurate UI
new_return = """  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900 relative">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      {/* Idle Timer for Kiosk - Only when uploaded/configured */}
      {(state === "uploaded" || state === "configured") && (
        <IdleTimer timeoutSeconds={60} onTimeout={confirmReset} />
      )}

      {/* Header */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          E-Print Service
        </h1>
        <p className="text-sm text-gray-600">
          Universitas Pamulang Serang
        </p>
      </div>

      {(state === "uploaded" || state === "configured") && (
        <div className="absolute top-8 right-8 z-10 flex gap-4">
          <div className="border border-black rounded-full px-6 py-2 text-sm font-medium flex items-center justify-center bg-gray-100">
             Auto Close in 0:59
          </div>
          <button
            onClick={handleReset}
            className="border border-black rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-100 transition"
          >
            Cancel / Reset
          </button>
        </div>
      )}

      {/* Service Offline Overlay */}
      {!printersAvailable && (
        <div className="fixed inset-0 bg-white/95 z-50 flex items-center justify-center p-8 backdrop-blur-sm pointer-events-auto">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold text-black mb-4">
              Service Offline
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Maaf, saat ini tidak ada printer yang tersedia. Silakan hubungi petugas.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="border border-black hover:bg-black hover:text-white font-medium py-3 px-8 rounded-full transition-all"
            >
              Coba Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex pt-28 pb-10">
        {state === "waiting" && sessionId && (
          <div className="w-full flex">
            {/* Left: Tata Cara */}
            <div className="w-1/2 flex flex-col justify-center p-16 border-r border-black relative">
              <div className="max-w-md mx-auto w-full">
                <h2 className="text-2xl font-bold text-black mb-2">Tata Cara Print Dokumen.</h2>
                <p className="text-sm text-gray-600 mb-12">Ikuti langkah berikut untuk mulai mencetak dokumen Anda!</p>

                <div className="space-y-10">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black mb-1">Scan QR Code</h3>
                      <p className="text-sm text-gray-600">Gunakan ponsel Anda untuk scan kode disebelah kanan.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black mb-1">Upload File</h3>
                      <p className="text-sm text-gray-600">Pilih dan upload dokumen Anda dalam format PDF.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h.01M11 15h2"/></svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-black mb-1">Bayar & Print</h3>
                      <p className="text-sm text-gray-600">Atur jumlah copy, lakukan pembayaran, dan ambil hasil print.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 left-0 w-full text-center">
                 <p className="text-sm text-gray-600">©2026 E-Print Service | All Rights Reserved.</p>
              </div>
            </div>

            {/* Right: QR Section */}
            <div className="w-1/2 flex flex-col items-center justify-center p-16 relative">
              <h2 className="text-2xl font-bold text-black mb-2">Scan untuk Memulai</h2>
              <p className="text-sm text-gray-600 mb-10">Siap nge-print? Scan QR Code dibawah ini.</p>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm inline-block mb-10">
                <QRCodeSVG value={qrUrl} size={280} level="H" />
              </div>
              
              {expiresAt && (
                <div className="border border-black rounded-full px-6 py-2 text-sm text-black">
                  QR Code berakhir dalam <CountdownTimer targetDate={expiresAt} onExpire={() => window.location.reload()} />
                </div>
              )}
            </div>
          </div>
        )}

        {state === "uploaded" && (
          <div className="w-full flex flex-col items-center px-8 relative">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-black mb-2">Konfigurasi Cetak Detail</h2>
              <p className="text-sm text-gray-600">Sesuaikan dokumen Anda sebelum masuk ke proses pembayaran.</p>
            </div>

            <div className="w-full max-w-6xl flex gap-6 pb-20">
              {/* Left: Preview */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-black mb-4">File Preview</h3>
                <div className="flex-1 bg-gray-50 border border-gray-300 relative min-h-[500px] overflow-hidden">
                  {filePath && fileName?.endsWith(".pdf") ? (
                    <iframe
                      src={`http://${window.location.hostname}:3001${encodeURI(filePath)}#view=Fit`}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                  ) : filePath ? (
                    <img
                      src={`http://${window.location.hostname}:3001${encodeURI(filePath)}`}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Preview Available
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    {fileName}
                  </span>
                  <span>({pageCount} pages terdeteksi)</span>
                </div>
              </div>

              {/* Right: Settings */}
              <div className="w-[500px] flex flex-col gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-black mb-6">Print Settings</h3>
                  
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-black block mb-2">Copies</label>
                      <div className="flex border border-black rounded-md overflow-hidden h-12">
                        <button onClick={() => setCopies(Math.max(1, copies - 1))} className="w-12 flex items-center justify-center hover:bg-gray-100 border-r border-black font-medium">-</button>
                        <input
                          type="number"
                          value={copies}
                          onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                          className="flex-1 text-center font-bold text-base outline-none text-black"
                        />
                        <button onClick={() => setCopies(copies + 1)} className="w-12 flex items-center justify-center hover:bg-gray-100 border-l border-black font-medium">+</button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-black block mb-2">Pages to Print</label>
                      <input
                        type="number"
                        value={estimatedPages}
                        onChange={(e) => setEstimatedPages(parseInt(e.target.value) || 1)}
                        disabled={pageRange.trim().length > 0 && pageRange !== "all"}
                        className={`w-full h-12 border border-black rounded-md px-4 font-bold outline-none text-black ${pageRange.trim().length > 0 && pageRange !== "all" ? "bg-gray-100 text-gray-500" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-bold text-black block mb-2">Warna Cetak</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setColorMode("bw")} 
                          className={`flex-1 flex items-center gap-2 border border-black rounded-md px-3 h-12 text-sm font-bold ${colorMode === "bw" ? "bg-gray-100" : "bg-white"}`}
                        >
                          <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                             {colorMode === "bw" && <div className="w-2 h-2 bg-black rounded-full" />}
                          </div>
                          B&W
                        </button>
                        <button 
                          onClick={() => setColorMode("color")} 
                          className={`flex-1 flex items-center gap-2 border border-black rounded-md px-3 h-12 text-sm font-bold ${colorMode === "color" ? "bg-gray-100" : "bg-white"}`}
                        >
                          <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                             {colorMode === "color" && <div className="w-2 h-2 bg-black rounded-full" />}
                          </div>
                          Warna
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-bold text-black block mb-2">Page Range (Opsional)</label>
                      <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder="All"
                        className="w-full h-12 border border-black rounded-md px-4 py-2 font-bold outline-none text-black placeholder-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-black mb-6">Ringkasan Biaya</h3>
                  
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Jumlah Lembar Cetak ({estimatedPages}x)</span>
                      <span>Rp {(estimatedPages * (colorMode === "color" ? priceColor : priceBw)).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Copies Cetak ({copies}x)</span>
                      <span>Rp {((copies - 1) * estimatedPages * (colorMode === "color" ? priceColor : priceBw)).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Biaya Layanan</span>
                      <span>Rp 1.000</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-black pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Total Pembayaran</div>
                      <div className="text-xl font-bold text-black">
                        Rp {(copies * estimatedPages * (colorMode === "color" ? priceColor : priceBw) + 1000).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <button
                      onClick={handlePayment}
                      disabled={loadingPayment}
                      className="border border-black rounded-full px-6 py-2 h-12 font-bold text-black hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {loadingPayment ? "Processing..." : "Lanjut Pembayaran"}
                      {!loadingPayment && <span>→</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-10 left-0 w-full text-center">
              <p className="text-sm text-gray-600">© 2026 E-Print Service | All Rights Reserved.</p>
            </div>
          </div>
        )}

        {state === "printing" && (
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
        )}

        {/* Custom Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center border border-black">
              <h3 className="text-xl font-bold text-black mb-2">Reset Session?</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to cancel? This will clear all uploaded files and settings.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2 rounded-full border border-black font-medium text-black hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={confirmReset}
                  className="flex-1 py-2 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-colors"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );"""

content = re.sub(r'  return \(\n    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">.+?  \);\n\}', new_return + "\n}", content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("UI updated.")
