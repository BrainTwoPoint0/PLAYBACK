'use client';

import { useState, useEffect } from 'react';
import { CourtSlot, PROVIDER_CONFIG } from '@/lib/playscanner/types';
import { ExternalLinkIcon, XIcon, Loader2Icon } from 'lucide-react';

interface BookingConfirmProps {
  slot: CourtSlot | null;
  onClose: () => void;
  onConversion?: (slot: CourtSlot) => void;
}

export default function BookingConfirm({
  slot,
  onClose,
  onConversion,
}: BookingConfirmProps) {
  const [validating, setValidating] = useState(true); // Start validating immediately
  const [validation, setValidation] = useState<{
    available: boolean;
    currentPrice: number | null;
    priceChanged: boolean;
  } | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  // Pre-validate on modal open
  useEffect(() => {
    if (!slot) return;
    setValidating(true);
    setValidation(null);
    setResolvedUrl(null);

    fetch('/api/playscanner/redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: slot.provider,
        venueName: slot.venue.name,
        venueId: slot.venue.id,
        bookingUrl: slot.bookingUrl,
        price: slot.price,
        currency: slot.currency,
        sport: slot.sport,
        startTime: slot.startTime,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.validation) setValidation(data.validation);
        if (data.bookingUrl) setResolvedUrl(data.bookingUrl);
        setValidating(false);
      })
      .catch(() => setValidating(false));
  }, [slot]);

  if (!slot) return null;

  const providerConfig = PROVIDER_CONFIG[slot.provider] || {
    displayName: slot.provider,
    color: '#888',
  };

  const time = new Date(slot.startTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  // Calculate end time from start + duration (more reliable than raw endTime which can be day boundary)
  const endDt = new Date(
    new Date(slot.startTime).getTime() + slot.duration * 60000
  );
  const endTime = endDt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isDropIn = slot.listingType === 'drop_in';

  const handleBook = () => {
    if (validation && !validation.available) return;
    onConversion?.(slot);
    window.open(resolvedUrl || slot.bookingUrl, '_blank');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-[#0a100d] p-5 pb-8 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:border sm:pb-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-500 transition-colors hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Handle bar (mobile) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

        {/* Content */}
        <h3 className="text-lg font-semibold text-white">{slot.venue.name}</h3>

        <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
          <span
            className="inline-flex items-center gap-1"
            style={{ color: providerConfig.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: providerConfig.color }}
            />
            {providerConfig.displayName}
          </span>
          {slot.courtName && (
            <>
              <span className="text-gray-600">·</span>
              <span>{slot.courtName}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.04] p-3">
          <div>
            <div className="text-sm text-gray-400">Time</div>
            <div className="text-lg font-semibold text-white">
              {time} – {endTime}
            </div>
            <div className="text-xs text-gray-500">{slot.duration} min</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {isDropIn ? 'Per person' : 'Price'}
            </div>
            {slot.price === 0 ? (
              <div className="text-sm font-medium text-gray-400">
                Price on site
              </div>
            ) : validation?.priceChanged &&
              validation.currentPrice != null &&
              validation.currentPrice > 0 ? (
              <div>
                <span className="text-sm text-gray-600 line-through">
                  £{(slot.price / 100).toFixed(2)}
                </span>
                <div className="text-2xl font-bold text-amber-400">
                  £{(validation.currentPrice / 100).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-[#00FF88]">
                £{(slot.price / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Validation warnings */}
        {validation && !validation.available && (
          <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            This slot may no longer be available. Try a different time.
          </div>
        )}
        {validation?.priceChanged &&
          validation.currentPrice != null &&
          validation.currentPrice > 0 && (
            <div className="mt-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-400">
              Price has changed since we last checked
            </div>
          )}

        {/* CTA */}
        <button
          onClick={handleBook}
          disabled={
            validating || (validation !== null && !validation.available)
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00FF88] py-3.5 text-base font-semibold text-[#0a100d] transition-all hover:bg-[#00E077] active:scale-[0.98] disabled:opacity-50"
        >
          {validating ? (
            <>
              <Loader2Icon className="h-5 w-5 animate-spin" />
              Checking availability...
            </>
          ) : validation && !validation.available ? (
            'Unavailable'
          ) : (
            <>
              {isDropIn ? 'Join' : 'Book'} on {providerConfig.displayName}
              <ExternalLinkIcon className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-2 text-center text-[11px] text-gray-600">
          You&apos;ll be redirected to {providerConfig.displayName} to complete
          your booking
        </p>
      </div>
    </>
  );
}
