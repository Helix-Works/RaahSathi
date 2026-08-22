import { dictionaries } from "@/i18n";

export default function Home() {
  const english = dictionaries.en.landing;
  const hindi = dictionaries.hi.landing;

  return (
    <main className="page-shell">
      <section className="intro-card" aria-labelledby="page-title">
        <div className="mark" aria-hidden="true">
          RS
        </div>
        <div>
          <p className="eyebrow">Delhi · Hackathon proof of concept</p>
          <h1 id="page-title">{english.name}</h1>
          <p className="lede">{english.tagline}</p>
        </div>

        <div className="notice" role="note">
          <p>{english.prototypeNotice}</p>
          <p>{english.independenceNotice}</p>
        </div>

        <div className="hindi-copy" lang="hi" aria-label="हिंदी में जानकारी">
          <p className="eyebrow">हिंदी</p>
          <h2>{hindi.name}</h2>
          <p>{hindi.tagline}</p>
          <p className="hindi-notice">
            {hindi.prototypeNotice} {hindi.independenceNotice}
          </p>
        </div>
      </section>
    </main>
  );
}
