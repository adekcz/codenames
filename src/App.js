import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';


function Tile(props) {
    return (
        <button 
        role="test-tile"
        className={"tile " + (props.currentColors[props.x][props.y] ?? "")} 
        onClick={(e) => props.changeColor(props.x,props.y,props.tileType) }>
        {props.text}
        </button>
    );

}

class Board extends React.Component {

    renderTile(row, col, changeColor, currentColors) {
        return <Tile
        key={row + " " + col}
        x={row}
        y={col}
        currentColors={currentColors}
        text={this.props.tiles[row][col].text} 
        tileType={this.props.tiles[row][col].tileType} 
        onClick={this.props.onClick}
        changeColor={changeColor}
            />;
    }

    render() {
        return (
            <div>
            { this.props.tiles.map(
                (row, rowId) => 
                (<div className="board-row" key={rowId}>
                    {
                        row.map((col, colId) => 
                        this.renderTile(rowId, colId, this.props.changeColor, this.props.currentColors)
                    )
                    }
                    </div>
                )
            )
            }
            </div>
    )
    }
}

class Textareademo extends React.Component {
    constructor() {
        super();
        this.state = {
            textAreaValue: ""
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        let currentValue = event.target.value;
        let lines = (currentValue.match(/\b/g) || '').length / 2;
        if (lines > this.props.size**2) {
            return;
        }
        const newArr = [];
        let arr = currentValue.split(/\b/g);
        arr = arr.filter(word => word.trim() !== "");
        for(let row = 0; row<this.props.size; row++) {
            for(let col = 0; col<this.props.size; col++)
            {
                let index = row*this.props.size + col;
                if(arr.length> index) {
                    arr[index] = {...this.props.tiles[row][col], ...{text: arr[index]}};
                } else {
                    arr[index] = {text: "", tileType: this.props.tiles[row][col].tileType};
                }
            }
        }

        while(arr.length) newArr.push(arr.splice(0,this.props.size));
        this.props.setTiles(newArr);
        this.setState(
            {
                textAreaValue: currentValue
            }
        );
        if (lines < this.props.size**2) {
            this.setState({status: "you need " + (this.props.size**2-lines) + " more lines"})
        }
        if (lines === this.props.size**2) {
            this.setState({status: "Good job. Words set up! (you now cannot add new words, you can edit though)"})
        }
    }

    render() {
        return (
            <div>
            <label htmlFor="word-input">Enter value:</label>
            <br />
            <span>{this.state.status}</span>
            <br />
            <textarea id="word-input"
            value={this.state.textAreaValue}
            onChange={this.handleChange}
            rows={this.props.size**2}
            cols={15}
            />
            </div>
        );
    }
}

function create2dArray(rows, cols, def=null) {
    let array = Array(rows).fill(null);
    for (let row = 0; row<rows; row++) {
        if(typeof def === 'object'){
            array[row] = [];
            for(let i = 0; i<cols; i++){
                if(def && def?.__proto__ === Object.prototype) {
                    array[row][i] = {...def};
                } else {
                    array[row][i] = def;
                }
            }
        } else {
            array[row] = Array(cols).fill(def);
        }
    }
    return array;

}
function createInitArray(size) {
    let tilesPreparation = create2dArray(size, size);
    /* following can be deleted after prototyping ends*/
    for(let i = 0; i<size;i++)
        for(let j = 0; j<size;j++)
            tilesPreparation[i][j] = {
                text: i+","+j
            };
    return tilesPreparation;
}

let colorMap = {0:"red", 1:"blue", 2:"dark", 3:"grey"};
function createGameMap(size) {
    let gameMap = create2dArray(size, size, {tileType: "grey", colorCode:3} );

    let redCount = parseInt(size*size * 0.36);
    let blueCount = redCount - 1;
    let blackCount = 1;

    let colorsCount = [redCount, blueCount, blackCount];
    for (let colorIndex = 0; colorIndex<colorsCount.length; colorIndex++) {
        let currentCount = 0;
        while (currentCount < colorsCount[colorIndex]) {
            let row=parseInt(Math.random()*size);
            let col=parseInt(Math.random()*size);
            if(gameMap[row][col].tileType === "grey") {
                gameMap[row][col] = {tileType: colorMap[colorIndex]};
                gameMap[row][col].colorCode = colorIndex;
                currentCount++;
            }
        }
    }
    return gameMap;
}

function initGameMap(tiles, size){
    let gameMap = createGameMap(size);
    for(let row = 0; row < size; row++){
        for(let col = 0; col < size; col++){
            gameMap[row][col].text = tiles[row][col].text;
        }
    }
    //printArray(tiles, "end of initGameMap");
    return gameMap;
}

function printArray(arr, reason = ""){
    if(reason !== ""){
        console.log(reason);
    }
    for(let row = 0; row < arr.length; row++) {
        let acc = "";
        for(let col = 0; col < arr.length; col++) {
            acc += arr[row][col].text +":" + arr[row][col].tileType + " ";
        }
        console.log(acc);
    }
}

function iHateThis(oldArray) {  
    return JSON.parse(JSON.stringify(oldArray));
}

const obfus = "0012320";
function getGamePlanCode(plan){
    let code="";
    for(let i=0;i<plan.length;i++){
        for(let j=0;j<plan[i].length;j++){
            code+=plan[i][j].colorCode;
        }
    }
    return obfus+code+obfus;
}

function useQueryParams() {
    const params = new URLSearchParams(
        window ? window.location.search : {}
    );

    return new Proxy(params, {
        get(target, prop) {
            return target.get(prop)
        },
    });
}

let App = ({size=5, }) => {
    let tempColors = create2dArray(size,size)

    const { gameplan, ...unknown } = useQueryParams();
    if(gameplan!==null){
        let decodedPlan=gameplan.substring(obfus.length, gameplan.length-obfus.length);
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++)
                tempColors[row][col] = colorMap[decodedPlan[row*size+col]];
        }
    }
    let [currentColors, setCurrentColors] = useState(tempColors);

    let tempTiles = createInitArray(size);
    tempTiles = initGameMap(tempTiles, size);
    for(let row = 0; row<size; row++) {
        for(let col = 0; col<size; col++)
            tempTiles[row][col].tileType = currentColors[row][col];
    }
    let [tiles, setTiles] = useState(tempTiles);
    let [labelForSetGameMapInput, setLabelForSetGameMapInput] = useState("enter new gamemap");

    function changeColor(x,y,color){
        let copy = iHateThis(currentColors);
        copy[x][y] = color;
        setCurrentColors(copy);
    }

    function handleChangeColors(event){
        setLabelForSetGameMapInput("processing");
        let value = event.target.value;  
        if(value.length !== size*size + 2*obfus.length) {
            setLabelForSetGameMapInput("invalid length");
            return;
        }
        let result = create2dArray(size,size);
        let resultTiles = create2dArray(size,size);

        let decodedPlan=value.substring(obfus.length, value.length-obfus.length);
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++) {
                resultTiles[row][col] = {...tiles[row][col]};
                resultTiles[row][col].colorCode = decodedPlan[row*size+col];
                resultTiles[row][col].tileType   = colorMap[decodedPlan[row*size+col]];
            }
        }
        setTiles(resultTiles);
        setCurrentColors(result);
        if(labelForSetGameMapInput === "change was succesful"){
            setLabelForSetGameMapInput("new map was loaded");
        } else {
            setLabelForSetGameMapInput("change was succesful");
        }
    }


    return (
        <div>
        <div className='rowC'>
        <Board tiles={tiles}
        currentColors={currentColors}
        changeColor={changeColor}
        />
        <div>
        <Textareademo size={size} tiles={tiles} setTiles={ (value) => setTiles(value) }    />
        </div>
        </div>
        <button className="redraw" onClick={() => {
            setTiles(initGameMap(tiles, size));
            setCurrentColors(create2dArray(size,size));
        }
        }>
        redraw map
        </button>
        <a href={"?gameplan="+getGamePlanCode(tiles)} > send link to codemaster, do not click</a>
        <label htmlFor="gameplan-input">
        Set gameplan:
        <input id="gameplan-input" type="text" onChange={handleChangeColors} />
        </label>
        <label id="gameplan-input-message" data-testid="gameplan-label">
        {labelForSetGameMapInput}
        </label>
        </div>
    );
}

export default App;
