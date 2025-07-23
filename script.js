const pokemonImage = document.getElementById("pokemon-image");
const guessForm = document.getElementById("guess-form");
const guessInput = document.getElementById("guess-input");
const hintButton = document.getElementById("hint-button");
const message = document.getElementById("message");
const scoreElement = document.getElementById("score");
const giveUpButton = document.getElementById("give-up-button");
const resultMessage = document.getElementById("result-message");
const hintInfo = document.getElementById("hint-info");
const backToStartButton = document.getElementById("back-to-start-button");

const generationScreen = document.getElementById("generation-screen");
const generationForm = document.getElementById("generation-form");
const difficultyScreen = document.getElementById("difficulty-screen");
const gameContainer = document.getElementById("game-container");

let hasGivenUp = false;
let currentPokemon = null;
let score = 0;
let revealedLetters = [];
let usedHints = 0;
let maxHints = 3;
let difficulty = "hard";
let selectedGenerations = [];

const generationRanges = [
  { generation: 1, min: 1, max: 151, region: "Kanto" },
  { generation: 2, min: 152, max: 251, region: "Johto" },
  { generation: 3, min: 252, max: 386, region: "Hoenn" },
  { generation: 4, min: 387, max: 493, region: "Sinnoh" },
  { generation: 5, min: 494, max: 649, region: "Unova" },
  { generation: 6, min: 650, max: 721, region: "Kalos" },
  { generation: 7, min: 722, max: 809, region: "Alola" },
  { generation: 8, min: 810, max: 905, region: "Galar" },
  { generation: 9, min: 906, max: 1025, region: "Paldea" },
];

function getGenerationAndRegion(id) {
  const range = generationRanges.find(r => id >= r.min && id <= r.max);
  return range ? { generation: range.generation, region: range.region } : { generation: null, region: "Desconocida" };
}

function getValidIdsFromSelectedGenerations() {
  let ids = [];
  for (const gen of selectedGenerations) {
    const range = generationRanges.find(r => r.generation === parseInt(gen));
    if (range) {
      for (let i = range.min; i <= range.max; i++) {
        ids.push(i);
      }
    }
  }
  return ids;
}

function updateHintDisplay() {
  message.textContent = `${revealedLetters.join(" ").toUpperCase()}`;
}

