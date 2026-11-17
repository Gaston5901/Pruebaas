/*
  ACÁ SE CONFIGURA TODO.
  - src: nombre del archivo mp3 que vas a dejar en esta misma carpeta.
  - title / artist: lo que se muestra.
  - mood: "night", "rain", "sunset" o "aurora" (elige la animación de fondo).
  - theme: los colores de esa canción.
  - lyrics: la letra. Cada línea puede tener un tiempo "t" en segundos
    para que se vaya iluminando sola. Si no sabés el tiempo, podés dejar
    solo { text: "..." } y se muestra como texto.
*/

window.SONGS = [
  {
    title: "Canción 1",
    artist: "Elegí el título",
    src: "cancion1.mp3",
    mood: "night",
    theme: {
      bgTop: "#050817",
      bgBottom: "#0a1030",
      glow1: "rgba(88,101,242,0.50)",
      glow2: "rgba(45,212,191,0.28)",
      accent: "#a5b4fc",
      accent2: "#67e8f9",
      text: "#e8ecff"
    },
    lyrics: [
      // { t: 0.0,  text: "Primera línea de la letra" },
      // { t: 6.5,  text: "Segunda línea de la letra" },
      // { t: 12.0, text: "Tercera línea de la letra" },
    ]
  },
  {
    title: "Canción 2",
    artist: "Elegí el título",
    src: "cancion2.mp3",
    mood: "rain",
    theme: {
      bgTop: "#080711",
      bgBottom: "#140a24",
      glow1: "rgba(168,85,247,0.45)",
      glow2: "rgba(34,211,238,0.25)",
      accent: "#d8b4fe",
      accent2: "#67e8f9",
      text: "#f1e9ff"
    },
    lyrics: []
  },
  {
    title: "Canción 3",
    artist: "Elegí el título",
    src: "cancion3.mp3",
    mood: "sunset",
    theme: {
      bgTop: "#14060f",
      bgBottom: "#2a0d1e",
      glow1: "rgba(251,113,133,0.45)",
      glow2: "rgba(251,191,36,0.28)",
      accent: "#fda4af",
      accent2: "#fcd34d",
      text: "#ffeff4"
    },
    lyrics: []
  },
  {
    title: "Canción 4",
    artist: "Elegí el título",
    src: "cancion4.mp3",
    mood: "aurora",
    theme: {
      bgTop: "#04100f",
      bgBottom: "#061a1c",
      glow1: "rgba(45,212,191,0.40)",
      glow2: "rgba(129,140,248,0.30)",
      accent: "#5eead4",
      accent2: "#a5b4fc",
      text: "#e6fffb"
    },
    lyrics: []
  }
];
