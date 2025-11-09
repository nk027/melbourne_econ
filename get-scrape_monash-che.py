import cloudscraper
from bs4 import BeautifulSoup
from icalendar import Calendar, Event
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs
from html import unescape
import time

# Fetch the main events page
url = "https://www.monash.edu/business/che/news-and-events/events"
scraper = cloudscraper.create_scraper()
response = scraper.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

cal = Calendar()
cal.add('prodid', '-//Monash Events//EN')
cal.add('version', '2.0')

for li in soup.find_all('li'):
    a_tag = li.find('a', class_='box-listing-element__events-item')
    if not a_tag:
        continue

    # Extract actual URL from redirect
    redirect_url = a_tag['href']
    parsed = urlparse(redirect_url)
    params = parse_qs(parsed.query)
    event_url = params.get('url', [''])[0]

    if not event_url:
        continue

    # Fetch the event detail page
    print(f"Fetching: {event_url}")
    event_response = scraper.get(event_url)
    event_soup = BeautifulSoup(event_response.text, 'html.parser')

    event = Event()

    # Extract title
    title_elem = event_soup.find('h1')
    title = title_elem.get_text(strip=True) if title_elem else li.find('h4').get_text(strip=True)

    # Extract date/time from add-to-calendar div
    calendar_div = event_soup.find('div', class_='add-to-calendar')
    start = None
    end = None

    if calendar_div:
        start_span = calendar_div.find('span', class_='start')
        end_span = calendar_div.find('span', class_='end')

        if start_span:
            # Format: "11/12/2025 12:00 pm"
            start_text = start_span.get_text(strip=True)
            start = datetime.strptime(start_text, '%m/%d/%Y %I:%M %p')

        if end_span:
            end_text = end_span.get_text(strip=True)
            end = datetime.strptime(end_text, '%m/%d/%Y %I:%M %p')

    # Fallback to event-details if add-to-calendar not found
    if not start:
        date_elem = li.find('p', class_='date')
        date_text = date_elem.get_text(strip=True)
        if ' - ' in date_text:
            parts = date_text.split(' - ')
            start_day = parts[0].strip()
            end_parts = parts[1].strip().split()
            month_year = ' '.join(end_parts[1:])
            start_str = f"{start_day} {month_year}"
            start = datetime.strptime(start_str, '%d %B %Y').date()
            end = start + timedelta(days=1)
        else:
            start = datetime.strptime(date_text, '%d %B %Y').date()
            end = start + timedelta(days=1)

    # Extract venue
    location = None
    venue_dd = event_soup.find('div', class_='event-details__venue')
    if venue_dd:
        venue_text = venue_dd.find('dd')
        if venue_text:
            location = venue_text.get_text(strip=True)

    # Extract description with structure preserved
    description = ''
    desc_span = event_soup.find('span', class_='description')
    if desc_span:
        parts = []
        for elem in desc_span.find_all(['p', 'h3']):
            html_content = elem.decode_contents()
            text = unescape(str(html_content).strip())
            if text:
                parts.append(text)
        description = '\n\n'.join(parts)

    # Add to event
    event.add('summary', title)
    event.add('dtstart', start)
    event.add('dtend', end if end else start + timedelta(hours=1))
    event.add('url', event_url)
    if location:
        event.add('location', location)
    if description:
        event.add('description', description)  # Keep more description

    cal.add_component(event)

    time.sleep(0.5)  # Be polite to the server

if len(cal.subcomponents) > 0:
    with open('public/ics/monash-che.ics', 'wb') as f:
        f.write(cal.to_ical())
        print(f"Exported {len(cal.subcomponents)} events to public/ics/monash-che.ics")
else:
    print("No events found, file not created")
