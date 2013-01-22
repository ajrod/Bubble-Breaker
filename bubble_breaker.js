var colors = ["red", "blue", "green", "purple", "yellow"] //Potential bubble images
var TileHeight = 45; //The width and Height of a single cell on the game board.
var currentScore = 0; //The users current Score.
var TotalRows = 8; //The total number of rows on the game board.
var TotalCols = 15; //The total number of columns on the game board.

//Our model of the game board. A 2D array is easier then working with a table.
var gameBoard = new Array();

var highLightedImgs = new Array(); //An array of currently high lighted bubbles.

var borderOn = "1px solid green";
var borderOff = "1px solid transparent";

//An array representing the number of bubbles left in each column on the game board.
var colBubblesLeft = new Array();

var seconds = null; //The number of seconds elapsed so far.
var clock = null;

/* Initialize everything we need to start the game. */
function init() {
    var tableElement = document.getElementById("table");
    document.getElementById("score").innerHTML = "Score: 0";
    document.getElementById("gain").innerHTML = "Potential Gain: 0";
    var table = createTable();
    tableElement.appendChild(table);
    //Set the number of bubbles per column
    for (c = 0; c < TotalCols; c++) {
        colBubblesLeft[c] = TotalRows;
    }
    startNewTimer();
}
/*
Create a table of image tags. This represents the view for our game board.
*/
function createTable() {
    var table = document.createElement("table");
    table.setAttribute("cellspacing", "0");
    for (colNumber = 0; colNumber < TotalCols; colNumber++) {
        gameBoard[colNumber] = new Array();
        var col = document.createElement("td");
        for (rowNumber = 0; rowNumber < TotalRows; rowNumber++) {
            var row = document.createElement("tr");
            var imgTag = document.createElement("img");
            imgTag.setAttribute("onclick", "handle_click(event)");
            imgTag.setAttribute("src", bubble());
            imgTag.setAttribute("height", TileHeight);
            imgTag.setAttribute("width", TileHeight);
            imgTag.setAttribute("id", colNumber * TotalCols + rowNumber);
            imgTag.setAttribute("style", "border: " + borderOff + ";");
            gameBoard[colNumber][rowNumber] = imgTag;
            row.appendChild(imgTag);
            col.appendChild(row);
        }
        table.appendChild(col);
    }
    return table;
}
/*
Reset all aspects of the game by reloading the page.
*/
function reset() {
    window.location.reload()
}
/*
Return the column, that this id represents.
Every bubble has a unique id that can determine its row and column.
*/
function getCol(id) {
    return Math.floor((+id) / TotalCols);
}
/*
Return the square of x.
*/
function square(x) {
    return x * x;
}
/*
Return the row, that this id represents.
Every bubble has a unique id that can determine its row and column.
*/
function getRow(id, col) {
    return (+id) - TotalCols * col;
}
/*
Handle the user's click.
*/
function handle_click(event) {
    var col = getCol(event.currentTarget.id);
    var row = getRow(event.currentTarget.id, col);
    //already highlighted; destroy bubbles
    if (highLightedImgs.length > 1 && gameBoard[col][row].style.border == borderOn) {
        destroyBubbles();
    }
    else {
        dehighlightList(); //dehighlight old bubbles
        highLightedImgs = new Array(event.currentTarget);
        gameBoard[col][row].style.border = borderOn //set this bubble to highlighted
        expand(col, row, event.currentTarget); //grow to all of its potential neighbours.

        //Did not find any matching neighbours. De-highlight because a single bubble can not be selected.
        if (highLightedImgs.length == 1) {
            dehighlightList();
        } else {
            //Update potential points to be gained.
            document.getElementById("gain").innerHTML = "Potential Gain: " + square(highLightedImgs.length);
        }
    }
}
/*
Destroy all of the highlighted bubbles.
*/
function destroyBubbles() {
    //Set all highlighted images to hidden.
    for (i = 0; i < highLightedImgs.length; i++) {
        highLightedImgs[i].style.visibility = "hidden";
        var col = getCol(highLightedImgs[i].id);
        colBubblesLeft[col] -= 1; //decrement bubbles left in the given column
    }

    currentScore += square(highLightedImgs.length); //increase score by n**2
    document.getElementById("score").innerHTML = "Score: " + currentScore; //update score tag
    dehighlightList(); //clear list of highlighted bubbles.
    gravity(); //apply gravity to fill the new gaps created.
    shift(); //apply shift to deal with potential columns that were destroyed.

    //Check if game is over.
    if (!movesLeft()) {
        alert("Game over! No more moves left.\nYour score was " + currentScore + ".");
        reset();
    }
}
/*
Shift all columns that have an adjacent empty column on the left.
*/
function shift() {
    //shift columns to the left
    for (c2 = 0; c2 < TotalCols; c2++) {
        for (c1 = 0; c1 < TotalCols - 1; c1++) {
            //Check if the current column is empty and the column to the right is not.
            if (colBubblesLeft[c1] == 0 && colBubblesLeft[c1 + 1] > 0) {
                //Shift all bubbles to the left into the empty column.
                for (r = 0; r < TotalRows; r++) {
                    swap(gameBoard[c1][r], gameBoard[c1 + 1][r])
                }
                colBubblesLeft[c1] = colBubblesLeft[c1 + 1]
                colBubblesLeft[c1 + 1] = 0
            }
        }
    }
}
/*
Move all bubbles down until every bubble is on the last row or on top of another bubble.
*/
function gravity() {
    for (col = 0; col < TotalCols; col++) {
        for (r1 = 0; r1 < TotalRows; r1++) {
            for (r2 = 0; r2 < TotalRows - 1; r2++) {
                //if the current cell is not destroyed and the cell underneath is swap the two.
                if (gameBoard[col][r2].style.visibility != "hidden"
                    && gameBoard[col][r2 + 1].style.visibility == "hidden") {
                    swap(gameBoard[col][r2], gameBoard[col][r2 + 1]);
                }
            }
        }
    }
}
/*
Simply swap any two images important properties. This can be used to simulate a bubble moving.
*/
function swap(img1, img2) {
    var src1 = img1.src;
    var vis1 = img1.style.visibility;
    img1.setAttribute("src", img2.src);
    img1.style.visibility = img2.style.visibility;
    img2.setAttribute("src", src1);
    img2.style.visibility = vis1;
}
/*
Return true iff there are still potential moves for the player.
*/
function movesLeft() {
    //Go through each cell and check its immediate neighbours for a match.
    for (col = 0; col < TotalCols; col++) {
        for (row = 0; row < TotalRows; row++) {
            var img = gameBoard[col][row];
            if (img.style.visibility != "hidden"
                && (checkNeighbour(col - 1, row, img)
                || checkNeighbour(col + 1, row, img)
                || checkNeighbour(col, row + 1, img)
                || checkNeighbour(col, row - 1, img))) {
                return true;
            }
        }
    }
    return false;
}
/*
Start a new timer.
*/
function startNewTimer() {
    seconds = -1;
    clock = setInterval("updateTime( )", 1000);
    updateTime();
}
/*
Increase the number of seconds and update it to the screen.
*/
function updateTime() {
    seconds++;
    var sec = seconds;
    var hr = Math.floor(sec / 3600);
    sec %= 3600;
    var mn = Math.floor(sec / 60);
    sec %= 60;
    var formatted_time = (mn < 10 ? "0" : "") + mn + ":" + (sec < 10 ? "0" : "") + sec;
    document.getElementById("time").innerHTML = "Time Taken: " + formatted_time;
}

