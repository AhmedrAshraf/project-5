import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Globe, Sparkles, Check, ArrowRight, LogIn, Menu as MenuIcon, Star, Shield, Zap } from 'lucide-react';

const stats = [
  { label: 'Aktive Hotels', value: '100+' },
  { label: 'Zufriedene Gäste', value: '50k+' },
  { label: 'Bestellungen/Monat', value: '150k+' },
  { label: 'Verfügbarkeit', value: '99.9%' }
];

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    description: 'Der perfekte Start in die digitale Transformation.',
    features: [
      'Digitale Speisekarte',
      'Basis Bestellsystem',
      'Email Support',
      '1 Mitarbeiter'
    ],
    icon: Star
  },
  {
    name: 'Basic',
    price: '49',
    description: 'Professionelle Lösung für wachsende Hotels.',
    features: [
      'Digitale Speisekarte',
      'Erweitertes Bestellsystem',
      'SMS Benachrichtigungen',
      '5 Mitarbeiter',
      'Email & Chat Support',
      'Basis Analytics'
    ],
    highlighted: true,
    icon: Shield
  },
  {
    name: 'Premium',
    price: '99',
    description: 'Für wachsende Hotels mit höheren Anforderungen.',
    features: [
      'Alle Basic Features',
      'Unbegrenzte Bestellungen',
      'Eigene Domain',
      '20 Mitarbeiter',
      'Premium Support',
      'Erweiterte Analytics',
      'API Zugang'
    ],
    icon: Zap
  }
];

const features = [
  {
    icon: Building2,
    title: 'Digitalisieren Sie Ihr Hotel',
    description: 'Transformieren Sie Ihr Hotel in ein digitales Erlebnis. Verwalten Sie Bestellungen, Speisekarten und Services über eine intuitive Plattform.'
  },
  {
    icon: Users,
    title: 'Zufriedene Gäste',
    description: 'Begeistern Sie Ihre Gäste mit einem nahtlosen digitalen Erlebnis. Von der Bestellung bis zum Service - alles in einer App.'
  },
  {
    icon: Globe,
    title: 'Mehrsprachig',
    description: 'Erreichen Sie internationale Gäste in ihrer Sprache. Automatische Übersetzungen und lokalisierte Inhalte inklusive.'
  }
];

const testimonials = [
  {
    quote: "Die Implementierung war einfach und unsere Gäste lieben den Service.",
    author: "Maria Schmidt",
    role: "Hotelmanagerin",
    hotel: "Seehotel Sunshine",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg"
  },
  {
    quote: "Die Effizienz unseres Room Service hat sich deutlich verbessert.",
    author: "Thomas Weber",
    role: "F&B Manager",
    hotel: "Grand Hotel Vista",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
  }
];

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Glassmorphism Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-semibold text-gray-900">
                LYJA
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Preise
              </a>
              <Link to="/signin" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Anmelden
              </Link>
              <Link
                to="/signup"
                className="bg-accent text-white hover:bg-accent/90 px-3 py-2 rounded-lg text-sm font-medium"
              >
                Kostenlos starten
              </Link>
            </div>
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-gray-900 p-2">
                <MenuIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modern Hero Section with Background Pattern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25 animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent"></div>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent rounded-full blur-3xl transform rotate-12"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-accent/5 to-transparent rounded-full blur-3xl transform -rotate-12"></div>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 flex flex-col items-center justify-center">
              <span>Digitale Hotellösungen</span>
              <span className="relative whitespace-nowrap text-accent mt-2">
                <span className="relative inline-block">für moderne Gastgeber</span>
                <svg aria-hidden="true" viewBox="0 0 418 42" className="absolute left-0 top-2/3 h-[0.58em] w-full fill-accent/30" preserveAspectRatio="none"><path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path></svg>
              </span>
            </h1>
            <p className="mx-auto mt-6 text-lg md:text-xl text-gray-600">
              Optimieren Sie Ihren Roomservice, Ihre Speisekarte und das Gästeerlebnis mit unserer All-in-One-Plattform.
            </p>
            <div className="mt-10 flex justify-center gap-x-6 relative z-10">
              <Link
                to="/signup" 
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/20 flex items-center gap-2"
              >
                Kostenlos starten
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Mehr erfahren
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative -mt-12 sm:-mt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-5xl backdrop-blur-sm bg-white/90 rounded-2xl shadow-xl border border-gray-200/50">
            <dl className="grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col p-8">
                  <dt className="text-sm font-semibold leading-6 text-gray-600">
                    {stat.label}
                  </dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-accent">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-accent">Alles was Sie brauchen</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Digitalisieren Sie Ihr Hotel
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Unsere Plattform bietet alles, was Sie für ein modernes Hotelmanagement benötigen.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Wählen Sie Ihr Paket</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Flexible Pakete für Ihren Erfolg. Transparent und fair.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl px-8 py-10 ${
                  tier.highlighted ? 
                  'bg-gradient-to-br from-accent to-accent/90 text-white ring-1 ring-accent transform hover:scale-105 transition-all duration-300' : 
                  'bg-white ring-1 ring-gray-200 hover:ring-accent/50 hover:shadow-lg transition-all duration-300'
                } backdrop-blur-sm`}
              >
                <div className="mb-4">
                  <tier.icon className={`w-8 h-8 ${
                    tier.highlighted ? 'text-white' : 'text-accent'
                  }`} />
                </div>
                <h3 
                  className={`text-2xl font-bold ${
                    tier.highlighted ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {tier.name}
                </h3>

                <p className={`mt-4 text-sm ${
                  tier.highlighted ? 'text-white/90' : 'text-gray-600'
                }`}>
                  {tier.description}
                </p>
                
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-5xl font-bold tracking-tight">
                    {tier.price}€
                  </span>
                  <span className={`text-sm ${
                    tier.highlighted ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    /Monat
                  </span>
                </p>

                <ul
                  role="list"
                  className={`mt-8 space-y-3 text-sm ${
                    tier.highlighted ? 'text-white/90' : 'text-gray-600'
                  }`}
                >
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className={`h-6 w-5 flex-none ${
                        tier.highlighted ? 'text-white' : 'text-accent'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    tier.highlighted
                      ? 'bg-white text-accent hover:bg-gray-50 focus:ring-white'
                      : 'bg-accent text-white hover:bg-accent/90 focus:ring-accent'
                  } mt-auto`}
                >
                  Jetzt starten
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 sm:py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-lg font-semibold leading-8 tracking-tight text-accent">Testimonials</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Von Hotels empfohlen
            </p>
          </div>
          <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure 
                  key={testimonial.author} 
                  className="rounded-2xl bg-white p-8 text-sm leading-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="absolute -left-1 -top-1 text-6xl text-accent opacity-10 font-serif">
                    "
                  </div>
                  <blockquote className="text-gray-900">
                    <p>{`"${testimonial.quote}"`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <img
                      className="h-10 w-10 rounded-full bg-gray-50 object-cover"
                      src={testimonial.image}
                      alt={testimonial.author}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.author}</div>
                      <div className="text-gray-600">{`${testimonial.role}, ${testimonial.hotel}`}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8 overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl">
          <div
            className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-accent/20 to-accent/40 opacity-25"
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)'
            }}
          />
        </div>
        <div className="mx-auto max-w-2xl text-center relative">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Bereit für die digitale Transformation?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Starten Sie noch heute und erleben Sie, wie einfach die Digitalisierung Ihres Hotels sein kann.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/signup"
              className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/20 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Kostenlos testen
            </Link>
            <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
              Mehr erfahren <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}