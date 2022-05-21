import React, {useState} from 'react';
import './App.css';
import './images/rip.png';

let colorMap = {0:"red", 1:"blue", 2:"dark", 3:"grey"};

function Tile(props) {
    let color = props.currentColors[props.x][props.y];
    return (
        <button 
            data-testid="test-tile"
            className={"tile" + ( color ? " " + color : "")} 
            onClick={(e) => props.changeColor(props.x, props.y, props.tileType) }>
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

function WordsInputArea(props)  {
    let [textAreaValue, setTextAreaValue] = useState("");
    let [status, setStatus] = useState("");

    function update(currentValue, size) {
        const newArr = [];
        let arr = currentValue.split(/\b/g);
        arr = arr.filter(word => word.trim() !== "");
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++)
            {
                let index = row*size + col;
                if(arr.length> index) {
                    arr[index] = {...props.tiles[row][col], ...{text: arr[index]}};
                } else {
                    arr[index] = {...props.tiles[row][col], ...{text: ""}};
                }
            }
        }

        while(arr.length) newArr.push(arr.splice(0,size));
        props.setTiles(newArr);

    }

    function handleChange(event) {
        const size = props.size;
        const tilesCount = props.size**2;

        let currentValue = event.target.value;
        let wordCount = (currentValue.match(/\b/g) || '').length / 2;
        if (wordCount > tilesCount) {
            return;
        }
        update(currentValue, size);
        setTextAreaValue(currentValue);
        if (wordCount < tilesCount) {
            setStatus("you need " + (tilesCount-wordCount) + " more words");
        }
        if (wordCount === tilesCount) {
            setStatus("Good job. Words set up! (you cannot add new words anymore, you can edit though)");
        }
    }


    return (
        <div className="wordInputWrapper">
            <div>
            <label htmlFor="word-input">Enter value:</label>
            </div>
            <textarea id="word-input"
                value={textAreaValue}
                onChange={handleChange}
                rows={props.size**2}
                cols={15}
            />
            <p data-testid="wordInputStatus">{status}</p>
        </div>
    );
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
    for(let i = 0; i<size;i++)
        for(let j = 0; j<size;j++)
            tilesPreparation[i][j] = {
                text: i+","+j
            };
    return tilesPreparation;
}

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
    return gameMap;
}

function copyNew(oldArray) {  
    return JSON.parse(JSON.stringify(oldArray));
}

/**
 * scrambles game map plus adds random numbers out of range;
 */
function encodeGamePlan(plan){
    let code="";
    for(let i=0;i<plan.length;i++){
        for(let j=0;j<plan[i].length;j++){
            if(Math.random() > 0.5) {
                code+= Math.floor(Math.random()*5+5)
            }
            code+=plan[j][i].colorCode;
        }
    }
    return code;
}

function decodeGamePlan(encoded, size){
    let filtered = ""
    for (let c of encoded) {
        if(parseInt(c) >= 0 && parseInt(c) <=3) {
            filtered += c;
        }
    }

    let decoded = new Array(size*size);
    for(let i=0;i<size;i++){
        for(let j=0;j<size;j++){
            decoded[j*size + i] = filtered[i*size+j];
        }
    }
    return decoded;

}

//const { gameplan, ...unknown } = useQueryParams();
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

function handleGameplan(gameplan, colors, tiles) {
    let size=colors.length;
    if(gameplan!==null){
        let decodedPlan=decodeGamePlan(gameplan, tiles[0].length);
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++)
            {
                colors[row][col] = colorMap[decodedPlan[row*size+col]];
                tiles[row][col].tileType = colors[row][col];
                tiles[row][col].colorCode = decodedPlan[row*size+col];
            }
        }
    }
}

let App = ({size=5, }) => {
    let tempColors = create2dArray(size,size)
    let tempTiles = createInitArray(size);
    tempTiles = initGameMap(tempTiles, size);

    const { gameplan } = useQueryParams();
    handleGameplan(gameplan, tempColors, tempTiles);

    let [currentColors, setCurrentColors] = useState(tempColors);
    let [tiles, setTiles] = useState(tempTiles);
    let [labelForSetGameMapInput, setLabelForSetGameMapInput] = useState("enter new gamemap");

    function changeColor(x,y,color){
        let copy = copyNew(currentColors);
        copy[x][y] = color;
        setCurrentColors(copy);
    }

    function validateGameplan(code, size) {
        let count = 0;
        for(let c of code){
            if(parseInt(c) >=0 && parseInt(c) <=3) {
                count++;
            }
        }
        return count === size*size;
    }

    function handleChangeColors(event){
        setLabelForSetGameMapInput("processing");
        let value = event.target.value;  
        if(!validateGameplan(value, size)) {
            setLabelForSetGameMapInput("invalid length");
            return;
        }
        let result = create2dArray(size,size);
        let resultTiles = create2dArray(size,size);

        let decodedPlan=decodeGamePlan(value, size);
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
            <h1>Ugly codenames</h1>
            <div className='rowFlex'>
                <Board tiles={tiles}
                    currentColors={currentColors}
                    changeColor={changeColor}
                />
                <div className='columnFlex'>
                    <div>
                        <button className="redraw" onClick={() => {
                            setTiles(initGameMap(tiles, size));
                            setCurrentColors(create2dArray(size,size));
                        }
                            }>
                            redraw map
                        </button>
                    </div>
                    <div>
                        <a href={"?gameplan="+encodeGamePlan(tiles)} > send link to codemaster, do not click</a>
                    </div>
                    <div>
                        <label htmlFor="gameplan-input">
                            Set gameplan:
                            <input id="gameplan-input" type="text" onChange={handleChangeColors} />
                        </label>
                        <label id="gameplan-input-message" data-testid="gameplan-label">
                            {labelForSetGameMapInput}
                        </label>
                    </div>
                    <div>
                        <WordsInputArea size={size} tiles={tiles} setTiles={ (value) => setTiles(value) }    />
                    </div>
                </div>
            </div>
            <h2>About</h2>
            <h3>Basics</h3>
            <p>
                Red team always starts.
            </p>
            <p>
                Use <i>right click -> copy link address</i> to send reveald game plan to codemasters. Do not click on it ;) 
            </p>
            <p>
                Enter 25 words into big text area.
            </p>
            <h3>Advanced</h3>
            <p>
                Redraw map resets clicked tiles and generates new game plan.
            </p>
            <p>
                You can use code from URL sent to codemaster to regenerate given game plan.
            </p>
        </div>
    );
}

export default App;
