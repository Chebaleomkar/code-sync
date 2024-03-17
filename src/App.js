import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import { Toaster } from 'react-hot-toast';
import CodeEditor from './components/Editor';

function App() {
  return (
    <>
    <div>
      <Toaster position="top-right" toastOptions={{duration : 3000}} />
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/editor/:roomId' element={<EditorPage />} />
          </Routes>
        </BrowserRouter>
    
    </div>

 
    </>
  );
}

export default App;
