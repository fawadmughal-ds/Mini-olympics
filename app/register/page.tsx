'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Circle, DollarSign, X, Copy, ExternalLink, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { gamesPricing as defaultGamesPricing, getAvailableGames as defaultGetAvailableGames, isTeamGame as defaultIsTeamGame, getRequiredPlayers as defaultGetRequiredPlayers } from '@/lib/games-pricing';

type TeamMember = {
  name: string;
  rollNumber: string;
  contactNumber: string;
};

type GamePrice = {
  name: string;
  boys: number | null;
  girls: number | null;
  boysPlayers?: number;
  girlsPlayers?: number;
};

type FormData = {
  email: string;
  name: string;
  rollNumber: string;
  contactNumber: string;
  alternativeContactNumber: string;
  gender: 'boys' | 'girls' | '';
  teamName: string;
  selectedGames: string[];
  teamMembers: Record<string, TeamMember[]>; // gameName -> array of team members
  paymentMethod: 'cash' | 'online' | '';
  transactionId: string;
  screenshotUrl: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    rollNumber: '',
    contactNumber: '',
    alternativeContactNumber: '',
    gender: '',
    teamName: '',
    selectedGames: [],
    teamMembers: {},
    paymentMethod: '',
    transactionId: '',
    screenshotUrl: '',
  });
  const [allGames, setAllGames] = useState<GamePrice[]>(defaultGamesPricing);
  const [availableGames, setAvailableGames] = useState<GamePrice[]>(defaultGamesPricing);
  const [sportGroups, setSportGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [teamNameStatus, setTeamNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [teamNameError, setTeamNameError] = useState('');

  // Fetch games from database on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Add timestamp to bust cache
        const res = await fetch(`/api/games?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setAllGames(data.data);
        } else {
          console.log('No games in database, using defaults');
        }
      } catch (e) {
        console.error('Failed to load games, using defaults:', e);
      }
    };
    fetchGames();
  }, []);

  // Helper functions that work with current allGames state
  const getAvailableGamesForGender = (gender: 'boys' | 'girls'): GamePrice[] => {
    return allGames.filter((game) => {
      return gender === 'boys' ? game.boys !== null : game.girls !== null;
    });
  };

  const getGamePrice = (gameName: string, gender: 'boys' | 'girls'): number | null => {
    const game = allGames.find((g) => g.name === gameName);
    if (!game) return null;
    return gender === 'boys' ? game.boys : game.girls;
  };

  const calculateTotal = (selectedGames: string[], gender: 'boys' | 'girls'): number => {
    let total = 0;
    selectedGames.forEach((gameName) => {
      const price = getGamePrice(gameName, gender);
      if (price !== null) {
        total += price;
      }
    });
    return total;
  };

  const getRequiredPlayers = (gameName: string, gender: 'boys' | 'girls'): number | null => {
    const game = allGames.find((g) => g.name === gameName);
    if (!game) return null;
    return gender === 'boys' ? (game.boysPlayers || null) : (game.girlsPlayers || null);
  };

  const isTeamGame = (gameName: string, gender: 'boys' | 'girls'): boolean => {
    const requiredPlayers = getRequiredPlayers(gameName, gender);
    return requiredPlayers !== null && requiredPlayers > 1;
  };

  useEffect(() => {
    if (formData.gender) {
      setAvailableGames(getAvailableGamesForGender(formData.gender));
      // Clear selected games and team members when gender changes
      setFormData((prev) => ({ ...prev, selectedGames: [], teamMembers: {} }));
      setSportGroups([]);
    }
  }, [formData.gender, allGames]);

  // Fetch sport groups for selected games
  useEffect(() => {
    const fetchGroups = async () => {
      if (!formData.gender || formData.selectedGames.length === 0) {
        setSportGroups([]);
        return;
      }
      setGroupsLoading(true);
      try {
        const params = new URLSearchParams({
          games: formData.selectedGames.join(','),
          regNum: '',
          name: formData.name || '',
          roll: formData.rollNumber || '',
          phone: formData.contactNumber || '',
          gender: formData.gender,
        });
        const res = await fetch(`/api/groups?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setSportGroups(data.data || []);
        }
      } catch (e) {
        console.error('Failed to load groups:', e);
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, [formData.selectedGames, formData.gender, formData.name, formData.rollNumber, formData.contactNumber]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Reset team name status when typing
    if (field === 'teamName') {
      setTeamNameStatus('idle');
      setTeamNameError('');
    }
  };

  // Check team name uniqueness
  const checkTeamName = async () => {
    const teamName = formData.teamName.trim();
    if (!teamName || teamName.length < 2) {
      setTeamNameError('Team name must be at least 2 characters');
      setTeamNameStatus('idle');
      return false;
    }
    
    setTeamNameStatus('checking');
    setTeamNameError('');
    
    try {
      const res = await fetch('/api/registrations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.isUnique) {
          setTeamNameStatus('available');
          setTeamNameError('');
          return true;
        } else {
          setTeamNameStatus('taken');
          setTeamNameError(data.message || 'Team name already taken');
          return false;
        }
      } else {
        setTeamNameError(data.error || 'Failed to verify team name');
        setTeamNameStatus('idle');
        return false;
      }
    } catch (e) {
      console.error('Team name check failed:', e);
      setTeamNameError('Failed to verify team name');
      setTeamNameStatus('idle');
      return false;
    }
  };

  const handleGameToggle = (gameName: string) => {
    setFormData((prev) => {
      const isSelected = prev.selectedGames.includes(gameName);
      if (isSelected) {
        // Remove game and its team members
        const newTeamMembers = { ...prev.teamMembers };
        delete newTeamMembers[gameName];
        return { 
          ...prev, 
          selectedGames: prev.selectedGames.filter((g) => g !== gameName),
          teamMembers: newTeamMembers
        };
      } else {
        // Add game and initialize team members if it's a team game
        const newTeamMembers = { ...prev.teamMembers };
        if (formData.gender && isTeamGame(gameName, formData.gender)) {
          const requiredPlayers = getRequiredPlayers(gameName, formData.gender) || 0;
          // Initialize with empty team members (excluding the current player)
          newTeamMembers[gameName] = Array(requiredPlayers - 1).fill(null).map(() => ({
            name: '',
            rollNumber: '',
            contactNumber: '',
          }));
        }
        return { 
          ...prev, 
          selectedGames: [...prev.selectedGames, gameName],
          teamMembers: newTeamMembers
        };
      }
    });
  };

  const handleTeamMemberChange = (gameName: string, index: number, field: keyof TeamMember, value: string) => {
    setFormData((prev) => {
      const newTeamMembers = { ...prev.teamMembers };
      if (!newTeamMembers[gameName]) {
        newTeamMembers[gameName] = [];
      }
      const updatedMembers = [...newTeamMembers[gameName]];
      updatedMembers[index] = {
        ...updatedMembers[index],
        [field]: value,
      };
      newTeamMembers[gameName] = updatedMembers;
      return { ...prev, teamMembers: newTeamMembers };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo (in production, upload to cloud storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        screenshotUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const totalAmount = formData.gender && formData.selectedGames.length > 0
    ? calculateTotal(formData.selectedGames, formData.gender)
    : 0;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          rollNumber: formData.rollNumber,
          contactNumber: formData.contactNumber,
          alternativeContactNumber: formData.alternativeContactNumber,
          gender: formData.gender,
          teamName: formData.teamName,
          selectedGames: formData.selectedGames,
          teamMembers: formData.teamMembers,
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId,
          screenshotUrl: formData.screenshotUrl,
          totalAmount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const params = new URLSearchParams({
          id: data.registrationId,
          slipId: data.slipId || '',
          method: formData.paymentMethod,
          total: totalAmount.toString(),
        });
        if (data.registrationNumber) {
          params.set('regNum', data.registrationNumber.toString());
        }
        if (formData.transactionId) {
          params.set('transactionId', formData.transactionId);
        }
        router.push(`/success?${params.toString()}`);
      } else {
        // Handle team name error specifically
        if (data.field === 'teamName') {
          setTeamNameStatus('taken');
          setTeamNameError(data.error);
          setStep(1); // Go back to step 1 to fix team name
          alert('Team name already exists! Please go back and choose a different team name.');
        } else {
          alert('Registration failed: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return (
        formData.email &&
        formData.name &&
        formData.rollNumber &&
        formData.contactNumber &&
        formData.gender &&
        formData.teamName &&
        teamNameStatus === 'available'
      );
    }
    if (step === 2) {
      return formData.selectedGames.length > 0;
    }
    if (step === 3) {
      return formData.paymentMethod && (formData.paymentMethod === 'cash' || (formData.transactionId && formData.screenshotUrl));
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4 sm:mb-8">
          <Link href="/" className="text-blue-600 hover:underline text-sm sm:text-base">
            ← Back to Home
          </Link>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-5 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold">Registration Form</CardTitle>
            <CardDescription className="text-blue-200 text-sm sm:text-base mt-1">
              Mini Olympics 2026 - FCIT Sports Society
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Progress Steps */}
            <div className="flex justify-between mb-6 sm:mb-8 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    {step >= s ? (
                      <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    ) : (
                      <Circle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                    )}
                    <span className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-center">Step {s}</span>
                  </div>
                  {s < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Personal Information</h3>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    placeholder="Enter your roll number"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boys">Male</SelectItem>
                      <SelectItem value="girls">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teamName">Team Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="teamName"
                      value={formData.teamName}
                      onChange={(e) => handleInputChange('teamName', e.target.value)}
                      placeholder="Enter your team name (e.g., Thunder Hawks)"
                      className={`flex-1 ${teamNameStatus === 'taken' ? 'border-red-500' : teamNameStatus === 'available' ? 'border-green-500' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkTeamName}
                      disabled={!formData.teamName.trim() || teamNameStatus === 'checking'}
                      className="whitespace-nowrap"
                    >
                      {teamNameStatus === 'checking' ? 'Checking...' : 'Check'}
                    </Button>
                  </div>
                  {teamNameStatus === 'available' && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Team name is available!
                    </p>
                  )}
                  {teamNameStatus === 'taken' && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {teamNameError}
                    </p>
                  )}
                  {teamNameStatus === 'idle' && !teamNameError && (
                    <p className="text-xs text-gray-500 mt-1">Choose a unique name for your team and click &quot;Check&quot;</p>
                  )}
                  {teamNameStatus === 'idle' && teamNameError && (
                    <p className="text-xs text-red-600 mt-1">{teamNameError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    required
                    pattern="[0-9]{4}-[0-9]{7}"
                    title="Format: 03XX-XXXXXXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 03XX-XXXXXXX (e.g., 0300-1234567)</p>
                </div>
                <div>
                  <Label htmlFor="alternativeContactNumber">Alternative Contact Number (Optional)</Label>
                  <Input
                    id="alternativeContactNumber"
                    value={formData.alternativeContactNumber}
                    onChange={(e) => handleInputChange('alternativeContactNumber', e.target.value)}
                    placeholder="03XX-XXXXXXX"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Select Games */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Select Games</h3>
                  {formData.gender && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      Gender: <span className="font-semibold capitalize">{formData.gender}</span>
                    </div>
                  )}
                </div>
                {(formData.selectedGames.includes('FIFA') || formData.selectedGames.includes('Tekken')) && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl mb-4">
                    <p className="text-sm text-yellow-900 font-semibold flex items-center gap-2">
                      <span className="text-xl">⚠️</span>
                      <strong>OC esports</strong> matches will be held in OC on scheduled dates.
                    </p>
                  </div>
                )}
                {!formData.gender ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">Please select your gender in Step 1 first.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                      {availableGames.map((game) => {
                        const price = formData.gender === 'boys' ? game.boys : game.girls;
                        const isSelected = formData.selectedGames.includes(game.name);
                        if (price === null) return null;

                        return (
                          <div
                            key={game.name}
                            onClick={() => handleGameToggle(game.name)}
                            className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm sm:text-base truncate">{game.name}</div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  Rs. {price.toLocaleString()}
                                  {formData.gender === 'boys' && game.boysPlayers && ` (${game.boysPlayers} Players)`}
                                  {formData.gender === 'girls' && game.girlsPlayers && ` (${game.girlsPlayers} Players)`}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Team Member Fields */}
                    {formData.selectedGames.map((gameName) => {
                      if (!formData.gender || !isTeamGame(gameName, formData.gender)) return null;
                      const requiredPlayers = getRequiredPlayers(gameName, formData.gender) || 0;
                      const teamMembers = formData.teamMembers[gameName] || [];
                      
                      return (
                        <div key={gameName} className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                          <h4 className="font-semibold text-base sm:text-lg mb-3 text-blue-900">
                            {gameName} - Team Members ({requiredPlayers} players required)
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-700 mb-4">
                            You are the team captain. Please add {requiredPlayers - 1} more team member(s):
                          </p>
                          <div className="space-y-4">
                            {teamMembers.map((member, index) => (
                              <div key={index} className="bg-white p-3 sm:p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                    {index + 1}
                                  </div>
                                  <span className="font-medium text-sm sm:text-base">Team Member {index + 1}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs sm:text-sm">Name</Label>
                                    <Input
                                      value={member.name}
                                      onChange={(e) => handleTeamMemberChange(gameName, index, 'name', e.target.value)}
                                      placeholder="Full name"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs sm:text-sm">Roll Number</Label>
                                    <Input
                                      value={member.rollNumber}
                                      onChange={(e) => handleTeamMemberChange(gameName, index, 'rollNumber', e.target.value)}
                                      placeholder="Roll number"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs sm:text-sm">Contact Number</Label>
                                    <Input
                                      value={member.contactNumber}
                                      onChange={(e) => handleTeamMemberChange(gameName, index, 'contactNumber', e.target.value)}
                                      placeholder="03XX-XXXXXXX"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {formData.selectedGames.length > 0 && (
                      <div className="mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            <span className="font-semibold text-base sm:text-lg">Total Amount:</span>
                          </div>
                          <span className="text-xl sm:text-2xl font-bold text-green-700">
                            Rs. {totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-xs sm:text-sm text-gray-600">
                          {formData.selectedGames.length} game(s) selected
                        </div>
                      </div>
                    )}

                    {/* Sport Groups Preview */}
                    {formData.selectedGames.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2 text-purple-900">
                          <Users className="h-5 w-5 text-purple-600" />
                          WhatsApp Groups (Join After Payment)
                        </h4>
                        <p className="text-xs sm:text-sm text-purple-700 mb-4">
                          After registration, you&apos;ll need to join these WhatsApp groups for updates:
                        </p>
                        {groupsLoading ? (
                          <div className="text-center py-4 text-slate-500">Loading groups...</div>
                        ) : sportGroups.length > 0 ? (
                          <div className="space-y-3">
                            {sportGroups.map((g, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm sm:text-base text-slate-800 truncate">
                                    {g.groupTitle || g.gameName}
                                  </p>
                                  <p className="text-xs text-slate-500">{g.gameName}</p>
                                </div>
                                {g.groupUrl ? (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                                    Group Available
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex-shrink-0">
                                    Coming Soon
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500 text-sm">
                            No groups configured for selected games yet.
                          </div>
                        )}
                        <p className="text-xs text-purple-600 mt-4 italic">
                          * You will get direct group links after completing your registration
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="mb-4 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm sm:text-base">Total Amount:</span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-700">
                      Rs. {totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Label>Payment Method *</Label>
                <div className="space-y-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === 'online'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleInputChange('paymentMethod', 'online')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={formData.paymentMethod === 'online'}
                        onChange={() => handleInputChange('paymentMethod', 'online')}
                      />
                      <span className="font-semibold">Online Payment</span>
                    </div>
                    {formData.paymentMethod === 'online' && (
                      <div className="mt-4 space-y-4">
                        {/* Bank Account Details */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 sm:p-4">
                          <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            Bank Account Details
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs sm:text-sm text-gray-600">Bank Name</Label>
                              <p className="font-semibold text-base sm:text-lg">UBL</p>
                            </div>
                            <div>
                              <Label className="text-xs sm:text-sm text-gray-600">Account Name</Label>
                              <p className="font-semibold text-base sm:text-lg">Fawad Mughal</p>
                            </div>
                            <div>
                              <Label className="text-xs sm:text-sm text-gray-600">Account Number</Label>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                                <p className="font-mono font-semibold text-base sm:text-lg text-blue-700 break-all">
                                  0863286208011
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText('0863286208011');
                                      setAccountCopied(true);
                                      setTimeout(() => setAccountCopied(false), 2000);
                                    } catch (err) {
                                      console.error('Failed to copy:', err);
                                    }
                                  }}
                                  className={`flex items-center gap-1 ${
                                    accountCopied
                                      ? 'bg-green-100 text-green-700 border-green-300'
                                      : ''
                                  }`}
                                >
                                  <Copy className="h-4 w-4" />
                                  {accountCopied ? 'Copied!' : 'Copy'}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs sm:text-sm text-yellow-800">
                              <strong>Important:</strong> Please transfer the exact amount (
                              <strong>Rs. {totalAmount.toLocaleString()}</strong>) to this account
                              and keep the transaction receipt.
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="transactionId">Transaction ID *</Label>
                          <Input
                            id="transactionId"
                            value={formData.transactionId}
                            onChange={(e) => handleInputChange('transactionId', e.target.value)}
                            placeholder="Enter transaction ID from your bank receipt"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the transaction ID from your bank transfer receipt
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="screenshot">Payment Proof (Screenshot/Image) *</Label>
                          <Input
                            id="screenshot"
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            required
                          />
                          {formData.screenshotUrl && (
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Payment proof uploaded successfully
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Upload a screenshot or photo of your bank transfer receipt
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Status:</strong>{' '}
                            <span className="font-semibold text-blue-700">Pending Verification</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Your payment will be verified by admin after submission
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleInputChange('paymentMethod', 'cash')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={() => handleInputChange('paymentMethod', 'cash')}
                      />
                      <span className="font-semibold">Cash Payment</span>
                    </div>
                    {formData.paymentMethod === 'cash' && (
                      <div className="mt-4">
                        <p className="text-xs sm:text-sm text-gray-700 mb-2">
                          Cash registration requires payment at the FCIT Sports Society desk.
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Status: <span className="font-semibold">Will Confirm Soon</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">
                          A cash slip ID will be generated after submission.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Review Your Registration</h3>
                <div className="space-y-3 bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-sm sm:text-base break-all">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-sm sm:text-base break-words">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Roll Number</p>
                      <p className="font-semibold text-sm sm:text-base">{formData.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Gender</p>
                      <p className="font-semibold capitalize text-sm sm:text-base">{formData.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Contact Number</p>
                      <p className="font-semibold text-sm sm:text-base break-all">{formData.contactNumber}</p>
                    </div>
                    {formData.alternativeContactNumber && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Alternative Contact</p>
                        <p className="font-semibold text-sm sm:text-base break-all">{formData.alternativeContactNumber}</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Selected Games ({formData.selectedGames.length})</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.selectedGames.map((game) => (
                        <span
                          key={game}
                          className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm"
                        >
                          {game}
                        </span>
                      ))}
                    </div>
                    {/* Display Team Members */}
                    {formData.selectedGames.map((gameName) => {
                      if (!formData.gender || !isTeamGame(gameName, formData.gender)) return null;
                      const teamMembers = formData.teamMembers[gameName] || [];
                      if (teamMembers.length === 0) return null;
                      
                      return (
                        <div key={gameName} className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">{gameName} Team Members:</p>
                          <div className="space-y-2">
                            {teamMembers.map((member, index) => (
                              <div key={index} className="text-xs sm:text-sm text-gray-700">
                                <span className="font-medium">{index + 1}. {member.name}</span>
                                <span className="text-gray-500 ml-2">({member.rollNumber})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        Rs. {totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs sm:text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold capitalize text-sm sm:text-base">{formData.paymentMethod}</p>
                    {formData.transactionId && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 break-all">
                        Transaction ID: {formData.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Previous
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 w-full sm:w-auto text-sm sm:text-base"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 w-full sm:w-auto text-sm sm:text-base"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
