"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Suggestion = {
  id: string;
  name: string;
  label: string;
  secondaryText: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type AddressAutocompleteProps = {
  onSelect: (place: Suggestion) => void;
  placeholder?: string;
};

export function AddressAutocomplete({ onSelect, placeholder = "Où souhaitez-vous être livré ?" }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    setOpen(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?query=${encodeURIComponent(trimmed)}`);
        const json = await res.json().catch(() => ({ results: [] }));
        setSuggestions((json.results ?? []).map((r: Suggestion) => r));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(place: Suggestion) {
    setQuery(place.label);
    setSuggestions([]);
    setOpen(false);
    onSelect(place);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="shrink-0 text-dalle-orange" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full"
        />
      </div>
      {open && (
        <Card className="absolute z-40 mt-1 w-full max-w-xl overflow-hidden border shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-500">
              <Loader2 size={16} className="animate-spin" />
              Recherche en cours…
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-72 overflow-auto">
              {suggestions.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(place)}
                    className="w-full px-4 py-3 text-left transition hover:bg-orange-50"
                  >
                    <p className="text-sm font-bold">{place.label}</p>
                    <p className="text-xs text-neutral-500">{place.secondaryText}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 3 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">
              Aucun résultat pour “{query.trim()}”. Tapez un quartier, une ville ou un lieu proche.
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">
              Tapez au moins 3 lettres pour voir les suggestions.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
