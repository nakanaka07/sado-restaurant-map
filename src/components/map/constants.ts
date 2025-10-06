// Map related constants used by non-component code

// Safe default for Google Maps control position when SDK isn't ready yet
export const DEFAULT_CONTROL_POSITION: number =
  (typeof window !== "undefined"
    ? (
        window as unknown as {
          google?: { maps?: { ControlPosition?: { BOTTOM_LEFT?: number } } };
        }
      ).google?.maps?.ControlPosition?.BOTTOM_LEFT
    : undefined) ?? 10;
