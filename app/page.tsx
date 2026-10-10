"use client";

import { useEffect, useState } from "react";

type Track = { title: string; musicAuthor: string; lyricsAuthor: string; noLyrics: boolean };
type SignatureMethod = "manual" | "facsimile" | "online";
type Contract = {
  createdAt: string;
  contractDate: string;
  contractNumber: string;
  tariff: string;
  artistShare: number;
  releaseType: string;
  workTitle: string;
  pseudonym: string;
  licensorName: string;
  passportSeriesNumber: string;
  passportIssuedBy: string;
  passportIssueDate: string;
  bankDetails: string;
  email: string;
  musicAuthor: string;
  lyricsAuthor: string;
  noLyrics: boolean;
  tracks: Track[];
  signatureMethod: SignatureMethod;
};

const LICENSEE = {
  name: "Марцинкевич Никита Владимирович",
  birthDate: "16.01.2005",
  passport: "5224 399808",
  passportIssuedBy: "УМВД РОССИИ ПО ОМСКОЙ ОБЛАСТИ",
  passportDivisionCode: "550-001",
  passportIssueDate: "05.02.2025",
  address: "Омск, Саргатский р-н, ул. Мопра, 13",
  email: "nmolotov420@gmail.com",
  inn: "553203419630",
  account: "40817810800054356778",
  bank: "Т-Банк",
  bik: "044525974",
  bankCity: "Омск",
  correspondentAccount: "30101810145250000974",
};

const SIGNATURE_SRC = "/signature-martsinkevich.png";
const DRAFT_STORAGE_KEY = "ftl-company-contract-draft";
const SIGNATURE_METHOD_LABELS: Record<SignatureMethod, string> = {
  manual: "Печать и скан",
  facsimile: "Факсимиле Лицензиата",
  online: "Онлайн-сервис",
};

const initial: Contract = {
  // Keep the server render deterministic. The creation date is filled after mount.
  createdAt: "",
  contractDate: "",
  contractNumber: "",
  tariff: "",
  artistShare: 0,
  releaseType: "Сингл",
  workTitle: "",
  pseudonym: "",
  licensorName: "",
  passportSeriesNumber: "",
  passportIssuedBy: "",
  passportIssueDate: "",
  bankDetails: "",
  email: "",
  musicAuthor: "",
  lyricsAuthor: "",
  noLyrics: false,
  tracks: [{ title: "", musicAuthor: "", lyricsAuthor: "", noLyrics: false }],
  signatureMethod: "facsimile",
};

function normalizeTracks(raw: unknown, legacy: Partial<Contract> = {}): Track[] {
  const source = Array.isArray(raw) && raw.length ? raw : [{
    title: legacy.workTitle || "",
    musicAuthor: legacy.musicAuthor || "",
    lyricsAuthor: legacy.lyricsAuthor || "",
    noLyrics: Boolean(legacy.noLyrics),
  }];
  return source.map((item) => {
    const value = item && typeof item === "object" ? item as Partial<Track> : {};
    return {
      title: String(value.title || ""),
      musicAuthor: String(value.musicAuthor || ""),
      lyricsAuthor: String(value.lyricsAuthor || ""),
      noLyrics: Boolean(value.noLyrics),
    };
  });
}

function formatDate(value: string) {
  if (!value) return `«___» __________ ${new Date().getFullYear()} г.`;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function generateContractNumber() {
  const year = new Date().getFullYear();
  const random = new Uint32Array(1);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(random);
  } else {
    random[0] = Math.floor(Math.random() * 0xffffffff);
  }
  return `${year}-${String(random[0] % 1_000_000).padStart(6, "0")}`;
}

