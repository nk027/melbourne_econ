// Pre-configured ICS sources
export const DEFAULT_SOURCES = [
  {
    name: "Monash EBS",
    fullName: "Monash Department of Econometrics and Business Statistics",
    url: "ics/monash-ebs.ics",
    sourceUrl:
      "https://calendar.google.com/calendar/ical/2rnbhi06i37jfdmprrls497vr8%40group.calendar.google.com/public/basic.ics",
    homeUrl:
      "https://www.monash.edu/business/ebs/impact-and-engagement/conferences-seminars-and-events",
    color: "blue",
  },
  {
    name: "Monash Econ",
    fullName: "Monash Department of Economics",
    url: "ics/monash-econ.ics",
    sourceUrl:
      "https://calendar.google.com/calendar/ical/monash.edu_oh4b3l045bt5nm75tnlnt1gv5s%40group.calendar.google.com/public/basic.ics",
    homeUrl:
      "https://www.monash.edu/business/economics/impact-and-engagement/conferences-seminars-and-events",
    color: "orange",
  },
  {
    name: "Monash CHE",
    fullName: "Monash Centre for Health Economics",
    url: "ics/monash-che.ics",
    homeUrl: "https://www.monash.edu/business/che/news-and-events/events",
    color: "green",
  },
  {
    name: "UniMelb Econ",
    fullName: "Uni Melbourne Department of Economics",
    url: "ics/unimelb-econ.ics",
    homeUrl: "https://fbe.unimelb.edu.au/economics/events",
    color: "purple",
  },
  {
    name: "Various",
    fullName: "Various seminars, workshops, and other events",
    url: "ics/custom-events.ics",
    homeUrl: "",
    color: "pink",
  },
  // {
  //   name: 'UniMelb EE', // This alsp appears in the UniMelb Econ events
  //   url: 'ics/unimelb-ee.ics',
  //   sourceUrl: 'https://calendar.google.com/calendar/ical/kifge5897trj5b966sf1me6d1o%40group.calendar.google.com/public/basic.ics',
  //   homeUrl: 'https://sites.google.com/view/eeseminarunimelb/home'
  // },
];

// Tag filtering
export const PRESET_TAGS = [
  "EBS",
  "DeHiPE",
  "IOAT",
  "ATIO",
  "MIG",
  "HEELP",
  "CHE",
  "Workshop",
];
