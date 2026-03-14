import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { StockAnalysis } from './pages/StockAnalysis';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppLayout>
          <Routes>
            <Route path="/" element={<StockAnalysis />} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
