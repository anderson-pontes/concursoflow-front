export function FlashcardsPageStyles() {
  return (
    <style>{`
      @keyframes fc-badge-pulse {
        0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--warning) 50%, transparent); transform: scale(1); }
        50% { box-shadow: 0 0 0 8px transparent; transform: scale(1.05); }
      }
      .fc-badge-pulse { animation: fc-badge-pulse 2.2s ease-in-out infinite; }
      @keyframes fc-check-bounce {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.92; }
      }
      .fc-check-bounce { animation: fc-check-bounce 2s ease-in-out infinite; }
      .fc-deck-card {
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .fc-deck-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
      .fc-review-btn {
        position: relative;
        overflow: hidden;
      }
      .fc-review-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgb(255 255 255 / 0.45) 10%, transparent 10.01%);
        transform: scale(12);
        opacity: 0;
        transition: transform 0.45s, opacity 0.45s;
        pointer-events: none;
      }
      .fc-review-btn:active::after {
        transform: scale(0);
        opacity: 1;
        transition: 0s;
      }
      @keyframes fc-session-check-in {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .fc-session-check-in { animation: fc-session-check-in 400ms ease forwards; }
    `}</style>
  );
}
