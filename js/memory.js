"use strict";

// Stopt verscheidene DOM elementen in een variabele voor gebruik in JavaScript.
const gameForm = document.getElementById("game-form");
const fieldSize = document.getElementById("field-size");
const field = document.getElementById("field");
const totalAttempts = document.querySelector(".total-attempts");
const successfulAttempts = document.querySelector(".successful-attempts");
const playTime = document.querySelector(".play-time");
const bestScore = document.querySelector(".highscore");

// Variabelen die we in meerdere functies gebruiken en globaal beschikbaar zijn
let namePlayer = localStorage.getItem("name");
let timer = 0;
let resetTimer = null;
let uniqueCardArray = [];
let activeCards = [];
let clicks = 0;
let matches = 0;

// Class die de properties van een individuele card bij zich houdt
class Card {
  constructor(cardObject) {
    this.card1 = cardObject.card1;
    this.sound = `snd/${cardObject.card1}.wav`;
  }
}

// Functie om een array random te ordenen (volgens de Fisher-Yates methode: https://bost.ocks.org/mike/shuffle/)
function shuffle(array) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Functie die de user begroet
function greetUser() {
  // Als er nog geen naam is, vraag dan om de naam en voeg toe aan localStorage
  if (!namePlayer) {
    namePlayer = prompt("Wat is je naam?");
    localStorage.setItem("name", namePlayer);
  }

  alert(`Hoi ${namePlayer}, veel plezier met je potje memory`);
}

// Deze functie zorgt ervoor dat voor elke kaart in de kaartset elementen worden gecreëerd in HTML en vervolgens wordt dit toegevoegd aan het veld
function populateField(boardSize, cardSet) {
  // Speelveld leeghalen door de inhoud van de div te verwijderen
  field.innerHTML = "";
  // Aan het speelveld wordt n.a.v. grootte juiste class toegevoegd
  field.className = `board${boardSize}`;

  // Een nieuw speelveld wordt per kaartje neergelegd
  cardSet.forEach((card) => {
    // Nieuw div element
    let newTile = document.createElement("div");
    newTile.setAttribute("name", card.card1);
    newTile.classList.add("tile");

    // Nieuw audio element
    let audio = document.createElement("audio");
    audio.setAttribute("src", card.sound);

    // Nieuw img element met src en name van memorykaartje
    let newCard = document.createElement("img");
    let imageURL = `img/${card.card1}.jpg`;
    newCard.setAttribute("src", imageURL);

    // Nieuw img element met src van de cover
    let cover = document.createElement("img");
    cover.setAttribute("src", "img/cover.jpeg");
    cover.classList.add("cover");

    // Voegt de twee plaatjes en de audio aan de nieuwe tile
    newTile.appendChild(newCard);
    newTile.appendChild(cover);
    newTile.appendChild(audio);

    // Voegt tile toe aan field
    field.appendChild(newTile);
  });
}

