import { Map } from "@vis.gl/react-google-maps";

export function SimpleMapTest() {
  return (
    <div
      style={{
        width: "100%",
        height: "300px",
        border: "2px solid #8b5cf6",
        background: "#fdf4ff",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <h3
        style={{
          margin: "10px",
          color: "#7c3aed",
          fontSize: "18px",
          textAlign: "center",
        }}
      >
        🧪 シンプル地図テスト
      </h3>
      <div
        style={{
          width: "calc(100% - 20px)",
          height: "250px",
          margin: "0 10px 10px 10px",
          border: "1px solid #c4b5fd",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <Map
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
          style={{ width: "100%", height: "100%" }}
          defaultCenter={{ lat: 38.018611, lng: 138.367222 }}
          defaultZoom={10}
          gestureHandling="greedy"
        />
      </div>
    </div>
  );
}
