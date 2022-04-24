import React from 'react';
import logo from './logo.svg';
import './App.css';

const size = 5;

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
            <Board tiles={this.tiles}
            />
        );
    }
}

export default App;
