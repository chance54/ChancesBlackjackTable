const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io")

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

// GAME VARIABLES FOR SERVER
var playerCount = 0; // Count of players in the table
var players = []; // List of players at the table (by username)
var playerTurn = 0; // Index of the players turn in the player list
var playerHands = []; // 2-D Array containing all player hands [[p1c1, p1c2], [p2c1, p2c2]...]
var playerStrengths = []; // All gathered player hand strengths after they stand.
var dealer = ""; // Str ID of the dealer user
var pot = 0; // Current value of the pot (kept on server for cleanlieness)
var goArounds = 0; // Each game will go around twice, so when last player stands and this value is 1, game is over.
var currentCall = 0; // The current amount of money every user must have in the pot.
var wagers = []; // List of wager amounts from players.
var playerFunds = []; // List of player banks kept in the server.
var playersInHand = []; // List of booleans. True if in hand, false when folded.

class Card{
    constructor(rank, suite){
        this.rank = rank;
        this.suite = suite;
    }
}

var CARDS = [];
for (let i = 2; i < 15; i++){
    CARDS.push(new Card(i, "hearts"));
    CARDS.push(new Card(i, "diamonds"));
    CARDS.push(new Card(i, "spades"));
    CARDS.push(new Card(i, "clubs"));
}
const FULLDECK = CARDS;


// When client connects
io.on("connection", socket => {
    console.log("New connection");
    socket.emit("message", "Welcome to Blackjack!"); // To client connecting

    // Broadcast on user connect
    socket.broadcast.emit("USER has joined the table!"); // To everyone but you

    // io.emit() TO EVERYBODY

    socket.on("disconnect", () =>{
        io.emit("message", "Bro dipped.");
    });

    // Listen for user join table
    socket.on("userJoin", (data) =>{
        console.log(`${data.username} has joined the table!`);
        players.push(data.username);
        playerFunds.push(data.funds);
        if(players.length == 1){
            dealer = socket.id;
        }
        io.emit("playerFillSpot", {nam: data.username, players: players});
        //socket.emit("fillTable", players);
    });

    // Listen for user to deal
    socket.on("deal", (dealtId) =>{
        // Make sure who pressed button is dealer
        if (dealtId === dealer){
            for (let i = 0; i < players.length; i++){
                let card1 = Math.floor(Math.random() * CARDS.length);
                let card2 = Math.floor(Math.random() * CARDS.length);
                playerHands.push([CARDS[card1], CARDS[card2]]);
                CARDS.splice(card1, 1);
                CARDS.splice(card2-1, 1);
                playersInHand.push(true);
            }
            io.emit("dealtCards", {playerHands: playerHands, playerTurn: playerTurn});
        }
        else{
            console.log("Someone who isn't the dealer tried to deal!");
        }
    });
    
    // Listen for user wager
    socket.on("wager", (data) =>{
        if (data.wager >= currentCall){
            currentCall = data.wager;
            pot += data.wager;
            console.log(pot);
            playerFunds[data.playerIdx] -= data.wager;
            io.emit("serverWagerPush", {pot: pot, user: data.playerIdx, wager: data.wager});
        }
    });

    socket.on("matchWager", (playerIdx) => {
        socket.emit("matchWagerRequest", currentCall);
    });

    // Listen for user to hit
    socket.on("hit", (playerIdx) =>{
        let card = Math.floor(Math.random() * CARDS.length);
        playerHands[playerIdx].push([CARDS[card]]);
        let givenCard = CARDS[card];
        CARDS.splice(card, 1);
        // Let all users know bro got hit
        io.emit("hitACard", {card: givenCard, hitPlayer: playerIdx});
    });

    // Listen for user to stand
    socket.on("stand", (playerStrength) =>{
        if (playerTurn == players.length-1){
            if (goArounds < 1){
                playerTurn = 0;
                let everyoneIn = true;
                for (let i = 0; i < wagers.length; i++){
                    if (wagers < currentCall){
                        everyoneIn = false;
                    }
                }
                if (everyoneIn){
                    goArounds++;
                }
            }
            else{
                playerStrengths.push(playerStrength);
                let winningStrength = 0;
                let winningIdx = -1;
                let winners = [];
                for (let i = 0; i < playerStrengths.length; i++){
                    if (playerStrengths[i] > winningStrength && playerStrengths[i] < 22){
                        winningStrength = playerStrengths[i];
                        winningIdx = i;
                    }
                }
                winners.push(winningIdx);
                for (let i = 0; i < playerStrengths.length; i++){
                    if (playerStrengths[i] == winningStrength && playersInHand[i]){
                        winners.push(i);
                    }
                }
                let winnings = pot / winners.length;
                for (let i = 0; i < winners.length; i++){
                    playerFunds[winners[i]] += winnings;
                }
                io.emit("roundEnd", {playerHands: playerHands, winners: winners, winnings: winnings, servFunds: playerFunds});
            }
        } else{
            playerTurn++;
            if (goArounds == 1){
                playerStrengths.push(playerStrength);
            }
        }
        while (!playersInHand[playerTurn]){
            if(playerTurn == players.length-1){
                playerTurn = 0;
            } else{
                playerTurn++;
            }
        }
        io.emit("nextPlayer", {playerTurn: playerTurn, players: playerHands});
    });

    socket.on("foldHand", (pIndex) =>{
        playersInHand[pIndex] = false;
        if (playerTurn == players.length-1){
            if (goArounds < 1){
                playerTurn = 0;
                let everyoneIn = true;
                for (let i = 0; i < wagers.length; i++){
                    if (wagers < currentCall){
                        everyoneIn = false;
                    }
                }
                if (everyoneIn){
                    goArounds++;
                }
            }
            else{
                let winningStrength = 0;
                let winningIdx = -1;
                let winners = [];
                for (let i = 0; i < playerStrengths.length; i++){
                    if (playerStrengths[i] > winningStrength && playerStrengths[i] < 22){
                        winningStrength = playerStrengths[i];
                        winningIdx = i;
                    }
                }
                winners.push(winningIdx);
                for (let i = 0; i < playerStrengths.length; i++){
                    if (playerStrengths[i] == winningStrength && playersInHand[i]){
                        winners.push(i);
                    }
                }
                let winnings = pot / winners.length;
                for (let i = 0; i < winners.length; i++){
                    playerFunds[winners[i]] += winnings;
                }
                io.emit("roundEnd", {playerHands: playerHands, winners: winners, winnings: winnings, servFunds: playerFunds});
            }
        } else{
            playerTurn++;
        }
        while (!playersInHand[playerTurn]){
            if(playerTurn == players.length-1){
                playerTurn = 0;
            } else{
                playerTurn++;
            }
        }
        io.emit("nextPlayer", {playerTurn: playerTurn, players: playerHands});
        socket.broadcast.emit("playerFolded", pIndex);
    });
})




const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));