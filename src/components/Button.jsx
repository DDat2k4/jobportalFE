import React from "react";

export default function Button({ children, type = "button", className = "", ...props }) {
  return (
    <button type={type} className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}
