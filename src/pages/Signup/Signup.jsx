import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import { signup } from "../../auth/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    roleType: "3", // 3 = JOB_SEEKER (mặc định)
  });
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
    if (error) setError("");
  };

  // Đọc role từ query (?roleType=2|3|employer|job_seeker)
  useEffect(() => {
    const roleQ = (searchParams.get("roleType") || searchParams.get("role") || "").toLowerCase();
    if (!roleQ) return;
    let next = "3";
    if (roleQ === "2" || roleQ === "employer") next = "2";
    if (roleQ === "3" || roleQ === "job_seeker" || roleQ === "seeker") next = "3";
    setForm((f) => ({ ...f, roleType: next }));
  }, [searchParams]);

  const setRoleAndUrl = (val) => {
    setForm((f) => ({ ...f, roleType: val }));
    const sp = new URLSearchParams(searchParams);
    sp.set("role", val);
    setSearchParams(sp, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setFieldErrors({});

    if (!form.username || !form.password) {
      setError("Please fill required fields.");
      return;
    }
    if (!["2", "3"].includes(String(form.roleType))) {
      setError("Invalid role selected.");
      return;
    }

    try {
      setLoading(true);
      await signup({
        username: form.username,
        password: form.password,
        email: form.email,
        phone: form.phone,
        roleType: form.roleType,
      });
      setOkMsg("Signup successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const rawMsg =
        err?.response?.data?.message ||
        err?.message ||
        String(err || "");
      let friendly = rawMsg;
      const fe = {};
      if (/users_email_key|duplicate key.*email|email.*exists/i.test(rawMsg)) {
        friendly = "Email already registered.";
        fe.email = "This email is already in use.";
      }
      if (/users_username_key|duplicate key.*username|username.*exists/i.test(rawMsg)) {
        friendly = friendly === rawMsg ? "Username already taken." : friendly;
        fe.username = "This username is already taken.";
      }
      setFieldErrors(fe);
      setError(friendly || "Signup failed.");
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
            <h2>Register</h2>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="log-box">
            {/* Toggle vai trò - segmented control */}
            <div className="text-center role-toggle">
              <div
                className="role-toggle-wrap"
                role="tablist"
                aria-label="Select role"
              >
                <button
                  type="button"
                  onClick={() => setRoleAndUrl("3")}
                  aria-pressed={form.roleType === "3"}
                  className={`role-toggle-btn ${form.roleType === "3" ? "active" : ""}`}
                >
                  Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRoleAndUrl("2")}
                  aria-pressed={form.roleType === "2"}
                  className={`role-toggle-btn ${form.roleType === "2" ? "active" : ""}`}
                >
                  Employer
                </button>
              </div>
            </div>

            <form className="log-form" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Username"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                  />
                  {fieldErrors.username && (
                    <small className="text-danger">{fieldErrors.username}</small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email && (
                    <small className="text-danger">{fieldErrors.email}</small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Phone"
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="012345678"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 text-center">
                  <Button type="submit" className="theme-btn btn-m full-width" disabled={loading}>
                    {loading ? "Signing up..." : "Create Account"}
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