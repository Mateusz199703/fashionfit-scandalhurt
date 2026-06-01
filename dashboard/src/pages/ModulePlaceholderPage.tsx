import React from 'react';

type ModulePlaceholderPageProps = {
  title: string;
  description: string;
};

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <>
      <section className="pagehead">
        <div>
          <h1>{title}</h1>
          <div className="sub">Ten moduł jest przygotowywany w FashionFit Studio.</div>
        </div>
      </section>

      <section className="card ff-module-placeholder">
        <div className="ch">
          <h3>Wkrótce dostępne</h3>
          <span className="tag">placeholder</span>
        </div>
        <p className="ff-module-placeholder-copy">{description}</p>
        <div className="empty">
          Ten ekran ma charakter informacyjny i nie prezentuje danych produkcyjnych.
        </div>
      </section>
    </>
  );
}
