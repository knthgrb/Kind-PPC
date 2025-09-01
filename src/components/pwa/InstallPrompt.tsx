"use client";
import { useEffect, useState } from "react";

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check for iOS devices OR Safari on macOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMacOS = /Mac/.test(
      (navigator as any).userAgentData?.platform || navigator.userAgent
    );

    setIsIOS(isIOSDevice || (isSafari && isMacOS));

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Check if device is mobile or tablet
    const checkDeviceType = () => {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(
        navigator.userAgent
      );
      const isSmallScreen = window.innerWidth <= 1024; // 1024px is typical tablet breakpoint

      setIsMobileOrTablet(isMobile || isTablet || isSmallScreen);
    };

    // Check on mount
    checkDeviceType();

    // Check on resize
    window.addEventListener("resize", checkDeviceType);

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkDeviceType);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsVisible(false); // Hide after successful install
      }
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleIOSInstall = () => {
    setShowIOSModal(true);
  };

  const closeIOSModal = () => {
    setShowIOSModal(false);
  };

  // Don't show if already installed, not on mobile/tablet, or user closed it
  if (isStandalone || !isMobileOrTablet || !isVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">Install App</h3>
            <p className="text-gray-600 text-xs">
              Add to home screen for quick access
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {isIOS ? (
              <button
                onClick={handleIOSInstall}
                className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                How to Install
              </button>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Add to Home Screen
              </button>
            ) : null}

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close install prompt"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Install on iOS Device
              </h3>
              <button
                onClick={closeIOSModal}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-gray-700 text-sm">
                    Tap the <strong>Share</strong> button{" "}
                    <span className="inline-block w-4 h-4 bg-gray-200 rounded mx-1">
                      ⎋
                    </span>{" "}
                    in your browser's toolbar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-gray-700 text-sm">
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-100 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-gray-700 text-sm">
                    Tap <strong>"Add"</strong> to confirm and install the app
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={closeIOSModal}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InstallPrompt;
