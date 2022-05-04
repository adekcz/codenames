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


test('renders learn react link', () => {
    render(<App />);
    let button = screen.getByText("redraw map");
    expect(button).toBeInTheDocument();
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


function setup(jsx) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}

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

test('entering gameplan via input', async () => {
    const {user} = setup(<App />)
    let tiles = screen.getAllByRole("test-tile");
    expect(tiles[0]).toHaveClass("tile", {exact: true});
    let textarea = screen.getByLabelText("Set gameplan:");
    await user.type(textarea, "001232030010301101300033320311110012320");
    await user.click(tiles[0]);
    expect(tiles[0]).toHaveTextContent("0,0grey");
    expect(tiles[0]).toHaveClass("tile grey", {exact: true});
    let label = screen.getByTestId("gameplan-label");
    expect(label).toHaveTextContent("change was succesful");
    await user.clear(textarea);
    expect(label).toHaveTextContent("invalid length");
    await user.type(textarea, "001232000010301101300033320311110012320");
    await user.click(tiles[0]);
    expect(tiles[0]).toHaveClass("tile red", {exact: true});
})
