'use client';

import { useState, useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

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

  // Escape-to-close + focus management + body scroll lock while open.
  useEffect(() => {
    if (!slot) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // Move focus into dialog on open.
    const t = window.setTimeout(() => dialogRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      // Restore focus to the element that triggered the modal.
      previouslyFocused.current?.focus?.();
    };
  }, [slot, onClose]);

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
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Book ${slot.venue.name}`}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line-strong bg-night p-5 pb-8 shadow-2xl focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:border sm:pb-5"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking dialog"
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-timberwolf hover:bg-[rgba(214,213,201,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf/60"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Handle bar (mobile) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(214,213,201,0.2)] sm:hidden" />

        {/* Content */}
        <h3 className="text-lg font-semibold text-timberwolf">
          {slot.venue.name}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
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
              <span className="text-ink-subtle">·</span>
              <span>{slot.courtName}</span>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-[rgba(214,213,201,0.04)] p-3">
          <div>
            <div className="text-sm text-ink-muted">Time</div>
            <div className="text-lg font-semibold text-timberwolf">
              {time} – {endTime}
            </div>
            <div className="text-xs text-ink-muted">{slot.duration} min</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-ink-muted">
              {isDropIn ? 'Per person' : 'Price'}
            </div>
            {slot.price === 0 ? (
              <div className="text-sm font-medium text-ink-muted">
                Price on site
              </div>
            ) : validation?.priceChanged &&
              validation.currentPrice != null &&
              validation.currentPrice > 0 ? (
              <div>
                <span className="text-sm text-ink-subtle line-through">
                  £{(slot.price / 100).toFixed(2)}
                </span>
                <div className="text-2xl font-bold text-[rgb(224,173,98)] tabular-nums">
                  £{(validation.currentPrice / 100).toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-timberwolf">
                £{(slot.price / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Validation warnings */}
        {validation && !validation.available && (
          <div
            role="alert"
            className="mt-3 rounded-lg bg-[rgba(237,106,106,0.1)] p-3 text-sm text-[rgb(237,106,106)]"
          >
            This slot may no longer be available. Try a different time.
          </div>
        )}
        {validation?.priceChanged &&
          validation.currentPrice != null &&
          validation.currentPrice > 0 && (
            <div
              role="status"
              className="mt-3 rounded-lg bg-[rgba(224,173,98,0.1)] p-3 text-sm text-[rgb(224,173,98)]"
            >
              Price has changed since we last checked
            </div>
          )}

        {/* CTA */}
        <button
          onClick={handleBook}
          disabled={
            validating || (validation !== null && !validation.available)
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-timberwolf py-3.5 text-base font-semibold text-night transition-all hover:bg-ash-grey active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-timberwolf focus-visible:ring-offset-2 focus-visible:ring-offset-night shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(0,0,0,0.35)]"
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

        <p className="mt-2 text-center text-[11px] text-ink-subtle">
          You&apos;ll be redirected to {providerConfig.displayName} to complete
          your booking
        </p>
      </div>
    </>
  );
}
