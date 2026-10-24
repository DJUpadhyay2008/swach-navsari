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
      title: 'Navsari River Cleanup Drive',
      description:
        'Join municipal staff and Navsari youth volunteers for a morning clean-up, plastic collection drive, and riverfront reviving session.',
      location: 'Navsari River Front • Ward 7',
      date: '25 Oct 2026 • 8:00 AM - 11:00 AM',
      volunteersCount: 130,
      maxVolunteers: 150,
      status: 'Upcoming',
    },
    {
      id: 'event-2',
      title: 'College Community Cleanliness',
      description:
        'Litter reduction and plastic segregation drive along the college campus in partnership with local NSS youth clubs.',
      location: 'Navsari College Area • Ward 2',
      date: '28 Oct 2026 • 9:00 AM - 12:00 PM',
      volunteersCount: 48,
      maxVolunteers: 100,
      status: 'Upcoming',
    },
    {
      id: 'event-3',
      title: 'Sayaji Library Public Garden Beautification',
      description:
        'Weed clearing, composting leaf litter, and waste segregation awareness rally at the historic library grounds.',
      location: 'Sayaji Vaibhav Grounds • Ward 13',
      date: '02 Nov 2026 • 8:00 AM - 10:30 AM',
      volunteersCount: 25,
      maxVolunteers: 50,
      status: 'Upcoming',
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
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Community Cleanliness &amp; Revival Drives
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Cleanliness is a shared civic responsibility. Participate in citizen-led drives, earn volunteer
          recognition, and revive public landmarks across Navsari.
        </p>
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((ev) => (
          <Card key={ev.id} className="bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge size="sm" variant="success">
                  {ev.status}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {ev.volunteersCount} / {ev.maxVolunteers} Volunteers
                  </span>
                </div>
              </div>
              <CardTitle className="text-base text-slate-900 font-bold">{ev.title}</CardTitle>
              <CardDescription className="text-xs text-slate-500 line-clamp-3 mt-1">
                {ev.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ev.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ev.location}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(ev.volunteersCount / ev.maxVolunteers) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button size="sm" variant="primary" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Register as Volunteer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Civic Pledge */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>The Navsari Cleanliness Pledge</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
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
