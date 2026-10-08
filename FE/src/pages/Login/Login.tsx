import { useState, type FormEvent } from "react";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO(BE): POST /api/auth/login once the auth endpoint exists.
    console.log("TODO(BE): log in", email);
  };

  return (
    <>
      <Header />

      <section className="login-page">
        <div className="container">
          <div className="login-card">
            <h1 className="login-title">Prisijungti</h1>
            <p className="login-subtitle">Sveiki sugrįžę! Įveskite savo prisijungimo duomenis.</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                El. paštas
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label>
                Slaptažodis
                <div className="login-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    aria-label={showPassword ? "Slėpti slaptažodį" : "Rodyti slaptažodį"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
              </label>

              <button type="submit" className="btn-primary login-submit">
                Prisijungti
              </button>
            </form>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
