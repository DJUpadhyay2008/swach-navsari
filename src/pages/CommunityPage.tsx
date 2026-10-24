import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function CommunityPage() {
  const events = [
    {
      id: 'event-1',
      title: 'Clean Dudhia Talav: Waterfront Citizen Action',
      description:
        'Join municipal staff and Navsari youth volunteers for a 2-hour morning clean-up, plastic collection drive, and lakefront reviving session.',
      location: 'Dudhia Talav Lakeside Promenade, Ward 7',
      date: 'Sunday, 7:00 AM – 9:30 AM',
      volunteersCount: 38,
      maxVolunteers: 50,
      status: 'upcoming',
    },
    {
      id: 'event-2',
      title: 'Dandi Heritage Corridor Cleanliness Campaign',
      description:
        'Litter reduction and plastic segregation drive along the historic Dandi approach road in partnership with local youth clubs.',
      location: 'Viraval Crossroad to Dandi Approach, Ward 2',
      date: 'Next Saturday, 6:30 AM – 9:00 AM',
      volunteersCount: 22,
      maxVolunteers: 40,
      status: 'upcoming',
    },
    {
      id: 'event-3',
      title: 'Sayaji Library Public Garden Beautification',
      description:
        'Weed clearing, composting leaf litter, and waste segregation awareness rally at the historic library grounds.',
      location: 'Sayaji Vaibhav Library Grounds, Ward 13',
      date: 'Upcoming Weekend, 8:00 AM – 10:30 AM',
      volunteersCount: 15,
      maxVolunteers: 30,
      status: 'upcoming',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">Revive Navsari</Badge>
          <Badge variant="neutral">Community Drives</Badge>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Community Cleanliness &amp; Revival Drives
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Cleanliness is a shared civic responsibility. Participate in citizen-led drives, earn volunteer
          recognition, and revive public landmarks across Navsari.
        </p>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((ev) => (
          <Card key={ev.id} className="glass-card-hover flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge size="sm" variant="success">
                  {ev.status}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3.5 h-3.5 text-swach-400" />
                  <span>
                    {ev.volunteersCount} / {ev.maxVolunteers} Volunteers
                  </span>
                </div>
              </div>
              <CardTitle className="text-base text-white">{ev.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-3">
                {ev.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-gujarat-400" />
                  <span>{ev.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-gujarat-400" />
                  <span>{ev.location}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-swach-500 to-gujarat-400 rounded-full"
                    style={{
                      width: `${(ev.volunteersCount / ev.maxVolunteers) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Register as Volunteer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Civic Pledge */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-swach-950/40 via-slate-900/40 to-slate-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-swach-400" />
            <span>The Navsari Cleanliness Pledge</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            &ldquo;I pledge to keep my neighborhood clean, segregate wet and dry waste, report
            overflowing spots promptly, and dedicate at least 2 hours every month to community
            cleanliness drives.&rdquo;
          </p>
        </div>
        <Button size="lg" leftIcon={<ArrowRight className="w-4 h-4" />}>
          Take the Citizen Pledge
        </Button>
      </div>
    </div>
  );
}
