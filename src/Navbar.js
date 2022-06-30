import React from "react";
import './styles.css';
import nyt from './data/xwordinfo.json';

export default function Navbar() {
  return (
    <div className="Navbar">
      <h1>Crossword with Friends</h1>
      {/* <p>{nyt.title}</p>
      <p>Author: {nyt.author}</p>
      <p>Ed: {nyt.editor}</p>
      <small>	&copy; {nyt.copyright}</small> */}
    </div>
  )
}