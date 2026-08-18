/* =====================================================
LeMaCh — WSPÓLNE FUNKCJE DLA KALKULATORÓW
(Kalkulator 01 — Rezystor LED, 02 — Prawo Ohma, 03 — Wspólny)

Ten plik jest dołączany przez wszystkie trzy kalkulatory
(<script src="common.js"> przed skryptem właściwym strony).
Każda zmiana tutaj obowiązuje wszystkie trzy strony naraz —
nie trzeba już powtarzać poprawki w trzech miejscach.
===================================================== */


/* =====================================================
LICZBY I FORMATOWANIE
max 4 cyfry znaczące, notacja zwykła (bez naukowej),
przecinek jako separator dziesiętny (standard PL, ustalony
2026-08-14 dla wszystkich kalkulatorów LeMaCh)
===================================================== */

function num(value){

    if(
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ){
        return NaN;
    }

    let s =
        String(value)
        .trim()
        .replace(/\s/g,"")
        .replace(",", ".");

    return parseFloat(s);
}


function fmt(value, sig=4){

    if(!Number.isFinite(value)){
        return "—";
    }

    if(value === 0){
        return "0";
    }

    const negative =
        value < 0;

    const abs =
        Math.abs(value);

    const exponent =
        Math.floor(
            Math.log10(abs)
        );

    const decimals =
        Math.max(
            0,
            Math.min(20, sig - 1 - exponent)
        );

    let s =
        abs.toFixed(decimals);

    if(s.indexOf(".") !== -1){
        s =
            s
            .replace(/0+$/,"")
            .replace(/\.$/,"");
    }

    if(negative){
        s = "-" + s;
    }

    return s.replace(".", ",");
}


/* =====================================================
PRZEŁĄCZANIE PODPOWIEDZI (TOOLTIP)
===================================================== */

function toggleTip(id){

    const el =
        document.getElementById(id);

    if(!el){
        return;
    }

    el.classList.toggle("hidden");
}


/* =====================================================
SZEREGI REZYSTORÓW (E12 / E24 / E96) — norma IEC 60063
===================================================== */

const E12 = [
    1.0, 1.2, 1.5, 1.8, 2.2, 2.7,
    3.3, 3.9, 4.7, 5.6, 6.8, 8.2
];

const E24 = [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0,
    2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3,
    4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];

const E96 = [
    1.00,1.02,1.05,1.07,1.10,1.13,1.15,1.18,
    1.21,1.24,1.27,1.30,1.33,1.37,1.40,1.43,
    1.47,1.50,1.54,1.58,1.62,1.65,1.69,1.74,
    1.78,1.82,1.87,1.91,1.96,2.00,2.05,2.10,
    2.15,2.21,2.26,2.32,2.37,2.43,2.49,2.55,
    2.61,2.67,2.74,2.80,2.87,2.94,3.01,3.09,
    3.16,3.24,3.32,3.40,3.48,3.57,3.65,3.74,
    3.83,3.92,4.02,4.12,4.22,4.32,4.42,4.53,
    4.64,4.75,4.87,4.99,5.11,5.23,5.36,5.49,
    5.62,5.76,5.90,6.04,6.19,6.34,6.49,6.65,
    6.81,6.98,7.15,7.32,7.50,7.68,7.87,8.06,
    8.25,8.45,8.66,8.87,9.09,9.31,9.53,9.76
];

function seriesValues(series){
    if(series === "E12"){ return E12; }
    if(series === "E96"){ return E96; }
    return E24;
}


/* dobór pierwszej wartości standardowej >= idealnej */

function standardResistor(value, series){

    if(!Number.isFinite(value) || value <= 0){
        return NaN;
    }

    const baseValues = seriesValues(series);
    const exponent = Math.floor(Math.log10(value));

    for(const base of baseValues){
        const candidate = base * Math.pow(10, exponent);
        if(candidate >= value){
            return candidate;
        }
    }

    return baseValues[0] * Math.pow(10, exponent + 1);
}


/* sąsiednie wartości standardowe (niższa i wyższa) */

function standardResistorNeighbors(value, series){

    if(!Number.isFinite(value) || value <= 0){
        return { lower: NaN, upper: NaN };
    }

    const baseValues = seriesValues(series);
    const exponent = Math.floor(Math.log10(value));

    let candidates = [];
    for(let e = exponent - 1; e <= exponent + 1; e++){
        baseValues.forEach(b => candidates.push(b * Math.pow(10, e)));
    }
    candidates.sort((a,b) => a-b);

    const upper = candidates.find(c => c >= value);
    const lowerCandidates = candidates.filter(c => c < value);
    const lower = lowerCandidates.length
        ? lowerCandidates[lowerCandidates.length - 1]
        : candidates[0];

    return { lower, upper };
}


