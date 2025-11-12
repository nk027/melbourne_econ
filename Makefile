SHELL := /bin/bash
PYTHON ?= python3

all: ics scrape format

# Run the shell script
ics:
	@echo "Curling ICS calendars..."
	@./scripts/get-ics.sh

# Run the Python script
scrape:
	@echo "Running python scrapers..."
	@venv/bin/python scripts/get-scrape_monash-che.py
	@venv/bin/python scripts/get-scrape_unimelb-econ.py

format:
	@echo "Formatting raw ICS files"
	@mkdir -p public/ics raw/ics
	@venv/bin/python scripts/unify-ics.py --redact-signup-links -o public/ics/monash-ebs.ics raw/ics/monash-ebs.ics
	@venv/bin/python scripts/unify-ics.py --redact-signup-links -o public/ics/monash-econ.ics raw/ics/monash-econ.ics --grep-sm "workshop" --grep-sm "seminar" --grep-sm "conference"
	cp raw/ics/unimelb-ebe.ics public/ics/unimelb-ebe.ics
	cp raw/ics/custom-events.ics public/ics/custom-events.ics

# Declare phony targets (so they always run)
.PHONY: all ics scrape format
