import { render, screen } from '@testing-library/react';
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

test('renders grid of correct size', () => {
    render(<App />);
    let tiles = screen.getAllByRole("test-tile");
      expect(tiles).toHaveLength(25);
    render(<App size=4/>);
    let tiles = screen.getAllByRole("test-tile");
      expect(tiles).toHaveLength(16);
});
