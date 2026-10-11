import type { ReactNode } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./StatusPage.css";

interface StatusPageProps {
  message: ReactNode;
}

// Transient-only now — "Kraunama..." is the only caller left. Anything that
// used to show "Kelionė nerasta."/"Išvykimas nerastas." here renders the
// shared <NotFound /> page instead, so every "not found" case looks the same
// site-wide rather than each page having its own wording.
export default function StatusPage({ message }: StatusPageProps) {
  return (
    <div className="status-page-layout">
      <Header />
      <div className="container page-status">{message}</div>
      <Footer />
    </div>
  );
}
