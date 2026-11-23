"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Le côté navigateur de `src/lib/anti-robots.ts` : le jeton demandé à l'ouverture du formulaire, et le
 * champ piège. `champs()` les ajoute à l'envoi ; sans jeton (réseau coupé à l'ouverture, page ouverte
 * depuis plus de 20 heures), il en redemande un avant d'envoyer.
 */
const VALIDITE_MS = 20 * 3600_000;

async function demander(): Promise<string | undefined> {
  try {
    const r = await fetch("/api/lead/jeton/", { cache: "no-store" });
    if (!r.ok) return undefined;
    const d = (await r.json()) as { j?: string | null };
    return d.j ?? undefined;
  } catch {
    return undefined;
  }
}

export function useAntiRobots() {
  const jeton = useRef<{ j?: string; le: number }>({ le: 0 });
  const piege = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let vivant = true;
    void demander().then((j) => { if (vivant && j) jeton.current = { j, le: Date.now() }; });
    return () => { vivant = false; };
  }, []);
  async function champs(): Promise<{ jeton?: string; site?: string }> {
    if (!jeton.current.j || Date.now() - jeton.current.le > VALIDITE_MS) {
      const j = await demander();
      if (j) jeton.current = { j, le: Date.now() };
    }
    const site = piege.current?.value.trim();
    return { jeton: jeton.current.j, ...(site ? { site } : {}) };
  }
  return { piege, champs };
}

/** Le champ piège : hors de l'écran, hors du clavier, ignoré par les lecteurs d'écran. */
export function ChampPiege({ refChamp }: { refChamp: RefObject<HTMLInputElement | null> }) {
  return (
    <div className="champ-piege" aria-hidden="true">
      <label>
        Ne pas remplir ce champ
        <input ref={refChamp} type="text" name="fi_site_web" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
