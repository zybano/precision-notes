const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

let loaderPromise: Promise<any> | null = null;

export async function loadXlsx() {
  if (typeof window === "undefined") {
    throw new Error("XLSX can only be loaded in the browser");
  }

  if (window.XLSX) {
    return window.XLSX;
  }

  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = XLSX_CDN;
      script.async = true;
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error("Failed to load XLSX library"));
      document.head.appendChild(script);
    });
  }

  const XLSX = await loaderPromise;
  if (!XLSX) {
    throw new Error("XLSX library not available");
  }

  return XLSX;
}
