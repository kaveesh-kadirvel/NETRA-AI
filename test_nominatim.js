const url = "https://nominatim.openstreetmap.org/search?format=json&q=Mumbai";
fetch(url, { headers: { 'User-Agent': 'NETRA_AI_Hackathon_Bot/1.0' }})
  .then(r => r.json())
  .then(data => console.log("Success, lat:", data[0].lat))
  .catch(console.error);
