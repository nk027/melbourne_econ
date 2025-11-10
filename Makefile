all: ics scrape

# Run the shell script
ics:
	@echo "Curling ICS calendars..."
	@./scripts/get-ics.sh

# Run the Python script
scrape:
	@echo "Running python scrapers..."
	@venv/bin/python scripts/get-scrape_monash-che.py
	@venv/bin/python scripts/get-scrape_unimelb-econ.py

# Declare phony targets (so they always run)
.PHONY: all ics scrape
