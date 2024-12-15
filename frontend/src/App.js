import ImageUpload from './components/ImageUpload';
import './styles/globals.css';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Mysa HVAC Compatibility Checker</h1>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <ImageUpload />
      </main>
      <footer className="border-t">
        <div className="container mx-auto py-4 text-center text-sm text-muted-foreground">
          2024 Mysa HVAC Compatibility Checker
        </div>
      </footer>
    </div>
  );
}

export default App;
