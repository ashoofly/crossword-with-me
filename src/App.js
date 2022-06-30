import Navbar from './Navbar';
import Board from './Board';
import Clue from './Clue';
import Keyboard from './Keyboard';
import './styles.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Board />
      <Clue />
      <Keyboard />
    </div>
  );
}

export default App;
