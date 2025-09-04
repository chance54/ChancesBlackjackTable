// SOCKET IO SETUP STUFF
const socket = io();
socket.on("message", message => {
    console.log(message);
})

// GAME VARIABLES
var username = "UNDEFINED_USER";
var playerIndex = -1; // The index in the server list of players that corrisponds to self.
var availableFunds = 1000; // Available bank for player
var handStrength = 0; // Current hand score (21 is a win)
var aces = 0; // Number of aces in hand, if over 21, can change card score by -10 if acesConverted is < aces
var acesConverted = 0;
var currentWager = 0;
var folded = false;

let cards = 2; // Number of cards 

// JOIN TABLE FORM
function joinTable(){
    username = document.getElementById("usernameInp").value;
    document.getElementById("welcome").style.display = "none";
    document.getElementById("MAINGAME").hidden = false;

    socket.emit("userJoin", {username: username, funds: availableFunds});
}

// User joined table, gotta put em on
socket.on("playerFillSpot", (data) => {
    document.getElementById("p1n").innerHTML = data.players[0];
    document.getElementById("p2n").innerHTML = data.players[1];
    document.getElementById("p3n").innerHTML = data.players[2];
    document.getElementById("p4n").innerHTML = data.players[3];
    document.getElementById("p5n").innerHTML = data.players[4];
    document.getElementById("p6n").innerHTML = data.players[5];

    for (let i = 0; i < data.players.length; i++){
        if (username === data.players[i]){
            playerIndex = i;
        }
    }
    if (data.players.length < 6){
        document.getElementById("p6").hidden = true;
    }
    else{
        document.getElementById("p6").hidden = false;
    }
    if (data.players.length < 5){
        document.getElementById("p5").hidden = true;
    }
    else{
        document.getElementById("p5").hidden = false;
    }
    if (data.players.length < 4){
        document.getElementById("p4").hidden = true;
    }
    else{
        document.getElementById("p4").hidden = false;
    }
    if (data.players.length < 3){
        document.getElementById("p3").hidden = true;
    }
    else{
        document.getElementById("p3").hidden = false;
    }
    if (data.players.length < 2){
        document.getElementById("p2").hidden = true;
    }
    else{
        document.getElementById("p2").hidden = false;
    }
});

/*
socket.on("fillTable", (players) =>{
    document.getElementById("p1n").innerHTML = players[0];
    document.getElementById("p2n").innerHTML = players[1];
    document.getElementById("p3n").innerHTML = players[2];
    document.getElementById("p4n").innerHTML = players[3];
    document.getElementById("p5n").innerHTML = players[4];
    document.getElementById("p6n").innerHTML = players[5];
});
*/

function buildCardSource(card){
    let source = "assets/images/";
    let strength = card.rank;
    if (card.rank == 11){
        source += "j";
        strength = 10;
    }
    else if (card.rank == 12){
        source += "q";
        strength = 10;
    }
    else if (card.rank == 13){
        source += "k";
        strength = 10;
    }
    else if (card.rank == 14){
        source += "a";
        strength = 11;
    }
    else{
        source += card.rank.toString();
    }
    source += card.suite.substring(0, card.suite.length-1) + ".png";
    return ({src: source, str: strength});
}


// DEAL CARDS
function deal(){
    socket.emit("deal", socket.id);
}

socket.on("dealtCards", (data) =>{
    folded = false;
    let card1Source = buildCardSource(data.playerHands[playerIndex][0]).src;
    let card2Source = buildCardSource(data.playerHands[playerIndex][1]).src;
    let card1Strength = buildCardSource(data.playerHands[playerIndex][0]).str;
    let card2Strength = buildCardSource(data.playerHands[playerIndex][1]).str;
    


    if (playerIndex == 0){
        document.getElementById("p1c1i").src = card1Source;
        
    }
    if (playerIndex == 1){
        document.getElementById("p2c1i").src = card1Source;
        
    }
    if (playerIndex == 2){
        document.getElementById("p3c1i").src = card1Source;
        
    }
    if (playerIndex == 3){
        document.getElementById("p4c1i").src = card1Source;
        
    }
    if (playerIndex == 4){
        document.getElementById("p5c1i").src = card1Source;
        
    }
    if (playerIndex == 5){
        document.getElementById("p6c1i").src = card1Source;
        
    }
    for(let i = 0; i < data.playerHands.length; i++){
        document.getElementById("p" + (i+1) + "c2i").src = buildCardSource(data.playerHands[i][1]).src;
    }
    document.getElementById("p1c1i").hidden = false;
    document.getElementById("p1c2i").hidden = false; 
    document.getElementById("p2c1i").hidden = false;
    document.getElementById("p2c2i").hidden = false;
    document.getElementById("p3c1i").hidden = false;
    document.getElementById("p3c2i").hidden = false; 
    document.getElementById("p4c1i").hidden = false;
    document.getElementById("p4c2i").hidden = false; 
    document.getElementById("p5c1i").hidden = false;
    document.getElementById("p5c2i").hidden = false;
    document.getElementById("p6c1i").hidden = false;
    document.getElementById("p6c2i").hidden = false;
    
    
    console.log(`Your cards are ${data.playerHands[playerIndex][0].rank} of ${data.playerHands[playerIndex][0].suite} and ${data.playerHands[playerIndex][1].rank} of ${data.playerHands[playerIndex][1].suite}!`);
    
    for(let i = 0; i < data.playerHands[playerIndex].length; i++){
        if (data.playerHands[playerIndex][i].rank == 14){
            aces++;
        }
    }
    // Determine Hand Strength on Deal
    handStrength = card1Strength + card2Strength;
    if (handStrength > 21 && aces > 0){
        handStrength -= 10;
        acesConverted++;
    }
    console.log("Your hand strength is " + handStrength);
    document.getElementById("p" + (playerIndex+1) + "strength").innerHTML = handStrength;
    if (handStrength == 21){
        document.getElementById("p" + (playerIndex+1) + "strength").style.color = "red";
    }

    // Whos turn
    let elemIdPlayer = "p" + (data.playerTurn+1).toString();
    console.log(elemIdPlayer);
    document.getElementById(elemIdPlayer).style.borderColor = "red";
    if (playerIndex == data.playerTurn){
        // It is your turn
        document.getElementById("wagerBtn").disabled = false;
        document.getElementById("hitBtn").disabled = false;
        document.getElementById("standBtn").disabled = false;
    }

});

