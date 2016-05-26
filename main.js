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

    setCellNumberColor (line,column, number, color) {
        if (this.getCell(line,column)) {
            let cell = this.field[line][column];
            cell.number = number;
            cell.backColor = color;
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
                let backColor = 'background-color: #fff; ';
                let backSize = 'background-size: contain; ';
                let color = 'color: black; ';
                let number = '';
                if (cell.isUsed) {
                    backColor = `background-color: ${cell.backColor}; `;
                    color = 'color: white; '
                }
                if (cell.number) {
                    number = cell.number;
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
                    if (possibleCell.number && possibleCell.number === cell.number && possibleCell.backColor === cell.backColor && (!possibleCell.isUsed)) {
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
        let cellBackColor = ``;
        if (previousCell && nextCell) {
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, previousCell);
            cellBackground += `_`;
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, nextCell);
            cellBackColor = previousCell.backColor
        } else {
            let otherCell;
            if (previousCell) {
                cellBackColor = previousCell.backColor;
                otherCell = previousCell
            } else {
                otherCell = nextCell
            }
            cellBackground += 'part_';
            cellBackground += Field.findPositionRelativeToMainCell(targetCell, otherCell)
        }
        targetCell.isUsed = true;
        targetCell.backgroundType = cellBackground;
        if (cellBackColor.length  !== 0) {
            targetCell.backColor = cellBackColor
        }
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
        this.gameTable = ``;
        this.blackAndWhite = true;
        this.backColors = {};
        this.lines = [];
        this.field = [];
        this.width;
        this.height;
    }

    getGameData() {
        this.getGameTable();
        this.getTableColors();
        this.divideOnLines();
        this.divideOnCells();
        this.getFieldParams();
    }

    getGameTable () {
        let regExp = /<table id="filip_tbl".*?<\/table>/;
        this.gameTable = this.html.match(regExp)[0]
    }

    getTableColors () {
        if (!this.isTableBlackAndWhite()) {
            this.findColors();
            this.blackAndWhite = false;
        }
    }

    isTableBlackAndWhite () {
        let regExp = /FKN_2/;
        if (!this.html.match(regExp)) {
            return true
        } else {
            return false
        }
    }

    findColors() {
        let styleRegExp = /<style>[\s\S]*?(?:FKN)[\s\S]*?<\/style>/;
        let colorStylesheet = this.html.match(styleRegExp)[0];
        let regExpResult;
        let colorRegExp = /(FKL_[\d]{1,2}) \{background-color:(.*?) !important/g;
        while ((regExpResult = colorRegExp.exec(colorStylesheet)) !== null) {
            this.backColors[regExpResult[1]] = regExpResult[2]
        }
    }

    getBackColorOfClass (cssClass) {
        return this.backColors[cssClass]
    }

    divideOnLines () {
        let regExp = /<tr.*?><\/tr>/g;
        this.lines = this.gameTable.match(regExp);
    }

    divideOnCells () {
        let regExp = /<td.*?class(?:="(.*?)").*?>([\d]*)<\/td>/g;
        for (let i=1; i<=this.lines.length; i++) {
            let result;
            let columnNumber = 0;
            while ((result = regExp.exec(this.lines[i-1])) !== null) {
                columnNumber++;
                let cssClass = result[1];
                let backColor = 'black';
                if (!this.blackAndWhite && cssClass) {
                    if (cssClass.match(/[\s]/)) {
                        let twoClasses = cssClass.split(' ');
                        cssClass = twoClasses[1];
                    } else {
                        cssClass = cssClass.replace('N', 'L');
                    }
                    backColor=this.getBackColorOfClass(cssClass)
                }
                let cell = {
                    line: i,
                    column: columnNumber,
                    number: result[2],
                    backColor: backColor
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
                fieldObject.setCellNumberColor(cell.line, cell.column, parseInt(cell.number), cell.backColor)
            }
        })
    }

}

class SubDomainAjax {

    constructor (url) {
        this.url = url;
    }

    getHTML () {
        return new Promise ( (resolve) => {
            $.post( "/philippine-crosswords/getHTML", { pageUri: this.url} )
                .done( data => {
                    resolve (data)
                });
        });
    }

}


function  solveCrossword() {
    let id = $('#gameId').val();
    let url = `http://japonskie.ru/filippinskie/id`+id;
    let cors = new SubDomainAjax(url);
    cors.getHTML()
        .then( (html) => {
            let parse = new ParseHTMLTable(html);
            parse.getGameData();
            let gameField = new Field(parse.width, parse.height);
            gameField.createEmptyField();
            parse.addNumbersInField(gameField);
            gameField.calculateField();
            gameField.drawField();
        })
}