/*
Return true iff the image given and the bubble located at row, column match.
*/
function checkNeighbour(col, row, img) {
    return validRowCol(col, row) && gameBoard[col][row].style.visibility != "hidden" && gameBoard[col][row].src == img.src;
}

/*
Turn off the border for each image in the high lighted list.
*/
function dehighlightList() {
    document.getElementById("gain").innerHTML = "Potential Gain: 0";
    for (i = 0; i < highLightedImgs.length; i++) highLightedImgs[i].style.border = borderOff;
}
/*
Recursively expand the high lighted bubbles based on the adjacent matching bubbles.
*/
function expand(col, row, img) {
    _expand(col - 1, row, img); //left
    _expand(col + 1, row, img); //right
    _expand(col, row - 1, img); //up
    _expand(col, row + 1, img); //down
}

function _expand(col, row, img) {
    if (validRowCol(col, row) && gameBoard[col][row].src == img.src
    && gameBoard[col][row].style.visibility != "hidden"
    && gameBoard[col][row].style.border != borderOn) {
        gameBoard[col][row].style.border = borderOn;
        highLightedImgs.push(gameBoard[col][row]);
        expand(col, row, img);
    }
}
/*
Return true iff the column and row are on the table.
*/
function validRowCol(col, row) {
    return (col >= 0 && row >= 0 && col < TotalCols && row < TotalRows);
}
/*
Return a random bubble source.
*/
function bubble() {
    return "bubbles/" + colors[Math.floor(Math.random() * 5)] + ".png"
}
