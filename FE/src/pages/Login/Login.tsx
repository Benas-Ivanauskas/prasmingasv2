import { useState, type FormEvent } from "react";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { login, AuthError } from "../../api/auth";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Nepavyko prisijungti");
    } finally {
      setIsSubmitting(false);
    }
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

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="btn-primary login-submit" disabled={isSubmitting}>
                {isSubmitting ? "Jungiamasi…" : "Prisijungti"}
              </button>
            </form>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
