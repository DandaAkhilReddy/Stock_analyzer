import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { StockAnalysis } from './pages/StockAnalysis';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<StockAnalysis />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
