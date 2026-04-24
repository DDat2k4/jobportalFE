import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4 col-sm-6 mb-4">
            <a href="/" className="footer-brand jp-brand" title="JobPortal">
              <span className="jp-logo-box">
                <span className="jp-logo-initials">JP</span>
              </span>
              <span className="jp-brand-text">JobPortal</span>
            </a>
            <p className="mt-2 text-muted">
              Find the right job or the right talent faster with JobPortal.
            </p>
            <div className="f-social-box">
              <ul>
                <li><a href="#" aria-label="Facebook"><i className="fa fa-facebook facebook-cl"></i></a></li>
                <li><a href="#" aria-label="Google"><i className="fa fa-google google-plus-cl"></i></a></li>
                <li><a href="#" aria-label="X"><i className="fa fa-twitter twitter-cl"></i></a></li>
                <li><a href="#" aria-label="Instagram"><i className="fa fa-instagram instagram-cl"></i></a></li>
              </ul>
            </div>
          </div>

          <div className="col-md-8 col-sm-6">
            <div className="row">
              <div className="col-md-3 col-sm-6 mb-4">
                <h4>Explore</h4>
                <ul>
                  <li><a href="/browse-jobs"><i className="fa fa-angle-double-right"></i> Browse Jobs</a></li>
                  <li><a href="/browse-industry"><i className="fa fa-angle-double-right"></i> Browse Industries</a></li>
                  <li><a href="/company-list"><i className="fa fa-angle-double-right"></i> Companies</a></li>
                </ul>
              </div>

              <div className="col-md-3 col-sm-6 mb-4">
                <h4>For Employers</h4>
                <ul>
                  <li><a href="/add-job"><i className="fa fa-angle-double-right"></i> Post a Job</a></li>
                  <li><a href="/create-company"><i className="fa fa-angle-double-right"></i> Create Company</a></li>
                  <li><a href="/employer"><i className="fa fa-angle-double-right"></i> Dashboard</a></li>
                </ul>
              </div>

              <div className="col-md-3 col-sm-6 mb-4">
                <h4>For Seekers</h4>
                <ul>
                  <li><a href="/seeker"><i className="fa fa-angle-double-right"></i> Dashboard</a></li>
                  <li><a href="/create-cv"><i className="fa fa-angle-double-right"></i> Create CV</a></li>
                  <li><a href="/cv-list"><i className="fa fa-angle-double-right"></i> My CVs</a></li>
                </ul>
              </div>

              <div className="col-md-3 col-sm-6 mb-4">
                <h4>Account</h4>
                <ul>
                  <li><a href="/login"><i className="fa fa-angle-double-right"></i> Login</a></li>
                  <li><a href="/signup"><i className="fa fa-angle-double-right"></i> Register</a></li>
                  <li><a href="/change-password"><i className="fa fa-angle-double-right"></i> Change Password</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
