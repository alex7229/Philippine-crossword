'use strict';


class Field {

    constructor (width, height) {
        this.width = width;
        this.height = height;
        this.cellWidthHeight = 50;
        this.field = [];
        this._advancedReserveField = []
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

    countPossiblePaths (startCell ,targetCellsArray, pathNumber) {
        let self = this;
        let numberOfStep = 1;
        let paths = [];
        function findPath(currentCell, targetCell, currentStep, path=[[currentCell.line, currentCell.column]]) {
            if (currentStep === targetCell.number) {
                if (currentCell.line === targetCell.line && currentCell.column === targetCell.column) {
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
        targetCellsArray.forEach( (possibleTargetCell) => {
            findPath(startCell, possibleTargetCell, numberOfStep)
        });
        if (paths.length===1) {
            this.calculateBackground(paths[0])
        } else if (paths.length === 0) {
            throw new Error ('Cannot join numbers. Number of possible paths is 0')
        } else if (pathNumber) {
            this.calculateBackground(paths[pathNumber-1])
        }
        return paths.length
    }

    calculateField () {
        let notUsedNumbersBefore = 0;
        let notUsedNumbersNow;
        while (notUsedNumbersNow = this.checkNotUsedNumbers()) {
            if (!this.checkNotUsedNumbers()) break;
            if (notUsedNumbersNow === notUsedNumbersBefore) {
                this.makeExtraFieldCopy();
                let problemCell = this.findFirstNotUsedNumberFrom();
                let possibleCells = this.findPossibleTargetCells(problemCell);
                let goodPath = this.findGoodPath(problemCell);
                if (goodPath) {
                    this.countPossiblePaths(problemCell, possibleCells, goodPath);
                    this.tryCalculateOtherNumbers()
                }
            } else {
                notUsedNumbersBefore = notUsedNumbersNow;
                this.tryCalculateOtherNumbers();
            }
        }
    }

    tryCalculateOtherNumbers () {
        for (let line =1; line<=this.height; line++) {
            for (let column = 1; column<=this.width; column++) {
                let cell = this.field[line][column];
                if (cell.number && (!cell.isUsed)) {
                    let possibleCells = this.findPossibleTargetCells(cell);
                    this.countPossiblePaths(cell, possibleCells)
                }
            }
        }
    }

    findFirstNotUsedNumberFrom (startLine=1, startColumn=1) {
        for (let line = startLine; line<=this.height; line++) {
            for (let column = startColumn; column<=this.width; column++) {
                let cell = this.field[line][column];
                if (cell.number && (!cell.isUsed)) {
                    return cell
                }
            }
        }
    }

    makeExtraFieldCopy (reverse) {
        let pastArray, futureArray;
        if (reverse) {
            pastArray = '_advancedReserveField';
            futureArray = 'field';
        } else {
            pastArray = 'field';
            futureArray = '_advancedReserveField';
        }
        this[futureArray] = [];
        for (let line=1; line<=this.height; line++) {
            this[futureArray][line] = [];
            for (let column = 1; column<=this.width; column++) {
                let pastCell = this[pastArray][line][column];
                let futureCell = {};
                for (var key in pastCell) {
                    if (pastCell.hasOwnProperty(key)) {
                        futureCell[key] = pastCell[key]
                    }
                }
                this[futureArray][line][column] = futureCell
            }
        }
    }

    getExtraFieldCopy () {
        this.makeExtraFieldCopy('reverse')
    }

    findGoodPath (problemCell) {
        let possibleCells = this.findPossibleTargetCells(problemCell);
        let diffPaths = this.countPossiblePaths(problemCell, possibleCells);
        let badPaths = [];
        let goodPaths = [];
        for (let i=1; i<=diffPaths; i++) {
            problemCell = this.findFirstNotUsedNumberFrom();
            possibleCells = this.findPossibleTargetCells(problemCell);
            this.countPossiblePaths(problemCell, possibleCells, i);
            try {
                this.tryCalculateOtherNumbers()
            } catch (err) {
                badPaths.push(i.toString())
            }
            this.getExtraFieldCopy()
        }
        for (let i=1; i<=diffPaths; i++) {
            if (!badPaths.includes(i.toString())) {
                goodPaths.push(i)
            }
        }
        if (goodPaths.length >= 1) {
            return goodPaths[0]
        }
    }

    checkNotUsedNumbers () {
        let notUsedNumbers =0;
        this.field.forEach( (row) => {
            if (row!==null) {
                row.forEach( (cell) => {
                    if ((cell!==null) && cell.number && !cell.isUsed) {
                        notUsedNumbers++
                    }
                })
            }
        });
        return notUsedNumbers
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

class ParseHTMLTable {

    constructor (HTML) {
        this.html = HTML;
        this.lines = [];
        this.field = [];
        this.width;
        this.height;
    }

    getGameData() {
        this.divideOnLines();
        this.divideOnCells();
        this.getFieldParams();

    }

    divideOnLines () {
        let regExp = /<tr.*?><\/tr>/g;
        this.lines = this.html.match(regExp);
    }

    divideOnCells () {
        let regExp = /<td.*?>([\d]*)<\/td>/g;
        for (let i=1; i<=this.lines.length; i++) {
            let result;
            let columnNumber = 0;
            while ((result = regExp.exec(this.lines[i-1])) !== null) {
                columnNumber++;
                let cell = {
                    line: i,
                    column: columnNumber,
                    number: result[1]
                };
                this.field.push(cell)
            }
        }
    }

    getFieldParams () {
        this.height = this.lines.length;
        let maxColumn = 0;
        for (let i=0; i<this.field.length; i++) {
            if (this.field[i].column>maxColumn) {
                maxColumn = this.field[i].column
            } else {
                this.width = maxColumn;
                break
            }
        }
    }

    addNumbersInField (fieldObject) {
        this.field.forEach( (cell) => {
            if (cell.number) {
                fieldObject.setCellNumber(cell.line, cell.column, parseInt(cell.number))
            }
        })
    }

}

class SubDomainAjax {

    constructor () {
        this.html = ``

    }

    getHTML () {
        let uri = $('#gameUrl').val();
        return new Promise ( (resolve) => {
            $.post( "/philippine-crosswords/getHTML", { pageUri: uri} )
                .done( data => {
                    this.html = data;
                    resolve (data)
                });
        });
    }

}


let rawHtml = ``;
(function setRawHtml () {
    rawHtml = `<tbody><tr><td id="i0-0" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i1-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-0" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i7-0" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i8-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-0" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i11-0" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i12-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-0" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-1" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i1-1" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i2-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-1" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-1" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i5-1" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i6-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-1" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-1" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i12-1" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i13-1" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i14-1" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-1" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td></tr><tr><td id="i0-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-2" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i3-2" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-2" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i5-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-2" class="FKN_1 FKL_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i7-2" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i8-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-2" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i10-2" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i11-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-2" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i15-2" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-3" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i3-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-3" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i8-3" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i9-3" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i10-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-3" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-3" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i13-3" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i14-3" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i15-3" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-4" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i4-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-4" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i6-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-4" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i8-4" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i9-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-4" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-4" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i12-4" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">7</td><td id="i13-4" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i14-4" class="FKN_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i15-4" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-5" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i5-5" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i6-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-5" class="FKN_1 FKL_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i9-5" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">7</td><td id="i10-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-5" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-5" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i14-5" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i15-5" class="FKN_2 FKL_2" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td></tr><tr><td id="i0-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-6" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i6-6" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-6" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i10-6" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i11-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-6" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i14-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-6" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-7" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-7" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i12-7" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-7" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i14-7" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i15-7" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td></tr><tr><td id="i0-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-8" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-8" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i8-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-8" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-8" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i14-8" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i15-8" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td></tr><tr><td id="i0-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-9" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-9" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i15-9" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-10" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i8-10" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-10" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-10" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-11" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-11" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-12" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i10-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-12" class="FKN_1 FKL_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i15-12" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-13" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-13" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-14" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i7-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-14" class="FKN_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i10-14" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i11-14" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">7</td><td id="i12-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-14" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-15" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i5-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-15" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i7-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-15" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i9-15" class="FKN_4 FKL_4" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i10-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-15" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i13-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-15" class="FKN_6 FKL_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i15-15" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i5-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i6-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i8-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i10-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">8</td><td id="i11-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-16" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i13-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-16" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i15-16" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-17" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i3-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-17" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i5-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-17" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i13-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-17" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">7</td><td id="i15-17" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-18" class="FKN_6 FKL_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i4-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-18" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i8-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-18" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i10-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-18" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">8</td><td id="i12-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-18" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i15-18" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-19" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-19" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-19" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i10-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-19" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i12-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-19" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-20" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i3-20" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-20" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">11</td><td id="i5-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-20" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-20" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i9-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-20" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i12-20" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i13-20" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i14-20" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-20" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td></tr><tr><td id="i0-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-21" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-21" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i6-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-21" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-21" class="FKN_6 FKL_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i13-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-21" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-21" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-22" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i4-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-22" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">3</td><td id="i7-22" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i8-22" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-22" class="FKN_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i11-22" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i12-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-22" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-22" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i15-22" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td></tr><tr><td id="i0-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-23" class="FKN_1 FKL_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i5-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-23" class="FKN_6 FKL_6" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i9-23" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">11</td><td id="i10-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i12-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-23" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">6</td><td id="i14-23" class="FKN_1 FKL_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">1</td><td id="i15-23" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-24" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i6-24" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i7-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i9-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-24" class="FKN_3" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">5</td><td id="i12-24" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i13-24" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">2</td><td id="i14-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-24" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr><tr><td id="i0-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i1-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i2-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i3-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i4-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i5-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i6-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i7-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i8-25" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i9-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i10-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i11-25" class="FKN_1" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;">4</td><td id="i12-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i13-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i14-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td><td id="i15-25" class="" style="min-width: 21px; width: 21px; height: 21px; font-size: 13px;"></td></tr></tbody>`
}());
let parse = new ParseHTMLTable(rawHtml);
parse.getGameData();


let cors = new SubDomainAjax();

let gameField = new Field(parse.width, parse.height);
gameField.createEmptyField();
parse.addNumbersInField(gameField);
let startTime = window.performance.now();
gameField.calculateField();
let finishTime = window.performance.now();
console.log(finishTime-startTime);



$(document).ready(function () {

    gameField.drawField();

});













