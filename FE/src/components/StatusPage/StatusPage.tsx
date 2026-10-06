import type { ReactNode } from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import "./StatusPage.css";

interface StatusPageProps {
  message: ReactNode;
}

// The "Kraunama...", "Kelionė nerasta.", "Išvykimas nerastas." (and similar)
// full-page fallbacks — every page that resolves a trip/departure from the
// URL used to repeat this same Header+message+Footer shell.
export default function StatusPage({ message }: StatusPageProps) {
  return (
    <>
      <Header />
      <div className="container page-status">{message}</div>
      <Footer />
    </>
  );
}
