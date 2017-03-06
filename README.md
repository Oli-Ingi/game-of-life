# game-of-life

## A 3D version of Conway's Game of Life.

This is a 0-player game where the user only prepares the initial conditions and then lets the game run its course.
Based on the initial conditions the game can produce some interesting static or oscillating shapes.

### Instructions:
- You start with a grid full of cells.
- A cell in a grid is either alive or dead.
- Every 3 seconds all cells are scanned:
- If a cell is dead and has exactly 6 alive neighbours, it comes to life.
- If a cell is alive and has 5-7 alive neighbours, it stays alive.
- If a cell has less than 5 neighbours it dies of underpopulation.
- If a cell has more than 7 neigbours it dies of overpopulation.


To run the game simply open the .html file in a browser.

This game was created as an assignment for a computer graphics course at the University of Iceland.