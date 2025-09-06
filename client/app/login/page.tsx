import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import Footer from '../components/Footer';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPath="/login" />
      <main className="flex-1">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}
