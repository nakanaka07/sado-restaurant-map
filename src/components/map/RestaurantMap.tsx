import { Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import type { Restaurant } from "@/types";

interface RestaurantMapProps {
  restaurants: readonly Restaurant[];
  center: { lat: number; lng: number };
  loading: boolean;
  error?: string | null;
}

export function RestaurantMap({
  restaurants,
  center,
  loading,
}: RestaurantMapProps) {
  if (loading) {
    return (
      <div className="map-loading">
        <p>地図を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="map-container" style={{ width: "100%", height: "500px" }}>
      <Map
        defaultCenter={center}
        defaultZoom={10}
        mapId="sado-restaurant-map"
        style={{ width: "100%", height: "100%" }}
      >
        {restaurants.map((restaurant) => (
          <AdvancedMarker
            key={restaurant.id}
            position={restaurant.coordinates}
            title={restaurant.name}
          >
            <Pin background="#ff6b6b" borderColor="#fff" glyphColor="#fff" />
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
}
