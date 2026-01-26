'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Calendar, Shield, Zap, Award, ArrowRight, Medal, Flame, Star, Gamepad2, Target, Dumbbell } from 'lucide-react';

export default function Home() {
  // All games with icons and colors
  const teamSports = [
    { name: 'Cricket', icon: '🏏', color: 'from-emerald-500 to-green-600', players: '11v11' },
    { name: 'Football', icon: '⚽', color: 'from-green-500 to-teal-600', players: '11v11' },
    { name: 'Hockey', icon: '🏑', color: 'from-blue-500 to-indigo-600', players: '11v11' },
    { name: 'Kabaddi', icon: '🤼', color: 'from-orange-500 to-red-600', players: '7v7' },
    { name: 'Swimming', icon: '🏊', color: 'from-cyan-500 to-blue-600' },
    { name: 'Tug of War', icon: '🪢', color: 'from-amber-500 to-orange-600', players: '10v10' },
    { name: 'Double Wicket', icon: '🏏', color: 'from-lime-500 to-green-600', players: '2v2' },
    { name: 'Pitho Gol Garam', icon: '🎯', color: 'from-rose-500 to-pink-600', players: '6v6' },
  ];

  const racketSports = [
    { name: 'Badminton Singles', icon: '🏸', color: 'from-purple-500 to-violet-600' },
    { name: 'Badminton Doubles', icon: '🏸', color: 'from-violet-500 to-purple-600', players: '2v2' },
    { name: 'Table Tennis Singles', icon: '🏓', color: 'from-orange-500 to-red-600' },
    { name: 'Table Tennis Doubles', icon: '🏓', color: 'from-red-500 to-orange-600', players: '2v2' },
  ];

  const boardGames = [
    { name: 'Chess', icon: '♟️', color: 'from-slate-600 to-slate-800' },
    { name: 'Ludo Singles', icon: '🎲', color: 'from-blue-500 to-indigo-600' },
    { name: 'Ludo Doubles', icon: '🎲', color: 'from-indigo-500 to-blue-600', players: '2v2' },
    { name: 'Carrom Singles', icon: '⚫', color: 'from-amber-600 to-yellow-700' },
    { name: 'Carrom Doubles', icon: '⚫', color: 'from-yellow-600 to-amber-700', players: '2v2' },
    { name: 'Jenga', icon: '🧱', color: 'from-orange-400 to-amber-500' },
    { name: 'Uno', icon: '🃏', color: 'from-red-500 to-rose-600' },
  ];

  const funGames = [
    { name: 'Foosball Doubles', icon: '⚽', color: 'from-cyan-500 to-blue-600', players: '2v2' },
    { name: 'Darts Singles', icon: '🎯', color: 'from-rose-500 to-red-600' },
    { name: 'Arm Wrestling', icon: '💪', color: 'from-purple-600 to-indigo-700' },
  ];

  const esports = [
    { name: 'Fifa', icon: '⚽', color: 'from-green-500 to-emerald-600' },
    { name: 'Tekken', icon: '🥊', color: 'from-red-500 to-orange-600' },
    { name: 'Call of Duty', icon: '🔫', color: 'from-slate-600 to-zinc-700' },
    { name: 'PUBG', icon: '🎯', color: 'from-amber-500 to-yellow-600' },
    { name: 'Subway Surfers', icon: '🏃', color: 'from-cyan-500 to-blue-500' },
  ];

  const GameCard = ({ game, size = 'normal' }: { game: { name: string; icon: string; color: string; players?: string }; size?: 'normal' | 'small' }) => (
    <div
      className={`relative group ${size === 'small' ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} rounded-xl bg-gradient-to-br ${game.color} text-white transform hover:scale-105 hover:-rotate-1 transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer overflow-hidden`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className={`${size === 'small' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} mb-1`}>{game.icon}</div>
        <div className={`font-bold ${size === 'small' ? 'text-xs sm:text-sm' : 'text-xs sm:text-base'} leading-tight`}>{game.name}</div>
        {game.players && (
          <div className={`${size === 'small' ? 'text-[10px]' : 'text-xs'} opacity-80 mt-0.5`}>{game.players}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M0 0h40v40H0z%22 fill=%22none%22/%3E%3Cpath d=%22M0 0h1v40H0zM39 0h1v40h-1zM0 0h40v1H0zM0 39h40v1H0z%22 fill=%22rgba(255,255,255,0.03)%22/%3E%3C/svg%3E')]"></div>
        
        <div className="relative container mx-auto px-4 py-16 sm:py-28">
          <div className="text-center max-w-5xl mx-auto">
            {/* Floating Badges */}
            <div className="flex justify-center gap-2 mb-6 sm:mb-8">
              {['🏆', '⚽', '🏏', '🎮', '♟️'].map((emoji, i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl sm:text-2xl border border-white/20 shadow-lg animate-bounce"
                  style={{ animationDelay: `${i * 100}ms`, animationDuration: '2s' }}
                >
                  {emoji}
                </div>
              ))}
            </div>
            
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6 shadow-xl shadow-amber-500/30">
              <Flame className="h-5 w-5 text-white animate-pulse" />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Mini Olympics 2026</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 text-white tracking-tight">
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">FCIT</span>
              {' '}
              <span className="text-white">Sports</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-blue-200 mb-4 font-light">
              21+ Games • One Championship • Unlimited Glory
            </p>
            <p className="text-sm sm:text-lg text-slate-400 mb-10 max-w-2xl mx-auto px-4">
              Join the most exciting sports competition in FCIT history. From Cricket to Chess, FIFA to Foosball - find your game and compete for glory!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-500 hover:via-orange-600 hover:to-rose-600 text-white shadow-2xl shadow-orange-500/40 font-bold rounded-2xl">
                  🏆 Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 bg-white/5 border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl">
                  Admin Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* All Games Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full mb-4">
            <Trophy className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">21+ Events</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">All Games & Sports</h2>
          <p className="text-lg sm:text-xl text-slate-400">Choose your battlefield and dominate the competition</p>
        </div>

        {/* Games Grid */}
        <div className="space-y-10 sm:space-y-14">
          {/* Team Sports */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Team Sports</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {teamSports.map((game) => <GameCard key={game.name} game={game} />)}
            </div>
          </div>

          {/* Racket Sports */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Racket Sports</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {racketSports.map((game) => <GameCard key={game.name} game={game} />)}
            </div>
          </div>

          {/* Board & Card Games */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Board & Card Games</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-500/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
              {boardGames.map((game) => <GameCard key={game.name} game={game} size="small" />)}
            </div>
          </div>

          {/* Fun & Skill Games */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Fun & Skill Games</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
              {funGames.map((game) => <GameCard key={game.name} game={game} />)}
            </div>
          </div>

          {/* Esports */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Esports</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-rose-500/50 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {esports.map((game) => <GameCard key={game.name} game={game} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-slate-800/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-xl text-white border border-white/10 shadow-2xl overflow-hidden">
          <CardContent className="p-8 sm:p-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 text-center">
              <div className="group">
                <div className="inline-flex p-4 bg-amber-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Medal className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400" />
                </div>
                <div className="text-3xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">21+</div>
                <div className="text-sm sm:text-lg text-slate-300">Games & Events</div>
              </div>
              <div className="group">
                <div className="inline-flex p-4 bg-blue-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
                </div>
                <div className="text-3xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">500+</div>
                <div className="text-sm sm:text-lg text-slate-300">Expected Players</div>
              </div>
              <div className="group">
                <div className="inline-flex p-4 bg-emerald-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                </div>
                <div className="text-3xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">24/7</div>
                <div className="text-sm sm:text-lg text-slate-300">Registration Open</div>
              </div>
              <div className="group">
                <div className="inline-flex p-4 bg-rose-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 sm:h-10 sm:w-10 text-rose-400" />
                </div>
                <div className="text-3xl sm:text-6xl font-black mb-2 bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent">100+</div>
                <div className="text-sm sm:text-lg text-slate-300">Teams Competing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Why Choose Us */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Why Participate?</h2>
          <p className="text-lg text-slate-400">More than just games - it's an experience</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Zap className="h-7 w-7" />, title: 'Fast Registration', desc: 'Complete your registration in under 2 minutes', color: 'from-amber-500 to-orange-600' },
            { icon: <Shield className="h-7 w-7" />, title: 'Secure Payments', desc: 'Multiple payment options with full security', color: 'from-blue-500 to-indigo-600' },
            { icon: <Users className="h-7 w-7" />, title: 'Team Support', desc: 'Easy team registration and management', color: 'from-emerald-500 to-teal-600' },
            { icon: <Trophy className="h-7 w-7" />, title: 'Big Prizes', desc: 'Exciting prizes for all category winners', color: 'from-rose-500 to-pink-600' },
          ].map((item, i) => (
            <Card key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-6">
                <div className={`inline-flex p-3 bg-gradient-to-br ${item.color} rounded-xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <Card className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          <CardContent className="relative p-10 sm:p-16 text-center">
            <div className="inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white mb-4">Ready to Compete?</h3>
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Don't miss out on the biggest sports event of the year. Register now and show everyone what you've got!
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg sm:text-xl px-12 py-7 bg-white text-orange-600 hover:bg-slate-100 font-bold rounded-2xl shadow-xl">
                🎯 Start Registration
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