// Functie die wordt aangeroepen op het moment dat er wordt geklikt op een kaartje, de 'naam' wordt getoond in de console
function onClickCard(event) {
  // Clicked card is het dom element waarop is geklikt
  const clickedCard = event.target;

  // Wanneer het geen tile is, dan willen we niet verder luisteren naar de click
  if (!clickedCard.classList.contains("tile")) {
    return;
  }

  // Wanneer het kaartje al een match ius, dan willen we niet verder luisteren naar de click
  if (clickedCard.classList.contains("match")) {
    return;
  }

  // Wanneer het kaartje al is omgedraaid, dan willen we niet verder luisteren naar de click
  if (clickedCard.classList.contains("uncovered")) {
    return;
  }

  // Wanneer er al 2 kaartjes open staan, dan willen we niet verder luisteren naar de click
  if (activeCards.length === 2) {
    return;
  }

  // Increment clicks met 1
  clicks++;

  // Verkrijg de naam van het geklikte kaartje via de attribuut name en voeg toe aan geklikte kaartjes array
  const nameClickedCard = clickedCard.getAttribute("name");
  activeCards.push(nameClickedCard);

  // Speel het geluid af wat in het kaartje staat
  const cardSound = clickedCard.querySelector("audio");
  cardSound.play();

  // Als aangeklikte kaartje de class 'covered' heeft, wordt dit veranderd naar 'uncovered'; als je klikt op een kaartje met 'uncovered', wordt dit veranderd naar 'covered'
  if (!clickedCard.classList.contains("uncovered")) {
    clickedCard.classList.add("uncovered");
  } else if (clickedCard.classList.contains("uncovered")) {
    clickedCard.classList.remove("uncovered");
  }

  // Als beide geklikte kaartje hetzelfde zijn
  if (activeCards[0] === activeCards[1]) {
    // Pak beide kaartjes
    const matchedCards = document.querySelectorAll(".uncovered");

    // Increment matches met 1
    matches++;

    // Voeg de class match toe voor beide geklikte kaartjes
    matchedCards.forEach((matchedCard) => {
      matchedCard.classList.add("match");
    });

    // Pak alle tiles van het veld
    const tiles = document.querySelectorAll(".tile");

    // Kijk of alle tiles al zijn gematched
    const finishedMatch = [...tiles].every((tile) => {
      return tile.classList.contains("match");
    });

    // Als alles is gematched, roep endGame functie aan
    if (finishedMatch) {
      // Voer uit na timeout zodat animatie van laatste kaartje goed werkt
      setTimeout(endGame, 100);
    }

    // Na het openen van 2 gelijke kaartjes, kan de speler direct door
    activeCards = [];
  }

  // Bij elke (succesvolle) poging worden de statistieken geupdate
  updateGameStats(clicks, matches);

  // Als er 2 kaartjes waren omgedraaid, maar er was geen match, sluit dan de kaartjes na halve seconde
  if (activeCards.length === 2) {
    setTimeout(() => {
      // Pak de huidige open kaartjes
      const openCards = document.querySelectorAll(".uncovered");

      // Sluit de kaartjes
      openCards.forEach((openCard) => {
        openCard.classList.remove("uncovered");
      });

      // De speler kan weer andere kaartjes openen
      activeCards = [];
    }, 500);
  }
}

// Functie die de statistieken van de game laat zien aan de user
function updateGameStats(clicks, matches) {
  // Aantal volledige pogingen (2 clicks voor poging)
  totalAttempts.textContent = Math.floor(clicks / 2);

  // Aantal succesvolle pogingen
  successfulAttempts.textContent = matches;
}

// Functie die tijd van de game laat zien aan de user
function updateGameTimer(timer) {
  // Zet de huidige timer om naar minuten en seconden
  const seconds = (timer % 60).toString().padStart(2, "0");
  const minutes = (timer - seconds) / 60;

  // Laat de speeltijd zien aan de user
  playTime.textContent = `${minutes}:${seconds}`;
}

// Functie die de highscore laat zien aan de user
function showHighscore(boardSize) {
  // Haal de highscore op uit de localStorage
  const highscore = localStorage.getItem(`highscore${boardSize}`);

  // Wanneer er een highscore is, laat deze dan zien aan de user, anders n/a
  if (highscore) {
    // Zet de highscore waarde om in minuten en seconden
    const seconds = (highscore % 60).toString().padStart(2, "0");
    const minutes = (highscore - seconds) / 60;

    // Laat de highscore zien aan de user
    bestScore.textContent = `${minutes}:${seconds}`;
  } else {
    bestScore.textContent = "N/A";
  }
}

// Functie die de highscore opslaat in de localStorage
function updateHighscore(timer) {
  // Pak de geselecteerde waarde van de board size
  const boardSize = fieldSize.value;

  // Sla de nieuwe highscore op in de localStorage
  localStorage.setItem(`highscore${boardSize}`, timer);

  // Laat de nieuwe highscore zien aan de user
  showHighscore(boardSize);
}

// Functie die loopt als de waarde van de select wordt gewijzigd
function onChangeFieldSize() {
  // Pak de geselecteerde nieuwe waarde
  const boardSize = fieldSize.value;

  // Laat de highscore zien voor de nieuwe board size
  showHighscore(boardSize);

  // Reset de game wanneer de board size wordt veranderd
  resetGame();
}

