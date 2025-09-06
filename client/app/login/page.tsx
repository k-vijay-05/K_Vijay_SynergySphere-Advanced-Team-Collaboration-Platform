import LoginForm from '../components/LoginForm';
import Footer from '../components/Footer';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
}
