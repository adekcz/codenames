import React, { useState, useEffect, useContext } from 'react';
import { ChangeEvent } from 'react';
import './App.css';
import './images/rip.png';

//let colorMap = {"0":"red", "1":"blue", "2":"dark", "3":"grey"};
const colorMap = new Map<string, string>([
    ["0", "red"],
    ["1", "blue"],
    ["2", "dark"],
    ["3", "grey"]
]);
const sizeContext = React.createContext(5);

function textToColorCode(value: string) {
    for (const [key, currentValue] of colorMap.entries()) {
        if (value === currentValue) {
            return key;
        }
    }
    return 3;
}

interface TileProps {
    visibility: boolean;
    color: string;
    word: string;
    changeColor: () => void;
}

function Tile(props: TileProps) {
    return (
        <div className="square">
            <div className="content">
                <div className="table">
                    <div
                        data-testid="test-tile"
                        className={"tile" + (props.visibility ? " " + props.color : "")}
                        onClick={(e) => props.changeColor()}>
                        {props.word}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BoardProps {
    currentColors: string[][];
    words: string[];
    colorVisibilities: boolean[];
    changeColor: (row: number, col: number, size: number) => void;
}
function Board(props: BoardProps) {
    function getCurrentSize() {
        const smallerDimension = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
        return smallerDimension * 0.95;
    }

    const [boardSize, setBoardSize] = useState(getCurrentSize());
    const size = useContext(sizeContext);
    useEffect(() => {
        const updateWindowDimensions = () => {
            setBoardSize(getCurrentSize());
            console.log("updating height");
        };

        window.addEventListener("resize", updateWindowDimensions);

        return () => window.removeEventListener("resize", updateWindowDimensions)

    });

    function renderTile(row: number, col: number) {
        return (<Tile
            key={row + " " + col}
            color={props.currentColors[row][col]}
            visibility={props.colorVisibilities[row * size + col]}
            word={props.words[row * size + col]}
            changeColor={() => props.changeColor(row, col, size)}
        />);
    }

    return (
        <div className="board" style={{ width: boardSize, height: boardSize }} >
            {
                Array.from({ length: size ** 2 },
                    (_, i) =>
                        renderTile(...to2d(i, size))
                )
            }
        </div>
    )
}

interface WordsInputProps {
    words: string[];
    setWords: (arr: string[]) => void;
}
function WordsInputArea(props: WordsInputProps) {
    const defaultWords = props.words ? props.words.filter(word => word).join("\n") : "";
    let [textAreaValue, setTextAreaValue] = useState(defaultWords);
    let [status, setStatus] = useState("");
    const size = useContext(sizeContext);

    function update(currentValue: string, size: number) {
        let arr = currentValue.match(/\S+/g) || Array(size * size).fill("");
        arr = arr.filter(word => word.trim() !== "");
        props.setWords(arr);

    }

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        const tilesCount = size ** 2;

        let currentValue = event.target.value;
        let wordCount = (currentValue.match(/\S+/g) || '').length;
        if (wordCount > tilesCount) {
            return;
        }
        update(currentValue, size);
        setTextAreaValue(currentValue);
        if (wordCount < tilesCount) {
            setStatus("you need " + (tilesCount - wordCount) + " more words");
        }
        if (wordCount === tilesCount) {
            setStatus("Good job. Words set up! (you cannot add new words anymore, you can edit though)");
        }
    }


    return (
        <div className="wordInputWrapper">
            <div>
                <label htmlFor="word-input">Enter 25 words:</label>
            </div>
            <textarea id="word-input"
                value={textAreaValue}
                onChange={handleChange}
                rows={size ** 2}
                cols={15}
            />
            <p data-testid="wordInputStatus">{status}</p>
        </div>
    );
}

function create2dArray(rows: number, cols: number, def: string | null = null) {
    let array = Array(rows).fill(null);
    for (let row = 0; row < rows; row++) {
        array[row] = Array(cols).fill(def);
    }
    return array;

}

function createGameMap(size: number) {
    let newColors = create2dArray(size, size, "grey");

    let redCount = Math.trunc(size * size * 0.36);
    let blueCount = redCount - 1;
    let blackCount = 1;

    let colorsCount = [redCount, blueCount, blackCount];
    for (let colorIndex = 0; colorIndex < colorsCount.length; colorIndex++) {
        let currentCount = 0;
        while (currentCount < colorsCount[colorIndex]) {
            let row = Math.trunc(Math.random() * size);
            let col = Math.trunc(Math.random() * size);
            if (newColors[row][col] === "grey") {
                newColors[row][col] = colorMap.get(colorIndex.toString());
                currentCount++;
            }
        }
    }
    return newColors;
}

/**
 * scrambles game map plus adds random numbers out of range;
 */
function encodeGamePlan(plan: string[][]) {
    let code = "";
    for (let i = 0; i < plan.length; i++) {
        for (let j = 0; j < plan[i].length; j++) {
            while (Math.random() > 0.3) {
                code += Math.floor(Math.random() * 5 + 5);
            }
            code += textToColorCode(plan[j][i]);
        }
    }
    return code;
}

function getWordsForUrl(words: string[]) {
    return words.join(";");
}

function decodeGamePlan(encoded: string, size: number) {
    let filtered = ""
    for (let c of encoded) {
        if (parseInt(c) >= 0 && parseInt(c) <= 3) {
            filtered += c;
        }
    }

    let decoded = new Array(size * size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            decoded[j * size + i] = filtered[i * size + j];
        }
    }
    return decoded;

}

