import React from 'react';
import { Mail, Github, Bell } from './Icons';

export default function AboutSection({ type = 'full' }) {
  // About Tab Content
  if (type === 'about') {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* About */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">
            This website aggregates economics seminars and events from universities in Melbourne, Australia. 
            The goal is to provide a centralized, easy-to-use calendar for the economics research community 
            to discover and attend relevant events across institutions.
          </p>
        </div>

        {/* Data Sources */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Sources</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <p className="font-medium text-gray-800">Web Scraped Sources:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Monash CHE (Centre for Health Economics)</li>
                <li>University of Melbourne Economics</li>
              </ul>
              <p className="text-sm text-gray-600 mt-1">
                These sources are automatically scraped from their respective university websites.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-800">Google Calendar ICS Feeds:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Monash EBS (Economics & Business Statistics)</li>
                <li>Monash Economics</li>
                <li>University of Melbourne EBE (Economics, Business & Econometrics)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-1">
                These sources are directly imported from public Google Calendar feeds.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Update Frequency:</span> Calendar data is refreshed periodically. 
                Web scraped sources are updated during site builds, while ICS feeds reflect the latest information 
                from their respective Google Calendars.
              </p>
            </div>
          </div>
        </div>

        {/* Contributing & Contact */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Contributing & Contact</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <p className="leading-relaxed">
                This is an open-source project and we welcome contributions! Whether you want to add new data sources, 
                improve the interface, fix bugs, or suggest new features, your help is appreciated.
              </p>
            </div>

            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <Github className="w-5 h-5 mt-0.5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Contribute on GitHub</p>
                <p className="text-sm text-gray-600 mt-1">
                  Visit our repository to submit issues, pull requests, or browse the source code:
                </p>
                <a
                  href="https://github.com/nk027/melb_econ-sem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  github.com/nk027/melb_econ-sem
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <Mail className="w-5 h-5 mt-0.5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Contact</p>
                <p className="text-sm text-gray-600 mt-1">
                  For questions, suggestions, or feedback, please reach out to:
                </p>
                <a
                  href="mailto:nikolas.kuschnig@monash.edu"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  nikolas.kuschnig@monash.edu
                </a>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 italic">
              Note: Event data is provided "as is". Please verify event details with the source institutions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email Notifications Tab Content
  if (type === 'notifications') {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Email Notifications</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Stay informed about upcoming seminars and events by subscribing to email groups from Melbourne universities. 
            You'll receive notifications when new events are added to the calendar.
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Monash University Events</h3>
              <p className="text-sm text-gray-600 mb-3">
                Subscribe to receive notifications about seminars from Monash EBS, Economics, and CHE departments.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Email group sign-up link coming soon!');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Subscribe to Monash Events
              </a>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">University of Melbourne Events</h3>
              <p className="text-sm text-gray-600 mb-3">
                Subscribe to receive notifications about seminars from UniMelb Economics and EBE departments.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Email group sign-up link coming soon!');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Subscribe to UniMelb Events
              </a>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Note:</span> Email notification links are coming soon. 
              Please check back later or contact us for more information.
            </p>
          </div>
        </div>
      
      </div>
    );
  }

  // Full version (if needed for backward compatibility)
  return null;
}

