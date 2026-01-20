'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Users,
  Trophy,
  Sparkles,
  Loader2,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  Swords,
} from 'lucide-react';
import { gamesPricing } from '@/lib/games-pricing';
import { jsPDF } from 'jspdf';

type Team = {
  team_name: string;
  name: string;
  gender: string;
  selected_games: string[];
};

type MatchSchedule = {
  id: string;
  game_name: string;
  gender: string;
  schedule_data: string;
  generated_by: string;
  created_at: string;
};

type ScheduleData = {
  format: string;
  rounds: {
    round: number;
    name: string;
    matches: {
      match: number;
      team1: string;
      team2: string;
      time: string;
      venue: string;
    }[];
  }[];
  notes?: string;
};

export default function HOCPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<MatchSchedule[]>([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedGender, setSelectedGender] = useState<'boys' | 'girls'>('boys');
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/matches', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get teams for selected game and gender
  const getTeamsForGame = () => {
    if (!selectedGame || !selectedGender) return [];
    return teams.filter(t => {
      const games = Array.isArray(t.selected_games) ? t.selected_games : 
        (typeof t.selected_games === 'string' ? JSON.parse(t.selected_games || '[]') : []);
      return t.gender === selectedGender && games.includes(selectedGame);
    });
  };

  const handleGenerateMatches = async () => {
    const gameTeams = getTeamsForGame();
    if (gameTeams.length < 2) {
      alert('Need at least 2 teams to generate matches');
      return;
    }

    setGenerating(true);
    setGeneratedSchedule(null);
    
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: selectedGame,
          gender: selectedGender,
          teams: gameTeams.map(t => t.team_name),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedSchedule(data.schedule);
        loadData(); // Refresh to get new schedule
      } else {
        alert('Generation failed: ' + data.error);
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('Failed to generate matches');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    
    try {
      const res = await fetch(`/api/admin/matches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadData();
        if (generatedSchedule) setGeneratedSchedule(null);
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleDownloadPDF = (schedule: MatchSchedule) => {
    try {
      const scheduleData: ScheduleData = JSON.parse(schedule.schedule_data);
      const pdf = new jsPDF('portrait');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MINI OLYMPICS 2026', pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(`${schedule.game_name} - ${schedule.gender.toUpperCase()}`, pageWidth / 2, 25, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Format: ${scheduleData.format}`, pageWidth / 2, 32, { align: 'center' });
      
      let y = 50;
      
      scheduleData.rounds.forEach((round, roundIdx) => {
        // Round header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(10, y, pageWidth - 20, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(round.name, 15, y + 7);
        y += 15;
        
        // Matches
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        round.matches.forEach((match, matchIdx) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          
          const isEven = matchIdx % 2 === 0;
          if (isEven) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(10, y - 3, pageWidth - 20, 10, 'F');
          }
          
          pdf.text(`Match ${match.match}:`, 15, y + 3);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${match.team1}  vs  ${match.team2}`, 45, y + 3);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Time: ${match.time} | Venue: ${match.venue}`, 140, y + 3);
          
          y += 12;
        });
        
        y += 10;
      });
      
      // Notes
      if (scheduleData.notes) {
        y += 5;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Notes: ${scheduleData.notes}`, 10, y);
      }
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${new Date(schedule.created_at).toLocaleString()} by ${schedule.generated_by}`, pageWidth / 2, 285, { align: 'center' });
      
      pdf.save(`Match_Schedule_${schedule.game_name}_${schedule.gender}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF');
    }
  };

  const gameTeams = getTeamsForGame();
  const existingSchedule = schedules.find(s => s.game_name === selectedGame && s.gender === selectedGender);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 pt-16 lg:pt-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          HOC - Match Scheduling
        </h1>
        <p className="text-slate-500 text-sm mt-1">Generate and manage match schedules using AI</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-sm bg-purple-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Total Teams</span>
            </div>
            <p className="text-xl font-bold mt-1">{teams.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-blue-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Boys Teams</span>
            </div>
            <p className="text-xl font-bold mt-1">{teams.filter(t => t.gender === 'boys').length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-pink-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Girls Teams</span>
            </div>
            <p className="text-xl font-bold mt-1">{teams.filter(t => t.gender === 'girls').length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-500 text-white">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 opacity-80" />
              <span className="text-xs opacity-80">Schedules</span>
            </div>
            <p className="text-xl font-bold mt-1">{schedules.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Generate Schedule */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Match Generator
            </CardTitle>
            <CardDescription className="text-purple-100">
              Select a game and gender to generate match schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Game</label>
                <Select value={selectedGame} onValueChange={setSelectedGame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose game" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamesPricing.map((game) => (
                      <SelectItem key={game.name} value={game.name}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select value={selectedGender} onValueChange={(v) => setSelectedGender(v as 'boys' | 'girls')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedGame && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  Teams for {selectedGame} ({selectedGender})
                </h4>
                {gameTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gameTeams.map((team, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {team.team_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No verified teams found for this game</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleGenerateMatches}
                disabled={generating || !selectedGame || gameTeams.length < 2}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {generating ? 'Generating...' : 'AI Generate Matches'}
              </Button>
              {existingSchedule && (
                <Button variant="outline" onClick={() => handleDownloadPDF(existingSchedule)}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              )}
            </div>

            {gameTeams.length < 2 && selectedGame && (
              <p className="text-amber-600 text-sm flex items-center gap-1">
                <Swords className="h-4 w-4" />
                Need at least 2 verified teams to generate matches
              </p>
            )}
          </CardContent>
        </Card>

        {/* Generated Schedule Preview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {existingSchedule ? (
              <div className="space-y-4">
                {(() => {
                  const data: ScheduleData = JSON.parse(existingSchedule.schedule_data);
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {data.format}
                        </span>
                        <span className="text-xs text-slate-400">
                          Generated {new Date(existingSchedule.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-4">
                        {data.rounds.map((round, idx) => (
                          <div key={idx} className="border rounded-lg overflow-hidden">
                            <div className="bg-indigo-500 text-white px-3 py-2 text-sm font-medium">
                              {round.name}
                            </div>
                            <div className="divide-y">
                              {round.matches.map((match, mIdx) => (
                                <div key={mIdx} className="p-3 flex items-center justify-between text-sm">
                                  <span className="font-medium">{match.team1}</span>
                                  <span className="text-slate-400 px-2">vs</span>
                                  <span className="font-medium">{match.team2}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {data.notes && (
                        <p className="text-xs text-slate-500 italic">{data.notes}</p>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : generatedSchedule ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {generatedSchedule.format} - Just Generated!
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-4">
                  {generatedSchedule.rounds.map((round, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="bg-emerald-500 text-white px-3 py-2 text-sm font-medium">
                        {round.name}
                      </div>
                      <div className="divide-y">
                        {round.matches.map((match, mIdx) => (
                          <div key={mIdx} className="p-3 flex items-center justify-between text-sm">
                            <span className="font-medium">{match.team1}</span>
                            <span className="text-slate-400 px-2">vs</span>
                            <span className="font-medium">{match.team2}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a game and generate matches</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved Schedules */}
      <Card className="border-0 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Saved Schedules
          </CardTitle>
          <CardDescription>All generated match schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No schedules generated yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => {
                  const data: ScheduleData = JSON.parse(schedule.schedule_data);
                  return (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.game_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          schedule.gender === 'boys' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {schedule.gender}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{data.format}</TableCell>
                      <TableCell>{schedule.generated_by}</TableCell>
                      <TableCell>{new Date(schedule.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(schedule)}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteSchedule(schedule.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