function display(value: string, fallback = "________________") {
  return value.trim() || fallback;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function SectionTitle({ number, title, caption }: { number: string; title: string; caption: string }) {
  return <div className="section-title"><span className="section-number">{number}</span><div><h2>{title}</h2><p>{caption}</p></div></div>;
}

function DocumentPreview({ data }: { data: Contract }) {
  const tracks = data.tracks.filter((track) => track.title.trim());
  const objects: Track[] = tracks.length ? tracks : [{
    title: data.workTitle,
    musicAuthor: data.musicAuthor,
    lyricsAuthor: data.lyricsAuthor,
    noLyrics: data.noLyrics,
  }];
  const signatureCaption = "________________ / ФИО";
  const signingSentence = data.signatureMethod === "online"
    ? "Лицензиат формирует экземпляр Договора с факсимильным воспроизведением своей подписи и направляет его Лицензиару. Лицензиар подписывает полученный экземпляр через согласованный онлайн-сервис, позволяющий установить подписанта, содержание документа и момент подписания, после чего направляет подтверждение или подписанный экземпляр Лицензиату. Стороны заранее согласовали такой порядок подписания и обмена документами."
    : data.signatureMethod === "manual"
      ? "Лицензиат формирует экземпляр Договора с факсимильным воспроизведением своей подписи и направляет его Лицензиару. Лицензиар распечатывает экземпляр, подписывает его собственноручно и направляет Лицензиату оригинал или скан-копию подписанного документа. Стороны заранее согласовали такой порядок подписания и обмена документами."
      : "Лицензиат формирует экземпляр Договора с факсимильным воспроизведением своей подписи и направляет его Лицензиару. Лицензиар подписывает полученный экземпляр собственноручно либо через согласованный Сторонами онлайн-сервис, после чего направляет Лицензиату оригинал, скан-копию или подтверждение подписания. Стороны заранее согласовали такой порядок подписания и обмена документами.";
  const signatureMark = <img className="signature-image" src={SIGNATURE_SRC} alt="Факсимильное воспроизведение подписи Марцинкевича Никиты Владимировича" />;
  return <article className="paper" id="document-preview">
    <header className="paper-header"><h1>ЛИЦЕНЗИОННЫЙ ДОГОВОР</h1><div className="paper-contract-number">№ {display(data.contractNumber, "ОБРАЗЕЦ")}</div><div className="paper-meta"><span>г. Омск</span><span>Дата договора: {formatDate(data.contractDate)}</span></div></header>
    <p className="indent"><b>{display(data.licensorName)}</b> (паспорт: {display(data.passportSeriesNumber)}, выдан {display(data.passportIssuedBy)}, дата выдачи {formatDate(data.passportIssueDate)}), именуемый в дальнейшем «Лицензиар», с одной стороны, и {LICENSEE.name}, физическое лицо, именуемый в дальнейшем «Лицензиат», с другой стороны, совместно именуемые «Стороны», заключили настоящий договор о нижеследующем.</p>
    <h3>1. ТЕРМИНЫ И ПРЕДМЕТ ДОГОВОРА</h3><p><b>1.1.</b> Объекты — указанные в Приложении № 1 музыкальные произведения, тексты, исполнения, фонограммы, обложка и относящиеся к релизу метаданные.</p><p><b>1.2.</b> Лицензиар предоставляет Лицензиату исключительную лицензию исключительно в отношении способов цифровой дистрибуции, прямо перечисленных в разделе 2 Договора, а Лицензиат принимает Объекты и выплачивает вознаграждение. Права и способы использования, прямо не указанные в Договоре, Лицензиату не предоставляются.</p><p><b>1.3.</b> Территория использования — все страны мира. Первоначальный срок лицензии составляет четыре года с момента подписания Договора обеими Сторонами.</p>
    <h3>2. СПОСОБЫ ИСПОЛЬЗОВАНИЯ</h3><p><b>2.1.</b> Лицензиат вправе воспроизводить Объекты в объёме, необходимом для загрузки, хранения, кодирования, технической проверки и доставки цифровым платформам.</p><p><b>2.2.</b> Лицензиат вправе распространять цифровые экземпляры, доводить Объекты до всеобщего сведения, предоставлять потоковое прослушивание и скачивание, а также совершать через цифровые платформы и их сервисы иные технически необходимые действия, непосредственно связанные с цифровой дистрибуцией.</p><p><b>2.3.</b> Допускаются техническая адаптация формата и громкости без изменения творческого содержания, включение Объектов в каталоги, плейлисты, пользовательские видео и системы идентификации контента, а также использование обложки, метаданных и фрагментов Объектов продолжительностью до 60 секунд для продвижения релиза.</p><p><b>2.4.</b> Лицензиат вправе выдавать сублицензии цифровым платформам, агрегаторам, дистрибьюторам, организациям по управлению правами и техническим партнёрам только в целях исполнения Договора.</p>
    <h3>3. ПЕРЕДАЧА И РАЗМЕЩЕНИЕ РЕЛИЗА</h3><p><b>3.1.</b> Объекты считаются переданными и принятыми после загрузки через сайт или иную информационную систему Лицензиата и подписания Приложения № 1.</p><p><b>3.2.</b> Срок обработки и подготовки релиза к доставке начинается с момента подписания Договора обеими Сторонами и определяется согласованными условиями. Лицензиат самостоятельно определяет цифровые платформы, дату технической доставки и формат размещения.</p><p><b>3.3.</b> Лицензиат не гарантирует принятие релиза каждой платформой, конкретное количество прослушиваний, редакционную поддержку или размер дохода.</p>
    <h3>4. ВОЗНАГРАЖДЕНИЕ И ОТЧЁТНОСТЬ</h3><p><b>4.1.</b> Доля Лицензиара определена в Дополнительном соглашении, являющемся частью Договора. Минимальная накопленная сумма для выплаты составляет 1 000 (одна тысяча) рублей.</p><p><b>4.2.</b> Вознаграждение рассчитывается от чистых поступлений, фактически полученных Лицензиатом от использования Объектов, после удержанных цифровыми платформами комиссий, налогов, возвратов и расходов на конвертацию валюты.</p><p><b>4.3.</b> По запросу Лицензиара Лицензиат предоставляет отчёт не позднее 30 рабочих дней с даты получения запроса.</p><p><b>4.4.</b> Выплата производится в рублях в течение 30 рабочих дней после получения запроса и достижения установленной минимальной суммы. Остаток ниже порога переносится на следующие периоды.</p>
    <h3>5. ГАРАНТИИ И ПРЕТЕНЗИИ</h3><p><b>5.1.</b> Лицензиар гарантирует, что обладает в полном объёме исключительными имущественными правами на все передаваемые Объекты, включая музыкальные произведения, тексты, исполнения, фонограммы, обложку и иные материалы релиза.</p><p><b>5.2.</b> Указанные права не отчуждены, не заложены и не обременены ранее выданными лицензиями, препятствующими исполнению Договора.</p><p><b>5.3.</b> Лицензиар гарантирует достоверность сведений об авторах и исполнителях, а также законность использованных фонограмм, семплов, текстов, изображений и иных материалов.</p>
    <h3>6. СРОК И ПРЕКРАЩЕНИЕ</h3><p><b>6.1.</b> Обычное одностороннее досрочное расторжение до истечения первоначального четырёхлетнего срока не допускается.</p><p><b>6.2.</b> После первоначального четырёхлетнего срока Договор автоматически продлевается каждый раз на один год, если Лицензиар не направит через систему тикетов уведомление об отказе от продления не позднее чем за 30 календарных дней.</p><p><b>6.3.</b> В уведомлении об отказе от продления Лицензиар указывает выбранный способ прекращения распространения: удаление Объектов либо их перенос к другому дистрибьютору.</p>
    <h3>7. ПОДПИСАНИЕ ДОГОВОРА</h3><p><b>7.1.</b> {signingSentence} Каждый экземпляр, подписанный Стороной, имеет одинаковую юридическую силу в пределах выбранного и согласованного Сторонами способа.</p><p><b>7.2.</b> Стороны признают согласованный обмен оригиналом, скан-копией или подтверждением онлайн-сервиса способом передачи подписанного экземпляра. По требованию любой Стороны оригинал предоставляется другой Стороне.</p><p><b>7.3.</b> Датой договора считается дата его создания, указанная в заголовке документа. Изменения и дополнения оформляются в письменной форме и подписываются обеими Сторонами.</p><p><b>7.4.</b> Факсимильное воспроизведение подписи Лицензиата применяется по предварительному соглашению Сторон о таком порядке подписания.</p>
    <h3>8. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</h3><p><b>8.1.</b> К Договору применяется законодательство Российской Федерации. До обращения в суд Сторона направляет претензию, срок ответа — 15 рабочих дней.</p><p><b>8.2.</b> Персональные данные обрабатываются в объёме, необходимом для заключения и исполнения Договора, расчётов и выполнения требований законодательства.</p><p><b>8.3.</b> Приложение № 1 имеет приоритет в части состава и идентификации Объектов, Дополнительное соглашение — в части условий выплаты, доли Лицензиара и минимальной суммы выплаты.</p>
    <div className="signature-section"><h3>9. РЕКВИЗИТЫ И ПОДПИСИ</h3><div className="signature-grid"><div><span>ЛИЦЕНЗИАР</span><strong>{display(data.licensorName)}</strong><p>Паспорт: {display(data.passportSeriesNumber)}<br />Выдан: {display(data.passportIssuedBy)}<br />Дата выдачи: {formatDate(data.passportIssueDate)}<br />Банковские реквизиты: {display(data.bankDetails)}<br />Email: {display(data.email)}</p><div className="signature-space" /><i>{signatureCaption}</i></div><div><span>ЛИЦЕНЗИАТ</span><strong>{LICENSEE.name}</strong><p>Дата рождения: {LICENSEE.birthDate}<br />Паспорт: {LICENSEE.passport}<br />Выдан: {LICENSEE.passportIssuedBy}<br />Код подразделения: {LICENSEE.passportDivisionCode}<br />Дата выдачи: {LICENSEE.passportIssueDate}<br />Адрес: {LICENSEE.address}<br />ИНН: {LICENSEE.inn}<br />Расчётный счёт: {LICENSEE.account}<br />Банк: {LICENSEE.bank}<br />БИК: {LICENSEE.bik}<br />Город банка: {LICENSEE.bankCity}<br />Корр. счёт: {LICENSEE.correspondentAccount}<br />Email: {LICENSEE.email}</p><div className="signature-space">{signatureMark}</div><i>{signatureCaption} · факсимиле</i></div></div></div>
    <section className="document-section appendix-section"><h1 className="appendix-title">ПРИЛОЖЕНИЕ № 1<br /><small>к договору № {display(data.contractNumber, "ОБРАЗЕЦ")}</small></h1><h2>ПЕРЕЧЕНЬ И АКТ ПЕРЕДАЧИ ОБЪЕКТОВ</h2><p><b>Релиз:</b> {display(data.workTitle)}. <b>Исполнитель:</b> {display(data.pseudonym)}. <b>Тип:</b> {data.releaseType}.</p><table className="objects rights-table"><thead><tr><th>№</th><th>Название и версия</th><th>Исполнители</th><th>Автор текста</th><th>Автор музыки</th><th>Смежные права</th><th>Авторские права</th></tr></thead><tbody>{objects.map((track, index) => <tr key={`${track.title}-${index}`}><td>{index + 1}</td><td>{display(track.title, "Название трека")}</td><td>{display(data.pseudonym)}</td><td>{track.noLyrics ? "Инструментал" : display(track.lyricsAuthor)}</td><td>{display(track.musicAuthor)}</td><td>100%</td><td>100%</td></tr>)}</tbody></table><p><b>1.</b> Лицензиар передал, а Лицензиат принял перечисленные Объекты и сведения о них через информационную систему Лицензиата.</p><p><b>2.</b> Лицензиар подтверждает достоверность перечня и принадлежность ему прав, необходимых для предоставления лицензии по Договору.</p><p><b>3.</b> Приложение составлено в письменной форме и является неотъемлемой частью Договора.</p></section>
    <section className="document-section addendum-section"><h1 className="appendix-title">ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ<br /><small>к договору № {display(data.contractNumber, "ОБРАЗЕЦ")}</small></h1><p><b>1.</b> Для релиза «{display(data.workTitle)}» применяются индивидуальные условия.</p><p><b>2.</b> Вознаграждение Лицензиара составляет <b>{data.artistShare}%</b> чистых поступлений, рассчитанных в соответствии с разделом 4 Договора.</p><p><b>3.</b> Минимальная накопленная сумма для выплаты составляет <b>1 000 (одна тысяча) рублей</b>.</p><p><b>4.</b> Невыплаченный остаток сохраняется за Лицензиаром и переносится на следующие расчётные периоды.</p><div className="signature-section"><div className="signature-grid"><div><span>ЛИЦЕНЗИАР</span><strong>{display(data.licensorName)}</strong><div className="signature-space" /><i>{signatureCaption}</i></div><div><span>ЛИЦЕНЗИАТ</span><strong>{LICENSEE.name}</strong><div className="signature-space">{signatureMark}</div><i>{signatureCaption} · факсимиле</i></div></div></div></section>
  </article>;
}

export default function Home() {
  const [data, setData] = useState<Contract>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const today = currentDate();
    let saved: Partial<Contract> = {};
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object") saved = parsed as Partial<Contract>;
    } catch { /* Ignore an invalid local draft and use the blank contract. */ }
    const hydrateTimeout = window.setTimeout(() => {
      const savedTariff = typeof saved.tariff === "string" ? saved.tariff.trim() : "";
      const oldPreset = ["Премиум", "Стандарт", "Базовый", "Индивидуальные условия"].includes(savedTariff);
      const savedNumber = typeof saved.contractNumber === "string" ? saved.contractNumber.trim() : "";
      const contractNumber = /^\d{4}-\d{6}$/.test(savedNumber) ? savedNumber : generateContractNumber();
      const savedCreatedAt = typeof saved.createdAt === "string" ? saved.createdAt.trim() : "";
      const createdAt = savedCreatedAt || new Date().toISOString();
      const contractDate = savedCreatedAt ? (saved.contractDate || today) : today;
      setData({ ...initial, ...saved, createdAt, tariff: oldPreset ? "" : savedTariff, contractDate, contractNumber, tracks: normalizeTracks(saved.tracks, saved) });
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrateTimeout);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => { window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data)); }, 350);
    return () => window.clearTimeout(timeout);
  }, [data, hydrated]);
  const update = <K extends keyof Contract>(key: K, value: Contract[K]) => setData((current) => ({ ...current, [key]: value }));
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const resetDocument = () => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setData({ ...initial, createdAt: new Date().toISOString(), contractDate: currentDate(), contractNumber: generateContractNumber() });
    showToast("Все поля очищены, создан новый номер документа");
  };
  const printDocument = () => {
    const preview = document.getElementById("document-preview");
    if (!preview) return;
    const printable = window.open("", "_blank");
    if (!printable) { showToast("Разрешите всплывающие окна, чтобы сохранить PDF"); return; }
    printable.opener = null;
    const html = preview.outerHTML.replaceAll(`src="${SIGNATURE_SRC}"`, `src="${new URL(SIGNATURE_SRC, window.location.href).href}"`);
    printable.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Договор № ${data.contractNumber}</title><style>@page{size:A4;margin:10mm 18mm 14mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#292a2d;font:10pt/1.56 Georgia,serif}.paper{width:100%;box-shadow:none}.paper-header{text-align:center;padding:0 0 12px}.paper h1{font-size:17pt;margin:0}.paper-contract-number{text-align:center;margin-top:8px}.paper-meta{display:flex;justify-content:space-between;font-size:9pt;margin:18px 0}.paper p{margin:8px 0}.paper h3{font-size:11pt;margin:21px 0 7px}.document-section{break-before:page;page-break-before:always}.addendum-section{break-inside:avoid;page-break-inside:avoid}.objects{border-collapse:collapse;width:100%;font-size:9pt;margin:13px 0;table-layout:fixed}.objects th,.objects td{border:1px solid #aaa;padding:5px 6px;text-align:left;overflow-wrap:anywhere}.objects th{background:#f1eee5}.rights-table{font-size:7pt}.rights-table th,.rights-table td{padding:4px 3px}.signature-section,.signature-grid{break-inside:avoid;page-break-inside:avoid}.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:42px;font-size:9pt}.signature-grid span,.signature-grid strong,.signature-grid i{display:block}.signature-grid strong{margin:11px 0 18px;min-height:24px}.signature-space{min-height:56px;display:flex;align-items:flex-end;margin-top:20px;margin-bottom:8px}.signature-image{display:block;width:130px;height:56px;object-fit:contain;object-position:left bottom;margin:0 0 4px}.signature-grid i{border-top:1px solid #777;padding-top:5px;font-style:normal}</style></head><body>${html}</body></html>`);
    printable.document.close();
    printable.focus();
    printable.onafterprint = () => printable.close();
    window.setTimeout(() => printable.print(), 250);
  };
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark">FTL COMPANY</div></div><div className="top-actions"><button className="ghost-button" onClick={resetDocument}>Сбросить всё</button><button className="primary-button" onClick={printDocument}>Скачать PDF</button></div></header>
    <div className="workspace">
      <section className="form-column">
        <section className="form-section" id="objects"><SectionTitle number="01" title="Объекты договора" caption="Название релиза и треки для Приложения № 1" /><div className="form-grid two"><Field label="Название релиза" value={data.workTitle} onChange={(value) => update("workTitle", value)} placeholder="Например, Последний танец" /><Field label="Исполнитель / псевдоним" value={data.pseudonym} onChange={(value) => update("pseudonym", value)} placeholder="Как указать в договоре" /><label className="field"><span>Тип релиза</span><select value={data.releaseType} onChange={(event) => update("releaseType", event.target.value)}><option>Сингл</option><option>EP</option><option>Альбом</option></select></label></div><div className="tracks-block"><div className="subhead"><div><b>Перечень треков</b><span>Для сингла оставьте одну строку; для EP и альбома добавьте остальные.</span></div><button className="text-button" onClick={() => update("tracks", [...data.tracks, { title: "", musicAuthor: "", lyricsAuthor: "", noLyrics: false }])}>+ Добавить трек</button></div>{data.tracks.map((track, index) => <div className="track-entry" key={index}><div className="track-row simple"><span className="track-index">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Название трека ${index + 1}`} placeholder="Название трека" value={track.title} onChange={(event) => update("tracks", data.tracks.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} />{data.tracks.length > 1 && <button className="remove-button" onClick={() => update("tracks", data.tracks.filter((_, i) => i !== index))}>×</button>}</div><div className="track-authors"><input className="track-inline-input" aria-label={`Автор музыки трека ${index + 1}`} placeholder="Автор музыки / композитор" value={track.musicAuthor} onChange={(event) => update("tracks", data.tracks.map((item, i) => i === index ? { ...item, musicAuthor: event.target.value } : item))} /><input className="track-inline-input" aria-label={`Автор текста трека ${index + 1}`} placeholder="Автор текста" value={track.lyricsAuthor} onChange={(event) => update("tracks", data.tracks.map((item, i) => i === index ? { ...item, lyricsAuthor: event.target.value } : item))} /><label className="check small"><input type="checkbox" checked={track.noLyrics} onChange={(event) => update("tracks", data.tracks.map((item, i) => i === index ? { ...item, noLyrics: event.target.checked } : item))} /><span>Инструментал</span></label></div></div>)}</div></section>
        <section className="form-section" id="licensor"><SectionTitle number="02" title="Лицензиар" caption="Паспортные данные правообладателя — физического лица" /><div className="form-grid two"><Field label="ФИО полностью" value={data.licensorName} onChange={(value) => update("licensorName", value)} placeholder="Иванов Иван Иванович" /><Field label="Серия и номер паспорта" value={data.passportSeriesNumber} onChange={(value) => update("passportSeriesNumber", value)} placeholder="0000 000000" /><Field label="Кем выдан паспорт" value={data.passportIssuedBy} onChange={(value) => update("passportIssuedBy", value)} placeholder="Отделом МВД России..." /><Field label="Дата выдачи" type="date" value={data.passportIssueDate} onChange={(value) => update("passportIssueDate", value)} /></div><div className="privacy-note"><span>i</span><p>Паспортные данные используются только в реквизитах договора.</p></div></section>
        <section className="form-section" id="terms"><SectionTitle number="03" title="Условия выплаты" caption="Укажите долю Лицензиара вручную" /><div className="form-grid two"><Field label="Название условия (необязательно)" value={data.tariff} onChange={(value) => update("tariff", value)} placeholder="Например, индивидуальные условия" /><label className="field"><span>Доля Лицензиара, %</span><input type="number" min="0" max="100" step="0.01" value={data.artistShare} onChange={(event) => update("artistShare", Number(event.target.value))} placeholder="0–100" /></label></div><div className="tariff-row"><div><span className="mini-label">В Дополнительном соглашении</span><strong>{data.tariff || "Индивидуальные условия"} · {data.artistShare}% чистых поступлений</strong></div><span className="term-note">Процент вводится вручную</span></div></section>
        <section className="form-section" id="details"><SectionTitle number="04" title="Реквизиты" caption="Данные Лицензиара из раздела 9 договора" /><Field label="Электронная почта" type="email" value={data.email} onChange={(value) => update("email", value)} placeholder="you@example.com" /><label className="field full"><span>Банковские реквизиты / номер карты</span><textarea value={data.bankDetails} onChange={(event) => update("bankDetails", event.target.value)} placeholder="Укажите способ получения вознаграждения" rows={3} /></label><label className="field full"><span>Порядок подписания Лицензиаром</span><select value={data.signatureMethod} onChange={(event) => update("signatureMethod", event.target.value as SignatureMethod)}><option value="manual">{SIGNATURE_METHOD_LABELS.manual}</option><option value="facsimile">{SIGNATURE_METHOD_LABELS.facsimile}</option><option value="online">{SIGNATURE_METHOD_LABELS.online}</option></select></label><p className="signature-legal-note">Лицензиат направляет договор с факсимильной подписью. Лицензиар возвращает оригинал или скан подписанного документа либо использует согласованный онлайн-сервис с фиксацией личности, документа и времени подписания.</p><div className="form-footer"><div><span className="secure-icon">✓</span><span>Проверьте данные перед подписанием<br /><small>Договор формируется только в PDF</small></span></div><button className="primary-button large" onClick={printDocument}>Скачать PDF <span>↓</span></button></div></section>
      </section>
      <aside className="preview-column"><div className="preview-frame"><DocumentPreview data={data} /></div></aside>
    </div>{toast && <div className="toast">✓ {toast}</div>}
  </main>;
}
