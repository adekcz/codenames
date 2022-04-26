import React from 'react';
import logo from './logo.svg';
import './App.css';

const size = 3;
const wordCount= size*size;

function Tile(props) {
    return (
        <button className="tile" onClick={props.onClick}>
        {props.value}
        </button>
    );

}

class Board extends React.Component {

    renderTile(row, col) {
        return <Tile
        value={this.props.tiles[row][col]} 
        onClick={() => this.props.onClick(row, col)}
            />;
    }

    render() {
        return (
            <div>
            { this.props.tiles.map(
                (row, rowId) => 
                    (<div className="board-row">
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
        this.setState(
            {
                textAreaValue: currentValue
            }
        );
        if (lines < wordCount) {
            this.setState({status: "you need " + (wordCount-lines) + " more lines"})
        }
        if (lines === wordCount) {
            this.setState({status: "Good job. Words set up! "})
        }
    }

    render() {
        return (
            <div>
            <label>Enter value : </label>
            <span>{this.state.status}</span>
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

class App extends React.Component {
    constructor(props) {
        super(props);
        this.tiles = Array(size).fill(null);
        for (let row = 0; row<size; row++) {
            this.tiles[row] = Array(size).fill(null);
        }
        for(let i = 0; i<size;i++)
            for(let j = 0; j<size;j++)
                this.tiles[i][j] = i+","+j;
    }

    render() {
        return (
            <div>
            <Board tiles={this.tiles}
            />
            <Textareademo />
            </div>
        );
    }
}

export default App;
