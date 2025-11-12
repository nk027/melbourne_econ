# Code Review: Melbourne Economics Events

**Review Date:** 2025-11-12
**Project:** melbourne_econ
**Reviewer:** Claude (Automated Code Review)

---

## Executive Summary

This is a well-structured React application for aggregating economics events from Melbourne universities. The project demonstrates solid architecture with a clean separation between data pipeline (Python scrapers) and frontend (React). However, there are opportunities for improvement in error handling, testing, performance, and user experience.

**Overall Assessment:** 7/10

---

## 1. Critical Issues

### 1.1 Error Handling (HIGH PRIORITY)

**Location:** `src/App.js:82`

```javascript
} catch (error) {
  console.error(`Failed to load ICS from ${url}:`, error);
  alert(`Failed to load calendar: ${sourceName}`);
}
```

**Issue:** Using `alert()` blocks the UI and provides poor UX. If multiple calendars fail to load, users see multiple alert popups.

**Recommendation:** Implement a toast notification system or error banner.

---

### 1.2 Missing Loading States (HIGH PRIORITY)

**Location:** `src/App.js:71-84`

**Issue:** ICS files load asynchronously with no loading indicator. Users don't know if data is loading or if the app is broken.

**Recommendation:** Add loading states:
```javascript
const [isLoading, setIsLoading] = useState(true);
const [loadingErrors, setLoadingErrors] = useState([]);
```

---

### 1.3 Race Condition in URL State Restoration (MEDIUM PRIORITY)

**Location:** `src/App.js:239-250`

**Issue:** URL params are restored on mount, but this happens while ICS files are still loading. The `selectedSources` from URL params might reference sources that haven't loaded yet.

**Example:**
```javascript
if (p.get('src')) setSelectedSources(new Set(p.get('src').split(',')));
```

**Recommendation:** Defer URL state restoration until after sources are loaded, or validate that sources exist.

---

### 1.4 Timezone Handling Limitations (MEDIUM PRIORITY)

**Location:** `src/utils/icsParser.js:26-29`

```javascript
// Note: This assumes the date is in the user's local timezone if not UTC.
// For more robust parsing, a library like ical.js might be needed
// if you encounter non-UTC, non-local timezones (e.g., DTSTART;TZID=America/New_York:...)
```

**Issue:** Custom ICS parser doesn't handle all timezone formats. Events with TZID parameters may be parsed incorrectly.

**Recommendation:** Consider using a battle-tested library like `ical.js` or `rrule` for proper ICALENDAR parsing.

---

### 1.5 No Input Validation for File Uploads (MEDIUM PRIORITY)

**Location:** `src/App.js:53-69`

**Issue:** File upload accepts any file and attempts to parse it as ICS. Malformed or malicious files could crash the parser.

**Recommendation:** Add validation:
- Check file extension (.ics)
- Validate MIME type
- Wrap parseICS in try-catch with error feedback

---

### 1.6 Python Scripts Lack Robust Error Handling (LOW PRIORITY)

**Location:** `scripts/get-scrape_monash-che.py:34-36`

**Issue:** HTTP requests to event pages can fail, but errors only print to console. The script continues, potentially creating incomplete calendars.

**Recommendation:** Add retry logic, better error messages, and exit codes for CI/CD monitoring.

---

## 2. Code Quality Issues

### 2.1 Large Component (App.js - 509 lines)

**Issue:** The main App component is too large and has multiple responsibilities:
- State management (14 useState hooks)
- Data fetching
- URL synchronization
- Event filtering
- Navigation logic
- UI rendering

**Recommendation:** Extract into smaller components and custom hooks:
```
src/
  hooks/
    useEventData.js       // ICS loading & parsing
    useEventFilters.js    // Filter logic
    useURLSync.js         // URL param sync
    useKeyboardNav.js     // Keyboard navigation
```

---

### 2.2 No Testing (CRITICAL for Production)

**Issue:** Zero test coverage. No testing framework configured.