/* =====================================================
KOD KOLORÓW REZYSTORA
===================================================== */

const COLOR_MAP = {
    "-2": { hex:"#C0C0C0", name:"srebrny"   },
    "-1": { hex:"#D4AF37", name:"złoty"     },
    "0":  { hex:"#1a1a1a", name:"czarny"    },
    "1":  { hex:"#8B4513", name:"brązowy"   },
    "2":  { hex:"#DC2626", name:"czerwony"  },
    "3":  { hex:"#EA580C", name:"pomarańczowy" },
    "4":  { hex:"#EAB308", name:"żółty"     },
    "5":  { hex:"#16803C", name:"zielony"   },
    "6":  { hex:"#2563EB", name:"niebieski" },
    "7":  { hex:"#7C3AED", name:"fioletowy" },
    "8":  { hex:"#6B7280", name:"szary"     },
    "9":  { hex:"#F5F5F5", name:"biały"     }
};

const TOLERANCE_COLOR = {
    "1":  { hex:"#8B4513", name:"brązowy" },
    "2":  { hex:"#DC2626", name:"czerwony" },
    "5":  { hex:"#D4AF37", name:"złoty"   },
    "10": { hex:"#C0C0C0", name:"srebrny" }
};


function colorCodeFromValue(value, numDigits, tolerancePercent){

    if(!Number.isFinite(value) || value <= 0){
        return null;
    }

    const exponent = Math.floor(Math.log10(value));
    const seg = value / Math.pow(10, exponent);
    const scale = Math.pow(10, numDigits - 1);

    let digitsValue = Math.round(seg * scale);
    let mExp = exponent - (numDigits - 1);

    /* korekta na wypadek zaokrąglenia w górę poza zakres, np 999.6 -> 1000 */
    if(digitsValue >= scale * 10){
        digitsValue = Math.round(digitsValue / 10);
        mExp += 1;
    }

    const digitsStr = String(digitsValue).padStart(numDigits, "0");

    const digitBands = digitsStr.split("").map(d => ({
        hex: (COLOR_MAP[d] || {}).hex || "#999",
        name: (COLOR_MAP[d] || {}).name || "?",
        digit: d
    }));

    const multBand = { ...(COLOR_MAP[String(mExp)] || { hex:"#999", name:"?" }), exp: mExp };
    const tolBand = TOLERANCE_COLOR[String(tolerancePercent)] || { hex:"#999", name:"?" };

    const encodedValue = digitsValue * Math.pow(10, mExp);

    return { digitBands, multBand, tolBand, encodedValue };
}


function valueFromColorDigits(digits, multExp){

    if(!digits.length){
        return NaN;
    }

    const digitsValue = parseInt(digits.join(""), 10);

    if(!Number.isFinite(digitsValue)){
        return NaN;
    }

    return digitsValue * Math.pow(10, multExp);
}


function renderColorCode(code, tolerancePercent){

    if(!code){
        return "";
    }

    const allBands = [...code.digitBands, code.multBand, code.tolBand];

    const bandsHtml = allBands
        .map(b => `<div class="colorband" style="background:${b.hex}" title="${b.name}"></div>`)
        .join("");

    const namesList = [
        ...code.digitBands.map(b => b.name),
        `${code.multBand.name} (mnożnik ×${fmt(Math.pow(10, code.multBand.exp))})`,
        `${code.tolBand.name} (±${tolerancePercent}%)`
    ];

    return `
    <div class="resistor-visual">
        <div class="resistor-lead"></div>
        <div class="resistor-body">${bandsHtml}</div>
        <div class="resistor-lead"></div>
    </div>
    <div class="colorcode-caption">
        <b>Kolejność pasków:</b> ${namesList.join(" — ")}
    </div>
    `;
}


/* =====================================================
KARTA WYNIKU
(nazwa "box" to alias — starszy kod w niektórych
kalkulatorach woła tę funkcję pod tą nazwą)
===================================================== */

function resultBox(title, value, detail, type="good", why="", extraHtml=""){

    const whyHtml =
        why
        ? `<div class="why"><b>Dlaczego:</b> ${why}</div>`
        : "";

    return `

    <div class="box ${type}">
        <div class="title">${title}</div>
        <div class="value">${value}</div>
        <div class="detail">${detail}</div>
        ${extraHtml}
        ${whyHtml}
    </div>

    `;
}

const box = resultBox;


/* =====================================================
KOPIOWANIE WYNIKU DO SCHOWKA
===================================================== */

