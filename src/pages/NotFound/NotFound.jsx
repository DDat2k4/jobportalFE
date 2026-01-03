import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="wrapper">
        <section>
          <div className="container">
            <div className="error-page padd-top-30 padd-bot-30">
              <h1 className="mrg-top-15 mrg-bot-0 cl-danger font-150 font-bold">404</h1>
              <h2 className="mrg-top-10 mrg-bot-5 funky-font font-40">Page Not Found !</h2>
              <p>Sorry, this page does not exist</p>
              <span>The link you clicked might be corrupted, or the page may have been removed.</span>
              <a href="/" className="btn theme-btn-trans mrg-top-20">Go To Home Page</a>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}