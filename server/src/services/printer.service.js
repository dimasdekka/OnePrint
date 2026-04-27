const { exec } = require("child_process");
const { print } = require("pdf-to-printer");
const { prisma } = require("../config/database");
const { PRINTER_STATUS, DUMMY_PRINTER } = require("../utils/constants");
const logger = require("../utils/logger");

/**
 * Printer Service
 * Handles printer-related business logic
 */

/**
 * Get printers from OS via PowerShell
 * @returns {Promise<Array>} List of OS printers
 */
const getSystemPrinters = () => {
  return new Promise((resolve, reject) => {
    const command = `powershell "Get-Printer | Select-Object Name, DriverName, PrinterStatus, PortName | ConvertTo-Json"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error("Failed to get system printers", { error: error.message });
        return resolve([]);
      }

      try {
        const printers = JSON.parse(stdout);
        const printerList = Array.isArray(printers) ? printers : [printers];

        logger.info("System printers retrieved", { count: printerList.length });
        resolve(printerList);
      } catch (parseError) {
        logger.error("Failed to parse printer JSON", {
          error: parseError.message,
        });
        resolve([]);
      }
    });
  });
};

/**
 * Get managed printers from database
 * @returns {Promise<Array>} List of managed printers
 */
const getManagedPrinters = async () => {
  const printers = await prisma.printer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      settings: true,
      transactions: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  logger.debug("Managed printers retrieved", { count: printers.length });
  return printers;
};

/**
 * Add printer to management
 * @param {string} name - Printer name
 * @param {string} driver - Printer driver
 * @param {string} description - Printer description (optional)
 * @returns {Promise<Object>} Created printer
 */
const addPrinter = async (name, driver, description = null) => {
  const printer = await prisma.printer.create({
    data: {
      name,
      driver,
      description,
      status: PRINTER_STATUS.ONLINE,
      isConnected: true,
    },
  });

  // Create default printer settings
  await prisma.printerSettings.create({
    data: {
      printerId: printer.id,
      pricePerPageBw: 1500,
      pricePerPageColor: 3000,
    },
  });

  logger.info("Printer added to management", {
    name,
    driver,
    printerId: printer.id,
  });
  return printer;
};

/**
 * Remove printer from management
 * @param {string} id - Printer ID
 * @returns {Promise<void>}
 */
const removePrinter = async (id) => {
  await prisma.printer.delete({
    where: { id },
  });

  logger.info("Printer removed from management", { id });
};

/**
 * Update printer status
 * @param {string} id - Printer ID
 * @param {string} status - New status
 * @param {boolean} isConnected - Connection status
 * @returns {Promise<Object>} Updated printer
 */
const updatePrinterStatus = async (id, status, isConnected) => {
  const printer = await prisma.printer.update({
    where: { id },
    data: { status, isConnected },
  });

  logger.info("Printer status updated", { id, status, isConnected });
  return printer;
};

/**
 * Toggle dummy printer (for testing)
 * @param {string} action - 'add' or 'remove'
 * @returns {Promise<void>}
 */
const toggleDummyPrinter = async (action) => {
  if (action === "add") {
    const existing = await prisma.printer.findUnique({
      where: { name: DUMMY_PRINTER.NAME },
    });

    if (!existing) {
      await prisma.printer.create({
        data: {
          name: DUMMY_PRINTER.NAME,
          driver: DUMMY_PRINTER.DRIVER,
          status: PRINTER_STATUS.ONLINE,
          isConnected: true,
        },
      });
      logger.info("Dummy printer added");
    } else {
      await prisma.printer.update({
        where: { name: DUMMY_PRINTER.NAME },
        data: {
          status: PRINTER_STATUS.ONLINE,
          isConnected: true,
        },
      });
      logger.info("Dummy printer set to online");
    }
  } else if (action === "remove") {
    await prisma.printer.update({
      where: { name: DUMMY_PRINTER.NAME },
      data: {
        status: PRINTER_STATUS.OFFLINE,
        isConnected: false,
      },
    });
    logger.info("Dummy printer set to offline");
  }
};

/**
 * Send document to printer
 * @param {string} printerId - Printer ID
 * @param {string} filePath - Path to file to print
 * @param {number} copies - Number of copies
 * @returns {Promise<boolean>} Success status
 */
const sendToPrinter = async (printerId, filePath, copies = 1) => {
  try {
    // Get printer details
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
    });

    if (!printer) {
      logger.error("Printer not found", { printerId });
      throw new Error("Printer not found");
    }

    if (!printer.isConnected || printer.status !== PRINTER_STATUS.ONLINE) {
      logger.error("Printer not available", {
        printerId,
        status: printer.status,
      });
      throw new Error("Printer is offline");
    }

    logger.debug("Sending to printer via pdf-to-printer", {
      printerName: printer.name,
      filePath,
      copies,
    });

    if (printer.name === DUMMY_PRINTER.NAME) {
      logger.info("Simulating print job for Dummy Printer");
      // Simulate printing time (2s per copy)
      await new Promise((resolve) => setTimeout(resolve, copies * 2000));
      return true;
    }

    // Use pdf-to-printer for reliable printing to a named printer
    await print(filePath, {
      printer: printer.name,
      copies: copies,
    });

    logger.info("Document sent to printer", {
      printerId,
      filePath,
      copies,
      printerName: printer.name,
    });

    return true;
  } catch (error) {
    logger.error("Print job failed", { error: error.message });
    throw error;
  }
};

/**
 * Sync printer status from OS
 * @param {string} printerId - Printer ID
 * @returns {Promise<Object>} Updated printer info
 */
const syncPrinterStatus = async (printerId) => {
  try {
    const printer = await prisma.printer.findUnique({
      where: { id: printerId },
    });

    if (!printer) {
      logger.error("Printer not found", { printerId });
      return null;
    }

    // Skip dummy printer — always keep as-is
    if (printer.name === DUMMY_PRINTER.NAME) {
      return printer;
    }

    // Escape printer name for PowerShell
    const escapedPrinterName = printer.name.replace(/'/g, "''");

    // Use Win32_Printer WMI query — much more accurate than Get-Printer.
    const command = `$p = Get-WmiObject -Class Win32_Printer -Filter "Name='${escapedPrinterName}'" -ErrorAction SilentlyContinue; if ($p) { [PSCustomObject]@{ WorkOffline=$p.WorkOffline; PrinterState=$p.PrinterState; DetectedErrorState=$p.DetectedErrorState } | ConvertTo-Json -Compress } else { '{}' }`;

    return new Promise((resolve) => {
      exec(
        command,
        { shell: "powershell.exe", maxBuffer: 1024 * 1024, timeout: 5000 },
        async (error, stdout, stderr) => {
          try {
            if (
              error ||
              !stdout ||
              stdout.trim() === "" ||
              stdout.trim() === "{}"
            ) {
            logger.warn(
              "Could not get printer status from WMI, marking offline",
              {
                printerId,
                printerName: printer.name,
                error: error ? error.message : "No output",
              },
            );
            const updated = await updatePrinterStatus(
              printerId,
              PRINTER_STATUS.OFFLINE,
              false,
            );
            return resolve(updated);
          }

          try {
            const result = JSON.parse(stdout.trim());

            // WorkOffline = true → definitely offline
            const workOffline = result.WorkOffline === true;

            // PrinterState bit 4096 → offline flag
            const stateOffline = (result.PrinterState & 4096) !== 0;

            // Error state: 0=Unknown, 1=Other, 2=No Error
            // Values >2 indicate some kind of error
            const hasError =
              result.DetectedErrorState !== undefined &&
              result.DetectedErrorState !== 0 &&
              result.DetectedErrorState !== 1 &&
              result.DetectedErrorState !== 2;

            const isOnline = !workOffline && !stateOffline && !hasError;
            const status = isOnline
              ? PRINTER_STATUS.ONLINE
              : PRINTER_STATUS.OFFLINE;

            const updated = await updatePrinterStatus(
              printerId,
              status,
              isOnline,
            );

            logger.info("Printer status synced via WMI", {
              printerId,
              printerName: printer.name,
              newStatus: status,
            });

            resolve(updated);
          } catch (parseError) {
            logger.warn("Failed to parse WMI printer status, marking offline", {
              printerId,
              parseError: parseError.message,
            });

            const updated = await updatePrinterStatus(
              printerId,
              PRINTER_STATUS.OFFLINE,
              false,
            );
            resolve(updated);
          }
          } catch (fatalError) {
            logger.error("Fatal error inside sync callback", { error: fatalError.message });
            resolve(null);
        }
        },
      );
    });
  } catch (error) {
    logger.error("Sync printer status failed", { error: error.message });
    return null;
  }
};

/**
 * Start printer status monitor
 * @param {number} intervalMs - Check interval in milliseconds
 * @param {Server|null} io - Socket.IO server instance (for real-time updates)
 */
const startPrinterMonitor = (intervalMs = 30000, io = null) => {
  let isRunning = false;

  const monitor = setInterval(async () => {
    if (isRunning) {
      logger.warn("Printer monitor skipped (previous cycle still running)");
      return;
    }
    
    isRunning = true;
    try {
      const printers = await prisma.printer.findMany();
      let anyChanged = false;

      for (const printer of printers) {
        const previousStatus = printer.status;
        const updated = await syncPrinterStatus(printer.id);

        // Emit socket event if status changed so admin UI updates immediately
        if (updated && updated.status !== previousStatus) {
          anyChanged = true;
          logger.info("Printer status changed, notifying clients", {
            printerName: printer.name,
            from: previousStatus,
            to: updated.status,
          });
        }
      }

      // Emit a single printer_update event if anything changed
      if (anyChanged && io) {
        io.emit("printer_update");
      }

      logger.debug("Printer monitor cycle completed", {
        printerCount: printers.length,
      });
    } catch (error) {
      logger.error("Printer monitor error", { error: error.message });
    } finally {
      isRunning = false;
    }
  }, intervalMs);

  return monitor;
};

/**
 * Get revenue reports
 * @param {number} limit - Number of records to fetch
 * @param {Date|null} from - Start date filter
 * @param {Date|null} to - End date filter
 * @returns {Promise<Array>} Report data
 */
const getReports = async (limit = 50, from = null, to = null) => {
  const where = {
    OR: [
      { status: { in: ["completed", "printing"] } },
      { transactions: { some: { paymentStatus: "paid" } } },
    ],
  };

  if (from || to) {
    where.updatedAt = {};
    if (from) where.updatedAt.gte = from;
    if (to) where.updatedAt.lte = to;
  }

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          printer: { select: { id: true, name: true } },
        },
      },
      user: { select: { id: true, username: true } },
      file: true,
    },
  });

  const settings = await prisma.printerSettings.findFirst();
  const basePriceBw = settings?.pricePerPageBw
    ? Number(settings.pricePerPageBw)
    : 1500;
  const basePriceColor = settings?.pricePerPageColor
    ? Number(settings.pricePerPageColor)
    : 3000;

  const reports = sessions.map((s) => {
    const tx = s.transactions?.[0];
    const pricePerPage = s.colorMode === "color" ? basePriceColor : basePriceBw;
    return {
      id: s.id,
      date:
        new Date(s.updatedAt).toLocaleDateString("id-ID") +
        " " +
        new Date(s.updatedAt).toLocaleTimeString("id-ID"),
      filename: s.file?.filename || "Unknown",
      pages: s.file?.totalPages || s.pageCount || 1,
      copies: s.copies || 1,
      colorMode: s.colorMode || "bw",
      printerName: tx?.printer?.name || "Unknown",
      printerId: tx?.printer?.id || null,
      amount: tx?.amount || (s.pageCount || 1) * (s.copies || 1) * pricePerPage,
      paymentStatus: tx?.paymentStatus || "pending",
      paidAt: tx?.paidAt ? new Date(tx.paidAt).toLocaleString("id-ID") : null,
      username: s.user?.username || "Guest",
      status: tx?.paymentStatus === "paid" ? "Success" : "Pending",
    };
  });

  logger.debug("Reports generated", { count: reports.length });
  return reports;
};

/**
 * Get revenue summary for admin dashboard
 * @returns {Promise<Object>} Summary stats and daily chart data
 */
const getReportsSummary = async () => {
  // All completed/printing sessions or sessions with paid transactions
  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { status: { in: ["completed", "printing"] } },
        { transactions: { some: { paymentStatus: "paid" } } },
      ],
    },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 1 },
      file: true,
    },
  });

  const settings = await prisma.printerSettings.findFirst();
  const basePriceBw = settings?.pricePerPageBw
    ? Number(settings.pricePerPageBw)
    : 1500;
  const basePriceColor = settings?.pricePerPageColor
    ? Number(settings.pricePerPageColor)
    : 3000;

  let totalRevenue = 0;
  let totalPages = 0;

  sessions.forEach((s) => {
    const tx = s.transactions?.[0];
    const pricePerPage = s.colorMode === "color" ? basePriceColor : basePriceBw;
    totalRevenue +=
      tx?.amount ||
      (s.file?.totalPages || s.pageCount || 1) * (s.copies || 1) * pricePerPage;
    totalPages += (s.file?.totalPages || s.pageCount || 1) * (s.copies || 1);
  });

  // Daily revenue for last 7 days
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const daySessions = sessions.filter((s) => {
      const d = new Date(s.updatedAt);
      return d >= dayStart && d <= dayEnd;
    });

    let dayTotal = 0;
    daySessions.forEach((s) => {
      const dx = s.transactions?.[0];
      const pagePrice = s.colorMode === "color" ? basePriceColor : basePriceBw;
      dayTotal +=
        dx?.amount ||
        (s.file?.totalPages || s.pageCount || 1) * (s.copies || 1) * pagePrice;
    });

    dailyRevenue.push({
      date: dayStart.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      revenue: dayTotal,
      count: daySessions.length,
    });
  }

  return {
    totalRevenue,
    totalTransactions: sessions.length,
    totalPages,
    avgRevenue:
      sessions.length > 0 ? Math.round(totalRevenue / sessions.length) : 0,
    dailyRevenue,
  };
};

/**
 * Delete a report session (and cascade transactions via FK)
 * @param {string} sessionId - Session ID to delete
 */
const deleteReport = async (sessionId) => {
  // Delete transactions first (foreign key constraint)
  await prisma.transaction.deleteMany({ where: { sessionId } });
  await prisma.session.delete({ where: { id: sessionId } });
  logger.info("Report deleted", { sessionId });
};

module.exports = {
  getSystemPrinters,
  getManagedPrinters,
  addPrinter,
  removePrinter,
  updatePrinterStatus,
  toggleDummyPrinter,
  sendToPrinter,
  syncPrinterStatus,
  startPrinterMonitor,
  getReports,
  getReportsSummary,
  deleteReport,
};
