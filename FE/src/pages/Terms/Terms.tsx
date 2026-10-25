import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import "./Terms.css";

// Pilnas tekstas perkeltas iš senos prasmingas.lt svetainės
// (organizuotos-turistines-keliones-salygos.html) — tas pats turinys,
// dabar mūsų pačių domene (žr. legalLinks.ts::tourismTerms).
export default function Terms() {
  return (
    <>
      <Header />

      <section className="terms-page">
        <div className="container terms-container">
          <h1>Organizuotos turistinės kelionės sutarties sąlygos</h1>

          <h2>1. Sutarties šalys ir dalykas</h2>
          <p>
            1.1. Šioje sutartyje Turistas – fizinis arba juridinis asmuo, sudaręs su Kelionių organizatoriumi sutartį
            (sutartį pasirašęs asmuo ar įmonė/įstaiga/organizacija) arba bet kuris fizinis(-iai) ar juridinis(-iai)
            asmuo(-ys), kurio(-ų) vardu sutartį pasirašęs asmuo perka iš anksto organizuotą turistinę kelionę (toliau
            sutartyje – kelionė) ir prisiima visas teises ir pareigas pagal sutartį (kiti naudos gavėjai), arba bet
            kuris fizinis(-iai) arba juridinis(-iai) asmuo(-ys), kuriam(-iems) sutartį pasirašęs asmuo arba bet
            kuris naudos gavėjas perleidžia savo teisę į kelionę.
          </p>
          <p>
            1.2. Kelionių organizatorius – VšĮ „Prasmingam gyvenimui“, įm. k. 305809635, kelionių organizatoriaus
            pažymėjimo nr. 17231, veiklos adresas: Vytauto 131-4, Garliava, Kauno r. LT53210, tel. +370 659 55770,
            el. paštas{" "}
            <a href="mailto:info@prasmingas.lt">info@prasmingas.lt</a>. Kelionių organizatoriaus prievolių
            užtikrinimo draudimas Nr. 710-741-101069, galioja iki 2027-03-25.
          </p>
          <p>
            1.3. Kelionių pardavimo agentas (toliau sutartyje – Agentas) – fizinis arba juridinis asmuo, kuris nėra
            kelionių organizatorius, bet parduoda ar siūlo įsigyti Kelionių organizatoriaus sudarytas keliones.
          </p>
          <p>
            1.4. Ši sutartis bei atskiri dokumentai, kuriuose nurodyti Kelionių organizatoriaus rekvizitai, kelionės
            sąlygos, Turisto (-ų) asmens duomenys arba rekvizitai, kelionės kaina ir kitos sąlygos, yra neatsiejamos
            dalys.
          </p>
          <p>1.5. Kelionėse lėktuvu vežimo oru paslauga vykdoma reguliariaisiais skrydžiais.</p>

          <h2>2. Sutarties šalių įsipareigojimai</h2>
          <p>2.1. Kelionių organizatorius įsipareigoja:</p>
          <p>
            2.1.1. Užtikrinti Turistui (-ams) visų sutartyje nurodytų paslaugų tinkamą teikimą, atsižvelgdamas į
            Turisto teisėtus lūkesčius, nepaisant to, ar tas paslaugas turi teikti pats Kelionių organizatorius ar
            kiti turizmo paslaugų teikėjai. Katalogas, keliautojo atmintinė arba/ir kita kelionę aprašanti medžiaga
            ir pakeista programa yra neatskiriamas šios sutarties priedas. Taip pat Kelionių organizatoriaus
            internetiniame puslapyje www.prasmingas.lt skelbiama naujausia ir aktualiausia informacija apie kelionę
            ir jos programos pasikeitimus po sutarties sudarymo.
          </p>
          <p>
            2.1.2. Nesurinkus minimalaus Turistų skaičiaus, pranešti Turistui apie sutarties nutraukimą patvarioje
            laikmenoje ne vėliau kaip iki kelionės pradžios likus:
          </p>
          <ul>
            <li>2.1.2.1. 20 dienų, jeigu kelionės trukmė yra ilgesnė negu 6 dienos;</li>
            <li>2.1.2.2. 7 dienoms, jeigu kelionės trukmė yra ne trumpesnė negu 3 dienos ir ne ilgesnė negu 6 dienos;</li>
            <li>2.1.2.3. 5 dienoms, jeigu kelionės trukmė yra 2 dienos;</li>
            <li>2.1.2.4. likus 48 valandoms, jeigu kelionės trukmė yra trumpesnė negu 2 dienos.</li>
          </ul>
          <p>
            Minimalus turistų skaičius kelionėje autobusu – 35 turistai. Jeigu prie užsakomos kelionės aprašymo
            internetiniame puslapyje www.prasmingas.lt ir/ar sutarties prieduose nurodytas kitas minimalus Turistų
            skaičius, galioja pastarasis. Minimalus Turistų skaičius kelionėms lėktuvu nurodomas užsakomos kelionės
            aprašyme internetiniame puslapyje www.prasmingas.lt ir/ar sutarties prieduose.
          </p>
          <p>
            Turistams tinkamai ir laiku pranešus apie sutarties nutraukimą ir grąžinus įmokėtus pinigus už kelionę,
            Kelionių organizatorius neatsako už Turistų patirtą žalą.
          </p>
          <p>
            2.1.3. Likus pakankamai laiko iki kelionės pradžios, pateikti Turistui tokia forma, kaip buvo sudaryta
            sutartis arba kita Turisto pasirinkta forma būtinus bilietus, informaciją apie numatytą išvykimo laiką
            ir, kai taikytina, registracijos terminą ir numatytą laukimo tarpinėse stotelėse, transporto jungčių ir
            atvykimo laiką. Kelionių organizatorius taip pat įsipareigoja suteikti informaciją apie transporto
            priemones, kuriomis vykstama, jų charakteristikas ir kategoriją, apgyvendinimo tipą, objekto vietą,
            kategoriją ar patogumų lygį ir pagrindinius ypatumus bei klasę (pagal atitinkamas priimančios valstybės
            taisykles), maitinimą. Pastaroji informacija gali būti skelbiama Kelionių organizatoriaus internetiniame
            puslapyje www.prasmingas.lt.
          </p>
          <p>
            2.1.4. Tais atvejais, kai Kelionių organizatorius sutartimi įsipareigoja suteikti Turistui apgyvendinimo
            paslaugas, atitinkančias konkrečią kategoriją pagal priimančiosios šalies taisykles, nenurodant
            konkretaus apgyvendinimo paslaugų teikėjo, Kelionių organizatorius iki sutarties pasirašymo privalo
            informuoti Turistą apie apgyvendinimo tipą, kategoriją bei maitinimą. Kelionių organizatorius taip pat
            privalo suteikti Turistui neklaidinančią ir išsamią informaciją apie patogumų, paslaugų ir pramogų
            lygį, kiekį ir kokybę bei galimus jų skirtumus, priklausančius nuo konkretaus apgyvendinimo paslaugų
            teikėjo.
          </p>
          <p>
            2.1.5. Suteikti bendro pobūdžio informaciją apie kelionės šalies paso ir vizos reikalavimus, įskaitant
            apytikslę vizos išdavimo proceso trukmę, ir informaciją apie su sveikata susijusius formalumus
            (informaciją apie valstybių, į kurias vykstama, užkrečiamųjų ligų epidemiologinę būklę, privalomas ir
            rekomenduojamas profilaktikos priemones, informaciją apie sveikatos draudimo įforminimo tvarką) arba
            pateikti nuorodas į šią informaciją. Pastaroji informacija arba nuorodos į oficialius internetinius
            tinklapius, kur yra tokia informacija, skelbiama Kelionių organizatoriaus internetiniame puslapyje
            www.prasmingas.lt.
          </p>
          <p>
            2.1.6. Suteikti informaciją apie Kelionių organizatoriaus vietinio atstovo, kelionių vadovo, kontaktinio
            centro ar kitos tarnybos, kurie suteikia Turistui galimybę greitai susisiekti su Kelionių organizatoriumi
            ir su juo bendrauti, kreiptis pagalbos, Turistui susidūrus su sunkumais, arba pateikti pretenziją dėl
            netinkamo sutarties vykdymo ar sutarties nevykdymo, vardą ir pavardę arba pavadinimą, adresą, telefono
            numerį, elektroninio pašto adresą, fakso numerį. Jei tokių Kelionių organizatoriaus atstovų nėra,
            Turistui nurodyti telefono numerį, kuriuo jis galėtų skambinti nenumatytu atveju, ar informaciją, kuri
            jam padėtų susisiekti su Kelionių organizatoriumi. Jei į kelionę vyksta nepilnamečiai, pateikti tėvams
            ar globėjams informaciją, leisiančią tiesiogiai susisiekti su nepilnamečiu vaiku ar atsakingu asmeniu
            nepilnamečio vaiko buvimo vietoje.
          </p>
          <p>
            2.1.7. Suteikti informaciją apie neprivalomą arba privalomą draudimą išlaidoms, atsirandančioms Turistui
            nutraukus sutartį, arba pagalbos, įskaitant Turisto grąžinimą į pradinę išvykimo vietą, išlaidoms
            nelaimingo atsitikimo, ligos ar mirties atveju apmokėti.
          </p>
          <p>
            2.1.8. Turisto(-ų) pateiktus asmens duomenis naudoti tik kelionės dokumentų įforminimui ir kelionės
            paslaugų užsakymui. Jeigu Turistas davė sutikimą, pateikti duomenys gali būti saugomi ir naudojami
            tiesioginės rinkodaros tikslu informuojant turistą apie kelionių organizatoriaus siūlomas ir
            organizuojamas keliones.
          </p>
          <p>
            2.1.9. Be nepagrįsto delsimo suteikti Turistui, kuriam kyla sunkumų, reikalingą pagalbą kelionės metu ar
            esant nenugalimos jėgos aplinkybėms:
          </p>
          <ul>
            <li>2.1.9.1. teikti atitinkamą informaciją apie sveikatos priežiūros paslaugas, vietos valdžios institucijas ir konsulinę pagalbą;</li>
            <li>2.1.9.2. padėti Turistui pasinaudoti nuotolinio ryšio priemonėmis;</li>
            <li>2.1.9.3. padėti rasti alternatyvių kelionės paslaugų.</li>
          </ul>
          <p>
            2.1.10. Kai Kelionių organizatoriui atsiranda pareiga grąžinti Turistui visus ar dalį Turisto ar jo
            vardu sumokėtų pinigų už kelionę, grąžinti pinigus be nepagrįsto delsimo, bet ne vėliau kaip per 14
            dienų nuo sutarties nutraukimo dienos.
          </p>
          <p>2.2. Turistas įsipareigoja:</p>
          <p>
            2.2.1. Laiku sumokėti už kelionę. Kelionių organizatoriaus internetiniame puslapyje www.prasmingas.lt
            skelbiamuose pasiūlymuose nustatoma apmokėjimo už kelionę tvarka, kurios privalo laikytis Turistas.
            Turistas, pervesdamas pinigus į kelionių organizatoriaus sąskaitą, mokėjimo paskirtyje turi nurodyti
            šios sutarties numerį, pavardę, kelionės kryptį ir kelionės datą. Pirkdamas kelionę išsimokėtinai,
            turistas privalo laikytis atitinkamoje sutartyje numatytos apmokėjimo už kelionę tvarkos. Sutartyje
            nurodoma bendra kelionės kaina (įskaičiuoti visi mokesčiai, papildomos įmokos, rinkliavos ir kt.
            išlaidos) visiems sutartyje nurodytiems Turistams. Į kelionės kainą neįskaičiuota paso, vizos, skiepų,
            papildomų draudimų įsigijimo kaina, kurių įsigijimu privalo pasirūpinti pats Turistas, kurorto mokestis,
            mokamas atvykus į viešbutį, bilietai į mokamus objektus ir/ar kiti sutartyje nurodyti papildomi
            mokesčiai.
          </p>
          <p>2.2.2. Laiku pateikti visą informaciją bei dokumentus, reikalingus Kelionių organizatoriui įvykdyti šią sutartį.</p>
          <p>
            2.2.3. Laiku atvykti į kelionės pradžios vietą, laikytis Kelionių organizatoriaus nurodymų dėl kelionės
            ar atskirų jos dalių vykdymo, laikytis viešosios tvarkos, tarptautinių keleivių vežimo taisyklių,
            bagažo gabenimo tvarkos ir į šalį įvežamų daiktų kiekio, skaičiaus ir draudimų reikalavimų. Vykdyti
            pasienio ir muitinės tarnybų nurodymus. Turistui neatvykus kelionių vadovo, kelionių organizatoriaus
            atstovo ar gido nurodytu laiku, laukiama 15 (penkiolika) minučių nuo nurodyto laiko. Turistui(-ams)
            neatvykus, ekskursija pradedama/tęsiama be neatvykusių asmenų ir atsiradusios papildomos išlaidos nėra
            grąžinamos.
          </p>
          <p>
            2.2.4. Vykstant į kelionę su vaiku(-ais), laikytis Lietuvos Respublikos Vyriausybės 2002 m. vasario 28
            d. nutarimu Nr. 302 patvirtinto Vaiko laikino išvykimo į užsienio valstybes, nepriklausančias Šengeno
            erdvei, tvarkos aprašo reikalavimų.
          </p>
          <p>
            2.2.5. Atlyginti kelionės metu padarytą žalą (sugadintą viešbučio inventorių, transporto priemones ir
            kt.). Jeigu žala padaryta nepilnamečio, visus nuostolius atlygina už jį atsakingas asmuo. Jeigu
            Turistas prisiima kaltę ir sutinka atlyginti žalą, ją reikia atlyginti vietoje. Tais atvejais, kai
            Turistas kaltės neprisiima, Kelionių organizatorius turi teisę žalą išieškoti Lietuvos Respublikos
            teisės aktų nustatyta tvarka. Turistas neprivalo atlyginti žalos, atsiradusios dėl nenugalimos jėgos.
          </p>
          <p>
            2.2.6. Laikytis viešosios tvarkos, tarptautinių keleivių vežimo taisyklių, bagažo gabenimo tvarkos ir į
            šalį įvežamų daiktų kiekio, skaičiaus ir draudimų reikalavimų.
          </p>
          <p>2.2.7. Vykstant kelionei autobusu nevartoti alkoholinių gėrimų, nerūkyti ir nevaikščioti autobuso salone autobusui važiuojant.</p>
          <p>
            2.2.8. Kelionės metu imtis saugumo priemonių tam, kad jų turtas būtų apsaugotas nuo vagysčių (pavyzdžiui,
            nepalikti autobuse savo daiktų be priežiūros, asmens dokumentus, pinigus ir vertingus daiktus laikyti
            viešbučio kambaryje arba viešbučio registratūroje esančiame seife, ekskursijų metu – laikyti prie
            savęs, ypač didelio susibūrimo vietose, nepalikti jų be priežiūros).
          </p>
          <p>
            2.2.9. Turistas, pagrindinė šios sutarties šalis, privalo informuoti kitus Turistus – naudos gavėjus,
            kad kelionė yra organizuojama tik pagal šioje sutartyje nurodytas sąlygas ir visi Turistai privalo
            vykdyti visas sutarties sąlygas bei pateikti jiems visą po sutarties sudarymo Kelionių organizatoriaus
            siunčiamą informaciją.
          </p>

          <h2>3. Sutarties nutraukimas, atsisakymas</h2>
          <p>3.1. Turisto teisė nutraukti sutartį:</p>
          <p>3.1.1. Turistas turi teisę bet kuriuo metu nutraukti sutartį iki kelionės pradžios.</p>
          <p>
            3.1.2. Turistui nutraukus sutartį, Kelionių organizatorius gali reikalauti iš Turisto sumokėti pagrįstą
            sutarties nutraukimo mokestį, nustatytą sutartyje:
          </p>
          <p>
            3.1.2.1. Sutarties nutraukimo mokesčio dydis priklauso nuo likusio laiko iki kelionės pradžios (išskyrus
            sutarties 3.1.2.2 ir 3.1.2.3 punktuose nurodytas išimtis) – suma procentais nuo kelionės kainos:
          </p>
          <ul>
            <li>28 d. ir daugiau dienų iki išvykimo – 20 %</li>
            <li>nuo 27 iki 24 dienų iki išvykimo – 30 %</li>
            <li>nuo 23 iki 20 dienų iki išvykimo – 60 %</li>
            <li>nuo 19 iki 15 dienos iki išvykimo – 85 %</li>
            <li>likus 14 ir mažiau dienų iki išvykimo – 100 %</li>
          </ul>
          <p>Datos, Turistų skaičiaus, viešbučio keitimai yra vertinama kaip sutarties nutraukimas.</p>
          <p>
            3.1.2.2. Kalėdinių, naujametinių, slidinėjimo, tolimųjų kraštų, visų kelionių lėktuvu bei keltais
            atveju taikomi šie sutarties nutraukimo mokesčiai (suma procentais nuo kelionės kainos):
          </p>
          <ul>
            <li>likus daugiau kaip 28 d. iki išvykimo – 50 %</li>
            <li>likus mažiau kaip 28 d. iki išvykimo – 100 %</li>
          </ul>
          <p>
            3.1.2.3. Turistui nutraukus sutartį kelionei lėktuvu, lėktuvo bilietai nekeičiami ir negrąžinami. Pinigai
            už lėktuvų bilietus nėra grąžinami.
          </p>
          <p>Visais aukščiau nurodytais atvejais sutarties nutraukimo mokesčio dydis negali viršyti sutartyje nustatytos kelionės kainos.</p>
          <p>3.1.3. Turistas turi teisę nutraukti sutartį ir nemokėti sutarties nutraukimo mokesčio šiais atvejais:</p>
          <p>
            3.1.3.1. jeigu Kelionių organizatorius iki kelionės pradžios pakeičia sutarties sąlygas, o Turistas per
            Kelionių organizatoriaus nurodytą protingą terminą nesutinka su Kelionių organizatoriaus siūlomais
            sutarties sąlygų pakeitimais, kai:
          </p>
          <ul>
            <li>3.1.3.1.1. Kelionių organizatorius iki kelionės pradžios yra priverstas iš esmės pakeisti bet kurią iš pagrindinių kelionės paslaugų ir (ar) ypatumų;</li>
            <li>3.1.3.1.2. Kelionių organizatorius negali įvykdyti sutartyje nurodytų specialių Turisto reikalavimų;</li>
            <li>3.1.3.1.3. Kelionių organizatorius pasiūlo padidinti kelionės kainą daugiau kaip 8 procentais pagal Lietuvos Respublikos civilinio kodekso 6.7521 straipsnį;</li>
          </ul>
          <p>
            3.1.3.2. jeigu dėl Turisto nurodytų trūkumų sutartis negali būti toliau vykdoma, o Kelionių
            organizatorius per Turisto nustatytą protingą laikotarpį nepašalina trūkumų. Lietuvos Respublikos
            civilinio kodekso 6.7521 straipsnio 3 dalyje numatytais atvejais Turistas gali prašyti sumažinti
            kelionės kainą arba atlyginti žalą;
          </p>
          <p>
            3.1.3.3. jeigu kelionės tikslo vietoje ar visiškai greta atsiranda nenugalimos jėgos aplinkybių, dėl
            kurių gali tapti neįmanoma vykdyti kelionę ar nuvežti Turistus į kelionės tikslo vietą. Tokiu atveju
            Turistas turi teisę reikalauti, kad jam būtų grąžinti už kelionę sumokėti pinigai, tačiau jam
            nesuteikiama teisė papildomai gauti žalos atlyginimą.
          </p>
          <p>
            3.1.4. Esant Turisto prašymui, kelionės datos ir/ar kelionės krypties pakeitimo galimybė svarstoma
            atskirai kiekvienu atveju, likus ne mažiau kaip 14 dienų iki išvykimo. Jeigu kelionių organizatorius
            neturi galimybės pakeisti kelionės datos ir/ar kelionės krypties ir Turistas nutraukia sutartį, taikomas
            šios sutarties 3.1.2 punktas.
          </p>
          <p>
            3.1.5. Jeigu kelionę įsigijo du Turistai ir iki kelionės pradžios sutartį nutraukia vienas iš sutartyje
            nurodytų Turistų, antrasis Turistas, kuris keliaus vienas, privalo dar prieš išvykimą sumokėti
            papildomą mokestį už vienvietį kambarį.
          </p>
          <p>3.2. Kelionių organizatoriaus teisė nutraukti sutartį:</p>
          <p>
            3.2.1. Kelionių organizatorius turi teisę iki kelionės pradžios nutraukti sutartį, grąžinti Turistui
            visas už kelionę sumokėtas sumas ir atlyginti Turisto patirtą žalą.
          </p>
          <p>3.2.2. Kelionių organizatoriui nutraukus sutartį Turisto patirta žala neatlyginama šiais atvejais:</p>
          <ul>
            <li>3.2.2.1. kelionę įsigijusių asmenų skaičius yra mažesnis nei sutarties 2.1.2 punkte nurodytas minimalus Turistų skaičius ir apie tai Turistas buvo informuotas sutarties 2.1.2 punkte nustatyta tvarka;</li>
            <li>3.2.2.2. Kelionių organizatorius negali įvykdyti sutarties dėl nenugalimos jėgos ir jis nedelsdamas iki kelionės pradžios praneša Turistui apie sutarties nutraukimą.</li>
          </ul>
          <p>
            3.3. Turistas turi teisę nenurodydamas priežasties per 14 dienų atsisakyti ne prekybos patalpose
            sudarytos sutarties Lietuvos Respublikos civilinio kodekso 6.22810 straipsnio 1 dalies nustatyta tvarka
            ir turi apie tai pranešti Kelionių organizatoriui Lietuvos Respublikos civilinio kodekso 6.22810
            straipsnio 6 ir 7 dalyse nustatyta tvarka.
          </p>

          <h2>4. Kelionės kainos keitimas</h2>
          <p>
            4.1. Kelionių organizatorius po sutarties sudarymo turi teisę didinti kelionės kainą. Kelionės kainos
            didinimas galimas tik tuo atveju, kai jį tiesiogiai lemia pasikeitęs (-usi):
          </p>
          <ul>
            <li>4.1.1. Turistų vežimo kaina dėl degalų ar kitų energijos šaltinių išlaidų;</li>
            <li>4.1.2. su į sutartį įtrauktų paslaugų, susijusių mokesčių ar rinkliavų (pavyzdžiui, Turisto rinkliava, oro uosto mokesčiai ir kt.), kuriuos taiko tretieji asmenys, tiesiogiai nedalyvaujantys vykdant kelionę, dydis;</li>
            <li>4.1.3. su kelione susijusios valiutos keitimo kursas.</li>
          </ul>
          <p>
            4.2. Kelionių organizatorius patvariojoje laikmenoje aiškiai ir suprantamai informuoja Turistą apie
            kainos padidinimą likus ne mažiau kaip 20 dienų iki kelionės pradžios, nurodydamas kainos padidėjimo
            priežastis ir kaip buvo apskaičiuotas kainos padidėjimas.
          </p>
          <p>
            4.3. Jeigu kelionės kainos padidinimas viršija 8 procentus galutinės kelionės kainos, Turistas turi
            teisę nutraukti sutartį ar pasirinkti Kelionių organizatoriaus siūlomą alternatyvią kelionę.
          </p>
          <p>4.4. Turistas po sutarties sudarymo turi teisę reikalauti sumažinti kelionės kainą šiais atvejais:</p>
          <ul>
            <li>4.4.1. sumažėjus sutarties 4.1. punkte nurodytoms išlaidoms po sutarties sudarymo, bet iki kelionės pradžios;</li>
            <li>4.4.2. dėl netinkamo sutarties vykdymo, nebent Kelionių organizatorius įrodo, kad sutartis vykdoma netinkamai dėl Turisto kaltės;</li>
            <li>4.4.3. kai dėl siūlomų alternatyvių paslaugų kelionė tampa žemesnės kokybės, nei nurodyta sutartyje;</li>
            <li>4.4.4. jeigu Kelionių organizatorius dėl pagrįstų priežasčių negali pasiūlyti alternatyvių paslaugų arba Turistas jų atsisako pagal Lietuvos Respublikos civilinio kodekso 6.754 straipsnio 5 dalį;</li>
            <li>4.4.5. jeigu dėl Turisto nurodytų trūkumų sutartis negali būti toliau vykdoma, o Kelionių organizatorius per Turisto nustatytą pagrįstą laikotarpį nepašalina trūkumų.</li>
          </ul>
          <p>
            4.5. Sumažinus kelionės kainą, Kelionių organizatorius turi teisę iš Turistui turimos sugrąžinti sumos
            išskaičiuoti faktines administracines išlaidas. Turisto prašymu Kelionių organizatorius turi pateikti
            tokių administracinių išlaidų pagrindimą.
          </p>

          <h2>5. Kitų sutarties sąlygų keitimas</h2>
          <p>5.1. Kelionių organizatorius iki kelionės pradžios vienašališkai turi teisę keisti kitas sutarties sąlygas, kuomet:</p>
          <ul>
            <li>5.1.1. pakeitimai nėra esminiai;</li>
            <li>5.1.2. Kelionių organizatorius Turisto pageidaujama forma patvariojoje laikmenoje aiškiai ir suprantamai pateikė Turistui informaciją apie pakeitimus.</li>
          </ul>
          <p>5.2. Kelionių organizatorius be nepagrįsto delsimo patvariojoje laikmenoje aiškiai ir suprantamai turi pateikti Turistui informaciją apie:</p>
          <ul>
            <li>5.2.1. siūlomus sutarties pakeitimus;</li>
            <li>5.2.2. protingą terminą, per kurį Turistas turi informuoti Kelionių organizatorių apie savo sprendimą;</li>
            <li>5.2.3. pasekmes, jei Turistas neatsakytų per Kelionių organizatoriaus nurodytą terminą;</li>
            <li>5.2.4. alternatyvią kelionę ir jos kainą, kai tokia kelionė pasiūloma.</li>
          </ul>
          <p>
            5.3. Turistas turi teisę savo pasirinkimu per Kelionių organizatoriaus nurodytą protingą terminą sutikti
            su Kelionių organizatoriaus siūlomais sutarties sąlygų pakeitimais ar nutraukti sutartį nemokėdamas
            sutarties nutraukimo mokesčio.
          </p>
          <p>
            5.4. Turistui nutraukus sutartį, Kelionių organizatorius gali Turistui pasiūlyti lygiavertę ar
            aukštesnės kokybės kitą kelionę. Jei dėl sutarties pakeitimų ar pasirinktos alternatyvios kelionės
            suprastėja kelionės kokybė ar sumažėja jos kaina, Turistas turi teisę reikalauti grąžinti sumažėjusios
            kainos skirtumą.
          </p>
          <p>5.5. Po sutarties sudarymo abiejų šalių rašytiniu susitarimu gali būti keičiama bet kuri sutarties sąlyga.</p>

          <h2>6. Sutarties šalių pasikeitimas</h2>
          <p>
            6.1. Turistas turi teisę perleisti savo teisę į kelionę kitam asmeniui, kuris įgys visas Turisto teises
            ir pareigas pagal sutartį, jeigu iki kelionės pradžios Kelionių organizatoriui pateikia pagrįstą
            pranešimą. Turisto pranešimas visais atvejais laikomas pagrįstu, jeigu jis pateiktas ne vėliau kaip
            likus 7 dienoms iki kelionės pradžios.
          </p>
          <p>
            6.2. Kelionių organizatorius informuoja Turistą, perleidžiantį savo teisę į kelionę kitam asmeniui, apie
            faktines sutarties perleidimo išlaidas ir pateikia jas pagrindžiančius įrodymus. Tos išlaidos turi būti
            pagrįstos ir neviršyti Kelionių organizatoriaus dėl sutarties perleidimo patirtų faktinių išlaidų.
            Turistas turi atlyginti visas išlaidas prieš prasidedant kelionei arba vėliau, jeigu išlaidų negalima
            tiksliai paskaičiuoti iki kelionės pradžios.
          </p>
          <p>
            6.3. Jeigu Turistas įsigijo kelionę lėktuvu, vykdomą reguliariuoju skrydžiu, ir nori perleisti kelionę
            trečiajam asmeniui, Turistas privalo sumokėti skrydį vykdančio oro vežėjo nustatyto dydžio mokestį už
            keleivio duomenų (vardo, pavardės, kt.) keitimą (kai yra įmanoma perleisti skrydžio bilietus trečiajam
            asmeniui pagal skrydį vykdančio oro vežėjo bendrovės taisykles).
          </p>
          <p>
            6.4. Teisę į kelionę perleidžiantis Turistas ir kitas asmuo Kelionių organizatoriui už kelionės kainos
            ir išlaidų, susijusių su teisės į kelionę perleidimu, sumokėjimą atsako solidariai.
          </p>
          <p>
            6.5. Tais atvejais, kai toks perleidimas prieštarauja asmens, kurio pagalba Kelionių organizatorius
            naudojasi, taisyklėms (t.y. jei per laiką, likusį iki kelionės pradžios jau neleidžiama užsakyti ir/ar
            keisti vietos transporto priemonėje, viešbutyje ir (ar) gauti vizos naujo asmens vardu), apie tai
            nurodoma sutartyje.
          </p>

          <h2>7. Kelionių organizatoriaus atsakomybė</h2>
          <p>
            7.1. Kelionių organizatorius atsako už bet kokius techninius užsakymo sistemos trūkumus, kurių atsirado
            dėl jo kaltės sudarant sutartį ir už bet kokias užsakymo proceso metu padarytas klaidas. Atsakomybė
            netaikoma, kai užsakymo klaidos atsirado dėl Turisto kaltės arba jas sukėlė nenugalimos jėgos
            aplinkybės.
          </p>
          <p>7.2. Kelionių organizatorius privalo be nepagrįsto delsimo suteikti Turistui, kuriam kyla sunkumų, reikalingą pagalbą, nurodytą sutarties 2.1.9 punkte.</p>
          <p>
            7.3. Jei pagalba Turistui yra reikalinga dėl priežasčių, kurios atsiranda dėl Turisto tyčinių veiksmų ar
            aplaidumo, Kelionių organizatorius turi teisę už tokios pagalbos teikimą imti atlygį, kurio dydis
            negali viršyti Kelionių organizatoriaus patirtų faktinių išlaidų.
          </p>
          <p>
            7.4. Turistas be nepagrįsto delsimo turi pranešti Kelionių organizatoriui sutartyje nurodytais
            kontaktais apie bet kokį netinkamo sutarties vykdymo ar sutarties nevykdymo atvejį, jo pastebėtą
            kelionės metu ir nurodyti protingą terminą trūkumams ištaisyti. Jeigu trūkumus būtina ištaisyti
            nedelsiant, Turistas neprivalo nurodyti termino.
          </p>
          <p>
            7.5. Jeigu sutartyje nurodytos paslaugos teikiamos ne pagal sutarties sąlygas, Kelionių organizatorius
            per Turisto nustatytą protingą terminą privalo ištaisyti Turisto nurodytus trūkumus, išskyrus kai to
            padaryti neįmanoma arba jei tai sukeltų neproporcingų išlaidų, atsižvelgiant į trūkumų mastą ir į
            netinkamai suteiktų paslaugų, nurodytų sutartyje, vertę.
          </p>
          <p>
            7.6. Jeigu Kelionių organizatorius neištaiso trūkumų dėl sutarties sąlygų 7.5 punkte nurodytų
            priežasčių, taikomos Lietuvos Respublikos civilinio kodekso 6.7541 straipsnio nuostatos dėl žalos
            atlyginimo.
          </p>
          <p>
            7.7. Jeigu Kelionių organizatorius per Turisto nustatytą protingą terminą neištaiso trūkumų ne dėl
            sutarties 7.5 punkte nurodytų priežasčių, Turistas gali padaryti tai pats ir pareikalauti padengti
            būtinas išlaidas.
          </p>
          <p>
            7.8. Jeigu Kelionių organizatorius negali suteikti didelės paslaugų dalies pagal sutartį arba Turisto
            sugrįžimo į išvykimo vietą paslauga nesuteikiama taip, kaip buvo susitarta, Kelionių organizatorius
            privalo pasiūlyti Turistui be papildomų išlaidų tinkamas alternatyvias paslaugas, kurių kokybė, jeigu
            įmanoma, būtų lygiavertė sutartyje nurodytai kokybei arba aukštesnė už ją, kad būtų galima toliau tęsti
            kelionę. Kai dėl siūlomų alternatyvų kelionė tampa žemesnės kokybės nei nurodyta sutartyje, Kelionių
            organizatorius atitinkamai sumažina kelionės kainą.
          </p>
          <p>7.9. Jei pasiūlytos alternatyvos nėra panašios į tas paslaugas, dėl kurių buvo susitarta sutartyje, arba, jei suteiktas kainos sumažinimas yra neadekvatus, Turistas gali jų atsisakyti.</p>
          <p>
            7.10. Jei nepakankama atitiktis iš esmės daro poveikį kelionės vykdymui, o Kelionių organizatorius per
            Turisto nustatytą pagrįstą laikotarpį padėties neištaiso, Turistas gali nutraukti sutartį nemokėdamas
            sutarties nutraukimo mokesčio ir paprašyti sumažinti kainą ir (arba) atlyginti turtinę ir neturtinę
            žalą.
          </p>
          <p>
            7.11. Jeigu nėra įmanoma pasiūlyti alternatyvų arba Turistas atsisako pasiūlytų alternatyvų pagal
            sutarties 7.9 punktą, Turistas turi teisę į kainos sumažinimą ir (arba) turtinės ir neturtinės žalos
            atlyginimą nenutraukiant sutarties.
          </p>
          <p>
            7.12. Jeigu kelionė apima keleivių vežimo paslaugą, Kelionių organizatorius šios sutarties 7.9–7.11
            punktuose nurodytais atvejais be papildomo užmokesčio turi užtikrinti Turisto grąžinimą į pradinę
            išvykimo vietą lygiavertės rūšies transportu arba nuvežimą į kitą vietovę, dėl kurios sutinka Turistas,
            taip pat grąžinti Turistui pinigus už nesuteiktas paslaugas.
          </p>
          <p>
            7.13. Jeigu dėl nenugalimos jėgos Kelionių organizatorius negali užtikrinti Turisto grąžinimo taip, kaip
            numatyta sutartyje, Kelionių organizatorius privalo apmokėti būtino apgyvendinimo, kurio kategorija,
            jeigu įmanoma, yra lygiavertė nurodytajai sutartyje, tam laikotarpiui, kiek trunka nenugalimos jėgos
            aplinkybės, bet ne ilgesniam kaip trijų nakvynių laikotarpiui kiekvienam Turistui, išlaidas, išskyrus
            atvejus, kai kituose įstatymuose ar Europos Sąjungos teisės aktuose numatyti ilgesni laikotarpiai
            (pavyzdžiui, riboto judumo ir juos lydintiems asmenims, nėščiosioms ir nelydimiems nepilnamečiams, taip
            pat asmenims, kuriems reikia specialios medicinos pagalbos, jei Turistas apie jo specialius poreikius
            praneša Kelionių organizatoriui likus ne mažiau kaip 48 valandoms iki kelionės pradžios).
          </p>
          <p>7.14. Turistas turi teisę reikalauti, kad jam be nepagrįsto delsimo būtų atlyginta turtinė ir neturtinė žala šiais atvejais:</p>
          <ul>
            <li>7.14.1. jeigu dėl Turisto nurodytų trūkumų sutartis negali būti toliau vykdoma, o Kelionių organizatorius per Turisto nustatytą protingą terminą nepašalina trūkumų;</li>
            <li>7.14.2. jeigu Kelionių organizatorius dėl pagrįstų priežasčių negali pasiūlyti alternatyvių paslaugų arba Turistas jų atsisako pagal sutarties 7.9 punktą;</li>
            <li>7.14.3. kitais Lietuvos Respublikos civiliniame kodekse nustatytais atvejais.</li>
          </ul>
          <p>7.15. Kelionių organizatorius neatsako už netinkamą sutarties įvykdymą, jeigu Kelionių organizatorius įrodo, kad sutartis buvo netinkamai vykdoma dėl:</p>
          <ul>
            <li>7.15.1. Turisto kaltės (pavyzdžiui, Turistas neturi kelionei reikalingų ir galiojančių asmens tapatybės dokumentų, neatvyksta laiku į išvykimo vietą, trukdo tęsti kelionę, nesilaiko muitinės taisyklių);</li>
            <li>7.15.2. trečiosios šalies, nesusijusios su paslaugų teikimu pagal sutartį, kaltės ir todėl nebuvo įmanoma žalos numatyti arba jos išvengti;</li>
            <li>7.15.3. nenugalimos jėgos.</li>
          </ul>
          <p>
            7.16. Jeigu žala, išskyrus žalą, atsiradusią dėl Turisto mirties, sveikatos sužalojimo, taip pat tyčinę
            žalą ar dėl didelio neatsargumo padarytą žalą, Turistui padaroma teikiant sutartyje numatytą paslaugą,
            tačiau tą paslaugą teikia ne pats Kelionių organizatorius, Kelionių organizatoriaus atsakomybė už tokią
            žalą gali būti ribojama triguba kelionės kaina.
          </p>
          <p>
            7.17. Turisto teisė gauti žalos atlyginimą ar teisė į kainos sumažinimą nedaro poveikio keleivių teisėms
            pagal 2004 m. vasario 11 d. Europos Parlamento ir Tarybos reglamentą (EB) Nr. 261/2004, nustatantį
            bendras kompensavimo ir pagalbos keleiviams taisykles atsisakymo vežti ir skrydžių atšaukimo arba
            atidėjimo ilgam laikui atveju, panaikinantį Reglamentą (EEB) Nr. 295/91, 2007 m. spalio 23 d. Europos
            Parlamento ir Tarybos reglamentą (EB) Nr. 1371/2007 dėl geležinkelių keleivių teisių ir pareigų, 2009 m.
            balandžio 23 d. Europos Parlamento ir Tarybos reglamentą (EB) Nr. 392/2009 dėl keleivių vežėjų jūra
            atsakomybės avarijų atveju, 2010 m. lapkričio 24 d. Europos Parlamento ir Tarybos reglamentą (ES) Nr.
            1177/2010 dėl jūrų ir vidaus vandenų keliais vykstančių keleivių teisių, 2011 m. vasario 16 d. Europos
            Parlamento ir Tarybos reglamentą (ES) Nr. 181/2011 dėl miesto ir tolimojo susisiekimo autobusų
            transporto keleivių teisių, ir pagal tarptautines konvencijas.
          </p>
          <p>
            7.18. Pagal sutarties 7.14 punktą Kelionių organizatoriaus išmokėtas žalos atlyginimas arba pagal
            sutarties 4 skyriaus nuostatas Kelionių organizatoriaus Turistui suteiktas kainos sumažinimas ir pagal
            sutarties 7.17 punkte nurodytus Europos Sąjungos teisės aktus ir tarptautines Konvencijas išmokėtas
            žalos atlyginimas arba suteiktas kainos sumažinimas Turistui išskaitomi vienas iš kito, kad būtų
            išvengta dvigubo žalos atlyginimo.
          </p>
          <p>7.19. Turistui padaryta turtinė ir neturtinė žala atlyginama Lietuvos Respublikos civilinio kodekso nustatyta tvarka.</p>

          <h2>8. Asmens duomenų apsauga</h2>
          <p>
            8.1. Asmens duomenų valdytojas yra kelionių organizatorius, VšĮ „Prasmingam gyvenimui“, į.k. 305809635,
            registruotos buveinės adresas Vytauto 131-4, Garliava, Kauno r., tel. +370 659 55770, el. paštas{" "}
            <a href="mailto:info@prasmingas.lt">info@prasmingas.lt</a>. Kelionių organizatorius tvarko Turisto
            asmens duomenis sutarčių sudarymo ir vykdymo, tame tarpe paslaugų užsakymo ir suteikimo, tikslu;
            tiesioginės rinkodaros tikslu (tik gavus Turisto sutikimą).
          </p>
          <p>
            Asmens duomenų tvarkymo teisinis pagrindas: 2016-04-27 dienos Europos Parlamento ir Tarybos reglamento
            (ES) Nr. 2016/679 dėl fizinių asmenų apsaugos tvarkant asmens duomenis ir dėl laisvo tokių duomenų
            judėjimo (Bendrojo duomenų apsaugos reglamento) 6 straipsnio 1 dalies a), b) punktai.
          </p>
          <p>
            8.2. Sutarčių sudarymo ir vykdymo, tame tarpe paslaugų užsakymo ir suteikimo, tikslu kelionių
            organizatorius tvarko šiuos Turisto asmens duomenis: vardą, pavardę, asmens kodą, gimimo datą,
            gyvenamosios vietos adresą, pilietybę, telefono numerį, asmens tapatybės kortelės (paso) numerį,
            išdavimo datą ir vietą, elektroninio pašto adresą, mokėjimo kortelių duomenis, kelionės dokumento
            numerį ir datą, kelionės maršrutą; IP adresą, Turisto identifikatorių, kurį užsakymo sistema priskiria
            Turistui (jei kelionė įsigyjama internetiniame puslapyje www.prasmingas.lt). Tiesioginės rinkodaros
            tikslu kelionių organizatorius tvarko šiuos Turisto asmens duomenis: vardą, elektroninio pašto adresą.
          </p>
          <p>8.3. Turistas susisiekęs su kelionių organizatoriumi ir kelionių organizatoriui nustačius asmens tapatybę, gali įgyvendinti šias savo asmens duomenų teises:</p>
          <ul>
            <li>8.3.1. gauti informaciją apie duomenų tvarkymą;</li>
            <li>8.3.2. susipažinti su kelionių organizatoriaus tvarkomais savo asmens duomenimis;</li>
            <li>8.3.3. reikalauti ištaisyti netikslius savo asmens duomenis ir papildyti neišsamius savo asmens duomenis;</li>
            <li>8.3.4. reikalauti ištrinti duomenis („teisė būti pamirštam“);</li>
            <li>8.3.5. reikalauti apriboti savo asmens duomenų tvarkymą;</li>
            <li>8.3.6. teisę į duomenų perkeliamumą;</li>
            <li>8.3.7. tuo atveju, kai asmens duomenys yra tvarkomi sutikimo pagrindu – teisę bet kuriuo metu atšaukti savo sutikimą;</li>
            <li>8.3.8. reikalauti, kad jo atžvilgiu nebūtų taikomas tik automatizuotu duomenų tvarkymu grindžiamas sprendimas ir toks sprendimas būtų peržiūrėtas.</li>
          </ul>
          <p>
            8.4. Turistas, manydamas, kad jo asmens duomenų teisės buvo pažeistos, turi teisę pateikti skundą
            Valstybinei duomenų apsaugos inspekcijai, A. Juozapavičiaus g. 6, Vilnius LT-09310, tel. 8 5 2127532,
            el. paštas ada@ada.lt, interneto svetainė www.ada.lt.
          </p>
          <p>
            8.5. Turistas patvirtina, kad yra informuotas, jog jo asmens duomenys, kurie yra būtini sutarties 8.1
            punkte nurodytiems tikslams pasiekti, gali būti perduoti kelionių organizatoriaus vardu ir (ar) jo
            nurodymu veikiantiems tretiesiems asmenims teikiantiems klientų aptarnavimo, programinės įrangos
            priežiūros, apskaitos ir kitas paslaugas, tame tarpe tretiesiems asmenims, su kuriais kelionių
            organizatorius bendradarbiauja ir/ar kurių paslaugomis naudojasi Europos Sąjungoje ir už jos ribų.
            Kelionių organizatorius patvirtina, kad duomenų perdavimas vykdomas taikant saugumo priemones pagal
            atitinkamas sutartis su duomenų gavėjais.
          </p>
          <p>
            8.6. Kelionių organizatorius tvarko Turisto asmens duomenis ne ilgiau nei to reikalauja nurodyti
            duomenų tvarkymo tikslai ar numato taikomi teisės aktai, jeigu juose yra nustatytas ilgesnis duomenų
            saugojimo terminas.
          </p>
          <p>
            8.7. Turistas prisiima visą atsakomybę dėl kelionių organizatoriui pateiktų savo ir kitų Turistų asmens
            duomenų (jei teikia) teisingumo ir tikslumo. Turistas, teikdamas, redaguodamas ar kitaip tvarkydamas
            duomenis (įskaitant savo ir/ar kitų Turistų asmens duomenis), užtikrina, kad turi teisę taip tvarkyti
            duomenis ir prisiima visą atsakomybę už dėl neteisėto tokių duomenų tvarkymo galinčius kilti kelionių
            organizatoriui ir/ar trečiųjų asmenų nuostolius.
          </p>

          <h2>9. Baigiamosios nuostatos</h2>
          <p>
            9.1. Kelionės metu atsiradusias pretenzijas dėl sutarties netinkamo vykdymo ar nevykdymo Turistas turi
            be nepagrįsto delsimo raštu ar patvariojoje laikmenoje pareikšti sutartyje nurodytam kelionės vadovui,
            Kelionių organizatoriaus vietiniam atstovui, kontaktiniam centrui ar kitai tarnybai, o jei šių nėra, –
            Kelionių organizatoriui.
          </p>
          <p>9.2. Turistų pretenzijų kelionių organizatoriui dėl žalos atlyginimo už netinkamą sutarties vykdymą ar nevykdymą pateikimo senaties terminas yra dveji metai.</p>
          <p>
            9.3. Kai sutartis sudaryta per Agentą, Turistas gali pateikti pranešimus, prašymus ar pretenzijas
            tiesiogiai Agentui, kuris be nepagrįsto delsimo perduoda pranešimus, prašymus ar pretenzijas Kelionių
            organizatoriui. Agentui gavus Turisto pranešimus, prašymus ar pretenzijas, laikoma, kad juos gavo
            Kelionių organizatorius.
          </p>
          <p>
            9.4. Kelionių organizatorius privalo neatlygintinai išnagrinėti Turisto kreipimąsi ir, kai nesutinka su
            Turisto reikalavimais, privalo ne vėliau kaip per 14 dienų nuo Turisto kreipimosi gavimo dienos,
            pateikti Turistui išsamų motyvuotą rašytinį atsakymą, pagrįstą dokumentais. Kelionių organizatoriui
            gavus pretenziją, turinčią trūkumų (pavyzdžiui, nepasirašytą, paduotą neturinčio teisės atstovauti
            asmens arba nepateikus tinkamą atstovavimą patvirtinančių dokumentų, nepridėjus pretenzijoje išdėstytų
            nusiskundimų pagrindžiančių įrodymų ar kt.), Kelionių organizatorius turi teisę kreiptis į Turistą su
            prašymu ištaisyti trūkumus. Terminas Kelionių organizatoriaus rašytinio atsakymo pateikimui
            skaičiuojamas nuo Turisto kreipimosi su ištaisytais trūkumais gavimo dienos. Kelionių organizatorius
            turi teisę pratęsti pretenzijos nagrinėjimo terminą ne ilgesniam kaip 14 dienų laikotarpiui dėl svarbių
            priežasčių, pateikdamas Turistui pranešimą patvariojoje laikmenoje.
          </p>
          <p>
            9.5. Ginčai dėl sutarties netinkamo vykdymo ar nevykdymo ne teisme nagrinėjami Lietuvos Respublikos
            vartotojų teisių apsaugos įstatymo nustatyta tvarka Valstybinėje vartotojų teisių apsaugos tarnyboje,
            adresu Vilniaus g. 25, LT-01402 Vilnius, el. p. tarnyba@vvtat.lt, faks. (8 5) 279 1466, interneto
            svetainė www.vvtat.lt. Elektroniniu būdu prašymą galima pateikti per EGS platformą
            http://ec.europa.eu/odr/.
          </p>
          <p>9.6. Turisto kreipimasis į vartojimo ginčus nagrinėjančią instituciją neatima iš Turisto teisės kreiptis į bendrosios kompetencijos teismą Lietuvos Respublikos civilinio proceso kodekso nustatyta tvarka su prašymu nagrinėti ginčą iš esmės.</p>
          <p>9.7. Sutartis sudaroma dviem egzemplioriais, turinčiais vienodą juridinę galią, po vieną kiekvienai šaliai.</p>
          <p>
            9.8. Jeigu sutartis sudaroma nuotoliniu būdu, elektroniniu paštu iš Turisto gautas patvirtinimas apie
            sutarties ir jos priedų gavimą arba kelionės kainos ar jos dalies sumokėjimas pagal su sutartimi gautą
            sąskaitą yra laikomas sutarties sudarymu. Jei sutartis sudaroma nuotoliniu būdu, Kelionių organizatorius
            be nepagrįsto delsimo po sutarties sudarymo patvariojoje laikmenoje Turistui pateikia sutarties kopiją
            arba sutarties patvirtinimą. Jeigu sutartis sudaroma nuotoliniu būdu, laikoma, kad sutartis sudaryta
            tokiomis sąlygomis, kokios buvo skelbiamos oficialiame Kelionių organizatoriaus internetiniame
            puslapyje www.prasmingas.lt kelionės įsigijimo metu.
          </p>
          <p>
            9.9. Ne prekybai skirtose patalpose sudarytos sutarties kopija ar sutarties sudarymo patvirtinimas
            Turistui pateikiami popierine forma arba, jei Turistas sutinka, kitoje patvariojoje laikmenoje.
            Turistas, sudarydamas šią sutartį patvirtina, kad: gavo rašytinį dokumentą (sutartį, katalogą, programą
            ar kitą kelionę aprašančią medžiagą) arba nuorodą į elektroninį dokumentą, kuriame išdėstyta visa su
            kelione susijusi informacija: apie apgyvendinimą, kelionėje teikiamas paslaugas, lankomas vietas,
            kelionės maršrutą, išvykimo ir grįžimo vietą, laukimo transporto stotelėse trukmę, transporto jungtis;
            transporto priemonę; Kelionių organizatoriaus pavadinimą, adresą, telefono numerį ir elektroninio
            pašto adresą, Kelionių organizatoriaus vietinio atstovo, kelionių vadovo, kontaktinio centro ar kitos
            tarnybos, kurie suteikia Turistui galimybę greitai susisiekti su Kelionių organizatoriumi ir su juo
            bendrauti, kreiptis pagalbos, Turistui susidūrus su sunkumais, arba pateikti pretenziją dėl netinkamo
            sutarties vykdymo ar sutarties nevykdymo, vardą ir pavardę arba pavadinimą, adresą, telefono numerį,
            elektroninio pašto adresą, fakso numerį; bendro pobūdžio informaciją apie kelionės šalies paso ir vizos
            reikalavimus, įskaitant apytikslę vizos išdavimo proceso trukmę, ir informaciją apie su sveikata
            susijusius formalumus; informaciją, pagal kurią galima tiesiogiai susisiekti su nepilnamečius ar
            nepilnametį lydinčius asmeniu nepilnamečio buvimo vietoje, kai pagal sutartį, į kurią įtraukta
            apgyvendinimo paslauga, keliauja nepilnametis, kurio nelydi vienas iš tėvų arba kitas asmuo;
            informaciją apie galimybę įsigyti neprivalomą arba privalomą draudimą išlaidoms, atsirandančioms
            Turistui nutraukus sutartį, arba pagalbos, įskaitant Turisto grąžinimą į pradinę išvykimo vietą,
            išlaidoms nelaimingo atsitikimo, ligos ar mirties atveju apmokėti, taip pat apie šių draudimų
            įforminimo tvarką; sutinka prieš kelionę kreiptis telefonu arba elektroniniu paštu į Kelionių
            organizatorių arba Agentą dėl informacijos apie Turisto sėdėjimo vietą autobuse gavimo ir gauti šią
            informaciją SMS žinute; susipažino su sutarties ir jos priedų sąlygomis, jos yra jam suprantamos, o
            Kelionių organizatorius išaiškino nesuprastų sutarties ir jos priedų sąlygų prasmę ir reikšmę bei
            atsižvelgė į Turisto pastabas dėl sutarties; yra informuotas apie Kelionių organizatoriaus internetinį
            puslapį www.prasmingas.lt, kuriame skelbiama naujausia ir aktualiausia informacija apie kelionę ir jos
            programos pasikeitimus po sutarties sudarymo; informavo kitus Turistus – naudos gavėjus, kad turistinė
            kelionė yra organizuojama pagal šioje sutartyje nurodytas sąlygas ir visi Turistai privalo vykdyti
            visas sutarties sąlygas. Turistas taip pat patvirtina, kad yra informuotas apie savo pareigą pateikti
            kitiems Turistams visą po sutarties sudarymo Kelionių organizatoriaus siunčiamą informaciją.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