**Files Missing Tests:**
- `src/utils/icsParser.js` - Complex date parsing logic
- `src/App.js` - Core application logic
- All components
- Python scrapers

**Recommendation:** Add testing infrastructure:

**Frontend:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**Backend:**
```bash
pip install pytest requests-mock
```

**Priority Test Cases:**
1. ICS parsing with various date formats
2. Event filtering logic
3. Keyboard navigation
4. URL state sync
5. Python scraper HTML parsing

---

### 2.3 No TypeScript (Despite @types Dependencies)

**Location:** `package.json:22-23`

```json
"@types/react": "^19.1.16",
"@types/react-dom": "^19.1.9",
```

**Issue:** Type definitions are installed but not used (files are .js not .ts). This suggests the project was initialized with TypeScript templates but abandoned.

**Recommendation:** Either:
1. Migrate to TypeScript for type safety (recommended)
2. Remove unused @types/* dependencies

---

### 2.4 Magic Numbers and Hardcoded Values

**Issues Found:**
- `src/App.js:29` - `useDebouncedValue(rawQuery, 200)` - Why 200ms?
- `scripts/get-scrape_monash-che.py:110` - `time.sleep(0.5)` - Why 0.5s?
- `src/utils/icsParser.js:95-97` - 2 years ago filter - Should be configurable

**Recommendation:** Extract to constants:
```javascript
// src/config.js
export const DEBOUNCE_DELAY_MS = 200;
export const EVENT_HISTORY_YEARS = 2;
export const SCRAPER_DELAY_MS = 500;
```

---

### 2.5 Duplicate Code for Source/Tag Filtering

**Location:** `src/App.js:86-107` and `src/App.js:109-130`

**Issue:** Nearly identical logic for `toggleSource`/`toggleTag` and `handleSourceDoubleClick`/`handleTagDoubleClick`.

**Recommendation:** Create a generic filter hook:
```javascript
const useFilterToggle = (allItems) => {
  const [selected, setSelected] = useState(new Set());
  const [focused, setFocused] = useState(null);

  const toggle = (item) => { /* ... */ };
  const handleDoubleClick = (item) => { /* ... */ };

  return { selected, toggle, handleDoubleClick };
};
```

---

### 2.6 Mixed Async/Await and Promises

**Location:** `src/App.js:132-147`

**Issue:** Some async functions use async/await, others use implicit promise returns.

**Recommendation:** Be consistent with async/await throughout.

---

## 3. Performance Improvements

### 3.1 Unnecessary Re-renders

**Location:** `src/App.js:149-197`

**Issue:** The `filteredEvents` useMemo depends on `events`, but `events` is mutated with spread operators:
```javascript
setEvents((prev) => [...prev, ...parsed]);
```

**Recommendation:** This is actually fine, but consider tracking event count to avoid re-filtering if only non-event state changes.

---

### 3.2 Large List Rendering

**Issue:** List view renders all filtered events without virtualization. For 1000+ events, this can cause lag.

**Recommendation:** Implement virtual scrolling with `react-window` or `@tanstack/react-virtual`:

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

### 3.3 ICS Parsing on Main Thread

**Issue:** Large ICS files are parsed synchronously, blocking the UI.

**Recommendation:** Move parsing to a Web Worker:
```javascript
// workers/icsParser.worker.js
self.onmessage = (e) => {
  const parsed = parseICS(e.data.content, e.data.source);
  self.postMessage(parsed);
};
```

---

### 3.4 No Caching Strategy

**Issue:** ICS files are fetched on every page load. With a 4-8 hour update schedule, this is wasteful.

**Recommendation:** Implement localStorage caching:
```javascript
const CACHE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const getCachedICS = (url) => {
  const cached = localStorage.getItem(`ics_${url}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION_MS) {
      return data;
    }
  }
  return null;
};
```

---

### 3.5 Inefficient Date Grouping

**Location:** `src/App.js:265-356`

**Issue:** `groupedListEvents` is recalculated on every `filteredEvents` change. The logic is O(n) but has complex date arithmetic.

**Recommendation:** Already memoized, but could be optimized with better data structures (Map instead of object).

---

## 4. User Experience Improvements

### 4.1 Accessibility Issues

**Issues:**
1. Missing `alt` text on icons
2. No `<label>` for file input (App.js would need this if rendered)
3. Filter buttons have `title` but no `aria-label`
4. Modal has no focus trap
5. No skip links for keyboard users

**WCAG Violations:**
- 1.1.1 (Non-text Content) - Missing alt text
- 2.1.1 (Keyboard) - Modal focus not trapped
- 4.1.2 (Name, Role, Value) - Incomplete ARIA attributes

**Recommendation:** Add react-focus-lock for modal and aria-labels throughout.

---

### 4.2 Mobile Responsiveness

**Issue:** Month/week views are cramped on mobile. Events with long titles overflow.

**Recommendation:**
- Add horizontal scroll for week/month on mobile
- Consider mobile-specific layouts
- Add touch gestures for navigation

---

### 4.3 No Dark Mode

**Issue:** No theme switching despite modern Tailwind CSS setup.

**Recommendation:** Add dark mode support:
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

---

### 4.4 Search UX Could Be Better

**Issue:** Search is fuzzy but doesn't show which parts matched. Users can't see why results appear.

**Recommendation:** Add highlighting for matched terms.

---

## 5. Security Concerns

### 5.1 No Content Security Policy (LOW RISK)

**Issue:** `index.html` has no CSP headers. While low risk for a static site, it's best practice.

**Recommendation:** Add CSP meta tag:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; style-src 'self' 'unsafe-inline';">
```

---

### 5.2 ICS Files Hosted on Public Web

**Issue:** ICS files in `public/ics/` are directly accessible. If they contain private events, this is a privacy concern.

**Recommendation:** Review event data for sensitive information. The `--redact-signup-links` flag in `unify-ics.py` is good, but ensure no personal data leaks.

---

### 5.3 Python Dependencies Not Pinned

**Location:** `.github/workflows/cron-schedule.yml:26`

```yaml
python -m pip install cloudscraper beautifulsoup4 icalendar
```

**Issue:** Unpinned dependencies can break builds. A new version of `cloudscraper` could introduce bugs.

**Recommendation:** Create `requirements.txt`:
```
cloudscraper==1.2.71
beautifulsoup4==4.12.2
icalendar==5.0.11
```

---

## 6. Build & Deployment Issues

### 6.1 GitHub Actions Runs Too Frequently

**Location:** `.github/workflows/cron-schedule.yml:5`

```yaml
- cron: '0 21,1,5,13 * * *'  # 4 times per day
```

**Issue:** Running 4x/day is aggressive for events that change infrequently. This increases:
- GitHub Actions minutes usage
- Load on university servers
- Deployment costs

**Recommendation:** Reduce to 2x/day (morning and evening):
```yaml
- cron: '0 1,13 * * *'  # 1 AM and 1 PM UTC
```

---

### 6.2 No Build Optimization

**Issue:** Vite build is not configured for optimal production bundles.

**Recommendation:** Add to `vite.config.js`:
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    sourcemap: false,
    minify: 'terser',
  },
})
```

---

### 6.3 No Monitoring or Analytics

**Issue:** No way to track:
- How many users visit the site
- Which events are popular
- Which sources fail to load
- Performance metrics

**Recommendation:** Add privacy-friendly analytics (Plausible, Umami, or Fathom).

---

## 7. Future Development Options

### 7.1 Short-Term Wins (1-2 weeks)

#### A. Add Toast Notifications
Replace `alert()` with a toast library like `react-hot-toast`:
```bash
npm install react-hot-toast
```

#### B. Loading Skeletons
Add skeleton screens while events load:
```javascript
<ListView.Skeleton />
```

#### C. Export Filtered Events
Allow users to download currently filtered events as ICS:
```javascript
const handleExport = () => {
  const ics = generateICS(filteredEvents);
  downloadFile(ics, 'filtered-events.ics');
};
```

#### D. Event Bookmarking
Add localStorage-based bookmarking:
```javascript
const [bookmarked, setBookmarked] = useLocalStorage('bookmarks', new Set());
```

#### E. Share Individual Events
Add social sharing buttons for events:
```html
<a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(event.summary)}&url=${eventUrl}`}>
  Share on X
</a>
```

---

### 7.2 Medium-Term Features (1-2 months)

#### A. Progressive Web App (PWA)
Make the app installable and work offline:
- Add service worker
- Add web app manifest
- Cache ICS files for offline viewing

**Benefits:**
- Works without internet
- Installable on mobile home screens
- Push notification support (future)

---

#### B. Backend API Service
Move scraping logic to a backend service (Netlify Functions, Vercel Edge, or AWS Lambda):

**Benefits:**
- Faster frontend loads (pre-processed data)
- Better error handling for scrapers
- API versioning
- Ability to add authentication

**Architecture:**
```
Frontend (React) → API Gateway → Lambda Functions → DynamoDB
                                      ↓
                              EventBridge (cron) → Scrapers
```

---

#### C. Email Notifications
Let users subscribe to event types:
```javascript
// Sign up for weekly digest of Monash Econ seminars
POST /api/subscribe
{
  "email": "user@example.com",
  "sources": ["Monash Econ"],
  "frequency": "weekly"
}
```

---

#### D. Calendar Sync
Two-way sync with Google Calendar, Outlook, iCal:
- OAuth integration
- Sync user's selected filters
- Update when events change

---

### 7.3 Long-Term Vision (3-6 months)

#### A. User Accounts & Personalization
- Save filter preferences
- Bookmark events
- Sync across devices
- Personalized event recommendations

**Tech Stack:**
- Auth: Clerk, Auth0, or Supabase
- Database: Supabase or Firebase

---

#### B. Event Submission Platform
Allow departments to submit events directly:
- Webform for event creation
- Moderation queue
- Automatic ICS generation

**Benefits:**
- Reduce scraping dependency
- More timely event additions
- Community-driven content

---

#### C. ML-Powered Recommendations
Suggest events based on user behavior:
- View history
- Bookmarked events
- Search queries

**Approach:**
- Collaborative filtering
- Content-based (tag similarity)
- Hybrid approach

---

#### D. Multi-Institution Expansion
Scale beyond Melbourne:
- Sydney universities
- International institutions
- Different academic fields (CompSci, Medicine, etc.)

**Architecture Needs:**
- Multi-tenancy
- Configurable scraper pipelines
- Institution-specific branding

---

#### E. Social Features
- Comments on events
- Attendee lists ("I'm going")
- Event ratings/reviews
- Discussion forums

**Moderation Considerations:**
- Spam prevention
- Content moderation
- Privacy controls

---

#### F. Mobile Apps
Native iOS/Android apps with:
- Push notifications
- Calendar integration
- Location-based event discovery
- QR code check-in

**Tech Stack Options:**
- React Native (reuse web components)
- Flutter (better performance)
- Ionic (fastest to market)

---

## 8. Technical Debt & Refactoring

### 8.1 Migrate to TypeScript
**Effort:** Medium (1-2 weeks)
**Value:** High

**Steps:**
1. Rename .js → .tsx/.ts
2. Add type definitions for events, sources
3. Type all component props
4. Enable strict mode gradually

---

### 8.2 Implement Design System
**Effort:** Medium (2 weeks)
**Value:** Medium

Create reusable components:
```
src/ui/
  Button.tsx
  Badge.tsx
  Modal.tsx
  Card.tsx
  Input.tsx
```

Benefits:
- Consistent UI
- Faster feature development
- Easier to theme

---

### 8.3 Add Storybook for Component Development
**Effort:** Low (2-3 days)
**Value:** Medium

```bash
npx storybook@latest init
```

Benefits:
- Visual component testing
- Documentation
- Isolated development

---

### 8.4 Internationalization (i18n)
**Effort:** Medium (1 week)
**Value:** Low (unless targeting non-English speakers)

Support multiple languages:
```bash
npm install react-i18next i18next
```

---

## 9. Python Scraper Improvements

### 9.1 Add Retry Logic with Exponential Backoff

**Location:** `scripts/get-scrape_monash-che.py:35`

```python
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

def create_scraper_with_retry():
    session = cloudscraper.create_scraper()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session
```

---

### 9.2 Add Structured Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info(f"Fetching: {event_url}")
logger.error(f"Failed to fetch {event_url}: {e}")
```

---

### 9.3 Add Data Validation

Validate scraped data before writing to ICS:
```python
from pydantic import BaseModel, HttpUrl, validator

class Event(BaseModel):
    title: str
    start: datetime
    end: datetime
    url: HttpUrl
    location: Optional[str]

    @validator('end')
    def end_after_start(cls, v, values):
        if 'start' in values and v < values['start']:
            raise ValueError('end must be after start')
        return v
```

---

### 9.4 Separate Concerns

Refactor scrapers into modular structure:
```
scripts/
  scrapers/
    __init__.py
    base.py           # BaseScraper class
    monash_che.py
    unimelb_econ.py
  utils/
    ics_writer.py
    http_client.py
  main.py             # Orchestrator
```

---

## 10. Documentation Improvements

### 10.1 Expand README.md

Current README is minimal. Add:
- Project description
- Features list
- Installation instructions
- Development setup
- Contributing guidelines
- Architecture diagram
- API documentation (if backend added)

---

### 10.2 Add Code Comments

Areas needing comments:
- Complex date grouping logic (App.js:265-356)
- ICS parser edge cases
- Regex patterns in unify-ics.py

---

### 10.3 Add Architecture Documentation

Create `docs/ARCHITECTURE.md`:
- Data flow diagrams
- Component hierarchy
- State management strategy
- Build pipeline explanation

---

## 11. Monitoring & Observability

### 11.1 Add Error Tracking

Integrate Sentry for frontend errors:
```bash
npm install @sentry/react
```

```javascript
Sentry.init({
  dsn: "YOUR_DSN",
  environment: import.meta.env.MODE,
});
```

---

### 11.2 Add Performance Monitoring

Track Core Web Vitals:
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

### 11.3 Add Uptime Monitoring

Use UptimeRobot or similar to monitor:
- Site availability
- ICS file accessibility
- GitHub Actions failures

---

## 12. Recommended Immediate Actions

### Priority 1 (This Week)
1. Add loading states and error handling
2. Fix URL state race condition
3. Add basic tests for ICS parser
4. Pin Python dependencies in requirements.txt

### Priority 2 (Next 2 Weeks)
1. Extract large App.js into custom hooks
2. Add toast notifications
3. Implement event export feature
4. Add dark mode

### Priority 3 (Next Month)
1. Migrate to TypeScript
2. Add test coverage (target 70%+)
3. Implement caching strategy
4. Add analytics

### Priority 4 (Next Quarter)
1. Build PWA support
2. Add backend API
3. Implement user accounts
4. Mobile apps POC

---

## 13. Conclusion

This project is well-architected and functional. The main areas for improvement are:

**Strengths:**
- Clean separation of concerns (data pipeline vs frontend)
- Modern tech stack (React 19, Vite 7, Tailwind 4)
- Automated updates via GitHub Actions
- Good use of React hooks and memoization

**Weaknesses:**
- No testing
- Large App component
- Limited error handling
- No performance optimization
- Missing accessibility features

**Quick Wins:**
Implementing loading states, error handling, and basic tests would significantly improve the user experience and maintainability.

**Strategic Investments:**
Adding TypeScript, a backend service, and user accounts would set the foundation for scaling to more institutions and users.

---

## Appendix: Useful Resources

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [pytest Documentation](https://docs.pytest.org/)

### Performance
- [React Virtual](https://tanstack.com/virtual/latest)
- [Web Vitals](https://web.dev/vitals/)

### Accessibility
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Focus Lock](https://github.com/theKashey/react-focus-lock)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### PWA
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

**End of Code Review**