async function fetchRandomPokemon() {
  const validIds = getValidIdsFromSelectedGenerations();
  const randomId = validIds[Math.floor(Math.random() * validIds.length)];

  pokemonImage.style.display = 'none';
  document.getElementById('loader').style.display = 'block';

  try {
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const pokemonData = await pokemonResponse.json();
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`);
    const speciesData = await speciesResponse.json();
    const { region } = getGenerationAndRegion(randomId);

    currentPokemon = {
      name: pokemonData.name,
      image: pokemonData.sprites.front_default,
      region: region
    };

    revealedLetters = Array(currentPokemon.name.length).fill('_');
    updateHintDisplay();

    resultMessage.textContent = '';
    hintInfo.textContent = '';
    guessInput.value = '';
    hasGivenUp = false;

    pokemonImage.src = currentPokemon.image || 'https://via.placeholder.com/180';
    pokemonImage.onload = () => {
      document.getElementById('loader').style.display = 'none';
      pokemonImage.style.display = 'block';
      pokemonImage.classList.remove('revealed', 'flash', 'shake');
    };

    usedHints = 0;
    hintButton.disabled = false;
    const counter = document.getElementById("hint-counter");
    if (counter) counter.textContent = `Pistas usadas: ${usedHints} / ${maxHints}`;
  } catch (error) {
    console.error('Error al obtener Pokémon:', error);
    message.textContent = 'Error al cargar el Pokémon. Intenta de nuevo.';
    document.getElementById('loader').style.display = 'none';
  }
}

guessForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userGuess = guessInput.value.trim().toLowerCase();

  if (userGuess === currentPokemon.name) {
    correctSound.play();
    revealedLetters = currentPokemon.name.split("");
    updateHintDisplay();
    message.textContent = `¡Correcto! Es ${currentPokemon.name.charAt(0).toUpperCase() + currentPokemon.name.slice(1)}!`;
    pokemonImage.classList.add("revealed", "flash");
    score++;
    scoreElement.textContent = `Aciertos: ${score}`;
    setTimeout(fetchRandomPokemon, 2000);
  } else {
    wrongSound.volume = 0.2;
    wrongSound.play();
    message.textContent = "¡Incorrecto! Intenta de nuevo.";
    pokemonImage.classList.add("shake");
    setTimeout(() => pokemonImage.classList.remove("shake"), 300);
  }
});

hintButton.addEventListener("click", () => {
  if (difficulty === "hard" && usedHints >= maxHints) return;

  const hiddenIndices = revealedLetters.map((char, i) => (char === "_" ? i : null)).filter(i => i !== null);

  if (hiddenIndices.length === 0) {
    updateHintDisplay();
    hintInfo.textContent = "No hay más pistas disponibles.";
    return;
  }

  const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
  revealedLetters[randomIndex] = currentPokemon.name.charAt(randomIndex);
  updateHintDisplay();

  usedHints++;
  const counter = document.getElementById("hint-counter");
  if (counter) counter.textContent = `Pistas usadas: ${usedHints} / ${maxHints}`;

  if (difficulty === "hard" && usedHints >= maxHints) {
    hintButton.disabled = true;
    wrongSound.volume = 0.2;
    wrongSound.play();
  } else {
    hintInfo.textContent = "";
  }
});

giveUpButton.addEventListener("click", () => {
  if (currentPokemon && !hasGivenUp) {
    hasGivenUp = true;
    wrongSound.volume = 0.2;
    wrongSound.play();
    message.textContent = `😓 Era ${currentPokemon.name.charAt(0).toUpperCase() + currentPokemon.name.slice(1)}.`;
    pokemonImage.classList.add("revealed");
    score = 0;
    scoreElement.textContent = `Aciertos: ${score}`;
    revealedLetters = [];

    setTimeout(() => {
      gameContainer.style.display = "none";
      generationScreen.style.display = "block";
    }, 2200);
  }
});

backToStartButton.addEventListener("click", () => {
  // Reset game state
  currentPokemon = null;
  score = 0;
  scoreElement.textContent = `Aciertos: ${score}`;
  revealedLetters = [];
  usedHints = 0;
  hasGivenUp = false;
  message.textContent = '';
  hintInfo.textContent = '';
  guessInput.value = '';
  pokemonImage.classList.remove('revealed', 'flash', 'shake');
  pokemonImage.style.display = 'none';
  hintButton.disabled = false;

  // Reset selected generations and uncheck checkboxes
  selectedGenerations = [];
  document.querySelectorAll('input[name="gen"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Switch screens
  gameContainer.style.display = "none";
  difficultyScreen.style.display = "none";
  generationScreen.style.display = "block";
});

const correctSound = new Audio("/audio/correct.mp3");
const wrongSound = new Audio("/audio/wrong.mp3");

generationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  selectedGenerations = Array.from(document.querySelectorAll('input[name="gen"]:checked')).map(cb => cb.value);
  if (selectedGenerations.length === 0) {
    alert("Selecciona al menos una generación.");
    return;
  }
  generationScreen.style.display = "none";
  difficultyScreen.style.display = "block";
});

document.getElementById("easy-button").addEventListener("click", () => {
  difficulty = "easy";
  maxHints = Infinity;
  difficultyScreen.style.display = "none";
  gameContainer.style.display = "block";
  fetchRandomPokemon();
});

document.getElementById("hard-button").addEventListener("click", () => {
  difficulty = "hard";
  maxHints = 3;
  difficultyScreen.style.display = "none";
  gameContainer.style.display = "block";
  fetchRandomPokemon();
});

document.querySelectorAll('.gen-card').forEach(card => {
  card.addEventListener('click', () => {
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
  });
});