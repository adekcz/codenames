import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";


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
    let tiles = screen.getAllByRole("test-tile");
    await user.click(tiles[0]);
    expect(tiles[0]).not.toHaveClass("tile", {exact: true});
});

test('redrawing resets selected tiles', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByRole("test-tile");
    await user.click(tiles[0]);
    let button = screen.getByText("redraw map");
    await user.click(button);
    expect(tiles[0]).toHaveClass("tile", {exact: true});
});

test('renders grid with default size', () => {
    render(<App />);
    let tiles = screen.getAllByRole("test-tile");
    expect(tiles).toHaveLength(25);
});

test('renders grid with custom size of 16', () => {
    render(<App size={4}/>);
    let tiles = screen.getAllByRole("test-tile");
    expect(tiles).toHaveLength(16);
});


test('entering word into text area changes tile text', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByRole("test-tile");
    expect(tiles[0]).toHaveTextContent("0,0");
    let textarea = screen.getByLabelText("Enter value:");
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
    let tiles = screen.getAllByRole("test-tile");
    let textarea = screen.getByLabelText("Enter value:");
    for(let i = 0; i<tiles.length;i++){
        await user.type(textarea, "a{Enter}");
    }
    expect(tiles[0]).toHaveTextContent("a");
    expect(tiles[24]).toHaveTextContent("a");
    let label = screen.getByTestId("wordInputStatus");
    expect(label).toHaveTextContent("Good job. Words set up! (you now cannot add new words, you can edit though)");
    await user.type(textarea, "b{Enter}");
    expect(textarea).not.toHaveTextContent("b");

})

test('entering gameplan via input', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByRole("test-tile");
    expect(tiles[0]).toHaveClass("tile", {exact: true});
    let textarea = screen.getByLabelText("Set gameplan:");
    await user.type(textarea, "001232030010301101300033320311110012320");
    await user.click(tiles[0]);
    expect(tiles[0]).toHaveTextContent("0,0");
    expect(tiles[0]).toHaveClass("tile grey", {exact: true});
    let label = screen.getByTestId("gameplan-label");
    expect(label).toHaveTextContent("change was succesful");
    await user.clear(textarea);
    expect(label).toHaveTextContent("invalid length");
    await user.type(textarea, "001232000010301101300033320311110012320");
    await user.click(tiles[0]);
    expect(tiles[0]).toHaveClass("tile red", {exact: true});
})

test('using URL parameter', async () => {
    const url = '/?gameplan=001232000130113012331000013301310012320';
    changeJSDOMURL({ gameplan: "001232000130113012331000013301310012320" });
    const {user} = setup(<App />)
    let tiles = screen.getAllByRole("test-tile");
    await user.click(tiles[0]);
    await user.click(tiles[1]);
    await user.click(tiles[2]);
    expect(tiles[0]).toHaveClass("tile red", {exact: true});
    expect(tiles[1]).toHaveClass("tile red", {exact: true});
    expect(tiles[2]).toHaveClass("tile blue", {exact: true});
    expect(tiles[3]).toHaveClass("tile grey", {exact: true});
    expect(tiles[10]).toHaveClass("tile dark", {exact: true});
});

test('codemaster link works', () => {
    const gameplanCode = '001232000130113012331000013301310012320';
    changeJSDOMURL({ gameplan: gameplanCode});
    render(<App />);
    let link = screen.getByText(/send link/i);
    expect(link.getAttribute("href")).toEqual("?gameplan="+gameplanCode);
});

test('codemaster link works after entering words', async () => {
    const gameplanCode = '001232000130113012331000013301310012320';
    changeJSDOMURL({ gameplan: gameplanCode});
    const {user} = setup(<App />)
    let link = screen.getByText(/send link/i);
    let textarea = screen.getByLabelText("Enter value:");
    await user.type(textarea, "ahoj");
    expect(link.getAttribute("href")).toEqual("?gameplan="+gameplanCode);
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
    window.history.replaceState(history.state, null, href);
}
