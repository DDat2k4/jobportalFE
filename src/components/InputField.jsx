import React from "react";

export default function InputField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  ...props
}) {
  return (
    <div className="form-group">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        className="form-control"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
