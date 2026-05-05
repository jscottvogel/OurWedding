import Link from 'next/link';
import { CalendarHeart, Sparkles, CheckCircle2, Users } from 'lucide-react';
import DemoLoginButton from '@/components/auth/DemoLoginButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col font-body">
      {/* Navbar */}
      <header className="bg-white border-b border-light-gray py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-white mr-3">
            <CalendarHeart className="w-4 h-4" />
          </div>
          <span className="font-display text-xl text-sage tracking-tight">Wedding Steward</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-charcoal font-medium hover:text-sage transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="bg-sage text-white px-5 py-2 rounded-full font-medium hover:bg-dark-sage transition-colors shadow-sm">
            Start Planning
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-display text-charcoal mb-6 leading-tight">
            Plan your perfect day, <br className="hidden md:block" />
            <span className="text-sage">beautifully.</span>
          </h1>
          <p className="text-xl text-mid-gray mb-10 max-w-2xl mx-auto">
            The all-in-one platform for modern couples to manage budgets, vendors, RSVPs, and day-of timelines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/signup" className="w-full sm:w-auto bg-sage text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-dark-sage transition-colors shadow-md">
              Create Your Wedding
            </Link>
            <DemoLoginButton />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-white py-20 border-t border-light-gray">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-sage/10 rounded-2xl flex items-center justify-center text-sage mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display text-charcoal mb-3">Smart Checklists</h3>
              <p className="text-mid-gray">Stay on track with customizable timelines and vendor action items.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-sage/10 rounded-2xl flex items-center justify-center text-sage mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display text-charcoal mb-3">Guest Management</h3>
              <p className="text-mid-gray">Collect RSVPs, track dietary requirements, and build dynamic seating charts.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-sage/10 rounded-2xl flex items-center justify-center text-sage mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-display text-charcoal mb-3">AI Assistant</h3>
              <p className="text-mid-gray">Meet Ivy, your intelligent planning companion that helps draft timelines and budgets.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-charcoal text-white/70 py-8 text-center border-t border-charcoal/20">
        <p>© {new Date().getFullYear()} Wedding Steward. Built for couples, by couples.</p>
      </footer>
    </div>
  );
}
