import React from 'react';
import { Calendar, Mail, Github, Bell } from './Icons';
import { DEFAULT_SOURCES } from '../constants';

export default function AboutSection({ type = 'full' }) {
  if (type === 'about') {
    // Categorize sources
    const primeSources = DEFAULT_SOURCES.filter(s => s.sourceUrl);
    const experimentalSources = DEFAULT_SOURCES.filter(s => !s.sourceUrl);

    const renderList = (sources) => (
      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
        {sources.map(source => (
          <li key={source.name}>
            <i>{source.name}</i> — {source.fullName}{' '}
            {source.homeUrl && (
              <>
                (<a
                  href={source.homeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Source
                </a>,
              </>
            )}
            {source.url && (
              <>
                {' '}
                {' '}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Subscribe
                </a>)
              </>
            )}
          </li>
        ))}
      </ul>
    );

    return (
      <div className="space-y-6 max-w-4xl">
        {/* About */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed">
            This website aggregates economics-related seminars and events in and near Melbourne, Australia (all broadly defined) with the goal of facilitating discovery and exchange across institutions.
          </p>
        </div>

        {/* Data Sources */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Sources</h3>
          <div className="space-y-4 text-gray-700">
            <div>
              These sources follow their <b>respective public calendars</b>:
              {renderList(primeSources)}
            </div>

            <div>
              The following sources are included <b>experimentally</b>:
              {renderList(experimentalSources)}
            </div>

            <div>
              Please reach out if you know of events or series – ideally as a public ICS – to add!
            </div>
          </div>
        </div>

        {/* Contributing & Contact */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Contributing & Contact</h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <p className="leading-relaxed">
                We welcome your contributions!
                Whether you want to add new data sources, improve the interface, fix bugs, or suggest new features, your help is appreciated.
              </p>
            </div>

            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <Github className="w-5 h-5 mt-0.5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Contribute on GitHub</p>
                <p className="text-sm text-gray-600 mt-1">
                  Visit the repository to submit issues, pull requests, or browse the source code:
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
          </div>
        </div>
      </div>
    );
  }

  return null;
}
