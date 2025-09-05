# FutbolApp

## Overview

FutbolApp is a Brazilian football (soccer) application built with Next.js that allows users to track football matches, competitions, and schedules. The app focuses on providing match information including teams, times, and broadcast channels. It features a clean, responsive design with Portuguese language support and displays today's games prominently on the homepage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with React 19, utilizing the App Router for modern routing and server components
- **Language**: TypeScript for type safety and better developer experience
- **Styling**: Tailwind CSS for utility-first styling with custom global styles for typography and scrollbars
- **Icons**: Heroicons React library for consistent iconography throughout the application
- **Layout Structure**: Fixed header navigation with responsive design, main content area with max-width container, and footer

### Component Architecture
- **Layout Components**: 
  - Header with fixed navigation and logo
  - Footer with copyright and links
  - RootLayout wrapper providing consistent structure
- **UI Components**:
  - JogoCard component for displaying match information with team names, time, and broadcast channel
  - Responsive grid layout for match cards

### Routing Structure
- **Pages**:
  - Home (`/`) - Today's games display
  - Semana (`/semana`) - Weekly games view with date-organized schedule
  - Competições (`/competicoes`) - Competitions listing with categorized tournaments
  - Canais (`/canais`) - Streaming services and TV channels directory for affiliate marketing
  - Sobre (`/sobre`) - About page (placeholder)

### Development Setup
- **Build Tools**: Next.js build system with TypeScript compilation
- **Code Quality**: ESLint configuration with Next.js rules, strict TypeScript settings
- **Development Server**: Configured to run on hostname 0.0.0.0 port 5000 for container compatibility

### Data Management
- Currently uses static data arrays for match information
- No database integration implemented yet
- Component props-based data flow for match cards

### Styling Strategy
- Tailwind CSS with custom configuration covering pages, components, and app directories
- PostCSS setup for CSS processing
- Custom global styles for base typography and scrollbar styling
- Responsive design with mobile-first approach

## External Dependencies

### Core Framework Dependencies
- **Next.js 15.5.2**: React framework for production applications
- **React 19.1.1**: JavaScript library for building user interfaces
- **TypeScript 5.9.2**: Static type checking for JavaScript

### Styling Dependencies
- **Tailwind CSS 4.1.13**: Utility-first CSS framework
- **PostCSS 8.5.6**: CSS transformation tool
- **Autoprefixer 10.4.21**: CSS vendor prefixing

### UI Dependencies
- **Heroicons React 2.2.0**: SVG icon library optimized for React

### Development Dependencies
- **ESLint 9.34.0**: JavaScript linting utility
- **ESLint Config Next 15.5.2**: ESLint configuration for Next.js projects

### Type Definitions
- **@types/react** and **@types/react-dom**: TypeScript definitions for React
- **@types/node**: TypeScript definitions for Node.js
- **undici-types**: HTTP client type definitions

### Hosting Considerations
- Application configured for deployment with Next.js build system
- Static export capability available through Next.js
- Development server configured for container-based development environments