// Functie die de timer laat beginnen
function startTimer() {
  // Start een interval voor 1 seconde en stop de interval ID in een variabele
  resetTimer = setInterval(() => {
    // Elke seconde wordt de timer met 1 opgehoogd
    timer++;
    // Laat de nieuwe waarde van de timer zien aan de user
    updateGameTimer(timer);
  }, 1000);
}

// Functie die de timer laat stoppen
function stopTimer() {
  // Clear interval zorgt ervoor dat de timer stopt
  clearInterval(resetTimer);
}

// Functie die wordt aangeroepen wanneer er op de start game knop is gedrukt
function startGame(event) {
  // Verstuur het formulier niet
  event.preventDefault();

  // Zorg ervoor dat alle waardes van de eventuele vorige game worden gereset
  resetGame();

  // De array met kaartjes wordt geshuffled
  const shuffledDeck = shuffle(uniqueCardArray);

  // Het aantal individuele kaartjes wordt bepaald aan de hand van de boardSize
  const boardSize = fieldSize.value;
  const individualCardsAmount = Math.floor((boardSize * boardSize) / 2);

  // Er worden x aantal (individualCardsAmount) kaartjes uit het geschudde array van kaartjes gepakt
  const pickedIndividualCards = shuffledDeck.slice(0, individualCardsAmount);

  // Middels de methode .concat wordt de array van memorykaartjes verdubbeld.
  const myDoubleCardArray = pickedIndividualCards.concat(pickedIndividualCards);

  // Hierbij wordt de functie shuffle aangeroepen om de verdubbelde array te shuffelen
  const shuffledCards = shuffle(myDoubleCardArray);

  // Hierbij wordt voor elke kaart in de set een 'card object' geïnitieerd
  const cardSet = shuffledCards.map((card) => new Card(card));

  // Hiermee  wordt 'populateField' aangeroepen waardoor de memory kaarten worden getoond
  populateField(boardSize, cardSet);

  // Start de timer!
  startTimer();
}

// Functie die wordt aangeroepen wanneer het spel eindigt
function endGame() {
  // Vraag de huidige hightscore op
  const boardSize = fieldSize.value;
  const highscore = localStorage.getItem(`highscore${boardSize}`);

  // Stop de timer
  stopTimer();

  // Zet de timer om in minuten en seconden
  const seconds = (timer % 60).toString().padStart(2, "0");
  const minutes = (timer - seconds) / 60;

  // Wanneer er een nieuwe highscore is gezet laten we dat weten aan de user en slaan we die op via de functie updateHighscore
  if (!highscore || Number(highscore) > timer) {
    updateHighscore(timer);

    return alert(
      `Gefeliciteerd ${namePlayer}, je hebt met de tijd ${minutes}:${seconds} een nieuw persoonlijk record gezet!`
    );
  }

  // Wanneer er geen nieuwe highscore is gezet laten we dat weten aan de user
  alert(
    `Goed gedaan ${namePlayer}, maar helaas is ${minutes}:${seconds} geen persoonlijk record!`
  );
}

// Functie die de statistieken en het veld reset
function resetGame() {
  // Stop de timer en zet globale waardes naar 0
  stopTimer();
  timer = 0;
  clicks = 0;
  matches = 0;

  // Leeg het veld
  field.innerHTML = "";

  // Update de statistieken van de tekstvelden
  updateGameTimer(timer);
  updateGameStats(clicks, matches);
}

// Eventlisteners voor formulier, select en click
gameForm.addEventListener("submit", startGame);
fieldSize.addEventListener("change", onChangeFieldSize);
field.addEventListener("click", onClickCard);

// Laat de highscore zien met de huidige waarde van de board size
showHighscore(fieldSize.value);

// Groet de user
greetUser();

// Haal de kaartjes op en maak een Card en stop in de uniqueCardArray
fetch("js/cards.json")
  .then((response) => response.json())
  .then((data) => {
    uniqueCardArray = data.map((card) => new Card(card));
  });
