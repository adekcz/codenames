import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { unmountComponentAtNode } from "react-dom";


let container = null;
beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
});


test('renders redraw button', () => {
    render(<App />);
    let button = screen.getByText("redraw map");
    expect(button).toBeInTheDocument();
});

test('clicking on tile changes it\'s color', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    await user.click(tiles[0]);
    expect(tiles[0]).not.toHaveClass("tile", {exact: true});
});

test('redrawing resets selected tiles', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    await user.click(tiles[0]);
    let button = screen.getByText("redraw map");
    await user.click(button);
    expect(tiles[0]).toHaveClass("tile", {exact: true});
});

test('renders grid with default size', () => {
    render(<App />);
    let tiles = screen.getAllByTestId("test-tile");
    expect(tiles).toHaveLength(25);
});

test('renders grid with custom size of 16', () => {
    render(<App size={4}/>);
    let tiles = screen.getAllByTestId("test-tile");
    expect(tiles).toHaveLength(16);
});


test('entering word into text area changes tile text', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    expect(tiles[0]).toHaveTextContent("0,0");
    let textarea = screen.getByLabelText("Enter value:");
    await user.type(textarea, "ahoj");
    expect(tiles[0]).toHaveTextContent("0,0");
    await user.clear(textarea);
    expect(tiles[0]).toHaveTextContent("");
    await user.type(textarea, "ahoj");
    expect(tiles[0]).toHaveTextContent("ahoj");
    expect(tiles[1]).toHaveTextContent("");
    await user.type(textarea, "{Enter}");
    await user.type(textarea, "neco");
    expect(tiles[0]).toHaveTextContent("ahoj");
    expect(tiles[1]).toHaveTextContent("neco");
})

test('after size*size words you cannot add more lines', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    let textarea = screen.getByLabelText("Enter value:");
    await user.clear(textarea);
    for(let i = 0; i<tiles.length;i++){
        await user.type(textarea, "a{Enter}");
    }
    expect(tiles[0]).toHaveTextContent("a");
    expect(tiles[24]).toHaveTextContent("a");
    let label = screen.getByTestId("wordInputStatus");
    expect(label).toHaveTextContent("Good job. Words set up! (you cannot add new words anymore, you can edit though)");
    await user.type(textarea, "b{Enter}");
    expect(textarea).not.toHaveTextContent("b");

})

test('entering gameplan via input', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    let tile = tiles[8];
    expect(tile).toHaveClass("tile", {exact: true});
    let textarea = screen.getByLabelText("Set gameplan:");
    await user.type(textarea, "8083011601381313707308281061360073910");
    await user.click(tile);
    expect(tile).toHaveTextContent("1,3");
    expect(tile).toHaveClass("tile blue", {exact: true});
    let label = screen.getByTestId("gameplan-label");
    expect(label).toHaveTextContent("change was succesful");
    await user.clear(textarea);
    expect(label).toHaveTextContent("invalid length");
    await user.type(textarea, "36190151015318203016008330138390081");
    tile = tiles[10];
    await user.click(tile);
    expect(tile).toHaveClass("tile red", {exact: true});
})

test('using URL parameter', async () => {
    changeJSDOMURL({ gameplan: "8083011601381313707308281061360073910" });
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    await user.click(tiles[0]);
    await user.click(tiles[1]);
    await user.click(tiles[2]);
    expect(tiles[0]).toHaveClass("tile red", {exact: true});
    expect(tiles[1]).toHaveClass("tile red", {exact: true});
    expect(tiles[2]).toHaveClass("tile blue", {exact: true});
    expect(tiles[3]).toHaveClass("tile dark", {exact: true});
    expect(tiles[5]).toHaveClass("tile grey", {exact: true});
});

function filter(code){
    let filtered = "";
    for (let c of code.slice(code.indexOf("gameplan")+1)) {
        if(parseInt(c) >= 0 && parseInt(c) <=3) {
            filtered += c;
        }
    }
    return filtered;
}

test('codemaster link works', () => {
    const gameplanCode = '8083011601381313707308281061360073910';
    let filteredCode = filter(gameplanCode);
    changeJSDOMURL({ gameplan: gameplanCode});
    render(<App />);
    let href = screen.getByText(/send link/i).getAttribute("href");
    let filteredHref  = filter(href);
    expect(filteredHref).toEqual(filteredCode);
});

test('codemaster link works after entering words', async () => {
    const gameplanCode = '8083011601381313707308281061360073910';
    let filteredCode = filter(gameplanCode);
    changeJSDOMURL({ gameplan: gameplanCode});
    const {user} = setup(<App />)
    let textarea = screen.getByLabelText("Enter value:");
    await user.type(textarea, "ahoj");
    let href = screen.getByText(/send link/i).getAttribute("href");
    let filteredHref  = filter(href);
    expect(filteredHref).toEqual(filteredCode);
    expect(href).toContain("ahoj");
});

test('codemaster link works with entered words', async () => {
    changeJSDOMURL({ gameplan: "8083011601381313707308281061360073910",
            wordsInUrl: "word1;word2"
    });
    const {user} = setup(<App />)
    let tiles = screen.getAllByTestId("test-tile");
    await user.click(tiles[0]);
    await user.click(tiles[1]);
    await user.click(tiles[2]);
    expect(tiles[0]).toHaveClass("tile red", {exact: true});
    expect(tiles[1]).toHaveClass("tile red", {exact: true});
    expect(tiles[2]).toHaveClass("tile blue", {exact: true});
    expect(tiles[3]).toHaveClass("tile dark", {exact: true});
    expect(tiles[5]).toHaveClass("tile grey", {exact: true});
    expect(tiles[0]).toHaveTextContent("word1");
    expect(tiles[1]).toHaveTextContent("word2");
    expect(tiles[2]).toHaveTextContent("");
});

function setup(jsx) {
    return {
        user: userEvent.setup(),
        ...render(jsx),
    }
}

function changeJSDOMURL(search, url = "https://www.example.com/") {
    const newURL = new URL(url);
    newURL.search = new URLSearchParams(search);
    const href = `${window.origin}${newURL.pathname}${newURL.search}${newURL.hash}`;
    window.history.replaceState(window.history.state, null, href);
}
