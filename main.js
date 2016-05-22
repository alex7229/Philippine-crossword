'use strict';


class Field {

    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.cellWidthHeight = 50;
        this.field = []
    }

    createEmptyField () {
        for (let line=1; line<=this.height; line++) {
            this.field[line] = [];
            for (let column=1; column<=this.width; column++) {
                this.field[line][column] = {
                    number: false,
                    line: line,
                    column: column,
                    isUsed: false,
                    backgroundType: false
                }
            }
        }
    }

    getCell (line, column) {
        if (this.field[line] && this.field[line][column]) {
            return this.field[line][column]
        }
    }

    setCellNumber (line,column, number) {
        if (this.getCell(line,column)) {
            this.field[line][column].number = number
        }
    }

    drawField () {
        let $gameField = $('#gameContainer');
        let widthPx = `${this.width*this.cellWidthHeight}px`;
        let heightPx = `${this.height*this.cellWidthHeight}px`;
        $gameField.css({"height": heightPx, "width": widthPx});
        let fieldHTML = ``;
        this.field.forEach( (line) => {
            let lineHTML = ``;
            line.forEach( (cell) => {
                if (cell.number === false) {
                    lineHTML+=`<div class="cell" style="background-image: url(images/empty.png); background-size: contain"></div>`
                } else {
                    lineHTML+=`<div class="cell" style="background-image: url(images/empty.png); background-size: contain">${cell.number}</div>`
                }
            });
            lineHTML+=`<br>`;
            fieldHTML+=lineHTML
        });
        $gameField.html(fieldHTML)
    }

    static isPossiblePathExist (firstCell, secondCell, numberOfSteps) {
        let verticalDifference = Math.abs(firstCell.line-secondCell.line);
        let horizontalDifference = Math.abs(firstCell.column-secondCell.column);
        if (verticalDifference+horizontalDifference<=numberOfSteps) {
            return true
        }
    }

    countPossiblePaths () {
        let self = this;
        let startCell = self.field[1][2];
        let targetCell = self.field[3][2];
        let steps = 2;
        let differentPaths = 0;
        function findPath(currentCell, targetCell, steps, path=[]) {
            if (steps === 0) {
                if (currentCell.line === targetCell.line && currentCell.column === targetCell.column && steps===0) {
                    console.log('path has been found');
                    differentPaths++
                }
            } else if (Field.isPossiblePathExist(currentCell, targetCell, steps)) {
                let topCell = self.getCell(currentCell.line-1, currentCell.column);
                let rightCell = self.getCell(currentCell.line, currentCell.column+1);
                let bottomCell = self.getCell(currentCell.line+1, currentCell.column);
                let leftCell = self.getCell(currentCell.line, currentCell.column-1);
                let possibleCells = [topCell, rightCell, bottomCell, leftCell];
                possibleCells.forEach ( (possibleCell) => {
                    let alreadyUsed = path.filter ( (usedCell) => {
                        return usedCell.line === possibleCell.line && usedCell.column === possibleCell.column
                    });


                });

            }





        }
        findPath(startCell, targetCell, steps)
    }

}

let field = new Field(8, 9);
field.createEmptyField();

(function setField () {
    field.setCellNumber(1,2, 3);
    field.setCellNumber(1,4, 2);
    field.setCellNumber(2,3, 7);
    field.setCellNumber(2,4, 2);
    field.setCellNumber(3,1,3);
    field.setCellNumber(3,2,3);
    field.setCellNumber(4,2, 3);
    field.setCellNumber(4,3, 7);
    field.setCellNumber(5,3, 5);
    field.setCellNumber(5,8, 3);
    field.setCellNumber(7,4,3);
    field.setCellNumber(7,7,2);
    field.setCellNumber(7,8, 3);
    field.setCellNumber(8,5,1);
    field.setCellNumber(8,7, 2);
    field.setCellNumber(9,3, 5);
    field.setCellNumber(9,4,3);
    field.setCellNumber(9,5, 3);
    field.setCellNumber(9,7,3);
}());
field.countPossiblePaths();

$(document).ready(function () {

    field.drawField();

});















