import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  getUserProfileByUserId,
  createUserProfile,
  updateUserProfile,
  updateUserProfileBasic,
  deleteUserProfileByUserId,
} from "../../api/userProfileApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./UserProfileEdit.css";
import { useLocation, useParams } from "react-router-dom";
import { uploadImage } from "../../api/uploadApi";

export default function UserProfileEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [profile, setProfile] = useState({
    id: null,
    userId: null,
    name: "",
    avatar: "",
    gender: null,       // 0/1/2
    birthDate: "",      // yyyy-mm-dd
    headline: "",
    note: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const params = useParams();
  const location = useLocation();

  const userIdFromParam = useMemo(() => {
    const raw = params?.id ?? params?.userId ?? null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const userIdFromQuery = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const raw = qs.get("userId");
    const n = raw != null ? Number(raw) : null;
    return n != null && Number.isFinite(n) ? n : null;
  }, [location.search]);

  const userId = useMemo(() => userIdFromParam ?? userIdFromQuery ?? null, [userIdFromParam, userIdFromQuery]);

  // add: hydrate from cached prefill for instant UI
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("prefill_user_profile");
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || cached.userId == null) return;
      if (userId != null && Number(cached.userId) === Number(userId)) {
        const data = cached.data?.data ?? cached.data ?? {};
        if (data && (data.id || data.userId)) {
          setProfile((p) => ({
            ...p,
            id: data.id ?? p.id,
            userId: data.userId ?? userId,
            name: data.name ?? p.name ?? "",
            avatar: data.avatar ?? p.avatar ?? "",
            gender: data.gender ?? p.gender ?? null,
            birthDate: data.birthDate ?? p.birthDate ?? "",
            headline: data.headline ?? p.headline ?? "",
            note: data.note ?? p.note ?? "",
          }));
        } else {
          setProfile((p) => ({ ...p, userId }));
        }
      }
    } catch {}
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      setError("");
      setOk("");
      if (!userId) {
        setError("Missing userId");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getUserProfileByUserId(userId);
        const data = res?.data ?? res;
        if (data && (data.id || data.userId)) {
          setProfile({
            id: data.id ?? null,
            userId: data.userId ?? userId,
            name: data.name ?? "",
            avatar: data.avatar ?? "",
            gender: data.gender ?? null,
            birthDate: data.birthDate ?? "",
            headline: data.headline ?? "",
            note: data.note ?? "",
          });
        } else {
          setProfile((p) => ({ ...p, userId }));
        }
      } catch (e) {
        setProfile((p) => ({ ...p, userId }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    setOk("");
    if (!profile.userId) {
      setError("userId is required");
      return;
    }
    if (!profile.name || !profile.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userId: profile.userId,
        name: profile.name.trim(),
        avatar: profile.avatar || "",
        gender: profile.gender ?? null,
        birthDate: profile.birthDate || "",
        headline: profile.headline || "",
        note: profile.note || "",
      };
      if (profile.id) {
        const res = await updateUserProfile(profile.id, payload);
        const data = res?.data ?? res;
        setProfile((p) => ({ ...p, ...(data || payload) }));
      } else {
        const res = await createUserProfile(payload);
        const data = res?.data ?? res;
        setProfile((p) => ({ ...p, id: data?.id ?? p.id }));
      }
      setOk("Profile saved");
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBasic = async () => {
    setError("");
    setOk("");
    if (!profile.userId) {
      setError("userId is required");
      return;
    }
    if (!profile.name || !profile.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateUserProfileBasic(profile.userId, {
        name: profile.name.trim(),
        avatar: profile.avatar || "",
      });
      setOk("Basic info updated");
    } catch (e) {
      setError(e?.message || "Update basic failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile.userId) return;
    if (!window.confirm("Delete this user profile?")) return;
    setSaving(true);
    setError("");
    setOk("");
    try {
      await deleteUserProfileByUserId(profile.userId);
      setOk("Profile deleted");
      setProfile({ id: null, userId, name: "", avatar: "", gender: null, birthDate: "", headline: "", note: "" });
    } catch (e) {
      setError(e?.message || "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  // add: handle avatar upload
  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setOk("");
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setProfile((p) => ({ ...p, avatar: url || p.avatar }));
      setOk("Avatar uploaded");
    } catch (err) {
      setError(err?.message || "Upload avatar failed");
    } finally {
      setUploadingAvatar(false);
      // reset input so same file can be chosen again
      try { e.target.value = ""; } catch {}
    }
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>User Profile Edit</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> User Profile Edit
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <strong>Profile</strong>
                </div>
                <div className="panel-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  {ok && <div className="alert alert-success">{ok}</div>}
                  <div className="row">
                    <div className="col-md-6">
                      {/* HIDE: User ID field (still used internally) */}
                      {/* <div className="mb-3">
                        <label className="form-label">User ID</label>
                        <input className="form-control" value={profile.userId ?? ""} disabled />
                      </div> */}
                      <input type="hidden" value={profile.userId ?? ""} />
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={profile.name}
                          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>

                      {/* Avatar upload + preview */}
                      <div className="mb-3">
                        <label className="form-label">Avatar</label>
                        <div className="user-profile-avatar-container">
                          <div className="user-profile-avatar-preview">
                            {profile.avatar ? (
                              <img
                                src={profile.avatar}
                                alt="avatar"
                                className="user-profile-avatar-img"
                              />
                            ) : (
                              <span className="user-profile-avatar-placeholder">No Image</span>
                            )}
                          </div>
                          <div>
                            <label className="btn btn-default user-profile-upload-btn">
                              {uploadingAvatar ? "Uploading..." : "Choose File"}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={onAvatarFileChange}
                                className="user-profile-avatar-upload-input"
                                disabled={uploadingAvatar}
                              />
                            </label>
                          </div>
                        </div>
                        <small className="text-muted">Upload an image or paste a direct URL.</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-control"
                          value={profile.gender ?? ""}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              gender: e.target.value === "" ? null : Number(e.target.value),
                            }))
                          }
                        >
                          <option value="">Unknown</option>
                          <option value={0}>Female</option>
                          <option value={1}>Male</option>
                          <option value={2}>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Birth Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={profile.birthDate ?? ""}
                          onChange={(e) => setProfile((p) => ({ ...p, birthDate: e.target.value }))}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Headline</label>
                        <input
                          className="form-control"
                          value={profile.headline}
                          onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Note</label>
                        <textarea
                          className="form-control"
                          rows={5}
                          value={profile.note}
                          onChange={(e) => setProfile((p) => ({ ...p, note: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="panel-footer text-right">
                  <button
                    type="submit"
                    className="btn theme-btn user-profile-save-btn"
                    disabled={loading || saving || uploadingAvatar}
                  >
                    {saving ? "Saving..." : "Save All"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger user-profile-delete-btn"
                    onClick={handleDelete}
                    disabled={loading || saving || uploadingAvatar || !profile.userId}
                  >
                    Delete Profile
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
