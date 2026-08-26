import React from "react";

export default function TrailerModal({ trailerUrl, title, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div style={{ width: "min(980px, 100%)" }}>
        <div style={{ position: "relative" }}>
          <button className="close-btn" onClick={onClose} aria-label="Close trailer">
            ✕
          </button>
          <div style={{ borderRadius: 12, overflow: "hidden" }}>
            {trailerUrl ? (
              <iframe
                title={`Trailer - ${title}`}
                width="100%"
                height="520"
                src={trailerUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={{ padding: 36, background: "#141416", color: "#cfcfcf" }}>
                Trailer không có sẵn cho phim này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