let lastResultText = "";

function copyResults(){

    if(!lastResultText){
        return;
    }

    const btn =
        document.getElementById("copyBtn");

    function showCopied(){
        if(btn){
            const original = "Kopiuj wynik";
            btn.textContent = "Skopiowano ✓";
            setTimeout(
                () => { btn.textContent = original; },
                1800
            );
        }
    }

    if(
        navigator.clipboard &&
        navigator.clipboard.writeText
    ){
        navigator.clipboard
            .writeText(lastResultText)
            .then(showCopied)
            .catch(() => {
                if(btn){ btn.textContent = "Błąd kopiowania"; }
            });
    }
    else{
        /* awaryjnie, dla starszych przeglądarek */
        const ta = document.createElement("textarea");
        ta.value = lastResultText;
        document.body.appendChild(ta);
        ta.select();
        try{
            document.execCommand("copy");
            showCopied();
        }catch(e){
            if(btn){ btn.textContent = "Błąd kopiowania"; }
        }
        document.body.removeChild(ta);
    }
}


/* =====================================================
DODATEK DO ŚCIĄGI — KODY KONDENSATORÓW I SZEREGI E

Wspólny dla wszystkich trzech kalkulatorów (wstrzykiwany
przez initCheatsheetExtra() do elementu #cheatsheet-extra),
żeby dopisać coś tutaj wystarczyło zrobić to raz.
===================================================== */

const CHEATSHEET_EXTRA_HTML = `
<h4>6. Kody kondensatorów (SMD, ceramiczne)</h4>
<ul>
<li>Trzycyfrowy nadruk na małym kondensatorze ceramicznym czyta się tak samo jak kod SMD rezystora: dwie pierwsze cyfry to liczba znacząca, trzecia to liczba dopisywanych zer — wynik wychodzi w pikofaradach (pF).</li>
<li>Przykład: <b>104</b> = 10 i cztery zera = 100 000 pF = 100 nF = 0,1 µF. Podobnie <b>223</b> = 22 i trzy zera = 22 000 pF = 22 nF.</li>
</ul>
<table>
<tr><th>Kod</th><th>Wartość</th></tr>
<tr><td>101</td><td>100 pF</td></tr>
<tr><td>221</td><td>220 pF</td></tr>
<tr><td>102</td><td>1 nF</td></tr>
<tr><td>103</td><td>10 nF</td></tr>
<tr><td>223</td><td>22 nF</td></tr>
<tr><td>104</td><td>100 nF (0,1 µF)</td></tr>
<tr><td>474</td><td>470 nF</td></tr>
<tr><td>105</td><td>1 µF</td></tr>
</table>
<div class="hint">Litera po kodzie oznacza tolerancję: J = ±5%, K = ±10%, M = ±20%. Wartość w µF wpisujesz bezpośrednio w polu C kalkulatora NE555 — ten kod przydaje się, gdy masz kondensator w ręku i chcesz sprawdzić, czym właściwie jest.</div>

<h4>7. Szeregi wartości E — dlaczego rezystory mają „dziwne” wartości</h4>
<ul>
<li>Wartości rezystorów (i kondensatorów) nie są dowolne — pochodzą z szeregów E, w których kolejne wartości w dekadzie są rozmieszczone logarytmicznie, a nie równomiernie.</li>
<li>Dzięki temu zakresy tolerancji sąsiednich wartości „zazębiają się” i pokrywają całą dekadę bez dziur ani zbędnego nakładania.</li>
<li>Im gęstszy szereg (więcej wartości w dekadzie), tym mniejsza dopuszczalna tolerancja rezystora.</li>
</ul>
<table>
<tr><th>Szereg</th><th>Tolerancja</th><th>Przykładowe wartości w dekadzie</th></tr>
<tr><td>E6</td><td>±20%</td><td>10, 15, 22, 33, 47, 68</td></tr>
<tr><td>E12</td><td>±10%</td><td>10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82</td></tr>
<tr><td>E24</td><td>±5%</td><td>10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33...</td></tr>
</table>
<div class="hint">To dokładnie te same szeregi (E12/E24/E96), które wybierasz w polu „Szereg rezystorów” w Kalkulatorze LED i Kalkulatorze wspólnym — E96 to szereg precyzyjny (±1%), używany m.in. w kodach EIA-96 w przeliczniku SMD. Stąd właśnie biorą się wartości typu 4,7 kΩ zamiast równego 5 kΩ.</div>
`;

function initCheatsheetExtra(){
    const el = document.getElementById("cheatsheet-extra");
    if(el){
        el.innerHTML = CHEATSHEET_EXTRA_HTML;
    }
}
