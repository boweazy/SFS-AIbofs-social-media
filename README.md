# SmartFlow AIbot-Social + SocialScale

AI-powered social media management platform with SocialScale-style landing, booking system, shop, and bot demos. Combines a comprehensive social media scheduler with modern landing page features and Flask-based admin functionality.

## Features

### 🚀 Core Social AI Platform
- **AI Content Generation**: OpenAI-powered post creation with custom topics and tones
- **Multi-platform Scheduling**: X (Twitter) and LinkedIn post scheduling
- **Smart Analytics**: Best-time analysis, engagement tracking, monthly reports
- **Template System**: Built-in and custom templates with variable substitution
- **Export Capabilities**: CSV and ICS calendar exports
- **Progressive Web App**: Offline functionality with service worker

### 🎨 SocialScale Landing Features
- **Trust Logos**: Partner integration badges (Stripe, Google, Buffer, Shopify, Twilio)
- **Contact Choices**: Email, WhatsApp, and contact form options
- **FAQ Section**: Expandable Q&A with smooth animations
- **Responsive Design**: Mobile-optimized dark theme with gold accents

### 📅 Booking System
- **Discovery Call Booking**: Form with date/time selection
- **ICS Calendar Export**: Automatic calendar file generation
- **Formspree Integration**: Email notifications with offline fallback
- **Local Storage Backup**: Offline form submissions saved to inbox

### 🛒 Shop Demo
- **Product Catalog**: Template packages and add-ons
- **Shopping Cart**: Local storage-based cart functionality
- **Stripe Integration**: Ready for payment processing
- **Responsive Grid**: Mobile-friendly product layout

### 🤖 Bot Demos
- **Smart Replies**: Context-aware comment generation
- **Best-time API**: Optimal posting time recommendations
- **Scheduler Export**: Bulk calendar event creation

### 🔧 Flask Admin System
- **Logo Branding**: Consistent branding across all templates
- **Landing Pages**: Professional pricing and feature pages
- **Database Integration**: SQLAlchemy with SQLite backend
- **Session Management**: Secure user authentication

## Quick Start

### Prerequisites
- Node.js 18+ (for SocialScale features)
- Python 3.11+ (for Flask admin)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   pip install flask gunicorn
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

3. **Run the Application**
   ```bash
   npm start
   # Or for development
   npm run dev
   ```

### Environment Variables

```env
# Contact Configuration
CONTACT_EMAIL=hello@smartflowsystems.co.uk
WHATSAPP_NUMBER=447000000000

# Formspree (Optional)
FORMSPREE_FORM_ID=yourFormID

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...

# OpenAI (Optional)
OPENAI_API_KEY=sk-...

# Flask
SESSION_SECRET=your-session-secret
DATABASE_URL=sqlite:///instance/smartflow.db
```

## Project Structure

```
├── static/                 # Social AI PWA files
│   ├── index.html         # Main application (enhanced)
│   ├── style.css          # Styling with SocialScale additions
│   ├── app.js             # Social AI functionality
│   └── logo.png           # Brand logo
├── templates/             # Flask templates
│   ├── base.html          # Base template with logo
│   ├── landing.html       # Landing page
│   └── pricing.html       # Pricing page
├── assets/                # SVG logos and icons
├── scripts/               # Utility scripts
│   ├── sanity-check.mjs   # Project validation
│   └── audit-routes.mjs   # Route verification
├── tests/e2e/             # Playwright tests
├── book.html              # Booking page
├── shop.html              # Shop page
├── bots.html              # Bots demo page
├── server.js              # Express server
├── app.py                 # Flask application
├── main.py                # Combined server launcher
└── sw.js                  # Service worker
```

## Usage Guide

### Social AI Features

1. **Generate Content**
   - Enter topic and select tone
   - Choose OpenAI or stub generator
   - Review and select drafts

2. **Schedule Posts**
   - Select platform and timing
   - Preview content
   - Monitor post status

3. **Analytics & Export**
   - View engagement metrics
   - Export data as CSV/ICS
   - Track monthly performance

### Booking System

1. **Book Discovery Call**
   - Fill contact form
   - Select preferred date/time
   - Download ICS file
   - Submit via Formspree

2. **Manage Bookings**
   - View in calendar app
   - Receive email confirmations
   - Access offline submissions in inbox

### Shop Features

1. **Browse Products**
   - Template packages
   - Add-on services
   - Team seats

2. **Shopping Cart**
   - Add items to cart
   - View total price
   - Proceed to checkout (Stripe)

## Development

### Testing

```bash
# Install Playwright
npm run playwright

# Run E2E tests
npm run test:e2e

# Sanity check
npm run sanity

# Route audit
npm run audit
```

### Customization

1. **Replace Formspree ID**
   - Update `FORMSPREE_FORM_ID` in `.env`
   - Modify form action in `book.html`

2. **Configure Stripe**
   - Add Stripe keys to `.env`
   - Update product price IDs
   - Implement real checkout flow

3. **Brand Customization**
   - Replace logo files in `static/` and `assets/`
   - Update color scheme in CSS variables
   - Modify contact information

4. **OpenAI Integration**
   - Add `OPENAI_API_KEY` to `.env`
   - Enable Pro features for content generation

## Deployment

### Replit Deployment
- Application is configured for Replit Deployments
- Automatic HTTPS and health checks included
- Environment variables managed via Replit Secrets

### Manual Deployment
```bash
# Build and deploy
npm run build  # If build step exists
node server.js

# Or with PM2
pm2 start server.js --name "smartflow"
```

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection
- **CSP**: Content Security Policy
- **Input Validation**: Form sanitization
- **Environment Variables**: Secret management

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - see LICENSE file for details

## Support

For technical support or custom development:
- Email: hello@smartflowsystems.co.uk
- WhatsApp: +44 7000 000 000

---

Built with ❤️ by SmartFlow Systems