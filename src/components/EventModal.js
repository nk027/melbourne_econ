import React, { useEffect, useRef, useCallback } from 'react';
import { getSourceColor } from '../utils/colorUtils';
import { formatDate, formatTime } from '../utils/dateUtils';
import { downloadICS } from '../utils/icsGenerator';

export default function EventModal({ event, onClose }) {
  const colors = getSourceColor(event.source);

  const dialogRef = useRef(null);
  const firstFocusRef = useRef(null);        // initial focus target (Close)
  const lastActiveRef = useRef(null);        // element that opened the modal
  const ignoreClickCloseRef = useRef(false); // differentiate drag/select from real backdrop click

  // Focus management — move focus in, and restore it on unmount
  useEffect(() => {
    lastActiveRef.current = document.activeElement;
    const id = requestAnimationFrame(() => firstFocusRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      // restore focus to the opener
      if (lastActiveRef.current && lastActiveRef.current.focus) {
        lastActiveRef.current.focus();
      }
    };
  }, []);

  // Trap focus with Tab/Shift+Tab
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusables = dialogRef.current?.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  // Backdrop close (mousedown on backdrop + mouseup on backdrop)
  const onBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      ignoreClickCloseRef.current = true; // potential close if mouseup also on backdrop
    }
  };
  const onBackdropMouseUp = (e) => {
    if (ignoreClickCloseRef.current && e.target === e.currentTarget) {
      onClose();
    }
    ignoreClickCloseRef.current = false;
  };

  const createMarkup = (htmlString) => ({ __html: htmlString });

  const startTime = formatTime(event.start);
  const endTime = event.end ? formatTime(event.end) : null;
  const isAllDay = startTime === '00:00' && (!endTime || endTime === '00:00');
  const displayTime = isAllDay ? 'All Day' : `${startTime}${endTime ? `–${endTime}` : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      aria-describedby="event-modal-body"
      onMouseDown={onBackdropMouseDown}
      onMouseUp={onBackdropMouseUp}
    >
      <div
        ref={dialogRef}
        onKeyDown={onKeyDown}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col outline-none"
      >
        <div className={`p-4 sm:p-6 border-l-8 ${colors.border} overflow-y-auto`}>
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <h2 id="event-modal-title" className="text-xl font-bold text-gray-800 flex-1 pr-4">
              {event.summary}
            </h2>
            <button
              ref={firstFocusRef}
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-4xl leading-none flex-shrink-0 cursor-pointer min-w-[40px] min-h-[40px]"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

          <div id="event-modal-body" className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Source</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadICS(event)}
                  className="inline-block px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-full text-sm cursor-pointer"
                  aria-label="Download this event as an ICS calendar file"
                >
                  Download as ICS
                </button>
                <span className={`inline-block px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-sm`}>
                  {event.source}
                </span>
              </div>
            </div>

            <div>
              <div className="text-gray-800 mb-1">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Date &amp; Time</h3>
                <div>📅 {formatDate(event.start)}</div>
                <div>
                  🕐 {displayTime}
                </div>
              </div>
              {event.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Location</h3>
                  <div className="text-gray-800">📍 {event.location}</div>
                </div>
              )}
            </div>

            {event.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Description</h3>
                <div
                  id="event-modal-body"
                  className="text-xs text-gray-800 whitespace-pre-wrap max-h-[40vh] overflow-y-auto p-3 bg-gray-50 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={0}
                  data-scrollable
                  onKeyDown={(e) => {
                    // If this box can scroll vertically, let scrolling keys bubble *inside* it only.
                    const el = e.currentTarget;
                    const canScroll = el.scrollHeight > el.clientHeight;
                    const k = e.key;

                    if (!canScroll) return; // nothing to do

                    const scrollingKeys = [
                      'ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' ',
                    ];
                    if (scrollingKeys.includes(k)) {
                      // Allow default (so it scrolls), but stop bubbling to window
                      e.stopPropagation();
                    }
                  }}
                  // Consider sanitizing untrusted HTML before injecting:
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
