import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';

const size = 5;
const wordCount= size*size;

function Tile(props) {
    return (
        <button 
        className={"tile "+props.tileType} 
        >
        {props.text}
        </button>
    );

}

class Board extends React.Component {

    renderTile(row, col) {
        return <Tile
        key={row + " " + col}
        text={this.props.tiles[row][col].text} 
        tileType={this.props.tiles[row][col].tileType} 
        onClick={this.props.onClick}
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
                                this.renderTile(rowId, colId)
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
        if (lines > wordCount) {
            return;
        }
            const newArr = [];
            let arr = currentValue.split(/\b/g);
            arr = arr.filter(word => word.trim() !== "");
            for(let row = 0; row<size; row++) {
                for(let col = 0; col<size; col++)
                {
                    let index = row*size + col;
                    if(arr.length> index) {
                        arr[index] = {...this.props.tiles[row][col], ...{text: arr[index]}};
                    } else {
                        arr[index] = {text: "", tileType: this.props.tiles[row][col].tileType};
                    }
                }
            }

            while(arr.length) newArr.push(arr.splice(0,size));
            this.props.setTiles(newArr);
        this.setState(
            {
                textAreaValue: currentValue
            }
        );
        if (lines < wordCount) {
            this.setState({status: "you need " + (wordCount-lines) + " more lines"})
        }
        if (lines === wordCount) {
            this.setState({status: "Good job. Words set up! (you now cannot add new words, you can edit though)"})
        }
    }

    render() {
        return (
            <div>
            <label>Enter value : </label>
            <br />
            <span>{this.state.status}</span>
            <br />
            <textarea
                value={this.state.textAreaValue}
                onChange={this.handleChange}
                rows={wordCount}
                cols={15}
            />
            </div>
        );
    }
}

function create2dArray(rows, cols, def=null) {
    let array = Array(rows).fill(null);
    for (let row = 0; row<rows; row++) {
        array[row] = Array(cols).fill(def);
    }
    return array;

}
function createInitArray() {
    let tilesPreparation = create2dArray(size, size);
    /* following can be deleted after prototyping ends*/
    for(let i = 0; i<size;i++)
        for(let j = 0; j<size;j++)
            tilesPreparation[i][j] = {
                text: i+","+j,
                tileType: "grey"
            };
    return tilesPreparation;
}

function createGameMap(size) {
    let colorMap = {0:"red", 1:"blue", 2:"dark"}
    let gameMap = create2dArray(size, size, "grey");

    let redCount = parseInt(size*size * 0.36);
    let blueCount = redCount - 1;
    let blackCount = 1;

    let colorsCount = [redCount, blueCount, blackCount];
    for (let colorIndex = 0; colorIndex<colorsCount.length; colorIndex++) {
        let currentCount = 0;
        while (currentCount < colorsCount[colorIndex]) {
            let row=parseInt(Math.random()*size);
            let col=parseInt(Math.random()*size);
            if(gameMap[row][col] === "grey") {
                gameMap[row][col] = colorMap[colorIndex];
                currentCount++;
            }
        }
    }
    return gameMap;
}

function initGameMap(tiles){
    console.log("INIT");
    console.log(tiles.length);
    let gameMap = createGameMap(size);
    for(let row = 0; row < size; row++){
        for(let col = 0; col < size; col++){
            gameMap[row][col] = {tileType: gameMap[row][col]};
            gameMap[row][col].text = tiles[row][col].text;
        }
    }
    printArray(tiles, "end of initGameMap");
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

let App = () => {
    let tempTiles = createInitArray();
    tempTiles = initGameMap(tempTiles);
    let [tiles, setTiles] = useState(tempTiles);
    printArray(tiles, "redrawing in app");

    return (
            <div>
            <Board tiles={tiles}
            />
            <button  onClick={() => setTiles(initGameMap(tiles))}>
                redraw map
            </button>
            <button  onClick={() => printArray(tiles, "on print tiles")}>
                print tiles
            </button>
            <Textareademo tiles={tiles} setTiles={ (value) => setTiles(value) }    />
            </div>
    );
}

export default App;
