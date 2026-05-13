import React from "react";
import "@testing-library/jest-dom";

globalThis.React = React;

if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
}
