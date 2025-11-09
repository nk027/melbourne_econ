import cloudscraper
from bs4 import BeautifulSoup
from icalendar import Calendar, Event
from datetime import datetime, timedelta
import time
import re

# Fetch the main events page
url = "https://fbe.unimelb.edu.au/economics/events"
scraper = cloudscraper.create_scraper()
response = scraper.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

cal = Calendar()
cal.add('prodid', '-//UniMelb FBE Economics Events//EN')
cal.add('version', '2.0')

# Find all event list items
for li in soup.find_all('li', class_='event'):
    a_tag = li.find('a', class_='block-container')
    if not a_tag:
        continue

    event_url = a_tag['href']

    # Fetch the event detail page
    print(f"Fetching: {event_url}")
    event_response = scraper.get(event_url)
    event_soup = BeautifulSoup(event_response.text, 'html.parser')

    event = Event()

    # Extract title
    title_elem = event_soup.find('h1', itemprop='name')
    title = title_elem.get_text(strip=True) if title_elem else ''

    # Extract start date from itemprop
    start_time_elem = event_soup.find('time', itemprop='startDate')
    if start_time_elem:
        # Get the content attribute which has full datetime
        datetime_str = start_time_elem.get('content', '')
        if datetime_str:
            start = datetime.fromisoformat(datetime_str)
        else:
            # Fallback to datetime attribute
            date_str = start_time_elem.get('datetime', '')
            start = datetime.strptime(date_str, '%Y-%m-%d')

    # Extract end time from the second time element
    when_div = event_soup.find('div', class_='when')
    if when_div:
        time_elems = when_div.find_all('time')
        if len(time_elems) > 1:
            time_text = time_elems[1].get_text(strip=True)
            # Parse "11am - 12:15pm"
            if ' - ' in time_text:
                end_time_str = time_text.split(' - ')[1].strip()
                # Convert to 24-hour format and add to date
                end_time = datetime.strptime(end_time_str, '%I:%M%p').time()
                end = datetime.combine(start.date(), end_time)
            else:
                end = start + timedelta(hours=1)
        else:
            end = start + timedelta(hours=1)
    else:
        end = start + timedelta(hours=1)

    # Extract description
    description = ''
    desc_div = event_soup.find('div', itemprop='description')
    if desc_div:
        paragraphs = [p.get_text(strip=True) for p in desc_div.find_all('p')]
        description = '\n\n'.join(paragraphs)

    # Extract contact info
    contact_info = ''
    email_link = event_soup.find('a', href=re.compile(r'^mailto:'))
    if email_link:
        email = email_link.get_text(strip=True)
        # Try to get the name from the preceding paragraph
        prev_p = email_link.find_parent('p').find_previous_sibling('p')
        if prev_p:
            name = prev_p.get_text(strip=True)
            contact_info = f"Contact: {name} ({email})"
        else:
            contact_info = f"Contact: {email}"

    # Add to event
    event.add('summary', title)
    event.add('dtstart', start)
    event.add('dtend', end)
    event.add('url', event_url)

    if description:
        if contact_info:
            description = f"{description}\n\n{contact_info}"
        event.add('description', description)
    elif contact_info:
        event.add('description', contact_info)

    cal.add_component(event)

    time.sleep(0.5)  # Be polite to the server

if len(cal.subcomponents) > 0:
    with open('public/ics/unimelb-econ.ics', 'wb') as f:
        f.write(cal.to_ical())
        print(f"Exported {len(cal.subcomponents)} events to public/ics/unimelb-econ.ics")
else:
    print("No events found, file not created")
