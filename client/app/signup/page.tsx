import SignupForm from '../components/SignupForm';
import Footer from '../components/Footer';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
}
