# Facebook Lead Manager

A comprehensive CRM system for managing Facebook leads with real-time synchronization, automated follow-ups, and advanced lead tracking capabilities.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/suhaib-kings-projects/v0-crm-lead-management-interface)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![ORM: Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)

## 🚀 Features

### Lead Management
- **Real-time Lead Sync**: Automatically syncs leads from Facebook forms
- **Lead Tracking**: Track lead status, assignments, and interactions
- **Kanban & List Views**: Multiple viewing options for lead management
- **Lead Details**: Comprehensive lead information with notes and follow-ups

### Facebook Integration
- **OAuth Authentication**: Secure Facebook app integration
- **Page Management**: Connect and manage multiple Facebook pages
- **Form Integration**: Automatic lead capture from Facebook forms
- **Webhook Support**: Real-time lead notifications

### Advanced Features
- **Follow-up Scheduling**: Automated follow-up reminders
- **Notes System**: Add and track lead interactions
- **Label Management**: Organize leads with custom labels
- **Real-time Updates**: Live updates across all connected clients
- **Mobile Responsive**: Works seamlessly on all devices

### Technical Features
- **Real-time Communication**: WebSocket and Pusher integration
- **Database Management**: PostgreSQL with Prisma ORM
- **Type Safety**: Full TypeScript support
- **Modern UI**: Built with Radix UI and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO, Pusher
- **Authentication**: Facebook OAuth
- **Deployment**: Vercel
- **Package Manager**: pnpm

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm
- [PostgreSQL](https://www.postgresql.org/) database
- [Facebook App](https://developers.facebook.com/) for OAuth integration

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd fb-lead-manager
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fb_lead_manager"

# Facebook App Configuration
FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"
FACEBOOK_REDIRECT_URI="http://localhost:3000/api/auth/callback/facebook"

# Pusher Configuration (for real-time features)
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
PUSHER_CLUSTER="your_pusher_cluster"

# Next.js
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma db push

# (Optional) Seed the database
pnpm prisma db seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Configuration

### Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook` (development)
   - `https://yourdomain.com/api/auth/callback/facebook` (production)
5. Copy App ID and App Secret to your `.env` file

### Database Configuration

The application uses PostgreSQL with Prisma ORM. Ensure your database is running and accessible.

### Pusher Setup (Real-time Features)

1. Create a [Pusher](https://pusher.com/) account
2. Create a new app
3. Copy the credentials to your `.env` file

## 📁 Project Structure

```
fb-lead-manager/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── facebook/      # Facebook integration
│   │   ├── leads/         # Lead management API
│   │   ├── realtime/      # Real-time updates
│   │   └── socket/        # WebSocket endpoints
│   ├── components/        # Page components
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI components
│   └── ...               # Custom components
├── lib/                  # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── facebook.ts       # Facebook API utilities
│   └── ...               # Other utilities
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── scripts/              # Build and deployment scripts
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all environment variables in Vercel dashboard
3. **Database**: Ensure your PostgreSQL database is accessible from Vercel
4. **Deploy**: Vercel will automatically deploy on push to main branch

### Environment Variables for Production

```env
# Database (use production PostgreSQL URL)
DATABASE_URL="postgresql://..."

# Facebook App (production settings)
FACEBOOK_APP_ID="your_production_app_id"
FACEBOOK_APP_SECRET="your_production_app_secret"
FACEBOOK_REDIRECT_URI="https://yourdomain.com/api/auth/callback/facebook"

# Pusher (production settings)
PUSHER_APP_ID="your_production_pusher_app_id"
PUSHER_KEY="your_production_pusher_key"
PUSHER_SECRET="your_production_pusher_secret"
PUSHER_CLUSTER="your_production_pusher_cluster"

# Next.js
NEXTAUTH_SECRET="your_production_nextauth_secret"
NEXTAUTH_URL="https://yourdomain.com"
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/callback/facebook` - Facebook OAuth callback
- `POST /api/auth/facebook/deauthorize` - Handle Facebook deauthorization

### Facebook Integration
- `POST /api/facebook/token` - Token management (exchange, refresh, check)
- `GET /api/leads/fb-pages` - Get connected Facebook pages
- `GET /api/leads/fb-leads` - Get leads from Facebook

### Lead Management
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `GET /api/leads/[id]` - Get specific lead
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead
- `POST /api/leads/[id]/notes` - Add note to lead
- `POST /api/leads/[id]/follow-ups` - Schedule follow-up

### Real-time Updates
- `POST /api/realtime/lead-update` - Update lead in real-time
- `POST /api/realtime/note-add` - Add note in real-time
- `POST /api/realtime/follow-up-schedule` - Schedule follow-up in real-time

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma db push   # Push schema to database
pnpm prisma studio    # Open Prisma Studio
```

### Database Schema

The application uses the following main models:

- **Lead**: Main lead information and tracking
- **Note**: Lead interaction notes
- **FollowUp**: Scheduled follow-up reminders
- **FacebookPage**: Connected Facebook pages
- **FacebookToken**: Facebook access tokens
- **FacebookForm**: Facebook form configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Suhaib3100/meta-lead-manager/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔗 Links

- [Live Demo](https://pronexus-leads.vercel.app/)
- [Facebook Developers](https://developers.facebook.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

Built with ❤️ using Next.js, Prisma, and modern web technologies.