// Called when the wager slider is moved to update the value it shows
function wagerValChange(){
    document.getElementById("wagerLabel").innerHTML = "Bet: $" + document.getElementById("wagerAmount").value;
}

function makeWager(){
    let wagerAmnt = parseInt(document.getElementById("wagerAmount").value);
    availableFunds -= wagerAmnt;
    currentWager = wagerAmnt;
    // Send wager to server to add to pot, continue turn and remove bet button.
    socket.emit("wager", {wager: wagerAmnt, playerIdx: playerIndex});
    document.getElementById("wagerBtn").disabled = true;
}
socket.on("serverWagerPush", (data) =>{
    document.getElementById("pot").innerHTML = "Pot: $" + data.pot;
    let bettersMoneys = parseInt(document.getElementById("p" + (data.user+1) + "f").innerHTML.substring(1));
    document.getElementById("p" + (data.user+1) + "f").innerHTML = "$" + (bettersMoneys - data.wager);
});

function matchWager(){
    socket.emit("matchWager", playerIndex);
}
socket.on("matchWagerRequest", (call) =>{
    if (call > currentWager){
        document.getElementById("wagerAmount").value = call - currentWager;
        wagerValChange();
    }
});


// Hit
function hitMe(){
    if (cards < 6){
        socket.emit("hit", playerIndex);
    }
    else{
        document.getElementById("hitBtn").disabled = true;
    }
}

socket.on("hitACard", (data) =>{
    cards++;
    var cardSource = buildCardSource(data.card).src;
    var cardStrength = buildCardSource(data.card).str;
    
    console.log("p" + (data.hitPlayer+1) + "c" + cards + "i");
    document.getElementById("p" + (data.hitPlayer+1) + "c" + cards + "i").src = cardSource;
    document.getElementById("p" + (data.hitPlayer+1) + "c" + cards + "i").hidden = false;
    document.getElementById("p" + (data.hitPlayer+1) + "c" + cards).hidden = false;
    if (playerIndex == data.hitPlayer){
        if (cardStrength == 11){
            aces++;
        }
        handStrength += cardStrength;
        if (handStrength > 21 && (aces > 0 && acesConverted < aces)){
            handStrength -= 10;
            acesConverted++;
        }
        document.getElementById("p" + (playerIndex+1) + "strength").innerHTML = handStrength;
        if (handStrength == 21){
            document.getElementById("p" + (playerIndex+1) + "strength").style.color = "red";
        }
    }
});


function stand(){
    socket.emit("stand", handStrength);
}

socket.on("nextPlayer", (data) =>{
    cards = data.players[data.playerTurn].length;
    let elemIdPlayer = "p" + (data.playerTurn+1).toString();
    console.log(elemIdPlayer);
    document.getElementById(elemIdPlayer).style.borderColor = "red";
    console.log("p" + data.playerTurn);
    if (data.playerTurn == 0){
        document.getElementById("p" + data.players.length).style.borderColor = "black";
    } else{
        document.getElementById("p" + data.playerTurn).style.borderColor = "black";
    }
    if (playerIndex == data.playerTurn){
        // It is your turn
        document.getElementById("wagerBtn").disabled = false;
        document.getElementById("hitBtn").disabled = false;
        document.getElementById("standBtn").disabled = false;
        document.getElementById("matchWagerBtn").disabled = false;
        document.getElementById("foldBtn").disabled = false;
    } else{
        document.getElementById("wagerBtn").disabled = true;
        document.getElementById("hitBtn").disabled = true;
        document.getElementById("standBtn").disabled = true;
        document.getElementById("matchWagerBtn").disabled = true;
        document.getElementById("foldBtn").disabled = true;
    }
});

function fold(){
    folded = true;
    document.getElementById("p" + (playerIndex+1)).style.backgroundColor = "#90A4AE";
    socket.emit("foldHand", playerIndex);
}

socket.on("playerFolded", (fIndex) =>{
    document.getElementById("p" + (fIndex+1)).style.backgroundColor = "#90A4AE";
});

socket.on("roundEnd", (data) =>{
    for (let i = 0; i < data.playerHands.length; i++){
        document.getElementById("p" + (i+1) + "c1i").src = buildCardSource(data.playerHands[i][0]).src;
    }
    for (let i = 0; i < data.winners.length; i++){
        document.getElementById("p" + (data.winners[i]+1)).style.borderColor = "green";
        document.getElementById("p" + (data.winners[i]+1) + "f").innerHTML = "$" + data.servFunds[data.winners[i]];
    }
});