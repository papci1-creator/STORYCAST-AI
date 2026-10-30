import React, { useState } from 'react';
import { Smartphone, X, Share, PlusSquare, ExternalLink, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  const buttonClasses =
    variant === 'hero'
      ? 'px-5 py-3.5 rounded-full bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-xs sm:text-sm font-semibold text-cyan-200 flex items-center gap-2 transition whitespace-nowrap shrink-0'
      : 'px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition whitespace-nowrap shrink-0';

  return (
    <>
      <button type="button" onClick={handleInstallClick} className={buttonClasses}>
        <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0d1322] border border-slate-700/80 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 id="pwa-install-title" className="text-base font-bold text-white">
                  Install STORYCAST AI App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>To install STORYCAST AI on your iPhone or iPad home screen:</p>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Share className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      1. Tap the <strong className="text-white">Share</strong> button in your
                      Safari toolbar.
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PlusSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      2. Scroll down and tap{' '}
                      <strong className="text-white">Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  STORYCAST AI is configured as a standalone Progressive Web App with offline
                  caching.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      1. If viewing inside a preview frame, open the app in a full browser tab
                      first.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      2. Click the <strong className="text-white">Install Storycast</strong> icon
                      in your browser&apos;s address bar (Chrome / Edge) or choose{' '}
                      <strong className="text-white">Add to Home Screen</strong> from the browser
                      menu.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Cached studio assets active</span>
    </div>
  );
};
