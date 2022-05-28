import React, {useState, useEffect} from 'react';
import './App.css';
import './images/rip.png';

let colorMap = {0:"red", 1:"blue", 2:"dark", 3:"grey"};

function textToColorCode(value) {
  return Object.keys(colorMap).find(key => colorMap[key] === value);
}

function Tile(props) {
    let color = props.currentColors[props.x][props.y];
    return (
        <div className="square">
            <div className="content">
                <div className="table">
                    <div 
                        data-testid="test-tile"
                        className={"tile" + ( props.colorVisibilities[props.x*props.size + props.y] ? " " + color : "")} 
                        onClick={(e) => props.changeColor(props.x, props.y, props.size) }>
                        {props.word}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Board(props)  {
    function getCurrentSize() {
        const smallerDimension =  window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
        return smallerDimension * 0.95;
    }

    const [boardSize, setBoardSize] = useState(getCurrentSize());
    useEffect(() => {
        const updateWindowDimensions = () => {
            setBoardSize(getCurrentSize());
            console.log("updating height");
        };

        window.addEventListener("resize", updateWindowDimensions);

        return () => window.removeEventListener("resize", updateWindowDimensions) 

    }, []);;

    function renderTile(row, col, changeColor, currentColors) {
        return ( <Tile
            key={row + " " + col}
            x={row}
            y={col}
            size={props.size}
            currentColors={currentColors}
            colorVisibilities={props.colorVisibilities}
            word={props.words[row*props.size+col]} 
            tileType={props.tiles[row][col].tileType} 
            changeColor={changeColor}
        />);
    }

    return (
        <div className="board" style={{width: boardSize, height: boardSize}} >
              {
                  Array.from({ length: props.size**2 }, 
                (_, i) => 
                    renderTile( to2d(i, props.size)[0], to2d(i, props.size)[1], props.changeColor, props.currentColors) 
                  )
            }
        </div>
    )
}

function WordsInputArea(props)  {
    const defaultWords = props.words ? props.words.filter(word => word).join("\n") : "";
    let [textAreaValue, setTextAreaValue] = useState(defaultWords);
    let [status, setStatus] = useState("");

    function update(currentValue, size) {
        let arr = currentValue.match(/\S+/g) || Array(size*size).fill("");
        arr = arr.filter(word => word.trim() !== "");
        props.setWords(arr);

    }

    function handleChange(event) {
        const size = props.size;
        const tilesCount = props.size**2;

        let currentValue = event.target.value;
        let wordCount = (currentValue.match(/\S+/g) || '').length;
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
    for (let i=0;i<plan.length;i++) {
        for (let j=0;j<plan[i].length;j++) {
            while (Math.random() > 0.3) {
                code+= Math.floor(Math.random()*5+5);
            }
            code+=textToColorCode(plan[j][i]);
        }
    }
    return code;
}

function getWordsForUrl(words){
    return words.join(";");
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

function convert2dTo1d(row, col, size) {
    return row*size + col;
}
function to2d(i, size) {
    return [Math.floor(i/size), i % size];
}

/**
 * fills tiles with values from previous variables
 */
function handleGameplan(gameplan, unsplittedWords, colors, colorsVisibilities, tiles) {
    let size=colors.length;
    let words = [];
    if(unsplittedWords) {
        words = unsplittedWords.split(";");
    }

    if(gameplan!==null){
        let decodedPlan=decodeGamePlan(gameplan, tiles[0].length);
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++)
            {
                colors[row][col] = colorMap[decodedPlan[row*size+col]];
                tiles[row][col].tileType = colors[row][col];
                tiles[row][col].colorCode = decodedPlan[row*size+col];
                colorsVisibilities[row*size+col] = true;
                if (words.length > convert2dTo1d(row, col, size)) {
                    if(words[convert2dTo1d(row, col, size)]) {
                        tiles[row][col].text = words[convert2dTo1d(row, col, size)];
                    } else {
                        tiles[row][col].text = "" ;
                    }
                } else {
                        tiles[row][col].text = "" ;
                }
            }
        }
    }
}

let App = ({size=5, }) => {
    let tempColors = create2dArray(size,size)
    let tempTiles = createInitArray(size);
    let tempColorVisibilities = Array(size*size).fill(false);
    tempTiles = initGameMap(tempTiles, size);

    const { gameplan, wordsInUrl } = useQueryParams();
    handleGameplan(gameplan, wordsInUrl, tempColors, tempColorVisibilities, tempTiles);
    for(let i = 0; i<tempTiles.length;i++){
        for(let j = 0; j<tempTiles[i].length;j++){
            tempColors[i][j] = tempTiles[i][j].tileType;
        }
    }
    let tempWords = wordsInUrl;
    if(!tempWords) {
        tempWords = [];
        for (let i = 0; i<size*size;i++){
            let [x,y] = to2d(i,size);
            tempWords.push(x+","+y);
        }
    } else {
      tempWords = wordsInUrl.split(";");
    }

    let [words, setWords] = useState(tempWords);
    let [colorVisibilities, setColorVisibility] = useState(tempColorVisibilities);
    let [currentColors, setCurrentColors] = useState(tempColors);
    let [tiles, setTiles] = useState(tempTiles);
    let [labelForSetGameMapInput, setLabelForSetGameMapInput] = useState("enter new gamemap");

    function changeColor(x,y, size){
        let copy = copyNew(colorVisibilities);
        copy[x*size + y] = true;
        setColorVisibility(copy);
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
        setColorVisibility(Array(size*size).fill(false));
        let newColors = create2dArray(size,size);

        let decodedPlan=decodeGamePlan(value, size);
        for(let row = 0; row<size; row++) {
            for(let col = 0; col<size; col++) {
                newColors[row][col] = colorMap[decodedPlan[row*size+col]];
            }
        }

        setCurrentColors(newColors);

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
                    words={words}
                    currentColors={currentColors}
                    colorVisibilities={colorVisibilities}
                    changeColor={changeColor}
                    size={size}
                />
                <div className='columnFlex'>
                    <div>
                        <button className="redraw" onClick={() => {
                            setCurrentColors(createGameMap(size).map(row => row.map(tile => tile.tileType)));
                            setColorVisibility(Array(size*size).fill(false));
                        }
                            }>
                            redraw map
                        </button>
                    </div>
                    <div>
                        <a href={"?wordsInUrl=" + getWordsForUrl(words) + "&gameplan=" + encodeGamePlan(currentColors)} > send link to codemaster, do not click</a>
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
                        <WordsInputArea 
                            size={size}
                            tiles={tiles}
                            setWords={ (value) => setWords(value) }
                            words={words}
                        />
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
