import React, { useState } from 'react';
import {
  GitBranch, Link2, AtSign, Globe, Mail,
  Code2, Layers, Cpu, Sparkles, Heart,
  ExternalLink, Star, GitFork, Coffee,
  MapPin, BookOpen, WifiOff, Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

// ──────────────────────────────────────────────
// 🛠  EDIT YOUR DETAILS HERE
// ──────────────────────────────────────────────
const DEV = {
  name:     'Salah Uddin Kader',
  handle:   '@salahuddingfx',
  title:    'Full-Stack Developer & Health-Tech Enthusiast',
  bio:      `I'm a passionate developer who loves building tools that help people live healthier, more productive lives. Health & Habit OS started as a personal project to track my own habits — and grew into something I'm proud to share with the world.`,
  avatar:   'https://github.com/salahuddingfx.png',
  location: 'Bangladesh 🇧🇩',
  available: true,

  socials: [
    {
      label: 'GitHub',
      href:  'https://github.com/salahuddingfx',
      icon:  GitBranch,
      color: 'hover:text-white hover:border-white/40'
    },
    {
      label: 'LinkedIn',
      href:  'https://linkedin.com/in/salahuddingfx',
      icon:  Link2,
      color: 'hover:text-blue-400 hover:border-blue-400/40'
    },
    {
      label: 'Twitter / X',
      href:  'https://twitter.com/salahuddingfx',
      icon:  AtSign,
      color: 'hover:text-sky-400 hover:border-sky-400/40'
    },
    {
      label: 'Portfolio',
      href:  'https://salahuddin.codes',
      icon:  Globe,
      color: 'hover:text-accent-purple hover:border-accent-purple/40'
    },
    {
      label: 'Email',
      href:  'mailto:hello@salahuddin.codes',
      icon:  Mail,
      color: 'hover:text-success-emerald hover:border-success-emerald/40'
    }
  ],

  stack: [
    { category: 'Frontend',  items: ['React', 'Vite', 'Framer Motion', 'Recharts', 'Zustand'] },
    { category: 'Backend',   items: ['Node.js', 'Express', 'Socket.IO', 'JWT'] },
    { category: 'Database',  items: ['MongoDB', 'Dexie (IndexedDB)', 'Mongoose'] },
    { category: 'AI & PWA',  items: ['Google Gemini AI', 'Vite PWA', 'Web Audio API', 'Service Worker'] },
    { category: 'Dev Tools', items: ['VS Code', 'GitHub', 'Postman', 'Capacitor'] }
  ],

  projects: [
    {
      name:  'Health & Habit OS',
      desc:  'The app you\'re using right now! Offline-first PWA for tracking health habits, goals, and streaks.',
      tech:  ['React', 'Express', 'MongoDB'],
      stars: 24,
      forks: 6,
      link:  '#'
    },
    {
      name:  'Fitness API',
      desc:  'REST API that provides workout plans, calorie data, and AI-generated nutrition suggestions.',
      tech:  ['Node.js', 'Gemini AI', 'MongoDB'],
      stars: 11,
      forks: 2,
      link:  'https://github.com/salahuddingfx'
    }
  ]
};
// ──────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay }
});

