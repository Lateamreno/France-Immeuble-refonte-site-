"use client";

import { useState } from "react";

/** La photo de l'agent, servie par le site ; ses initiales si elle manque. */
export function PhotoAgent({ initiales, photo }: { initiales: string; photo: boolean }) {
  const [rate, setRate] = useState(false);
  if (!photo || rate) return <span className="carte-agent__initiales" aria-hidden="true">{initiales}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="carte-agent__photo" src="/api/compte/photo-agent/" alt="" width={58} height={58} onError={() => setRate(true)} />
  );
}
