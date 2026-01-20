'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Calendar, Shield, Zap, Award, ArrowRight, Medal, Flame, Star } from 'lucide-react';

export default function Home() {
  const traditionalSports = [
    { name: 'Football', icon: '⚽', color: 'from-green-500 to-emerald-600' },
    { name: 'Cricket', icon: '🏏', color: 'from-blue-500 to-cyan-600' },
    { name: 'Table Tennis', icon: '🏓', color: 'from-orange-500 to-red-600' },
    { name: 'Badminton', icon: '🏸', color: 'from-purple-500 to-pink-600' },
  ];
  
  const esports = [
    { name: 'FIFA', icon: '🎮', color: 'from-indigo-500 to-purple-600' },
    { name: 'Tekken', icon: '🥊', color: 'from-red-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        {/* Floating Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-4 py-12 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Olympic Rings Inspired */}
            <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-blue-400 opacity-80"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-amber-400 opacity-80 -ml-2 sm:-ml-3"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-slate-400 opacity-80 -ml-2 sm:-ml-3"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-emerald-400 opacity-80 -ml-2 sm:-ml-3"></div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-3 sm:border-4 border-rose-400 opacity-80 -ml-2 sm:-ml-3"></div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mb-4 sm:mb-6 shadow-lg shadow-amber-500/30">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Mini Olympics 2026</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-4 sm:mb-6 text-white tracking-tight">
              FCIT <span className="gradient-text">Sports Society</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-blue-100 mb-3 sm:mb-4 font-medium">
              Registration Portal
            </p>
            <p className="text-sm sm:text-lg text-blue-200/70 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
              Join the most exciting sports competition of the year. Register now and be part of the action!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 btn-shine">
                  Register Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Categories */}
      <div className="container mx-auto px-4 py-10 sm:py-20">
        <div className="text-center mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 rounded-full mb-3 sm:mb-4">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="text-xs sm:text-sm font-semibold text-blue-700">Compete & Win</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Sports Categories</h2>
          <p className="text-base sm:text-xl text-slate-600">Choose your favorite sport and compete for glory</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 mb-10 sm:mb-16">
          {/* Traditional Sports */}
          <Card className="border-0 shadow-xl sm:shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden bg-white">
            <div className="h-1.5 sm:h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30">
                  <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                Traditional Sports
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                Physical sports competitions
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6 sm:pb-8 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {traditionalSports.map((sport) => (
                  <div
                    key={sport.name}
                    className={`p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-to-br ${sport.color} text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer`}
                  >
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{sport.icon}</div>
                    <div className="font-bold text-sm sm:text-lg">{sport.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Esports */}
          <Card className="border-0 shadow-xl sm:shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden bg-white">
            <div className="h-1.5 sm:h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600"></div>
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/30">
                  <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                Esports
              </CardTitle>
              <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                Competitive gaming tournaments
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6 sm:pb-8 p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4 max-w-md mx-auto">
                {esports.map((game) => (
                  <div
                    key={game.name}
                    className={`p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gradient-to-br ${game.color} text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer`}
                  >
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{game.icon}</div>
                    <div className="font-bold text-sm sm:text-lg">{game.name}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg sm:rounded-xl">
                <p className="text-xs sm:text-sm text-amber-800 font-medium flex items-center gap-2">
                  <span className="text-lg sm:text-xl">⚠️</span>
                  <strong>OC esports</strong> matches will be held in OC on scheduled dates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mb-10 sm:mb-20">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-100 rounded-full mb-3 sm:mb-4">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              <span className="text-xs sm:text-sm font-semibold text-emerald-700">Why Choose Us</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Why Register With Us?</h2>
            <p className="text-base sm:text-xl text-slate-600">Experience the best sports registration system</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            <Card className="border-0 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-blue-500/30">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Easy Registration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Simple multi-step registration process for all sports categories. Complete your registration in minutes!
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-emerald-500/30">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Multiple Payment Options</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Choose between online payment or cash payment at the desk. We support all convenient payment methods.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg sm:shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white sm:col-span-2 md:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-amber-500/30">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Secure & Verified</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  All registrations are verified and tracked securely. Your data is safe with us.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white border-0 shadow-xl sm:shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          <CardContent className="p-6 sm:p-12 relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
              <div className="stagger-fade-in">
                <div className="inline-flex p-2 sm:p-3 bg-amber-500/20 rounded-lg sm:rounded-xl mb-2 sm:mb-4">
                  <Medal className="h-5 w-5 sm:h-8 sm:w-8 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold mb-1 sm:mb-2">2026</div>
                <div className="text-xs sm:text-base text-blue-200">Mini Olympics</div>
              </div>
              <div className="stagger-fade-in">
                <div className="inline-flex p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl mb-2 sm:mb-4">
                  <Trophy className="h-5 w-5 sm:h-8 sm:w-8 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold mb-1 sm:mb-2">20+</div>
                <div className="text-xs sm:text-base text-blue-200">Sports Categories</div>
              </div>
              <div className="stagger-fade-in">
                <div className="inline-flex p-2 sm:p-3 bg-emerald-500/20 rounded-lg sm:rounded-xl mb-2 sm:mb-4">
                  <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-base text-blue-200">Registration Open</div>
              </div>
              <div className="stagger-fade-in">
                <div className="inline-flex p-2 sm:p-3 bg-rose-500/20 rounded-lg sm:rounded-xl mb-2 sm:mb-4">
                  <Shield className="h-5 w-5 sm:h-8 sm:w-8 text-rose-400" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold mb-1 sm:mb-2">100%</div>
                <div className="text-xs sm:text-base text-blue-200">Secure & Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="mt-10 sm:mt-20 text-center">
          <Card className="border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 shadow-xl sm:shadow-2xl overflow-hidden relative">
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"></div>
            <CardContent className="p-6 sm:p-14">
              <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg shadow-amber-500/30 mb-4 sm:mb-6">
                <Award className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Ready to Compete?</h3>
              <p className="text-sm sm:text-lg text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Don't miss out on the biggest sports event of the year. Register now and showcase your skills!
              </p>
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 btn-shine">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-10 sm:mt-20">
        <div className="container mx-auto px-4 py-6 sm:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-bold text-base sm:text-lg">Mini Olympics 2026</span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm text-center">© {new Date().getFullYear()} FCIT Sports Society. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