export default function DeveloperProfile() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    const email = DEV.socials.find(s => s.label === 'Email')?.href.replace('mailto:', '');
    if (email) {
      navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">

      {/* ── Hero Card ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative bg-surface-dark border border-border-slate/70 rounded-2xl overflow-hidden"
      >
        {/* gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/10 via-transparent to-success-emerald/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-purple to-transparent" />

        <div className="relative p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-2xl overflow-hidden ring-2 ring-accent-purple/50 shadow-2xl shadow-accent-purple/30">
              <img
                src={DEV.avatar}
                alt={DEV.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('fallback-avatar');
                }}
              />
            </div>
            {DEV.available && (
              <div className="absolute -bottom-1 -right-1 flex items-center space-x-1 bg-success-emerald text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse inline-block" />
                <span>Available</span>
              </div>
            )}
          </div>


          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="text-3xl font-extrabold text-text-white font-outfit">{DEV.name}</h1>
              <div className="text-xs text-accent-purple font-mono mt-0.5">{DEV.handle}</div>
            </div>
            <p className="text-sm text-text-muted/80 font-semibold">{DEV.title}</p>
            <div className="flex items-center space-x-1 text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5" />
              <span>{DEV.location}</span>
            </div>
          </div>

          {/* Built with love badge */}
          <div className="flex items-center space-x-1.5 bg-error-red/10 border border-error-red/30 text-error-red text-[10px] font-bold px-3 py-1.5 rounded-full self-start sm:self-center">
            <Heart className="h-3 w-3 fill-current" />
            <span>Made with love</span>
          </div>
        </div>

        {/* Bio */}
        <div className="relative px-7 pb-7">
          <p className="text-sm text-text-muted leading-relaxed">{DEV.bio}</p>
        </div>

        {/* Social links */}
        <div className="relative px-7 pb-7 flex flex-wrap gap-2">
          {DEV.socials.map(social => {
            const Icon = social.icon;
            const isEmail = social.label === 'Email';
            return (
              <button
                key={social.label}
                onClick={isEmail ? copyEmail : undefined}
                {...(!isEmail ? { as: 'a' } : {})}
                {...(!isEmail ? { href: social.href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`flex items-center space-x-1.5 px-3 py-2 bg-background-dark/60 border border-border-slate/50 text-text-muted text-xs font-semibold rounded-xl transition-all ${social.color}`}
                onClick={isEmail ? copyEmail : undefined}
              >
                {isEmail ? (
                  <>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{copied ? 'Copied!' : social.label}</span>
                  </>
                ) : (
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{social.label}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                  </a>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Tech Stack ── */}
      <motion.div
        {...fadeUp(0.08)}
        className="bg-surface-dark border border-border-slate/70 rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-sm font-bold text-text-white font-outfit flex items-center space-x-2">
          <Code2 className="h-4 w-4 text-accent-purple" />
          <span>Tech Stack</span>
        </h2>

        <div className="space-y-4">
          {DEV.stack.map(group => (
            <div key={group.category}>
              <div className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-2">{group.category}</div>
              <div className="flex flex-wrap gap-2">
                {group.items.map(item => (
                  <span
                    key={item}
                    className="px-2.5 py-1 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-[10px] font-bold rounded-lg"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Projects ── */}
      <motion.div
        {...fadeUp(0.16)}
        className="space-y-4"
      >
        <h2 className="text-sm font-bold text-text-white font-outfit flex items-center space-x-2">
          <Layers className="h-4 w-4 text-accent-purple" />
          <span>Projects</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEV.projects.map((project, i) => (
            <motion.div
              key={project.name}
              {...fadeUp(0.2 + i * 0.08)}
              className="bg-surface-dark border border-border-slate/70 rounded-2xl p-5 space-y-3 hover:border-accent-purple/40 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent-purple/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-text-white group-hover:text-accent-purple transition-colors">
                  {project.name}
                </h3>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted/40 hover:text-accent-purple transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="text-xs text-text-muted leading-relaxed">{project.desc}</p>

              <div className="flex flex-wrap gap-1.5">
                {project.tech.map(t => (
                  <span key={t} className="px-2 py-0.5 bg-border-slate/40 text-text-muted text-[9px] font-bold rounded-md">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4 text-[10px] text-text-muted pt-1 border-t border-border-slate/30">
                <span className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400" />
                  <span>{project.stars}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <GitFork className="h-3 w-3 text-text-muted" />
                  <span>{project.forks}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── About this app ── */}
      <motion.div
        {...fadeUp(0.28)}
        className="bg-gradient-to-br from-accent-purple/10 to-transparent border border-accent-purple/20 rounded-2xl p-6 space-y-3 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent-purple/5 to-transparent pointer-events-none" />

        <h2 className="text-sm font-bold text-text-white font-outfit flex items-center space-x-2 relative">
          <Sparkles className="h-4 w-4 text-accent-purple" />
          <span>About Health & Habit OS</span>
        </h2>

        <p className="text-xs text-text-muted leading-relaxed relative">
          Health & Habit OS is an open-source, offline-first Progressive Web App (PWA) designed to help people
          build better daily, weekly, and monthly habits. It uses AI coaching powered by Google Gemini,
          real-time notifications via Socket.IO, and stores your data locally on your device first — so it
          works even without an internet connection.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 relative">
          {[
            { label: 'Open Source',  Icon: BookOpen    },
            { label: 'Offline First',Icon: WifiOff     },
            { label: 'AI Powered',   Icon: Sparkles    },
            { label: 'PWA Ready',    Icon: Smartphone  }
          ].map(f => (
            <div key={f.label} className="bg-background-dark/60 border border-border-slate/40 rounded-xl p-3 text-center space-y-1.5">
              <f.Icon className="h-5 w-5 text-accent-purple mx-auto" />
              <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{f.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Buy me a coffee ── */}
      <motion.div
        {...fadeUp(0.36)}
        className="text-center py-4 space-y-2"
      >
        <p className="text-xs text-text-muted">If you like this app, feel free to reach out or give a star on GitHub!</p>
        <div className="flex items-center justify-center space-x-1 text-xs text-text-muted/50">
          <Coffee className="h-3.5 w-3.5" />
          <span>Built with caffeine, late nights, and a lot of passion.</span>
        </div>
      </motion.div>

    </div>
  );
}
