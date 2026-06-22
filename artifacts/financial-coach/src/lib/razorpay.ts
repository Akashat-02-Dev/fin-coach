export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if window.Razorpay already exists
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already added in the document to avoid duplicates
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      const handleLoad = () => {
        resolve(true);
        cleanup();
      };
      const handleError = () => {
        resolve(false);
        cleanup();
      };
      const cleanup = () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };

      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
