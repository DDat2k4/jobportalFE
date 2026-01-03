import React, { useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { changePassword, logout } from "../../auth/auth";
import "./ChangePassword.css";

export default function ChangePassword() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword(form.oldPassword, form.newPassword);
      setOkMsg(res?.message || "Password changed successfully. Redirecting to login...");
      setTimeout(async () => {
        await logout();
      }, 700);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Change password failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Change Password</h2>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="log-box">
            <form className="log-form" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <InputField
                    label="Current Password"
                    type="password"
                    name="oldPassword"
                    value={form.oldPassword}
                    onChange={handleChange}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="col-md-12 mb-3">
                  <InputField
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Create a new password"
                  />
                </div>
                <div className="col-md-12 mb-3">
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 text-center">
                  <Button type="submit" className="theme-btn btn-m full-width" disabled={loading}>
                    {loading ? "Saving..." : "Change Password"}
                  </Button>
                </div>
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}
              {okMsg && <div className="alert alert-success mt-3">{okMsg}</div>}
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
