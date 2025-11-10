// Pre-configured ICS sources
export const DEFAULT_SOURCES = [
  {
    name: 'Monash EBS',
    url: './ics/monash-ebs.ics',
    subscriptionUrl: 'https://calendar.google.com/calendar/ical/2rnbhi06i37jfdmprrls497vr8%40group.calendar.google.com/public/basic.ics',
  },
  {
    name: 'Monash Econ',
    url: './ics/monash-econ.ics',
    subscriptionUrl: 'https://calendar.google.com/calendar/ical/monash.edu_oh4b3l045bt5nm75tnlnt1gv5s%40group.calendar.google.com/public/basic.ics',
  },
  {
    name: 'Monash CHE',
    url: './ics/monash-che.ics',
    // No subscriptionUrl - this is scraped, not a live feed
  },
  {
    name: 'UniMelb Econ',
    url: './ics/unimelb-econ.ics',
    // No subscriptionUrl - this is scraped, not a live feed
  },
  // {
  //   name: 'UniMelb EBE',
  //   url: './ics/unimelb-ebe.ics',
  //   subscriptionUrl: 'https://calendar.google.com/calendar/ical/kifge5897trj5b966sf1me6d1o%40group.calendar.google.com/public/basic.ics',
  // },
];

// Tag filtering
export const PRESET_TAGS = ['EBS', 'DeHiPE', 'IOAT', 'ATIO', 'MIG', 'HEELP', 'CHE', 'Workshop'];
