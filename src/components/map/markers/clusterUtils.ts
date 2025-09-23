import type { Restaurant } from "../../../types";

export interface ClusterData {
  id: string;
  count: number;
  restaurants: Restaurant[];
  position: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export const calculatePixelDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
  zoomLevel: number
): number => {
  const pixelsPerDegree = (256 * Math.pow(2, zoomLevel)) / 360;
  const deltaLat = Math.abs(coord1.lat - coord2.lat) * pixelsPerDegree;
  const deltaLng =
    Math.abs(coord1.lng - coord2.lng) *
    pixelsPerDegree *
    Math.cos((coord1.lat * Math.PI) / 180);
  return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
};

export const generateClusters = (
  restaurants: Restaurant[],
  clusterDistance: number = 50,
  zoomLevel: number = 10
): ClusterData[] => {
  const adjustedDistance = (clusterDistance * (21 - zoomLevel)) / 21;
  const clusters: ClusterData[] = [];
  const processed = new Set<string>();

  restaurants.forEach(restaurant => {
    if (processed.has(restaurant.id)) return;

    const clusterRestaurants = [restaurant];
    processed.add(restaurant.id);

    restaurants.forEach(otherRestaurant => {
      if (processed.has(otherRestaurant.id)) return;

      const distance = calculatePixelDistance(
        restaurant.coordinates,
        otherRestaurant.coordinates,
        zoomLevel
      );

      if (distance < adjustedDistance) {
        clusterRestaurants.push(otherRestaurant);
        processed.add(otherRestaurant.id);
      }
    });

    const centerLat =
      clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lat, 0) /
      clusterRestaurants.length;
    const centerLng =
      clusterRestaurants.reduce((sum, r) => sum + r.coordinates.lng, 0) /
      clusterRestaurants.length;

    const bounds = clusterRestaurants.reduce(
      (bounds, r) => ({
        north: Math.max(bounds.north, r.coordinates.lat),
        south: Math.min(bounds.south, r.coordinates.lat),
        east: Math.max(bounds.east, r.coordinates.lng),
        west: Math.min(bounds.west, r.coordinates.lng),
      }),
      {
        north: -90,
        south: 90,
        east: -180,
        west: 180,
      }
    );

    clusters.push({
      id: `cluster-${restaurant.id}-${clusterRestaurants.length}`,
      count: clusterRestaurants.length,
      restaurants: clusterRestaurants,
      position: { lat: centerLat, lng: centerLng },
      bounds,
    });
  });

  return clusters;
};
