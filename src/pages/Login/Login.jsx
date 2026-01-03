import React, { useState } from "react";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Header from "../../components/Header";   
import Footer from "../../components/Footer";
import { login } from "../../auth/auth";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.password) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      await login(form.username, form.password);
      window.location.href = "/home";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* Page Title */}
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Login</h2>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="log-box">
            <form className="log-form" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Username"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <InputField
                    label="Password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-12 text-center">
                  <Button type="submit" className="theme-btn btn-m full-width" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </div>

              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </form>
          </div>
        </div>
      </section>

      <Footer />  
    </>
  );
}
