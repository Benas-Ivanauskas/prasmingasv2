import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  adminGetTrip,
  adminSaveTrip,
  createEmptyDeparture,
  createEmptyTrip,
  slugify,
} from "../../api/adminTrips";
import type {
  Departure,
  ProgramDay,
  Review,
  Trip,
  TripCategory,
  TripType,
} from "../../types/trip";
import AdminDepartureEditor from "./AdminDepartureEditor";
import { Field } from "./AdminFormFields";
import RichTextEditor from "../../components/RichText/RichTextEditor";
import AdminImageUpload from "../../components/Admin/AdminImageUpload";
import { patchAt, removeAt } from "./adminFormHelpers";

// /admin/trips/new and /admin/trips/:id share this page — the edit route
// loads the trip first, then mounts the form with it as its initial state.
export default function AdminTripPage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<{ id: string; trip: Trip | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetTrip(id).then((trip) => {
      if (!cancelled) setLoaded({ id, trip: trip ? structuredClone(trip) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return <AdminTripForm key="new" initial={createEmptyTrip()} isNew />;
  if (!loaded || loaded.id !== id) return <p>Kraunama...</p>;
  if (!loaded.trip) {
    return (
      <p>
        Kelionė nerasta. <Link to="/admin">← Atgal į sąrašą</Link>
      </p>
    );
  }
  return <AdminTripForm key={id} initial={loaded.trip} />;
}

function AdminTripForm({ initial, isNew }: { initial: Trip; isNew?: boolean }) {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // Pažymima true, kai admin patvirtino įspėjamąjį pranešimą apie jau
  // parduotos vietos/išvykimo pašalinimą — BE atmestų tokį pašalinimą be
  // šio patvirtinimo (žr. api/adminTrips.ts adminSaveTrip `force` parametrą).
  const [forceSave, setForceSave] = useState(false);

  const set = <K extends keyof Trip>(key: K, value: Trip[K]) =>
    setTrip((prev) => ({ ...prev, [key]: value }));

  const images = trip.images;
  const programDays = trip.programDays ?? [];

  const updateDeparture = (index: number, patch: Partial<Departure>) =>
    set("departures", patchAt(trip.departures, index, patch));

  const departureHasBookings = (d: Departure) =>
    (d.seats ?? []).some((s) => s.status === "HELD" || s.status === "TAKEN") ||
    (d.cabinTypes ?? []).some((c) => c.takenUnits > 0) ||
    (d.flightSeatsTaken ?? 0) > 0;

  const removeDeparture = (index: number) => {
    const departure = trip.departures[index];
    if (departureHasBookings(departure)) {
      const confirmed = window.confirm(
        "Šiame išvykime yra parduotų vietų/bilietų. Pašalinus, susiję užsakymai neteks vietos informacijos (bet PATYS užsakymai nebus automatiškai atšaukti ar grąžinti pinigai). Ar tikrai norite tęsti?",
      );
      if (!confirmed) return;
      setForceSave(true);
    }
    set("departures", removeAt(trip.departures, index));
  };

  const validate = (t: Trip): string[] => {
    const list: string[] = [];
    if (!t.title.trim()) list.push("Įveskite kelionės pavadinimą.");
    if (!t.slug.trim()) list.push("Įveskite adresą (slug).");
    if (!t.destinationCountry.trim()) list.push("Įveskite šalį.");
    if (!t.invoiceName?.trim()) list.push("Įveskite sąskaitų trumpinį (pvz. TAU).");
    if (t.departures.length === 0) list.push("Pridėkite bent vieną išvykimą.");
    t.departures.forEach((d, i) => {
      const n = i + 1;
      if (!d.date) list.push(`Išvykimas #${n}: pasirinkite datą.`);
      if (d.cost <= 0) list.push(`Išvykimas #${n}: nurodykite kainą.`);
      if ((t.tripType === "BUS" || t.tripType === "CRUISE") && !d.seats?.length) {
        list.push(`Išvykimas #${n}: pasirinkite autobuso dydį.`);
      }
      if (t.tripType === "FLIGHT" && !d.flightSeatsTotal) {
        list.push(`Išvykimas #${n}: nurodykite bilietų skaičių.`);
      }
      if (t.tripType === "CRUISE" && !d.cabinTypes?.length) {
        list.push(`Išvykimas #${n}: pridėkite bent vieną kajutės tipą.`);
      }
    });
    return list;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned: Trip = {
      ...trip,
      title: trip.title.trim(),
      slug: trip.slug.trim(),
      filterTags: (trip.filterTags ?? []).map((t) => t.trim()).filter(Boolean),
      images: trip.images
        .filter((img) => img.url.trim())
        .map((img, sortOrder) => ({ ...img, sortOrder })),
      programDays: programDays.map((p, i) => ({ ...p, day: i + 1 })),
    };

    const problems = validate(cleaned);
    if (problems.length > 0) {
      setErrors(problems);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    const error = await adminSaveTrip(cleaned, isNew, forceSave);
    setSaving(false);
    if (error) {
      setErrors([error]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate("/admin");
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="admin-page-head">
        <div>
          <Link to="/admin" className="admin-link">
            ← Visos kelionės
          </Link>
          <h1>{isNew ? "Nauja kelionė" : "Redaguoti kelionę"}</h1>
        </div>
        <div className="admin-head-actions">
          <Link to="/admin" className="admin-btn-ghost">
            Atšaukti
          </Link>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saugoma..." : "Išsaugoti"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="admin-errors" role="alert">
          <strong>Patikrinkite formą:</strong>
          <ul>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="admin-card">
        <h3>Pagrindinė informacija</h3>
        <div className="admin-grid">
          <Field label="Pavadinimas *" wide>
            <input
              value={trip.title}
              onChange={(e) => {
                const title = e.target.value;
                setTrip((prev) => ({
                  ...prev,
                  title,
                  slug: slugTouched ? prev.slug : slugify(title),
                }));
              }}
            />
          </Field>
          <Field label="Adresas (slug) *" hint={`/trips/${trip.slug || "…"}`}>
            <input
              value={trip.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Kelionės tipas *">
            <select value={trip.tripType} onChange={(e) => set("tripType", e.target.value as TripType)}>
              <option value="BUS">Autobusu</option>
              <option value="FLIGHT">Lėktuvu</option>
              <option value="CRUISE">Kruizas</option>
            </select>
          </Field>
          <Field label="Kategorija">
            <select value={trip.category} onChange={(e) => set("category", e.target.value as TripCategory)}>
              <option value="SIGHTSEEING">Pažintinė</option>
              <option value="LEISURE">Poilsinė</option>
            </select>
          </Field>
          <Field label="Šalis *">
            <input value={trip.destinationCountry} onChange={(e) => set("destinationCountry", e.target.value)} />
          </Field>
          <Field label="Sąskaitų trumpinys *" hint="Pvz. TAU, KEN">
            <input value={trip.invoiceName ?? ""} onChange={(e) => set("invoiceName", e.target.value)} />
          </Field>
          <Field label="Ženkliukas (badge)" hint="Pvz. Paskutinė minutė!">
            <input value={trip.badgeTag ?? ""} onChange={(e) => set("badgeTag", e.target.value)} />
          </Field>
          <Field label="Filtrų žymos" hint="Per kablelį: uzsienyje, autobusu, italija">
            <input
              value={(trip.filterTags ?? []).join(",")}
              onChange={(e) => set("filterTags", e.target.value.split(","))}
            />
          </Field>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={trip.isActive ?? true}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Kelionė aktyvi (rodoma svetainėje)
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={trip.isLastMinute ?? false}
              onChange={(e) => set("isLastMinute", e.target.checked)}
            />
            Paskutinės minutės kelionė (raudonas ženkliukas ant kortelės nuotraukos)
          </label>
          <div className="admin-field is-wide">
            <span className="admin-field-label">Trumpas aprašymas</span>
            <RichTextEditor
              minHeight={90}
              value={trip.shortDescription}
              onChange={(html) => set("shortDescription", html)}
            />
          </div>
          <div className="admin-field is-wide">
            <span className="admin-field-label">Pilnas aprašymas</span>
            <RichTextEditor
              minHeight={200}
              value={trip.description}
              onChange={(html) => set("description", html)}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h3>Banner nuotrauka</h3>
        <AdminImageUpload
          images={trip.bannerImage ? [trip.bannerImage] : []}
          onChange={(imgs) => set("bannerImage", imgs[0] ?? null)}
        />
        <p className="admin-field-hint">
          Platus formatas — rodoma kaip kelionės puslapio viršelis. Jei nenustatyta,
          naudojama pagrindinė nuotrauka.
        </p>
      </section>

      <section className="admin-card">
        <h3>Pagrindinė nuotrauka</h3>
        <AdminImageUpload images={images} onChange={(imgs) => set("images", imgs)} multiple />
        <p className="admin-field-hint">
          Rodoma kelionių sąraše, pirkimo lange ir kaip pirma apžvalgos nuotrauka.
        </p>
      </section>

      <section className="admin-card">
        <h3>Programa</h3>
        {programDays.map((p, i) => (
          <div key={i} className="admin-sub-card">
            <div className="admin-sub-head">
              <h4>{i + 1} diena</h4>
              <button
                type="button"
                className="admin-link is-danger"
                onClick={() => set("programDays", removeAt(programDays, i))}
              >
                Pašalinti
              </button>
            </div>
            <div className="admin-grid">
              <Field label="Pavadinimas">
                <input
                  value={p.title}
                  onChange={(e) => set("programDays", patchAt<ProgramDay>(programDays, i, { title: e.target.value }))}
                />
              </Field>
              <div className="admin-field is-wide">
                <span className="admin-field-label">Nuotraukos</span>
                <AdminImageUpload
                  images={
                    p.images ??
                    (p.imageUrl ? [{ url: p.imageUrl, alt: p.imageAlt ?? "", sortOrder: 0 }] : [])
                  }
                  onChange={(imgs) =>
                    set(
                      "programDays",
                      patchAt<ProgramDay>(programDays, i, {
                        images: imgs,
                        imageUrl: undefined,
                        imageAlt: undefined,
                      })
                    )
                  }
                  multiple
                />
              </div>
              <div className="admin-field is-wide">
                <span className="admin-field-label">Aprašymas</span>
                <RichTextEditor
                  minHeight={100}
                  value={p.description}
                  onChange={(html) =>
                    set("programDays", patchAt<ProgramDay>(programDays, i, { description: html }))
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="admin-add"
          onClick={() =>
            set("programDays", [
              ...programDays,
              { day: programDays.length + 1, title: "", description: "" },
            ])
          }
        >
          + Pridėti dieną
        </button>
      </section>

      <section className="admin-card">
        <h3>Kas įskaičiuota</h3>
        <div className="admin-grid">
          <div className="admin-field">
            <span className="admin-field-label">Įskaičiuota</span>
            <RichTextEditor
              minHeight={160}
              value={trip.inclusions}
              onChange={(html) => set("inclusions", html)}
            />
          </div>
          <div className="admin-field">
            <span className="admin-field-label">Neįskaičiuota</span>
            <RichTextEditor
              minHeight={160}
              value={trip.exclusions}
              onChange={(html) => set("exclusions", html)}
            />
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h3>Atmintinė</h3>
        <RichTextEditor
          minHeight={260}
          value={trip.travellerMemo}
          onChange={(html) => set("travellerMemo", html)}
        />
      </section>

      <section className="admin-card">
        <h3>Keliautojų atsiliepimai</h3>
        {(trip.reviews ?? []).map((r, i) => (
          <div key={r.id} className="admin-row">
            <input
              placeholder="Autoriaus vardas"
              value={r.authorName}
              onChange={(e) =>
                set("reviews", patchAt<Review>(trip.reviews ?? [], i, { authorName: e.target.value }))
              }
            />
            <input
              placeholder="Atsiliepimo tekstas"
              value={r.comment}
              onChange={(e) =>
                set("reviews", patchAt<Review>(trip.reviews ?? [], i, { comment: e.target.value }))
              }
            />
            <button
              type="button"
              className="admin-link is-danger"
              onClick={() => set("reviews", removeAt(trip.reviews ?? [], i))}
            >
              Pašalinti
            </button>
          </div>
        ))}
        <button
          type="button"
          className="admin-add"
          onClick={() =>
            set("reviews", [
              ...(trip.reviews ?? []),
              { id: `review-${Date.now()}`, authorName: "", comment: "" },
            ])
          }
        >
          + Pridėti atsiliepimą
        </button>
      </section>

      <section className="admin-card">
        <div className="admin-sub-head">
          <h3>Išvykimai</h3>
        </div>
        {trip.departures.map((d, i) => (
          <AdminDepartureEditor
            key={d.id}
            index={i}
            departure={d}
            tripType={trip.tripType}
            canRemove={trip.departures.length > 1}
            onChange={(patch) => updateDeparture(i, patch)}
            onRemove={() => removeDeparture(i)}
          />
        ))}
        <button
          type="button"
          className="admin-add"
          onClick={() => set("departures", [...trip.departures, createEmptyDeparture()])}
        >
          + Pridėti išvykimą
        </button>
      </section>

      <section className="admin-card">
        <h3>SEO</h3>
        <div className="admin-grid">
          <Field label="SEO pavadinimas">
            <input value={trip.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} />
          </Field>
          <Field label="SEO aprašymas">
            <input value={trip.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
          </Field>
        </div>
      </section>

      <div className="admin-footer-actions">
        <Link to="/admin" className="admin-btn-ghost">
          Atšaukti
        </Link>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saugoma..." : "Išsaugoti"}
        </button>
      </div>
    </form>
  );
}
