const socket = io();

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("location", { latitude, longitude }); // Emit "location" event
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
}

// Initialize the map with a default view
const map = L.map("map").setView([0, 0], 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "practice",
}).addTo(map);

// Track all markers by user ID
const markers = {};

// Store user's own position to avoid resetting the map view constantly
let ownMarker = null;

// Function to add offset to the latitude and longitude
const addOffset = (latitude, longitude, id) => {
  const OFFSET = 0.0001; // Adjust this value for desired offset
  const offsetLatitude = latitude + (id % 2 === 0 ? OFFSET : -OFFSET); // Alternate between adding and subtracting
  return { latitude: offsetLatitude, longitude };
};

socket.on("location", (data) => {
  const { id, latitude, longitude } = data;
  
  // Only pan the map to the user's own location, not other users' locations
  if (id === socket.id) {
    if (ownMarker) {
      ownMarker.setLatLng([latitude, longitude]);
    } else {
      ownMarker = L.marker([latitude, longitude], { title: "You" }).addTo(map);
    }
    // Smoothly pan to user's location instead of resetting view
    map.panTo([latitude, longitude], { animate: true });
  } else {
    // Apply offset for other users
    const { latitude: offsetLat, longitude: offsetLng } = addOffset(latitude, longitude, id);
    
    // Update existing markers or create a new one for other users
    if (markers[id]) {
      markers[id].setLatLng([offsetLat, offsetLng]); // Update marker position
    } else {
      markers[id] = L.marker([offsetLat, offsetLng], { title: `User ${id}` }).addTo(map); // Create new marker
    }
  }
});

// Remove the marker when a user disconnects
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

// Listen for the disconnect event to notify the server
socket.on("disconnect", () => {
  socket.emit("user-disconnected", socket.id);
});
