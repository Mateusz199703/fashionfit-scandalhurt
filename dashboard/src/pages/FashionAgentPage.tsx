import React from 'react';

const PREVIEW_MESSAGES = [
  { role: 'assistant', text: 'Cześć! 👋 Jestem Lume. Powiedz, na jaką okazję szukasz stylizacji?' },
  { role: 'user', text: 'Letnie wesele, ale nie wiem, jaki krój na mnie pasuje 😅' },
  { role: 'assistant', text: 'Pomogę dobrać coś, co podkreśli sylwetkę. Wolisz styl romantyczny, elegancki czy minimalistyczny?' },
  { role: 'user', text: 'Romantyczny, ale nie przesadnie' },
  { role: 'assistant', text: 'Idealnie. Zebrałam look, który maskuje i podkreśla talię. Rozmiar M będzie trafny 👇' },
];

export function FashionAgentPage() {
  return (
    <div className="ff-agent-page">
      <div className="ff-agent-grid">
        <section className="card ff-agent-copy">
          <p className="ff-agent-eyebrow">AGENT MODY</p>
          <h1>Rozmowa, która kończy się zakupem</h1>
          <p className="ff-agent-lead">
            Konwersacyjny stylista wbudowany w sklep. Prowadzi klientkę od pytania do kompletnej stylizacji,
            rekomendacji produktu i trafnego rozmiaru.
          </p>

          <ul className="ff-agent-features">
            <li>
              <b>Ton jak prawdziwy stylista</b>
              <span>Ciepły, konkretny, nigdy nachalny.</span>
            </li>
            <li>
              <b>Produkty w rozmowie</b>
              <span>Kafelki produktów z ceną, rozmiarem i dopasowaniem.</span>
            </li>
            <li>
              <b>Szybkie odpowiedzi</b>
              <span>Chipy prowadzą rozmowę bez pisania od zera.</span>
            </li>
          </ul>
        </section>

        <section className="card ff-agent-chat-preview" aria-label="Podgląd rozmowy Lume">
          <header className="ff-agent-chat-head">
            <div className="ff-agent-chat-profile">
              <span className="ff-agent-core" aria-hidden="true" />
              <div>
                <b>Lume · stylista AI</b>
                <span><i />Online · odpowiada od razu</span>
              </div>
            </div>
            <button type="button" className="ff-agent-menu" disabled aria-disabled="true" aria-label="Menu podglądu">
              ⋯
            </button>
          </header>

          <div className="ff-agent-chat-day">Dzisiaj</div>

          <div className="ff-agent-chat-list">
            {PREVIEW_MESSAGES.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ff-agent-chat-row ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
              >
                <div className="ff-agent-chat-bubble">{message.text}</div>
              </div>
            ))}
          </div>

          <div className="ff-agent-chat-compose">
            <input type="text" placeholder="Napisz wiadomość…" disabled aria-disabled="true" />
            <button type="button" disabled aria-disabled="true" aria-label="Mikrofon">🎤</button>
            <button type="button" className="send" disabled aria-disabled="true" aria-label="Wyślij">➤</button>
          </div>

          <footer className="ff-agent-chat-foot">Napędzane przez FashionFit AI · zgodne z RODO</footer>
        </section>
      </div>

      <div className="ff-agent-note">Podgląd statyczny modułu. Widok rozmowy nie wykonuje połączeń API.</div>
    </div>
  );
}
