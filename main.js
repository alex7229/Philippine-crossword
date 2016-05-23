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
                    backgroundType: 'empty'
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
            let cell = this.field[line][column];
            cell.number = number;
            if (number===1) {
                cell.isUsed = true;
                cell.backgroundType = 'used1';
            }
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
                let backImage = `background-image: url(images/${cell.backgroundType}.png); `;
                let backColor = 'background-color: #E8F0F0; ';
                let backSize = 'background-size: contain; ';
                let color = 'color: black; ';
                let number = '';
                if (cell.isUsed) {
                    backColor = `background-color: #404440; `;
                    color = 'color: white; '
                }
                if (cell.number) {
                    number = cell.number
                }
                lineHTML += `<div class="cell" style="${backColor}${backImage}${backSize}${color}">${number}</div>`;
            });
            lineHTML+=`<br>`;
            fieldHTML+=lineHTML
        });
        $gameField.html(fieldHTML)
    }

    static isPossiblePathExist (firstCell, secondCell, currentStep) {
        let stepsLeft = secondCell.number - currentStep;
        let verticalDifference = Math.abs(firstCell.line-secondCell.line);
        let horizontalDifference = Math.abs(firstCell.column-secondCell.column);
        if (verticalDifference+horizontalDifference<=stepsLeft) {
            return true
        }
    }

    countPossiblePaths (startCell ,targetCell) {
        let self = this;
       // let startCell = self.field[2][3];
        //let targetCell = self.field[4][3];
        let numberOfStep = 1;
        let paths = [];
        function findPath(currentCell, targetCell, currentStep, path=[[currentCell.line, currentCell.column]]) {
            if (currentStep === targetCell.number) {
                if (currentCell.line === targetCell.line && currentCell.column === targetCell.column) {
                    console.log('path has been found');
                    paths.push(path)
                }
            } else if (Field.isPossiblePathExist(currentCell, targetCell, currentStep)) {
                let topCell = self.getCell(currentCell.line-1, currentCell.column);
                let rightCell = self.getCell(currentCell.line, currentCell.column+1);
                let bottomCell = self.getCell(currentCell.line+1, currentCell.column);
                let leftCell = self.getCell(currentCell.line, currentCell.column-1);
                let possibleCells = [topCell, rightCell, bottomCell, leftCell];
                possibleCells.forEach( (possibleCell) => {
                    if (possibleCell) {
                        if (Field.checkNextCell(possibleCell, targetCell, path)) {
                            let cellCoordinates = [[possibleCell.line, possibleCell.column]];
                            let newPath = path.concat(cellCoordinates);
                            findPath(possibleCell, targetCell, currentStep+1, newPath);
                        }
                    }

                })
            }
        }
        findPath(startCell, targetCell, numberOfStep);
        if (paths.length===1) {
            this.calculateBackground(paths[0])
        } else if (paths.length >=1) {
          /*  paths.forEach( (path) => {
                this.calculateBackground(path)
            })*/
            this.calculateBackground(paths[0])
        }
    }

    calculateField () {
        for (let line=1; line<=this.height; line++) {
            for (let column = 1; column<=this.width; column++) {
                let startCell = this.field[line][column];
                if (!startCell.isUsed && startCell.number) {
                    let possibleCells = this.findPossibleTargetCells(startCell);
                    possibleCells.forEach( (possibleCell) => {
                        this.countPossiblePaths(startCell, possibleCell)
                    })
                }
            }
        }
    }

    findPossibleTargetCells (cell) {
        let targetCells = [];
        let possibleCell;
        let maximumDistance = cell.number-1;
        let startPointLine = cell.line-maximumDistance;
        let startPointColumn = cell.column-maximumDistance;
        let finishPointLine = cell.line+maximumDistance;
        let finishPointColumn = cell.column+maximumDistance;
        for (let line = startPointLine; line<=finishPointLine; line++) {
            for (let column = startPointColumn; column<=finishPointColumn; column++) {
                if (cell.line === line && cell.column === column) continue;
                if (possibleCell = this.getCell(line, column)) {
                    if (possibleCell.number && possibleCell.number === cell.number && (!possibleCell.isUsed)) {
                        targetCells.push(possibleCell)
                    }

                }
            }
        }
        return targetCells
    }

    static checkNextCell (cell, targetCell, usedCellsPath) {
        let cellsInPath = [];
        if (usedCellsPath.length !== 0) {
            cellsInPath = usedCellsPath.filter( (usedCell) => {
                return usedCell[0] === cell.line && usedCell[1] === cell.column
            });
        }
        if (cellsInPath.length === 0 && (!cell.isUsed)) {
            if (cell.line === targetCell.line && cell.column === targetCell.column) {
                return true
            } else if (!cell.number) {
                return true
            }

        }
    }

    calculateBackground (path) {
        for (let i=0; i<path.length; i++) {
            let targetCell = this.getCell(path[i][0], path[i][1]);
            let nextCell, previousCell;
            if (i===0) {
                nextCell = this.getCell(path[i+1][0], path[i+1][1])
            } else if (i+1 === path.length) {
                previousCell = this.getCell(path[i-1][0], path[i-1][1])
            } else {
                nextCell = this.getCell(path[i+1][0], path[i+1][1]);
                previousCell = this.getCell(path[i-1][0], path[i-1][1])
            }
            Field.findCellBackground(targetCell, previousCell, nextCell)
        }
    }



    static findCellBackground (targetCell, previousCell, nextCell) {
        let cellBackground = ``;
        if (previousCell && nextCell) {
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, previousCell);
            cellBackground += `_`;
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, nextCell)
        } else {
            let otherCell;
            if (previousCell) {
                otherCell = previousCell
            } else {
                otherCell = nextCell
            }
            cellBackground += 'part_';
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, otherCell)
        }
        targetCell.isUsed = true;
        targetCell.backgroundType = cellBackground;
    }

    static findPositionRelativeToMainCell (mainCell, adjustmentCell) {
        if (mainCell.line>adjustmentCell.line) {
            return 'top'
        } else if (mainCell.line<adjustmentCell.line) {
            return 'bottom'
        } else if (mainCell.column>adjustmentCell.column) {
            return 'left'
        } else {
            return 'right'
        }
    }



}

let field = new Field(8, 9);
field.createEmptyField();
(function setField () {
    field.setCellNumber(1,2, 3);
   // field.setCellNumber(6,4, 1);
    field.setCellNumber(1,4, 2);
    field.setCellNumber(2,3, 23);
    field.setCellNumber(2,4, 2);
    field.setCellNumber(3,1,3);
    field.setCellNumber(3,2,3);
    field.setCellNumber(4,2, 3);
    field.setCellNumber(4,3, 23);
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
    field.setCellNumber(1,7, 2);
    field.setCellNumber(2,7, 2);
    field.setCellNumber(3,7, 2);
    field.setCellNumber(4,7, 2);
}());

field.calculateField();


$(document).ready(function () {
    let startTime = window.performance.now();
    field.drawField();
    let finishTime = window.performance.now();
    console.log(finishTime-startTime);
});













