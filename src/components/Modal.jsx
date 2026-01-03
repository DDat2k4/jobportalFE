import React from "react";

export default function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop" style={{ zIndex: 1050, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog" style={{ margin: "10vh auto", zIndex: 1060 }}>
        <div className="modal-content">
          <button type="button" className="close" onClick={onClose} style={{ position: "absolute", right: 10, top: 10 }}>
            &times;
          </button>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
