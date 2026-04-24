import React, { useRef, useState, useEffect } from "react";
import { createCompany, createCompanyAddress, createCompanySocial } from "../../api/companyApi";
import { uploadSingleFile } from "../../api/uploadApi";
import { getAllIndustries } from "../../api/industryApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./CreateCompany.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const CreateCompany = () => {
  // Toast notification state (corner)
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "info", duration = 3500) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  // Hàm lấy vị trí tự động
  const handleAutoLocation = async () => {
    if (!navigator.geolocation) {
      showToast("Your browser does not support geolocation.", "danger");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Gọi API OpenStreetMap để lấy thông tin địa chỉ từ tọa độ
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();

          const city = data.address.city || data.address.town || data.address.village || "";
          const state = data.address.state || "";
          const country = data.address.country || "";

          setAddressData((prev) => ({
            ...prev,
            city,
            state,
            country,
            address: data.display_name || prev.address,
          }));

          showToast("Location fetched successfully.", "success");
        } catch (error) {
          console.error("Error getting location:", error);
          showToast("Unable to fetch location automatically.", "danger");
        }
      },
      (err) => {
        console.error("Location error:", err);
        showToast("Cannot access your device location.", "danger");
      }
    );
  };

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    ownerName: "",
    logoUrl: "",
    industryId: "",
    establishedYear: "",
    employees: "",
    workingTime: "",
    description: "",
    website: "",
  });

  const [addressData, setAddressData] = useState({
    email: "",
    phone: "",
    landline: "",
    address: "",
    address2: "",
    zipCode: "",
    city: "",
    state: "",
    country: "",
  });

  const [socialList, setSocialList] = useState([
    { platform: "Facebook", url: "" },
    { platform: "X", url: "" },
    { platform: "LinkedIn", url: "" },
    { platform: "Instagram", url: "" },
    { platform: "YouTube", url: "" },
  ]);

  const defaultSocials = [
    { platform: "Facebook", url: "" },
    { platform: "X", url: "" },
    { platform: "LinkedIn", url: "" },
    { platform: "Instagram", url: "" },
    { platform: "YouTube", url: "" },
  ];

  const [logoFile, setLogoFile] = useState(null);
  const [industrys, setindustrys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState(null);
  const toastTimerRef = useRef(null);

  // Lấy token từ localStorage
  const accessToken = localStorage.getItem("accessToken");

  // Load career roles
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const data = await getAllIndustries();
        setindustrys(data);
      } catch (error) {
        console.error("Failed to fetch industries", error);
      }
    };
    fetchIndustries();
  }, []);

  // Handle thay đổi input chung
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle thay đổi địa chỉ
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle thay đổi mạng xã hội
  const handleSocialChange = (index, value) => {
    const updated = [...socialList];
    updated[index].url = value;
    setSocialList(updated);
  };

  const addSocialRow = () => {
    setSocialList((prev) => [...prev, { platform: "", url: "" }]);
  };

  const removeSocialRow = (index) => {
    setSocialList((prev) => prev.filter((_, i) => i !== index));
  };

  // Khi người dùng chọn file logo
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessage("Đang tải lên logo...");
    try {
      const uploaded = await uploadSingleFile(file);
      setFormData((prev) => ({
        ...prev,
        logoUrl: uploaded.url,
      }));
      setMessage("Logo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload logo.");
      showToast("Failed to upload logo.", "danger");
    }
  };

  const showNotice = (text, type = "info", timeout = 3500) => {
    if (!text) return;
    setNotice({ text, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setNotice(null), timeout);
  };

  useEffect(() => () => toastTimerRef.current && clearTimeout(toastTimerRef.current), []);
  const isAddressEmpty = (addr) => {
    if (!addr || typeof addr !== "object") return true;
    return Object.values(addr).every((v) => !String(v ?? "").trim());
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Chuẩn bị payload công ty
      const companyPayload = {
        ...formData,
        industryId: Number(formData.industryId),
        employees: Number(formData.employees),
        establishedYear: Number(formData.establishedYear),
      };
      // Gọi API tạo company
      const companyRes = await createCompany(companyPayload);
      const companyId = companyRes?.data?.id || companyRes?.id;
      if (!companyId) throw new Error("Không lấy được companyId từ API");

      // Gọi API tạo địa chỉ nếu có dữ liệu
      if (!isAddressEmpty(addressData)) {
        await createCompanyAddress({ ...addressData, companyId });
      }

      // Gọi API tạo social links
      for (const social of socialList) {
        if (social.url.trim()) {
          await createCompanySocial({ companyId, platform: social.platform, url: social.url });
        }
      }

      setMessage("Company, address, and social links created successfully!");
      showToast("Company saved successfully.", "success");
      // showNotice("Company saved successfully.", "success");
      console.log("Tạo công ty thành công:", companyId);

      // Reset form để không còn “ghi nhớ” dữ liệu cho lần tạo tiếp theo
      setFormData({
        name: "",
        tagline: "",
        ownerName: "",
        logoUrl: "",
        industryId: "",
        establishedYear: "",
        employees: "",
        workingTime: "",
        description: "",
        website: "",
      });
      setAddressData({
        email: "",
        phone: "",
        landline: "",
        address: "",
        address2: "",
        zipCode: "",
        city: "",
        state: "",
        country: "",
      });
      setSocialList([
        { platform: "Facebook", url: "" },
        { platform: "X", url: "" },
        { platform: "LinkedIn", url: "" },
        { platform: "Instagram", url: "" },
        { platform: "YouTube", url: "" },
      ]);
    } catch (err) {
      console.error("Error:", err);
      setMessage(err.message);
      const msg = typeof err?.response?.data === "string" ? err.response.data : (err?.message || "Có lỗi xảy ra khi tạo công ty.");
      showToast(msg, "danger");
      showNotice(msg, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* Toast (top-right) */}
      <div aria-live="polite" aria-atomic="true" className="cc-toast-container">
        {toast.visible && (
          <div
            className={[
              "cc-toast",
              toast.type === "success"
                ? "cc-toast--success"
                : toast.type === "danger"
                ? "cc-toast--danger"
                : "cc-toast--info",
            ].join(" ")}
          >
            {toast.message}
          </div>
        )}
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} cc-notice`} role="alert">
          <button
            type="button"
            className="close cc-noticeClose"
            aria-label="Close"
            onClick={() => setNotice(null)}
          >
            <span aria-hidden="true">×</span>
          </button>
          {notice.text}
        </div>
      )}

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Create Company</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Create Company
            </p>
          </div>
        </div>
      </div>

      <section className="utf_create_company_area padd-top-80 padd-bot-80">
        <div className="container">
          <form className="c-form" onSubmit={handleSubmit}>
            <div className="box">
              <div className="box-header">
                <h4>Company Information</h4>
              </div>
              <div className="box-body">
                <div className="row">
                  <div className="col-md-6">
                    <label>Company Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Company Name"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Tagline</label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Innovating the Future"
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Owner Name</label>
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Owner Name"
                    />
                  </div>

                  {/* Thêm phần chọn file logo */}
                  <div className="col-md-6">
                    <label>Company Logo</label>
                    <div className="custom-file-upload">
                      <input type="file" accept="image/*" onChange={handleLogoChange} />
                    </div>
                    {formData.logoUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.logoUrl}
                          alt="Logo Preview"
                          className="logo-preview"
                        />
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label>Industry</label>
                    <select
                      name="industryId"
                      value={formData.industryId}
                      onChange={handleChange}
                      className="wide form-control"
                      required
                    >
                      <option value="">-- Select Industry --</option>
                      {industrys.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label>Established Year</label>
                    <input
                      type="number"
                      name="establishedYear"
                      value={formData.establishedYear}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="2025"
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Employees</label>
                    <input
                      type="number"
                      name="employees"
                      value={formData.employees}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="120"
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Working Time</label>
                    <input
                      type="text"
                      name="workingTime"
                      value={formData.workingTime}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Mon - Fri, 8:30 AM - 5:30 PM"
                    />
                  </div>

                  <div className="col-md-6">
                    <label>Website</label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="https://bluemoon.tech"
                    />
                  </div>

                  <div className="col-md-12">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-control height-120 textarea"
                      placeholder="Write about your company..."
                      required
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Address */}
            <div className="box">
              <div className="box-header">
                <h4>Company Address</h4>
              </div>
              <div className="box-body">
                <div className="row">
                  {/* ===== Thông tin liên hệ cơ bản ===== */}
                  <div className="col-md-4 col-sm-6 col-xs-12">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={addressData.email}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Email"
                    />
                  </div>

                  <div className="col-md-4 col-sm-6 col-xs-12">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={addressData.phone}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Phone Number"
                    />
                  </div>

                  <div className="col-md-4 col-sm-6 col-xs-12">
                    <label>Landline</label>
                    <input
                      type="text"
                      name="landline"
                      value={addressData.landline}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Landline"
                    />
                  </div>

                  {/* ===== Địa chỉ chi tiết ===== */}
                  <div className="col-md-4 col-sm-6 col-xs-12">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={addressData.address}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Address"
                    />
                  </div>

                  <div className="col-md-4 col-sm-6 col-xs-12 m-clear">
                    <label>Address 2</label>
                    <input
                      type="text"
                      name="address2"
                      value={addressData.address2}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Address Two"
                    />
                  </div>

                  <div className="col-md-4 col-sm-6 col-xs-12 m-clear">
                    <label>Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={addressData.zipCode}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Zip Code"
                    />
                  </div>

                  {/* ===== City ===== */}
                  <div className="col-md-4 col-sm-6 col-xs-12">
                    <label>City</label>
                    <input
                      type="text"
                      list="cityList"
                      name="city"
                      value={addressData.city}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Enter city"
                    />
                  </div>

                  {/* ===== State ===== */}
                  <div className="col-md-4 col-sm-6 col-xs-12 m-clear">
                    <label>State/Province</label>
                    <input
                      type="text"
                      list="stateList"
                      name="state"
                      value={addressData.state}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Enter state"
                    />
                  </div>

                  {/* ===== Country ===== */}
                  <div className="col-md-4 col-sm-6 col-xs-12 m-clear">
                    <label>Country</label>
                    <input
                      type="text"
                      list="countryList"
                      name="country"
                      value={addressData.country}
                      onChange={handleAddressChange}
                      className="form-control"
                      placeholder="Enter country"
                    />
                  </div>

                  {/* ===== Nút lấy vị trí tự động ===== */}
                  <div className="col-md-12 mb-3">
                    <button
                      type="button"
                      className="btn btn-info btn-sm"
                      onClick={handleAutoLocation}
                    >
                      📍 Lấy vị trí tự động
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Accounts */}
            <div className="box">
              <div className="box-header">
                <h4>Social Accounts</h4>
              </div>
              <div className="box-body">
                <div className="row">
                  {/* Fixed social platforms */}
                  {socialList.slice(0, 5).map((social, idx) => (
                    <div key={idx} className="col-md-4 col-sm-6 col-xs-12">
                      <label>{social.platform}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`https://${social.platform.toLowerCase()}.com/`}
                        value={social.url}
                        onChange={(e) => handleSocialChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                  {/* Additional social links (if any) */}
                  {socialList.length > 5 && (
                    <>
                      {socialList.slice(5).map((social, idx) => (
                        <div key={5 + idx} className="col-md-12 mrg-bot-10">
                          <div className="row">
                            <div className="col-md-4 col-sm-6">
                              <label>Platform</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., TikTok, X"
                                value={social.platform}
                                onChange={(e) => {
                                  const updated = [...socialList];
                                  updated[5 + idx].platform = e.target.value;
                                  setSocialList(updated);
                                }}
                              />
                            </div>
                            <div className="col-md-7 col-sm-5">
                              <label>URL</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="https://..."
                                value={social.url}
                                onChange={(e) => {
                                  const updated = [...socialList];
                                  updated[5 + idx].url = e.target.value;
                                  setSocialList(updated);
                                }}
                              />
                            </div>
                            <div className="col-md-1 col-sm-1 cc-social-remove-col">
                              <div className="company-socialRemove">
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSocialRow(5 + idx)}>
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="col-md-12" style={{ marginTop: socialList.length > 5 ? "10px" : "0" }}>
                    <button type="button" className="btn btn-sm btn-default" onClick={addSocialRow}>
                      + Add Social Link
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button type="submit" className="btn btn-m theme-btn full-width" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
            {message && (
              <div className="text-center mt-3">
                <p>{message}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreateCompany;