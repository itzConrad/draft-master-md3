import { X } from "lucide-react";
import { MAP_IMAGES, type MapName } from "@/lib/maps";
import { cn } from "@/lib/utils";

export type MapCardStatus = "disponivel" | "banido" | "pick" | "decider";

interface Props {
  mapa: MapName;
  status: MapCardStatus;
  pickLabel?: string; // "Mapa 1" | "Mapa 2" | "Decider"
  banidoPor?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MapCard({ mapa, status, pickLabel, banidoPor, onClick, disabled }: Props) {
  const clickable = status === "disponivel" && !disabled;

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      aria-disabled={!clickable}
      aria-label={`${mapa} - ${status}`}
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted text-left transition-all",
        clickable && "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:border-[var(--gold)]",
        !clickable && "cursor-not-allowed",
        status === "pick" && "ring-4 ring-[var(--gold)] border-transparent",
        status === "decider" && "shadow-[0_0_24px_4px_var(--navy)] border-[var(--navy)]",
      )}
    >
      <img
        src={MAP_IMAGES[mapa]}
        alt={mapa}
        loading="lazy"
        className={cn(
          "h-full w-full object-cover transition-all",
          status === "banido" && "grayscale brightness-50",
        )}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Gradient + name */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
        <h3 className="text-lg font-bold uppercase tracking-wider text-white">{mapa}</h3>
      </div>

      {status === "banido" && (
        <>
          <div className="absolute inset-0 bg-red-600/40" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center">
            <X className="h-20 w-20 stroke-[3] text-white drop-shadow-lg" />
          </div>
          {banidoPor && (
            <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
              Ban: {banidoPor}
            </div>
          )}
        </>
      )}

      {(status === "pick" || status === "decider") && pickLabel && (
        <div
          className={cn(
            "absolute left-2 top-2 rounded px-2 py-1 text-xs font-bold uppercase tracking-wide",
            status === "pick" && "bg-[var(--gold)] text-black",
            status === "decider" && "bg-[var(--navy)] text-[var(--gold)]",
          )}
        >
          {pickLabel}
        </div>
      )}
    </button>
  );
}