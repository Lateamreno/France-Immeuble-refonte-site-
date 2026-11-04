"use client";

import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { EstimationForm } from "./EstimationForm";

/**
 * Le formulaire de la page Contact (retour #71, MAV, 02/11/2026) : acheter,
 * vendre ou autre. Choisir « vendre » ouvre le formulaire de vente habituel,
 * avec les mêmes étapes : le vendeur arrive au BO comme une demande de vente,
 * pas comme un simple message.
 */
export function ContactProjet() {
  const [vendre, setVendre] = useState(false);
  if (vendre) {
    return (
      <div className="contact-vendre">
        <h2>Vendre votre immeuble</h2>
        <p className="contact-vendre__intro">Quelques questions sur l’immeuble et sur vous, pour préparer son estimation.</p>
        <EstimationForm formulaire="vendre" />
        <button type="button" className="lien-discret contact-vendre__retour" onClick={() => setVendre(false)}>
          Je ne vends pas : écrire un message
        </button>
      </div>
    );
  }
  return (
    <div className="contact-projet">
      {/* Retours #173 et #181 : un titre qui pousse à écrire, dans le cadre du formulaire. */}
      <ContactForm titre="Échangeons sur votre projet" onVendre={() => setVendre(true)} />
    </div>
  );
}
