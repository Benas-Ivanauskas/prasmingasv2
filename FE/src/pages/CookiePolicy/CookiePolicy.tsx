import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { LEGAL_LINKS } from "../../constants/legalLinks";
import "./CookiePolicy.css";

// Atskira "Slapukų politika" — privatumo politikoje (žr. BE/assets/documents/static/
// privatumo-politika.pdf, 6 ir 13 psl.) kelis kartus nurodoma nuoroda
// https://www.prasmingas.lt/slapuku-politika/, bet pati PDF versija slapukų
// nedetalizuoja. Ši svetainės kopija papildo tą nuorodą realiu turiniu, remiantis
// tomis pačiomis įmonės rekvizitais ir tikslais, nurodytais privatumo politikoje
// (žr. legalLinks.ts::privacyPolicy).
export default function CookiePolicy() {
  return (
    <>
      <Header />

      <section className="cookie-page">
        <div className="container cookie-container">
          <h1>Slapukų politika</h1>

          <p>
            Ši slapukų politika paaiškina, kaip VšĮ „Prasmingam gyvenimui“, juridinio asmens kodas 305809635,
            registracijos adresas Vytauto g. 131-4, Garliava, LT-53210 Kauno r. (toliau – mes arba Bendrovė),
            naudoja slapukus ir panašias technologijas interneto svetainėje www.prasmingas.lt (toliau –
            Svetainė). Ši politika papildo mūsų{" "}
            <a href={LEGAL_LINKS.privacyPolicy} target="_blank" rel="noopener noreferrer">
              Privatumo politiką
            </a>{" "}
            ir turėtų būti skaitoma kartu su ja.
          </p>

          <h2>1. Kas yra slapukai?</h2>
          <p>
            Slapukai (angl. cookies) yra nedideli tekstiniai failai, kuriuos interneto svetainė išsaugo Jūsų
            įrenginyje (kompiuteryje, telefone ar planšetėje), kai ją lankotės. Slapukai padeda svetainei
            atpažinti Jūsų įrenginį, įsiminti Jūsų pasirinkimus ir pagerinti naudojimosi svetaine patirtį.
          </p>

          <h2>2. Kodėl naudojame slapukus?</h2>
          <p>Slapukus naudojame šiais tikslais:</p>
          <ul>
            <li>užtikrinti tinkamą ir saugų Svetainės veikimą;</li>
            <li>prisiminti Jūsų nustatymus ir pasirinkimus naršant Svetainėje;</li>
            <li>analizuoti, kaip lankytojai naudojasi Svetaine, ir taip gerinti jos funkcionalumą bei turinį;</li>
            <li>
              kai duodate sutikimą – rodyti Jums aktualesnę rinkodaros informaciją bei įvertinti mūsų
              socialinių tinklų paskyrų ir reklamos efektyvumą.
            </li>
          </ul>

          <h2>3. Kokius slapukus naudojame?</h2>
          <table>
            <thead>
              <tr>
                <th>Kategorija</th>
                <th>Paskirtis</th>
                <th>Sutikimas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Būtinieji (techniniai)</td>
                <td>
                  Užtikrina pagrindinių Svetainės funkcijų veikimą (pvz., puslapių naršymą, užsakymo proceso
                  žingsnių išsaugojimą). Be šių slapukų Svetainė negalėtų tinkamai veikti.
                </td>
                <td>Nereikalingas</td>
              </tr>
              <tr>
                <td>Analitiniai</td>
                <td>
                  Padeda suprasti, kaip lankytojai naudojasi Svetaine (pvz., „Google Analytics“) – kiek
                  žmonių apsilanko, kurie puslapiai populiariausi, kaip ilgai naršoma. Duomenys renkami
                  apibendrinta, tiesiogiai Jūsų tapatybės nenustatančia forma.
                </td>
                <td>Reikalingas</td>
              </tr>
              <tr>
                <td>Rinkodaros ir socialinių tinklų</td>
                <td>
                  Naudojami trečiųjų šalių įrankių (pvz., „Facebook“, „LinkedIn“), kad galėtume rodyti Jums
                  aktualius pasiūlymus bei įvertinti mūsų skelbimų ir publikacijų socialiniuose tinkluose
                  efektyvumą.
                </td>
                <td>Reikalingas</td>
              </tr>
            </tbody>
          </table>
          <p>
            Analitinius ir rinkodaros slapukus naudojame tik gavę Jūsų sutikimą, kurį galite bet kada atšaukti
            pakeisdami naršyklės nustatymus arba ištrindami jau įrašytus slapukus.
          </p>

          <h2>4. Trečiųjų šalių slapukai</h2>
          <p>
            Dalis slapukų Svetainėje gali būti nustatomi ne mūsų, o mūsų pasitelkiamų trečiųjų šalių įrankių
            (pvz., „Google Analytics“, „Facebook“, „LinkedIn“). Tokių slapukų naudojimui taikomos atitinkamų
            trečiųjų šalių privatumo ir slapukų nuostatos – rekomenduojame su jomis susipažinti atskirai.
            Bendrovė neatsako už informaciją, kurią renka šios trečiosios šalys.
          </p>

          <h2>5. Kiek laiko saugomi slapukai?</h2>
          <p>
            Priklausomai nuo paskirties, slapukai gali būti:
          </p>
          <ul>
            <li>
              <strong>Sesijos slapukai</strong> – galioja tik Jūsų naršymo Svetainėje metu ir ištrinami uždarius
              naršyklę;
            </li>
            <li>
              <strong>Nuolatiniai slapukai</strong> – išlieka Jūsų įrenginyje nustatytą laikotarpį (nuo kelių
              dienų iki kelerių metų) arba kol juos ištrinate rankiniu būdu.
            </li>
          </ul>

          <h2>6. Kaip valdyti arba atsisakyti slapukų?</h2>
          <p>
            Jūs bet kada galite valdyti, blokuoti ar ištrinti slapukus pakeisdami savo naršyklės nustatymus.
            Dauguma naršyklių leidžia:
          </p>
          <ul>
            <li>peržiūrėti, kokie slapukai yra įrašyti, ir juos ištrinti pavieniui;</li>
            <li>blokuoti trečiųjų šalių slapukus;</li>
            <li>blokuoti visų ar konkrečių svetainių slapukus;</li>
            <li>blokuoti visus slapukus ir būti įspėtam kaskart, kai svetainė bando juos įrašyti.</li>
          </ul>
          <p>
            Atkreipiame dėmesį, kad atsisakius būtinųjų slapukų, kai kurios Svetainės funkcijos (pvz., kelionės
            užsakymo procesas) gali veikti netinkamai arba visai neveikti.
          </p>

          <h2>7. Kaip su mumis susisiekti?</h2>
          <p>
            Jei turite klausimų apie šią Slapukų politiką ar norite įgyvendinti savo teises dėl asmens duomenų
            tvarkymo, susisiekite su mumis:
          </p>
          <ul>
            <li>
              el. paštu: <a href="mailto:info@prasmingas.lt">info@prasmingas.lt</a>;
            </li>
            <li>telefonu: +370 659 55770.</li>
          </ul>

          <h2>8. Politikos keitimas</h2>
          <p>
            Galime atnaujinti šią Slapukų politiką, pavyzdžiui, pasikeitus taikomiems teisės aktams arba
            Svetainėje naudojamiems įrankiams. Aktuali politikos versija visada skelbiama šiame puslapyje.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