//const { gameplan, ...unknown } = useQueryParams();
function useQueryParams(): any {
    const params = new URLSearchParams(
        window ? window.location.search : {}
    );

    return new Proxy(params, {
        get(target, prop) {
            if (typeof prop === "string") {
                return target.has(prop) ? target.get(prop) : null;
            }
            return null;
        },
    });
}

function to2d(i: number, size: number): [number, number] {
    return [Math.floor(i / size), i % size];
}

/**
 * fills tiles with values from previous variables
 */
function handleGameplan(inGameplan: string, inWords: string, outColors: string[][], colorsVisibilities: boolean[], outWords: string[]) {
    let size = outColors.length;

    if (inGameplan !== null) {
        colorsVisibilities.fill(true);
        let decodedPlan = decodeGamePlan(inGameplan, outColors.length);
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                outColors[row][col] = colorMap.get(decodedPlan[row * size + col]) || "grey";
            }
        }
    }
    if (!inWords) {
        for (let i = 0; i < size * size; i++) {
            let [x, y] = to2d(i, size);
            outWords.push(x + "," + y);
        }
    } else {
        outWords.push(...inWords.split(";"));
    }
}

let App = ({ size = 5, }) => {
    let tempColors = createGameMap(size);
    let tempColorVisibilities = Array(size * size).fill(false);
    let tempWords: string[] = [];

    const { gameplan, wordsInUrl } = useQueryParams();
    handleGameplan(gameplan, wordsInUrl, tempColors, tempColorVisibilities, tempWords);

    let [words, setWords] = useState(tempWords);
    let [colorVisibilities, setColorVisibility] = useState(tempColorVisibilities);
    let [currentColors, setCurrentColors] = useState(tempColors);
    let [labelForSetGameMapInput, setLabelForSetGameMapInput] = useState("enter new gamemap");

    function changeColor(x: number, y: number, size: number) {
        let copy = [...colorVisibilities];
        copy[x * size + y] = true;
        setColorVisibility(copy);
    }

    function validateGameplan(code: string, size: number) {
        let count = 0;
        for (let c of code) {
            if (parseInt(c) >= 0 && parseInt(c) <= 3) {
                count++;
            }
        }
        return count === size * size;
    }

    function handleChangeColors(event: ChangeEvent<HTMLInputElement>): void {
        setLabelForSetGameMapInput("processing");
        let value = event.target.value;
        if (!validateGameplan(value, size)) {
            setLabelForSetGameMapInput("invalid length");
            return;
        }
        setColorVisibility(Array(size * size).fill(false));
        let newColors = create2dArray(size, size);

        let decodedPlan = decodeGamePlan(value, size);
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                newColors[row][col] = colorMap.get(decodedPlan[row * size + col]) || "grey";
            }
        }

        setCurrentColors(newColors);

        if (labelForSetGameMapInput === "change was succesful") {
            setLabelForSetGameMapInput("new map was loaded");
        } else {
            setLabelForSetGameMapInput("change was succesful");
        }
    }

    return (
        <sizeContext.Provider value={size}>
            <div>
                <h1>Ugly codenames</h1>
                <div className='rowFlex'>
                    <Board
                        words={words}
                        currentColors={currentColors}
                        colorVisibilities={colorVisibilities}
                        changeColor={changeColor}
                    />
                    <div className='columnFlex'>
                        <div>
                            <h2>Main controls</h2>
                            <h3>1. Enter words</h3>
                            <WordsInputArea
                                setWords={(value) => setWords(value)}
                                words={words}
                            />
                        </div>
                        <div>
                            <h3>2. send link to codemaster</h3>
                            <a href={"?wordsInUrl=" + getWordsForUrl(words) + "&gameplan=" + encodeGamePlan(currentColors)} >Secret codemaster link.</a>
                        </div>
                        <div>
                            <h2>Other controls</h2>

                            <div>
                                <button className="redraw" onClick={() => {
                                    setCurrentColors(createGameMap(size));
                                    setColorVisibility(Array(size * size).fill(false));
                                }
                                }>
                                    redraw map
                                </button>
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
                        </div>
                    </div>
                </div>
                <h2>About</h2>
                <h3>Basics</h3>
                <p>
                    Red team always starts.
                </p>
                <p>
                    Use <i>right click -&gt; copy link address</i> to send reveald game plan to codemasters. Do not click on it ;)
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
                <p>
                    <a href="https://github.com/adekcz/codenames">
                        https://github.com/adekcz/codenames
                    </a>
                </p>
            </div>
        </sizeContext.Provider>
    );
}

export default App;

