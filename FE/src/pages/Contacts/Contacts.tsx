import { useState, type FormEvent } from "react";
import {
  IoCallOutline,
  IoMailOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./Contacts.css";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY_FORM: ContactFormData = { name: "", email: "", phone: "", message: "" };

export default function Contacts() {
  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitted(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm(EMPTY_FORM);
  };

  return (
    <>
      <Header />

      <section className="contacts-page">
        <div className="container">
          <div className="contacts-card">
            <h1 className="contacts-title">
              Jeigu turite daugiau klausimų, susisiekite su mumis!
            </h1>

            <div className="contacts-grid">
              <form className="contacts-form" onSubmit={handleSubmit}>
                <label>
                  Vardas *
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </label>

                <label>
                  El. paštas *
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </label>

                <label>
                  Telefonas
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </label>

                <label>
                  Žinutė *
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                  />
                </label>

                <button type="submit" className="btn-primary contacts-submit">
                  Siųsti žinutę
                </button>

                {submitted && (
                  <p className="contacts-success">
                    <IoCheckmarkCircleOutline aria-hidden="true" />
                    Ačiū! Jūsų žinutė išsiųsta — netrukus su jumis susisieksime.
                  </p>
                )}
              </form>

              <div className="contacts-info">
                <h2 className="contacts-info-title">Kontaktinė informacija</h2>

                <div className="contacts-info-row">
                  <IoCallOutline aria-hidden="true" />
                  <div>
                    <span className="contacts-info-label">Telefonas</span>
                    <a href="tel:+37065955770" className="contacts-info-value">
                      (+370) 659 55770
                    </a>
                  </div>
                </div>

                <div className="contacts-info-row">
                  <IoMailOutline aria-hidden="true" />
                  <div>
                    <span className="contacts-info-label">El. paštas</span>
                    <a href="mailto:info@prasmingas.lt" className="contacts-info-value">
                      info@prasmingas.lt
                    </a>
                  </div>
                </div>

                <div className="contacts-info-row">
                  <IoTimeOutline aria-hidden="true" />
                  <div>
                    <span className="contacts-info-label">Darbo laikas</span>
                    <span className="contacts-info-value">I–V 10:00–14:00</span>
                    <span className="contacts-info-value contacts-info-muted">
                      VI–VII – nedirbame
                    </span>
                  </div>
                </div>

                <h2 className="contacts-info-title contacts-info-title-spaced">Rekvizitai</h2>

                <div className="contacts-meta-row">
                  <span className="contacts-info-label">Įmonės pavadinimas</span>
                  <span className="contacts-info-value">VšĮ &quot;Prasmingam gyvenimui&quot;</span>
                </div>

                <div className="contacts-meta-row">
                  <span className="contacts-info-label">Įmonės kodas</span>
                  <span className="contacts-info-value">305809635</span>
                </div>

                <div className="contacts-meta-row">
                  <span className="contacts-info-label">Adresas</span>
                  <span className="contacts-info-value">
                    Vytauto g. 131-4, Garliava, LT-53210 Kauno r.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
